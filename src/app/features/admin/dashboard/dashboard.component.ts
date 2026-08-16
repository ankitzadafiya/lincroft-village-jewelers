import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStats } from '../../../core/models';
import { AdminProductService } from '../../../core/services/admin-product.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="admin-page dash">
      <div class="intro">
        <p class="eyebrow">Overview</p>
        <h1>Dashboard</h1>
        <p>A snapshot of the atelier catalog and incoming leads.</p>
      </div>
      @if (stats(); as s) {
        <div class="cards">
          <article><span>Total products</span><strong>{{ s.totalProducts }}</strong></article>
          <article><span>Active</span><strong>{{ s.activeProducts }}</strong></article>
          <article><span>Categories</span><strong>{{ s.categories }}</strong></article>
          <article><span>Inquiries</span><strong>{{ s.inquiries }}</strong></article>
          <article><span>Missing images</span><strong>{{ s.missingImages }}</strong></article>
          <article><span>Missing information</span><strong>{{ s.missingInformation }}</strong></article>
        </div>
        <div class="recent">
          <div class="recent-head">
            <h2>Recent products</h2>
            <a routerLink="/admin/products">View all</a>
          </div>
          <ul>
            @for (item of s.recentProducts; track item.id) {
              <li>
                <a [routerLink]="['/admin/products', item.id]">{{ item.name }}</a>
                <span>{{ item.sku }} · {{ item.updatedAt | date:'mediumDate' }}</span>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .intro { margin-bottom: 1.4rem; }
    h1 { font-family: var(--font-logo-serif); font-style: italic; font-size: clamp(2rem, 4vw, 2.6rem); margin: 0.15rem 0 0.35rem; }
    .intro p { color: var(--lvj-muted); }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.9rem; }
    article { background: #fff; padding: 1.15rem; border: 1px solid var(--lvj-line); border-radius: 16px; }
    span { display: block; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--lvj-muted); }
    strong { font-family: var(--font-display); font-size: 2rem; font-weight: 500; }
    .recent { margin-top: 1.8rem; background: #fff; border: 1px solid var(--lvj-line); border-radius: 16px; padding: 1.1rem 1.2rem; }
    .recent-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
    h2 { font-size: 1.25rem; }
    .recent-head a { color: var(--lvj-gold-deep); font-weight: 600; font-size: 0.85rem; }
    li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--lvj-line); }
    li:last-child { border-bottom: 0; }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly admin = inject(AdminProductService);
  readonly stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.admin.dashboard().subscribe(stats => this.stats.set(stats));
  }
}
