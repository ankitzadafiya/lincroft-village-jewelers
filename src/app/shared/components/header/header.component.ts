import { Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
import { AppIconComponent } from '../../icons/lvj-icons';

interface NavItem {
  label: string;
  path: string;
  mega?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, LogoComponent, MegaMenuComponent, AppIconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly categoriesApi = inject(CategoryService);
  private readonly searchApi = inject(SearchService);
  private readonly router = inject(Router);
  readonly config = inject(ConfigurationService);
  readonly favorites = inject(FavoriteService);
  readonly inquiry = inject(InquiryService);
  readonly customer = inject(CustomerAuthService);
  readonly adminAuth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly promos = [
    'Free shipping on orders over $500 across the USA',
    'Lab-grown & natural diamonds, new arrivals this week',
    'Book a private appointment in Lincroft, NJ'
  ];

  readonly nav: NavItem[] = [
    { label: 'Home', path: '/', exact: true },
    ...STORE_TOP_CATEGORIES.map(category => ({
      label: category.navLabel,
      path: '/' + category.slug,
      mega: category.slug
    })),
    { label: 'Custom', path: '/custom-jewelry' },
    // { label: 'About', path: '/about' } — About page hidden for now
  ];

  /** Nav items that open a mega panel (rendered once, stacked under the header). */
  readonly megaItems = this.nav.filter(item => !!item.mega);
  readonly drawerKey = signal<string | null>(null);
  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  /** True while the open panel was opened by pointer hover (a click should then keep it open). */
  private openedByHover = false;

  readonly categories = signal<Category[]>([]);
  readonly compact = signal(false);
  /** 0–1 page scroll progress for the thin line under the header. */
  readonly progress = signal(0);
  /** Header slid away while scrolling down; returns on scroll up. */
  readonly hidden = signal(false);
  private lastY = 0;
  readonly mobileOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly promoOpen = signal(true);
  readonly megaKey = signal<string | null>(null);
  readonly results = signal<ProductListItem[]>([]);
  readonly searching = signal(false);
  readonly query = new FormControl('', { nonNullable: true });

  private readonly zone = inject(NgZone);
  private scrollTicking = false;
  /** Scroll work runs outside Angular, at most once per frame. */
  private readonly onScrollEvent = () => {
    if (this.scrollTicking) return;
    this.scrollTicking = true;
    requestAnimationFrame(() => {
      this.scrollTicking = false;
      this.onScroll();
    });
  };

  ngOnInit(): void {
    this.zone.runOutsideAngular(() =>
      window.addEventListener('scroll', this.onScrollEvent, { passive: true })
    );
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
      this.closeNow();
      this.drawerKey.set(null);
      this.setHidden(false);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScrollEvent);
    this.clearTimers();
  }

  parent(slug: string): Category | null {
    return this.categories().find(c => c.slug === slug && !c.parentId) ?? null;
  }

  children(slug: string): Category[] {
    const parent = this.parent(slug);
    if (!parent) return [];
    return this.categories()
      .filter(c => c.parentId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** Hover intent: short delay before the first open, instant switching once a panel is open. */
  onNavEnter(slug?: string): void {
    this.cancelClose();
    if (this.openTimer) clearTimeout(this.openTimer);
    if (!slug) {
      this.scheduleClose(90);
      return;
    }
    if (this.megaKey()) {
      if (this.megaKey() !== slug) this.openedByHover = true;
      this.megaKey.set(slug);
      return;
    }
    this.openTimer = setTimeout(() => {
      this.openedByHover = true;
      this.megaKey.set(slug);
    }, 110);
  }

  scheduleClose(delay = 200): void {
    if (this.openTimer) clearTimeout(this.openTimer);
    this.cancelClose();
    this.closeTimer = setTimeout(() => this.megaKey.set(null), delay);
  }

  cancelClose(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  closeNow(): void {
    this.clearTimers();
    this.openedByHover = false;
    this.megaKey.set(null);
  }

  /** Keyboard / click disclosure for the mega panel. */
  toggleMega(slug: string): void {
    this.clearTimers();
    if (this.megaKey() === slug && this.openedByHover) {
      // Pointer users hover first, then click: keep the panel open instead of toggling it shut.
      this.openedByHover = false;
      return;
    }
    this.openedByHover = false;
    this.megaKey.set(this.megaKey() === slug ? null : slug);
  }

  toggleDrawerGroup(slug: string): void {
    this.drawerKey.set(this.drawerKey() === slug ? null : slug);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    const open = this.megaKey();
    if (!open) return;
    this.closeNow();
    document.querySelector<HTMLButtonElement>(`.mega-toggle[aria-controls="mega-${open}"]`)?.focus();
  }

  private clearTimers(): void {
    if (this.openTimer) clearTimeout(this.openTimer);
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.openTimer = null;
    this.closeTimer = null;
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

  onScroll(): void {
    const y = window.scrollY;
    const delta = y - this.lastY;
    if (y < 140) {
      this.setHidden(false);
    } else if (delta > 6 && !this.megaKey() && !this.searchOpen() && !this.mobileOpen()) {
      this.setHidden(true);
    } else if (delta < -6) {
      this.setHidden(false);
    }
    if (Math.abs(delta) > 6 || y < 140) this.lastY = y;
    if (this.compact() !== y > 24) this.compact.set(y > 24);
    // progress line: written straight to the element (no change detection per frame)
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    this.line ??= (this.host.nativeElement as HTMLElement).querySelector<HTMLElement>('.scroll-line');
    if (this.line) this.line.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  /** Also publishes --lvj-header-offset so other sticky bars follow the header. */
  private setHidden(value: boolean): void {
    if (this.hidden() === value && this.lastOffsetSet) return;
    this.hidden.set(value);
    const bar = (this.host.nativeElement as HTMLElement).querySelector('header');
    const h = value ? 0 : Math.round(bar?.getBoundingClientRect().height ?? 66);
    document.documentElement.style.setProperty('--lvj-header-offset', `${h}px`);
    document.documentElement.classList.toggle('header-hidden', value);
    this.lastOffsetSet = true;
  }

  private lastOffsetSet = false;
  private line: HTMLElement | null = null;
}
