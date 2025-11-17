import type { PageStorage } from './types';
import { LocalPageStorage } from './localPageStorage.ts';

export function getPageStorage(): PageStorage {
  return LocalPageStorage;
}

