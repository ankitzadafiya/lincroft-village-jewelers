import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AppIconComponent } from '../../icons/lvj-icons';
import { DescriptionSection, parseDescription } from './description-parser';

/**
 * Renders a product description written with the simple rules in
 * `description-parser.ts`: intro paragraph, then one card per CAPITALS section.
 */
@Component({
  selector: 'app-product-description',
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (parsed(); as d) {
      @if (d.intro.length) {
        <div class="pd-intro">
          @for (p of d.intro; track $index) {
            <p>{{ p }}</p>
          }
        </div>
      }

      @if (cards().length) {
        <div class="pd-grid" [class.compact]="compact()">
          @for (s of cards(); track $index) {
            <section class="pd-card" [class.wide]="isWide(s)" [class.note]="isNote(s)">
              @if (s.title) {
                <header class="pd-head">
                  <span class="pd-icon" aria-hidden="true">
                    <app-icon [name]="iconFor(s)" [size]="16" [strokeWidth]="1.7" />
                  </span>
                  <h3>{{ s.title }}</h3>
                </header>
              }

              @for (b of s.blocks; track $index) {
                @switch (b.type) {
                  @case ('rows') {
                    <dl class="pd-rows">
                      @for (r of b.rows; track $index) {
                        <div>
                          <dt>{{ r.label }}</dt>
                          <dd>{{ r.value }}</dd>
                        </div>
                      }
                    </dl>
                  }
                  @case ('list') {
                    <ul class="pd-list">
                      @for (item of b.items; track $index) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  }
                  @case ('sub') {
                    <p class="pd-sub">{{ b.text }}</p>
                  }
                  @default {
                    <p class="pd-p">
                      @if (b.type === 'p' && b.label) { <strong>{{ b.label }}:</strong> }
                      {{ b.type === 'p' ? b.text : '' }}
                    </p>
                  }
                }
              }
            </section>
          }
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }

    .pd-intro p {
      margin: 0 0 0.9rem;
      font-size: 1rem;
      line-height: 1.8;
      color: var(--lvj-ink);
    }
    .pd-intro p:last-child { margin-bottom: 0; }

    .pd-grid {
      display: grid;
      gap: 1rem;
      margin-top: 1.6rem;
    }
    @media (min-width: 860px) {
      .pd-grid:not(.compact) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .pd-grid:not(.compact) .pd-card.wide { grid-column: 1 / -1; }
    }

    .pd-card {
      padding: 1.25rem 1.35rem 1.3rem;
      background: var(--lvj-white);
      border: 1px solid var(--lvj-line);
      border-radius: 16px;
      min-width: 0;
    }

    .pd-card.note {
      background: var(--lvj-panel-alt);
      border-style: dashed;
    }

    .pd-head {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 0.9rem;
    }

    .pd-icon {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      flex: none;
      border-radius: 50%;
      background: var(--lvj-sky);
      color: var(--lvj-navy);
    }

    .pd-head h3 {
      margin: 0;
      font-family: var(--font-body);
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--lvj-ink);
    }

    .pd-rows {
      margin: 0;
      display: grid;
    }
    .pd-rows > div {
      display: grid;
      grid-template-columns: minmax(110px, 0.8fr) minmax(0, 1.2fr);
      gap: 1rem;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--lvj-line);
    }
    .pd-rows > div:first-child { padding-top: 0; }
    .pd-rows > div:last-child { border-bottom: 0; padding-bottom: 0; }
    .pd-rows dt {
      font-size: 0.84rem;
      color: var(--lvj-muted);
    }
    .pd-rows dd {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--lvj-ink);
    }

    .pd-list {
      list-style: none;
      margin: 0.2rem 0 0.6rem;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .pd-list:last-child { margin-bottom: 0; }
    .pd-list li {
      padding: 0.32rem 0.75rem;
      border-radius: 999px;
      background: var(--lvj-panel-alt);
      border: 1px solid var(--lvj-line);
      font-size: 0.82rem;
      color: var(--lvj-ink);
      line-height: 1.4;
    }

    /* Bullets that are full sentences read better as a normal list */
    .pd-card.wide .pd-list,
    .pd-card.note .pd-list {
      display: grid;
      gap: 0.35rem;
    }
    .pd-card.wide .pd-list li,
    .pd-card.note .pd-list li {
      position: relative;
      padding: 0 0 0 1.1rem;
      border: 0;
      background: none;
      border-radius: 0;
      font-size: 0.9rem;
      color: var(--lvj-muted);
      line-height: 1.6;
    }
    .pd-card.wide .pd-list li::before,
    .pd-card.note .pd-list li::before {
      content: '';
      position: absolute;
      left: 0.2rem;
      top: 0.62em;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--lvj-navy);
      opacity: 0.55;
    }

    .pd-sub {
      margin: 0.7rem 0 0.45rem;
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--lvj-ink);
    }
    .pd-sub:first-of-type { margin-top: 0; }

    .pd-p {
      margin: 0 0 0.6rem;
      font-size: 0.9rem;
      line-height: 1.65;
      color: var(--lvj-muted);
    }
    .pd-p:last-child { margin-bottom: 0; }
    .pd-p strong { color: var(--lvj-ink); font-weight: 600; }
  `]
})
export class ProductDescriptionComponent {
  readonly text = input<string | null | undefined>('');
  /** Section titles to skip (lower-case keywords), e.g. ['material options'] when pickers already show them. */
  readonly hideSections = input<string[]>([]);
  /** Single column — used for the narrow admin preview. */
  readonly compact = input(false);

  readonly parsed = computed(() => parseDescription(this.text()));

  readonly cards = computed(() => {
    const hide = this.hideSections();
    return this.parsed().sections.filter(s => !hide.some(h => s.key.includes(h)));
  });

  /** Text-heavy sections (custom work, notes) span the full width. */
  isWide(s: DescriptionSection): boolean {
    if (this.isNote(s)) return true;
    const sentences = s.blocks.filter(b => b.type === 'p').length;
    const bulletSentences = s.blocks.some(b => b.type === 'list' && b.items.some(i => i.length > 48));
    return sentences >= 2 || bulletSentences;
  }

  isNote(s: DescriptionSection): boolean {
    return /\bnote\b|disclaimer/.test(s.key);
  }

  iconFor(s: DescriptionSection): string {
    const k = s.key;
    if (/diamond|stone|gem/.test(k)) return 'gem';
    if (/certif|igi|gia/.test(k)) return 'award';
    if (/custom|design/.test(k)) return 'pen-tool';
    if (/packag|ship|deliver|gift/.test(k)) return 'gift';
    if (/note|disclaimer/.test(k)) return 'info';
    if (/size/.test(k)) return 'ruler';
    return 'sparkles';
  }
}
