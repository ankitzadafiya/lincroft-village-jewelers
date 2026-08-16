import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ScrollTopComponent } from '../../shared/components/scroll-top/scroll-top.component';
import { WhatsAppFloatComponent } from '../../shared/components/whatsapp-float/whatsapp-float.component';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ScrollTopComponent, WhatsAppFloatComponent],
  template: `
    <div class="storefront-shell">
      <app-header />
      <main id="main">
        <router-outlet />
      </main>
      <app-footer />
      <app-whatsapp-float />
      <app-scroll-top />
    </div>
  `
})
export class StorefrontLayoutComponent {}
