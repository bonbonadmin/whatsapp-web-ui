const SESSION_STORAGE_KEY = "auth.session";
const LEGACY_TOKEN_KEY = "token";
const LEGACY_EMAIL_KEY = "userEmail";
const DEFAULT_SESSION_TIMEOUT_MINUTES = 8 * 60;

type AuthSession = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

const getSessionTimeoutMinutes = () => {
  const rawValue = process.env.REACT_APP_SESSION_TIMEOUT_MINUTES;
  const timeout = Number(rawValue);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }

  return timeout;
};

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
};

const isSessionShape = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as AuthSession;

  return (
    typeof candidate.email === "string" &&
    typeof candidate.issuedAt === "number" &&
    typeof candidate.expiresAt === "number"
  );
};

export const clearAuthSession = () => {
  const storage = getStorage();

  storage?.removeItem(SESSION_STORAGE_KEY);
  clearLegacyAuthStorage();
};

export const clearLegacyAuthStorage = () => {
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_EMAIL_KEY);
};

export const getAuthSession = (): AuthSession | null => {
  const storage = getStorage();
  const storedSession = storage?.getItem(SESSION_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession);

    if (!isSessionShape(parsed)) {
      clearAuthSession();
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      clearAuthSession();
      return null;
    }

    return parsed;
  } catch {
    clearAuthSession();
    return null;
  }
};

export const isAuthenticated = () => getAuthSession() !== null;

export const createAuthSession = (email: string) => {
  const storage = getStorage();
  const now = Date.now();
  const session: AuthSession = {
    email,
    issuedAt: now,
    expiresAt: now + getSessionTimeoutMinutes() * 60 * 1000,
  };

  storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  clearLegacyAuthStorage();

  return session;
};

export const getAuthenticatedEmail = () => getAuthSession()?.email ?? null;

export const getSessionExpiry = () => getAuthSession()?.expiresAt ?? null;
