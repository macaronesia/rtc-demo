import arrow
from base64 import b64encode
from cerberus import Validator
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, hmac
from functools import wraps
from flask import Flask, abort, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, current_user, jwt_required, \
    verify_jwt_in_request_optional
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
import json
from uuid import uuid4
from werkzeug.middleware.proxy_fix import ProxyFix


app = Flask(__name__, static_folder=None)
app.config.from_object('config')
app.wsgi_app = ProxyFix(app.wsgi_app)
cors = CORS(app, origins=['*'])
socketio = SocketIO(app, cors_allowed_origins='*')
db = SQLAlchemy(app)
jwt = JWTManager(app)


class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    identity = db.Column(db.String(32), nullable=False)
    sid = db.Column(db.String(80))
    created_at = db.Column(db.Integer, nullable=False)


class Stream(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    producer_id = db.Column(db.Integer, nullable=False)
    consumer_id = db.Column(db.Integer, nullable=False)
    offer = db.Column(db.Text)


@jwt.user_identity_loader
def user_identity_lookup(client):
    return client.identity


@jwt.user_loader_callback_loader
def user_loader_callback(identity):
    client = Client.query.filter(Client.identity == identity).first()
    return client


def authenticated_only(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        verify_jwt_in_request_optional()
        if current_user is None:
            disconnect()
            return
        return f(*args, **kwargs)
    return wrapped


def get_ice_servers(client_id):
    due_time_ts = (arrow.utcnow() + app.config['TURN_SERVICE_TTL_TIMEDELTA']).timestamp
    user_combo = (str(due_time_ts) + ':' + str(client_id)).encode('utf-8')
    digest = hmac.HMAC(
        app.config['TURN_SERVICE_SHARE_SECRET_KEY'].encode('ascii'), hashes.SHA1(), backend=default_backend())
    digest.update(user_combo)
    data_hash = digest.finalize()
    password = b64encode(data_hash)
    return [
        {
            'urls': [
                'stun:' + app.config['TURN_SERVICE_DOMAIN'] + ':3478',
            ],
        },
        {
            'urls': [
                'turn:' + app.config['TURN_SERVICE_DOMAIN'] + ':3478',
            ],
            'username': user_combo.decode('utf-8'),
            'credential': password.decode('ascii'),
        },
    ]


@app.before_first_request
def init():
    db.create_all()


@app.route('/clients/', methods=['POST'])
def create_client():
    client = Client()
    db.session.add(client)
    client.identity = uuid4().hex
    client.created_at = arrow.utcnow().timestamp
    db.session.commit()

    return jsonify(**{
        'access_token': create_access_token(identity=client),
        'client': {
            'id': client.id,
        },
    })


@app.route('/clients/', methods=['GET'])
@jwt_required
def get_all_clients():
    clients = Client.query.filter(Client.sid.isnot(None)).all()

    return jsonify(**{
        'clients': [{
            'id': client.id,
            'created_at': client.created_at,
        } for client in clients],
    })


@app.route('/streams/', methods=['POST'])
@jwt_required
def create_stream():
    data = request.get_json()
    validator = Validator({
        'client_id': {
            'required': True,
            'type': 'integer',
        },
    })
    if not validator.validate(data):
        abort(400)

    consumer = Client.query \
        .filter(Client.id == validator.document['client_id']) \
        .first()
    if not consumer:
        abort(404)

    stream = Stream()
    db.session.add(stream)
    stream.producer_id = current_user.id
    stream.consumer_id = consumer.id
    db.session.commit()

    return jsonify(**{
        'stream': {
            'id': stream.id,
        },
    })


@app.route('/ice-servers/', methods=['POST'])
@jwt_required
def get_fresh_ice_server_params():
    return jsonify(**{
        'ice_servers': get_ice_servers(current_user.id),
    })


@socketio.on('connect')
@authenticated_only
def connect():
    current_user.sid = request.sid
    db.session.commit()
    emit('clients', broadcast=True)


@socketio.on('disconnect')
@authenticated_only
def disconnect():
    current_user.sid = None
    db.session.commit()
    emit('clients', broadcast=True)


@socketio.on('offer')
@authenticated_only
def on_get_offer(data):
    validator = Validator({
        'stream_id': {
            'required': True,
            'type': 'integer',
        },
        'sdp': {
            'required': True,
            'type': 'dict',
        },
    })
    if not validator.validate(data):
        return

    result = db.session.query(Stream, Client) \
        .join(Client, Client.id == Stream.consumer_id) \
        .filter(Stream.id == validator.document['stream_id']) \
        .filter(Stream.producer_id == current_user.id) \
        .filter(Client.sid.isnot(None)) \
        .first()
    if not result:
        return
    stream, consumer = result

    stream.offer = json.dumps(validator.document['sdp'])
    db.session.commit()

    emit('invite', {'stream_id': stream.id}, room=consumer.sid)


@socketio.on('ready')
@authenticated_only
def on_consumer_ready(data):
    validator = Validator({
        'stream_id': {
            'required': True,
            'type': 'integer',
        },
    })
    if not validator.validate(data):
        return

    stream = Stream.query \
        .filter(Stream.id == validator.document['stream_id']) \
        .filter(Stream.consumer_id == current_user.id) \
        .first()
    if not (stream and stream.offer):
        return

    emit(
        'offer',
        {
            'stream_id': stream.id,
            'sdp': json.loads(stream.offer),
        },
        room=current_user.sid)


@socketio.on('answer')
@authenticated_only
def on_get_answer(data):
    validator = Validator({
        'stream_id': {
            'required': True,
            'type': 'integer',
        },
        'sdp': {
            'required': True,
            'type': 'dict',
        },
    })
    if not validator.validate(data):
        return

    result = db.session.query(Stream, Client) \
        .join(Client, Client.id == Stream.producer_id) \
        .filter(Stream.id == validator.document['stream_id']) \
        .filter(Stream.consumer_id == current_user.id) \
        .filter(Client.sid.isnot(None)) \
        .first()
    if not result:
        return
    stream, producer = result

    emit(
        'answer',
        {
            'stream_id': stream.id,
            'sdp': validator.document['sdp'],
        },
        room=producer.sid)


@socketio.on('producer_ice_candidate')
@authenticated_only
def on_get_producer_ice_candidate(data):
    validator = Validator({
        'stream_id': {
            'required': True,
            'type': 'integer',
        },
        'candidate': {
            'required': True,
            'type': 'dict',
        },
    })
    if not validator.validate(data):
        return

    result = db.session.query(Stream, Client) \
        .join(Client, Client.id == Stream.consumer_id) \
        .filter(Stream.id == validator.document['stream_id']) \
        .filter(Stream.producer_id == current_user.id) \
        .filter(Client.sid.isnot(None)) \
        .first()
    if not result:
        return
    stream, consumer = result

    emit(
        'ice_candidate',
        {
            'stream_id': stream.id,
            'candidate': validator.document['candidate'],
        },
        room=consumer.sid)


@socketio.on('consumer_ice_candidate')
@authenticated_only
def on_get_consumer_ice_candidate(data):
    validator = Validator({
        'stream_id': {
            'required': True,
            'type': 'integer',
        },
        'candidate': {
            'required': True,
            'type': 'dict',
        },
    })
    if not validator.validate(data):
        return

    result = db.session.query(Stream, Client) \
        .join(Client, Client.id == Stream.producer_id) \
        .filter(Stream.id == validator.document['stream_id']) \
        .filter(Stream.consumer_id == current_user.id) \
        .filter(Client.sid.isnot(None)) \
        .first()
    if not result:
        return
    stream, producer = result

    emit(
        'ice_candidate',
        {
            'stream_id': stream.id,
            'candidate': validator.document['candidate'],
        },
        room=producer.sid)


if __name__ == '__main__':
    socketio.run(app)
