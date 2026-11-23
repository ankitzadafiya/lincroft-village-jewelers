import { Component, inject, input } from '@angular/core';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { buildMailto, buildWhatsAppUrl } from '../../../core/utils/slug';

/**
 * Paired WhatsApp + Email quick-contact buttons, same look everywhere
 * they appear on the site (product page, custom jewelry, services, inquiries).
 */
@Component({
  selector: 'app-contact-actions',
  template: `
    <div class="cta-row">
      <a class="btn-outline wa" [href]="whatsapp()" target="_blank" rel="noreferrer">
        <i class="pi pi-whatsapp" aria-hidden="true"></i> WhatsApp
      </a>
      <a class="btn-outline" [href]="emailHref()">
        <i class="pi pi-envelope" aria-hidden="true"></i> Email
      </a>
    </div>
  `,
  styles: [`
    .cta-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }

    .btn-outline {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      min-height: 50px;
      padding: 0.75rem 1rem;
      border: 1px solid var(--lvj-line-strong);
      border-radius: 12px;
      background: var(--lvj-panel);
      color: var(--lvj-ink);
      font-family: var(--font-body);
      font-weight: 500;
      font-size: 0.9rem;
      text-decoration: none;
      cursor: pointer;
      transition:
        transform 0.25s ease,
        box-shadow 0.25s ease,
        background-color 0.25s ease,
        color 0.25s ease,
        border-color 0.25s ease;

      .pi {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--lvj-sky);
        color: var(--lvj-navy);
        font-size: 0.85rem;
        transition: background-color 0.25s ease, color 0.25s ease;
      }

      &.wa .pi {
        background: #e7f7ee;
        color: #1f9d55;
      }

      &:hover,
      &:focus-visible {
        border-color: var(--lvj-navy);
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(10, 29, 58, 0.08);
      }

      &.wa:hover .pi {
        background: #1f9d55;
        color: #fff;
      }

      &:not(.wa):hover .pi {
        background: var(--lvj-navy);
        color: #fff;
      }
    }
  `]
})
export class ContactActionsComponent {
  private readonly config = inject(ConfigurationService);

  readonly whatsappMessage = input('Hi! I would like to get in touch.');
  readonly emailSubject = input('Website inquiry');
  readonly emailBody = input('');

  whatsapp(): string {
    const phone = this.config.whatsAppNumber();
    return phone ? buildWhatsAppUrl(phone, this.whatsappMessage()) : '#';
  }

  emailHref(): string {
    const cfg = this.config.config();
    return cfg?.email ? buildMailto(cfg.email, this.emailSubject(), this.emailBody()) : '#';
  }
}
