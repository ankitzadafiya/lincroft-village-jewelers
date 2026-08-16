/**
 * Single place to point the Angular app at a backend.
 *
 * Change `ACTIVE_BACKEND` below. Services already read `environment.apiUrl`
 * from this file — do not hardcode hosts in interceptors or HTTP services.
 *
 * Paste the tunnel origin only (no `/api`). The `/api` prefix is added here.
 */

export type BackendTarget = 'mock' | 'ngrok' | 'local' | 'production';

/** <<< switch backends here during `ng serve` >>> */
export const ACTIVE_BACKEND: BackendTarget = 'ngrok';

/**
 * Current ngrok origin from the backend team.
 * Update this whenever they restart the tunnel (the URL changes).
 */
export const NGROK_ORIGIN = 'https://boss-caravan-unpaved.ngrok-free.dev';

/** Backend on the same machine (launchSettings / Kestrel). */
export const LOCAL_ORIGIN = 'https://localhost:5024';

export interface ApiBackendConfig {
  /** Full API root, including `/api`, no trailing slash. */
  apiUrl: string;
  useMockApi: boolean;
  extraHeaders: Record<string, string>;
}

const NGROK_SKIP_WARNING = { 'ngrok-skip-browser-warning': 'true' } as const;

function apiUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}/api`;
}

export const BACKEND_TARGETS: Record<BackendTarget, ApiBackendConfig> = {
  mock: {
    apiUrl: '/api',
    useMockApi: true,
    extraHeaders: {}
  },
  ngrok: {
    apiUrl: apiUrl(NGROK_ORIGIN),
    useMockApi: false,
    extraHeaders: { ...NGROK_SKIP_WARNING }
  },
  local: {
    apiUrl: apiUrl(LOCAL_ORIGIN),
    useMockApi: false,
    extraHeaders: {}
  },
  /** Same-origin `/api` (reverse proxy). Not for Netlify → separate BE. */
  production: {
    apiUrl: '/api',
    useMockApi: false,
    extraHeaders: {}
  }
};

export const activeBackend: ApiBackendConfig = BACKEND_TARGETS[ACTIVE_BACKEND];
