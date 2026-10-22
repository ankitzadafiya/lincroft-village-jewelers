import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Text-only wordmark (no symbol): "LINCROFT" set in the heading serif,
 * with "VILLAGE JEWELERS" spaced out to the same width underneath.
 */
@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a
      routerLink="/"
      class="logo"
      [class.compact]="compact()"
      [class.left]="align() === 'left'"
      [class.light]="tone() === 'light'"
      aria-label="Lincroft Village Jewelers home">
      <span class="wordmark" aria-hidden="true">
        <span class="name">Lincroft</span>
        <span class="sub" aria-hidden="true">
          @for (ch of subLetters; track $index) {
            <span>{{ ch }}</span>
          }
        </span>
      </span>
    </a>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      color: var(--lvj-ink);
      text-decoration: none;
      transition: opacity 0.28s ease, color 0.25s ease;
    }

    .logo:hover {
      opacity: 0.72;
    }

    .logo.light {
      color: var(--lvj-on-inverse);
    }

    .wordmark {
      display: inline-grid;
      gap: 0.3rem;
      line-height: 1;
      text-align: center;
    }

    .name {
      font-family: var(--font-logo-serif);
      font-size: 1.6rem;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      /* trailing letter-spacing would push the word off-centre */
      margin-right: -0.16em;
    }

    /* Letters spread evenly across exactly the width of the name */
    .sub {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-sans, inherit);
      font-size: 0.56rem;
      font-weight: 500;
      text-transform: uppercase;
      opacity: 0.8;
    }

    .compact .name {
      font-size: 1.32rem;
    }

    .compact .sub {
      font-size: 0.5rem;
    }

    .compact .wordmark {
      gap: 0.24rem;
    }

    @media (max-width: 640px) {
      .name {
        font-size: 1.3rem;
      }

      .sub {
        font-size: 0.48rem;
      }
    }
  `]
})
export class LogoComponent {
  readonly tone = input<'dark' | 'light'>('dark');
  readonly compact = input(false);
  readonly align = input<'center' | 'left'>('left');

  /** "VILLAGE JEWELERS" one letter per span; the space becomes a wider gap. */
  readonly subLetters = 'Village\u00a0\u00a0Jewelers'.split('');
}
