import { Component, HostListener, signal } from '@angular/core';
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
      background: #111;
      color: #fff;
      cursor: pointer;
      display: grid;
      place-items: center;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
      animation: rise 0.3s var(--lvj-ease);
      transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
    }
    .top:hover {
      transform: translateY(-2px);
      background: #000;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  `]
})
export class ScrollTopComponent {
  readonly visible = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.visible.set(window.scrollY > 480);
  }

  go(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
