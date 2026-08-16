import { Component, input } from '@angular/core';
import { ProductListItem } from '../../../core/models';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  imports: [ProductCardComponent],
  template: `
    <div class="grid-products">
      @for (product of products(); track product.id) {
        <app-product-card [product]="product" />
      }
    </div>
  `
})
export class ProductGridComponent {
  readonly products = input.required<ProductListItem[]>();
}
