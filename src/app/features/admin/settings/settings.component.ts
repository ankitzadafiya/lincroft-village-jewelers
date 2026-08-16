import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AppConfiguration } from '../../../core/models';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-settings',
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <h1>Pricing & store</h1>
      <p class="muted">Global hide + product show follows <code>allowProductPriceOverride</code>. Product hide always wins when global prices are on. PUT sends the full configuration object.</p>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="field"><label><input type="checkbox" formControlName="showPricesGlobally" /> Show prices globally</label></div>
        <div class="field"><label><input type="checkbox" formControlName="allowProductPriceOverride" /> Allow a product to show price when global hide is on</label></div>
        <div class="field"><label>Store email</label><input formControlName="email" /></div>
        <div class="field"><label>Phone display</label><input formControlName="phoneDisplay" /></div>
        <div class="field"><label>WhatsApp number</label><input formControlName="whatsApp" /></div>
        <button class="btn" type="submit">Save configuration</button>
      </form>
    </div>
  `,
  styles: [`
    h1 { font-style: italic; }
    form { display: grid; gap: 1rem; max-width: 520px; }
    code { font-size: 0.85em; }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private readonly config = inject(ConfigurationService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    showPricesGlobally: [true],
    allowProductPriceOverride: [true],
    email: [''],
    phoneDisplay: [''],
    whatsApp: ['']
  });

  ngOnInit(): void {
    const cfg = this.config.config();
    if (cfg) {
      this.form.patchValue({
        showPricesGlobally: cfg.showPricesGlobally,
        allowProductPriceOverride: cfg.allowProductPriceOverride,
        email: cfg.email ?? '',
        phoneDisplay: cfg.phoneDisplay ?? '',
        whatsApp: cfg.whatsApp ?? ''
      });
    }
  }

  save(): void {
    const current = this.config.config();
    if (!current) {
      this.toast.error('Configuration has not loaded yet.');
      return;
    }
    const v = this.form.getRawValue();
    const payload: AppConfiguration = {
      ...current,
      showPricesGlobally: v.showPricesGlobally,
      allowProductPriceOverride: v.allowProductPriceOverride,
      email: v.email || undefined,
      phoneDisplay: v.phoneDisplay || undefined,
      whatsApp: v.whatsApp || undefined
    };
    this.config.update(payload).subscribe({
      next: () => this.toast.success('Configuration saved'),
      error: err => this.toast.error(err.error?.message || 'Unable to save.')
    });
  }
}
