import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceOffering } from '../../../core/models';
import { ContentService } from '../../../core/services/content.service';
import { IMG } from '../../../core/mock/image-catalog';

interface HelpItem {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
}

const FALLBACK: HelpItem[] = [
  {
    id: 'jewelry-repair',
    title: 'Jewelry Repair & Cleaning',
    body: 'Restore the beauty and integrity of your cherished pieces — from prong retipping to professional ultrasonic cleaning, every piece is inspected before it leaves the bench.',
    imageUrl: IMG.serviceRepair
  },
  {
    id: 'gold-buying',
    title: 'We Buy Gold',
    body: 'Turn your unwanted gold into cash with our We Buy Gold services, where we offer competitive prices and a hassle-free experience for all your gold jewelry, coins, and bullion.',
    imageUrl: IMG.serviceGold
  },
  {
    id: 'watch-repair',
    title: 'Watch Repairs',
    body: 'Same-visit battery replacement and bracelet sizing when parts allow. Mechanical service is coordinated with trusted specialists.',
    imageUrl: IMG.serviceWatch
  },
  {
    id: 'jewelry-appraisal',
    title: 'Appraisals',
    body: 'Written appraisals prepared with current market context. Appointments recommended for multiple items.',
    imageUrl: IMG.serviceAppraisal
  },
  {
    id: 'battery-links',
    title: 'Same Day Watch Battery Replacement & Link Adjustments',
    body: 'Most battery replacements and bracelet link adjustments are completed while you wait — so you leave with a watch that fits and keeps time.',
    imageUrl: IMG.serviceWatch
  },
  {
    id: 'estate-consulting',
    title: 'Estate Jewelry Consulting',
    body: 'Our experts provide guidance on rough valuations and help establish a clear, informed plan for asset distribution. This service is tailored specifically for jewelry-only estates.',
    imageUrl: IMG.serviceAppraisal
  }
];

