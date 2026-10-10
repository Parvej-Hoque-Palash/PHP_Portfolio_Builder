import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { GoogleOAuthProvider, googleLogout, useGoogleLogin, type TokenResponse } from '@react-oauth/google';
import { googleConfig, isGoogleConfigured } from '../config/googleConfig';
import { clearDriveCache } from '../services/driveService';
import type { AuthSession, GoogleUser } from '../types/google';
import { isGmail } from '../utils/username';
import { AuthContext, type AuthContextValue } from './auth';

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

interface LoginHandlers {
  onToken: (token: Pick<TokenResponse, 'access_token' | 'expires_in'>) => void;
  onError: (message: string) => void;
}

function useGoogleTokenLogin({ onToken, onError }: LoginHandlers): () => void {
  return useGoogleLogin({
    scope: googleConfig.scopes.join(' '),
    onSuccess: onToken,
    onError: (err) => onError(err.error_description ?? 'Google login failed'),
    onNonOAuthError: (err) => {
      if (err.type !== 'popup_closed') onError(`Google login failed: ${err.type}`);
    },
  });
}

function useDisabledLogin({ onError }: LoginHandlers): () => void {
  return useCallback(() => onError('Google sign-in isn\'t set up on this site yet. The site owner can set it up at /setup.'), [onError]);
}

// Google's library throws on init without a client ID, which would blank the whole
// site. The choice is fixed at load time, so hook order stays stable.
const useLogin = isGoogleConfigured() ? useGoogleTokenLogin : useDisabledLogin;

function AuthStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSession = useCallback((next: AuthSession | null) => {
    persistSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    if (session?.accessToken) revokeToken(session.accessToken);
    if (isGoogleConfigured()) googleLogout();
    clearDriveCache();
    updateSession(null);
  }, [session?.accessToken, updateSession]);

  const login = useLogin({
    onToken: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await fetchUserInfo(tokenResponse.access_token);
        if (!isGmail(user.email)) {
          revokeToken(tokenResponse.access_token);
          setError(`Only Gmail accounts can sign in (${user.email} isn't a @gmail.com address).`);
          return;
        }
        updateSession({
          accessToken: tokenResponse.access_token,
          expiresAt: Date.now() + tokenResponse.expires_in * 1000,
          user,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: setError,
  });

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
      isAuthenticated: Boolean(session),
      isLoading,
      error,
      login: () => login(),
      logout,
    }),
    [session, isLoading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Wraps the app with Google's OAuth script loader and the auth session state. */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (!isGoogleConfigured()) return <AuthStateProvider>{children}</AuthStateProvider>;
  return (
    <GoogleOAuthProvider clientId={googleConfig.clientId}>
      <AuthStateProvider>{children}</AuthStateProvider>
    </GoogleOAuthProvider>
  );
}
