import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { Product } from '../../../../core/models';
import { AdminProductService } from '../../../../core/services/admin-product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AppIconComponent } from '../../../../shared/icons/lvj-icons';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-admin-product-list',
  imports: [FormsModule, TableModule, DialogModule, ProductFormComponent, AppIconComponent],
  template: `
    <div class="admin-page">
      <div class="head">
        <div>
          <p class="eyebrow">Catalog</p>
          <h1>Products</h1>
        </div>
        <button type="button" class="btn" (click)="openCreate()">New product</button>
      </div>

      <input
        class="search"
        placeholder="Search name or SKU"
        [ngModel]="q"
        (ngModelChange)="q = $event; load()" />

      <div class="table-card">
        <p-table
          [value]="products()"
          [lazy]="true"
          [paginator]="true"
          [rows]="20"
          [totalRecords]="total()"
          (onLazyLoad)="onLazy($event)">
          <ng-template pTemplate="header">
            <tr>
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
              <td>{{ row.sku }}</td>
              <td>{{ row.name }}</td>
              <td><span class="status" [attr.data-s]="row.status">{{ row.status }}</span></td>
              <td>{{ row.price ?? '—' }}</td>
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
  `,
  styles: [`
    .head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .search {
      margin: 0 0 1rem;
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
  q = '';
  page = 1;

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
