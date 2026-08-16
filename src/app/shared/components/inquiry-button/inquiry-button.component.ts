import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { InquiryService } from '../../../core/services/inquiry.service';
import { Product, ProductListItem } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-inquiry-button',
  template: `
    <button type="button" [class]="variant() === 'ghost' ? 'btn btn-ghost' : 'btn'" (click)="add($event)">
      {{ label() }}
    </button>
  `
})
export class InquiryButtonComponent {
  readonly product = input.required<Product | ProductListItem>();
  readonly label = input('Inquire');
  readonly variant = input<'solid' | 'ghost'>('solid');
  private readonly inquiry = inject(InquiryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  add(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.inquiry.add(this.product());
    this.toast.success('Added to your inquiry bag.');
    if (this.variant() === 'solid') {
      void this.router.navigate(['/inquiry']);
    }
  }
}
