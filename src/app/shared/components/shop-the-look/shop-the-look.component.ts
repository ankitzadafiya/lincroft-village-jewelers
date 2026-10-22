import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  computed,
  inject,
  input,
  signal,
  viewChildren
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../icons/lvj-icons';

/** One video tile. Media is DEMO content until the store supplies its own videos. */
export interface LookTile {
  key: string;
  kicker: string;
  title: string;
  cta: string;
  path: string;
  queryParams?: Record<string, string>;
  src: string;
  srcSmall?: string;
  poster?: string;
  /** Small product image in the bar. */
  thumb: string;
  /** Crop-in for thumbnails where the piece is small in frame. */
  thumbZoom?: number;
  /** CSS object-position for the video crop. */
  focus?: string;
}

/**
 * Home video feature — intro text + two tall autoplaying video tiles with a
 * shoppable bar. `reverse` puts the videos first and the text on the right.
 * Videos are muted, inline, play only while on screen, never preload until
 * needed, and stay paused for reduced-motion / data-saver visitors.
 * Each tile has its own pause control (WCAG 2.2.2).
 */
@Component({
  selector: 'app-shop-the-look',
  imports: [RouterLink, AppIconComponent],
  templateUrl: './shop-the-look.component.html',
  styleUrl: './shop-the-look.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopTheLookComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly key = input('look');
  readonly kicker = input('Shop the look');
  readonly title = input('Made to be worn');
  readonly lede = input('');
  readonly allLink = input('/shop');
  readonly allLabel = input('Explore all jewelry');
  readonly allQuery = input<Record<string, string> | null>(null);
  /** Videos first, text on the right. */
  readonly reverse = input(false);
  readonly tiles = input.required<LookTile[]>();

  private readonly videos = viewChildren<ElementRef<HTMLVideoElement>>('vid');

  readonly looks = computed(() => {
    const small = typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches;
    return this.tiles().map(t => ({ ...t, video: small && t.srcSmall ? t.srcSmall : t.src }));
  });

  /** Index → user paused that tile. */
  readonly userPaused = signal<Record<number, boolean>>({});
  /** Index → currently playing (drives the toggle icon). */
  readonly playing = signal<Record<number, boolean>>({});

  private observer?: IntersectionObserver;
  /** Tiles currently on screen. */
  private readonly inView = new Set<number>();
  private readonly onVisibility = () => {
    if (document.visibilityState !== 'visible' || !this.autoplayAllowed) return;
    // Browsers pause video in background tabs; resume what's on screen.
    for (const i of this.inView) {
      const video = this.videos()[i]?.nativeElement;
      if (video?.paused && !this.userPaused()[i]) this.play(video, i);
    }
  };
  private readonly autoplayAllowed = this.canAutoplay();

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const video = entry.target as HTMLVideoElement;
            const i = Number(video.dataset['i']);
            if (entry.isIntersecting) {
              this.inView.add(i);
              if (this.autoplayAllowed && !this.userPaused()[i]) this.play(video, i);
            } else {
              this.inView.delete(i);
              if (video.paused) continue;
              video.pause();
              this.setPlaying(i, false);
            }
          }
        },
        { threshold: 0.35 }
      );
      for (const ref of this.videos()) this.observer!.observe(ref.nativeElement);
      document.addEventListener('visibilitychange', this.onVisibility);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibility);
    for (const ref of this.videos()) ref.nativeElement.pause();
  }

  toggle(i: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const video = this.videos()[i]?.nativeElement;
    if (!video) return;
    if (video.paused) {
      this.userPaused.update(m => ({ ...m, [i]: false }));
      this.play(video, i);
    } else {
      video.pause();
      this.userPaused.update(m => ({ ...m, [i]: true }));
      this.setPlaying(i, false);
    }
  }

  /** Keep the toggle icon honest when the browser itself pauses/plays. */
  onMediaState(i: number, isPlaying: boolean): void {
    this.playing.update(m => ({ ...m, [i]: isPlaying }));
  }

  private play(video: HTMLVideoElement, i: number): void {
    if (video.preload !== 'auto') video.preload = 'auto';
    video.muted = true;
    video.play().catch(() => this.setPlaying(i, false));
  }

  private setPlaying(i: number, value: boolean): void {
    this.zone.run(() => this.playing.update(m => ({ ...m, [i]: value })));
  }

  private canAutoplay(): boolean {
    if (typeof window === 'undefined') return false;
    if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return !conn?.saveData;
  }
}
