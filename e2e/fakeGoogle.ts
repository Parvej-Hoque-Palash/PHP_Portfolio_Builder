import type { BrowserContext, Route } from '@playwright/test';
import { usernameFromEmail } from '../src/utils/username';

/**
 * In-memory stand-ins for everything the app talks to at Google:
 *  - the Google Identity Services script (sign-in popup),
 *  - the userinfo and token-revoke endpoints,
 *  - the Drive v3 REST API (folders, search, uploads, sharing, public reads).
 * Files are scoped per account like real Drive, so isolation between users is
 * actually exercised. The access token is "tok:<email>" so the server side
 * knows who is calling.
 */

export const API_KEY = 'e2e-api-key'; // must match .env.test
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export interface FakeFile {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  owner: string;
  content: Buffer;
  isPublic: boolean;
}

export class FakeDrive {
  files = new Map<string, FakeFile>();
  /** public/portfolios.json as currently "deployed". */
  registry: Record<string, string> = {};
  /** Usernames registered through the registry Netlify Function (Netlify Blobs). */
  registered: Record<string, string> = {};
  private seq = 0;

  create(owner: string, meta: { name: string; mimeType: string; parents?: string[] }, content = Buffer.alloc(0)): FakeFile {
    const file: FakeFile = {
      id: `file${++this.seq}`,
      name: meta.name,
      mimeType: meta.mimeType,
      parents: meta.parents ?? ['root'],
      owner,
      content,
      isPublic: false,
    };
    this.files.set(file.id, file);
    return file;
  }

  ownedBy(owner: string): FakeFile[] {
    return [...this.files.values()].filter((f) => f.owner === owner);
  }

  find(owner: string, name: string): FakeFile | undefined {
    return this.ownedBy(owner).find((f) => f.name === name);
  }

  json(file: FakeFile): Record<string, unknown> {
    return JSON.parse(file.content.toString('utf8'));
  }
}

/** Fake GIS script: initTokenClient().requestAccessToken() "signs in" as window.__E2E_ACCOUNT. */
const GSI_SCRIPT = `
window.google = {
  accounts: {
    oauth2: {
      initTokenClient(config) {
        return {
          requestAccessToken() {
            const email = window.__E2E_ACCOUNT;
            if (!email) { config.error_callback && config.error_callback({ type: 'popup_closed' }); return; }
            setTimeout(() => config.callback({ access_token: 'tok:' + email, expires_in: 3599, scope: config.scope, token_type: 'Bearer' }), 20);
          },
        };
      },
      revoke() {},
    },
    id: { initialize() {}, prompt() {}, cancel() {}, disableAutoSelect() {} },
  },
};`;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-expose-headers': 'Location',
};

const reply = (route: Route, status: number, body: unknown, headers: Record<string, string> = {}) =>
  route.fulfill({
    status,
    headers: { ...CORS, 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body),
  });

const callerOf = (route: Route): string | null => {
  const auth = route.request().headers()['authorization'] ?? '';
  return auth.startsWith('Bearer tok:') ? auth.slice('Bearer tok:'.length) : null;
};

/** Parse a multipart/related body into [metadata JSON, content]. */
function parseMultipart(body: Buffer, contentType: string): { meta: Record<string, unknown>; content: Buffer } {
  const boundary = /boundary=([^;]+)/.exec(contentType)?.[1];
  if (!boundary) throw new Error('multipart without boundary');
  const parts: Buffer[] = [];
  const delim = Buffer.from(`--${boundary}`);
  let start = body.indexOf(delim);
  while (start !== -1) {
    const next = body.indexOf(delim, start + delim.length);
    if (next === -1) break;
    parts.push(body.subarray(start + delim.length, next));
    start = next;
  }
  const [metaPart, contentPart] = parts.map((p) => {
    const sep = p.indexOf('\r\n\r\n');
    return p.subarray(sep + 4, p.length - 2); // strip headers and trailing CRLF
  });
  return { meta: JSON.parse(metaPart.toString('utf8')), content: contentPart };
}

function fileFields(f: FakeFile) {
  return {
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    webViewLink: `https://drive.google.com/file/d/${f.id}/view`,
    webContentLink: `https://drive.google.com/uc?id=${f.id}&export=download`,
  };
}

