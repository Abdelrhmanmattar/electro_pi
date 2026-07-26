/**
 * Auth context definition (separated from the provider so the provider file
 * only exports a component — keeps React Fast Refresh happy).
 */
import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean; // true while restoring the session on first load
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
