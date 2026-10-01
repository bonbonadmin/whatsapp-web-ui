import React, { useEffect } from "react";
import AppRoutes from "routes";
import AuthSessionMonitor from "common/auth/AuthSessionMonitor";
import { clearLegacyAuthStorage } from "common/auth/session";

export default function App() {
  useEffect(() => {
    clearLegacyAuthStorage();
  }, []);
  return (
    <>
      <AuthSessionMonitor />
      <AppRoutes />
    </>
  );
}
