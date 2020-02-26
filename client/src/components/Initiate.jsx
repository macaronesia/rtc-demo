import CircularProgress from '@material-ui/core/CircularProgress';
import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import {
  getAuthData
} from '@/actions/auth.js';

class Initiate extends React.Component {
  componentDidMount() {
    this.props.getAuthData();
  }

  render() {
    return (
      <div>
        {this.props.isAuthenticated ? (
          <Redirect to='/' />
        ) : (
          <CircularProgress />
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { auth } = state;
  return {
    isAuthenticated: auth.isAuthenticated
  };
};

export default connect(
  mapStateToProps,
  { getAuthData }
)(Initiate);
