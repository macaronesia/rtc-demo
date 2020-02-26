import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import React from 'react';
import { withRouter } from 'react-router';

import request from '@/middlewares/request.js';
import { socket } from '@/middlewares/socket.js';

class Producer extends React.Component {
  constructor(props) {
    super(props);
    this.streamId = parseInt(this.props.match.params.streamId);
    this.peerConnection = null;
    this.videoStream = null;
  }

  goBack = () => {
    this.props.history.push('/');
  };

  gotIceCandidate = event => {
    if (event.candidate != null) {
      socket.emit('producer_ice_candidate', {
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
        socket.emit('offer', {
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
  };

  initPeerConnection = (iceServers) => {
    this.peerConnection = new RTCPeerConnection(iceServers);
    this.peerConnection.addStream(this.videoStream);
    this.peerConnection.onicecandidate = this.gotIceCandidate;
    socket.on('ice_candidate', this.receivedIceCandidateFromServer);
    socket.on('answer', this.receivedDescriptionFromServer);
    this.peerConnection.createOffer(
      this.gotDescription,
      error => {
        console.log(error);
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
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    })
      .then(stream => {
        this.videoStream = stream;
        this.fetchIceServers();
      })
      .catch(err => {

      });
  }

  componentWillUnmount() {
    if (this.videoStream) {
      const track = this.videoStream.getTracks()[0];
      track.stop();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      socket.off('answer', this.receivedDescriptionFromServer);
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
        <p>Camera</p>
      </div>
    );
  }
}

export default withRouter(Producer);
