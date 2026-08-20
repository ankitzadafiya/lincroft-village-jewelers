import { Component, computed, effect, input, signal } from '@angular/core';
import { ProductMedia } from '../../../core/models';

type GalleryItem =
  | { kind: 'image'; media: ProductMedia }
  | { kind: 'video'; media: ProductMedia };

@Component({
  selector: 'app-product-gallery',
  template: `
    <div class="gallery">
      <div class="thumbs" role="tablist" aria-label="Product media">
        @for (item of items(); track item.media.id; let i = $index) {
          <button
            type="button"
            role="tab"
            [class.on]="activeIndex() === i"
            [attr.aria-label]="item.kind === 'video' ? (item.media.alt || 'Play product video') : (item.media.alt || 'View image')"
            (mouseenter)="preview(i)"
            (click)="select(i)">
            @if (item.kind === 'video') {
              <img
                class="thumb-img"
                [src]="item.media.thumbnailUrl || item.media.url"
                [alt]="item.media.alt || 'Video'" />
              <span class="play-badge" aria-hidden="true">
                <i class="pi pi-play"></i>
              </span>
              <span class="vid-label">Video</span>
            } @else {
              <img
                class="thumb-img"
                [src]="item.media.thumbnailUrl || item.media.url"
                [alt]="item.media.alt || ''" />
            }
          </button>
        }
      </div>

      <div
        class="stage"
        (mousemove)="onMove($event)"
        (mouseleave)="zooming.set(false)">
        @if (items().length > 1) {
          <button type="button" class="arrow prev" aria-label="Previous media" (click)="shift(-1)">
            <i class="pi pi-chevron-left" aria-hidden="true"></i>
          </button>
          <button type="button" class="arrow next" aria-label="Next media" (click)="shift(1)">
            <i class="pi pi-chevron-right" aria-hidden="true"></i>
          </button>
        }

        @if (current(); as cur) {
          @if (cur.kind === 'video') {
            <video
              class="main-video"
              [src]="cur.media.url"
              [poster]="cur.media.thumbnailUrl || undefined"
              [attr.aria-label]="cur.media.alt || 'Product video'"
              controls
              playsinline
              preload="metadata"
              (click)="$event.stopPropagation()"></video>
          } @else {
            <img class="main" [src]="cur.media.url" [alt]="cur.media.alt || ''" />
            @if (zooming()) {
              <div
                class="zoom"
                [style.background-image]="'url(' + cur.media.url + ')'"
                [style.background-position]="pos()"></div>
            }
          }
        } @else {
          <div class="empty">No media available</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .gallery {
      display: grid;
      grid-template-columns: 78px 1fr;
      gap: 0.9rem;
    }

    .thumbs {
      display: grid;
      gap: 0.55rem;
      align-content: start;
    }

    .thumbs button {
      position: relative;
      border: 1px solid transparent;
      padding: 0;
      background: var(--lvj-panel-alt);
      cursor: pointer;
      height: 92px;
      overflow: hidden;
      border-radius: 10px;
      transition: border-color 0.25s ease, opacity 0.25s ease;
      opacity: 0.72;
    }

    .thumbs button.on,
    .thumbs button:hover {
      border-color: var(--lvj-navy);
      opacity: 1;
    }

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.45s var(--lvj-ease);
    }

    .thumbs button:hover .thumb-img {
      transform: scale(1.06);
    }

    .play-badge {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(10, 24, 40, 0.28);
      color: #fff;
      font-size: 0.95rem;
    }

    .vid-label {
      position: absolute;
      left: 0.3rem;
      bottom: 0.3rem;
      font-size: 0.55rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #fff;
      background: rgba(14, 47, 77, 0.82);
      padding: 0.12rem 0.35rem;
      border-radius: 4px;
    }

    .stage {
      position: relative;
      aspect-ratio: 1 / 1.08;
      overflow: hidden;
      background: var(--lvj-panel-alt);
      border-radius: 14px;
    }

    .main,
    .main-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      animation: fade 0.35s ease;
      background: #0f1720;
    }

    .main-video {
      object-fit: contain;
      background: #0a121a;
    }

    .empty {
      height: 100%;
      display: grid;
      place-items: center;
      color: var(--lvj-muted);
      font-size: 0.9rem;
    }

    @keyframes fade {
      from { opacity: 0.35; }
      to { opacity: 1; }
    }

    .arrow {
      position: absolute;
      top: 50%;
      z-index: 3;
      transform: translateY(-50%);
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      color: var(--lvj-ink);
      cursor: pointer;
      display: grid;
      place-items: center;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s var(--lvj-ease);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .stage:hover .arrow { opacity: 1; }
    .arrow:hover { transform: translateY(-50%) scale(1.05); }
    .arrow.prev { left: 0.75rem; }
    .arrow.next { right: 0.75rem; }

    .zoom {
      position: absolute;
      inset: 0;
      background-repeat: no-repeat;
      background-size: 190%;
      pointer-events: none;
      z-index: 2;
    }

    @media (max-width: 767px) {
      .gallery { grid-template-columns: 1fr; }
      .thumbs {
        grid-auto-flow: column;
        grid-auto-columns: 68px;
        overflow: auto;
        order: 2;
      }
      .thumbs button { width: 68px; height: 84px; }
      .stage { order: 1; aspect-ratio: 1 / 1.05; }
      .zoom { display: none; }
      .arrow { opacity: 1; }
    }
  `]
})
export class ProductGalleryComponent {
  readonly images = input<ProductMedia[]>([]);
  readonly videos = input<ProductMedia[]>([]);

  readonly activeIndex = signal(0);
  readonly zooming = signal(false);
  readonly pos = signal('50% 50%');

  readonly items = computed<GalleryItem[]>(() => {
    const imgs = (this.images() ?? [])
      .filter(m => !!m?.url)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(media => ({ kind: 'image' as const, media }));

    const vids = (this.videos() ?? [])
      .filter(m => !!m?.url)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(media => ({ kind: 'video' as const, media }));

    return [...imgs, ...vids];
  });

  readonly current = computed(() => this.items()[this.activeIndex()] ?? null);

  constructor() {
    effect(() => {
      const list = this.items();
      if (!list.length) {
        this.activeIndex.set(0);
        return;
      }
      if (this.activeIndex() >= list.length) {
        this.activeIndex.set(0);
      }
    });
  }

  preview(index: number): void {
    const item = this.items()[index];
    if (!item || item.kind === 'video') return;
    this.activeIndex.set(index);
  }

  select(index: number): void {
    this.activeIndex.set(index);
    this.zooming.set(false);
  }

  shift(dir: number): void {
    const list = this.items();
    if (!list.length) return;
    const next = (this.activeIndex() + dir + list.length) % list.length;
    this.activeIndex.set(next);
    this.zooming.set(false);
  }

  onMove(event: MouseEvent): void {
    const cur = this.current();
    if (!cur || cur.kind !== 'image') return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.pos.set(`${x}% ${y}%`);
    this.zooming.set(true);
  }
}
