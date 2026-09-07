import { activeBackend } from './api-backend';

export const environment = {
  production: false,
  apiUrl: activeBackend.apiUrl,
  useMockApi: activeBackend.useMockApi,
  extraHeaders: activeBackend.extraHeaders,
  /** Google Cloud OAuth 2.0 Web client ID (from BE GOOGLE_SIGN_IN.md). */
  googleClientId: '875754637701-1h2cbj3uu75arauu4qelq6da4m0ji2fa.apps.googleusercontent.com',
  appName: 'Lincroft Village Jewelers',
  /** Canonical public origin (no trailing slash). Used for SEO canonicals, OG, and JSON-LD. */
  siteUrl: 'https://lincroft-village-jewelers.netlify.app',
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
