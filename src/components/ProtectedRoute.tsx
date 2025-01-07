import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const isAuthenticated = () => !!localStorage.getItem('token');
const getUserEmail = () => localStorage.getItem('userEmail');

const ProtectedRoute = ({ Component }: { Component: React.ComponentType }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = isAuthenticated();
    const userEmail = getUserEmail();

    if (!token || !userEmail) {
      console.warn('Unauthorized access. Missing token or email.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return isAuthenticated() && getUserEmail() ? <Component /> : null;
};

export default ProtectedRoute;
