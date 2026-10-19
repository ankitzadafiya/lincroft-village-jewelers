import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStats } from '../../../core/models';
import { AdminProductService } from '../../../core/services/admin-product.service';
import { AppIconComponent } from '../../../shared/icons/lvj-icons';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, AppIconComponent],
  template: `
    <div class="admin-page dash">
      <div class="intro">
        <div>
          <p class="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p class="lede">Catalog health and incoming leads at a glance.</p>
        </div>
        <div class="intro-actions">
          <a routerLink="/admin/products" class="btn btn-ghost btn-sm">Products</a>
          <a routerLink="/admin/inquiries" class="btn btn-sm">Leads</a>
        </div>
      </div>

      @if (stats(); as s) {
        <div class="hero-strip">
          <div class="hero-stat">
            <span>Catalog live</span>
            <strong>{{ s.activeProducts }}</strong>
            <small>of {{ s.totalProducts }} products</small>
          </div>
          <div class="hero-stat">
            <span>Open leads</span>
            <strong>{{ s.inquiries }}</strong>
            <small>inquiries in inbox</small>
          </div>
          <div class="hero-stat warn" [class.on]="attention() > 0">
            <span>Needs attention</span>
            <strong>{{ attention() }}</strong>
            <small>missing images or info</small>
          </div>
        </div>

        <div class="cards">
          @for (card of cards(); track card.label) {
            <a class="card" [routerLink]="card.link">
              <div class="card-top">
                <span>{{ card.label }}</span>
                <app-icon [name]="card.icon" [size]="16" [strokeWidth]="1.8"></app-icon>
              </div>
              <strong>{{ card.value }}</strong>
              <em>{{ card.hint }}</em>
            </a>
          }
        </div>

        <div class="panels">
          <section class="panel recent">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Catalog</p>
                <h2>Recent products</h2>
              </div>
              <a routerLink="/admin/products" class="text-link">View all</a>
            </div>
            @if (s.recentProducts.length) {
              <ul>
                @for (item of s.recentProducts; track item.id) {
                  <li>
                    <a [routerLink]="['/admin/products', item.id]">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.sku }} · {{ item.updatedAt | date: 'mediumDate' }}</span>
                    </a>
                    <app-icon name="chevron-right" [size]="16" [strokeWidth]="1.8"></app-icon>
                  </li>
                }
              </ul>
            } @else {
              <p class="empty">No products yet. Add your first piece to the catalog.</p>
            }
          </section>

          <section class="panel quick">
            <div class="panel-head">
              <div>
                <p class="eyebrow">Shortcuts</p>
                <h2>Quick actions</h2>
              </div>
            </div>
            <div class="quick-grid">
              <a routerLink="/admin/products"><app-icon name="plus" [size]="16" [strokeWidth]="1.9"></app-icon> New product</a>
              <a routerLink="/admin/categories"><app-icon name="layers" [size]="16" [strokeWidth]="1.9"></app-icon> Categories</a>
              <a routerLink="/admin/inquiries"><app-icon name="mail" [size]="16" [strokeWidth]="1.9"></app-icon> Review leads</a>
              <a routerLink="/admin/import"><app-icon name="upload" [size]="16" [strokeWidth]="1.9"></app-icon> Import catalog</a>
            </div>
          </section>
        </div>
      } @else {
        <div class="loading-card">Loading atelier snapshot…</div>
      }
    </div>
  `,
  styles: [`
    .intro {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      margin-bottom: 1.35rem;
      flex-wrap: wrap;
    }
    .lede { margin: 0.4rem 0 0; color: var(--lvj-muted); max-width: 42ch; }
    .intro-actions { display: flex; gap: 0.5rem; }

    .hero-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.85rem;
      margin-bottom: 1rem;
    }
    .hero-stat {
      position: relative;
      overflow: hidden;
      padding: 1.2rem 1.25rem;
      border-radius: 18px;
      background: linear-gradient(145deg, #102033 0%, #1a3d63 100%);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 18px 40px rgba(16, 32, 51, 0.18);
    }
    .hero-stat::after {
      content: '';
      position: absolute;
      right: -20%;
      top: -40%;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(125,155,209,0.28), transparent 70%);
      pointer-events: none;
    }
    .hero-stat span {
      display: block;
      font-size: 0.68rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.62);
      font-weight: 700;
    }
    .hero-stat strong {
      display: block;
      margin-top: 0.45rem;
      font-size: clamp(1.8rem, 3vw, 2.35rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }
    .hero-stat small {
      display: block;
      margin-top: 0.25rem;
      color: rgba(255,255,255,0.55);
      font-size: 0.8rem;
    }
    .hero-stat.warn.on {
      background: linear-gradient(145deg, #5c2a24 0%, #8a4036 100%);
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 0.85rem;
      margin-bottom: 1.15rem;
    }
    .card {
      display: grid;
      gap: 0.35rem;
      padding: 1.05rem 1.1rem;
      background: var(--lvj-panel);
      border: 1px solid var(--lvj-line);
      border-radius: 16px;
      box-shadow: var(--lvj-shadow-soft);
      color: inherit;
      transition: transform 0.25s var(--lvj-ease), border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--lvj-jewel) 30%, var(--lvj-line));
      box-shadow: var(--lvj-shadow);
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--lvj-muted);
    }
    .card-top span {
      font-size: 0.68rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--lvj-ink);
    }
    .card strong {
      font-size: 1.7rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--lvj-ink);
      font-variant-numeric: tabular-nums;
    }
    .card em {
      font-style: normal;
      font-size: 0.78rem;
      color: var(--lvj-muted);
    }

    .panels {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1.4fr 1fr;
    }
    .panel {
      background: var(--lvj-panel);
      border: 1px solid var(--lvj-line);
      border-radius: 18px;
      padding: 1.15rem 1.2rem 1.2rem;
      box-shadow: var(--lvj-shadow-soft);
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      margin-bottom: 0.85rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--lvj-line);
    }
    .panel-head h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 650;
      letter-spacing: -0.02em;
    }
    .recent ul { list-style: none; margin: 0; padding: 0; }
    .recent li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.8rem 0.35rem;
      border-bottom: 1px solid var(--lvj-line);
      color: var(--lvj-muted);
    }
    .recent li:last-child { border-bottom: 0; }
    .recent li a {
      display: grid;
      gap: 0.15rem;
      min-width: 0;
      color: inherit;
    }
    .recent li strong {
      color: var(--lvj-ink);
      font-weight: 600;
    }
    .recent li span { font-size: 0.8rem; }
    .empty { color: var(--lvj-muted); margin: 0.5rem 0 0; }

    .quick-grid {
      display: grid;
      gap: 0.55rem;
    }
    .quick-grid a {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.85rem 0.95rem;
      border-radius: 12px;
      border: 1px solid var(--lvj-line);
      background: color-mix(in srgb, var(--lvj-panel-alt) 70%, var(--lvj-panel));
      color: var(--lvj-ink);
      font-weight: 600;
      font-size: 0.9rem;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    .quick-grid a:hover {
      background: #102033;
      border-color: #102033;
      color: #fff;
      transform: translateX(2px);
    }

    .loading-card {
      padding: 2rem;
      border-radius: 16px;
      background: var(--lvj-panel);
      border: 1px dashed var(--lvj-line-strong);
      color: var(--lvj-muted);
      text-align: center;
    }

    @media (max-width: 960px) {
      .hero-strip, .panels { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly admin = inject(AdminProductService);
  readonly stats = signal<DashboardStats | null>(null);
  readonly attention = computed(() => {
    const s = this.stats();
    return s ? s.missingImages + s.missingInformation : 0;
  });
  readonly cards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total products', value: s.totalProducts, hint: 'All catalog SKUs', link: '/admin/products', icon: 'package' as const },
      { label: 'Active', value: s.activeProducts, hint: 'Visible on storefront', link: '/admin/products', icon: 'check' as const },
      { label: 'Categories', value: s.categories, hint: 'Browse structure', link: '/admin/categories', icon: 'layers' as const },
      { label: 'Inquiries', value: s.inquiries, hint: 'Lead inbox', link: '/admin/inquiries', icon: 'mail' as const },
      { label: 'Missing images', value: s.missingImages, hint: 'Need media', link: '/admin/products', icon: 'image' as const },
      { label: 'Missing info', value: s.missingInformation, hint: 'Incomplete details', link: '/admin/products', icon: 'alert-circle' as const }
    ];
  });

  ngOnInit(): void {
    this.admin.dashboard().subscribe(stats => this.stats.set(stats));
  }
}
