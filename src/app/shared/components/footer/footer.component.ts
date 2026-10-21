import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { STORE_TOP_CATEGORIES } from '../../../core/catalog/store-categories';
import { StoreHours } from '../../../core/models';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { ContentService } from '../../../core/services/content.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppIconComponent } from '../../icons/lvj-icons';
import { LogoComponent } from '../logo/logo.component';

/** Google Maps embed + share link for the store (fixed, first-party values). */
const MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2752.4207034271135!2d-74.1219261245215!3d40.33072306087029!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c22e06f3e721bd%3A0xf0fe69fa8f6fe76!2sLincroft%20Village%20Jewelers!5e1!3m2!1sen!2sin!4v1792609865819!5m2!1sen!2sin';
const MAP_DIRECTIONS_URL = 'https://maps.app.goo.gl/MB7QKvLJT2nrCvuYA';
const STORE_TIME_ZONE = 'America/New_York';

interface HoursRow {
  day: string;
  short: string;
  label: string;
  closed: boolean;
  today: boolean;
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink, ReactiveFormsModule, AppIconComponent, LogoComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly config = inject(ConfigurationService);
  private readonly content = inject(ContentService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly submitting = signal(false);
  readonly year = new Date().getFullYear();
  readonly shopLinks = STORE_TOP_CATEGORIES;

  /** Constant, first-party Google Maps URL — safe to trust for the iframe. */
  readonly mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(MAP_EMBED_URL);
  readonly directionsUrl = MAP_DIRECTIONS_URL;

  /** Today's weekday in the store's own time zone (New Jersey) — highlights today's hours. */
  private readonly storeNow = (() => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: STORE_TIME_ZONE,
      weekday: 'long'
    }).formatToParts(new Date());
    return { day: parts.find(p => p.type === 'weekday')?.value ?? '' };
  })();

  readonly hours = computed<HoursRow[]>(() =>
    (this.config.config()?.hours ?? []).map((h: StoreHours) => {
      const closed = h.closed || !h.hours?.trim() || /closed/i.test(h.hours);
      return {
        day: h.day,
        short: h.day.slice(0, 3),
        label: closed ? 'Closed' : h.hours.replace(/\s*-\s*/, ' – '),
        closed,
        today: h.day.toLowerCase() === this.storeNow.day.toLowerCase()
      };
    })
  );

  readonly address = computed(() => {
    const cfg = this.config.config();
    if (!cfg?.addressLine) return null;
    return {
      line1: cfg.addressLine,
      line2: [cfg.city, [cfg.region, cfg.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    };
  });

  subscribe(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.submitting.set(true);
    this.content.newsletter({ email: this.email.value }).subscribe({
      next: res => {
        this.submitting.set(false);
        this.toast.success(res.message, 'Welcome');
        this.email.reset();
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('Unable to subscribe right now.');
      }
    });
  }
}
