import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem('user'));

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (user && user.role === 'admin') || (storedUser && storedUser.role === 'admin') 
    ? children 
    : <Navigate to="/dashboard" replace />;
};

export default AdminRoute; 