export interface PageStorage {
  getPage(bookId: string, pageNumber: number): Promise<string | undefined>;
  setPage(bookId: string, pageNumber: number, dataUrl: string): Promise<void>;
  removeBook(bookId: string): Promise<void>;
}

