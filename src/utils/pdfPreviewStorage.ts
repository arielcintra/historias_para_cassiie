import { LocalStorage, STORAGE_KEYS } from './localStorage.ts';

type PreviewMap = Record<string, string>; // key -> dataUrl

const keyFor = (bookId: string, pageNumber: number) => `${bookId}::${pageNumber}`;

export const PdfPreviewStorage = {
  getPage(bookId: string, pageNumber: number): string | undefined {
    const map = LocalStorage.get<PreviewMap>(STORAGE_KEYS.PDF_PREVIEWS, {});
    return map[keyFor(bookId, pageNumber)];
  },

  setPage(bookId: string, pageNumber: number, dataUrl: string): void {
    try {
      const map = LocalStorage.get<PreviewMap>(STORAGE_KEYS.PDF_PREVIEWS, {});
      map[keyFor(bookId, pageNumber)] = dataUrl;
      LocalStorage.set(STORAGE_KEYS.PDF_PREVIEWS, map);
    } catch (e) {
      // In case of quota exceeded, ignore silently
      console.warn('PDF preview cache save failed', e);
    }
  },

  removeBook(bookId: string): void {
    const map = LocalStorage.get<PreviewMap>(STORAGE_KEYS.PDF_PREVIEWS, {});
    const next: PreviewMap = {};
    for (const k of Object.keys(map)) {
      if (!k.startsWith(`${bookId}::`)) next[k] = map[k];
    }
    LocalStorage.set(STORAGE_KEYS.PDF_PREVIEWS, next);
  }
};

