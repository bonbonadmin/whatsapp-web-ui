import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getSessionExpiry, isAuthenticated } from "./session";

const SESSION_POLL_INTERVAL_MS = 60 * 1000;

export default function AuthSessionMonitor() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectToLogin = () => {
      if (!location.pathname.startsWith("/login")) {
        clearAuthSession();
        navigate("/login", {
          replace: true,
          state: { from: location.pathname + location.search },
        });
      }
    };

    const checkSession = () => {
      const expiresAt = getSessionExpiry();

      if (!expiresAt) {
        return;
      }

      if (!isAuthenticated()) {
        redirectToLogin();
      }
    };

    const expiresAt = getSessionExpiry();
    const timeoutMs = expiresAt ? Math.max(expiresAt - Date.now(), 0) : null;
    const timeoutId =
      timeoutMs !== null
        ? window.setTimeout(() => {
            redirectToLogin();
          }, timeoutMs)
        : null;

    const intervalId = window.setInterval(checkSession, SESSION_POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", checkSession);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [location.pathname, location.search, navigate]);

  return null;
}
