import { createContext } from 'react';
import type { GoogleUser } from '../types/google';

/**
 * Why the last sign-in attempt didn't complete:
 *  - interrupted: the Google window closed without signing in. That's also what happens
 *    after Google shows "Error 403: access_denied" (app still in Testing mode).
 *  - popup-blocked: the browser blocked Google's window.
 *  - not-configured: this site has no Google Client ID yet.
 *  - failed: anything else (see `error`).
 */
export type SignInIssue = 'interrupted' | 'popup-blocked' | 'not-configured' | 'failed';

export interface AuthContextValue {
  user: GoogleUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True while the login popup / profile fetch is in flight. */
  isLoading: boolean;
  error: string | null;
  /** Set when the last sign-in attempt didn't complete; cleared on the next attempt. */
  issue: SignInIssue | null;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
