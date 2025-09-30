import type { Collage } from '../types';
import { LocalStorage, STORAGE_KEYS } from '../utils/localStorage.ts';

export const usePDFCollages = () => {
  const getPDFCollage = (bookId: string, chapterId: string): Collage | undefined => {
    const pdfCollages = LocalStorage.get(STORAGE_KEYS.PDF_COLLAGES, {} as Record<string, Collage>);
    return pdfCollages[`${bookId}-${chapterId}`];
  };

  const savePDFCollage = (bookId: string, chapterId: string, collage: Collage): void => {
    const pdfCollages = LocalStorage.get(STORAGE_KEYS.PDF_COLLAGES, {} as Record<string, Collage>);
    pdfCollages[`${bookId}-${chapterId}`] = collage;
    LocalStorage.set(STORAGE_KEYS.PDF_COLLAGES, pdfCollages);
    
    window.dispatchEvent(new CustomEvent('pdfCollageUpdate', {
      detail: { bookId, chapterId }
    }));
  };

  const removePDFCollage = (bookId: string, chapterId: string): void => {
    const pdfCollages = LocalStorage.get(STORAGE_KEYS.PDF_COLLAGES, {} as Record<string, Collage>);
    delete pdfCollages[`${bookId}-${chapterId}`];
    LocalStorage.set(STORAGE_KEYS.PDF_COLLAGES, pdfCollages);
  };

  const getAllPDFCollages = () => {
    return LocalStorage.get(STORAGE_KEYS.PDF_COLLAGES, {} as Record<string, Collage>);
  };

  return {
    getPDFCollage,
    savePDFCollage,
    removePDFCollage,
    getAllPDFCollages
  };
};