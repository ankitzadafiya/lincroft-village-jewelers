import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProductListItem } from '../../core/models';
import { SearchService } from '../../core/services/search.service';
import { SeoService } from '../../core/services/seo.service';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-search-page',
  imports: [ReactiveFormsModule, ProductGridComponent, EmptyStateComponent, LoadingSkeletonComponent],
  template: `
    <section class="page-hero">
      <p class="eyebrow">Search</p>
      <h1>Find a piece.</h1>
      <form (submit)="$event.preventDefault(); go()">
        <input [formControl]="query" placeholder="Name, SKU, designer, or specification" />
      </form>
    </section>
    <section class="container section">
      @if (loading()) {
        <app-loading-skeleton />
      } @else if (!products().length) {
        <app-empty-state title="No results." message="Try a SKU, a metal, or a designer name." />
      } @else {
        <p class="muted" style="margin-bottom:1.2rem">{{ total() }} results</p>
        <app-product-grid [products]="products()" />
      }
    </section>
  `,
  styles: [`
    input {
      width: min(640px, 100%);
      margin: 1.2rem 0 0;
      display: block;
      border: 0;
      border-bottom: 1px solid var(--lvj-charcoal);
      background: transparent;
      padding: 0.8rem 0;
      font-size: 1.2rem;
      outline: none;
    }
  `]
})
export class SearchPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly search = inject(SearchService);
  readonly query = new FormControl('', { nonNullable: true });
  readonly products = signal<ProductListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);

  ngOnInit(): void {
    inject(SeoService).set({ title: 'Search', description: 'Search the Lincroft Village Jewelers collection by name, SKU, or specification.' });
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q') ?? '';
      this.query.setValue(q);
      if (!q) {
        this.products.set([]);
        return;
      }
      this.loading.set(true);
      this.search.search(q, 24).subscribe({
        next: res => {
          this.products.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }

  go(): void {
    void this.router.navigate(['/search'], { queryParams: { q: this.query.value.trim() } });
  }
}
