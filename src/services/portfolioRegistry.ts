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

/** Config file ID for a username, or null if it isn't registered. */
export async function resolveConfigFileId(username: string): Promise<string | null> {
  const registry = await loadRegistry();
  if (registry[username]) return registry[username];
  if (username === googleConfig.defaultUsername && googleConfig.publicConfigFileId) return googleConfig.publicConfigFileId;
  return null;
}

/** Endpoint served by the dev server (vite.config.ts) that writes public/portfolios.json. */
export const REGISTRY_ENDPOINT = '/__portfolio-registry';

/**
 * List `username` -> `fileId` in public/portfolios.json if it isn't already.
 * Only the local dev server can write the file; a static deployment can't, so
 * there this is a no-op and the dashboard shows the line to add by hand.
 * Resolves true when the file was changed.
 */
export async function registerPortfolio(username: string, fileId: string): Promise<boolean> {
  if (!import.meta.env.DEV || !username || !fileId) return false;
  if ((await resolveConfigFileId(username)) === fileId) return false;
  try {
    const res = await fetch(REGISTRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, fileId }),
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.warn('[portfolioRegistry] Could not update public/portfolios.json:', err);
    return false;
  }
  registryPromise = null; // re-read the updated file
  return true;
}
