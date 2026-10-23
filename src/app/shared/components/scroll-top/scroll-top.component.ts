import { Component, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { AppIconComponent } from '../../icons/lvj-icons';

@Component({
  selector: 'app-scroll-top',
  imports: [AppIconComponent],
  template: `
    @if (visible()) {
      <button type="button" class="top" aria-label="Back to top" (click)="go()">
        <app-icon name="arrow-up" [size]="18" [strokeWidth]="1.6"></app-icon>
      </button>
    }
  `,
  styles: [`
    .top {
      position: fixed;
      right: 1.25rem;
      bottom: 5.4rem;
      z-index: 55;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 12px;
      background: var(--lvj-navy);
      color: var(--lvj-on-ink);
      cursor: pointer;
      display: grid;
      place-items: center;
      box-shadow: 0 10px 24px rgba(var(--lvj-overlay), 0.22);
      animation: rise 0.3s var(--lvj-ease);
      transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
    }
    .top:hover {
      transform: translateY(-2px);
      background: var(--lvj-ink);
      box-shadow: 0 14px 28px rgba(var(--lvj-overlay), 0.28);
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  `]
})
export class ScrollTopComponent implements OnDestroy {
  readonly visible = signal(false);

  /** Passive listener outside Angular; only touches the signal when it flips. */
  private readonly onScroll = () => {
    const show = window.scrollY > 480;
    if (show !== this.visible()) this.visible.set(show);
  };

  constructor() {
    inject(NgZone).runOutsideAngular(() =>
      window.addEventListener('scroll', this.onScroll, { passive: true })
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  go(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
