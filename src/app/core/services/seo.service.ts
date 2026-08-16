import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  set(options: { title: string; description: string; image?: string; url?: string }): void {
    const pageTitle = `${options.title} · ${environment.appName}`;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: options.description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: options.description });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    if (options.image) {
      this.meta.updateTag({ property: 'og:image', content: options.image });
    }
    if (options.url) {
      this.meta.updateTag({ property: 'og:url', content: options.url });
    }
  }
}
