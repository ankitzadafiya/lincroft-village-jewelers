import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMG } from '../../../core/mock/image-catalog';

@Component({
  selector: 'app-custom-design-feature',
  imports: [RouterLink],
  template: `
    <section class="consult">
      <div class="container consult-inner">
        <h2>Book Your Personal Jewelry Consultation</h2>
        <p>
          Whether you're dreaming of a custom engagement ring, redesigning a cherished heirloom, or
          browsing our fine jewelry collection, our team is here to guide you from the first
          sketch to the finished piece, with personal attention in a relaxed, welcoming setting.
        </p>
      </div>
    </section>

    <section class="custom">
      <div class="container grid">
        <div class="compare" aria-label="CAD prototype versus finished ring of the same design">
          <img
            class="layer after"
            [src]="after"
            alt="Finished diamond ring, same design as the CAD prototype"
            draggable="false"
            decoding="async" />
          <img
            class="layer before"
            [src]="before"
            alt="CAD prototype of the same diamond ring"
            draggable="false"
            decoding="async"
            [style.clip-path]="'inset(0 ' + (100 - position()) + '% 0 0)'" />
          <span class="badge before-badge">Before</span>
          <span class="badge after-badge">After</span>
          <div class="handle" [style.left.%]="position()" aria-hidden="true">
            <span class="knob">
              <span></span><span></span><span></span>
            </span>
          </div>
          <input
            class="range"
            type="range"
            min="8"
            max="92"
            [value]="position()"
            (input)="onRange($event)"
            aria-label="Compare CAD prototype with the finished ring" />
        </div>

        <div class="copy">
          <p class="eyebrow">Custom Jewelry Design</p>
          <h2>If you can dream it, we can build it</h2>
          <p class="lead">
            Our custom jewelry team loves working with you. Slide to compare
            sketch and finished piece, then book a private appointment to start yours.
          </p>
          <a routerLink="/contact" class="btn btn-gold">Book an Appointment</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .consult {
      padding: 2.35rem 1rem 1.35rem;
      text-align: center;
      background:
        linear-gradient(180deg, var(--lvj-sky), color-mix(in srgb, var(--lvj-sky) 55%, var(--lvj-white)));
    }

    .consult-inner {
      max-width: 580px;
      display: grid;
      gap: 0.75rem;
      justify-items: center;
    }

    .consult h2 {
      font-family: var(--font-logo-serif);
      font-style: normal;
      font-size: clamp(1.72rem, 3.1vw, 2.36rem);
      font-weight: 600;
      letter-spacing: -0.005em;
      line-height: 1.2;
      color: var(--lvj-ink);
    }

    .consult p {
      color: var(--lvj-charcoal);
      line-height: 1.65;
      font-size: 0.94rem;
      max-width: 52ch;
    }

    .custom {
      padding: 1.35rem 0 3.5rem;
      background: var(--lvj-white);
    }

    .grid {
      display: grid;
      gap: 1.75rem;
      align-items: center;
    }

    @media (min-width: 960px) {
      .grid {
        grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
        gap: 2.75rem;
      }
    }

    .compare {
      position: relative;
      width: 100%;
      max-width: 520px;
      aspect-ratio: 1;
      margin-inline: auto;
      border-radius: 12px;
      overflow: hidden;
      background: #f4f7fb;
      border: 1px solid rgba(15, 35, 60, 0.16);
      box-shadow:
        0 1px 2px rgba(15, 35, 60, 0.05),
        0 14px 36px rgba(15, 35, 60, 0.12);
      cursor: ew-resize;
      touch-action: none;
      user-select: none;
    }

    @media (min-width: 960px) {
      .compare {
        margin-inline: 0;
        max-width: none;
      }
    }

    .layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      display: block;
      pointer-events: none;
      background: #fff;
    }

    .before {
      z-index: 1;
    }

    .badge {
      position: absolute;
      z-index: 3;
      font-family: var(--font-body);
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      background: #fff;
      color: #111;
      padding: 0.28rem 0.55rem;
      border-radius: 2px;
      pointer-events: none;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }

    .before-badge {
      top: 0.75rem;
      left: 0.75rem;
    }

    .after-badge {
      right: 0.75rem;
      bottom: 0.75rem;
      top: auto;
    }

    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #fff;
      transform: translateX(-50%);
      z-index: 4;
      pointer-events: none;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
    }

    .knob {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
      display: grid;
      grid-auto-flow: column;
      gap: 3px;
      place-content: center;
      place-items: center;
    }

    .knob span {
      width: 2px;
      height: 11px;
      background: #6b6b6b;
      border-radius: 2px;
    }

    .range {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: ew-resize;
      z-index: 5;
      margin: 0;
    }

    .copy .eyebrow {
      margin-bottom: 0.55rem;
    }

    .copy h2 {
      font-family: var(--font-logo-serif);
      font-style: normal;
      font-size: clamp(1.78rem, 3.22vw, 2.47rem);
      font-weight: 600;
      letter-spacing: -0.005em;
      line-height: 1.2;
      margin-bottom: 0.85rem;
      color: var(--lvj-ink);
      max-width: 18ch;
    }

    .lead {
      color: var(--lvj-muted);
      line-height: 1.65;
      font-size: 0.94rem;
      max-width: 40ch;
      margin-bottom: 1.25rem;
    }
  `]
})
export class CustomDesignFeatureComponent {
  readonly before = IMG.customSketch;
  readonly after = IMG.customAfter;
  readonly position = signal(50);

  onRange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.position.set(value);
  }
}
