import { Routes } from '@angular/router';
import { LEGACY_CATEGORY_REDIRECTS, STORE_TOP_CATEGORIES } from './core/catalog/store-categories';
import { authGuard, guestGuard, adminUsersGuard } from './core/guards/auth.guard';

const catalogPage = () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent);

export const routes: Routes = [
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/admin/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'products', loadComponent: () => import('./features/admin/products/product-list/product-list.component').then(m => m.AdminProductListComponent) },
          { path: 'products/new', loadComponent: () => import('./features/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent) },
          { path: 'products/:id', loadComponent: () => import('./features/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent) },
          { path: 'categories', loadComponent: () => import('./features/admin/categories/categories.component').then(m => m.AdminCategoriesComponent) },
          { path: 'designers', loadComponent: () => import('./features/admin/designers/designers.component').then(m => m.AdminDesignersComponent) },
          { path: 'import', loadComponent: () => import('./features/admin/import/import.component').then(m => m.ImportComponent) },
          { path: 'inquiries', loadComponent: () => import('./features/admin/inquiries/inquiries.component').then(m => m.AdminInquiriesComponent) },
          { path: 'content', loadComponent: () => import('./features/admin/content/content.component').then(m => m.AdminContentComponent) },
          { path: 'users', canActivate: [adminUsersGuard], loadComponent: () => import('./features/admin/users/users.component').then(m => m.AdminUsersComponent) },
          { path: 'settings', loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.AdminSettingsComponent) }
        ]
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./layout/storefront-layout/storefront-layout.component').then(m => m.StorefrontLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      { path: 'shop', loadComponent: catalogPage, data: { title: 'Shop' } },
      ...STORE_TOP_CATEGORIES.map(category => ({
        path: category.slug,
        loadComponent: catalogPage,
        data: { category: category.slug, title: category.name }
      })),
      { path: 'jewelry', redirectTo: 'shop', pathMatch: 'full' as const },
      ...LEGACY_CATEGORY_REDIRECTS.map(redirect => ({
        path: redirect.from,
        redirectTo: redirect.to,
        pathMatch: 'full' as const
      })),
      { path: 'designers', loadComponent: () => import('./features/designers/designers.component').then(m => m.DesignersComponent) },
      { path: 'designers/:slug', loadComponent: catalogPage },
      { path: 'product/:slug', loadComponent: () => import('./features/product/product.component').then(m => m.ProductComponent) },
      { path: 'custom-jewelry', loadComponent: () => import('./features/custom-jewelry/custom-jewelry.component').then(m => m.CustomJewelryComponent) },
      { path: 'services', loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent) },
      { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
      { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'favorites', loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent) },
      { path: 'account', loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent) },
      { path: 'inquiry', loadComponent: () => import('./features/inquiry/inquiry.component').then(m => m.InquiryComponent) },
      { path: 'search', loadComponent: () => import('./features/search/search.component').then(m => m.SearchPageComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
