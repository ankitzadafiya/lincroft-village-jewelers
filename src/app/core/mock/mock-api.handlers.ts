import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  CustomJewelryRequest,
  ImportPreviewResult,
  InquiryRequest,
  InquiryRecord,
  LoginRequest,
  ProductFilterFacets,
  ProductListQuery,
  ProductStatus,
  ProductWritePayload,
  UserRole
} from '../models';
import { slugify } from '../utils/slug';
import { DEFAULT_IMPORT_MAPPING, MOCK_CUSTOM_REQUESTS, MOCK_HOME, MOCK_INSTAGRAM, MOCK_SERVICES, MOCK_TESTIMONIALS } from './mock-data';
import { mockStore } from './mock-store';

const ADMIN_PERMISSIONS = [
  'products.manage',
  'categories.manage',
  'designers.manage',
  'import',
  'inquiries',
  'content.manage',
  'settings',
  'users.manage'
];
const STAFF_PERMISSIONS: string[] = [];
const CUSTOMER_PERMISSIONS = ['favorites'];

type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  password?: string;
  phone?: string;
  provider: 'password' | 'google';
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  googleSub?: string;
};

const nowIso = () => new Date().toISOString();

function permissionsFor(role: UserRole): string[] {
  if (role === 'admin') return [...ADMIN_PERMISSIONS];
  if (role === 'staff') return [...STAFF_PERMISSIONS];
  return [...CUSTOMER_PERMISSIONS];
}

let users: StoredUser[] = [
  {
    id: 'u-admin',
    email: 'admin@lincroftjewelers.com',
    name: 'Atelier Admin',
    role: 'admin',
    permissions: permissionsFor('admin'),
    password: 'demo1234',
    provider: 'password',
    createdAt: '2026-01-12T14:00:00.000Z',
    lastLoginAt: null,
    isActive: true
  },
  {
    id: 'u-customer',
    email: 'guest@example.com',
    name: 'Alex Morgan',
    role: 'customer',
    permissions: permissionsFor('customer'),
    password: 'welcome123',
    phone: '+17325550199',
    provider: 'password',
    createdAt: '2026-03-02T14:00:00.000Z',
    lastLoginAt: null,
    isActive: true
  }
];

function publicUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
    phone: user.phone,
    provider: user.provider,
    createdAt: user.createdAt
  };
}

function adminUserRecord(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role as 'admin' | 'staff',
    permissions: user.permissions,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt || undefined,
    createdAt: user.createdAt
  };
}

function sessionFor(user: StoredUser, kind: 'admin' | 'customer') {
  user.lastLoginAt = nowIso();
  return {
    token: kind === 'admin' ? `mock-admin-${user.id}` : `mock-customer-${user.id}`,
    user: publicUser(user),
    expiresAt: new Date(Date.now() + (kind === 'admin' ? 1000 * 60 * 60 * 12 : 1000 * 60 * 60 * 24 * 30)).toISOString()
  };
}

function bearer(req: HttpRequest<unknown>): string {
  return (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
}

function userFromToken(req: HttpRequest<unknown>, kind: 'admin' | 'customer'): StoredUser | undefined {
  const token = bearer(req);
  if (!token) return undefined;
  if (kind === 'admin') {
    if (token === 'mock-admin-token') return users.find(u => u.id === 'u-admin');
    if (token.startsWith('mock-admin-')) return users.find(u => u.id === token.slice('mock-admin-'.length));
    return undefined;
  }
  if (token.startsWith('mock-customer-')) return users.find(u => u.id === token.slice('mock-customer-'.length));
  return undefined;
}

function decodeGoogleToken(idToken: string): { email: string; name: string; sub: string } | null {
  if (!idToken) return null;
  if (idToken === 'mock-google') {
    return { email: 'google.guest@gmail.com', name: 'Google Guest', sub: 'google-mock' };
  }
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(json)) as { email?: string; name?: string; sub?: string };
    if (!payload.email) return null;
    return {
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      sub: payload.sub || payload.email
    };
  } catch {
    return null;
  }
}

function findOrCreateGoogleUser(identity: { email: string; name: string; sub: string }): StoredUser {
  const existing = users.find(u => u.email.toLowerCase() === identity.email.toLowerCase() || u.googleSub === identity.sub);
  if (existing) {
    existing.provider = existing.provider || 'google';
    existing.googleSub = existing.googleSub || identity.sub;
    return existing;
  }
  const created: StoredUser = {
    id: mockStore.nextId('u'),
    email: identity.email.toLowerCase(),
    name: identity.name,
    role: 'customer',
    permissions: permissionsFor('customer'),
    provider: 'google',
    googleSub: identity.sub,
    createdAt: nowIso(),
    lastLoginAt: null,
    isActive: true
  };
  users = [...users, created];
  return created;
}

function ok<T>(body: T, status = 200): Observable<HttpResponse<T>> {
  return of(new HttpResponse({ status, body })).pipe(delay(280));
}

