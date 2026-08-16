import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductMedia } from '../models';

export interface UploadProgress {
  progress: number;
  media?: ProductMedia;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly limits = environment.media;

  validate(file: File, kind: 'image' | 'video'): string | null {
    const allowed = kind === 'image' ? this.limits.allowedImageTypes : this.limits.allowedVideoTypes;
    const maxMb = kind === 'image' ? this.limits.maxImageSizeMb : this.limits.maxVideoSizeMb;
    if (!allowed.includes(file.type)) return `Unsupported ${kind} type.`;
    if (file.size > maxMb * 1024 * 1024) return `${kind} must be under ${maxMb}MB.`;
    return null;
  }

  upload(file: File, kind: 'image' | 'video'): Observable<UploadProgress> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', kind);
    return this.http.post<ProductMedia>(`${this.api}/admin/media/upload`, form, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<ProductMedia>): UploadProgress => {
        if (event.type === HttpEventType.UploadProgress) {
          return { progress: event.total ? Math.round(100 * event.loaded / event.total) : 0 };
        }
        if (event.type === HttpEventType.Response) {
          return { progress: 100, media: event.body ?? undefined };
        }
        return { progress: 0 };
      })
    );
  }
}
