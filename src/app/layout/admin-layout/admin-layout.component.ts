import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LvjIconsModule } from '../../shared/icons/lvj-icons';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LvjIconsModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly catalogNav = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { path: '/admin/products', label: 'Products', icon: 'package' },
    { path: '/admin/categories', label: 'Categories', icon: 'store' },
    { path: '/admin/designers', label: 'Designers', icon: 'sparkles' },
    { path: '/admin/import', label: 'Import', icon: 'upload' }
  ];

  readonly studioNav = [
    { path: '/admin/inquiries', label: 'Leads', icon: 'inbox' },
    { path: '/admin/content', label: 'Content', icon: 'file-text' },
    { path: '/admin/settings', label: 'Pricing & Store', icon: 'settings' }
  ];

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
