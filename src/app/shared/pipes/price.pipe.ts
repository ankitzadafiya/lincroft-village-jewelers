import { Pipe, PipeTransform, inject } from '@angular/core';
import { ConfigurationService } from '../../core/services/configuration.service';

@Pipe({ name: 'lvjPrice', standalone: true })
export class PricePipe implements PipeTransform {
  private readonly config = inject(ConfigurationService);

  transform(price: number | null | undefined, showPrice = true): string {
    if (!this.config.isPriceVisible({ showPrice }) || price == null) {
      return 'Price upon request';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  }
}