function fail(status: number, message: string, errors?: Record<string, string[]>): Observable<never> {
  return throwError(() => new HttpErrorResponse({
    status,
    error: { message, errors, status }
  })).pipe(delay(200));
}

function isAdmin(req: HttpRequest<unknown>): boolean {
  const user = userFromToken(req, 'admin');
  return !!user && user.isActive && (user.role === 'admin' || user.role === 'staff');
}

function isCustomer(req: HttpRequest<unknown>): boolean {
  return !!userFromToken(req, 'customer');
}

let customerFavorites: string[] = [];
let customJewelryRecords: import('../models').CustomJewelryRecord[] = [];
let contactRecords: import('../models').ContactMessageRecord[] = [];
let newsletterRecords: import('../models').NewsletterSubscriber[] = [];


function queryParams(req: HttpRequest<unknown>): ProductListQuery {
  const p = req.params;
  const num = (key: string) => {
    const v = p.get(key);
    return v ? Number(v) : undefined;
  };
  const bool = (key: string) => {
    const v = p.get(key);
    return v == null ? undefined : v === 'true';
  };
  return {
    category: p.get('category') ?? undefined,
    subcategory: p.get('subcategory') ?? undefined,
    designer: p.get('designer') ?? undefined,
    metal: p.get('metal') ?? undefined,
    karat: p.get('karat') ?? undefined,
    gemstone: p.get('gemstone') ?? undefined,
    diamondType: p.get('diamondType') ?? undefined,
    diamondShape: p.get('diamondShape') ?? undefined,
    availability: p.get('availability') ?? undefined,
    status: p.get('status') ?? undefined,
    q: p.get('q') ?? undefined,
    sort: (p.get('sort') as ProductListQuery['sort']) ?? undefined,
    priceMin: num('priceMin'),
    priceMax: num('priceMax'),
    page: num('page') ?? 1,
    pageSize: num('pageSize') ?? 12,
    featured: bool('featured'),
    newArrival: bool('newArrival'),
    bestSeller: bool('bestSeller')
  };
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}

function facets(query: ProductListQuery): ProductFilterFacets {
  const scoped = mockStore.queryProducts({
    category: query.category,
    subcategory: query.subcategory,
    designer: query.designer,
    q: query.q,
    page: 1,
    pageSize: 5000
  }, true).items;
  const collect = (key: string) => {
    const map = new Map<string, number>();
    scoped.forEach(p => {
      const spec = p.specs.find(s => s.key === key);
      if (spec?.value) map.set(spec.value, (map.get(spec.value) ?? 0) + 1);
    });
    return [...map.entries()].map(([value, count]) => ({ value, label: value, count }));
  };
  const prices = scoped.map(p => p.price).filter((n): n is number => n != null);
  return {
    metals: collect('metal'),
    karats: collect('karat'),
    gemstones: collect('gemstone'),
    diamondTypes: collect('diamondType'),
    diamondShapes: [...collect('shape'), ...collect('diamondShape')].filter(
      (item, index, all) => all.findIndex(x => x.value === item.value) === index
    ),
    designers: mockStore.designers.map(d => ({
      value: d.slug,
      label: d.name,
      count: scoped.filter(p => p.designerId === d.id).length
    })).filter(d => d.count > 0),
    availability: ['in_stock', 'made_to_order', 'sold'].map(value => ({
      value,
      label: titleCase(value),
      count: scoped.filter(p => p.availability === value).length
    })).filter(d => d.count > 0),
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0
    }
  };
}

function validateCategoryRelation(categoryId: string, subcategoryId: string | null): string | null {
  const category = mockStore.categoryById(categoryId);
  if (!category || category.parentId) return 'Products must reference a valid top-level category.';
  if (subcategoryId) {
    const sub = mockStore.categoryById(subcategoryId);
    if (!sub || sub.parentId !== categoryId) return 'Subcategory does not belong to the selected category.';
  }
  return null;
}

