import { getStore } from '@netlify/blobs';
import { SITE_CONFIG } from '../../src/config/siteConfig';

/** Google settings entered through the /setup form. */
export interface SiteSettings {
  ownerEmail: string;
  googleClientId: string;
  googleApiKey: string;
  updatedAt: string;
}

/**
 * `verified` is what the whole site uses. `pending` is a submission waiting for
 * its owner to sign in with that Client ID; it is only used on /setup.
 */
export interface SiteSetupRecord {
  verified: SiteSettings | null;
  pending: SiteSettings | null;
}

const KEY = 'settings';
const store = () => getStore({ name: 'site-config', consistency: 'strong' });

export async function readSetup(): Promise<SiteSetupRecord> {
  const record = (await store().get(KEY, { type: 'json' })) as Partial<SiteSetupRecord> | null;
  return { verified: record?.verified ?? null, pending: record?.pending ?? null };
}

export async function writeSetup(record: SiteSetupRecord): Promise<void> {
  await store().setJSON(KEY, record);
}

/** Gmail address that alone may complete first-time setup, if the build pins one. */
export const pinnedOwnerEmail = (): string =>
  (process.env.OWNER_EMAIL || process.env.VITE_OWNER_EMAIL || SITE_CONFIG.ownerEmail || '').trim().toLowerCase();

/** OAuth Client IDs whose tokens this site accepts. */
export async function acceptedClientIds(): Promise<string[]> {
  const { verified } = await readSetup().catch(() => ({ verified: null }));
  return [verified?.googleClientId, process.env.VITE_GOOGLE_CLIENT_ID, SITE_CONFIG.googleClientId].filter(
    (id): id is string => Boolean(id),
  );
}

export interface VerifiedToken {
  email: string;
  /** The OAuth Client ID the token was issued to. */
  clientId: string;
}

/** Ask Google who an access token belongs to. Null when it is invalid, expired or unverified. */
export async function inspectToken(token: string): Promise<VerifiedToken | null> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return null;
  const info = (await res.json()) as { aud?: string; azp?: string; email?: string; email_verified?: string };
  if (info.email_verified !== 'true' || !info.email) return null;
  return { email: info.email.toLowerCase(), clientId: info.azp || info.aud || '' };
}

export const bearerToken = (req: Request): string | null =>
  req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1] ?? null;

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
