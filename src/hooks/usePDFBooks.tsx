import { useState, useEffect } from 'react';
import { PDFBook, PDFChapter } from '../types';

export function usePDFBooks() {
  const [pdfBooks, setPdfBooks] = useState<PDFBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const createChaptersFromPages = (totalPages: number, bookId: string): PDFChapter[] => {
    const chapters: PDFChapter[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      chapters.push({
        id: `${bookId}-chapter-${i}`,
        title: `Pagina ${i}`,
        pageNumber: i,
      });
    }
    
    return chapters;
  };

  const loadPDFBooks = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch manifest.json from public/books
      const manifestUrl = `${process.env.PUBLIC_URL}/books/manifest.json`;
      const response = await fetch(manifestUrl);

      if (!response.ok) {
        console.warn('Manifest not found, no static PDF books available');
        setPdfBooks([]);
        return;
      }

      const booksConfig: Array<{
        id: string;
        title: string;
        filename: string;
        pages: number;
      }> = await response.json();

      const books: PDFBook[] = booksConfig.map(config => ({
        id: config.id,
        title: config.title,
        pdfPath: `${process.env.PUBLIC_URL}/books/${config.filename}`,
        totalPages: config.pages,
        chapters: createChaptersFromPages(config.pages, config.id),
        type: 'pdf'
      }));

      setPdfBooks(books);
    } catch (err) {
      console.error('Erro ao carregar livros PDF:', err);
      setError('Erro ao carregar livros');
      setPdfBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPDFBooks();
  }, []);

  return {
    pdfBooks,
    loading,
    error,
    reloadBooks: loadPDFBooks
  };
}
