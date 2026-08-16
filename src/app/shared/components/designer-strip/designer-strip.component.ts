import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Designer } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { LvjIconsModule } from '../../icons/lvj-icons';

@Component({
  selector: 'app-designer-strip',
  imports: [RouterLink, LvjIconsModule],
  template: `
    <section class="strip section">
      <div class="container">
        <h2>Featured Designers</h2>
        <div class="row">
          <button type="button" class="nav" aria-label="Previous" (click)="shift(-1)">
            <lucide-icon name="chevron-left" [size]="18" [strokeWidth]="1.6"></lucide-icon>
          </button>
          <div class="track">
            @for (d of visible(); track d.id) {
              <a class="logo" routerLink="/designers" [attr.title]="d.name">
                <span>{{ d.name }}</span>
              </a>
            }
          </div>
          <button type="button" class="nav" aria-label="Next" (click)="shift(1)">
            <lucide-icon name="chevron-right" [size]="18" [strokeWidth]="1.6"></lucide-icon>
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .strip { background: #fff; padding-top: 3.5rem; padding-bottom: 3.5rem; }
    h2 {
      text-align: center;
      font-family: var(--font-body);
      font-size: clamp(1.5rem, 2.4vw, 1.9rem);
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 2rem;
    }
    .row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.75rem;
      align-items: center;
    }
    .nav {
      width: 42px;
      height: 42px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.1);
      background: #fff;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: background 0.25s ease, color 0.25s ease, transform 0.25s var(--lvj-ease);
    }
    .nav:hover {
      background: #111;
      color: #fff;
      transform: scale(1.04);
    }
    .track {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      align-items: center;
    }
    .logo {
      display: grid;
      place-items: center;
      min-height: 72px;
      padding: 0.75rem;
      filter: grayscale(1);
      opacity: 0.7;
      transition: opacity 0.3s ease, filter 0.3s ease, transform 0.35s var(--lvj-ease);
      text-align: center;
    }
    .logo span {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .logo:hover {
      opacity: 1;
      filter: none;
      transform: translateY(-2px);
    }
    @media (max-width: 900px) {
      .track { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DesignerStripComponent implements OnInit {
  private readonly categories = inject(CategoryService);
  readonly all = signal<Designer[]>([]);
  readonly start = signal(0);

  ngOnInit(): void {
    this.categories.designers().subscribe(list => this.all.set(list.filter(d => d.active)));
  }

  visible(): Designer[] {
    const list = this.all();
    if (!list.length) return [];
    const out: Designer[] = [];
    for (let i = 0; i < Math.min(4, list.length); i++) {
      out.push(list[(this.start() + i) % list.length]);
    }
    return out;
  }

  shift(dir: number): void {
    const n = this.all().length;
    if (!n) return;
    this.start.set((this.start() + dir + n) % n);
  }
}
