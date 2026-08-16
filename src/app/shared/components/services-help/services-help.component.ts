import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceOffering } from '../../../core/models';
import { ContentService } from '../../../core/services/content.service';
import { IMG } from '../../../core/mock/image-catalog';

interface HelpItem {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
}

@Component({
  selector: 'app-services-help',
  imports: [RouterLink],
  template: `
    <section class="help">
      <div class="container grid">
        <div class="copy">
          <p class="eyebrow">Jewelry Services</p>
          <h2>We’re Here To Help</h2>

          <div class="list" role="list">
            @for (item of items(); track item.id; let i = $index) {
              <button
                type="button"
                class="row"
                role="listitem"
                [class.open]="active() === i"
                [attr.aria-expanded]="active() === i"
                (click)="toggle(i)"
                (mouseenter)="active.set(i)">
                <div class="head">
                  <span class="num">{{ pad(i + 1) }}.</span>
                  <span class="title">{{ item.title }}</span>
                </div>
                <div class="body" [class.show]="active() === i">
                  <p>{{ item.body }}</p>
                </div>
              </button>
            }
          </div>

          @if (showLink()) {
            <a routerLink="/services" class="more">View all services</a>
          }
        </div>

        <div class="visual">
          <img [src]="activeImage()" [alt]="activeTitle()" />
        </div>
      </div>
    </section>
  `,
  styles: [`
    .help {
      padding: 4.5rem 0;
      background: var(--lvj-panel);
    }

    .grid {
      display: grid;
      gap: 2.5rem;
      align-items: stretch;
    }

    @media (min-width: 960px) {
      .grid {
        grid-template-columns: 1.05fr 0.95fr;
        gap: 3.5rem;
      }
    }

    .eyebrow {
      margin-bottom: 0.75rem;
    }

    h2 {
      font-family: var(--font-logo-serif);
      font-style: italic;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.12;
      margin-bottom: 2rem;
      color: var(--lvj-ink);
    }

    .list {
      display: grid;
      border-top: 1px solid rgba(17, 17, 17, 0.12);
    }

    .row {
      display: grid;
      width: 100%;
      text-align: left;
      border: 0;
      border-bottom: 1px solid rgba(17, 17, 17, 0.12);
      background: transparent;
      padding: 1.05rem 0;
      cursor: pointer;
      color: inherit;
    }

    .head {
      display: grid;
      grid-template-columns: 2.4rem 1fr;
      gap: 0.35rem;
      align-items: baseline;
    }

    .num {
      font-size: 0.92rem;
      font-weight: 500;
      color: var(--lvj-ink);
      font-variant-numeric: tabular-nums;
    }

    .title {
      font-size: 1.02rem;
      font-weight: 600;
      letter-spacing: -0.015em;
      color: var(--lvj-ink);
      transition: opacity 0.25s ease;
    }

    .row:not(.open) .title {
      opacity: 0.72;
    }

    .body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      padding-left: 2.75rem;
    }

    .body.show {
      grid-template-rows: 1fr;
    }

    .body > p {
      overflow: hidden;
      margin: 0;
      padding-top: 0;
      max-width: 48ch;
      font-size: 0.9rem;
      line-height: 1.65;
      color: var(--lvj-muted);
      opacity: 0;
      transition: opacity 0.3s ease, padding-top 0.35s ease;
    }

    .body.show > p {
      opacity: 1;
      padding-top: 0.7rem;
    }

    .more {
      display: inline-flex;
      margin-top: 1.5rem;
      font-size: 0.86rem;
      font-weight: 600;
      border-bottom: 1px solid currentColor;
      padding-bottom: 2px;
      width: fit-content;
    }

    .visual {
      border-radius: 4px;
      overflow: hidden;
      background: var(--lvj-ink);
      min-height: 360px;
      position: relative;
    }

    @media (min-width: 960px) {
      .visual {
        min-height: 100%;
      }
    }

    .visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      inset: 0;
    }
  `]
})
export class ServicesHelpComponent implements OnInit {
  private readonly content = inject(ContentService);

  readonly showLink = input(true);
  readonly active = signal(0);
  readonly items = signal<HelpItem[]>([]);

  readonly activeImage = computed(() => this.items()[this.active()]?.imageUrl || IMG.service);
  readonly activeTitle = computed(() => this.items()[this.active()]?.title || 'Jewelry services');

  ngOnInit(): void {
    this.content.services().subscribe(list => {
      const preferred = [
        'jewelry-repair',
        'gold-buying',
        'watch-repair',
        'jewelry-appraisal'
      ];
      const bySlug = new Map(list.map(s => [s.slug, s]));
      const mapped: HelpItem[] = preferred
        .map(slug => bySlug.get(slug))
        .filter((s): s is ServiceOffering => !!s)
        .map(s => ({
          id: s.id,
          title: s.title,
          body: s.description ?? s.summary ?? '',
          imageUrl: s.imageUrl ?? IMG.service
        }));

      mapped.push({
        id: 'battery-links',
        title: 'Same Day Watch Battery Replacement & Link Adjustments',
        body: 'Most battery replacements and bracelet link adjustments are completed while you wait — so you leave with a watch that fits and keeps time.',
        imageUrl: IMG.serviceWatch
      });

      this.items.set(mapped.slice(0, 5));
    });
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  toggle(i: number): void {
    this.active.set(i);
  }
}
