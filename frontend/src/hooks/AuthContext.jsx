import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

function toUser(account) {
  return { name: account.username, username: account.username, role: account.role, employee: account.employee };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* Local cleanup still applies. */ }
    finally { clearToken(); setUser(null); }
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const tokenData = await api('/api/auth/refresh', { method: 'POST' });
        setToken(tokenData.access_token);
        setUser(toUser(await api('/api/auth/me')));
      } catch { clearToken(); setUser(null); }
      finally { setIsLoading(false); }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => { clearToken(); setUser(null); };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const form = new URLSearchParams({ username: username.trim(), password });
      const token = await api('/api/auth/login', { method: 'POST', body: form });
      setToken(token.access_token);
      setUser(toUser(await api('/api/auth/me')));
      return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
  }, []);

  const value = useMemo(() => ({ user, isLoading, isAuthenticated: Boolean(user), login, logout }), [user, isLoading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider.');
  return auth;
}
