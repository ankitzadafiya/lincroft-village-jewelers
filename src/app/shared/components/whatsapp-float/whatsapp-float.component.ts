import { Component, inject } from '@angular/core';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { buildWhatsAppUrl } from '../../../core/utils/slug';
import { LvjIconsModule } from '../../icons/lvj-icons';

@Component({
  selector: 'app-whatsapp-float',
  imports: [LvjIconsModule],
  template: `
    <a class="wa" [href]="href()" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
      <lucide-icon name="message-circle" [size]="22" [strokeWidth]="1.6"></lucide-icon>
    </a>
  `,
  styles: [`
    .wa {
      position: fixed;
      right: 1.15rem;
      bottom: 1.15rem;
      z-index: 60;
      width: 54px;
      height: 54px;
      border-radius: 999px;
      background: #25d366;
      color: #fff;
      display: grid;
      place-items: center;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
      transition: transform 0.3s var(--lvj-ease), box-shadow 0.3s ease;
    }
    .wa:hover {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22);
    }
  `]
})
export class WhatsAppFloatComponent {
  private readonly config = inject(ConfigurationService);

  href(): string {
    const phone = this.config.whatsAppNumber() || '17325550142';
    return buildWhatsAppUrl(phone, 'Hello Lincroft Village Jewelers — I have a quick question.');
  }
}
