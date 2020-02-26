import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

function AuthRequired({children, isAuthenticated, ...rest}) {
  return (
    <Route
      {...rest}
      render={() =>
        isAuthenticated ? (
          children
        ) : (
          <Redirect to="/initiate" />
        )
      }
    />
  );
}

const mapStateToProps = state => {
  const { auth } = state;
  return {
    isAuthenticated: auth.isAuthenticated
  };
};

export default connect(
  mapStateToProps
)(AuthRequired);
