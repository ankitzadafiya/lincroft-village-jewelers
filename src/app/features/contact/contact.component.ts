import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfigurationService } from '../../core/services/configuration.service';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { buildWhatsAppUrl } from '../../core/utils/slug';
import { AppIconComponent } from '../../shared/icons/lvj-icons';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  template: `
    <div class="contact-page">
      <nav class="crumbs container" aria-label="Breadcrumb">
        <a routerLink="/">Home</a>
        <span aria-hidden="true">›</span>
        <span>Contact</span>
      </nav>

      <section class="container layout">
        <div class="form-col">
          <header class="intro">
            <p class="eyebrow">Contact</p>
            <h1>We would love to hear from you.</h1>
            <p>Your journey to timeless elegance starts here.</p>
          </header>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="row-2">
              <label class="float">
                <span class="sr">Name</span>
                <input formControlName="name" placeholder="Name" autocomplete="name" />
              </label>
              <label class="float">
                <span class="sr">Email</span>
                <input formControlName="email" type="email" placeholder="Email" autocomplete="email" />
              </label>
            </div>
            <label class="float">
              <span class="sr">Message</span>
              <textarea formControlName="message" placeholder="Message" rows="7"></textarea>
            </label>
            <label class="check">
              <input type="checkbox" formControlName="remember" />
              <span>Save my name and email in this browser for the next time I write.</span>
            </label>
            <button class="btn btn-gold submit" type="submit">Submit Now</button>
          </form>
        </div>

        <aside class="side">
          @if (config.config(); as cfg) {
            <div class="block">
              <h2>Address</h2>
              <p>{{ cfg.addressLine }}<br />{{ cfg.city }}, {{ cfg.region }} {{ cfg.postalCode }}</p>
              <a class="uline" [href]="mapsUrl()" target="_blank" rel="noreferrer">Come Visit Us</a>
            </div>

            <div class="block">
              <h2>Information</h2>
              <a class="uline" [href]="'tel:' + cfg.phone">{{ cfg.phoneDisplay }}</a>
              <a class="uline" [href]="'mailto:' + cfg.email">{{ cfg.email }}</a>
            </div>

            <div class="block">
              <h2>Social Media</h2>
              <div class="social">
                <a [href]="cfg.facebookUrl || 'https://facebook.com'" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <app-icon name="facebook" [size]="18" [strokeWidth]="1.5"></app-icon>
                </a>
                <a [href]="cfg.instagramUrl || 'https://instagram.com'" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <app-icon name="instagram" [size]="18" [strokeWidth]="1.5"></app-icon>
                </a>
              </div>
            </div>

            <div class="block">
              <h2>Store Hours</h2>
              <ul class="hours">
                @for (day of cfg.hours; track day.day) {
                  <li>
                    <span>{{ day.day }}</span>
                    <span>{{ day.hours }}</span>
                  </li>
                }
              </ul>
            </div>

            <a class="btn btn-ghost wa" [href]="whatsapp()" target="_blank" rel="noreferrer">WhatsApp Us</a>
          }
        </aside>
      </section>
    </div>
  `,
  styles: [`
    .contact-page {
      background: var(--lvj-ivory);
      min-height: 70vh;
      padding-bottom: 5rem;
    }

    .crumbs {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.55rem;
      padding: 1.5rem 1rem 0.35rem;
      font-size: 0.8rem;
      color: var(--lvj-muted);
    }

    .crumbs a:hover {
      color: var(--lvj-ink);
    }

    .layout {
      display: grid;
      gap: 3rem;
      padding-top: 1.75rem;
      padding-bottom: 2rem;
    }

    @media (min-width: 960px) {
      .layout {
        grid-template-columns: 1.45fr 0.9fr;
        gap: 4rem;
        align-items: start;
        padding-top: 2.5rem;
      }
    }

    .intro h1 {
      font-family: var(--font-body);
      font-style: normal;
      font-size: clamp(2rem, 4vw, 2.85rem);
      font-weight: 550;
      letter-spacing: -0.03em;
      line-height: 1.12;
      color: var(--lvj-ink);
    }

    .intro p {
      margin-top: 0.7rem;
      color: var(--lvj-muted);
      font-size: 1.02rem;
    }

    form {
      margin-top: 1.75rem;
      display: grid;
      gap: 0.9rem;
    }

    .row-2 {
      display: grid;
      gap: 0.9rem;
    }

    @media (min-width: 640px) {
      .row-2 {
        grid-template-columns: 1fr 1fr;
      }
    }

    .float input,
    .float textarea {
      width: 100%;
      border: 1px solid var(--lvj-line-strong);
      background: #fff;
      padding: 0.95rem 1rem;
      color: var(--lvj-ink);
      outline: none;
      border-radius: 14px;
      transition: border-color 0.3s var(--lvj-ease), box-shadow 0.3s var(--lvj-ease);
    }

    .float input:focus,
    .float textarea:focus {
      border-color: var(--lvj-gold);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--lvj-champagne) 32%, transparent);
    }

    .float textarea {
      resize: vertical;
      min-height: 160px;
    }

    .sr {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    .check {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      margin-top: 0.25rem;
      font-size: 0.86rem;
      color: #444;
      cursor: pointer;
    }

    .check input {
      margin-top: 0.2rem;
      accent-color: var(--lvj-ink);
    }

    .submit {
      justify-self: start;
      margin-top: 0.35rem;
    }

    .side {
      display: grid;
      gap: 1.75rem;
      padding: 1.5rem;
      background: #fff;
      border: 1px solid var(--lvj-line);
      border-radius: 0;
    }

    .block h2 {
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 0.55rem;
      color: var(--lvj-ink);
    }

    .uline {
      display: inline-block;
      color: var(--lvj-ink);
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: opacity 0.25s ease;
    }

    .uline + .uline {
      display: block;
      margin-top: 0.35rem;
    }

    .uline:hover {
      opacity: 0.55;
    }

    .social {
      display: flex;
      gap: 0.65rem;
    }

    .social a {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: var(--lvj-cream);
      display: grid;
      place-items: center;
      transition: transform 0.3s var(--lvj-ease);
    }

    .social a:hover {
      transform: translateY(-2px);
    }

    .hours li {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 1rem;
      font-size: 0.92rem;
      color: var(--lvj-charcoal);
      padding: 0.2rem 0;
    }
  `]
})
export class ContactComponent {
  readonly config = inject(ConfigurationService);
  private readonly content = inject(ContentService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
    remember: [false]
  });

  constructor() {
    inject(SeoService).set({
      title: 'Contact',
      description: 'Contact Lincroft Village Jewelers in Lincroft, New Jersey. Book a private appointment for lab-grown and natural diamond jewelry.'
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, message, remember } = this.form.getRawValue();
    if (remember && typeof localStorage !== 'undefined') {
      localStorage.setItem('lvj-contact', JSON.stringify({ name, email }));
    }
    this.content.contact({ name, email, phone: '', subject: 'Website inquiry', message }).subscribe({
      next: res => this.toast.success(res.message, 'Message sent'),
      error: err => this.toast.error(err.error?.message || 'Unable to send.')
    });
  }

  whatsapp(): string {
    const cfg = this.config.config();
    return cfg ? buildWhatsAppUrl(this.config.whatsAppNumber(), 'Hello, I would like to book an appointment.') : '#';
  }

  mapsUrl(): string {
    const cfg = this.config.config();
    if (!cfg) return '#';
    return cfg.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(`${cfg.addressLine}, ${cfg.city}, ${cfg.region} ${cfg.postalCode}`)}`;
  }
}
