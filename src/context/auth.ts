import { createContext } from 'react';
import type { GoogleUser } from '../types/google';
import type { LoginOptions } from './AuthContext';

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
  /** OAuth Client ID the current session was signed in through. */
  clientId: string | null;
  isAuthenticated: boolean;
  /** True while the login popup / profile fetch is in flight. */
  isLoading: boolean;
  error: string | null;
  /** Set when the last sign-in attempt didn't complete; cleared on the next attempt. */
  issue: SignInIssue | null;
  /** The account and Client ID used for the last successful sign-in in this browser. */
  lastLogin: LoginOptions | null;
  /** Opens Google's sign-in window; call straight from a click. */
  login: (options?: LoginOptions) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
