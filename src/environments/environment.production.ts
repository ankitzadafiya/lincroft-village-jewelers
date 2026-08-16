import { BACKEND_TARGETS } from './api-backend';

const backend = BACKEND_TARGETS.production;

export const environment = {
  production: true,
  apiUrl: backend.apiUrl,
  useMockApi: backend.useMockApi,
  extraHeaders: backend.extraHeaders,
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
