import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ConfirmationService } from 'primeng/api';
import { Product } from '../../../../core/models';
import { AdminProductService } from '../../../../core/services/admin-product.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-product-list',
  imports: [RouterLink, FormsModule, TableModule],
  template: `
    <div class="admin-page">
      <div class="head">
        <h1>Products</h1>
        <a routerLink="/admin/products/new" class="btn">New product</a>
      </div>
      <input class="search" placeholder="Search name or SKU" [ngModel]="q" (ngModelChange)="q = $event; load()" />
      <p-table [value]="products()" [lazy]="true" [paginator]="true" [rows]="20" [totalRecords]="total()" (onLazyLoad)="onLazy($event)">
        <ng-template pTemplate="header">
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Status</th>
            <th>Price</th>
            <th>Show price</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.sku }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.status }}</td>
            <td>{{ row.price ?? '—' }}</td>
            <td>{{ row.showPrice ? 'Yes' : 'No' }}</td>
            <td>
              <a [routerLink]="['/admin/products', row.id]">Edit</a>
              <button type="button" (click)="toggle(row)">{{ row.status === 'active' ? 'Deactivate' : 'Activate' }}</button>
              <button type="button" (click)="archive(row)">Archive</button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    h1 { font-style: italic; font-size: 2.2rem; }
    .search { margin: 1rem 0; width: min(360px, 100%); padding: 0.7rem; border: 1px solid var(--lvj-line-strong); background: #fff; }
    td button, td a { margin-right: 0.6rem; background: none; border: 0; cursor: pointer; color: var(--lvj-gold-deep); }
  `]
})
export class AdminProductListComponent implements OnInit {
  private readonly admin = inject(AdminProductService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);
  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
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
