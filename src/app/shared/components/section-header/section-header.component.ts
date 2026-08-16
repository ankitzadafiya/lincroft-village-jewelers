import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LvjIconsModule } from '../../icons/lvj-icons';

@Component({
  selector: 'app-section-header',
  imports: [RouterLink, LvjIconsModule],
  template: `
    <div class="head" [class.center]="align() === 'center'">
      <div>
        @if (eyebrow()) {
          <p class="eyebrow">{{ eyebrow() }}</p>
        }
        <h2>{{ title() }}</h2>
        @if (subtitle()) {
          <p class="muted">{{ subtitle() }}</p>
        }
      </div>
      @if (link()) {
        <a class="link" [routerLink]="link()">
          {{ linkLabel() }}
          <lucide-icon name="arrow-right" [size]="14" [strokeWidth]="1.6"></lucide-icon>
        </a>
      }
    </div>
  `,
  styles: [`
    .head {
      display: flex;
      justify-content: space-between;
      gap: 1.25rem;
      align-items: end;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
    }
    .head.center {
      text-align: center;
      justify-content: center;
      flex-direction: column;
      align-items: center;
    }
    h2 {
      font-family: var(--font-logo-serif);
      font-style: italic;
      font-size: clamp(1.85rem, 3.4vw, 2.7rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      max-width: 16ch;
      line-height: 1.12;
    }
    .muted {
      max-width: 46ch;
      margin-top: 0.55rem;
      font-size: 0.95rem;
    }
    .link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.86rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      border-bottom: 1px solid currentColor;
      padding-bottom: 2px;
      transition: gap 0.3s var(--lvj-ease), opacity 0.25s ease;
    }
    .link:hover {
      gap: 0.65rem;
      opacity: 0.55;
    }
  `]
})
export class SectionHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly align = input<'left' | 'center'>('left');
  readonly link = input<string | null>(null);
  readonly linkLabel = input('View all');
}
