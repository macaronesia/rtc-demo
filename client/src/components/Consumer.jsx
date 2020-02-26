import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import React from 'react';
import { withRouter } from 'react-router';

import request from '@/middlewares/request.js';
import { socket } from '@/middlewares/socket.js';

class Consumer extends React.Component {
  constructor(props) {
    super(props);
    this.streamId = parseInt(this.props.match.params.streamId);
    this.peerConnection = null;
    this.videoEle = React.createRef();
  }

  goBack = () => {
    this.props.history.push('/');
  };

  gotIceCandidate = event => {
    if (event.candidate != null) {
      socket.emit('consumer_ice_candidate', {
        'stream_id': this.streamId,
        'candidate': event.candidate
      });
    }
  };

  receivedIceCandidateFromServer = data => {
    if (data['stream_id'] !== this.streamId) {
      return;
    }
    this.peerConnection.addIceCandidate(new RTCIceCandidate(data['candidate']));
  };

  gotDescription = sdp => {
    this.peerConnection.setLocalDescription(
      sdp,
      () => {
        socket.emit('answer', {
          'stream_id': this.streamId,
          'sdp': sdp
        });
        console.log('set local description');
      },
      () => {
        console.log('set local description error');
      });
  };

  receivedDescriptionFromServer = data => {
    if (data['stream_id'] !== this.streamId) {
      return;
    }
    this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data['sdp']),
      () => {
        console.log('set remote description');
      },
      () => {
        console.log('set remote description error');
      });
    this.peerConnection.createAnswer(
      this.gotDescription,
      error => {
        console.log(error);
      });
  };

  initPeerConnection = (iceServers) => {
    this.peerConnection = new RTCPeerConnection(iceServers);
    this.peerConnection.onaddstream = ev => {
      this.videoEle.current.srcObject = ev.stream;
    };
    this.peerConnection.onicecandidate = this.gotIceCandidate;
    socket.on('ice_candidate', this.receivedIceCandidateFromServer);
    socket.on('offer', this.receivedDescriptionFromServer);
    socket.emit('ready', {
      'stream_id': this.streamId
    });
  };

  fetchIceServers = () => {
    request({
      method: 'post',
      url: '/ice-servers/'
    })
      .then(response => {
        this.initPeerConnection(response.data['ice_servers']);
      })
  };

  componentDidMount() {
    this.fetchIceServers();
  }

  componentWillUnmount() {
    if (this.peerConnection) {
      this.peerConnection.close();
      socket.off('offer', this.receivedDescriptionFromServer);
      socket.off('ice_candidate', this.receivedIceCandidateFromServer);
    }
  }

  render() {
    return (
      <div>
        <AppBar>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={this.goBack}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6">Stream { this.streamId }</Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <p>hello</p>
        <video autoplay ref={this.videoEle} style={{width: '40%'}}></video>
      </div>
    );
  }
}

export default withRouter(Consumer);
