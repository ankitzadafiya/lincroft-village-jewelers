import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { SeoService } from '../../core/services/seo.service';
import { ServiceOffering } from '../../core/models';
import { IMG } from '../../core/mock/image-catalog';
import { ServicesHelpComponent } from '../../shared/components/services-help/services-help.component';
import { ContactActionsComponent } from '../../shared/components/contact-actions/contact-actions.component';
import { AppIconComponent } from '../../shared/icons/lvj-icons';

interface ServiceDetail {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
}

const FALLBACK: ServiceDetail[] = [
  {
    id: 'jewelry-repair',
    title: 'Jewelry Repair & Cleaning',
    body: 'Bring back the shine of the pieces you love. From prong retipping and ring resizing to chain soldering and ultrasonic cleaning, every piece is checked over before it leaves our bench.',
    imageUrl: IMG.serviceRepair
  },
  {
    id: 'gold-buying',
    title: 'We Buy Gold',
    body: 'Turn unwanted gold into cash with a competitive, no-pressure quote. We buy gold jewelry, coins and bullion on the spot, in any condition.',
    imageUrl: IMG.serviceGold
  },
  {
    id: 'watch-repair',
    title: 'Watch Repairs',
    body: 'Same-visit battery replacement and bracelet sizing when parts allow. Mechanical service is coordinated with trusted watchmaking specialists so your piece is in the right hands.',
    imageUrl: IMG.serviceWatch
  },
  {
    id: 'jewelry-appraisal',
    title: 'Appraisals',
    body: 'Written appraisals prepared with current market context, for insurance, estate planning or peace of mind. Appointments are recommended for multiple items.',
    imageUrl: IMG.serviceAppraisal
  },
  {
    id: 'battery-links',
    title: 'Same Day Watch Battery Replacement & Link Adjustments',
    body: 'Most battery replacements and bracelet link adjustments are completed while you wait, so you leave with a watch that fits and keeps time.',
    imageUrl: IMG.serviceBattery
  },
  {
    id: 'estate-consulting',
    title: 'Estate Jewelry Consulting',
    body: 'Our experts provide guidance on rough valuations and help establish a clear, informed plan for asset distribution. This service is tailored specifically for jewelry-only estates.',
    imageUrl: IMG.serviceEstate
  }
];

@Component({
  selector: 'app-services',
  imports: [RouterLink, ServicesHelpComponent, ContactActionsComponent, AppIconComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(ContentService);

  readonly services = signal<ServiceDetail[]>(FALLBACK);

  readonly process = [
    { n: '01', title: 'Reach out', text: 'Call, message us on WhatsApp, or stop by our Lincroft showroom with the piece.' },
    { n: '02', title: 'We take a look', text: 'Our team examines it on the spot and gives you an honest estimate and timeframe.' },
    { n: '03', title: 'Pick it up', text: 'Most repairs and services are ready the same day, or within the week for larger work.' }
  ];

  ngOnInit(): void {
    this.seo.set({
      title: 'Jewelry Repair & Services',
      description:
        'Jewelry repair, cleaning, appraisals, watch care, gold buying, and estate consulting at Lincroft Village Jewelers in Lincroft, NJ.',
      path: '/services',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Jewelry Services',
        description:
          'Repair, cleaning, appraisals, watch care, gold buying, and estate consulting at Lincroft Village Jewelers.',
        url: this.seo.absoluteUrl('/services')
      }
    });

    this.content.services().subscribe({
      next: list => {
        const bySlug = new Map(list.map(s => [s.slug, s]));
        this.services.set(FALLBACK.map(item => this.fromApi(bySlug.get(item.id), item)));
      },
      error: () => undefined
    });
  }

  private fromApi(service: ServiceOffering | undefined, fallback: ServiceDetail): ServiceDetail {
    if (!service) return fallback;
    if (fallback.id === 'gold-buying' || fallback.id === 'estate-consulting' || fallback.id === 'battery-links') {
      return { ...fallback, imageUrl: service.imageUrl || fallback.imageUrl };
    }
    return {
      id: fallback.id,
      title: service.title || fallback.title,
      body: service.description || service.summary || fallback.body,
      imageUrl: service.imageUrl || fallback.imageUrl
    };
  }
}
