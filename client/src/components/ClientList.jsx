import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Toolbar from '@material-ui/core/Toolbar';
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';
import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import {
  fetchClientList
} from '@/actions/client.js';
import request from '@/middlewares/request.js';
import { socket } from '@/middlewares/socket.js';

class ClientList extends React.Component {
  shareVideoStream(clientId) {
    request({
      method: 'post',
      url: '/streams/',
      data: {
        'client_id': clientId
      }
    })
      .then(response => {
        this.props.history.push(`/stream/${response.data['stream']['id']}/producer`);
      });
  };

  acceptInvitation = (data) => {
    this.props.history.push(`/stream/${data['stream_id']}/consumer`);
  };

  componentDidMount() {
    socket.on('invite', this.acceptInvitation);
  }

  componentWillUnmount() {
    socket.off('invite', this.acceptInvitation);
  }

  render() {
    return (
      <div>
        <AppBar>
          <Toolbar>This is client { this.props.currentClient['id'] }</Toolbar>
        </AppBar>
        <Toolbar />
        {this.props.clients.length > 1 ? (
          <List>
            {this.props.clients.filter(client => client['id'] !== this.props.currentClient['id']).map(client =>
              <ListItem key={client['id']} style={{cursor: 'pointer'}} onClick={(e) => this.shareVideoStream(client['id'])}>
                <ListItemAvatar>
                  <Avatar>
                    <DesktopWindowsIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={ `Client ${client['id']}` } secondary={ moment.unix(client['created_at']).format('MMM Do YYYY, HH:mm') } />
              </ListItem>
            )}
          </List>
        ) : (
          <p>No remote client(s)</p>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { auth, client } = state;
  return {
    clients: client.clients,
    currentClient: auth.client
  };
};

export default withRouter(
  connect(
    mapStateToProps,
    { fetchClientList }
  )(ClientList)
);
