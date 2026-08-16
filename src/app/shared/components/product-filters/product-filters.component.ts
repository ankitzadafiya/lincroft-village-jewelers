import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FacetValue, ProductFilterFacets, ProductListQuery } from '../../../core/models';

@Component({
  selector: 'app-product-filters',
  imports: [FormsModule],
  template: `
    <aside class="filters">
      <div class="head">
        <h2>Filters</h2>
        <button type="button" class="clear" (click)="reset()">Clear</button>
      </div>

      @if (facets(); as f) {
        <div class="group">
          <button type="button" class="group-head" (click)="toggle('price')">
            <span>Price</span>
            <span class="chev" [class.open]="open()['price']">▾</span>
          </button>
          @if (open()['price']) {
            <div class="group-body price">
              <input
                type="range"
                class="range"
                [min]="f.priceRange.min"
                [max]="f.priceRange.max"
                [ngModel]="priceMax()"
                (ngModelChange)="onPriceMax($event)" />
              <div class="price-row">
                <label>
                  <span>$</span>
                  <input type="number" [ngModel]="priceMin()" (ngModelChange)="onPriceMin($event)" [min]="0" />
                </label>
                <span class="to">To</span>
                <label>
                  <span>$</span>
                  <input type="number" [ngModel]="priceMax()" (ngModelChange)="onPriceMax($event)" [min]="0" />
                </label>
              </div>
            </div>
          }
        </div>

        @for (section of sections(); track section.key) {
          <div class="group">
            <button type="button" class="group-head" (click)="toggle(section.key)">
              <span>{{ section.label }}</span>
              <span class="chev" [class.open]="open()[section.key]">▾</span>
            </button>
            @if (open()[section.key]) {
              <div class="group-body">
                @for (item of section.items; track item.value) {
                  <label class="check">
                    <input
                      type="checkbox"
                      [checked]="isSelected(section.key, item.value)"
                      (change)="toggleFacet(section.key, item.value)" />
                    <span>{{ item.label }} <em>({{ item.count }})</em></span>
                  </label>
                }
              </div>
            }
          </div>
        }
      }
    </aside>
  `,
  styles: [`
    .filters {
      display: grid;
      gap: 0;
      align-content: start;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    h2 {
      font-size: 1.15rem;
      font-family: var(--font-body);
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .clear {
      border: 0;
      background: transparent;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-size: 0.65rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--lvj-muted);
      transition: color 0.2s ease;
    }
    .clear:hover { color: var(--lvj-ink); }
    .group {
      border-top: 1px solid rgba(0,0,0,0.08);
    }
    .group:last-child { border-bottom: 1px solid rgba(0,0,0,0.08); }
    .group-head {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      font-family: var(--font-body);
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--lvj-ink);
    }
    .chev {
      display: inline-block;
      transition: transform 0.3s var(--lvj-ease);
      color: var(--lvj-muted);
      font-size: 0.75rem;
    }
    .chev.open { transform: rotate(180deg); }
    .group-body {
      display: grid;
      gap: 0.65rem;
      padding: 0 0 1.1rem;
      animation: in 0.3s ease;
    }
    @keyframes in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: none; }
    }
    .check {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      font-size: 0.86rem;
      color: var(--lvj-charcoal);
      cursor: pointer;
      line-height: 1.35;
    }
    .check input {
      margin-top: 0.15rem;
      accent-color: var(--lvj-ink);
      width: 15px;
      height: 15px;
      flex: none;
    }
    .check em {
      font-style: normal;
      color: var(--lvj-muted-2);
      font-size: 0.8rem;
    }
    .price-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 0.5rem;
      align-items: center;
    }
    .price-row label {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border: 1px solid rgba(0,0,0,0.14);
      padding: 0.45rem 0.55rem;
      background: var(--lvj-panel);
    }
    .price-row span { color: var(--lvj-muted); font-size: 0.8rem; }
    .price-row .to { font-size: 0.75rem; color: var(--lvj-muted); }
    .price-row input[type="number"] {
      border: 0;
      width: 100%;
      font-size: 0.86rem;
      background: transparent;
      outline: none;
    }
    .range {
      width: 100%;
      accent-color: var(--lvj-ink);
      margin-bottom: 0.85rem;
    }
  `]
})
export class ProductFiltersComponent {
  readonly facets = input<ProductFilterFacets | null>(null);
  readonly query = input.required<ProductListQuery>();
  readonly queryChange = output<ProductListQuery>();

  readonly open = signal<Record<string, boolean>>({
    price: true,
    designer: true,
    metal: false,
    gemstone: false,
    diamondType: false,
    availability: false
  });

  readonly priceMin = computed(() => this.query().priceMin ?? this.facets()?.priceRange.min ?? 0);
  readonly priceMax = computed(() => this.query().priceMax ?? this.facets()?.priceRange.max ?? 9999);

  readonly sections = computed(() => {
    const f = this.facets();
    if (!f) return [] as { key: FilterKey; label: string; items: FacetValue[] }[];
    return [
      { key: 'designer' as const, label: 'Brand', items: f.designers },
      { key: 'metal' as const, label: 'Metal', items: f.metals },
      { key: 'gemstone' as const, label: 'Gemstone Type', items: f.gemstones },
      { key: 'diamondType' as const, label: 'Diamond Type', items: f.diamondTypes },
      { key: 'availability' as const, label: 'Availability', items: f.availability }
    ].filter(s => s.items.length);
  });

  toggle(key: string): void {
    this.open.update(m => ({ ...m, [key]: !m[key] }));
  }

  isSelected(key: FilterKey, value: string): boolean {
    return String(this.query()[key] ?? '') === value;
  }

  toggleFacet(key: FilterKey, value: string): void {
    const current = String(this.query()[key] ?? '');
    this.queryChange.emit({
      ...this.query(),
      [key]: current === value ? undefined : value,
      page: 1
    });
  }

  onPriceMin(value: number | string): void {
    const n = Number(value);
    this.queryChange.emit({ ...this.query(), priceMin: Number.isFinite(n) ? n : undefined, page: 1 });
  }

  onPriceMax(value: number | string): void {
    const n = Number(value);
    this.queryChange.emit({ ...this.query(), priceMax: Number.isFinite(n) ? n : undefined, page: 1 });
  }

  reset(): void {
    const { category, subcategory, q } = this.query();
    this.queryChange.emit({
      category,
      subcategory,
      q,
      page: 1,
      pageSize: this.query().pageSize,
      sort: this.query().sort
    });
  }
}

type FilterKey = 'designer' | 'metal' | 'gemstone' | 'diamondType' | 'availability';
