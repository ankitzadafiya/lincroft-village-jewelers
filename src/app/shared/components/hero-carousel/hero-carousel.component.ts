import { AfterViewChecked, Component, DestroyRef, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { fromEvent } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { IMG, VIDEO } from '../../../core/mock/image-catalog';

interface HeroSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  primaryPath: string;
  secondaryCta: string;
  secondaryPath: string;
  poster: string;
  video: string;
}

@Component({
  selector: 'app-hero-carousel',
  imports: [RouterLink],
  template: `
    <section class="hero-wrap" (mouseenter)="pause()" (mouseleave)="resume()">
      <div class="poster">
        @for (slide of slides; track slide.title; let i = $index) {
          <article class="slide" [class.active]="i === index()">
            <video
              #clip
              class="media"
              [poster]="slide.poster"
              [attr.data-i]="i"
              muted
              loop
              playsinline
              preload="metadata"
              aria-hidden="true"></video>
            <div class="shade"></div>
            <div class="copy">
              <p class="eyebrow">{{ slide.eyebrow }}</p>
              <h1>{{ slide.title }}</h1>
              <p class="sub">{{ slide.subtitle }}</p>
              <div class="ctas">
                <a class="btn btn-gold" [routerLink]="slide.primaryPath">{{ slide.primaryCta }}</a>
                <a class="btn btn-ghost hero-ghost" [routerLink]="slide.secondaryPath">{{ slide.secondaryCta }}</a>
              </div>
            </div>
          </article>
        }

        <div class="dots" aria-label="Hero slides">
          @for (slide of slides; track slide.title; let i = $index) {
            <button type="button" [class.on]="i === index()" [attr.aria-label]="'Go to slide ' + (i + 1)" (click)="go(i)"></button>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-wrap {
      padding: 0.85rem var(--lvj-gutter) 0;
      background: var(--lvj-ivory);
    }

    @media (min-width: 1280px) {
      .hero-wrap {
        padding-inline: max(var(--lvj-gutter-xl), calc((100vw - var(--lvj-content-max-xl)) / 2));
      }
    }

    .poster {
      position: relative;
      min-height: clamp(380px, 58vh, 620px);
      border-radius: 22px;
      overflow: hidden;
      background: var(--lvj-panel-alt);
      box-shadow: var(--lvj-shadow);
    }

    .slide {
      position: absolute;
      inset: 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.45s ease;
    }

    .slide.active {
      opacity: 1;
      pointer-events: auto;
    }

    .media {
      width: 100%;
      height: 112%;
      object-fit: cover;
      display: block;
      background: #1a1a1a;
      transform: translate3d(0, var(--parallax, 0px), 0);
      will-change: transform;
    }

    .shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(20, 18, 16, 0.5) 0%, rgba(20, 18, 16, 0.18) 55%, rgba(20, 18, 16, 0.08) 100%);
      pointer-events: none;
    }

    .copy {
      position: absolute;
      left: 0;
      bottom: 0;
      padding: clamp(1.5rem, 4vw, 3rem);
      display: grid;
      gap: 0.75rem;
      max-width: min(520px, 92%);
      color: #fff;
      z-index: 1;
    }

    .eyebrow {
      margin: 0;
      color: rgba(255,255,255,0.85);
    }

    h1 {
      margin: 0;
      font-family: var(--font-body);
      font-style: normal;
      font-size: clamp(2rem, 4.8vw, 3.35rem);
      font-weight: 550;
      letter-spacing: -0.03em;
      line-height: 1.08;
      color: #fff;
      max-width: 14ch;
    }

    .sub {
      margin: 0;
      color: rgba(255,255,255,0.88);
      font-size: 1rem;
      line-height: 1.55;
      max-width: 36ch;
    }

    .ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-top: 0.35rem;
    }

    .hero-ghost {
      background: transparent;
      color: #fff;
      border-color: rgba(255, 255, 255, 0.7);
    }

    .hero-ghost:hover {
      background: rgba(255, 255, 255, 0.12);
      color: var(--lvj-gold-bright);
      border-color: var(--lvj-gold-bright);
    }

    .dots {
      position: absolute;
      right: 1.25rem;
      bottom: 1.25rem;
      display: flex;
      gap: 0.4rem;
      z-index: 2;
    }

    .dots button {
      width: 8px;
      height: 8px;
      border-radius: 99px;
      border: 0;
      background: rgba(255, 255, 255, 0.45);
      cursor: pointer;
      padding: 0;
      transition: width 0.35s ease, background 0.25s ease;
    }

    .dots button.on {
      width: 22px;
      background: var(--lvj-gold-bright);
    }

    @media (max-width: 720px) {
      .poster {
        min-height: 420px;
        border-radius: 18px;
      }
    }
  `]
})
export class HeroCarouselComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChildren('clip') private readonly clips!: QueryList<ElementRef<HTMLVideoElement>>;

  readonly slides: HeroSlide[] = [
    {
      eyebrow: 'Just dropped',
      title: 'Lab-grown & natural diamonds',
      subtitle: 'Rings, earrings, and tennis bracelets selected for everyday brilliance in Lincroft.',
      primaryCta: 'Shop best sellers',
      primaryPath: '/shop',
      secondaryCta: 'Shop rings',
      secondaryPath: '/ring',
      poster: IMG.hero,
      video: VIDEO.hero1
    },
    {
      eyebrow: 'New in',
      title: 'Tennis bracelets that sparkle',
      subtitle: 'Lab-grown diamond tennis bracelets in 14k white, yellow, and rose gold.',
      primaryCta: 'Shop bracelets',
      primaryPath: '/bracelet',
      secondaryCta: 'Shop earrings',
      secondaryPath: '/earring',
      poster: IMG.elise.tennisLab,
      video: VIDEO.hero2
    },
    {
      eyebrow: 'Everyday shine',
      title: 'Engagement & cocktail rings',
      subtitle: 'Marquise, emerald, celestial, and stacking styles from our Lincroft floor.',
      primaryCta: 'Shop rings',
      primaryPath: '/ring',
      secondaryCta: 'Shop pendants',
      secondaryPath: '/pendant',
      poster: IMG.elise.marquiseLabY,
      video: VIDEO.hero3
    }
  ];

  readonly index = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;
  private onScreen = true;
  private observer?: IntersectionObserver;
  private lastSynced = -1;

  ngOnInit(): void {
    this.watchVisibility();
    this.start();
    this.watchParallax();
  }

  ngAfterViewChecked(): void {
    if (this.lastSynced === this.index()) return;
    this.syncVideos();
  }

  ngOnDestroy(): void {
    this.stop();
    this.observer?.disconnect();
  }

  go(i: number): void {
    this.index.set(i);
    this.syncVideos();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  private syncVideos(): void {
    const active = this.index();
    this.lastSynced = active;
    this.clips?.forEach((ref, i) => {
      const el = ref.nativeElement;
      if (!el.src) {
        el.src = this.slides[i].video;
      }
      if (i === active && this.onScreen) {
        void el.play().catch(() => undefined);
      } else {
        el.pause();
        try { el.currentTime = 0; } catch { /* ignore */ }
      }
    });
  }

  private watchParallax(): void {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const apply = () => {
      const rect = this.host.nativeElement.getBoundingClientRect();
      const offset = Math.min(36, Math.max(0, -rect.top * 0.18));
      this.host.nativeElement.style.setProperty('--parallax', `${offset}px`);
    };

    apply();
    fromEvent(window, 'scroll', { passive: true })
      .pipe(auditTime(16), takeUntilDestroyed(this.destroyRef))
      .subscribe(apply);
  }

  private watchVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.onScreen = entry.isIntersecting;
        if (this.onScreen) {
          this.start();
          this.syncVideos();
        } else {
          this.stop();
          this.clips?.forEach(ref => ref.nativeElement.pause());
        }
      },
      { threshold: 0.05 }
    );
    this.observer.observe(this.host.nativeElement);
  }

  private start(): void {
    this.stop();
    if (!this.onScreen) return;
    this.timer = setInterval(() => {
      if (this.paused) return;
      this.index.set((this.index() + 1) % this.slides.length);
      this.syncVideos();
    }, 7000);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