/** Wire the fakes into a browser context, signing in as `account` (or nobody). */
export async function installFakeGoogle(context: BrowserContext, drive: FakeDrive, account: string | null) {
  await context.addInitScript((email) => {
    (window as unknown as { __E2E_ACCOUNT: string | null }).__E2E_ACCOUNT = email;
  }, account);

  await context.route('https://accounts.google.com/gsi/client**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: GSI_SCRIPT }),
  );

  await context.route('https://oauth2.googleapis.com/revoke**', (route) => reply(route, 200, {}));

  // Registry as currently deployed
  await context.route('**/portfolios.json', (route) => reply(route, 200, drive.registry));

  // Registry Netlify Function: same checks as netlify/functions/registry.ts
  await context.route('**/.netlify/functions/registry**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      const username = new URL(req.url()).searchParams.get('username') ?? '';
      const fileId = drive.registered[username];
      return fileId ? reply(route, 200, { username, fileId }) : reply(route, 404, { error: 'Not registered' });
    }
    const email = /^Bearer tok:(.+)$/.exec(req.headers()['authorization'] ?? '')?.[1];
    if (!email) return reply(route, 401, { error: 'Sign in to publish.' });
    const { fileId } = req.postDataJSON() as { fileId: string };
    const file = drive.files.get(fileId);
    if (!file || file.owner !== email || file.name !== 'portfolio_config.json') {
      return reply(route, 403, { error: 'That file is not your portfolio file.' });
    }
    const username = usernameFromEmail(email);
    drive.registered[username] = fileId;
    return reply(route, 200, { username, fileId });
  });

  // Third-party noise
  await context.route('https://countapi.mileshilliard.com/**', (route) => reply(route, 200, { value: 42 }));

  // Public file URLs the pages embed
  await context.route('https://lh3.googleusercontent.com/d/**', (route) => {
    const id = new URL(route.request().url()).pathname.split('/').pop()!;
    const f = drive.files.get(id);
    return f?.isPublic
      ? route.fulfill({ status: 200, contentType: f.mimeType, body: f.content })
      : route.fulfill({ status: 403, body: 'forbidden' });
  });
  await context.route('https://drive.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Drive preview</body></html>' }),
  );

  await context.route('https://www.googleapis.com/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

    const caller = callerOf(route);
    const path = url.pathname;

    // --- userinfo
    if (path === '/oauth2/v3/userinfo') {
      if (!caller) return reply(route, 401, { error: 'unauthenticated' });
      const local = caller.split('@')[0];
      const name = local
        .split(/[._]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return reply(route, 200, { sub: `sub-${caller}`, email: caller, name, picture: '' });
    }

    // --- resumable upload session (PUT to the Location URL; authorised by the URL itself)
    if (path === '/upload/drive/v3/files' && url.searchParams.get('upload_id')) {
      const f = drive.files.get(url.searchParams.get('upload_id')!);
      if (!f || method !== 'PUT') return reply(route, 404, { error: 'no session' });
      f.content = req.postDataBuffer() ?? Buffer.alloc(0);
      return reply(route, 200, fileFields(f));
    }

    // --- public read with API key (no token)
    const mediaMatch = /^\/drive\/v3\/files\/([^/]+)$/.exec(path);
    if (mediaMatch && method === 'GET' && url.searchParams.get('alt') === 'media' && !caller) {
      const f = drive.files.get(decodeURIComponent(mediaMatch[1]));
      if (url.searchParams.get('key') !== API_KEY) return reply(route, 400, { error: { message: 'API key not valid' } });
      if (!f || !f.isPublic) return reply(route, 404, { error: { message: 'File not found' } });
      return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': f.mimeType }, body: f.content });
    }

    if (!caller) return reply(route, 401, { error: { message: 'Login required' } });

    // --- files.list
    if (path === '/drive/v3/files' && method === 'GET') {
      const q = url.searchParams.get('q') ?? '';
      const name = /name = '((?:[^'\\]|\\.)*)'/.exec(q)?.[1]?.replace(/\\(.)/g, '$1');
      const mime = /mimeType = '([^']+)'/.exec(q)?.[1];
      const parent = /'([^']+)' in parents/.exec(q)?.[1];
      const files = drive
        .ownedBy(caller)
        .filter((f) => (!name || f.name === name) && (!mime || f.mimeType === mime) && (!parent || f.parents.includes(parent)));
      return reply(route, 200, { files: files.map(fileFields) });
    }

    // --- files.create (metadata only: folders)
    if (path === '/drive/v3/files' && method === 'POST') {
      const meta = req.postDataJSON() as { name: string; mimeType: string; parents?: string[] };
      return reply(route, 200, fileFields(drive.create(caller, meta)));
    }

    // --- authenticated read
    if (mediaMatch && method === 'GET') {
      const f = drive.files.get(decodeURIComponent(mediaMatch[1]));
      if (!f || f.owner !== caller) return reply(route, 404, { error: { message: 'File not found' } });
      return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': f.mimeType }, body: f.content });
    }

    // --- permissions.create
    const permMatch = /^\/drive\/v3\/files\/([^/]+)\/permissions$/.exec(path);
    if (permMatch && method === 'POST') {
      const f = drive.files.get(permMatch[1]);
      if (!f || f.owner !== caller) return reply(route, 404, { error: { message: 'File not found' } });
      const perm = req.postDataJSON() as { role: string; type: string };
      if (perm.type === 'anyone' && perm.role === 'reader') f.isPublic = true;
      return reply(route, 200, { id: 'anyoneWithLink', type: perm.type, role: perm.role });
    }

    // --- uploads
    if (path === '/upload/drive/v3/files' && method === 'POST') {
      const type = url.searchParams.get('uploadType');
      if (type === 'multipart') {
        const { meta, content } = parseMultipart(req.postDataBuffer()!, req.headers()['content-type']);
        const f = drive.create(caller, meta as { name: string; mimeType: string; parents?: string[] }, content);
        return reply(route, 200, fileFields(f));
      }
      if (type === 'resumable') {
        const f = drive.create(caller, req.postDataJSON());
        return reply(route, 200, {}, { location: `https://www.googleapis.com/upload/drive/v3/files?upload_id=${f.id}` });
      }
    }
    const patchMatch = /^\/upload\/drive\/v3\/files\/([^/]+)$/.exec(path);
    if (patchMatch && method === 'PATCH') {
      const f = drive.files.get(patchMatch[1]);
      if (!f || f.owner !== caller) return reply(route, 404, { error: { message: 'File not found' } });
      f.content = req.postDataBuffer() ?? Buffer.alloc(0);
      return reply(route, 200, fileFields(f));
    }

    return reply(route, 501, { error: { message: `fake Drive: unhandled ${method} ${path}` } });
  });
}

export const FOLDER = FOLDER_MIME;

/** 1×1 PNG and a minimal PDF for upload tests. */
export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
export const TINY_PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
