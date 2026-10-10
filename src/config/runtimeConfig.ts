import { usernameFromEmail } from '../utils/username';
import { googleConfig } from './googleConfig';

/** Netlify Function holding the settings entered at /setup (netlify/functions/site-config.ts). */
export const SITE_CONFIG_API = '/.netlify/functions/site-config';

export interface SiteSettings {
  ownerEmail: string;
  googleClientId: string;
  googleApiKey: string;
  updatedAt: string;
}

export interface SiteSetup {
  /** Used across the whole site. */
  verified: SiteSettings | null;
  /** Submitted at /setup, waiting for the owner to sign in with its Client ID. */
  pending: SiteSettings | null;
}

const isSettings = (v: unknown): v is SiteSettings =>
  typeof v === 'object' && v !== null && typeof (v as SiteSettings).googleClientId === 'string' && typeof (v as SiteSettings).ownerEmail === 'string';

/** The stored setup, or null where the function isn't available (local `vite`, non-Netlify hosts). */
export async function fetchSiteSetup(timeoutMs = 4000): Promise<SiteSetup | null> {
  try {
    const res = await fetch(SITE_CONFIG_API, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    const body = (await res.json()) as Partial<SiteSetup>;
    return { verified: isSettings(body.verified) ? body.verified : null, pending: isSettings(body.pending) ? body.pending : null };
  } catch {
    return null;
  }
}

/** True when the URL asks /setup to keep using the live settings instead of pending ones. */
export const prefersCurrentSettings = (): boolean => new URLSearchParams(window.location.search).has('current');

let loadedSetup: SiteSetup | null = null;

/** The setup as loaded at startup (null when the function is unavailable). */
export const startupSetup = (): SiteSetup | null => loadedSetup;

function apply(settings: SiteSettings) {
  googleConfig.clientId = settings.googleClientId;
  googleConfig.apiKey = settings.googleApiKey;
  googleConfig.ownerEmail = settings.ownerEmail;
  googleConfig.defaultUsername = usernameFromEmail(settings.ownerEmail) || googleConfig.defaultUsername;
}

/**
 * Called once before the app renders. Verified /setup settings override the
 * built-in ones (siteConfig.ts / VITE_* variables). On /setup itself, pending
 * settings are used instead, so the owner can sign in with the new Client ID to
 * confirm them.
 */
export async function loadRuntimeConfig(): Promise<void> {
  loadedSetup = await fetchSiteSetup();
  if (!loadedSetup) return;
  const onSetupPage = window.location.pathname.replace(/\/+$/, '') === '/setup';
  const active = onSetupPage && loadedSetup.pending && !prefersCurrentSettings() ? loadedSetup.pending : loadedSetup.verified;
  if (active) apply(active);
}
