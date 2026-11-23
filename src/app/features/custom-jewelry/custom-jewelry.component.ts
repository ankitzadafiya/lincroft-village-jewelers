import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { RingJourneyComponent } from '../../shared/components/ring-journey/ring-journey.component';
import { ContactActionsComponent } from '../../shared/components/contact-actions/contact-actions.component';

@Component({
  selector: 'app-custom-jewelry',
  imports: [ReactiveFormsModule, SelectModule, RingJourneyComponent, ContactActionsComponent],
  templateUrl: './custom-jewelry.component.html',
  styleUrl: './custom-jewelry.component.scss'
})
export class CustomJewelryComponent {
  private readonly content = inject(ContentService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly referenceUrls = signal<string[]>(['']);

  readonly process = [
    { n: '01', title: 'Share your idea', text: 'Send sketches, photos or the stone you would like to use.' },
    { n: '02', title: 'CAD and quote', text: 'We send a CAD file, a 3D rendering and a price for the metal and diamonds.' },
    { n: '03', title: 'We make it', text: 'Once you approve, we print the wax model, cast it in gold, set the stones and polish.' }
  ];

  readonly jewelryTypeOptions = [
    { label: 'Engagement ring', value: 'Engagement ring' },
    { label: 'Wedding band', value: 'Wedding band' },
    { label: 'Earrings', value: 'Earrings' },
    { label: 'Necklace', value: 'Necklace' },
    { label: 'Bracelet', value: 'Bracelet' },
    { label: 'Other', value: 'Other' }
  ];

  readonly metalOptions = [
    { label: 'Yellow gold', value: 'Yellow gold' },
    { label: 'White gold', value: 'White gold' },
    { label: 'Rose gold', value: 'Rose gold' },
    { label: 'Platinum', value: 'Platinum' },
    { label: 'Undecided', value: 'Undecided' }
  ];

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
    const seo = inject(SeoService);
    seo.set({
      title: 'Custom Jewelry Design',
      description:
        'Create a custom piece with Lincroft Village Jewelers in Lincroft, NJ, from resetting an heirloom to a completely new design.',
      path: '/custom-jewelry',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Custom Jewelry Design',
        serviceType: 'Custom jewelry design',
        provider: { '@id': `${seo.siteUrl}/#store` },
        areaServed: 'Lincroft, New Jersey',
        url: seo.absoluteUrl('/custom-jewelry')
      }
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

  whatsappMessage(): string {
    const v = this.form.getRawValue();
    return `Custom jewelry request from ${v.name || 'a client'}: ${v.jewelryType}. ${v.description}`;
  }

  emailBodyText(): string {
    const v = this.form.getRawValue();
    return `${v.jewelryType}\n${v.description}`;
  }
}