@Component({
  selector: 'app-services-help',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="help">
      <div class="container grid">
        <div class="copy">
          <p class="eyebrow">Jewelry Services</p>
          <h2>We’re Here To Help</h2>

          <div class="list" role="list">
            @for (item of items(); track item.id; let i = $index) {
              <button
                type="button"
                class="row"
                role="listitem"
                [class.open]="active() === i"
                [attr.aria-expanded]="active() === i"
                (mouseenter)="select(i)"
                (focus)="select(i)"
                (click)="select(i)">
                <div class="head">
                  <span class="num">{{ pad(i + 1) }}.</span>
                  <span class="title">{{ item.title }}</span>
                </div>
                <div class="body" [class.show]="active() === i">
                  <div class="body-inner">
                    <p>{{ item.body }}</p>
                    @if (active() === i) {
                      <span class="meter" aria-hidden="true">
                        @for (_ of [tick()]; track _) {
                          <span class="meter-fill" [style.animationDuration.ms]="intervalMs"></span>
                        }
                      </span>
                    }
                  </div>
                </div>
              </button>
            }
          </div>

          @if (showLink()) {
            <a routerLink="/services" class="more">View all services</a>
          }
        </div>

        <div class="visual">
          @if (items()[active()]; as current) {
            <img [src]="current.imageUrl" [alt]="current.title" decoding="async" />
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .help {
      padding: 4.75rem 0;
      background:
        radial-gradient(ellipse 70% 80% at 100% 20%, color-mix(in srgb, var(--lvj-sky-mid) 70%, transparent), transparent 58%),
        linear-gradient(180deg, var(--lvj-sky), color-mix(in srgb, var(--lvj-sky) 40%, var(--lvj-white)));
      content-visibility: auto;
      contain-intrinsic-size: 720px;
    }

    .grid {
      display: grid;
      gap: 2.5rem;
      align-items: stretch;
    }

    @media (min-width: 960px) {
      .grid {
        grid-template-columns: 1.05fr 0.95fr;
        gap: 4rem;
      }
    }

    .eyebrow {
      margin-bottom: 0.75rem;
    }

    h2 {
      font-family: var(--font-body);
      font-style: normal;
      font-size: clamp(1.85rem, 3.4vw, 2.55rem);
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 1.75rem;
      color: var(--lvj-ink);
    }

    .list {
      display: grid;
    }

    .row {
      display: grid;
      width: 100%;
      text-align: left;
      border: 0;
      border-top: 1px solid color-mix(in srgb, var(--lvj-navy) 12%, transparent);
      background: transparent;
      padding: 1.1rem 0;
      margin: 0;
      cursor: pointer;
      color: inherit;
    }

    .row:last-child {
      border-bottom: 1px solid color-mix(in srgb, var(--lvj-navy) 12%, transparent);
    }

    .head {
      display: grid;
      grid-template-columns: 2.6rem 1fr;
      gap: 0.45rem;
      align-items: baseline;
    }

    .num {
      font-family: var(--font-body);
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--lvj-muted);
      font-variant-numeric: tabular-nums;
    }

    .title {
      font-family: var(--font-body);
      font-size: 1.05rem;
      font-weight: 600;
      font-style: normal;
      letter-spacing: -0.01em;
      color: var(--lvj-muted);
      line-height: 1.3;
      transition: color 0.2s ease;
    }

    .row.open .title,
    .row:hover .title,
    .row.open .num {
      color: var(--lvj-ink);
    }

    .body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.28s ease;
    }

    .body.show {
      grid-template-rows: 1fr;
    }

    .body-inner {
      overflow: hidden;
      min-height: 0;
    }

    .body p {
      margin: 0;
      padding: 0 0 0 3.05rem;
      max-width: 48ch;
      font-family: var(--font-body);
      font-size: 0.92rem;
      line-height: 1.65;
      color: var(--lvj-muted);
      opacity: 0;
      transition: opacity 0.25s ease, padding-top 0.3s ease;
    }

    .body.show p {
      opacity: 1;
      padding-top: 0.75rem;
    }

    .meter {
      display: block;
      height: 2px;
      margin: 0.95rem 0 0.15rem 3.05rem;
      background: color-mix(in srgb, var(--lvj-navy) 12%, transparent);
      overflow: hidden;
      transform: translateZ(0);
    }

    .meter-fill {
      display: block;
      height: 100%;
      width: 100%;
      transform-origin: left center;
      transform: scaleX(0);
      background: var(--lvj-ink);
      animation: meterFill linear forwards;
      will-change: transform;
    }

    @keyframes meterFill {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .meter { display: none; }
      .meter-fill { animation: none; }
      .body { transition: none; }
    }

    .more {
      display: inline-flex;
      margin-top: 1.5rem;
      font-family: var(--font-body);
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--lvj-navy);
      border-bottom: 1px solid currentColor;
      padding-bottom: 2px;
      width: fit-content;
    }

    .visual {
      border-radius: 4px;
      overflow: hidden;
      background: var(--lvj-sky-mid);
      min-height: 360px;
      position: relative;
      contain: paint;
    }

    @media (min-width: 960px) {
      .visual {
        min-height: 560px;
      }
    }

    .visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      inset: 0;
    }
  `]
})
export class ServicesHelpComponent implements OnInit, OnDestroy {
  private readonly content = inject(ContentService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly intervalMs = 3400;

  readonly showLink = input(true);
  readonly active = signal(0);
  readonly items = signal<HelpItem[]>(FALLBACK);
  readonly tick = signal(0);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private visible = false;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.watchVisibility();
    this.content.services().subscribe({
      next: list => {
        const bySlug = new Map(list.map(s => [s.slug, s]));
        const merged = FALLBACK.map(item => {
          const fromApi = bySlug.get(item.id);
          return fromApi ? this.fromApi(fromApi, item) : item;
        });
        this.items.set(merged);
        if (this.visible) this.startCycle();
      },
      error: () => {
        if (this.visible) this.startCycle();
      }
    });
  }

  ngOnDestroy(): void {
    this.clear();
    this.observer?.disconnect();
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  select(i: number): void {
    if (this.active() === i) return;
    this.active.set(i);
    if (this.visible) this.startCycle();
  }

  private fromApi(service: ServiceOffering, fallback: HelpItem): HelpItem {
    if (fallback.id === 'gold-buying' || fallback.id === 'estate-consulting' || fallback.id === 'battery-links') {
      return {
        ...fallback,
        imageUrl: service.imageUrl || fallback.imageUrl
      };
    }
    return {
      id: fallback.id,
      title: service.title || fallback.title,
      body: service.description || service.summary || fallback.body,
      imageUrl: service.imageUrl || fallback.imageUrl
    };
  }

  private watchVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.visible = true;
      this.startCycle();
      return;
    }
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.startCycle();
        else this.clear();
      },
      { rootMargin: '80px 0px', threshold: 0.12 }
    );
    this.observer.observe(this.host.nativeElement);
  }

  private startCycle(): void {
    this.clear();
    this.tick.update(n => n + 1);
    if (!this.visible || this.reducedMotion() || this.items().length < 2) return;
    this.timer = setTimeout(() => {
      this.active.set((this.active() + 1) % this.items().length);
      this.startCycle();
    }, this.intervalMs);
  }

  private clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private reducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
