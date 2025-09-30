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

const LS_KEY = "celestial-books-mui-ts-v1";

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
  createBook: (
    title: string,
    chapters: Pick<TextChapter, "title" | "text">[]
  ) => void;
  createPDFBook: (
    title: string,
    totalPages: number,
    chapterTitles?: string[]
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
  const [textBooks, setTextBooks] = useState<TextBook[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "null")?.textBooks ?? textSeed;
    } catch {
      return textSeed;
    }
  });
  const [dynamicPdfBooks, setDynamicPdfBooks] = useState<PDFBook[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "null")?.dynamicPdfBooks ?? [];
    } catch {
      return [];
    }
  });
  const [role, setRole] = useState<Role>("reader");

  const books = useMemo<Book[]>(() => {
    const sortedPdfBooks = [...pdfBooks, ...dynamicPdfBooks].sort((a, b) => a.id.localeCompare(b.id));
    const sortedTextBooks = [...textBooks].sort((a, b) => a.id.localeCompare(b.id));
    return [...sortedPdfBooks, ...sortedTextBooks];
  }, [pdfBooks, dynamicPdfBooks, textBooks]);

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
    localStorage.setItem(LS_KEY, JSON.stringify({ textBooks, dynamicPdfBooks }));
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
    } else if (activeBook.type === 'pdf') {
      const pdfCollages = JSON.parse(localStorage.getItem('pdf-collages') || '{}');
      pdfCollages[`${activeBookId}-${chapterId}`] = collage;
      localStorage.setItem('pdf-collages', JSON.stringify(pdfCollages));
      
      window.dispatchEvent(new CustomEvent('pdfCollageUpdate', {
        detail: { bookId: activeBookId, chapterId }
      }));
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
      const chapterTitle = chapterTitles?.[i - 1] || `Capítulo ${i}`;
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
      pdfFile,
    };
    
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
    createBook,
    createPDFBook,
  };
  return <BooksCtx.Provider value={value}>{children}</BooksCtx.Provider>;
}
