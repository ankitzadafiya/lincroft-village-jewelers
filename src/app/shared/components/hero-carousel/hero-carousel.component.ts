import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMG } from '../../../core/mock/image-catalog';

interface HeroSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  primaryPath: string;
  secondaryCta: string;
  secondaryPath: string;
  image: string;
}

@Component({
  selector: 'app-hero-carousel',
  imports: [RouterLink],
  template: `
    <section class="hero-wrap" (mouseenter)="pause()" (mouseleave)="resume()">
      <div class="poster">
        @for (slide of slides; track slide.title; let i = $index) {
          <article class="slide" [class.active]="i === index()">
            <img [src]="slide.image" [alt]="slide.title" />
            <div class="shade"></div>
            <div class="copy">
              <p class="eyebrow">{{ slide.eyebrow }}</p>
              <h1>{{ slide.title }}</h1>
              <p class="sub">{{ slide.subtitle }}</p>
              <div class="ctas">
                <a class="btn btn-light" [routerLink]="slide.primaryPath">{{ slide.primaryCta }}</a>
                <a class="btn btn-light" [routerLink]="slide.secondaryPath">{{ slide.secondaryCta }}</a>
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
      padding: 0.85rem 1rem 0;
      background: var(--lvj-ivory);
    }

    @media (min-width: 1280px) {
      .hero-wrap {
        padding-inline: max(1rem, calc((100vw - 1360px) / 2));
      }
    }

    .poster {
      position: relative;
      min-height: clamp(380px, 58vh, 620px);
      border-radius: 22px;
      overflow: hidden;
      background: #ebe7e1;
    }

    .slide {
      position: absolute;
      inset: 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity 1s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .slide.active {
      opacity: 1;
      pointer-events: auto;
    }

    .slide img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.06);
      transition: transform 8s linear;
      animation: ken 14s ease-in-out infinite alternate;
    }

    .slide.active img {
      transform: scale(1);
    }

    .shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(20, 18, 16, 0.45) 0%, rgba(20, 18, 16, 0.12) 55%, rgba(20, 18, 16, 0.05) 100%);
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
    }

    .eyebrow {
      margin: 0;
      color: rgba(255,255,255,0.85);
    }

    h1 {
      margin: 0;
      font-family: var(--font-logo-serif);
      font-style: italic;
      font-size: clamp(2.1rem, 5vw, 3.6rem);
      font-weight: 500;
      letter-spacing: -0.02em;
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

    .btn-light {
      background: rgba(255,255,255,0.92);
      color: #111;
      border-color: rgba(255,255,255,0.92);
    }

    .btn-light:hover {
      background: transparent;
      color: #fff;
      border-color: #fff;
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
      background: rgba(255,255,255,0.45);
      cursor: pointer;
      padding: 0;
      transition: width 0.35s ease, background 0.25s ease;
    }

    .dots button.on {
      width: 22px;
      background: #fff;
    }

    @keyframes ken {
      from { transform: scale(1); }
      to { transform: scale(1.08); }
    }

    @media (max-width: 720px) {
      .poster {
        min-height: 420px;
        border-radius: 18px;
      }
    }
  `]
})
export class HeroCarouselComponent implements OnInit, OnDestroy {
  readonly slides: HeroSlide[] = [
    {
      eyebrow: 'Just dropped',
      title: 'Lab-grown & natural diamonds',
      subtitle: 'Rings, earrings, and tennis bracelets selected for everyday brilliance in Lincroft.',
      primaryCta: 'Shop best sellers',
      primaryPath: '/shop',
      secondaryCta: 'Shop rings',
      secondaryPath: '/ring',
      image: IMG.hero
    },
    {
      eyebrow: 'New in',
      title: 'Tennis bracelets that sparkle',
      subtitle: 'Lab-grown diamond tennis bracelets in 14k white, yellow, and rose gold.',
      primaryCta: 'Shop bracelets',
      primaryPath: '/bracelet',
      secondaryCta: 'Shop earrings',
      secondaryPath: '/earring',
      image: IMG.elise.tennisLab
    },
    {
      eyebrow: 'Everyday shine',
      title: 'Engagement & cocktail rings',
      subtitle: 'Marquise, emerald, celestial, and stacking styles from our Lincroft floor.',
      primaryCta: 'Shop rings',
      primaryPath: '/ring',
      secondaryCta: 'Shop pendants',
      secondaryPath: '/pendant',
      image: IMG.elise.marquiseLabY
    }
  ];

  readonly index = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      if (this.paused) return;
      this.index.set((this.index() + 1) % this.slides.length);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  go(i: number): void {
    this.index.set(i);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }
}
