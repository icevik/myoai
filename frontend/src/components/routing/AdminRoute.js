import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem('user'));

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Route
      {...rest}
      render={props =>
        (user && user.role === 'admin') || (storedUser && storedUser.role === 'admin') ? (
          <Component {...props} />
        ) : (
          <Redirect to="/dashboard" />
        )
      }
    />
  );
};

export default AdminRoute; 