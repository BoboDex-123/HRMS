// src/components/Employee/RequireAuth.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isEmployeeAuthenticated } from '../../employeeAuth';

export const RequireAuth = ({ children }) => {
  if (!isEmployeeAuthenticated()) return <Navigate to="/employee-login" />;
  return children;
};
