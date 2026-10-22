import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceOffering } from '../../../core/models';
import { ContentService } from '../../../core/services/content.service';
import { IMG } from '../../../core/mock/image-catalog';
import { AppIconComponent } from '../../icons/lvj-icons';
import { ServiceSceneComponent, ServiceSceneKind } from '../service-scene/service-scene.component';

interface HelpItem {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
}

/** Which animated scene illustrates each service (by slug). */
const SCENES: Record<string, ServiceSceneKind> = {
  'jewelry-repair': 'repair',
  'gold-buying': 'gold',
  'watch-repair': 'watch',
  'jewelry-appraisal': 'appraisal',
  'battery-links': 'battery',
  'estate-consulting': 'estate'
};

const FALLBACK: HelpItem[] = [
  {
    id: 'jewelry-repair',
    title: 'Jewelry Repair & Cleaning',
    body: 'Bring back the shine of the pieces you love. From prong retipping to ultrasonic cleaning, every piece is checked before it leaves our bench.',
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
    body: 'Most battery replacements and bracelet link adjustments are completed while you wait, so you leave with a watch that fits and keeps time.',
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
  imports: [RouterLink, AppIconComponent, ServiceSceneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="help"
      aria-labelledby="help-title"
      (mouseenter)="pause()"
      (mouseleave)="resume()"
      (focusin)="pause()"
      (focusout)="resume()">
      <header class="head container">
        <p class="kicker">We’re here to help</p>
        <h2 id="help-title">Jewelry services</h2>
        <p class="sub">Six ways our Lincroft team looks after your jewelry, from a quick clean to a full estate plan.</p>
      </header>

      <div class="container grid">
        <!-- Animated stage -->
        <div class="stage" [class.is-paused]="paused()">
          <div class="stage-top">
            <span class="stage-step">Step {{ pad(active() + 1) }} <span>/ {{ pad(items().length) }}</span></span>
            <button
              type="button"
              class="stage-toggle"
              [attr.aria-label]="paused() ? 'Play the service animation' : 'Pause the service animation'"
              [attr.aria-pressed]="paused()"
              (click)="togglePlay()">
              <app-icon [name]="paused() ? 'play' : 'pause'" [size]="12" [strokeWidth]="2"></app-icon>
            </button>
          </div>
          <div class="stage-art">
            @for (key of [sceneKey()]; track key) {
              <app-service-scene [kind]="sceneOf(items()[active()])" [duration]="intervalMs / 1000" />
            }
          </div>
          @if (items()[active()]; as current) {
            <p class="stage-title" aria-live="polite">{{ current.title }}</p>
          }
          <div class="segments" aria-hidden="true">
            @for (item of items(); track item.id; let i = $index) {
              <span class="seg" [class.done]="i < active()" [class.on]="i === active()">
                @if (i === active()) {
                  @for (_ of [tick()]; track _) {
                    <span class="seg-fill" [style.animationDuration.ms]="intervalMs"></span>
                  }
                }
              </span>
            }
          </div>
        </div>

        <!-- Steps -->
        <div class="copy">
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
                <span class="head-row">
                  <span class="num">{{ pad(i + 1) }}</span>
                  <span class="title">{{ item.title }}</span>
                  <app-icon class="chev" name="chevron-down" [size]="16" [strokeWidth]="1.5"></app-icon>
                </span>
                <span class="body" [class.show]="active() === i">
                  <span class="body-inner">
                    <span class="text">{{ item.body }}</span>
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
      </div>
    </section>
  `,
  styles: [`
    :host {
      --sh-ease: cubic-bezier(0.22, 1, 0.36, 1);
      display: block;
    }

    .help {
      padding: clamp(3.5rem, 6vw, 6rem) 0;
      background:
        radial-gradient(ellipse 70% 80% at 100% 20%, color-mix(in srgb, var(--lvj-sky-mid) 70%, transparent), transparent 58%),
        linear-gradient(180deg, var(--lvj-sky), color-mix(in srgb, var(--lvj-sky) 40%, var(--lvj-white)));
    }

    /* ── Centred heading (same scale as "Our Categories") ── */
    .head {
      text-align: center;
      margin-bottom: clamp(2.2rem, 4vw, 3.5rem);
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
      margin: 0;
      font-family: var(--font-logo-serif);
      font-weight: 600;
      font-size: clamp(2.2rem, 3.8vw, 3.3rem);
      line-height: 1.05;
      color: var(--lvj-ink);
    }

    .sub {
      margin: 1rem auto 0;
      max-width: 58ch;
      font-size: clamp(0.95rem, 1.1vw, 1.05rem);
      line-height: 1.7;
      font-weight: 400;
      color: var(--lvj-muted);
    }

    .grid {
      display: grid;
      gap: clamp(1.75rem, 3vw, 2.5rem);
      align-items: center;
    }

    @media (min-width: 960px) {
      .grid {
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
        gap: clamp(2.5rem, 4.5vw, 4.5rem);
      }
    }

    /* ── Stage ─────────────────────────────────── */
    .stage {
      position: relative;
      display: grid;
      grid-template-rows: auto 1fr auto auto;
      gap: 0.6rem;
      padding: clamp(1.1rem, 2vw, 1.6rem);
      border-radius: 20px;
      color: #fff;
      overflow: hidden;
      isolation: isolate;
      aspect-ratio: 5 / 4;
      background:
        radial-gradient(ellipse 60% 55% at 50% 55%, rgba(74, 128, 194, 0.38), transparent 70%),
        radial-gradient(ellipse 50% 60% at 100% 0%, rgba(74, 128, 194, 0.22), transparent 70%),
        linear-gradient(160deg, #0c2346 0%, #0a1d3a 60%, #081831 100%);
      box-shadow: 0 34px 70px -40px rgba(var(--lvj-overlay), 0.65);
    }

    /* soft spotlight floor */
    .stage::after {
      content: '';
      position: absolute;
      left: 12%;
      right: 12%;
      bottom: 16%;
      height: 22%;
      z-index: -1;
      background: radial-gradient(ellipse at center, rgba(159, 192, 230, 0.18), transparent 70%);
    }

    .stage-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stage-toggle {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      cursor: pointer;
      transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;

      app-icon {
        display: inline-flex;
      }

      &:hover {
        background: #fff;
        border-color: #fff;
        color: var(--lvj-navy);
      }

      &:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }
    }

    .stage-step {
      font-size: 0.72rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #cfe0f4;
      font-variant-numeric: tabular-nums;

      span {
        color: rgba(207, 224, 244, 0.5);
      }
    }

    .stage-art {
      position: relative;
      min-height: 0;
    }

    /* the drawing always fits its row, never under the title */
    .stage-art app-service-scene {
      position: absolute;
      inset: 0;
      animation: scene-in 0.6s var(--sh-ease);
    }

    @keyframes scene-in {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: none; }
    }

    .is-paused app-service-scene ::ng-deep * {
      animation-play-state: paused !important;
    }

    .stage-title {
      margin: 0;
      text-align: center;
      font-family: var(--font-logo-serif);
      font-size: clamp(1.3rem, 1.9vw, 1.7rem);
      font-weight: 600;
      line-height: 1.15;
    }

    .segments {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
      padding-top: 0.4rem;
    }

    .seg {
      position: relative;
      height: 3px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.16);
      overflow: hidden;
    }

    .seg.done {
      background: rgba(255, 255, 255, 0.55);
    }

    .seg-fill {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, #cfe0f4, #fff);
      transform-origin: left center;
      animation: fill linear forwards;
    }

    .is-paused .seg-fill {
      animation-play-state: paused;
    }

    @keyframes fill {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }

    /* ── Step list ─────────────────────────────── */
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
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
    }

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

    .head-row {
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
      font-size: 1.04rem;
      font-weight: 500;
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
      max-width: 54ch;
      font-size: 0.92rem;
      line-height: 1.7;
      color: var(--lvj-muted);
      opacity: 0;
      transition: opacity 0.35s ease, padding-top 0.35s ease;
    }

    .body.show .text {
      opacity: 1;
      padding-top: 0.55rem;
    }

    /* ── Actions ───────────────────────────────── */
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

    @media (max-width: 959px) {
      .stage {
        aspect-ratio: 4 / 3.4;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .body, .text, .title, .bar, .cta::before, .stage-art app-service-scene {
        transition: none;
        animation: none;
      }
      .seg-fill {
        animation: none;
      }
    }
  `]
})
export class ServicesHelpComponent implements OnInit, OnDestroy {
  private readonly content = inject(ContentService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly intervalMs = 4000;

  readonly showLink = input(true);
  readonly active = signal(0);
  readonly items = signal<HelpItem[]>(FALLBACK);
  readonly tick = signal(0);
  readonly paused = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private visible = false;
  private seen = false;
  /** Set by the pause button; hover never resumes it. */
  private userStopped = false;
  /** Hover-to-pause turns off once the visitor explicitly presses play. */
  private hoverPause = true;
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

  /** Changes on every step change so the scene restarts from its first frame. */
  readonly sceneKey = computed(() => this.active());

  sceneOf(item: HelpItem | undefined): ServiceSceneKind {
    return (item && SCENES[item.id]) || 'repair';
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
  /** Pause/play button: an explicit choice that hover won't override. */
  togglePlay(): void {
    if (this.paused()) {
      this.userStopped = false;
      this.hoverPause = false;
      this.paused.set(false);
      if (this.visible) this.startCycle();
    } else {
      this.userStopped = true;
      this.paused.set(true);
      this.clear();
    }
  }

  pause(): void {
    if (!this.hoverPause || this.paused()) return;
    this.paused.set(true);
    this.clear();
  }

  resume(): void {
    if (this.userStopped || !this.paused()) return;
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
        if (this.visible && !this.seen) {
          // First arrival: always start the story at step 1
          this.seen = true;
          this.active.set(0);
        }
        if (this.visible) this.startCycle();
        else this.clear();
      },
      { rootMargin: '0px', threshold: 0.35 }
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
