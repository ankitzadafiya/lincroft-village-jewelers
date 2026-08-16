import { BACKEND_TARGETS } from './api-backend';

/**
 * Netlify production build target.
 *
 * Temporary: use `ngrok` so the deployed site talks to the live BE tunnel
 * (https://boss-caravan-unpaved.ngrok-free.dev/api/...).
 *
 * When the real production API is ready, switch back to `BACKEND_TARGETS.production`
 * (or set that target’s apiUrl to the permanent host).
 */
const backend = BACKEND_TARGETS.ngrok;

export const environment = {
  production: true,
  apiUrl: backend.apiUrl,
  useMockApi: backend.useMockApi,
  extraHeaders: backend.extraHeaders,
  googleClientId: '875754637701-1h2cbj3uu75arauu4qelq6da4m0ji2fa.apps.googleusercontent.com',
  appName: 'Lincroft Village Jewelers',
  defaultPageSize: 12,
  media: {
    maxImages: 12,
    maxVideos: 3,
    maxImageSizeMb: 8,
    maxVideoSizeMb: 50,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm']
  }
};
