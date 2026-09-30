import { useEffect, useMemo, useState } from 'react';
import * as authApi from './auth-api.js';
import { AuthContext } from './AuthContext.js';
let restorePromise;

function restoreSession() {
  if (!restorePromise) {
    restorePromise = (async () => {
      const { accessToken } = await authApi.refresh();
      const { user } = await authApi.getCurrentUser(accessToken);
      return { accessToken, user };
    })().finally(() => {
      restorePromise = null;
    });
  }
  return restorePromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((session) => {
        if (!active) return;
        setUser(session.user);
        setAccessToken(session.accessToken);
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setAccessToken(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function establishSession(action) {
    const session = await action();
    setUser(session.user);
    setAccessToken(session.accessToken);
    return session.user;
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(user && accessToken),
      register: (details) => establishSession(() => authApi.register(details)),
      login: (credentials) => establishSession(() => authApi.login(credentials)),
      async logout() {
        try {
          await authApi.logout();
        } finally {
          setUser(null);
          setAccessToken(null);
        }
      },
    }),
    [user, accessToken, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

