import { SITE_CONFIG } from './siteConfig';
import { USERNAME_PREFIX, hasUsernamePrefix, usernameFromEmail } from '../utils/username';

export interface GoogleConfig {
  clientId: string;
  /** OAuth scopes requested at login. */
  scopes: string[];
  /** Name of the root folder created in the user's Drive. */
  rootFolderName: string;
  /** Name of the JSON config file stored inside the root folder. */
  configFileName: string;
  /** Browser API key used by public visitors to read the (publicly shared) config file. */
  apiKey: string;
  /** Drive file ID of the default portfolio's config (fallback when it isn't in public/portfolios.json). */
  publicConfigFileId: string;
  /** Owner of the default portfolio shown at "/". */
  ownerEmail: string;
  /** Username of the portfolio shown at "/" (defaults to the owner's email prefix). */
  defaultUsername: string;
}

// Environment variables win; otherwise the committed public settings in siteConfig.ts.
const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || SITE_CONFIG.googleClientId).trim();
const ownerEmail = (import.meta.env.VITE_OWNER_EMAIL || SITE_CONFIG.ownerEmail).trim().toLowerCase();

/** "mdparvejhoque9" or "php-mdparvejhoque9" -> "php-mdparvejhoque9" */
function normalizeUsername(value: string): string {
  const v = value.trim().toLowerCase().replace(/\./g, '-');
  if (!v) return '';
  return hasUsernamePrefix(v) ? v : USERNAME_PREFIX + v;
}

if (!clientId && import.meta.env.DEV) {
  console.warn(
    '[googleConfig] No Google client ID. Set googleClientId in src/config/siteConfig.ts (or VITE_GOOGLE_CLIENT_ID in .env.local) to enable Google login.',
  );
}

export const googleConfig: GoogleConfig = {
  clientId,
  scopes: [
    'openid',
    'email',
    'profile',
    // Access limited to files this app creates/opens — no access to the rest of the user's Drive.
    'https://www.googleapis.com/auth/drive.file',
  ],
  rootFolderName: 'My Portfolio Data',
  configFileName: 'portfolio_config.json',
  apiKey: (import.meta.env.VITE_GOOGLE_API_KEY || SITE_CONFIG.googleApiKey).trim(),
  publicConfigFileId: import.meta.env.VITE_PORTFOLIO_CONFIG_FILE_ID ?? '',
  ownerEmail,
  defaultUsername:
    normalizeUsername(import.meta.env.VITE_DEFAULT_USERNAME || SITE_CONFIG.defaultUsername) || usernameFromEmail(ownerEmail),
};

export const isGoogleConfigured = (): boolean => Boolean(googleConfig.clientId);

/**
 * Is `username` the portfolio served at "/" (which falls back to the built-in content)?
 * With no owner configured, only "/" itself (empty username) is the default.
 */
export const isDefaultUsername = (username: string): boolean => username === googleConfig.defaultUsername;
