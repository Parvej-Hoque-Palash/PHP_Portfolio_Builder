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

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const ownerEmail = (import.meta.env.VITE_OWNER_EMAIL ?? '').trim().toLowerCase();

/** "palash212" or "php-palash212" -> "php-palash212" */
function normalizeUsername(value: string): string {
  const v = value.trim().toLowerCase().replace(/\./g, '-');
  if (!v) return '';
  return hasUsernamePrefix(v) ? v : USERNAME_PREFIX + v;
}

if (!clientId && import.meta.env.DEV) {
  console.warn(
    '[googleConfig] VITE_GOOGLE_CLIENT_ID is not set. Add it to .env.local to enable Google login.',
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
  apiKey: (import.meta.env.VITE_GOOGLE_API_KEY ?? '').trim(),
  publicConfigFileId: import.meta.env.VITE_PORTFOLIO_CONFIG_FILE_ID ?? '',
  ownerEmail,
  defaultUsername: normalizeUsername(import.meta.env.VITE_DEFAULT_USERNAME ?? '') || usernameFromEmail(ownerEmail),
};

export const isGoogleConfigured = (): boolean => Boolean(googleConfig.clientId);

/**
 * Is `username` the portfolio served at "/" (which falls back to the built-in content)?
 * With no owner configured, only "/" itself (empty username) is the default.
 */
export const isDefaultUsername = (username: string): boolean => username === googleConfig.defaultUsername;
