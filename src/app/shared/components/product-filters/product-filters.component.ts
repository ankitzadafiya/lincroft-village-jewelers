import { Component, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { InputNumberModule } from 'primeng/inputnumber';
import { SliderModule } from 'primeng/slider';
import { FacetValue, ProductFilterFacets, ProductListQuery } from '../../../core/models';
import { ConfigurationService } from '../../../core/services/configuration.service';

type FilterKey = 'designer' | 'metal' | 'gemstone' | 'diamondType';

const HIDDEN_METALS = ['platinum', 'sterling silver'];

function isHiddenMetal(item: FacetValue): boolean {
  const haystack = `${item.label} ${item.value}`.toLowerCase().replace(/[_-]+/g, ' ');
  return HIDDEN_METALS.some(name => haystack.includes(name));
}

@Component({
  selector: 'app-product-filters',
  imports: [FormsModule, AccordionModule, InputNumberModule, SliderModule],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.scss'
})
export class ProductFiltersComponent {
  private readonly config = inject(ConfigurationService);
  readonly facets = input<ProductFilterFacets | null>(null);
  readonly query = input.required<ProductListQuery>();
  readonly queryChange = output<ProductListQuery>();

  openPanels: string[] = ['price'];
  priceRangeModel: number[] = [0, 0];
  localMin = 0;
  localMax = 0;
  sliderMin = 0;
  sliderMax = 0;
  sliderStep = 50;
  sections: { key: FilterKey; label: string; items: FacetValue[] }[] = [];

  private priceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncing = false;

  constructor() {
    effect(() => {
      const f = this.facets();
      const q = this.query();
      this.sections = this.buildSections(f, this.config.showBrandFilter());
      if (!f) return;
      this.syncing = true;
      const extent = this.sliderExtent(f.priceRange);
      this.sliderMin = extent.min;
      this.sliderMax = extent.max;
      this.sliderStep = this.stepFor(extent.min, extent.max);
      const min = q.priceMin ?? f.priceRange.min;
      const max = q.priceMax ?? (f.priceRange.max || f.priceRange.min);
      this.localMin = min;
      this.localMax = max;
      this.priceRangeModel = [min, max];
      queueMicrotask(() => (this.syncing = false));
    });
  }

  isSelected(key: FilterKey, item: FacetValue): boolean {
    const current = String(this.query()[key] ?? '').toLowerCase();
    if (!current) return false;
    return current === item.value.toLowerCase() || current === item.label.toLowerCase();
  }

  toggleFilter(key: FilterKey, item: FacetValue): void {
    const selected = this.isSelected(key, item);
    this.queryChange.emit({
      ...this.query(),
      [key]: selected ? undefined : item.value,
      page: 1
    });
  }

  onSliderChange(values: number | number[]): void {
    if (!Array.isArray(values) || values.length < 2) return;
    this.localMin = values[0];
    this.localMax = values[1];
    this.schedulePrice();
  }

  onPriceInput(): void {
    const min = Math.min(this.localMin, this.localMax);
    const max = Math.max(this.localMin, this.localMax);
    this.localMin = min;
    this.localMax = max;
    this.priceRangeModel = [min, max];
    this.schedulePrice();
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

  private schedulePrice(): void {
    if (this.syncing) return;
    if (this.priceTimer) clearTimeout(this.priceTimer);
    this.priceTimer = setTimeout(() => this.commitPrice(), 220);
  }

  private commitPrice(): void {
    const f = this.facets();
    if (!f) return;
    const min = Math.min(this.localMin, this.localMax);
    const max = Math.max(this.localMin, this.localMax);
    const fullMin = f.priceRange.min;
    const fullMax = f.priceRange.max;
    const priceMin = min > fullMin ? min : undefined;
    const priceMax = max < fullMax ? max : undefined;
    const current = this.query();
    if (current.priceMin === priceMin && current.priceMax === priceMax) return;
    this.queryChange.emit({ ...current, priceMin, priceMax, page: 1 });
  }

  private buildSections(
    f: ProductFilterFacets | null,
    showBrand: boolean
  ): { key: FilterKey; label: string; items: FacetValue[] }[] {
    if (!f) return [];
    return [
      ...(showBrand ? [{ key: 'designer' as const, label: 'Brand', items: f.designers }] : []),
      { key: 'metal' as const, label: 'Metal', items: f.metals.filter(item => !isHiddenMetal(item)) },
      { key: 'gemstone' as const, label: 'Gemstone Type', items: f.gemstones },
      { key: 'diamondType' as const, label: 'Diamond Type', items: f.diamondTypes }
    ].filter(s => s.items.length);
  }

  private sliderExtent(range: { min: number; max: number }): { min: number; max: number } {
    if (range.max > range.min) return range;
    const pad = Math.max(500, Math.round((range.max || 1000) * 0.2));
    return { min: Math.max(0, (range.min || 0) - pad), max: (range.max || 0) + pad };
  }

  private stepFor(min: number, max: number): number {
    const span = max - min;
    if (span <= 100) return 1;
    if (span <= 2000) return 10;
    return 50;
  }
}
