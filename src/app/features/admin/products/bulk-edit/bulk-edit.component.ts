import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import {
  BulkChanges,
  BulkCompareMode,
  BulkPriceMode,
  BulkScope,
  BulkUpdateResult,
  KARATS,
  Karat,
  ProductAvailability,
  ProductStatus
} from '../../../../core/models';
import { AdminProductService } from '../../../../core/services/admin-product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { hasBulkChanges } from '../../../../core/utils/bulk-price';
import { AppIconComponent } from '../../../../shared/icons/lvj-icons';

type ScopeChoice = 'selected' | 'filter' | 'all';

interface ModeOption<T> {
  value: T;
  label: string;
}

const PRICE_MODES: ModeOption<BulkPriceMode>[] = [
  { value: 'none', label: 'Don’t change price' },
  { value: 'increase_amount', label: 'Increase by amount' },
  { value: 'decrease_amount', label: 'Decrease by amount' },
  { value: 'set_amount', label: 'Set new amount' },
  { value: 'increase_percent', label: 'Percentage increase' },
  { value: 'decrease_percent', label: 'Percentage decrease' }
];

@Component({
  selector: 'app-bulk-edit',
  imports: [AppIconComponent],
  templateUrl: './bulk-edit.component.html',
  styleUrl: './bulk-edit.component.scss'
})
export class BulkEditComponent implements OnInit {
  private readonly admin = inject(AdminProductService);
  private readonly toast = inject(ToastService);

  /** Ids ticked in the product list. */
  readonly selectedIds = input<string[]>([]);
  /** Current search text in the product list. */
  readonly searchText = input('');
  readonly applied = output<void>();
  readonly cancelled = output<void>();

  readonly priceModes = PRICE_MODES;
  readonly karats = KARATS;

  // ── Scope ──
  readonly scopeChoice = signal<ScopeChoice>('all');

  // ── Price ──
  readonly priceMode = signal<BulkPriceMode>('none');
  readonly priceValue = signal<number | null>(null);
  readonly roundWhole = signal(false);
  readonly karatTargets = signal<Karat[]>([...KARATS]);

  // ── Compare-at ──
  readonly compareMode = signal<BulkCompareMode>('none');
  readonly comparePercent = signal<number | null>(null);

  // ── Visibility ──
  readonly showPrice = signal<boolean | null>(null);
  readonly status = signal<ProductStatus | null>(null);
  readonly availability = signal<ProductAvailability | null>(null);

  // ── Preview / apply ──
  readonly preview = signal<BulkUpdateResult | null>(null);
  readonly previewLoading = signal(false);
  readonly applying = signal(false);
  readonly confirming = signal(false);

  readonly isPercentMode = computed(() => this.priceMode().endsWith('_percent'));
  readonly needsValue = computed(() => this.priceMode() !== 'none');

  readonly priceError = computed(() => {
    if (!this.needsValue()) return '';
    const v = this.priceValue();
    if (v == null || Number.isNaN(v)) return this.isPercentMode() ? 'Please enter a percentage' : 'Please enter an amount';
    if (v < 0) return 'Use a positive number — pick “decrease” to lower prices';
    if (this.priceMode() === 'decrease_percent' && v >= 100) return 'A decrease must be less than 100%';
    if (this.karatTargets().length === 0) return 'Pick at least one karat';
    return '';
  });

  readonly compareError = computed(() => {
    if (this.compareMode() !== 'percent_above') return '';
    const v = this.comparePercent();
    if (v == null || Number.isNaN(v) || v <= 0) return 'Please enter a percentage above 0';
    return '';
  });

  readonly scope = computed<BulkScope>(() => {
    switch (this.scopeChoice()) {
      case 'selected': return { type: 'ids', ids: this.selectedIds() };
      case 'filter': return { type: 'filter', filter: { q: this.searchText() } };
      default: return { type: 'all' };
    }
  });

  readonly changes = computed<BulkChanges>(() => ({
    price: {
      mode: this.priceMode(),
      value: this.priceValue() ?? 0,
      roundWhole: this.roundWhole(),
      karats: this.karatTargets()
    },
    compareAt: { mode: this.compareMode(), percent: this.comparePercent() ?? 0 },
    showPrice: this.showPrice(),
    status: this.status(),
    availability: this.availability()
  }));

  readonly ready = computed(() =>
    hasBulkChanges(this.changes()) && !this.priceError() && !this.compareError());

  /** Short plain-English summary for the confirm step. */
  readonly summary = computed(() => {
    const c = this.changes();
    const parts: string[] = [];
    const v = c.price.value;
    switch (c.price.mode) {
      case 'increase_amount': parts.push(`raise prices by $${v}`); break;
      case 'decrease_amount': parts.push(`lower prices by $${v}`); break;
      case 'set_amount': parts.push(`set prices to $${v}`); break;
      case 'increase_percent': parts.push(`raise prices by ${v}%`); break;
      case 'decrease_percent': parts.push(`lower prices by ${v}%`); break;
    }
    if (c.compareAt.mode === 'percent_above') parts.push(`set compare-at ${c.compareAt.percent}% above price`);
    if (c.compareAt.mode === 'remove') parts.push('remove compare-at prices');
    if (c.showPrice !== null) parts.push(c.showPrice ? 'show prices' : 'hide prices');
    if (c.status) parts.push(`set status to ${c.status}`);
    if (c.availability) parts.push(`set availability to ${c.availability.replace('_', ' ')}`);
    return parts.join(', ');
  });

  constructor() {
    // Live preview: re-run a dry run shortly after any setting changes.
    toObservable(computed(() => ({ ready: this.ready(), scope: this.scope(), changes: this.changes() })))
      .pipe(
        tap(() => this.confirming.set(false)),
        debounceTime(400),
        switchMap(({ ready, scope, changes }) => {
          if (!ready) return of(null);
          this.previewLoading.set(true);
          return this.admin.bulkUpdate({ scope, changes, dryRun: true }).pipe(
            catchError(() => {
              this.toast.error('Could not load the preview.');
              return of(null);
            })
          );
        }),
        map(result => {
          this.previewLoading.set(false);
          this.preview.set(result);
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  /** Default scope: ticked products, else the current search, else everything. */
  ngOnInit(): void {
    this.scopeChoice.set(this.selectedIds().length ? 'selected' : this.searchText() ? 'filter' : 'all');
  }

  numberFrom(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (!raw) return null;
    const n = Number(raw.replace(/[$,%\s]/g, ''));
    return Number.isNaN(n) ? null : n;
  }

  toggleKarat(k: Karat): void {
    this.karatTargets.update(list => list.includes(k) ? list.filter(x => x !== k) : KARATS.filter(x => x === k || list.includes(x)));
  }

  pickPriceMode(event: Event): void {
    this.priceMode.set((event.target as HTMLSelectElement).value as BulkPriceMode);
  }

  money(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(v);
  }

  startApply(): void {
    if (!this.ready() || !this.preview()?.updated) return;
    this.confirming.set(true);
  }

  apply(): void {
    if (!this.ready()) return;
    this.applying.set(true);
    this.admin.bulkUpdate({ scope: this.scope(), changes: this.changes(), dryRun: false }).subscribe({
      next: res => {
        this.applying.set(false);
        this.confirming.set(false);
        this.toast.success(`${res.updated} product${res.updated === 1 ? '' : 's'} updated.`);
        this.applied.emit();
      },
      error: err => {
        this.applying.set(false);
        this.toast.error(err.error?.message || 'Bulk update failed.');
      }
    });
  }
}
