// Lightweight Google Identity Services (GIS) OAuth helper for Drive API tokens
// Requires a Google OAuth 2.0 Client ID configured for web (user type per your project)

const GSI_SRC = "https://accounts.google.com/gsi/client";

type Token = {
  access_token: string;
  expires_at: number; // epoch millis
};

let token: Token | null = null;
let tokenClient: any = null;
let loadingPromise: Promise<void> | null = null;

declare global {
  interface Window { google?: any }
}

async function loadGsi(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return loadingPromise;
}

export async function initGoogleAuth(clientId: string, scope: string = 'https://www.googleapis.com/auth/drive.file openid email profile') {
  await loadGsi();
  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope,
    callback: (resp: any) => {
      if (resp && resp.access_token) {
        const expires_in = Number(resp.expires_in || 3600);
        token = {
          access_token: resp.access_token,
          expires_at: Date.now() + (expires_in * 1000) - 5000,
        };
      }
    },
  });
}

export function isSignedIn(): boolean {
  return !!token && token.expires_at > Date.now();
}

export async function ensureToken(clientId: string): Promise<string> {
  if (!tokenClient) await initGoogleAuth(clientId);
  if (token && token.expires_at > Date.now()) return token.access_token;
  return new Promise((resolve, reject) => {
    tokenClient.requestAccessToken({
      prompt: (token ? '' : 'consent') as any,
      // Ask account selection explicitly to avoid stuck sessions
      hint: undefined,
      callback: (resp: any) => {
        if (resp && resp.access_token) {
          const expires_in = Number(resp.expires_in || 3600);
          token = {
            access_token: resp.access_token,
            expires_at: Date.now() + (expires_in * 1000) - 5000,
          };
          resolve(token.access_token);
        } else {
          reject(new Error('No access token'));
        }
      },
      error_callback: (err: any) => {
        reject(err || new Error('Google authorization failed'));
      }
    });
  });
}

export function signOut() {
  token = null;
}
