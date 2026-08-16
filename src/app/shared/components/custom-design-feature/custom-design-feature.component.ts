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
          Whether you're shopping for engagement rings, designing a custom piece, or browsing fine jewelry,
          our expert team is here to guide you. Book a private appointment and enjoy personalized attention
          in a relaxed, welcoming environment.
        </p>
        <a routerLink="/contact" class="btn btn-ghost">Book an Appointment</a>
      </div>
    </section>

    <section class="custom">
      <div class="container grid">
        <div class="compare" aria-label="CAD prototype versus finished ring of the same design">
          <!-- Finished ring (after) -->
          <img
            class="layer after"
            [src]="after"
            alt="Finished diamond ring — same design as the CAD prototype"
            draggable="false" />
          <!-- CAD of the SAME ring (before) -->
          <img
            class="layer before"
            [src]="before"
            alt="CAD prototype of the same diamond ring"
            draggable="false"
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
            Our skilled custom jewelry design artisans relish the chance to work with you to create
            your own unique, personal piece of custom jewelry — from CAD prototype to the finished ring.
          </p>
          <a routerLink="/custom-jewelry" class="btn btn-gold">Start Your Design</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .consult {
      padding: 4.5rem 1rem 2rem;
      text-align: center;
      background: #fff;
    }

    .consult-inner {
      max-width: 640px;
      display: grid;
      gap: 1rem;
      justify-items: center;
    }

    .consult h2 {
      font-family: var(--font-logo-serif);
      font-style: italic;
      font-size: clamp(1.85rem, 3.4vw, 2.7rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: var(--lvj-ink);
    }

    .consult p {
      color: #6f6b66;
      line-height: 1.65;
      font-size: 0.98rem;
      max-width: 54ch;
    }

    .consult .btn {
      margin-top: 0.5rem;
    }

    .custom {
      padding: 2rem 0 5rem;
      background: #fff;
    }

    .grid {
      display: grid;
      gap: 2.5rem;
      align-items: center;
    }

    @media (min-width: 960px) {
      .grid {
        grid-template-columns: 1.1fr 0.9fr;
        gap: 3.5rem;
      }
    }

    .compare {
      position: relative;
      aspect-ratio: 1;
      border-radius: 2px;
      overflow: hidden;
      background: #f2f2f0;
      cursor: ew-resize;
      touch-action: none;
      user-select: none;
    }

    .layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 42%;
      display: block;
      pointer-events: none;
    }

    .before {
      z-index: 1;
      background: #f2f2f0;
    }

    .badge {
      position: absolute;
      top: 0.85rem;
      z-index: 3;
      font-size: 0.68rem;
      font-weight: 650;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.94);
      color: #111;
      padding: 0.35rem 0.55rem;
      border-radius: 999px;
      pointer-events: none;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }

    .before-badge {
      left: 0.85rem;
    }

    .after-badge {
      right: 0.85rem;
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
      width: 42px;
      height: 42px;
      border-radius: 999px;
      background: #fff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      display: grid;
      grid-auto-flow: column;
      gap: 3px;
      place-content: center;
      place-items: center;
    }

    .knob span {
      width: 2px;
      height: 12px;
      background: #111;
      border-radius: 2px;
      opacity: 0.7;
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
      margin-bottom: 0.65rem;
    }

    .copy h2 {
      font-family: var(--font-logo-serif);
      font-style: italic;
      font-size: clamp(1.85rem, 3.4vw, 2.7rem);
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.12;
      margin-bottom: 1rem;
      color: var(--lvj-ink);
      max-width: 16ch;
    }

    .lead {
      color: #6f6b66;
      line-height: 1.7;
      font-size: 0.98rem;
      max-width: 40ch;
      margin-bottom: 1.5rem;
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
