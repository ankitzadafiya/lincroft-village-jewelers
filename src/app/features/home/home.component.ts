import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { STORE_TOP_CATEGORIES } from '../../core/catalog/store-categories';
import { Category, ProductListItem } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { IMG, VIDEO } from '../../core/mock/image-catalog';
import { CategoryShowcaseComponent } from '../../shared/components/category-showcase/category-showcase.component';
import { ProductGridComponent } from '../../shared/components/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { HeroCarouselComponent } from '../../shared/components/hero-carousel/hero-carousel.component';
import { ServicesHelpComponent } from '../../shared/components/services-help/services-help.component';
import { CustomDesignFeatureComponent } from '../../shared/components/custom-design-feature/custom-design-feature.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { AppIconComponent } from '../../shared/icons/lvj-icons';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    CategoryShowcaseComponent,
    ProductGridComponent,
    SectionHeaderComponent,
    LoadingSkeletonComponent,
    HeroCarouselComponent,
    ServicesHelpComponent,
    CustomDesignFeatureComponent,
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
  readonly featured = signal<ProductListItem[]>([]);
  readonly arrivals = signal<ProductListItem[]>([]);
  readonly loading = signal(true);

  readonly bannerLeft = IMG.elise.marquiseLabY;
  readonly bannerRight = IMG.elise.tennis7ct;
  readonly bannerLeftVideo = VIDEO.bannerRings;
  readonly bannerRightVideo = VIDEO.bannerEveryday;

  readonly occasionPicks = [
    {
      label: 'Lab-Grown tennis bracelet',
      hint: 'Tennis bracelet',
      alt: 'Lab-grown diamond tennis bracelet',
      image: IMG.bracelet2,
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
        'Lincroft Village Jewelers — lab-grown and natural diamond rings, earrings, pendants, necklaces, and bracelets in Lincroft, New Jersey. Browse, save, and inquire.',
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Lincroft Village Jewelers',
        description:
          'Fine jewelry atelier in Lincroft, New Jersey offering lab-grown and natural diamond jewelry and custom design.',
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

    this.productsApi.list({ featured: true, pageSize: 8, sort: 'featured' }).subscribe(res => {
      this.featured.set(res.data);
      this.loading.set(false);
    });
    this.productsApi.list({ newArrival: true, pageSize: 8, sort: 'newest' }).subscribe(res => this.arrivals.set(res.data));
  }
}
