import { isGmail, usernameFromEmail } from '../../src/utils/username';
import { acceptedClientIds, bearerToken, inspectToken, json } from '../lib/siteSettings';
import { readUserCredentials, writeUserCredentials, type UserCredentials } from '../lib/userCredentials';

/**
 * Per-user Google credentials: each Gmail user may bring their own OAuth Client ID
 * and API key. Their sign-in then goes through their own Google project, and
 * visitors load their portfolio with their own API key.
 *
 *   GET  ?username=php-jane-doe -> { username, verified, pending }   (public values only)
 *   POST { action: 'submit', email, googleClientId, googleApiKey }
 *        Saved as pending. Replacing verified credentials requires that user signed in.
 *   POST { action: 'verify' }  Bearer token issued to the pending Client ID for that
 *        email -> pending becomes verified.
 *   POST { action: 'remove' }  Bearer token of that user -> back to the site's sign-in.
 */

const USERNAME_RE = /^php-[a-z0-9-]+$/;
const CLIENT_ID_RE = /^[\w.-]+\.apps\.googleusercontent\.com$/;
const API_KEY_RE = /^[\w-]{20,100}$/;

const publicView = (c: UserCredentials | null) =>
  c && { email: c.email, googleClientId: c.googleClientId, googleApiKey: c.googleApiKey, updatedAt: c.updatedAt };

/** The signed-in caller, if their token belongs to `username` and an accepted Client ID. */
async function callerFor(req: Request, username: string, extraClientIds: (string | undefined)[]) {
  const token = bearerToken(req);
  const caller = token ? await inspectToken(token) : null;
  if (!caller || usernameFromEmail(caller.email) !== username) return null;
  const allowed = [...(await acceptedClientIds()), ...extraClientIds];
  return allowed.includes(caller.clientId) ? caller : null;
}

async function submit(req: Request, body: Record<string, unknown>): Promise<Response> {
  const email = String(body.email ?? '').trim().toLowerCase();
  const googleClientId = String(body.googleClientId ?? '').trim();
  const googleApiKey = String(body.googleApiKey ?? '').trim();
  if (!isGmail(email)) return json(400, { error: 'Enter your Gmail address (…@gmail.com).' });
  if (!CLIENT_ID_RE.test(googleClientId)) return json(400, { error: 'The Client ID should end with .apps.googleusercontent.com.' });
  if (!API_KEY_RE.test(googleApiKey)) return json(400, { error: 'That does not look like a Google API key.' });

  const username = usernameFromEmail(email);
  const record = await readUserCredentials(username);
  if (record.verified) {
    const caller = await callerFor(req, username, [record.verified.googleClientId, record.pending?.googleClientId]);
    if (!caller) return json(403, { error: `These credentials are already confirmed. Sign in as ${email} to change them.` });
  }
  const pending: UserCredentials = { email, googleClientId, googleApiKey, updatedAt: new Date().toISOString() };
  await writeUserCredentials(username, { ...record, pending });
  return json(200, { username, verified: publicView(record.verified), pending: publicView(pending) });
}

async function verify(req: Request): Promise<Response> {
  const token = bearerToken(req);
  const caller = token ? await inspectToken(token) : null;
  if (!caller) return json(401, { error: 'Your Google sign-in has expired. Sign in again.' });
  const username = usernameFromEmail(caller.email);
  if (!username) return json(403, { error: 'Only Gmail accounts can use this site.' });
  const record = await readUserCredentials(username);
  if (!record.pending) return json(409, { error: `There are no credentials waiting for confirmation for ${caller.email}.` });
  if (caller.clientId !== record.pending.googleClientId) {
    return json(403, { error: 'You signed in through a different Client ID. Sign out, then confirm again.' });
  }
  await writeUserCredentials(username, { verified: record.pending, pending: null });
  return json(200, { username, verified: publicView(record.pending), pending: null });
}

async function remove(req: Request): Promise<Response> {
  const token = bearerToken(req);
  const caller = token ? await inspectToken(token) : null;
  if (!caller) return json(401, { error: 'Sign in first.' });
  const username = usernameFromEmail(caller.email);
  const record = await readUserCredentials(username);
  const ok = await callerFor(req, username, [record.verified?.googleClientId, record.pending?.googleClientId]);
  if (!ok) return json(403, { error: 'Only the account owner can remove these credentials.' });
  await writeUserCredentials(username, { verified: null, pending: null });
  return json(200, { username, verified: null, pending: null });
}

export default async (req: Request): Promise<Response> => {
  try {
    if (req.method === 'GET') {
      const username = (new URL(req.url).searchParams.get('username') ?? '').toLowerCase();
      if (!USERNAME_RE.test(username)) return json(400, { error: 'Invalid username' });
      const record = await readUserCredentials(username);
      return json(200, { username, verified: publicView(record.verified), pending: publicView(record.pending) });
    }
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json(400, { error: 'Invalid request body' });
    }
    if (body.action === 'submit') return await submit(req, body);
    if (body.action === 'verify') return await verify(req);
    if (body.action === 'remove') return await remove(req);
    return json(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('[user-credentials]', err);
    return json(500, { error: 'Account settings are unavailable right now.' });
  }
};
