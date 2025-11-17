import type { PageStorage } from './types';
import { ensureBookFolder, uploadOrUpdateImage, downloadImageDataUrl, removeBookFolder } from '../services/googleDrive.ts';

let CLIENT_ID: string | undefined = (process.env.REACT_APP_GOOGLE_CLIENT_ID as string | undefined);

function getCtx() {
  if (!CLIENT_ID) {
    CLIENT_ID = (window as any).__GOOGLE_CLIENT_ID__;
  }
  if (!CLIENT_ID) throw new Error('Google Client ID not configured');
  return { clientId: CLIENT_ID };
}

export const DrivePageStorage: PageStorage = {
  async getPage(bookId, pageNumber) {
    const ctx = getCtx();
    const folder = await ensureBookFolder(ctx, bookId);
    return await downloadImageDataUrl(ctx, folder, `page-${pageNumber}.png`);
  },
  async setPage(bookId, pageNumber, dataUrl) {
    const ctx = getCtx();
    const folder = await ensureBookFolder(ctx, bookId);
    await uploadOrUpdateImage(ctx, folder, `page-${pageNumber}.png`, dataUrl);
  },
  async removeBook(bookId) {
    const ctx = getCtx();
    await removeBookFolder(ctx, bookId);
  },
};
