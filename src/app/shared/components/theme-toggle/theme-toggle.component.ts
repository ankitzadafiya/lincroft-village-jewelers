import { Component, inject, input } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { AppIconComponent } from '../../icons/lvj-icons';

@Component({
  selector: 'app-theme-toggle',
  imports: [AppIconComponent],
  template: `
    <button
      type="button"
      class="theme-toggle"
      [class.compact]="compact()"
      [class.icon-tip]="compact()"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.data-tip]="theme.isDark() ? 'Light mode' : 'Dark mode'">
      <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="size()" [strokeWidth]="1.5"></app-icon>
      @if (showLabel()) {
        <span>{{ theme.isDark() ? 'Light' : 'Dark' }}</span>
      }
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--lvj-ink);
      cursor: pointer;
      font-family: var(--font-body);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
    }
    .theme-toggle:hover {
      background: rgba(17, 17, 17, 0.06);
      transform: translateY(-1px);
    }
    :host-context([data-theme='dark']) .theme-toggle:hover {
      background: rgba(247, 243, 236, 0.08);
    }
    .theme-toggle:not(.compact) {
      width: auto;
      min-height: 40px;
      padding: 0 0.9rem;
      border-radius: 999px;
      border: 1px solid var(--lvj-line-strong);
      background: var(--lvj-panel);
    }
  `]
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  readonly compact = input(true);
  readonly showLabel = input(false);
  readonly size = input(19);
}
