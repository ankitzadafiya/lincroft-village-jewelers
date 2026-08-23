import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  effect,
  input,
  signal
} from '@angular/core';
import { ProductMedia } from '../../../core/models';

type GalleryItem =
  | { kind: 'image'; media: ProductMedia }
  | { kind: 'video'; media: ProductMedia };

@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.component.html',
  styleUrl: './product-gallery.component.scss'
})
export class ProductGalleryComponent implements OnDestroy {
  readonly images = input<ProductMedia[]>([]);
  readonly videos = input<ProductMedia[]>([]);

  readonly activeIndex = signal(0);
  readonly lightboxOpen = signal(false);

  private touchStartX = 0;
  private touchStartY = 0;

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

    effect(() => {
      document.body.style.overflow = this.lightboxOpen() ? 'hidden' : '';
    });
  }

  thumbLabel(item: GalleryItem): string {
    if (item.kind === 'video') {
      return item.media.alt || 'Play product video';
    }
    return item.media.alt || 'View image';
  }

  select(index: number): void {
    this.activeIndex.set(index);
  }

  shift(dir: number): void {
    const list = this.items();
    if (!list.length) return;
    const next = (this.activeIndex() + dir + list.length) % list.length;
    this.activeIndex.set(next);
  }

  openLightbox(): void {
    if (!this.items().length) return;
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    this.shift(dx > 0 ? -1 : 1);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeLightbox();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.shift(-1);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.shift(1);
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
