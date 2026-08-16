import { activeBackend } from './api-backend';

export const environment = {
  production: false,
  apiUrl: activeBackend.apiUrl,
  useMockApi: activeBackend.useMockApi,
  extraHeaders: activeBackend.extraHeaders,
  /** Google Cloud OAuth 2.0 Web client ID. Empty = GIS button disabled (mock still works). */
  googleClientId: '',
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
