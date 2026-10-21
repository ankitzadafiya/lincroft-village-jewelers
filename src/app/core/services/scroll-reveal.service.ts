import { Injectable, NgZone, inject } from '@angular/core';

/** What gets a subtle reveal. Kept short on purpose — minimal motion. */
const TARGETS = [
  'main section',
  'main .page-hero',
  'app-product-card',
  'app-footer .cols > *'
].join(',');

/** Cards that stagger with their siblings (ms per step, steps wrap per row). */
const STAGGER_SELECTOR = 'app-product-card';
const STAGGER_STEP_MS = 70;
const STAGGER_WRAP = 4;

/**
 * Site-wide scroll reveal for the storefront.
 *
 * - Elements already in the first viewport are left untouched (no hidden LCP,
 *   no flash on load — good for Core Web Vitals / SEO).
 * - Elements managed by the existing `appReveal` directive are skipped.
 * - Nothing is hidden when IntersectionObserver is missing or the visitor
 *   prefers reduced motion.
 * - New content (route changes, API data) is picked up via MutationObserver.
 */
@Injectable({ providedIn: 'root' })
export class ScrollRevealService {
  private readonly zone = inject(NgZone);
  private io?: IntersectionObserver;
  private mo?: MutationObserver;
  private root?: HTMLElement;
  private scheduled = false;
  private initialPass = true;

  start(root: HTMLElement): void {
    if (this.root) return;
    if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.root = root;
    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver(entries => this.onIntersect(entries), {
        threshold: 0.08,
        rootMargin: '0px 0px -6% 0px'
      });
      this.mo = new MutationObserver(() => this.schedule());
      this.mo.observe(root, { childList: true, subtree: true });
      this.scan();
      this.initialPass = false;
    });
  }

  stop(): void {
    this.io?.disconnect();
    this.mo?.disconnect();
    this.io = undefined;
    this.mo = undefined;
    this.root = undefined;
    this.initialPass = true;
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      this.scan();
    });
  }

  private scan(): void {
    if (!this.root || !this.io) return;
    const viewportH = window.innerHeight;
    const nodes = this.root.querySelectorAll<HTMLElement>(TARGETS);

    nodes.forEach(el => {
      if (el.dataset['sr']) return;
      el.dataset['sr'] = '1';

      // Leave directive-managed blocks and opted-out sections (e.g. pinned scroll stories) alone.
      if (el.closest('.reveal, [data-no-reveal]')) return;

      const isCard = el.matches(STAGGER_SELECTOR);
      // Avoid double motion: only cards may animate inside an animated parent.
      if (!isCard && el.parentElement?.closest('.sr')) return;
      // Sections holding product cards let the cards animate instead.
      if (!isCard && el.querySelector(STAGGER_SELECTOR)) return;

      // Never hide what is already on screen (first paint / LCP).
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportH && rect.bottom > 0) {
        if (this.initialPass || rect.top < viewportH * 0.85) return;
      }

      if (isCard) {
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [el];
        const index = siblings.indexOf(el);
        el.style.setProperty('--sr-delay', `${(index % STAGGER_WRAP) * STAGGER_STEP_MS}ms`);
      }

      el.classList.add('sr');
      this.io!.observe(el);
    });
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      el.classList.add('sr-in');
      this.io?.unobserve(el);
      // Drop the stagger delay after the entrance so hovers aren't delayed.
      window.setTimeout(() => el.style.removeProperty('--sr-delay'), 1200);
    }
  }
}
