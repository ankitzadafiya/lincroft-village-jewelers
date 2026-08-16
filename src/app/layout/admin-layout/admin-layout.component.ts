import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StaffPermission } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AppIconComponent } from '../../shared/icons/lvj-icons';

type NavItem = { path: string; label: string; icon: string; permission: StaffPermission | null };

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent, ThemeToggleComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly allCatalogNav: NavItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'layout-dashboard', permission: null },
    { path: '/admin/products', label: 'Products', icon: 'package', permission: 'products.manage' },
    { path: '/admin/categories', label: 'Categories', icon: 'store', permission: 'categories.manage' },
    { path: '/admin/designers', label: 'Designers', icon: 'sparkles', permission: 'designers.manage' },
    { path: '/admin/import', label: 'Import', icon: 'upload', permission: 'import' }
  ];

  private readonly allStudioNav: NavItem[] = [
    { path: '/admin/inquiries', label: 'Leads', icon: 'inbox', permission: 'inquiries' },
    { path: '/admin/content', label: 'Content', icon: 'file-text', permission: 'content.manage' },
    { path: '/admin/settings', label: 'Pricing & Store', icon: 'settings', permission: 'settings' }
  ];

  readonly catalogNav = computed(() =>
    this.allCatalogNav.filter(item => !item.permission || this.auth.canAccess(item.permission))
  );

  readonly studioNav = computed(() =>
    this.allStudioNav.filter(item => !item.permission || this.auth.canAccess(item.permission))
  );

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }

  initials(): string {
    const name = this.auth.user()?.name || 'A';
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? 'A') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
