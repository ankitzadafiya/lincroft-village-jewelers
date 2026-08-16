import { Component, OnDestroy, effect, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceOffering } from '../../../core/models';

@Component({
  selector: 'app-services-showcase',
  imports: [RouterLink],
  template: `
    <section class="wrap section">
      <div class="container layout">
        <div class="copy" (mouseleave)="resume()">
          <p class="eyebrow">Jewelry Services</p>
          <h2>We’re Here To Help</h2>
          <div class="list">
            @for (service of services(); track service.id; let i = $index) {
              <button
                type="button"
                class="item"
                [class.active]="i === active()"
                (mouseenter)="hoverSelect(i)"
                (focus)="hoverSelect(i)"
                (click)="hoverSelect(i)">
                <div class="title">{{ padded(i) }}. {{ service.title }}</div>
                <div class="detail" [class.open]="i === active()">
                  <p>{{ service.description }}</p>
                </div>
              </button>
            }
          </div>
          <a routerLink="/services" class="btn btn-ghost">View all services</a>
        </div>
        <div class="visual" (mouseenter)="pause()" (mouseleave)="resume()">
          @for (service of services(); track service.id; let i = $index) {
            <img
              [src]="service.imageUrl"
              [alt]="service.title"
              [class.on]="i === active()"
              loading="lazy" />
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .wrap { background: #fff; padding-top: 5rem; padding-bottom: 5rem; }
    .layout { display: grid; gap: 2.5rem; }
    h2 {
      font-family: var(--font-logo-serif);
      font-style: italic;
      font-size: clamp(2rem, 3.8vw, 3rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      margin-bottom: 1.75rem;
      line-height: 1.12;
    }
    .list { display: grid; margin-bottom: 1.75rem; }
    .item {
      text-align: left;
      background: transparent;
      border: 0;
      border-top: 1px solid rgba(0,0,0,0.08);
      padding: 1.2rem 0;
      cursor: pointer;
      color: inherit;
      width: 100%;
    }
    .item:last-child { border-bottom: 1px solid rgba(0,0,0,0.08); }
    .title {
      font-size: 1.05rem;
      font-weight: 500;
      color: #8a8a8a;
      transition: color 0.3s ease, transform 0.35s var(--lvj-ease);
    }
    .item:hover .title,
    .item.active .title {
      color: #111;
      transform: translateX(4px);
    }
    .detail {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.45s var(--lvj-ease);
    }
    .detail.open { grid-template-rows: 1fr; }
    .detail > p {
      overflow: hidden;
      margin: 0;
      color: #666;
      font-size: 0.92rem;
      max-width: 46ch;
      line-height: 1.65;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.35s ease, transform 0.35s var(--lvj-ease), margin 0.35s ease;
    }
    .detail.open > p {
      opacity: 1;
      transform: translateY(0);
      margin-top: 0.75rem;
    }
    .visual {
      position: relative;
      min-height: 380px;
      background: #f3f3f3;
      overflow: hidden;
    }
    .visual img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transform: scale(1.04);
      transition: opacity 0.55s ease, transform 0.8s var(--lvj-ease);
    }
    .visual img.on {
      opacity: 1;
      transform: scale(1);
    }
    @media (min-width: 980px) {
      .layout {
        grid-template-columns: 0.95fr 1.05fr;
        gap: 4rem;
        align-items: center;
      }
      .visual { min-height: 580px; }
    }
  `]
})
export class ServicesShowcaseComponent implements OnDestroy {
  readonly services = input<ServiceOffering[]>([]);
  readonly active = signal(0);
  readonly intervalMs = 4800;
  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;

  constructor() {
    effect(() => {
      if (this.services().length) {
        this.active.set(0);
        this.start();
      }
    });
  }

  current(): ServiceOffering | null {
    return this.services()[this.active()] ?? null;
  }

  padded(i: number): string {
    return String(i + 1).padStart(2, '0');
  }

  hoverSelect(index: number): void {
    this.active.set(index);
    this.pause();
  }

  pause(): void {
    this.paused = true;
    this.clear();
  }

  resume(): void {
    this.paused = false;
    this.start();
  }

  ngOnDestroy(): void {
    this.clear();
  }

  private start(): void {
    this.clear();
    if (this.paused || this.services().length < 2) return;
    this.timer = setInterval(() => {
      this.active.set((this.active() + 1) % this.services().length);
    }, this.intervalMs);
  }

  private clear(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
