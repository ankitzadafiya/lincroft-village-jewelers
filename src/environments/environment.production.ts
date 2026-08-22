import { BACKEND_TARGETS } from './api-backend';

/** Netlify production build — live API on Render. */
const backend = BACKEND_TARGETS.production;

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
