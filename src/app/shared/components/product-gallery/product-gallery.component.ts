import { Component, effect, input, signal } from '@angular/core';
import { ProductMedia } from '../../../core/models';
import { LvjIconsModule } from '../../icons/lvj-icons';

@Component({
  selector: 'app-product-gallery',
  imports: [LvjIconsModule],
  template: `
    <div class="gallery">
      <div class="thumbs">
        @for (item of images(); track item.id) {
          <button
            type="button"
            [class.on]="active()?.id === item.id"
            (mouseenter)="preview(item)"
            (click)="select(item)">
            <img [src]="item.thumbnailUrl" [alt]="item.alt" />
          </button>
        }
        @for (item of videos(); track item.id) {
          <button type="button" class="vid" [class.on]="mode() === 'video' && activeVideo()?.id === item.id" (click)="selectVideo(item)">
            <i class="pi pi-play"></i>
          </button>
        }
      </div>
      <div class="stage" (mousemove)="onMove($event)" (mouseleave)="zooming.set(false)">
        @if (images().length > 1) {
          <button type="button" class="arrow prev" aria-label="Previous image" (click)="shift(-1)">
            <lucide-icon name="chevron-left" [size]="20" [strokeWidth]="1.6"></lucide-icon>
          </button>
          <button type="button" class="arrow next" aria-label="Next image" (click)="shift(1)">
            <lucide-icon name="chevron-right" [size]="20" [strokeWidth]="1.6"></lucide-icon>
          </button>
        }
        @if (mode() === 'video' && activeVideo(); as video) {
          <video [src]="video.url" controls></video>
        } @else {
          @for (item of images(); track item.id) {
            @if (item.id === active()?.id) {
              <img class="main" [src]="item.url" [alt]="item.alt" />
            }
          }
          @if (zooming() && active(); as zoomImg) {
            <div class="zoom" [style.background-image]="'url(' + zoomImg.url + ')'" [style.background-position]="pos()"></div>
          }
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
    .thumbs { display: grid; gap: 0.55rem; align-content: start; }
    .thumbs button {
      border: 1px solid transparent;
      padding: 0;
      background: #f5f5f5;
      cursor: pointer;
      height: 92px;
      overflow: hidden;
      transition: border-color 0.25s ease, opacity 0.25s ease;
      opacity: 0.72;
    }
    .thumbs button.on,
    .thumbs button:hover {
      border-color: #111;
      opacity: 1;
    }
    .thumbs img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.45s var(--lvj-ease);
    }
    .thumbs button:hover img { transform: scale(1.06); }
    .vid { color: #111; display: grid; place-items: center; }
    .stage {
      position: relative;
      aspect-ratio: 1 / 1.08;
      overflow: hidden;
      background: #f5f5f5;
    }
    .stage .main,
    .stage video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      animation: fade 0.35s ease;
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
      background: rgba(255,255,255,0.92);
      color: #111;
      cursor: pointer;
      display: grid;
      place-items: center;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s var(--lvj-ease);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
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
  readonly active = signal<ProductMedia | null>(null);
  readonly activeVideo = signal<ProductMedia | null>(null);
  readonly mode = signal<'image' | 'video'>('image');
  readonly zooming = signal(false);
  readonly pos = signal('50% 50%');

  constructor() {
    effect(() => {
      this.active.set(this.images()[0] ?? null);
      this.activeVideo.set(this.videos()[0] ?? null);
      this.mode.set('image');
    });
  }

  preview(item: ProductMedia): void {
    this.active.set(item);
    this.mode.set('image');
  }

  select(item: ProductMedia): void {
    this.active.set(item);
    this.mode.set('image');
  }

  selectVideo(item: ProductMedia): void {
    this.activeVideo.set(item);
    this.mode.set('video');
  }

  shift(dir: number): void {
    const list = this.images();
    if (!list.length) return;
    const idx = Math.max(0, list.findIndex(i => i.id === this.active()?.id));
    const next = (idx + dir + list.length) % list.length;
    this.active.set(list[next]);
    this.mode.set('image');
  }

  onMove(event: MouseEvent): void {
    if (!this.active() || this.mode() !== 'image') return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.pos.set(`${x}% ${y}%`);
    this.zooming.set(true);
  }
}
