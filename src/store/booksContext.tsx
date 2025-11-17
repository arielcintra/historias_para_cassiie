import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuid } from "uuid";
import type { Book, Collage, Role, TextBook, TextChapter, PDFBook, PDFChapter } from "../types";
import { usePDFBooks } from "../hooks/usePDFBooks.tsx";
import { LocalStorage, STORAGE_KEYS } from "../utils/localStorage.ts";
import { usePDFCollages } from "../hooks/usePDFCollages.ts";
import { getPageStorage } from "../storage/index.ts";

const textSeed: TextBook[] = [
  {
    id: "text-book-1",
    title: "Histórias de Texto",
    type: "text",
    chapters: [
      {
        id: "c1",
        title: "Capítulo 1",
        text: "Era uma vez, em um céu de algodão, um foguete curioso...",
      },
      {
        id: "c2",
        title: "Capítulo 2",
        text: "A lua piscou para as estrelas e contou um segredo.",
      },
    ],
  },
];

interface BooksContextShape {
  role: Role;
  setRole: (r: Role) => void;
  books: Book[];
  activeBookId?: string;
  setActiveBookId: (id: string) => void;
  activeBook?: Book;
  saveCollage: (chapterId: string, collage?: Collage) => void;
  deleteBook: (bookId: string) => void;
  createBook: (
    title: string,
    chapters: Pick<TextChapter, "title" | "text">[]
  ) => void;
  createPDFBook: (
    title: string,
    totalPages: number,
    chapterTitles?: string[],
    pdfFile?: File
  ) => void;
}

