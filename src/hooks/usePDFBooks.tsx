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
        title: `Capítulo ${i}`,
        unlocked: i === 1,
        pageNumber: i,
      });
    }
    
    return chapters;
  };

  const loadPDFBooks = async () => {
    try {
      setLoading(true);
      setError('');

      const booksConfig = [
        { id: 'livro1', title: 'Aventura Espacial', pages: 2 },
        { id: 'livro2', title: 'Jardim das Estrelas', pages: 2 }
      ];

      const books: PDFBook[] = booksConfig.map(config => ({
        id: config.id,
        title: config.title,
        pdfPath: `${process.env.PUBLIC_URL}/books/${config.id}.pdf`,
        totalPages: config.pages,
        chapters: createChaptersFromPages(config.pages, config.id),
        type: 'pdf'
      }));

      setPdfBooks(books);
    } catch (err) {
      console.error('Erro ao carregar livros PDF:', err);
      setError('Erro ao carregar livros');
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