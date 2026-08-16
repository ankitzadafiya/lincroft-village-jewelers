export type UserRole = 'admin' | 'staff' | 'customer';
export type StaffRole = 'admin' | 'staff';
export type AuthProvider = 'password' | 'google';

export const STAFF_PERMISSION_OPTIONS = [
  { key: 'products.manage', label: 'Products' },
  { key: 'categories.manage', label: 'Categories' },
  { key: 'designers.manage', label: 'Designers' },
  { key: 'import', label: 'Import' },
  { key: 'inquiries', label: 'Leads / inquiries' },
  { key: 'content.manage', label: 'Content' },
  { key: 'settings', label: 'Pricing & Store' },
  { key: 'users.manage', label: 'Staff accounts' }
] as const;

export type StaffPermission = (typeof STAFF_PERMISSION_OPTIONS)[number]['key'];

export const ADMIN_DEFAULT_PERMISSIONS: StaffPermission[] = STAFF_PERMISSION_OPTIONS.map(item => item.key);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  phone?: string;
  provider?: AuthProvider;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/** Google Identity Services ID token. Never send a password with this. */
export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

/** GET /api/admin/users — never includes password. */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: StaffRole;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminUserCreateRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: StaffRole;
  permissions?: string[];
}

/** PATCH /api/admin/users/{id} — password optional (omit to keep existing). */
export interface AdminUserUpdateRequest {
  name: string;
  phone?: string | null;
  role: StaffRole;
  permissions?: string[];
  password?: string;
}

export interface AdminUserStatusUpdate {
  isActive: boolean;
}
