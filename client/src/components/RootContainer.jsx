import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import ClientList from '@/components/ClientList.jsx';
import Consumer from '@/components/Consumer.jsx';
import Initiate from '@/components/Initiate.jsx';
import Producer from '@/components/Producer.jsx';
import AuthRequired from '@/middlewares/AuthRequired.jsx';
import { createSocket } from '@/middlewares/socket.js';

class RootContainer extends React.Component {
  constructor(props) {
    super(props);
    if (props.isAuthenticated) {
      createSocket(props.accessToken);
    }
  }

  render() {
    return (
      <Switch>
        <Route path="/initiate">
          <Initiate />
        </Route>
        <AuthRequired exact path="/">
          <ClientList />
        </AuthRequired>
        <AuthRequired path="/stream/:streamId/producer">
          <Producer />
        </AuthRequired>
        <AuthRequired path="/stream/:streamId/consumer">
          <Consumer />
        </AuthRequired>
      </Switch>
    );
  }
}

const mapStateToProps = state => {
  const { auth } = state;
  return {
    isAuthenticated: auth.isAuthenticated,
    accessToken: auth.accessToken
  };
};

export default connect(
  mapStateToProps
)(RootContainer);
