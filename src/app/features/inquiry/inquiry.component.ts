import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InquiryService } from '../../core/services/inquiry.service';
import { InquiryItem } from '../../core/models';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ContactActionsComponent } from '../../shared/components/contact-actions/contact-actions.component';
import { AppIconComponent } from '../../shared/icons/lvj-icons';

@Component({
  selector: 'app-inquiry',
  imports: [ReactiveFormsModule, RouterLink, EmptyStateComponent, InputTextModule, TextareaModule, ContactActionsComponent, AppIconComponent],
  templateUrl: './inquiry.component.html',
  styleUrl: './inquiry.component.scss'
})
export class InquiryComponent {
  readonly inquiry = inject(InquiryService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly seo = inject(SeoService);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    message: ['I would like more information about the pieces in my inquiry bag.']
  });

  constructor() {
    this.seo.set({
      title: 'Inquiry bag',
      description: 'Request information on selected jewelry from Lincroft Village Jewelers.',
      path: '/inquiry',
      noIndex: true
    });
  }

  submit(): void {
    if (this.form.invalid || !this.inquiry.count()) {
      this.form.markAllAsTouched();
      return;
    }
    this.inquiry.submit(this.form.getRawValue()).subscribe({
      next: res => {
        this.toast.success(res.message, 'Inquiry sent');
        this.inquiry.clear();
        this.form.reset({ message: 'I would like more information about the pieces in my inquiry bag.' });
      },
      error: err => this.toast.error(err.error?.message || 'Unable to send inquiry.')
    });
  }

  lineKey(item: InquiryItem): string {
    return InquiryService.lineKey(item);
  }

  optionSummary(item: InquiryItem): string {
    return InquiryService.optionSummary(item);
  }

  private itemLines(): string {
    return this.inquiry.items()
      .map(i => {
        if (i.kind === 'diamond') return `- ${i.name}`;
        const opts = InquiryService.optionSummary(i);
        const custom = i.customization ? `\n  Customization: ${i.customization}` : '';
        return `- ${i.name} (${i.sku})${opts ? ` — ${opts}` : ''}${custom}`;
      })
      .join('\n');
  }

  whatsappMessage(): string {
    return `Hello Lincroft Village Jewelers, I would like information about:\n${this.itemLines()}`;
  }

  emailBodyText(): string {
    return `Hello,\n\nI would like information about:\n${this.itemLines()}\n`;
  }
}
