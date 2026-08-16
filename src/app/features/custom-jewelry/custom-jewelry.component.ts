import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigurationService } from '../../core/services/configuration.service';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { buildMailto, buildWhatsAppUrl } from '../../core/utils/slug';
import { IMG } from '../../core/mock/image-catalog';
import { ImageCompareComponent } from '../../shared/components/image-compare/image-compare.component';

@Component({
  selector: 'app-custom-jewelry',
  imports: [ReactiveFormsModule, RouterLink, ImageCompareComponent],
  templateUrl: './custom-jewelry.component.html',
  styleUrl: './custom-jewelry.component.scss'
})
export class CustomJewelryComponent {
  readonly sketch = IMG.customSketch;
  readonly finished = IMG.customAfter;
  readonly config = inject(ConfigurationService);
  private readonly content = inject(ContentService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly referenceUrls = signal<string[]>(['']);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    jewelryType: ['Engagement ring', Validators.required],
    preferredMetal: ['Yellow gold'],
    gemstone: [''],
    budget: [''],
    description: ['', Validators.required]
  });

  constructor() {
    inject(SeoService).set({
      title: 'Custom Jewelry',
      description: 'Commission a custom piece with Lincroft Village Jewelers — from heirloom reset to entirely new design.'
    });
  }

  addReferenceUrl(): void {
    this.referenceUrls.update(urls => [...urls, '']);
  }

  updateReferenceUrl(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.referenceUrls.update(urls => urls.map((url, i) => i === index ? value : url));
  }

  removeReferenceUrl(index: number): void {
    this.referenceUrls.update(urls => urls.length === 1 ? [''] : urls.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.content.customJewelry({
      name: v.name,
      email: v.email,
      phone: v.phone,
      jewelryType: v.jewelryType,
      preferredMetal: v.preferredMetal || undefined,
      gemstone: v.gemstone || undefined,
      budget: v.budget || undefined,
      description: v.description || undefined,
      referenceImageUrls: this.referenceUrls().map(url => url.trim()).filter(Boolean)
    }).subscribe({
      next: res => {
        this.toast.success(res.message, 'Request received');
        this.form.reset({ jewelryType: 'Engagement ring', preferredMetal: 'Yellow gold' });
        this.referenceUrls.set(['']);
      },
      error: err => this.toast.error(err.error?.message || 'Unable to send the request.')
    });
  }

  whatsapp(): string {
    const v = this.form.getRawValue();
    const phone = this.config.whatsAppNumber();
    return phone
      ? buildWhatsAppUrl(phone, `Custom jewelry request from ${v.name || 'a client'}: ${v.jewelryType}. ${v.description}`)
      : '#';
  }

  emailHref(): string {
    const cfg = this.config.config();
    const v = this.form.getRawValue();
    return cfg?.email ? buildMailto(cfg.email, 'Custom jewelry request', `${v.jewelryType}\n${v.description}`) : '#';
  }
}