export function handleMockRequest(req: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
  const url = req.url.replace(/https?:\/\/[^/]+/, '');
  const path = url.split('?')[0];
  const method = req.method.toUpperCase();
  const body = req.body as Record<string, unknown> | null;

  if (method === 'POST' && path.endsWith('/auth/login/google')) {
    const identity = decodeGoogleToken(String((body as { idToken?: string })?.idToken ?? ''));
    if (!identity) return fail(400, 'Google sign-in token is invalid.');
    const user = findOrCreateGoogleUser(identity);
    if (user.role !== 'admin' && user.role !== 'staff') {
      return fail(403, 'This Google account does not have atelier access.');
    }
    if (!user.isActive) return fail(401, 'Invalid email or password.');
    return ok(sessionFor(user, 'admin'));
  }

  if (method === 'POST' && path.endsWith('/auth/login')) {
    const creds = body as unknown as LoginRequest;
    const email = creds?.email?.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === email && u.password && u.password === creds?.password);
    if (!user || !user.isActive) return fail(401, 'Invalid email or password.');
    if (user.role !== 'admin' && user.role !== 'staff') {
      return fail(403, 'This account does not have atelier access.');
    }
    return ok(sessionFor(user, 'admin'));
  }

  if (method === 'GET' && path.endsWith('/auth/me')) {
    const user = userFromToken(req, 'admin');
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) return fail(401, 'Unauthorized');
    return ok(publicUser(user));
  }

  if (method === 'POST' && path.endsWith('/auth/logout')) {
    return ok({ message: 'Signed out' });
  }

  if (method === 'POST' && path.endsWith('/customer/login/google')) {
    const identity = decodeGoogleToken(String((body as { idToken?: string })?.idToken ?? ''));
    if (!identity) return fail(400, 'Google sign-in token is invalid.');
    const user = findOrCreateGoogleUser(identity);
    if (!user.isActive) return fail(401, 'Invalid email or password.');
    return ok(sessionFor(user, 'customer'));
  }

  if (method === 'POST' && path.endsWith('/customer/login')) {
    const creds = body as unknown as LoginRequest;
    const email = creds?.email?.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === email && u.password && u.password === creds?.password);
    if (!user || !user.isActive) return fail(401, 'Invalid email or password.');
    return ok(sessionFor(user, 'customer'));
  }

  if (method === 'POST' && path.endsWith('/customer/register')) {
    const payload = body as { name: string; email: string; password: string; phone?: string };
    if (!payload?.email || !payload?.password || !payload?.name) return fail(400, 'Name, email, and password are required.');
    if (users.some(c => c.email.toLowerCase() === payload.email.toLowerCase())) {
      return fail(400, 'An account with this email already exists.');
    }
    const user: StoredUser = {
      id: mockStore.nextId('u'),
      email: payload.email.trim().toLowerCase(),
      name: payload.name.trim(),
      role: 'customer',
      permissions: permissionsFor('customer'),
      password: payload.password,
      phone: payload.phone?.trim() || undefined,
      provider: 'password',
      createdAt: nowIso(),
      lastLoginAt: null,
      isActive: true
    };
    users = [...users, user];
    return ok(sessionFor(user, 'customer'), 201);
  }

  if (method === 'POST' && path.endsWith('/customer/logout')) {
    return ok({ message: 'Signed out' });
  }

  if (method === 'GET' && path.endsWith('/customer/me')) {
    const user = userFromToken(req, 'customer');
    if (!user) return fail(401, 'Unauthorized');
    return ok(publicUser(user));
  }

  if (method === 'GET' && path.endsWith('/customer/favorites')) {
    if (!isCustomer(req)) return fail(401, 'Please sign in to sync favorites.');
    return ok({ productIds: customerFavorites });
  }

  if (method === 'PUT' && path.endsWith('/customer/favorites')) {
    if (!isCustomer(req)) return fail(401, 'Please sign in to sync favorites.');
    customerFavorites = ((body as { productIds?: string[] })?.productIds ?? []) as string[];
    return ok({ productIds: customerFavorites });
  }

  if (method === 'GET' && path.endsWith('/config')) {
    return ok(mockStore.config);
  }

  if (method === 'PUT' && path.endsWith('/admin/config')) {
    if (!isAdmin(req)) return fail(401, 'Unauthorized');
    mockStore.config = { ...mockStore.config, ...(body as object) };
    return ok(mockStore.config);
  }

  if (method === 'GET' && path.endsWith('/content/home')) return ok(MOCK_HOME);
  if (method === 'GET' && path.endsWith('/content/testimonials')) return ok(MOCK_TESTIMONIALS.filter(t => t.active));
  if (method === 'GET' && path.endsWith('/content/services')) return ok(MOCK_SERVICES.filter(s => s.active));
  if (method === 'GET' && path.endsWith('/content/instagram')) return ok(MOCK_INSTAGRAM.filter(p => p.active));
  if (method === 'GET' && path.endsWith('/content/designers')) return ok(mockStore.designers.filter(d => d.active));

  if (method === 'GET' && path.endsWith('/categories')) {
    const withCounts = mockStore.categories.map(c => ({
      ...c,
      productCount: mockStore.products.filter(p => p.status === 'active' && (p.categoryId === c.id || p.subcategoryId === c.id)).length
    }));
    return ok(withCounts);
  }

  const categorySlug = path.match(/\/categories\/([^/]+)$/);
  if (method === 'GET' && categorySlug && !path.includes('/admin/')) {
    const category = mockStore.categoryBySlug(categorySlug[1]);
    return category ? ok(category) : fail(404, 'Category not found');
  }

  if (method === 'GET' && path.endsWith('/products/facets')) {
    return ok(facets(queryParams(req)));
  }

  if (method === 'GET' && path.endsWith('/products')) {
    const query = queryParams(req);
    const { items, total } = mockStore.queryProducts(query, true);
    return ok({
      data: items.map(p => mockStore.toListItem(p)),
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 12,
      totalPages: Math.ceil(total / (query.pageSize ?? 12))
    });
  }

  const related = path.match(/\/products\/([^/]+)\/related$/);
  if (method === 'GET' && related) {
    const product = mockStore.products.find(p => p.slug === related[1] || p.id === related[1]);
    if (!product) return fail(404, 'Product not found');
    const relatedItems = mockStore.products
      .filter(p => p.id !== product.id && p.status === 'active' && p.categoryId === product.categoryId)
      .slice(0, 4)
      .map(p => mockStore.toListItem(p));
    return ok(relatedItems);
  }

  const productSlug = path.match(/\/products\/([^/]+)$/);
  if (method === 'GET' && productSlug && !path.includes('/admin/')) {
    const product = mockStore.products.find(p => p.slug === productSlug[1] || p.id === productSlug[1]);
    return product && product.status === 'active' ? ok(product) : fail(404, 'Product not found');
  }

  if (method === 'GET' && path.endsWith('/search')) {
    const query = queryParams(req);
    query.pageSize = Number(req.params.get('pageSize') ?? 8);
    const { items, total } = mockStore.queryProducts(query, true);
    return ok({
      data: items.map(p => mockStore.toListItem(p)),
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / (query.pageSize ?? 8))
    });
  }

  if (method === 'POST' && path.endsWith('/inquiries')) {
    const inquiry = body as unknown as InquiryRequest;
    const record: InquiryRecord = {
      ...inquiry,
      id: mockStore.nextId('inq'),
      createdAt: new Date().toISOString(),
      status: 'new',
      source: inquiry.source ?? 'cart',
      items: inquiry.items ?? []
    };
    mockStore.inquiries = [record, ...mockStore.inquiries];
    return ok({ message: 'Inquiry received. We will be in touch shortly.' }, 201);
  }

  if (method === 'POST' && path.endsWith('/custom-jewelry')) {
    const payload = body as unknown as CustomJewelryRequest;
    customJewelryRecords = [{
      id: mockStore.nextId('cj'),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      jewelryType: payload.jewelryType,
      preferredMetal: payload.preferredMetal,
      gemstone: payload.gemstone,
      budget: payload.budget,
      description: payload.description,
      referenceImages: (payload.referenceImageUrls ?? []).map(url => ({ url, downloadStatus: 'pending' as const })),
      status: 'new',
      createdAt: new Date().toISOString()
    }, ...customJewelryRecords];
    MOCK_CUSTOM_REQUESTS.push(payload);
    return ok({ message: 'Custom design request received.' }, 201);
  }

  if (method === 'POST' && path.endsWith('/contact')) {
    const payload = body as { name: string; email: string; phone?: string; subject: string; message: string };
    contactRecords = [{
      id: mockStore.nextId('ct'),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      subject: payload.subject,
      message: payload.message,
      status: 'new',
      createdAt: new Date().toISOString()
    }, ...contactRecords];
    return ok({ message: 'Thank you. We will reply within one business day.' }, 201);
  }

  if (method === 'POST' && path.endsWith('/newsletter')) {
    const email = (body as { email?: string })?.email ?? '';
    if (!newsletterRecords.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      newsletterRecords = [{
        id: mockStore.nextId('nl'),
        email,
        active: true,
        createdAt: new Date().toISOString()
      }, ...newsletterRecords];
    }
    return ok({ message: 'You are on the list.' }, 201);
  }

  if (path.includes('/admin/') && !isAdmin(req)) {
    return fail(401, 'Unauthorized');
  }

  if (method === 'GET' && path.endsWith('/admin/users')) {
    const list = users
      .filter(u => u.role === 'admin' || u.role === 'staff')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(adminUserRecord);
    return ok(list);
  }

  if (method === 'POST' && path.endsWith('/admin/users')) {
    const payload = body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      role?: string;
      permissions?: string[];
    };
    const errors: Record<string, string[]> = {};
    const name = payload?.name?.trim() ?? '';
    const email = payload?.email?.trim().toLowerCase() ?? '';
    const password = payload?.password ?? '';
    if (!name) errors['name'] = ['Name is required'];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors['email'] = ['Email is not valid'];
    if (users.some(u => u.email.toLowerCase() === email)) errors['email'] = ['Email is already in use'];
    if (!password || password.length < 8) errors['password'] = ['Password must be at least 8 characters'];
    if (payload?.role !== 'admin' && payload?.role !== 'staff') errors['role'] = ['Role must be admin or staff'];
    if (Object.keys(errors).length) return fail(400, 'Unable to create this account.', errors);
    const role = payload.role as 'admin' | 'staff';
    const created: StoredUser = {
      id: mockStore.nextId('u'),
      email,
      name,
      role,
      permissions: role === 'admin' ? permissionsFor('admin') : [...(payload.permissions ?? [])],
      password,
      phone: payload.phone?.trim() || undefined,
      provider: 'password',
      createdAt: nowIso(),
      lastLoginAt: null,
      isActive: true
    };
    users = [...users, created];
    return ok(adminUserRecord(created), 201);
  }

  const userUpdatePath = path.match(/\/admin\/users\/([^/]+)$/);
  if (method === 'PATCH' && userUpdatePath && !path.endsWith('/status')) {
    const actor = userFromToken(req, 'admin');
    if (!actor || (actor.role !== 'admin' && !actor.permissions.includes('users.manage'))) {
      return fail(403, 'You do not have permission to manage staff accounts.');
    }
    const target = users.find(u => u.id === userUpdatePath[1]);
    if (!target || (target.role !== 'admin' && target.role !== 'staff')) {
      return fail(404, 'User not found.');
    }
    const payload = body as {
      name?: string;
      phone?: string | null;
      role?: string;
      permissions?: string[];
      password?: string;
    };
    const errors: Record<string, string[]> = {};
    const name = payload?.name?.trim() ?? '';
    if (!name || name.length < 2) errors['name'] = ['Name is required'];
    if (payload?.role !== 'admin' && payload?.role !== 'staff') errors['role'] = ['Role must be admin or staff'];
    if (payload?.password && payload.password.length < 8) {
      errors['password'] = ['Password must be at least 8 characters'];
    }
    if (Object.keys(errors).length) return fail(400, 'Unable to update this account.', errors);

    const role = payload.role as 'admin' | 'staff';
    target.name = name;
    target.phone = payload.phone?.trim() || undefined;
    target.role = role;
    target.permissions = role === 'admin' ? permissionsFor('admin') : [...(payload.permissions ?? [])];
    if (payload.password) target.password = payload.password;
    return ok(adminUserRecord(target));
  }

  const userStatusPath = path.match(/\/admin\/users\/([^/]+)\/status$/);
  if (method === 'PATCH' && userStatusPath) {
    const actor = userFromToken(req, 'admin');
    const target = users.find(u => u.id === userStatusPath[1]);
    if (!target) return fail(404, 'User not found.');
    const isActive = (body as { isActive?: boolean })?.isActive;
    if (typeof isActive !== 'boolean') return fail(400, 'isActive is required.');
    if (target.id === actor?.id && isActive === false) {
      return fail(400, 'You cannot deactivate your own account.');
    }
    target.isActive = isActive;
    return ok(adminUserRecord(target));
  }

  if (method === 'GET' && path.endsWith('/admin/dashboard')) {
    const products = mockStore.products;
    return ok({
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      inactiveProducts: products.filter(p => p.status !== 'active').length,
      categories: mockStore.categories.filter(c => !c.parentId).length,
      inquiries: mockStore.inquiries.length,
      missingImages: products.filter(p => p.images.length === 0).length,
      missingInformation: products.filter(p => !p.description || p.specs.length === 0).length,
      recentProducts: [...products]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6)
        .map(p => ({ id: p.id, sku: p.sku, name: p.name, updatedAt: p.updatedAt }))
    });
  }

  if (method === 'GET' && path.endsWith('/admin/products')) {
    const query = queryParams(req);
    const { items, total } = mockStore.queryProducts(query, false);
    return ok({
      data: items,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      totalPages: Math.ceil(total / (query.pageSize ?? 20))
    });
  }

  const adminProduct = path.match(/\/admin\/products\/([^/]+)$/);
  if (method === 'GET' && adminProduct) {
    const product = mockStore.products.find(p => p.id === adminProduct[1]);
    return product ? ok(product) : fail(404, 'Product not found');
  }

  if (method === 'POST' && path.endsWith('/admin/products')) {
    const payload = body as unknown as ProductWritePayload;
    if (mockStore.products.some(p => p.sku.toLowerCase() === payload.sku.toLowerCase())) {
      return fail(400, 'SKU already exists.', { sku: ['Duplicate SKU'] });
    }
    const relation = validateCategoryRelation(payload.categoryId, payload.subcategoryId ?? null);
    if (relation) return fail(400, relation);
    return ok(mockStore.upsertProduct(payload), 201);
  }

  if (method === 'PUT' && adminProduct) {
    const payload = body as unknown as ProductWritePayload;
    const existing = mockStore.products.find(p => p.id === adminProduct[1]);
    if (!existing) return fail(404, 'Product not found');
    if (mockStore.products.some(p => p.id !== existing.id && p.sku.toLowerCase() === payload.sku.toLowerCase())) {
      return fail(400, 'SKU already exists.', { sku: ['Duplicate SKU'] });
    }
    const relation = validateCategoryRelation(payload.categoryId, payload.subcategoryId ?? null);
    if (relation) return fail(400, relation);
    return ok(mockStore.upsertProduct(payload, existing.id));
  }

  if (method === 'DELETE' && adminProduct) {
    const existing = mockStore.products.find(p => p.id === adminProduct[1]);
    if (!existing) return fail(404, 'Product not found');
    existing.status = 'archived';
    existing.updatedAt = new Date().toISOString();
    return ok({ message: 'Product archived' });
  }

  const statusPath = path.match(/\/admin\/products\/([^/]+)\/status$/);
  if (method === 'PATCH' && statusPath) {
    const existing = mockStore.products.find(p => p.id === statusPath[1]);
    if (!existing) return fail(404, 'Product not found');
    existing.status = (body as { status: ProductStatus }).status;
    existing.updatedAt = new Date().toISOString();
    return ok(existing);
  }

  if (method === 'GET' && path.endsWith('/admin/categories')) {
    return ok(mockStore.categories);
  }

  if (method === 'POST' && path.endsWith('/admin/categories')) {
    const payload = body as { name: string; slug?: string; description: string; imageUrl: string; parentId: string | null; sortOrder: number; active: boolean; megaMenu: boolean };
    if (payload.parentId && !mockStore.categoryById(payload.parentId)) {
      return fail(400, 'Parent category is invalid.');
    }
    const category = {
      id: mockStore.nextId('cat'),
      slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      parentId: payload.parentId,
      sortOrder: payload.sortOrder,
      active: payload.active,
      megaMenu: payload.megaMenu
    };
    mockStore.categories = [...mockStore.categories, category];
    return ok(category, 201);
  }

  const adminCat = path.match(/\/admin\/categories\/([^/]+)$/);
  if (method === 'PUT' && adminCat) {
    const existing = mockStore.categoryById(adminCat[1]);
    if (!existing) return fail(404, 'Category not found');
    Object.assign(existing, body);
    return ok(existing);
  }

  if (method === 'DELETE' && adminCat) {
    const inUse = mockStore.products.some(p => p.categoryId === adminCat[1] || p.subcategoryId === adminCat[1]);
    if (inUse) return fail(400, 'Cannot delete a category that is assigned to products.');
    mockStore.categories = mockStore.categories.filter(c => c.id !== adminCat[1] && c.parentId !== adminCat[1]);
    return ok({ message: 'Category removed' });
  }

  if (method === 'GET' && path.endsWith('/admin/inquiries')) {
    return ok(mockStore.inquiries);
  }

  const inquiryStatus = path.match(/\/admin\/inquiries\/([^/]+)\/status$/);
  if (method === 'PATCH' && inquiryStatus) {
    const existing = mockStore.inquiries.find(i => i.id === inquiryStatus[1]);
    if (!existing) return fail(404, 'Inquiry not found');
    existing.status = (body as { status: 'new' | 'reviewed' | 'closed' }).status;
    return ok(existing);
  }

  if (method === 'GET' && path.endsWith('/admin/designers')) {
    return ok(mockStore.designers);
  }

  if (method === 'POST' && path.endsWith('/admin/designers')) {
    const payload = body as { name: string; slug?: string; description?: string; imageUrl?: string; active?: boolean };
    const designer = {
      id: mockStore.nextId('des'),
      slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      active: payload.active ?? true
    };
    mockStore.designers = [...mockStore.designers, designer];
    return ok(designer, 201);
  }

  const adminDes = path.match(/\/admin\/designers\/([^/]+)$/);
  if (method === 'PUT' && adminDes) {
    const existing = mockStore.designers.find(d => d.id === adminDes[1]);
    if (!existing) return fail(404, 'Designer not found');
    Object.assign(existing, body);
    return ok(existing);
  }

  if (method === 'DELETE' && adminDes) {
    mockStore.designers = mockStore.designers.filter(d => d.id !== adminDes[1]);
    return ok({ message: 'Designer removed' });
  }

  if (method === 'PUT' && path.endsWith('/admin/content/home')) {
    Object.assign(MOCK_HOME, body);
    return ok(MOCK_HOME);
  }

  if (method === 'GET' && path.endsWith('/admin/testimonials')) return ok(MOCK_TESTIMONIALS);
  if (method === 'POST' && path.endsWith('/admin/testimonials')) {
    const row = { id: mockStore.nextId('t'), active: true, sortOrder: 0, ...(body as object) } as (typeof MOCK_TESTIMONIALS)[number];
    MOCK_TESTIMONIALS.push(row);
    return ok(row, 201);
  }
  const adminTestimonial = path.match(/\/admin\/testimonials\/([^/]+)$/);
  if (method === 'PUT' && adminTestimonial) {
    const existing = MOCK_TESTIMONIALS.find(t => t.id === adminTestimonial[1]);
    if (!existing) return fail(404, 'Not found');
    Object.assign(existing, body);
    return ok(existing);
  }
  if (method === 'DELETE' && adminTestimonial) {
    const idx = MOCK_TESTIMONIALS.findIndex(t => t.id === adminTestimonial[1]);
    if (idx < 0) return fail(404, 'Not found');
    MOCK_TESTIMONIALS.splice(idx, 1);
    return ok({ message: 'Removed' });
  }

  if (method === 'GET' && path.endsWith('/admin/services')) return ok(MOCK_SERVICES);
  if (method === 'POST' && path.endsWith('/admin/services')) {
    const payload = body as { title: string; slug?: string };
    const row = { id: mockStore.nextId('s'), slug: payload.slug ? slugify(payload.slug) : slugify(payload.title), active: true, sortOrder: 0, ...(body as object) } as (typeof MOCK_SERVICES)[number];
    MOCK_SERVICES.push(row);
    return ok(row, 201);
  }
  const adminService = path.match(/\/admin\/services\/([^/]+)$/);
  if (method === 'PUT' && adminService) {
    const existing = MOCK_SERVICES.find(s => s.id === adminService[1]);
    if (!existing) return fail(404, 'Not found');
    Object.assign(existing, body);
    return ok(existing);
  }
  if (method === 'DELETE' && adminService) {
    const idx = MOCK_SERVICES.findIndex(s => s.id === adminService[1]);
    if (idx < 0) return fail(404, 'Not found');
    MOCK_SERVICES.splice(idx, 1);
    return ok({ message: 'Removed' });
  }

  if (method === 'GET' && path.endsWith('/admin/instagram')) return ok(MOCK_INSTAGRAM);
  if (method === 'POST' && path.endsWith('/admin/instagram')) {
    const row = { id: mockStore.nextId('ig'), active: true, sortOrder: 0, ...(body as object) } as (typeof MOCK_INSTAGRAM)[number];
    MOCK_INSTAGRAM.push(row);
    return ok(row, 201);
  }
  const adminIg = path.match(/\/admin\/instagram\/([^/]+)$/);
  if (method === 'PUT' && adminIg) {
    const existing = MOCK_INSTAGRAM.find(p => p.id === adminIg[1]);
    if (!existing) return fail(404, 'Not found');
    Object.assign(existing, body);
    return ok(existing);
  }
  if (method === 'DELETE' && adminIg) {
    const idx = MOCK_INSTAGRAM.findIndex(p => p.id === adminIg[1]);
    if (idx < 0) return fail(404, 'Not found');
    MOCK_INSTAGRAM.splice(idx, 1);
    return ok({ message: 'Removed' });
  }

  if (method === 'GET' && path.endsWith('/admin/custom-jewelry')) return ok(customJewelryRecords);
  const customStatus = path.match(/\/admin\/custom-jewelry\/([^/]+)\/status$/);
  if (method === 'PATCH' && customStatus) {
    const existing = customJewelryRecords.find(r => r.id === customStatus[1]);
    if (!existing) return fail(404, 'Not found');
    existing.status = (body as { status: 'new' | 'reviewed' | 'closed' }).status;
    return ok(existing);
  }

  if (method === 'GET' && path.endsWith('/admin/contact')) return ok(contactRecords);
  const contactStatus = path.match(/\/admin\/contact\/([^/]+)\/status$/);
  if (method === 'PATCH' && contactStatus) {
    const existing = contactRecords.find(r => r.id === contactStatus[1]);
    if (!existing) return fail(404, 'Not found');
    existing.status = (body as { status: 'new' | 'reviewed' | 'closed' }).status;
    return ok(existing);
  }

  if (method === 'GET' && path.endsWith('/admin/newsletter')) return ok(newsletterRecords);
  const newsletterId = path.match(/\/admin\/newsletter\/([^/]+)$/);
  if (method === 'PATCH' && newsletterId) {
    const existing = newsletterRecords.find(r => r.id === newsletterId[1]);
    if (!existing) return fail(404, 'Not found');
    const active = (body as { active: boolean }).active;
    existing.active = active;
    existing.unsubscribedAt = active ? undefined : new Date().toISOString();
    return ok(existing);
  }

  if (method === 'POST' && path.endsWith('/admin/import/validate')) {
    const rows = (body as { rows: Record<string, string>[]; mapping?: typeof DEFAULT_IMPORT_MAPPING }).rows ?? [];
    const mapping = (body as { mapping?: typeof DEFAULT_IMPORT_MAPPING }).mapping ?? DEFAULT_IMPORT_MAPPING;
    const preview = validateImport(rows, mapping);
    return ok(preview);
  }

  if (method === 'POST' && path.endsWith('/admin/import/confirm')) {
    const rows = (body as { rows: Record<string, string>[] }).rows ?? [];
    const mapping = DEFAULT_IMPORT_MAPPING;
    const preview = validateImport(rows, mapping);
    const valid = preview.rows.filter(r => r.valid);
    valid.forEach(row => {
      const d = row.data;
      const category = mockStore.categories.find(c => c.name.toLowerCase() === (d['category'] ?? '').toLowerCase() && !c.parentId);
      const subcategoryName = d['subcategory'];
      const subcategory = subcategoryName
        ? mockStore.categories.find(c => c.name.toLowerCase() === subcategoryName.toLowerCase() && c.parentId === category?.id)
        : null;
      const designer = mockStore.designers.find(x => x.name.toLowerCase() === (d['designer'] ?? '').toLowerCase());
      mockStore.upsertProduct({
        sku: d['sku'] ?? '',
        name: d['name'] ?? '',
        description: d['description'] ?? '',
        categoryId: category?.id ?? 'cat-rings',
        subcategoryId: subcategory?.id ?? null,
        designerId: designer?.id ?? null,
        price: d['price'] ? Number(d['price']) : null,
        compareAtPrice: null,
        showPrice: (d['showPrice'] ?? 'true').toLowerCase() !== 'false',
        status: (d['status'] || 'active') as ProductWritePayload['status'],
        availability: 'in_stock',
        specs: buildSpecsFromRow(d),
        tags: [],
        featured: false,
        newArrival: true,
        bestSeller: false,
        images: [],
        videos: []
      });
    });
    return ok({
      imported: valid.length,
      failed: preview.errorCount,
      errors: preview.rows.filter(r => !r.valid).map(r => ({
        rowNumber: r.rowNumber,
        sku: r.data['sku'] ?? undefined,
        message: r.errors.join(' ')
      }))
    });
  }

  if (method === 'POST' && path.endsWith('/admin/media/upload')) {
    return ok({
      id: mockStore.nextId('media'),
      url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=480&q=80',
      alt: 'Uploaded media',
      sortOrder: 0,
      type: (body as { type?: string })?.type === 'video' ? 'video' : 'image',
      isPrimary: false
    });
  }

  return fail(404, `No mock handler for ${method} ${path}`);
}

