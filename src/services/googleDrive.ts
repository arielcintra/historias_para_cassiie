// Minimal Google Drive v3 client using fetch and GIS access tokens
import { ensureToken } from './googleAuth.ts';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

const APP_ROOT = 'CassUniverse';

export interface DriveContext {
  clientId: string;
}

export function getDriveContext(): DriveContext {
  const clientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID as string) || (window as any).__GOOGLE_CLIENT_ID__;
  if (!clientId) throw new Error('Google Client ID not configured');
  return { clientId };
}

async function authorizedFetch(ctx: DriveContext, url: string, init: RequestInit = {}) {
  const accessToken = await ensureToken(ctx.clientId);
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(url, { ...init, headers });
}

async function findFolder(ctx: DriveContext, name: string, parentId?: string): Promise<string | undefined> {
  const qParts = [
    `mimeType = 'application/vnd.google-apps.folder'`,
    `name = '${name.replace(/'/g, "\\'")}'`,
    'trashed = false',
  ];
  if (parentId) qParts.push(`'${parentId}' in parents`);
  const q = qParts.join(' and ');
  const resp = await authorizedFetch(ctx, `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await resp.json();
  return data.files?.[0]?.id;
}

async function createFolder(ctx: DriveContext, name: string, parentId?: string): Promise<string> {
  const body = { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined };
  const resp = await authorizedFetch(ctx, DRIVE_FILES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  return data.id;
}

export async function ensureAppFolder(ctx: DriveContext): Promise<string> {
  let id = await findFolder(ctx, APP_ROOT);
  if (!id) id = await createFolder(ctx, APP_ROOT);
  return id!;
}

export async function ensureBookFolder(ctx: DriveContext, bookId: string): Promise<string> {
  const root = await ensureAppFolder(ctx);
  let bookFolder = await findFolder(ctx, `book-${bookId}`, root);
  if (!bookFolder) bookFolder = await createFolder(ctx, `book-${bookId}`, root);
  return bookFolder;
}

async function findFileInFolder(ctx: DriveContext, name: string, folderId: string): Promise<string | undefined> {
  const q = `name='${name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`;
  const resp = await authorizedFetch(ctx, `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await resp.json();
  return data.files?.[0]?.id;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = (header.match(/data:(.*?);/) || [])[1] || 'application/octet-stream';
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadOrUpdateImage(ctx: DriveContext, folderId: string, name: string, dataUrl: string): Promise<string> {
  const fileId = await findFileInFolder(ctx, name, folderId);
  const blob = dataUrlToBlob(dataUrl);
  const metadata = { name, parents: [folderId] } as any;

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const multipartBody = [
    delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata),
    delimiter + `Content-Type: ${blob.type}\r\n\r\n`,
  ];
  // We need to append binary; fetch requires Blob
  const body = new Blob([
    multipartBody[0],
    multipartBody[1],
    blob,
    closeDelim
  ], { type: `multipart/related; boundary=${boundary}` });

  const url = fileId ? `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=multipart` : `${DRIVE_UPLOAD_URL}?uploadType=multipart`;
  const method = fileId ? 'PATCH' : 'POST';
  const resp = await authorizedFetch(ctx, url, { method, body });
  const data = await resp.json();
  return data.id as string;
}

export async function downloadImageDataUrl(ctx: DriveContext, folderId: string, name: string): Promise<string | undefined> {
  const fileId = await findFileInFolder(ctx, name, folderId);
  if (!fileId) return undefined;
  const resp = await authorizedFetch(ctx, `${DRIVE_FILES_URL}/${fileId}?alt=media`);
  const blob = await resp.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function removeBookFolder(ctx: DriveContext, bookId: string): Promise<void> {
  const root = await ensureAppFolder(ctx);
  const q = `name='book-${bookId.replace(/'/g, "\\'")}' and '${root}' in parents and trashed=false`;
  const resp = await authorizedFetch(ctx, `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id)`);
  const data = await resp.json();
  const folderId = data.files?.[0]?.id;
  if (!folderId) return;
  // Move to trash
  await authorizedFetch(ctx, `${DRIVE_FILES_URL}/${folderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });
}

export async function uploadOrUpdateBinary(
  ctx: DriveContext,
  folderId: string,
  name: string,
  blob: Blob
): Promise<string> {
  const fileId = await findFileInFolder(ctx, name, folderId);
  const metadata = { name, parents: [folderId] } as any;
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const body = new Blob([
    delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata),
    delimiter + `Content-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`,
    blob,
    closeDelim
  ], { type: `multipart/related; boundary=${boundary}` });

  const url = fileId ? `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=multipart` : `${DRIVE_UPLOAD_URL}?uploadType=multipart`;
  const method = fileId ? 'PATCH' : 'POST';
  const resp = await authorizedFetch(ctx, url, { method, body });
  const data = await resp.json();
  return data.id as string;
}

export async function downloadFileBlob(
  ctx: DriveContext,
  folderId: string,
  name: string
): Promise<Blob | undefined> {
  const fileId = await findFileInFolder(ctx, name, folderId);
  if (!fileId) return undefined;
  const resp = await authorizedFetch(ctx, `${DRIVE_FILES_URL}/${fileId}?alt=media`);
  if (!resp.ok) return undefined;
  return await resp.blob();
}
