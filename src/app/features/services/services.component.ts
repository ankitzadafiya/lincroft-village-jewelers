import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { ServicesHelpComponent } from '../../shared/components/services-help/services-help.component';
import { CustomDesignFeatureComponent } from '../../shared/components/custom-design-feature/custom-design-feature.component';

@Component({
  selector: 'app-services',
  imports: [RouterLink, ServicesHelpComponent, CustomDesignFeatureComponent],
  template: `
    <section class="page-hero">
      <p class="eyebrow">Atelier services</p>
      <h1>Care for what you already wear.</h1>
      <p class="lede">Repair, cleaning, appraisals, watch care, and custom design — one appointment at a time in Lincroft.</p>
      <a routerLink="/contact" class="btn btn-gold">Book an appointment</a>
    </section>
    <app-services-help [showLink]="false" />
    <app-custom-design-feature />
  `
})
export class ServicesComponent implements OnInit {
  ngOnInit(): void {
    inject(SeoService).set({
      title: 'Jewelry Services',
      description:
        'Custom design, repair, cleaning, watch service, appraisal, gold and diamond buying, and engraving in Lincroft, NJ.'
    });
  }
}
