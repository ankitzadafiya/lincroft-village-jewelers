import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AppConfiguration } from '../models';

export interface SeoOptions {
  title: string;
  description: string;
  /** Absolute or site-relative path, e.g. `/about` or full URL */
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  /** When true, adds noindex,nofollow */
  noIndex?: boolean;
  /** Optional JSON-LD graphs to inject (replaces previous page graphs) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly jsonLdNodes = new Map<string, HTMLScriptElement>();

  readonly siteUrl = environment.siteUrl.replace(/\/$/, '');
  readonly siteName = environment.appName;

  set(options: SeoOptions): void {
    const pageTitle = options.title.includes(this.siteName)
      ? options.title
      : `${options.title} | ${this.siteName}`;
    const description = this.clip(options.description, 160);
    const url = this.absoluteUrl(options.path ?? this.doc.defaultView?.location?.pathname ?? '/');
    const image = this.absoluteUrl(options.image || `${this.siteUrl}/images/custom-ring-finished.jpg`);
    const type = options.type || 'website';

    this.title.setTitle(pageTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: options.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    });

    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);

    if (options.jsonLd) {
      this.setJsonLd('page', options.jsonLd);
    } else {
      this.clearJsonLd('page');
    }
  }

  /** Sitewide LocalBusiness / Organization / WebSite graph (call once when config is ready). */
  setBusinessJsonLd(config: AppConfiguration | null): void {
    if (!config) {
      this.clearJsonLd('business');
      return;
    }

    const sameAs = [config.instagramUrl, config.facebookUrl]
      .filter((u): u is string => !!u && !/instagram\.com\/?$|facebook\.com\/?$/i.test(u));

    const address =
      config.addressLine && config.city && config.region
        ? {
            '@type': 'PostalAddress',
            streetAddress: config.addressLine,
            addressLocality: config.city,
            addressRegion: config.region,
            postalCode: config.postalCode || undefined,
            addressCountry: 'US'
          }
        : undefined;

    const openingHours = this.toOpeningHours(config.hours || []);

    const jewelryStore: Record<string, unknown> = {
      '@type': 'JewelryStore',
      '@id': `${this.siteUrl}/#store`,
      name: config.storeName || this.siteName,
      url: this.siteUrl,
      image: `${this.siteUrl}/images/custom-ring-finished.jpg`,
      logo: `${this.siteUrl}/images/custom-ring-finished.jpg`,
      description: config.tagline || undefined,
      telephone: config.phone || undefined,
      email: config.email || undefined,
      address,
      openingHoursSpecification: openingHours.length ? openingHours : undefined,
      sameAs: sameAs.length ? sameAs : undefined,
      areaServed: {
        '@type': 'Place',
        name: 'Lincroft, New Jersey'
      }
    };

    const website: Record<string, unknown> = {
      '@type': 'WebSite',
      '@id': `${this.siteUrl}/#website`,
      url: this.siteUrl,
      name: config.storeName || this.siteName,
      publisher: { '@id': `${this.siteUrl}/#store` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    this.setJsonLd('business', {
      '@context': 'https://schema.org',
      '@graph': [this.stripUndefined(jewelryStore), this.stripUndefined(website)]
    });
  }

  absoluteUrl(pathOrUrl: string): string {
    if (!pathOrUrl) return this.siteUrl + '/';
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${this.siteUrl}${path}`;
  }

  private setCanonical(url: string): void {
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  setJsonLd(key: string, data: Record<string, unknown> | Record<string, unknown>[]): void {
    this.clearJsonLd(key);
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.id = `lvj-jsonld-${key}`;
    script.text = JSON.stringify(data);
    this.doc.head.appendChild(script);
    this.jsonLdNodes.set(key, script);
  }

  clearJsonLd(key: string): void {
    const existing = this.jsonLdNodes.get(key) || this.doc.getElementById(`lvj-jsonld-${key}`);
    existing?.parentNode?.removeChild(existing);
    this.jsonLdNodes.delete(key);
  }

  private clip(text: string, max: number): string {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  }

  private toOpeningHours(
    hours: { day: string; hours: string; closed: boolean }[]
  ): Record<string, unknown>[] {
    const dayMap: Record<string, string> = {
      Monday: 'Monday',
      Tuesday: 'Tuesday',
      Wednesday: 'Wednesday',
      Thursday: 'Thursday',
      Friday: 'Friday',
      Saturday: 'Saturday',
      Sunday: 'Sunday'
    };

    return hours
      .filter(h => !h.closed && dayMap[h.day])
      .map(h => {
        const match = h.hours.match(
          /(\d{1,2}):(\d{2})\s*(am|pm)\s*[–\-—]\s*(\d{1,2}):(\d{2})\s*(am|pm)/i
        );
        if (!match) return null;
        const opens = this.to24h(+match[1], +match[2], match[3]);
        const closes = this.to24h(+match[4], +match[5], match[6]);
        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: dayMap[h.day],
          opens,
          closes
        } as Record<string, unknown>;
      })
      .filter((x): x is Record<string, unknown> => x != null);
  }

  private to24h(hour: number, minute: number, meridiem: string): string {
    let h = hour % 12;
    if (/pm/i.test(meridiem)) h += 12;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
  }
}
