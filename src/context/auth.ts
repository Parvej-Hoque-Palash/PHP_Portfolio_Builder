import { createContext } from 'react';
import type { GoogleUser } from '../types/google';

export interface AuthContextValue {
  user: GoogleUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True while the login popup / profile fetch is in flight. */
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
