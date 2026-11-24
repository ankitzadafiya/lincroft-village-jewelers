import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { Product } from '../../../../core/models';
import { AdminProductService } from '../../../../core/services/admin-product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AppIconComponent } from '../../../../shared/icons/lvj-icons';
import { ProductFormComponent } from '../product-form/product-form.component';
import { BulkEditComponent } from '../bulk-edit/bulk-edit.component';

@Component({
  selector: 'app-admin-product-list',
  imports: [FormsModule, TableModule, DialogModule, ProductFormComponent, BulkEditComponent, AppIconComponent],
  template: `
    <div class="admin-page">
      <div class="head">
        <div>
          <p class="eyebrow">Catalog</p>
          <h1>Products</h1>
        </div>
        <div class="head-actions">
          <button type="button" class="btn btn-ghost" (click)="openBulk()">
            <app-icon name="sliders-horizontal" [size]="15" [strokeWidth]="1.8"></app-icon>
            Bulk edit
          </button>
          <button type="button" class="btn" (click)="openCreate()">New product</button>
        </div>
      </div>

      <div class="toolbar">
        <input
          class="search"
          placeholder="Search name or SKU"
          [ngModel]="q"
          (ngModelChange)="q = $event; load()" />

        @if (selected().length) {
          <div class="selection-bar" role="status">
            <span><b>{{ selected().length }}</b> selected</span>
            <button type="button" class="sel-btn primary" (click)="openBulk()">Edit selected</button>
            <button type="button" class="sel-btn" (click)="selected.set([])">Clear</button>
          </div>
        }
      </div>

      <div class="table-card">
        <p-table
          [value]="products()"
          dataKey="id"
          [selection]="selected()"
          (selectionChange)="selected.set($event)"
          [lazy]="true"
          [paginator]="true"
          [rows]="20"
          [totalRecords]="total()"
          (onLazyLoad)="onLazy($event)">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
              <th>SKU</th>
              <th>Name</th>
              <th>Status</th>
              <th>Price</th>
              <th>Show price</th>
              <th style="width: 9rem"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td><p-tableCheckbox [value]="row" /></td>
              <td>{{ row.sku }}</td>
              <td>{{ row.name }}</td>
              <td><span class="status" [attr.data-s]="row.status">{{ row.status }}</span></td>
              <td>
                {{ money(row.price) }}
                @if (row.options?.karatPrices?.length) {
                  <span class="karat-note">{{ karatRange(row) }}</span>
                }
                @if (row.compareAtPrice) {
                  <span class="compare-note">was {{ money(row.compareAtPrice) }}</span>
                }
              </td>
              <td>{{ row.showPrice ? 'Yes' : 'No' }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="icon-btn icon-tip" data-tip="Edit" (click)="openEdit(row)" aria-label="Edit">
                    <app-icon name="pencil" [size]="15" [strokeWidth]="1.8"></app-icon>
                  </button>
                  <button type="button" class="icon-btn icon-tip muted" (click)="toggle(row)" [attr.data-tip]="row.status === 'active' ? 'Turn off' : 'Turn on'" [attr.aria-label]="row.status === 'active' ? 'Turn off' : 'Turn on'">
                    <app-icon name="power" [size]="15" [strokeWidth]="1.8"></app-icon>
                  </button>
                  <button type="button" class="icon-btn icon-tip danger" data-tip="Archive" (click)="archive(row)" aria-label="Archive">
                    <app-icon name="trash-2" [size]="15" [strokeWidth]="1.8"></app-icon>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog
      [header]="editingId() ? 'Edit product' : 'New product'"
      [visible]="formOpen()"
      (visibleChange)="onDialogVisible($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(960px, 96vw)' }"
      [breakpoints]="{ '960px': '96vw', '640px': '100vw' }"
      [contentStyle]="{ 'max-height': 'min(78vh, 820px)', overflow: 'auto' }"
      styleClass="product-modal"
      [closable]="true"
      [dismissableMask]="true">
      @if (formOpen()) {
        <app-product-form
          [productId]="editingId()"
          (saved)="onSaved()"
          (cancelled)="closeForm()" />
      }
    </p-dialog>

    <p-dialog
      header="Bulk edit products"
      [visible]="bulkOpen()"
      (visibleChange)="bulkOpen.set($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(1120px, 96vw)', height: 'min(88vh, 860px)' }"
      [breakpoints]="{ '960px': '96vw', '640px': '100vw' }"
      [contentStyle]="{ flex: '1', 'min-height': '0', display: 'flex', 'flex-direction': 'column' }"
      styleClass="product-modal bulk-modal"
      [dismissableMask]="false">
      @if (bulkOpen()) {
        <app-bulk-edit
          [selectedIds]="selectedIds()"
          [searchText]="q"
          (applied)="onBulkApplied()"
          (cancelled)="bulkOpen.set(false)" />
      }
    </p-dialog>
  `,
  styles: [`
    .head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .head-actions {
      display: flex;
      gap: 0.55rem;
      flex-wrap: wrap;
    }
    .head-actions .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin: 0 0 1rem;
    }
    .selection-bar {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.35rem 0.4rem 0.35rem 0.95rem;
      border-radius: 999px;
      background: var(--lvj-navy);
      color: #fff;
      font-size: 0.85rem;
      box-shadow: var(--lvj-shadow-soft);
    }
    .sel-btn {
      height: 32px;
      padding: 0 0.85rem;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 999px;
      background: transparent;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .sel-btn.primary {
      background: #fff;
      border-color: #fff;
      color: var(--lvj-navy);
    }
    .karat-note,
    .compare-note {
      display: block;
      font-size: 0.72rem;
      color: var(--lvj-muted);
    }
    .compare-note { text-decoration: line-through; }
    .search {
      margin: 0;
      width: min(360px, 100%);
      padding: 0.75rem 1rem;
      border: 1px solid var(--lvj-line-strong);
      background: var(--lvj-panel);
      border-radius: 999px;
    }
    .table-card {
      background: var(--lvj-panel);
      border: 1px solid var(--lvj-line);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--lvj-shadow-soft);
    }
    .status {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      background: rgba(28,28,28,0.06);
    }
    .status[data-s="active"] { background: rgba(70, 130, 90, 0.14); color: #2f5d3d; }
    .status[data-s="inactive"] { background: rgba(28,28,28,0.08); color: #666; }
    .status[data-s="archived"] { background: rgba(154, 59, 50, 0.12); color: #9a3b32; }
  `]
})
export class AdminProductListComponent implements OnInit {
  private readonly admin = inject(AdminProductService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  /** Ticked rows — kept across pages (table uses dataKey="id"). */
  readonly selected = signal<Product[]>([]);
  readonly selectedIds = computed(() => this.selected().map(p => p.id));
  readonly bulkOpen = signal(false);
  q = '';
  page = 1;

  money(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
  }

  /** e.g. "10K–18K: $540 – $790" */
  karatRange(p: Product): string {
    const prices = (p.options?.karatPrices ?? []).map(k => k.price).filter((x): x is number => x != null);
    if (!prices.length) return '';
    const karats = p.options!.karatPrices!.map(k => k.karat);
    const label = karats.length > 1 ? `${karats[0]}–${karats[karats.length - 1]}` : karats[0];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${label}: ${this.money(min)}` : `${label}: ${this.money(min)} – ${this.money(max)}`;
  }

  openBulk(): void {
    this.bulkOpen.set(true);
  }

  onBulkApplied(): void {
    this.bulkOpen.set(false);
    this.selected.set([]);
    this.load();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.admin.list({ q: this.q, page: this.page, pageSize: 20 }).subscribe(res => {
      this.products.set(res.data);
      this.total.set(res.total);
    });
  }

  onLazy(event: TableLazyLoadEvent): void {
    this.page = Math.floor((event.first ?? 0) / (event.rows ?? 20)) + 1;
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formOpen.set(true);
  }

  openEdit(row: Product): void {
    this.editingId.set(row.id);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  onDialogVisible(visible: boolean): void {
    if (!visible) this.closeForm();
    else this.formOpen.set(true);
  }

  onSaved(): void {
    this.closeForm();
    this.load();
  }

  toggle(row: Product): void {
    const status = row.status === 'active' ? 'inactive' : 'active';
    this.admin.setStatus(row.id, status).subscribe(() => this.load());
  }

  archive(row: Product): void {
    this.confirm.confirm({
      header: 'Archive product',
      message: `Archive ${row.name}?`,
      accept: () => this.admin.archive(row.id).subscribe(() => {
        this.toast.success('Product archived');
        this.load();
      })
    });
  }
}
