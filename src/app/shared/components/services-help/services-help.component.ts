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
import { AppIconComponent } from '../../icons/lvj-icons';

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
  imports: [RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="help"
      aria-labelledby="help-title"
      (mouseenter)="pause()"
      (mouseleave)="resume()"
      (focusin)="pause()"
      (focusout)="resume()">
      <div class="container grid">
        <div class="copy">
          <p class="kicker">Jewelry services</p>
          <h2 id="help-title">We’re Here To Help</h2>

          <div class="list" role="list">
            @for (item of items(); track item.id; let i = $index) {
              <button
                type="button"
                class="row"
                role="listitem"
                [class.open]="active() === i"
                [attr.aria-expanded]="active() === i"
                (mouseenter)="hoverSelect(i)"
                (mouseleave)="cancelHover()"
                (focus)="select(i)"
                (click)="select(i)">
                <span class="bar" aria-hidden="true"></span>
                <span class="head">
                  <span class="num">{{ pad(i + 1) }}</span>
                  <span class="title">{{ item.title }}</span>
                  <app-icon class="chev" name="chevron-down" [size]="16" [strokeWidth]="1.5"></app-icon>
                </span>
                <span class="body" [class.show]="active() === i">
                  <span class="body-inner">
                    <span class="text">{{ item.body }}</span>
                    @if (active() === i) {
                      <span class="meter" [class.paused]="paused()" aria-hidden="true">
                        @for (_ of [tick()]; track _) {
                          <span class="meter-fill" [style.animationDuration.ms]="intervalMs"></span>
                        }
                      </span>
                    }
                  </span>
                </span>
              </button>
            }
          </div>

          <div class="actions">
            <a routerLink="/contact" class="cta">
              Book an appointment
              <app-icon name="arrow-right" [size]="15" [strokeWidth]="1.5"></app-icon>
            </a>
            @if (showLink()) {
              <a routerLink="/services" class="more">View all services</a>
            }
          </div>
        </div>

        <div class="visual">
          @for (item of items(); track item.id; let i = $index) {
            <img
              [src]="item.imageUrl"
              [alt]="active() === i ? item.title : ''"
              [class.on]="active() === i"
              [attr.aria-hidden]="active() === i ? null : 'true'"
              loading="lazy"
              decoding="async" />
          }
          <span class="frame" aria-hidden="true"></span>
          @if (items()[active()]; as current) {
            <div class="caption" aria-live="polite">
              <span class="caption-count">{{ pad(active() + 1) }} <span>/ {{ pad(items().length) }}</span></span>
              <span class="caption-title">{{ current.title }}</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      --sh-ease: cubic-bezier(0.22, 1, 0.36, 1);
      display: block;
    }

    .help {
      padding: clamp(3.5rem, 6vw, 5.25rem) 0;
      background:
        radial-gradient(ellipse 70% 80% at 100% 20%, color-mix(in srgb, var(--lvj-sky-mid) 70%, transparent), transparent 58%),
        linear-gradient(180deg, var(--lvj-sky), color-mix(in srgb, var(--lvj-sky) 40%, var(--lvj-white)));
    }

    .grid {
      display: grid;
      gap: 2.5rem;
      align-items: stretch;
    }

    @media (min-width: 960px) {
      .grid {
        grid-template-columns: 1fr 1fr;
        gap: clamp(2.5rem, 4.5vw, 4.5rem);
      }
    }

    .kicker {
      margin: 0 0 0.7rem;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--lvj-accent);
    }

    h2 {
      font-family: var(--font-logo-serif);
      font-style: normal;
      font-size: clamp(2.1rem, 3.6vw, 2.9rem);
      font-weight: 600;
      letter-spacing: -0.005em;
      line-height: 1.1;
      margin: 0 0 1.6rem;
      color: var(--lvj-ink);
    }

    /* ── List ─────────────────────────────────────── */
    .list {
      display: grid;
      border-bottom: 1px solid rgba(var(--lvj-overlay), 0.1);
    }

    .row {
      position: relative;
      display: grid;
      width: 100%;
      text-align: left;
      border: 0;
      border-top: 1px solid rgba(var(--lvj-overlay), 0.1);
      background: transparent;
      padding: 1rem 0 1rem 1.1rem;
      margin: 0;
      cursor: pointer;
      color: inherit;
      transition: background 0.35s ease;
    }

    .row.open {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0));
    }

    /* Active indicator on the left edge */
    .bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--lvj-navy);
      transform: scaleY(0);
      transform-origin: top;
      transition: transform 0.45s var(--sh-ease);
    }

    .row.open .bar {
      transform: scaleY(1);
    }

    .head {
      display: grid;
      grid-template-columns: 2.4rem 1fr auto;
      gap: 0.5rem;
      align-items: center;
    }

    .num {
      font-size: 0.74rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      color: var(--lvj-muted-2);
      font-variant-numeric: tabular-nums;
      transition: color 0.3s ease;
    }

    .title {
      font-size: 1.02rem;
      font-weight: 500;
      letter-spacing: 0;
      color: var(--lvj-muted);
      line-height: 1.35;
      transition: color 0.3s ease, transform 0.45s var(--sh-ease);
    }

    .chev {
      display: inline-flex;
      margin-right: 0.4rem;
      color: var(--lvj-muted-2);
      transition: transform 0.45s var(--sh-ease), color 0.3s ease;
    }

    .row:hover .title {
      color: var(--lvj-ink);
      transform: translateX(4px);
    }

    .row.open .title {
      color: var(--lvj-ink);
    }

    .row.open .num {
      color: var(--lvj-accent);
    }

    .row.open .chev {
      transform: rotate(180deg);
      color: var(--lvj-navy);
    }

    .row:focus-visible {
      outline: 2px solid var(--lvj-navy);
      outline-offset: -2px;
    }

    .body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.38s var(--sh-ease);
    }

    .body.show {
      grid-template-rows: 1fr;
    }

    .body-inner {
      display: block;
      overflow: hidden;
      min-height: 0;
    }

    .text {
      display: block;
      padding: 0 1.5rem 0 2.9rem;
      max-width: 52ch;
      font-size: 0.92rem;
      line-height: 1.7;
      color: var(--lvj-muted);
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity 0.35s ease, transform 0.45s var(--sh-ease), padding-top 0.35s ease;
    }

    .body.show .text {
      opacity: 1;
      transform: none;
      padding-top: 0.6rem;
    }

    .meter {
      display: block;
      height: 1px;
      margin: 0.95rem 1.5rem 0.2rem 2.9rem;
      background: rgba(var(--lvj-overlay), 0.12);
      overflow: hidden;
    }

    .meter-fill {
      display: block;
      height: 100%;
      width: 100%;
      transform-origin: left center;
      transform: scaleX(0);
      background: linear-gradient(90deg, var(--lvj-navy), var(--lvj-accent));
      animation: meterFill linear forwards;
    }

    .meter.paused .meter-fill {
      animation-play-state: paused;
    }

    @keyframes meterFill {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }

    /* ── Actions ──────────────────────────────────── */
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem 1.6rem;
      margin-top: 1.8rem;
    }

    .cta {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.9rem 1.5rem;
      background: var(--lvj-navy);
      color: #fff;
      font-size: 0.74rem;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background: var(--lvj-accent);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.5s var(--sh-ease);
      }

      app-icon {
        display: inline-flex;
        transition: transform 0.45s var(--sh-ease);
      }

      &:hover::before,
      &:focus-visible::before {
        transform: scaleX(1);
      }

      &:hover app-icon,
      &:focus-visible app-icon {
        transform: translateX(4px);
      }
    }

    .more {
      font-size: 0.74rem;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--lvj-navy);
      padding-bottom: 3px;
      background-image: linear-gradient(currentColor, currentColor);
      background-size: 100% 1px;
      background-position: 0 100%;
      background-repeat: no-repeat;
      transition: background-size 0.45s var(--sh-ease);

      &:hover {
        background-size: 40% 1px;
      }
    }

    /* ── Visual ───────────────────────────────────── */
    .visual {
      position: relative;
      overflow: hidden;
      min-height: 360px;
      contain: paint;
      background:
        radial-gradient(ellipse 80% 70% at 50% 42%, #f8fbff 0%, transparent 70%),
        linear-gradient(180deg, #e9f0f9 0%, #dbe6f3 100%);
      box-shadow: 0 30px 60px -36px rgba(var(--lvj-overlay), 0.45);
    }

    @media (min-width: 960px) {
      .visual {
        min-height: 540px;
      }
    }

    .visual img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      mix-blend-mode: multiply;
      opacity: 0;
      visibility: hidden;
      transform: scale(1.03);
      /* Inactive photos drop out of compositing once faded */
      transition:
        opacity 0.6s ease,
        transform 0.9s var(--sh-ease),
        visibility 0s linear 0.6s;
    }

    .visual img.on {
      opacity: 1;
      visibility: visible;
      transform: none;
      transition:
        opacity 0.6s ease,
        transform 0.9s var(--sh-ease),
        visibility 0s;
    }

    .frame {
      position: absolute;
      inset: clamp(12px, 1.4vw, 20px);
      border: 1px solid rgba(255, 255, 255, 0.9);
      pointer-events: none;
    }

    .caption {
      position: absolute;
      left: clamp(12px, 1.4vw, 20px);
      bottom: clamp(12px, 1.4vw, 20px);
      display: grid;
      gap: 0.3rem;
      max-width: min(340px, calc(100% - 3rem));
      padding: 1.1rem 1.35rem 1.2rem;
      background: rgba(var(--lvj-overlay), 0.94);
      color: #fff;
      animation: captionIn 0.6s var(--sh-ease);
    }

    .caption-count {
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      color: #9fc0e6;
      font-variant-numeric: tabular-nums;

      span {
        color: rgba(238, 243, 249, 0.5);
      }
    }

    .caption-title {
      font-family: var(--font-logo-serif);
      font-size: clamp(1.25rem, 1.7vw, 1.55rem);
      font-weight: 600;
      line-height: 1.15;
    }

    @keyframes captionIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .meter { display: none; }
      .meter-fill { animation: none; }
      .body, .text, .title, .bar, .visual img, .cta::before { transition: none; }
      .caption { animation: none; }
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
  readonly paused = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
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
    this.cancelHover();
    this.observer?.disconnect();
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  select(i: number): void {
    this.cancelHover();
    if (this.active() === i) return;
    this.active.set(i);
    if (this.visible) this.startCycle();
  }

  /** Hover intent: only switch if the pointer rests on a row briefly. */
  hoverSelect(i: number): void {
    this.cancelHover();
    if (this.active() === i) return;
    this.hoverTimer = setTimeout(() => this.select(i), 140);
  }

  cancelHover(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  /** Auto-cycling stops while the visitor is reading or interacting. */
  pause(): void {
    if (this.paused()) return;
    this.paused.set(true);
    this.clear();
  }

  resume(): void {
    if (!this.paused()) return;
    const el = this.host.nativeElement as HTMLElement;
    if (el.matches(':hover') || el.contains(document.activeElement)) return;
    this.paused.set(false);
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
    if (!this.visible || this.paused() || this.reducedMotion() || this.items().length < 2) return;
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
