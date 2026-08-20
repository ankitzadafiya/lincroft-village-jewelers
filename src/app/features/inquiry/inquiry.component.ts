import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigurationService } from '../../core/services/configuration.service';
import { InquiryService } from '../../core/services/inquiry.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { buildMailto, buildWhatsAppUrl } from '../../core/utils/slug';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-inquiry',
  imports: [ReactiveFormsModule, RouterLink, EmptyStateComponent, InputTextModule, TextareaModule],
  templateUrl: './inquiry.component.html',
  styleUrl: './inquiry.component.scss'
})
export class InquiryComponent {
  readonly inquiry = inject(InquiryService);
  readonly config = inject(ConfigurationService);
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
    this.seo.set({ title: 'Inquiry bag', description: 'Request information on selected jewelry from Lincroft Village Jewelers.' });
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

  whatsapp(): string {
    const cfg = this.config.config();
    if (!cfg) return '#';
    const lines = this.inquiry.items().map(i => `- ${i.name} (${i.sku})`).join('\n');
    return buildWhatsAppUrl(this.config.whatsAppNumber(), `Hello Lincroft Village Jewelers, I would like information about:\n${lines}`);
  }

  emailHref(): string {
    const cfg = this.config.config();
    if (!cfg?.email) return '#';
    const lines = this.inquiry.items().map(i => `- ${i.name} (${i.sku})`).join('\n');
    return buildMailto(cfg.email, 'Jewelry inquiry', `Hello,\n\nI would like information about:\n${lines}\n`);
  }
}