function buildSpecsFromRow(d: Record<string, string | null>) {
  const pairs: [string, string, string | null, 'metal' | 'diamond' | 'gemstone' | 'dimensions' | 'general'][] = [
    ['metal', 'Metal', d['metal'], 'metal'],
    ['karat', 'Karat', d['karat'], 'metal'],
    ['diamondType', 'Diamond', d['diamondType'], 'diamond'],
    ['shape', 'Shape', d['diamondShape'], 'diamond'],
    ['carat', 'Carat', d['diamondCarat'], 'diamond'],
    ['color', 'Color', d['diamondColor'], 'diamond'],
    ['clarity', 'Clarity', d['diamondClarity'], 'diamond'],
    ['gemstone', 'Gemstone', d['gemstone'], 'gemstone'],
    ['weight', 'Weight', d['weight'], 'dimensions']
  ];
  return pairs.filter((p): p is [string, string, string, 'metal' | 'diamond' | 'gemstone' | 'dimensions' | 'general'] => !!p[2])
    .map(([key, label, value, group]) => ({ key, label, value, group }));
}

function validateImport(rows: Record<string, string>[], mapping: typeof DEFAULT_IMPORT_MAPPING): ImportPreviewResult {
  const seen = new Set(mockStore.products.map(p => p.sku.toLowerCase()));
  const fileSeen = new Set<string>();
  const previewRows = rows.map((raw, index) => {
    const data: Record<string, string> = {};
    mapping.forEach(m => {
      data[m.field] = (raw[m.excelHeader] ?? raw[m.field] ?? '').toString().trim();
    });
    const errors: string[] = [];
    const rowNumber = index + 2;
    if (!data['sku']) errors.push('SKU is required.');
    if (!data['name']) errors.push('Product name is required.');
    if (!data['category']) errors.push('Category is required.');
    const category = mockStore.categories.find(c => c.name.toLowerCase() === (data['category'] ?? '').toLowerCase() && !c.parentId);
    if (data['category'] && !category) errors.push('Unknown category.');
    if (data['subcategory']) {
      const sub = mockStore.categories.find(c => c.name.toLowerCase() === data['subcategory'].toLowerCase());
      if (!sub) errors.push('Unknown subcategory.');
      else if (category && sub.parentId !== category.id) errors.push('Subcategory does not belong to category.');
    }
    if (data['price'] && Number.isNaN(Number(data['price']))) {
      errors.push('Price must be numeric.');
    }
    const skuKey = data['sku'].toLowerCase();
    if (skuKey && (seen.has(skuKey) || fileSeen.has(skuKey))) {
      errors.push('Duplicate SKU.');
    }
    if (skuKey) fileSeen.add(skuKey);
    return { rowNumber, data, valid: errors.length === 0, errors };
  });
  return {
    headers: mapping.map(m => m.excelHeader),
    rows: previewRows,
    validCount: previewRows.filter(r => r.valid).length,
    errorCount: previewRows.filter(r => !r.valid).length,
    mapping
  };
}
