// In src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user } = useAuth();
  // The Outlet component will render the child route's element if the user is authenticated.
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;