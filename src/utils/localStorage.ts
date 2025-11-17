export const LocalStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

export const STORAGE_KEYS = {
  BOOKS: 'celestial-books-mui-ts-v1',
  PDF_COLLAGES: 'pdf-collages',
  PDF_PREVIEWS: 'pdf-previews',
  TASK_NOTEBOOK_DATA: 'task-notebook-data',
  TASK_NOTEBOOK_VERSION: 'task-notebook-version',
  TASK_NOTEBOOK_CUSTOM_IMAGES: 'task-notebook-custom-images'
} as const;
