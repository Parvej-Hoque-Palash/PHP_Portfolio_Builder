import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { googleConfig } from '../config/googleConfig';
import { clearDriveCache } from '../services/driveService';
import type { AuthSession, GoogleUser } from '../types/google';
import { isGmail } from '../utils/username';
import { AuthContext, type AuthContextValue, type SignInIssue } from './auth';

const STORAGE_KEY = 'portfolio_google_session';
/** Treat the token as expired slightly early to avoid mid-request expiry. */
const EXPIRY_SKEW_MS = 60_000;

function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return session.expiresAt - EXPIRY_SKEW_MS > Date.now() && isGmail(session.user.email) ? session : null;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null): void {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode etc.) — session stays in memory only */
  }
}

/** Best-effort token revocation; network failures are ignored. */
function revokeToken(accessToken: string): void {
  fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).catch(() => undefined);
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch Google profile (${res.status})`);
  const data = await res.json();
  return { id: data.sub, email: data.email, name: data.name, picture: data.picture };
}

// --- Google Identity Services (loaded directly so each sign-in can use any Client ID) ---

const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface GsiTokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
}

interface GsiTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GsiOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    hint?: string;
    callback: (response: GsiTokenResponse) => void;
    error_callback?: (error: { type: string }) => void;
  }) => GsiTokenClient;
}

const gsi = (): GsiOAuth2 | undefined =>
  (window as unknown as { google?: { accounts?: { oauth2?: GsiOAuth2 } } }).google?.accounts?.oauth2;

let gsiLoading: Promise<void> | null = null;

/** Load Google's sign-in script once. The popup must open straight from a click, so load it early. */
function loadGsi(): Promise<void> {
  if (gsi()) return Promise.resolve();
  gsiLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiLoading = null;
      reject(new Error('Could not load Google sign-in.'));
    };
    document.head.appendChild(script);
  });
  return gsiLoading;
}

const LAST_LOGIN_KEY = 'portfolio_last_login';

function loadLastLogin(): LoginOptions | null {
  try {
    const raw = localStorage.getItem(LAST_LOGIN_KEY);
    return raw ? (JSON.parse(raw) as LoginOptions) : null;
  } catch {
    return null;
  }
}

function saveLastLogin(value: LoginOptions): void {
  try {
    localStorage.setItem(LAST_LOGIN_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable: only a convenience */
  }
}

export interface LoginOptions {
  /** OAuth Client ID to sign in through; defaults to the site's. */
  clientId?: string;
  /** Pre-selects this account in Google's chooser; with a user's own Client ID it must match. */
  email?: string;
}

function AuthStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<SignInIssue | null>(null);
  const [lastLogin, setLastLogin] = useState<LoginOptions | null>(loadLastLogin);
  const reportIssue = useCallback((next: SignInIssue, message: string | null) => {
    setIssue(next);
    setError(message);
  }, []);

  useEffect(() => {
    loadGsi().catch(() => undefined); // retried on click
  }, []);

  const updateSession = useCallback((next: AuthSession | null) => {
    persistSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    if (session?.accessToken) revokeToken(session.accessToken);
    clearDriveCache();
    updateSession(null);
  }, [session?.accessToken, updateSession]);

  const completeLogin = useCallback(
    async (response: GsiTokenResponse, clientId: string, expectedEmail: string | undefined) => {
      if (response.error || !response.access_token) {
        // access_denied here means the user pressed Cancel on Google's consent screen.
        if (!response.error || response.error === 'access_denied') reportIssue('interrupted', null);
        else reportIssue('failed', response.error_description ?? `Google sign-in failed (${response.error}).`);
        return;
      }
      const accessToken = response.access_token;
      setIsLoading(true);
      setError(null);
      try {
        const user = await fetchUserInfo(accessToken);
        if (!isGmail(user.email)) {
          revokeToken(accessToken);
          reportIssue('failed', `Only Gmail accounts can sign in (${user.email} isn't a @gmail.com address).`);
          return;
        }
        // Someone's own Client ID only signs in that person.
        if (expectedEmail && clientId !== googleConfig.clientId && user.email.toLowerCase() !== expectedEmail.toLowerCase()) {
          revokeToken(accessToken);
          reportIssue('failed', `You chose ${user.email} in Google, but entered ${expectedEmail}. Sign in with ${expectedEmail}.`);
          return;
        }
        setIssue(null);
        const remembered = { clientId: clientId === googleConfig.clientId ? undefined : clientId, email: user.email.toLowerCase() };
        saveLastLogin(remembered);
        setLastLogin(remembered);
        updateSession({ accessToken, expiresAt: Date.now() + Number(response.expires_in ?? 3600) * 1000, user, clientId });
      } catch (err) {
        reportIssue('failed', err instanceof Error ? err.message : 'Sign-in failed.');
      } finally {
        setIsLoading(false);
      }
    },
    [reportIssue, updateSession],
  );

  const login = useCallback(
    (options: LoginOptions = {}) => {
      setIssue(null);
      setError(null);
      const clientId = options.clientId || googleConfig.clientId;
      if (!clientId) return reportIssue('not-configured', null);
      const oauth2 = gsi();
      if (!oauth2) {
        loadGsi().catch(() => undefined);
        return reportIssue('failed', 'Google sign-in is still loading. Please click again in a moment.');
      }
      try {
        oauth2
          .initTokenClient({
            client_id: clientId,
            scope: googleConfig.scopes.join(' '),
            hint: options.email,
            callback: (response) => void completeLogin(response, clientId, options.email),
            error_callback: (err) => {
              if (err.type === 'popup_closed') reportIssue('interrupted', null);
              else if (err.type === 'popup_failed_to_open') reportIssue('popup-blocked', null);
              else reportIssue('failed', `Google sign-in failed (${err.type}).`);
            },
          })
          .requestAccessToken();
      } catch (err) {
        reportIssue('failed', err instanceof Error ? err.message : 'Google sign-in failed.');
      }
    },
    [completeLogin, reportIssue],
  );

  // Implicit-flow tokens can't be refreshed silently; end the session when the token expires.
  useEffect(() => {
    if (!session) return;
    const remaining = session.expiresAt - EXPIRY_SKEW_MS - Date.now();
    const timer = window.setTimeout(() => updateSession(null), Math.max(remaining, 0));
    return () => window.clearTimeout(timer);
  }, [session, updateSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      clientId: session?.clientId ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      error,
      issue,
      lastLogin,
      login,
      logout,
    }),
    [session, isLoading, error, issue, lastLogin, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Provides the Google sign-in session to the app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthStateProvider>{children}</AuthStateProvider>;
}
