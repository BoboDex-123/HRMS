// src/components/Employee/RequireAuth.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@aws-amplify/auth';

export const RequireAuth = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        console.log('👤 Current User:', user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('⛔ Not authenticated:', err);
        setIsAuthenticated(false);
      }
    };

    checkUser();
  }, []);

  if (isAuthenticated === null) return null; 
  if (!isAuthenticated) return <Navigate to="/employee-login" />;
  return children;
};
