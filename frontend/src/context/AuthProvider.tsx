/**
 * AuthProvider — owns auth state and exposes it via AuthContext.
 *
 * On mount it tries to restore the session: if a token exists, it calls /me to
 * fetch the user. Listens for the 'auth:unauthorized' event emitted by the api
 * interceptor on a 401, so an expired token logs the user out everywhere.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from './authContext';
import { authService } from '../lib/authService';
import { tokenStorage } from '../lib/api';
import type { User } from '../types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on first load.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // React to forced logouts from the interceptor (401).
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authService.login(email, password);
    tokenStorage.set(token);
    setUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user } = await authService.register(name, email, password);
    tokenStorage.set(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value: AuthContextValue = { user, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
