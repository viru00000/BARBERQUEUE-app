import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user doesn't have it, redirect to appropriate page
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'salonOwner') {
      return <Navigate to="/register-salon" replace />;
    } else if (user.role === 'customer') {
      return <Navigate to="/customer" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
