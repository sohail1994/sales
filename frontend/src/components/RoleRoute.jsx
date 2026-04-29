import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RoleRoute — wraps a page and redirects to / if the user's role is not allowed.
 * Usage: <RoleRoute roles={['admin','manager']}><MyPage /></RoleRoute>
 */
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
