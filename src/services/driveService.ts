import { googleConfig } from '../config/googleConfig';
import type { DriveFile, PortfolioConfig, UploadedFile } from '../types/google';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FILE_FIELDS = 'id,name,mimeType,webViewLink,webContentLink';

export const ALLOWED_UPLOAD_TYPES = ['image/', 'application/pdf'] as const;

export class DriveApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DriveApiError';
  }
}

export interface UploadOptions {
  /** Override the stored file name (defaults to the File's name). */
  fileName?: string;
  /** Upload into this folder instead of the root portfolio folder. */
  folderId?: string;
  /** Make the file readable by anyone with the link (default: true). */
  makePublic?: boolean;
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

async function driveFetch<T>(accessToken: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new DriveApiError(`Drive API ${res.status}: ${message}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Escape a value for use inside a single-quoted Drive query string. */
const q = (value: string): string => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function buildMultipartBody(metadata: object, content: Blob, contentType: string) {
  const boundary = `portfolio_${crypto.randomUUID()}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
    content,
    `\r\n--${boundary}--`,
  ]);
  return { body, contentType: `multipart/related; boundary=${boundary}` };
}

async function findFileInFolder(
  accessToken: string,
  folderId: string,
  name: string,
): Promise<DriveFile | null> {
  const query = `name = ${q(name)} and ${q(folderId)} in parents and trashed = false`;
  const params = new URLSearchParams({ q: query, fields: `files(${FILE_FIELDS})`, pageSize: '1' });
  const { files } = await driveFetch<{ files: DriveFile[] }>(accessToken, `${DRIVE_API}/files?${params}`);
  return files[0] ?? null;
}

// ---------------------------------------------------------------------------
// Root folder
// ---------------------------------------------------------------------------

// Cache the in-flight promise so concurrent callers (e.g. StrictMode double effects)
// share one lookup instead of racing to create duplicate folders.
const folderIdCache = new Map<string, Promise<string>>();

/** Locate the "My Portfolio Data" folder in the user's Drive root, creating it if missing. */
export function getOrCreateRootFolder(accessToken: string): Promise<string> {
  let pending = folderIdCache.get(accessToken);
  if (!pending) {
    pending = findOrCreateRootFolder(accessToken);
    pending.catch(() => folderIdCache.delete(accessToken));
    folderIdCache.set(accessToken, pending);
  }
  return pending;
}

async function findOrCreateRootFolder(accessToken: string): Promise<string> {
  const query = [
    `name = ${q(googleConfig.rootFolderName)}`,
    `mimeType = '${FOLDER_MIME}'`,
    `'root' in parents`,
    'trashed = false',
  ].join(' and ');
  const params = new URLSearchParams({ q: query, fields: 'files(id)', pageSize: '1' });
  const { files } = await driveFetch<{ files: { id: string }[] }>(
    accessToken,
    `${DRIVE_API}/files?${params}`,
  );
  if (files[0]) return files[0].id;

  const created = await driveFetch<{ id: string }>(accessToken, `${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: googleConfig.rootFolderName, mimeType: FOLDER_MIME, parents: ['root'] }),
  });
  return created.id;
}

// ---------------------------------------------------------------------------
// portfolio_config.json
// ---------------------------------------------------------------------------

export interface StoredPortfolioConfig {
  fileId: string;
  config: PortfolioConfig;
}

/** Read portfolio_config.json from the root folder. Returns null if it doesn't exist yet. */
export async function readPortfolioConfig(accessToken: string): Promise<StoredPortfolioConfig | null> {
  const folderId = await getOrCreateRootFolder(accessToken);
  const file = await findFileInFolder(accessToken, folderId, googleConfig.configFileName);
  if (!file) return null;

  const config = await driveFetch<PortfolioConfig>(accessToken, `${DRIVE_API}/files/${file.id}?alt=media`);
  return { fileId: file.id, config };
}

/** Read a publicly shared portfolio_config.json without signing in (needs an API key). */
export async function readPublicPortfolioConfig(fileId: string, apiKey: string): Promise<PortfolioConfig> {
  const params = new URLSearchParams({ alt: 'media', key: apiKey });
  // Time out so a slow Drive response can't hold the site on its loading screen.
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new DriveApiError(`Drive API ${res.status}: could not read public portfolio data`, res.status);
  return res.json() as Promise<PortfolioConfig>;
}

/**
 * Overwrite portfolio_config.json (creating it on first save). The file is shared
 * "anyone with link" so public pages can read it without signing in.
 */
export async function savePortfolioConfig(
  accessToken: string,
  config: PortfolioConfig,
): Promise<DriveFile> {
  const folderId = await getOrCreateRootFolder(accessToken);
  const existing = await findFileInFolder(accessToken, folderId, googleConfig.configFileName);
  const payload = JSON.stringify({ ...config, updatedAt: new Date().toISOString() }, null, 2);

  let saved: DriveFile;
  if (existing) {
    saved = await driveFetch<DriveFile>(
      accessToken,
      `${UPLOAD_API}/files/${existing.id}?uploadType=media&fields=${FILE_FIELDS}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: payload },
    );
  } else {
    const { body, contentType } = buildMultipartBody(
      { name: googleConfig.configFileName, mimeType: 'application/json', parents: [folderId] },
      new Blob([payload], { type: 'application/json' }),
      'application/json',
    );
    saved = await driveFetch<DriveFile>(
      accessToken,
      `${UPLOAD_API}/files?uploadType=multipart&fields=${FILE_FIELDS}`,
      { method: 'POST', headers: { 'Content-Type': contentType }, body },
    );
  }

  // Idempotent: Drive returns the existing "anyone" permission if it's already shared.
  await makeFilePublic(accessToken, saved.id);
  return saved;
}

