import { isGmail } from '../../src/utils/username';
import {
  bearerToken,
  inspectToken,
  json,
  pinnedOwnerEmail,
  readSetup,
  writeSetup,
  type SiteSettings,
} from '../lib/siteSettings';

/**
 * Site settings entered through the /setup form (owner Gmail, Google Client ID,
 * API key), stored in Netlify Blobs so a deployment can be configured without
 * editing code or Netlify environment variables.
 *
 *   GET  -> { verified, pending }   (all values are public: they ship to browsers anyway)
 *   POST { action: 'submit', ownerEmail, googleClientId, googleApiKey }
 *        Saves the settings as pending. Before setup is verified anyone may submit
 *        (unless the build pins an owner email); afterwards only the owner, signed in.
 *   POST { action: 'verify' } with Authorization: Bearer <access token>
 *        The token must come from the pending Client ID and belong to the pending
 *        owner, which proves both work. Pending then becomes verified (site-wide).
 */

const CLIENT_ID_RE = /^[\w.-]+\.apps\.googleusercontent\.com$/;
const API_KEY_RE = /^[\w-]{20,100}$/;

async function submit(req: Request, body: Record<string, unknown>): Promise<Response> {
  const ownerEmail = String(body.ownerEmail ?? '').trim().toLowerCase();
  const googleClientId = String(body.googleClientId ?? '').trim();
  const googleApiKey = String(body.googleApiKey ?? '').trim();
  if (!isGmail(ownerEmail)) return json(400, { error: 'Enter a Gmail address (…@gmail.com).' });
  if (!CLIENT_ID_RE.test(googleClientId)) return json(400, { error: 'The Client ID should end with .apps.googleusercontent.com.' });
  if (!API_KEY_RE.test(googleApiKey)) return json(400, { error: 'That does not look like a Google API key.' });

  const setup = await readSetup();
  if (setup.verified) {
    // Changing a live configuration: only the owner, signed in with the current or pending Client ID.
    const token = bearerToken(req);
    const caller = token ? await inspectToken(token) : null;
    const allowedClients = [setup.verified.googleClientId, setup.pending?.googleClientId];
    if (!caller || caller.email !== setup.verified.ownerEmail || !allowedClients.includes(caller.clientId)) {
      return json(403, { error: `Only the site owner (${setup.verified.ownerEmail}) can change these settings. Sign in first.` });
    }
    if (ownerEmail !== setup.verified.ownerEmail) return json(400, { error: 'The owner email cannot be changed.' });
  } else {
    const pinned = pinnedOwnerEmail();
    if (pinned && ownerEmail !== pinned) return json(403, { error: 'This site can only be set up by its configured owner.' });
  }

  const pending: SiteSettings = { ownerEmail, googleClientId, googleApiKey, updatedAt: new Date().toISOString() };
  await writeSetup({ ...setup, pending });
  return json(200, { ...setup, pending });
}

async function verify(req: Request): Promise<Response> {
  const setup = await readSetup();
  if (!setup.pending) return json(409, { error: 'There are no settings waiting for confirmation.' });
  const token = bearerToken(req);
  const caller = token ? await inspectToken(token) : null;
  if (!caller) return json(401, { error: 'Your Google sign-in has expired. Sign in again.' });
  if (caller.clientId !== setup.pending.googleClientId) {
    return json(403, { error: 'You are signed in through a different Client ID. Sign out, then sign in again on this page.' });
  }
  if (caller.email !== setup.pending.ownerEmail) {
    return json(403, { error: `Signed in as ${caller.email}, but the owner is ${setup.pending.ownerEmail}.` });
  }
  const next = { verified: setup.pending, pending: null };
  await writeSetup(next);
  return json(200, next);
}

export default async (req: Request): Promise<Response> => {
  try {
    if (req.method === 'GET') return json(200, await readSetup());
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json(400, { error: 'Invalid request body' });
    }
    if (body.action === 'submit') return await submit(req, body);
    if (body.action === 'verify') return await verify(req);
    return json(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('[site-config]', err);
    return json(500, { error: 'Site settings are unavailable right now.' });
  }
};
