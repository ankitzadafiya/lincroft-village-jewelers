import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
    RevealDirective
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
  readonly occBridal = IMG.elise.enchanted;
  readonly occEveryday = IMG.elise.hoopInOut;
  readonly occGifts = IMG.elise.crossBracelet;

  ngOnInit(): void {
    this.seo.set({
      title: 'Fine Jewelry in Lincroft, NJ',
      description:
        'Lincroft Village Jewelers — lab-grown and natural diamond rings, earrings, pendants, necklaces, and bracelets in Lincroft, New Jersey.'
    });

    this.categoriesApi.list().subscribe(list => {
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
