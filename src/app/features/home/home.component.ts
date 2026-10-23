import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { STORE_TOP_CATEGORIES } from '../../core/catalog/store-categories';
import { Category, ProductListItem } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { DEMO_VIDEO, IMG } from '../../core/mock/image-catalog';
import { CategoryMosaicComponent } from '../../shared/components/category-mosaic/category-mosaic.component';
import { HeroTriptychComponent } from '../../shared/components/hero-triptych/hero-triptych.component';
import { ServicesHelpComponent } from '../../shared/components/services-help/services-help.component';
// import { CustomDesignFeatureComponent } from '../../shared/components/custom-design-feature/custom-design-feature.component';
import { LookTile, ShopTheLookComponent } from '../../shared/components/shop-the-look/shop-the-look.component';
import { HomeCollectionComponent } from '../../shared/components/home-collection/home-collection.component';
import { RingJourneyComponent } from '../../shared/components/ring-journey/ring-journey.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { AppIconComponent } from '../../shared/icons/lvj-icons';

import { withDemoImages } from '../../core/mock/demo-product-images';
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    CategoryMosaicComponent,
    HeroTriptychComponent,
    ServicesHelpComponent,
    // CustomDesignFeatureComponent,
    RingJourneyComponent,
    ShopTheLookComponent,
    HomeCollectionComponent,
    RevealDirective,
    AppIconComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly productsApi = inject(ProductService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly seo = inject(SeoService);

  readonly heroCategories = signal<Category[]>([]);
  readonly bestSellers = signal<ProductListItem[]>([]);
  readonly arrivals = signal<ProductListItem[]>([]);
  readonly bestLoading = signal(true);
  readonly arrivalsLoading = signal(true);

  /** Video feature 1 — lab-grown bridal. */
  readonly bridalTiles: LookTile[] = [
    {
      key: 'engagement',
      kicker: 'Lab-grown',
      title: 'Engagement rings',
      cta: 'Shop lab-grown engagement rings',
      path: '/ring',
      queryParams: { subcategory: 'ring-lab-grown-engagement-ring' },
      src: DEMO_VIDEO.ringOnHand.src,
      srcSmall: DEMO_VIDEO.ringOnHand.srcSmall,
      poster: DEMO_VIDEO.ringOnHand.poster,
      thumb: '/images/jewelry/engagement-ring-side.webp',
      thumbZoom: 1.25
    },
    {
      key: 'bands',
      kicker: 'Lab-grown',
      title: 'Wedding bands',
      cta: 'Shop lab-grown wedding bands',
      path: '/ring',
      queryParams: { subcategory: 'ring-lab-grown-wedding-band' },
      src: DEMO_VIDEO.weddingBand.src,
      thumb: '/images/jewelry/twist-band-side.webp',
      thumbZoom: 1.25
    }
  ];

  /** Video feature 2 — everyday + silver with 24k gold plating (mirrored layout). */
  readonly everydayTiles: LookTile[] = [
    {
      key: 'everyday',
      kicker: 'Everyday',
      title: 'Everyday jewelry',
      cta: 'Shop everyday jewelry',
      path: '/shop',
      src: DEMO_VIDEO.everydayRings.src,
      srcSmall: DEMO_VIDEO.everydayRings.srcSmall,
      thumb: IMG.catEarrings,
      thumbZoom: 1.4,
      focus: '60% 50%'
    },
    {
      key: 'silver-gold',
      kicker: 'Silver + 24k gold',
      title: 'Gold-plated silver',
      cta: 'Shop silver jewelry with 24k gold plating',
      path: '/silver-jewelry-with-24k-gold-plating',
      src: DEMO_VIDEO.goldBracelet.src,
      srcSmall: DEMO_VIDEO.goldBracelet.srcSmall,
      thumb: IMG.catSilver,
      thumbZoom: 1.2
    }
  ];

  readonly occasionPicks = [
    {
      label: 'Lab-Grown tennis bracelet',
      hint: 'Tennis bracelet',
      alt: 'Lab-grown diamond tennis bracelet',
      image: '/images/jewelry/tennis-bracelet.webp',
      imagePosition: 'center',
      route: '/bracelet',
      subcategory: 'bracelet-lab-grown-diamond-tennis-bracelet'
    },
    {
      label: 'Lab-Grown Diamond studs',
      hint: 'Stud earrings',
      alt: 'Lab-grown diamond stud earrings',
      image: IMG.earring1,
      imagePosition: 'center',
      route: '/earring',
      subcategory: 'earring-studs'
    },
    {
      label: 'Lab-Grown Diamond Cross',
      hint: 'Cross pendant',
      alt: 'Lab-grown diamond cross pendant',
      image: IMG.necklace3,
      imagePosition: '50% 18%',
      route: '/pendant',
      subcategory: 'pendant-lab-grown-diamond-cross'
    },
    {
      label: 'Lab-Grown Diamond Tennis Necklace',
      hint: 'Tennis necklace',
      alt: 'Lab-grown diamond tennis necklace',
      image: IMG.necklace2,
      imagePosition: 'center',
      route: '/necklace',
      subcategory: 'necklace-lab-grown-diamond-tennis-necklace'
    }
  ] as const;

  ngOnInit(): void {
    this.seo.set({
      title: 'Fine Jewelry & Custom Jewelry in Lincroft, NJ',
      description:
        'Lab-grown and natural diamond rings, earrings, pendants, necklaces, and bracelets at Lincroft Village Jewelers in Lincroft, New Jersey. Browse, save, and inquire.',
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Lincroft Village Jewelers',
        description:
          'Fine jewelry store in Lincroft, New Jersey offering lab-grown and natural diamond jewelry and custom design.',
        url: this.seo.absoluteUrl('/'),
        isPartOf: { '@id': `${this.seo.siteUrl}/#website` },
        about: { '@id': `${this.seo.siteUrl}/#store` }
      }
    });

    this.categoriesApi.list().pipe(
      switchMap(list => this.productsApi.enrichCategoryCounts(list))
    ).subscribe(list => {
      const bySlug = (slug: string) => list.find(c => c.slug === slug && !c.parentId);
      const picks = STORE_TOP_CATEGORIES.map(c => bySlug(c.slug)).filter((c): c is Category => !!c);
      this.heroCategories.set(
        picks.length
          ? picks
          : list.filter(c => !c.parentId && c.active).sort((a, b) => a.sortOrder - b.sortOrder)
      );
    });

    // Home shows four pieces per collection, chosen in Admin → Products (flags).
    this.productsApi.list({ bestSeller: true, pageSize: 4, sort: 'featured' }).subscribe({
      next: res => {
        this.bestSellers.set(withDemoImages(res.data));
        this.bestLoading.set(false);
      },
      error: () => this.bestLoading.set(false)
    });
    this.productsApi.list({ newArrival: true, pageSize: 4, sort: 'newest' }).subscribe({
      next: res => {
        this.arrivals.set(withDemoImages(res.data, 1));
        this.arrivalsLoading.set(false);
      },
      error: () => this.arrivalsLoading.set(false)
    });
  }
}
