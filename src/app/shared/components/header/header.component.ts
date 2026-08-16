import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { STORE_TOP_CATEGORIES } from '../../../core/catalog/store-categories';
import { Category, ProductListItem } from '../../../core/models';
import { CategoryService } from '../../../core/services/category.service';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { CustomerAuthService } from '../../../core/services/customer-auth.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { InquiryService } from '../../../core/services/inquiry.service';
import { SearchService } from '../../../core/services/search.service';
import { LogoComponent } from '../logo/logo.component';
import { MegaMenuComponent } from '../mega-menu/mega-menu.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { AppIconComponent } from '../../icons/lvj-icons';

interface NavItem {
  label: string;
  path: string;
  mega?: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, LogoComponent, MegaMenuComponent, AppIconComponent, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private readonly categoriesApi = inject(CategoryService);
  private readonly searchApi = inject(SearchService);
  private readonly router = inject(Router);
  readonly config = inject(ConfigurationService);
  readonly favorites = inject(FavoriteService);
  readonly inquiry = inject(InquiryService);
  readonly customer = inject(CustomerAuthService);
  readonly adminAuth = inject(AuthService);

  readonly promos = [
    'Free shipping on orders over $500 across the USA',
    'Lab-grown & natural diamonds — new arrivals this week',
    'Book a private appointment in Lincroft, NJ'
  ];

  readonly nav: NavItem[] = [
    ...STORE_TOP_CATEGORIES.map(category => ({
      label: category.navLabel,
      path: '/' + category.slug,
      mega: category.slug
    })),
    { label: 'Custom', path: '/custom-jewelry' },
    { label: 'About', path: '/about' }
  ];

  readonly categories = signal<Category[]>([]);
  readonly compact = signal(false);
  readonly mobileOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly promoOpen = signal(true);
  readonly promoIndex = signal(0);
  readonly megaKey = signal<string | null>(null);
  readonly results = signal<ProductListItem[]>([]);
  readonly searching = signal(false);
  readonly query = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.categoriesApi.list().subscribe(list => this.categories.set(list));
    this.query.valueChanges.pipe(debounceTime(280), distinctUntilChanged()).subscribe(value => {
      const q = value.trim();
      if (q.length < 2) {
        this.results.set([]);
        return;
      }
      this.searching.set(true);
      this.searchApi.search(q, 6).subscribe({
        next: res => {
          this.results.set(res.data);
          this.searching.set(false);
        },
        error: () => this.searching.set(false)
      });
    });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileOpen.set(false);
      this.searchOpen.set(false);
      this.megaKey.set(null);
    });
  }

  parent(slug: string): Category | null {
    return this.categories().find(c => c.slug === slug && !c.parentId) ?? null;
  }

  children(slug: string): Category[] {
    const parent = this.parent(slug);
    if (!parent) return [];
    return this.categories().filter(c => c.parentId === parent.id);
  }

  openMega(slug?: string): void {
    this.megaKey.set(slug ?? null);
  }

  shiftPromo(dir: number): void {
    const next = (this.promoIndex() + dir + this.promos.length) % this.promos.length;
    this.promoIndex.set(next);
  }

  goSearch(): void {
    const q = this.query.value.trim();
    if (!q) return;
    this.searchOpen.set(false);
    void this.router.navigate(['/search'], { queryParams: { q } });
  }

  mapsUrl(): string {
    const cfg = this.config.config();
    if (!cfg) return '#';
    const q = encodeURIComponent(`${cfg.addressLine}, ${cfg.city}, ${cfg.region} ${cfg.postalCode}`);
    return `https://maps.google.com/?q=${q}`;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.compact.set(window.scrollY > 24);
  }
}
