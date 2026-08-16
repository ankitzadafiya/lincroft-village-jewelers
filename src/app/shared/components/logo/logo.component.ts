import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

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
      <span class="diamond" aria-hidden="true"></span>
      <span class="wordmark">
        <span class="top">Lincroft</span>
        <span class="script">Village</span>
        <span class="rule" aria-hidden="true"></span>
        <span class="bottom">Jewelers</span>
      </span>
    </a>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      color: #111;
      text-decoration: none;
      transition: opacity 0.28s ease;
    }

    .logo:hover {
      opacity: 0.7;
    }

    .logo.light {
      color: #fff;
    }

    .diamond {
      width: 14px;
      height: 14px;
      border: 1.4px solid currentColor;
      transform: rotate(45deg);
      flex-shrink: 0;
      margin-top: 0.15rem;
      opacity: 0.9;
    }

    .compact .diamond {
      width: 11px;
      height: 11px;
    }

    .wordmark {
      display: grid;
      justify-items: center;
      gap: 0;
      line-height: 1;
      text-align: center;
    }

    .left .wordmark {
      justify-items: start;
      text-align: left;
    }

    .top {
      font-family: var(--font-logo-serif);
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: none;
      margin-bottom: -0.12rem;
    }

    .script {
      font-family: var(--font-logo-script);
      font-size: 1.55rem;
      font-weight: 400;
      letter-spacing: 0.01em;
      line-height: 0.9;
      padding-right: 0.15rem;
    }

    .rule {
      display: block;
      width: 100%;
      height: 1px;
      background: currentColor;
      opacity: 0.35;
      margin: 0.28rem 0 0.22rem;
    }

    .bottom {
      font-family: var(--font-logo-serif);
      font-size: 0.58rem;
      font-weight: 600;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      padding-left: 0.28em;
    }

    .compact .top {
      font-size: 0.64rem;
    }

    .compact .script {
      font-size: 1.28rem;
    }

    .compact .bottom {
      font-size: 0.52rem;
      letter-spacing: 0.24em;
    }

    @media (max-width: 640px) {
      .script {
        font-size: 1.35rem;
      }
    }
  `]
})
export class LogoComponent {
  readonly tone = input<'dark' | 'light'>('dark');
  readonly compact = input(false);
  readonly align = input<'center' | 'left'>('left');
}
