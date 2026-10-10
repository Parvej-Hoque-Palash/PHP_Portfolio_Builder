import { googleConfig } from '../config/googleConfig';
import { startupSetup } from '../config/runtimeConfig';

/** Netlify Function holding each user's own Google credentials (netlify/functions/user-credentials.ts). */
export const USER_CREDENTIALS_API = '/.netlify/functions/user-credentials';

export interface UserCredentials {
  email: string;
  googleClientId: string;
  googleApiKey: string;
  updatedAt: string;
}

export interface UserCredentialsState {
  username: string;
  /** In use for this user's sign-in and public portfolio. */
  verified: UserCredentials | null;
  /** Submitted at /account, waiting for the user to sign in through it. */
  pending: UserCredentials | null;
}

/**
 * Whether this deployment runs the Netlify Functions (per-user credentials need them).
 * Known from the site-config request made at startup.
 */
export const userCredentialsAvailable = (): boolean => startupSetup() !== null;

const cache = new Map<string, Promise<UserCredentialsState | null>>();

/** A user's credentials; null when the function is unreachable. */
export function fetchUserCredentials(username: string, { fresh = false } = {}): Promise<UserCredentialsState | null> {
  if (!username) return Promise.resolve(null);
  let pending = fresh ? undefined : cache.get(username);
  if (!pending) {
    pending = fetch(`${USER_CREDENTIALS_API}?username=${encodeURIComponent(username)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
      .then(async (res) => {
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
        const body = (await res.json()) as Partial<UserCredentialsState>;
        return { username, verified: body.verified ?? null, pending: body.pending ?? null };
      })
      .catch(() => null);
    cache.set(username, pending);
  }
  return pending;
}

/** The API key visitors should use for `username`'s portfolio: theirs if they brought one, else the site's. */
export async function resolveApiKey(username: string): Promise<string> {
  if (username && userCredentialsAvailable()) {
    const own = (await fetchUserCredentials(username))?.verified?.googleApiKey;
    if (own) return own;
  }
  return googleConfig.apiKey;
}

async function post(body: object, accessToken?: string | null): Promise<UserCredentialsState> {
  const res = await fetch(USER_CREDENTIALS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (UserCredentialsState & { error?: string }) | null;
  if (!res.ok || !data) throw new Error(data?.error ?? `Request failed (${res.status}).`);
  cache.set(data.username, Promise.resolve({ username: data.username, verified: data.verified, pending: data.pending }));
  return data;
}

export const submitUserCredentials = (
  creds: Pick<UserCredentials, 'email' | 'googleClientId' | 'googleApiKey'>,
  accessToken?: string | null,
) => post({ action: 'submit', ...creds }, accessToken);

export const verifyUserCredentials = (accessToken: string) => post({ action: 'verify' }, accessToken);

export const removeUserCredentials = (accessToken: string) => post({ action: 'remove' }, accessToken);
