import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { SliderModule } from 'primeng/slider';
import { FacetValue, ProductFilterFacets, ProductListQuery } from '../../../core/models';

type FilterKey = 'designer' | 'metal' | 'gemstone' | 'diamondType' | 'availability';

@Component({
  selector: 'app-product-filters',
  imports: [FormsModule, AccordionModule, CheckboxModule, InputNumberModule, SliderModule],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.scss'
})
export class ProductFiltersComponent {
  readonly facets = input<ProductFilterFacets | null>(null);
  readonly query = input.required<ProductListQuery>();
  readonly queryChange = output<ProductListQuery>();

  openPanels: string[] = ['price', 'designer'];
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
      this.sections = this.buildSections(f);
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

  onCheck(key: FilterKey, item: FacetValue, checked: boolean): void {
    this.queryChange.emit({
      ...this.query(),
      [key]: checked ? item.value : undefined,
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

  private buildSections(f: ProductFilterFacets | null): { key: FilterKey; label: string; items: FacetValue[] }[] {
    if (!f) return [];
    return [
      { key: 'designer' as const, label: 'Brand', items: f.designers },
      { key: 'metal' as const, label: 'Metal', items: f.metals },
      { key: 'gemstone' as const, label: 'Gemstone Type', items: f.gemstones },
      { key: 'diamondType' as const, label: 'Diamond Type', items: f.diamondTypes },
      { key: 'availability' as const, label: 'Availability', items: f.availability }
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
