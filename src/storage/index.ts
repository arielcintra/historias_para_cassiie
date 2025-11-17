import type { PageStorage } from './types';
import { LocalPageStorage } from './localPageStorage.ts';
import { DrivePageStorage } from './drivePageStorage.ts';
import { isSignedIn, initGoogleAuth } from '../services/googleAuth.ts';

let useDrive = false;

export async function enableDrive(clientId?: string) {
  const cid = clientId || (process.env.REACT_APP_GOOGLE_CLIENT_ID as string) || (window as any).__GOOGLE_CLIENT_ID__;
  if (!cid) throw new Error('REACT_APP_GOOGLE_CLIENT_ID not configured');
  await initGoogleAuth(cid);
  useDrive = true;
}

export function disableDrive() {
  useDrive = false;
}

export function getPageStorage(): PageStorage {
  if (useDrive && isSignedIn()) return DrivePageStorage;
  return LocalPageStorage;
}

