import { PdfPreviewStorage } from '../utils/pdfPreviewStorage.ts';
import type { PageStorage } from './types';

export const LocalPageStorage: PageStorage = {
  async getPage(bookId, pageNumber) {
    return PdfPreviewStorage.getPage(bookId, pageNumber);
  },
  async setPage(bookId, pageNumber, dataUrl) {
    PdfPreviewStorage.setPage(bookId, pageNumber, dataUrl);
  },
  async removeBook(bookId) {
    PdfPreviewStorage.removeBook(bookId);
  },
};

