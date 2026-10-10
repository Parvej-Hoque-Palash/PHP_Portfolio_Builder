import { getStore } from '@netlify/blobs';
import { usernameFromEmail } from '../../src/utils/username';
import { acceptedClientIds, bearerToken, inspectToken, json } from '../lib/siteSettings';

/**
 * Personal-URL registry: maps a username ("php-jane-doe") to the Drive file ID of
 * that user's portfolio_config.json, so /php-jane-doe works for visitors.
 *
 *   GET  /.netlify/functions/registry?username=php-jane-doe -> { username, fileId } | 404
 *   POST /.netlify/functions/registry  (Authorization: Bearer <Google access token>)
 *        body { fileId } -> registers the caller's own username
 *
 * A POST only claims the username derived from the token's own Gmail address,
 * and only for a portfolio_config.json that account owns. Entries live in Netlify
 * Blobs, so no redeploy or manual edit is needed.
 */

const USERNAME_RE = /^php-[a-z0-9-]+$/;
const FILE_ID_RE = /^[\w-]{10,200}$/;
const CONFIG_FILE_NAME = 'portfolio_config.json';

const store = () => getStore({ name: 'portfolio-registry', consistency: 'strong' });

async function lookup(req: Request): Promise<Response> {
  const username = (new URL(req.url).searchParams.get('username') ?? '').toLowerCase();
  if (!USERNAME_RE.test(username)) return json(400, { error: 'Invalid username' });
  const fileId = await store().get(username);
  return fileId ? json(200, { username, fileId }) : json(404, { error: 'Not registered' });
}

async function register(req: Request): Promise<Response> {
  const token = bearerToken(req);
  if (!token) return json(401, { error: 'Sign in to publish.' });

  let fileId: unknown;
  try {
    ({ fileId } = (await req.json()) as { fileId?: unknown });
  } catch {
    return json(400, { error: 'Invalid request body' });
  }
  if (typeof fileId !== 'string' || !FILE_ID_RE.test(fileId)) return json(400, { error: 'Invalid file ID' });

  // Who is calling? Google confirms the token and the account's email.
  const caller = await inspectToken(token);
  if (!caller) return json(401, { error: 'Your Google session has expired. Sign in again.' });
  const clientIds = await acceptedClientIds();
  if (clientIds.length > 0 && !clientIds.includes(caller.clientId)) return json(403, { error: 'Token was issued to another app.' });
  const username = usernameFromEmail(caller.email);
  if (!username) return json(403, { error: 'Only Gmail accounts can publish.' });

  // The file must be this account's own portfolio file.
  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,ownedByMe,trashed`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!fileRes.ok) return json(403, { error: 'Could not verify the portfolio file.' });
  const file = (await fileRes.json()) as { name?: string; ownedByMe?: boolean; trashed?: boolean };
  if (!file.ownedByMe || file.trashed || file.name !== CONFIG_FILE_NAME) {
    return json(403, { error: 'That file is not your portfolio file.' });
  }

  await store().set(username, fileId);
  return json(200, { username, fileId });
}

export default async (req: Request): Promise<Response> => {
  try {
    if (req.method === 'GET') return await lookup(req);
    if (req.method === 'POST') return await register(req);
    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('[registry]', err);
    return json(500, { error: 'Registry is unavailable right now.' });
  }
};
