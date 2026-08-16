import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMG } from '../../../core/mock/image-catalog';

interface World {
  title: string;
  copy: string;
  path: string;
  image: string;
}

@Component({
  selector: 'app-occasion-worlds',
  imports: [RouterLink],
  template: `
    <section class="worlds section">
      <div class="container">
        <div class="intro">
          <p class="eyebrow">Shop by moment</p>
          <h2>Find the right world.</h2>
          <p class="lede">Bridal, everyday gold, and statement pieces — curated without the clutter.</p>
        </div>
        <div class="grid">
          @for (world of worlds; track world.path) {
            <a class="card" [routerLink]="world.path">
              <img [src]="world.image" [alt]="world.title" loading="lazy" />
              <div class="copy">
                <h3>{{ world.title }}</h3>
                <p>{{ world.copy }}</p>
                <span>Explore</span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .intro {
      text-align: center;
      margin-bottom: 2.25rem;
      display: grid;
      justify-items: center;
      gap: 0.55rem;
    }
    h2 {
      font-size: clamp(1.7rem, 3vw, 2.35rem);
      font-weight: 500;
      letter-spacing: -0.02em;
    }
    .lede {
      color: var(--lvj-muted);
      max-width: 42ch;
      font-size: 0.98rem;
    }
    .grid {
      display: grid;
      gap: 0.85rem;
    }
    .card {
      position: relative;
      display: block;
      overflow: hidden;
      background: #f3f3f3;
      min-height: 280px;
      color: #fff;
    }
    .card img {
      width: 100%;
      height: 100%;
      min-height: 280px;
      object-fit: cover;
      transition: transform 0.9s var(--lvj-ease-out);
    }
    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.62) 100%);
    }
    .copy {
      position: absolute;
      left: 1.25rem;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 1;
      display: grid;
      gap: 0.35rem;
    }
    h3 {
      font-size: 1.35rem;
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    .copy p {
      font-size: 0.9rem;
      opacity: 0.88;
      max-width: 28ch;
      line-height: 1.45;
    }
    .copy span {
      margin-top: 0.35rem;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(255,255,255,0.7);
      width: fit-content;
      padding-bottom: 2px;
    }
    .card:hover img { transform: scale(1.05); }
    @media (min-width: 900px) {
      .grid {
        grid-template-columns: 1.2fr 1fr 1fr;
        gap: 1rem;
      }
      .card,
      .card img { min-height: 420px; }
      .card:first-child {
        grid-row: span 1;
      }
    }
  `]
})
export class OccasionWorldsComponent {
  readonly worlds: World[] = [
    {
      title: 'Rings',
      copy: 'Lab-grown engagement rings, wedding bands, and natural diamond rings.',
      path: '/ring',
      image: IMG.catEngagement
    },
    {
      title: 'Earrings & Studs',
      copy: 'Lab-grown and natural diamond earrings for every day.',
      path: '/earring',
      image: IMG.earring1
    },
    {
      title: 'Silver + 24k Gold',
      copy: 'Sterling silver jewelry finished with 24k gold plating.',
      path: '/silver-jewelry-with-24k-gold-plating',
      image: IMG.gold
    }
  ];
}
