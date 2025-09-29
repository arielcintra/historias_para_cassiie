export type StickerKind = 'star' | 'heart' | 'moon' | 'rocket' | 'cloud' | 'planet' | 'emoji';
export interface StickerItem {
  id: string; 
  emoji: string; 
  x: number; 
  y: number; 
  scale: number; 
  rotation: number;
}
export interface Collage { 
  id: string; 
  items: StickerItem[] 
}

export interface PDFChapter { 
  id: string; 
  title: string; 
  unlocked: boolean; 
  pageNumber: number;
  imageUrl?: string;
  collage?: Collage 
}

export interface PDFBook { 
  id: string; 
  title: string; 
  pdfPath: string;
  totalPages: number;
  chapters: PDFChapter[];
  type: 'pdf';
}

export interface TextChapter { 
  id: string; 
  title: string; 
  unlocked: boolean; 
  text: string; 
  collage?: Collage 
}

export interface TextBook { 
  id: string; 
  title: string; 
  chapters: TextChapter[];
  type: 'text';
}

export type Book = PDFBook | TextBook;
export type Chapter = PDFChapter | TextChapter;
export type Role = 'admin' | 'reader';