/** Shareable link to the public, sign-in-free view of a published portfolio file. */
export const publicPortfolioUrl = (fileId: string): string =>
  `${window.location.origin}/portfolio?id=${encodeURIComponent(fileId)}`;

export interface PublishResult {
  fileId: string;
  /** e.g. https://example.com/portfolio?id=<fileId> */
  publicUrl: string;
}

/**
 * Save portfolio_config.json to the signed-in user's Drive and share it with
 * "anyone with the link" (reader), so the public URL works without signing in.
 */
export async function publishPortfolioToDrive(portfolioData: PortfolioConfig, accessToken: string): Promise<PublishResult> {
  const file = await savePortfolioConfig(accessToken, portfolioData); // uploads, then sets the permission
  return { fileId: file.id, publicUrl: publicPortfolioUrl(file.id) };
}

export const MISSING_API_KEY_MESSAGE =
  'Google API Key is not configured. Please set VITE_GOOGLE_API_KEY in your environment variables.';

/** Thrown before any request when VITE_GOOGLE_API_KEY isn't set. */
export class MissingApiKeyError extends Error {
  constructor() {
    super(MISSING_API_KEY_MESSAGE);
    this.name = 'MissingApiKeyError';
  }
}

/**
 * Read a published portfolio_config.json without signing in. Drive's API rejects
 * requests that carry neither a token nor an API key, so the browser API key
 * (VITE_GOOGLE_API_KEY) is required.
 */
export async function fetchPublicPortfolio(fileId: string): Promise<PortfolioConfig> {
  if (!googleConfig.apiKey) throw new MissingApiKeyError();
  const params = new URLSearchParams({ alt: 'media', key: googleConfig.apiKey });
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?${params}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const reason =
      res.status === 404
        ? 'This portfolio does not exist or is not shared publicly.'
        : res.status === 403 || res.status === 401
          ? 'This portfolio is not shared publicly, or the site\'s Google API key was rejected.'
          : `Google Drive returned an error (${res.status}).`;
    throw new DriveApiError(reason, res.status);
  }
  return res.json() as Promise<PortfolioConfig>;
}

// ---------------------------------------------------------------------------
// File uploads (images / PDFs)
// ---------------------------------------------------------------------------

/** Grant "anyone with the link" read access to a file. */
export async function makeFilePublic(accessToken: string, fileId: string): Promise<void> {
  await driveFetch(accessToken, `${DRIVE_API}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone', allowFileDiscovery: false }),
  });
}

/** A URL that renders the file directly (images embeddable in <img>, PDFs in an <iframe>). */
export function getPublicUrl(file: Pick<DriveFile, 'id' | 'mimeType'>): string {
  return file.mimeType.startsWith('image/')
    ? `https://lh3.googleusercontent.com/d/${file.id}`
    : `https://drive.google.com/file/d/${file.id}/preview`;
}

/** Drive rejects multipart uploads above 5 MB; larger files use a resumable session. */
const MULTIPART_MAX_BYTES = 5 * 1024 * 1024;

async function resumableUpload(accessToken: string, metadata: object, file: File): Promise<DriveFile> {
  const init = await fetch(`${UPLOAD_API}/files?uploadType=resumable&fields=${FILE_FIELDS}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': file.type,
      'X-Upload-Content-Length': String(file.size),
    },
    body: JSON.stringify(metadata),
  });
  const sessionUrl = init.headers.get('Location');
  if (!init.ok || !sessionUrl) {
    throw new DriveApiError(`Drive API ${init.status}: could not start upload session`, init.status);
  }

  // The session URL itself authorizes the upload.
  const res = await fetch(sessionUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new DriveApiError(`Drive API ${res.status}: upload failed`, res.status);
  return res.json() as Promise<DriveFile>;
}

/** Upload an image or PDF to the portfolio folder and (by default) make it public. */
export async function uploadFile(
  accessToken: string,
  file: File,
  options: UploadOptions = {},
): Promise<UploadedFile> {
  const mimeType = file.type || 'application/octet-stream';
  if (!ALLOWED_UPLOAD_TYPES.some((t) => mimeType.startsWith(t))) {
    throw new Error(`Unsupported file type "${mimeType}". Only images and PDFs are allowed.`);
  }

  const folderId = options.folderId ?? (await getOrCreateRootFolder(accessToken));
  const metadata = { name: options.fileName ?? file.name, mimeType, parents: [folderId] };

  const uploaded =
    file.size > MULTIPART_MAX_BYTES
      ? await resumableUpload(accessToken, metadata, file)
      : await (() => {
          const { body, contentType } = buildMultipartBody(metadata, file, mimeType);
          return driveFetch<DriveFile>(accessToken, `${UPLOAD_API}/files?uploadType=multipart&fields=${FILE_FIELDS}`, {
            method: 'POST',
            headers: { 'Content-Type': contentType },
            body,
          });
        })();

  if (options.makePublic ?? true) {
    await makeFilePublic(accessToken, uploaded.id);
  }

  return { ...uploaded, publicUrl: getPublicUrl(uploaded) };
}

/** Drop cached folder IDs (call on logout). */
export function clearDriveCache(): void {
  folderIdCache.clear();
}