const BooksCtx = createContext<BooksContextShape | null>(null);
export const useBooks = () => {
  const ctx = useContext(BooksCtx);
  if (!ctx) throw new Error("useBooks must be used within BooksProvider");
  return ctx;
};

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const { pdfBooks } = usePDFBooks();
  const { savePDFCollage } = usePDFCollages();
  
  // Separate state for PDF files (not serialized to localStorage)
  const [pdfFiles, setPdfFiles] = useState<Record<string, File>>({});
  
  const [textBooks, setTextBooks] = useState<TextBook[]>(() => {
    return LocalStorage.get(STORAGE_KEYS.BOOKS, {})?.textBooks ?? textSeed;
  });
  
  const [dynamicPdfBooks, setDynamicPdfBooks] = useState<PDFBook[]>(() => {
    return LocalStorage.get(STORAGE_KEYS.BOOKS, {})?.dynamicPdfBooks ?? [];
  });
  const [role, setRole] = useState<Role>("reader");

  const books = useMemo<Book[]>(() => {
    // Add PDF files to dynamic PDF books
    const enrichedDynamicPdfBooks = dynamicPdfBooks.map(book => ({
      ...book,
      pdfFile: pdfFiles[book.id]
    }));
    
    const sortedPdfBooks = [...pdfBooks, ...enrichedDynamicPdfBooks].sort((a, b) => a.id.localeCompare(b.id));
    const sortedTextBooks = [...textBooks].sort((a, b) => a.id.localeCompare(b.id));
    return [...sortedPdfBooks, ...sortedTextBooks];
  }, [pdfBooks, dynamicPdfBooks, textBooks, pdfFiles]);

  const [activeBookId, setActiveBookId] = useState<string | undefined>();

  useEffect(() => {
    if (books.length > 0) {
      const currentActiveBook = books.find(b => b.id === activeBookId);
      if (!activeBookId || !currentActiveBook) {
        setActiveBookId(books[0].id);
      }
    }
  }, [books, activeBookId]);

  useEffect(() => {
    // Remove pdfFile from books before saving to localStorage
    const cleanDynamicPdfBooks = dynamicPdfBooks.map(book => {
      const { pdfFile, ...cleanBook } = book;
      return cleanBook;
    });
    LocalStorage.set(STORAGE_KEYS.BOOKS, { textBooks, dynamicPdfBooks: cleanDynamicPdfBooks });
  }, [textBooks, dynamicPdfBooks]);

  const activeBook = useMemo(
    () => books.find((b) => b.id === activeBookId),
    [books, activeBookId]
  );


  const saveCollage = (chapterId: string, collage?: Collage) => {
    if (!activeBookId || !activeBook) return;
    
    if (activeBook.type === 'text') {
      setTextBooks((prev) =>
        prev.map((b) =>
          b.id !== activeBookId
            ? b
            : {
                ...b,
                chapters: b.chapters.map((c) =>
                  c.id === chapterId ? { ...c, collage } : c
                ),
              }
        )
      );
    } else if (activeBook.type === 'pdf' && collage) {
      savePDFCollage(activeBookId, chapterId, collage);
    }
  };

  const createBook = (
    title: string,
    chapters: Pick<TextChapter, "title" | "text">[]
  ) => {
    const nb: TextBook = {
      id: `book-${uuid().slice(0, 8)}`,
      title,
      type: 'text',
      chapters: chapters.map(
        (c, i): TextChapter => ({
          id: `c${i + 1}`,
          title: c.title,
          text: c.text,
        })
      ),
    };
    setTextBooks((prev) => [...prev, nb]);
    setActiveBookId(nb.id);
  };

  const createPDFBook = (
    title: string,
    totalPages: number,
    chapterTitles?: string[],
    pdfFile?: File
  ) => {
    const bookId = `pdf-${uuid().slice(0, 8)}`;
    const chapters: PDFChapter[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      const chapterTitle = chapterTitles?.[i - 1] || `Pagina ${i}`;
      chapters.push({
        id: `${bookId}-chapter-${i}`,
        title: chapterTitle,
        pageNumber: i,
      });
    }

    const nb: PDFBook = {
      id: bookId,
      title,
      pdfPath: `${process.env.PUBLIC_URL}/books/${bookId}.pdf`,
      totalPages,
      chapters,
      type: 'pdf',
      // Attach the file immediately so the Studio can render right away.
      // This field is stripped before persisting to localStorage below.
      pdfFile: pdfFile ?? undefined,
    };
    
    // Store PDF file separately
    if (pdfFile) {
      setPdfFiles(prev => ({ ...prev, [bookId]: pdfFile }));
    }

    setDynamicPdfBooks((prev) => [...prev, nb]);
    setActiveBookId(nb.id);
  };

  const value: BooksContextShape = {
    role,
    setRole,
    books,
    activeBookId,
    setActiveBookId,
    activeBook,
    saveCollage,
    deleteBook: (bookId: string) => {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      // Remove from proper collection
      if (book.type === 'text') {
        setTextBooks(prev => prev.filter(b => b.id !== bookId));
      } else {
        setDynamicPdfBooks(prev => prev.filter(b => b.id !== bookId));
        // Drop in-memory file ref
        setPdfFiles(prev => {
          const { [bookId]: _, ...rest } = prev;
          return rest;
        });
        // Remove any saved PDF collages for this book
        const collages = LocalStorage.get(
          STORAGE_KEYS.PDF_COLLAGES,
          {} as Record<string, Collage>
        );
        const next: Record<string, Collage> = {};
        for (const key of Object.keys(collages)) {
          if (!key.startsWith(`${bookId}-`)) next[key] = collages[key];
        }
        LocalStorage.set(STORAGE_KEYS.PDF_COLLAGES, next);
        // Remove cached previews (Drive or Local)
        getPageStorage().removeBook(bookId).catch(() => {});
      }

      // Adjust active selection if needed
      if (activeBookId === bookId) {
        // Compute next available book id after removal
        const remaining = books.filter(b => b.id !== bookId);
        setActiveBookId(remaining[0]?.id);
      }
    },
    createBook,
    createPDFBook,
  };
  return <BooksCtx.Provider value={value}>{children}</BooksCtx.Provider>;
}
