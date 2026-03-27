import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, isAuthenticated } from "common/auth/session";

const ProtectedRoute = ({ Component }: { Component: React.ComponentType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      clearAuthSession();
      navigate("/login", {
        replace: true,
        state: { from: location.pathname + location.search },
      });
    }
  }, [location.pathname, location.search, navigate]);

  return isAuthenticated() ? <Component /> : null;
};

export default ProtectedRoute;
