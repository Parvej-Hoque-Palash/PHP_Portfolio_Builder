import { googleConfig } from '../config/googleConfig';

/**
 * Maps public usernames to the Drive file ID of their portfolio_config.json.
 *
 * Visitors aren't signed in and Drive can't be searched by owner, so the site
 * needs this lookup. It lives in public/portfolios.json — a static file you can
 * edit and redeploy without rebuilding:  { "palash212": "1AbC…" }
 */
export type PortfolioRegistry = Record<string, string>;

let registryPromise: Promise<PortfolioRegistry> | null = null;

export function loadRegistry(): Promise<PortfolioRegistry> {
  registryPromise ??= fetch('/portfolios.json', { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : {}))
    .then((json: unknown) => {
      if (typeof json !== 'object' || json === null || Array.isArray(json)) return {};
      const entries = Object.entries(json).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== '');
      return Object.fromEntries(entries.map(([k, v]) => [k.toLowerCase(), v]));
    })
    // Missing file: SPA fallback serves index.html, which fails to parse — treat as empty.
    .catch(() => ({}));
  return registryPromise;
}

/** Netlify Function (netlify/functions/registry.ts) holding self-registered usernames; vite.config.ts serves it in dev. */
export const REGISTRY_API = '/.netlify/functions/registry';

const lookups = new Map<string, Promise<string | null>>();

/** Ask the registry function for a username's file ID (null when unknown or unreachable). */
function lookupRegistered(username: string): Promise<string | null> {
  let pending = lookups.get(username);
  if (!pending) {
    pending = fetch(`${REGISTRY_API}?username=${encodeURIComponent(username)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body: unknown = await res.json();
        const fileId = (body as { fileId?: unknown } | null)?.fileId;
        return typeof fileId === 'string' && fileId ? fileId : null;
      })
      // No function deployed (e.g. a static host) or not JSON: treat as unregistered.
      .catch(() => null);
    lookups.set(username, pending);
  }
  return pending;
}

/**
 * Config file ID for a username, or null if it isn't registered. Checked in order:
 * public/portfolios.json (hand-maintained), the registry function (where users
 * register themselves on save), then VITE_PORTFOLIO_CONFIG_FILE_ID for the default portfolio.
 */
export async function resolveConfigFileId(username: string): Promise<string | null> {
  const registry = await loadRegistry();
  if (registry[username]) return registry[username];
  const registered = await lookupRegistered(username);
  if (registered) return registered;
  if (username === googleConfig.defaultUsername && googleConfig.publicConfigFileId) return googleConfig.publicConfigFileId;
  return null;
}

export type RegisterResult = { ok: true; changed: boolean } | { ok: false; error: string };

/**
 * Point the signed-in user's personal URL (/php-…) at their portfolio file. The
 * registry function derives the username from the access token, so users can
 * only claim their own. Safe to call after every save.
 */
export async function registerPortfolio(accessToken: string, username: string, fileId: string): Promise<RegisterResult> {
  if (!username || !fileId) return { ok: false, error: 'Nothing to register yet.' };
  if ((await resolveConfigFileId(username)) === fileId) return { ok: true, changed: false };
  try {
    const res = await fetch(REGISTRY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      // username is only read by the dev-server stand-in; the deployed function uses the token's account.
      body: JSON.stringify({ fileId, username }),
    });
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      return {
        ok: false,
        error: body?.error ?? (res.status === 404 ? 'The registry function is not deployed on this site.' : `Registry error (${res.status}).`),
      };
    }
  } catch {
    return { ok: false, error: 'Could not reach the registry. Check your connection and save again.' };
  }
  lookups.delete(username);
  registryPromise = null;
  return { ok: true, changed: true };
}
