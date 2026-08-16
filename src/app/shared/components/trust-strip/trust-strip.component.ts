import { Component } from '@angular/core';

@Component({
  selector: 'app-trust-strip',
  template: `
    <section class="trust" aria-label="Assurances">
      <div class="container row">
        @for (item of items; track item.title) {
          <div class="item">
            <span class="icon" aria-hidden="true">{{ item.mark }}</span>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.copy }}</p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .trust {
      border-block: 1px solid var(--lvj-line);
      background: var(--lvj-ivory);
      padding: 1.5rem 0;
    }
    .row {
      display: grid;
      gap: 1.25rem 1.5rem;
      grid-template-columns: 1fr;
    }
    .item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.85rem;
      align-items: start;
    }
    .icon {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(26, 24, 20, 0.16);
      font-size: 0.7rem;
      letter-spacing: 0;
      color: var(--lvj-gold-deep);
      margin-top: 0.1rem;
    }
    strong {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 0.2rem;
    }
    p {
      color: var(--lvj-muted);
      font-size: 0.86rem;
      line-height: 1.45;
      max-width: 28ch;
    }
    @media (min-width: 768px) {
      .row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1100px) {
      .row { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
    }
  `]
})
export class TrustStripComponent {
  readonly items = [
    { mark: '◆', title: 'Certified stones', copy: 'GIA / IGI documentation when available.' },
    { mark: '◇', title: 'Lifetime guarantee', copy: 'Craftsmanship backed by our atelier.' },
    { mark: '○', title: 'Private appointments', copy: 'Book a quiet consultation in Lincroft.' },
    { mark: '▢', title: 'Custom & repair', copy: 'From first sketch to lifelong care.' }
  ];
}
