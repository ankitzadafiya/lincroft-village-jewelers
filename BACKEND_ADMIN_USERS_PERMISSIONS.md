# Backend handoff — Admin users, screen permissions & update API

**Project:** Lincroft Village Jewelers (Angular 19 storefront + admin)  
**Audience:** Backend developer (Claude / API owner)  
**Date:** 2026-08-16  
**API base:** `/api` (e.g. `https://boss-caravan-unpaved.ngrok-free.dev/api`)  
**Related:** `BACKEND_API.md`, `BACKEND_GOOGLE_ADMIN_USERS.md`

This document describes **exactly what the frontend expects** for staff accounts and screen rights. The FE now enforces permissions in the sidebar and route guards. If the API does not return correct `permissions` on login / `auth/me`, or does not persist updates, staff will either see everything or nothing useful.

---

## 1. Problem we are fixing (FE + BE)

| Issue | Frontend behavior now | Backend must do |
|-------|----------------------|-----------------|
| Staff with only Products still saw all admin screens | Sidebar + routes gated by permission keys | Persist permissions; return them on login/JWT/`/auth/me` |
| After create, admin rights could not be changed | `PATCH /api/admin/users/{id}` called from Staff UI | Implement update endpoint |
| Role/permissions out of sync | Admin role = full access; staff = exact keys | Store and validate permissions server-side on every admin API |

**Security note:** Hiding nav is not enough. Every `/api/admin/*` endpoint must also authorize the caller’s role/permissions. FE guards are UX only.

---

## 2. Permission keys (canonical list)

These strings are the contract. Use them **exactly** (case-sensitive).

| Key | Admin screen (route) | What it unlocks |
|-----|----------------------|-----------------|
| *(none / any authenticated staff)* | `/admin/dashboard` | Dashboard overview |
| `products.manage` | `/admin/products` | Product list / create / edit |
| `categories.manage` | `/admin/categories` | Categories CRUD |
| `designers.manage` | `/admin/designers` | Designers CRUD |
| `import` | `/admin/import` | CSV / catalog import |
| `inquiries` | `/admin/inquiries` | Leads / inquiries |
| `content.manage` | `/admin/content` | CMS / content blocks |
| `settings` | `/admin/settings` | Pricing & store settings |
| `users.manage` | `/admin/users` | Create / update / activate staff |

### Role rules

| Role | Permissions behavior |
|------|----------------------|
| `admin` | Treat as **all** keys above. FE does not check individual keys for `role === 'admin'`. BE should still store the full set (or ignore list and treat role as wildcard). |
| `staff` | Only the keys assigned at create/update. Empty array = dashboard only (no catalog/studio screens). |
| `customer` | Never allowed on `/api/auth/login` for atelier (403). Customer door is separate. |

Suggested full admin set (store on create/update when `role: "admin"`):

```json
[
  "products.manage",
  "categories.manage",
  "designers.manage",
  "import",
  "inquiries",
  "content.manage",
  "settings",
  "users.manage"
]
```

---

## 3. Auth session shape (must include permissions)

### `POST /api/auth/login`

**Request**

```json
{
  "email": "staff@example.com",
  "password": "********"
}
```

**Success `200`**

```json
{
  "token": "<jwt>",
  "expiresAt": "2026-08-17T12:00:00.000Z",
  "user": {
    "id": "u-123",
    "email": "staff@example.com",
    "name": "Jordan Lee",
    "role": "staff",
    "permissions": ["products.manage"],
    "phone": "+17325550100",
    "provider": "password",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
}
```

**Rules**

- Only `admin` / `staff` may succeed.
- Customers → `403` with message like `"This account does not have atelier access."`
- Inactive users (`isActive: false`) → `403` / `401`.
- JWT claims **must** include `role` and `permissions` (array). FE stores `user` from this response and uses `permissions` for nav/guards.
- After an admin changes someone’s permissions, that person must get the new list on **next login** (or next `GET /api/auth/me`). Prefer short-lived tokens or refresh `/auth/me` on app load (FE already calls restore).

### `GET /api/auth/me`

Return the same `user` object as above (including up-to-date `permissions`). FE refreshes session user from this.

### `POST /api/auth/login/google`

Same session shape. Only if Google account is already linked to an `admin`/`staff` user.

---

## 4. Staff directory APIs

All require `Authorization: Bearer <token>` and caller with `role === 'admin'` **or** permission `users.manage`.

### 4.1 List — `GET /api/admin/users`

**Response `200`:** array of staff/admin users (never customers, never passwords).

```json
[
  {
    "id": "u-123",
    "email": "staff@example.com",
    "name": "Jordan Lee",
    "phone": "+17325550100",
    "role": "staff",
    "permissions": ["products.manage"],
    "isActive": true,
    "lastLoginAt": "2026-08-15T18:22:00.000Z",
    "createdAt": "2026-08-01T10:00:00.000Z"
  }
]
```

### 4.2 Create — `POST /api/admin/users`

**Request**

```json
{
  "name": "Jordan Lee",
  "email": "staff@example.com",
  "password": "secret123",
  "phone": "+17325550100",
  "role": "staff",
  "permissions": ["products.manage"]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | 2–80 chars |
| `email` | yes | unique, lowercased |
| `password` | yes | min 8 |
| `phone` | no | |
| `role` | yes | `admin` \| `staff` |
| `permissions` | for staff | array of keys; ignore/overwrite for `admin` with full set |

**Response `201`:** same shape as list item.

**Errors `400`:** `{ "message": "...", "errors": { "email": ["Email is already in use"] } }`

### 4.3 Update (NEW — FE already calls this) — `PATCH /api/admin/users/{id}`

Used when admin clicks **Edit** on Staff accounts, changes role/permissions (and optionally password), then **Update account**.

**Request**

```json
{
  "name": "Jordan Lee",
  "phone": "+17325550100",
  "role": "staff",
  "permissions": ["products.manage", "inquiries"],
  "password": "optional-new-password"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | |
| `phone` | no | send `null` or omit to clear |
| `role` | yes | `admin` \| `staff` |
| `permissions` | when role is staff | full replacement list (not a patch merge of one key) |
| `password` | no | **omit** or empty = keep existing password; if present, min 8 |

**Do not accept `email` change** on this endpoint (FE disables email in edit mode).

**Response `200`:** updated `AdminUser` record.

**Errors**

| Status | When |
|--------|------|
| `400` | Validation failed |
| `403` | Caller lacks `users.manage` / admin |
| `404` | User not found or not staff/admin |

**Important:** When `role` is changed to `admin`, set permissions to the full admin set. When changed to `staff`, save the provided `permissions` array (may be empty).

### 4.4 Activate / deactivate — `PATCH /api/admin/users/{id}/status`

```json
{ "isActive": false }
```

- Cannot deactivate yourself.
- Inactive users cannot log in to atelier.

---

## 5. How the frontend enforces screens

### Sidebar

Each link is shown only if:

- `user.role === 'admin'`, **or**
- `user.permissions` includes that screen’s key

Staff link (`/admin/users`) requires `users.manage` (or admin role).

### Route guards

| Path | Required permission |
|------|---------------------|
| `/admin/dashboard` | authenticated only |
| `/admin/products` | `products.manage` |
| `/admin/categories` | `categories.manage` |
| `/admin/designers` | `designers.manage` |
| `/admin/import` | `import` |
| `/admin/inquiries` | `inquiries` |
| `/admin/content` | `content.manage` |
| `/admin/settings` | `settings` |
| `/admin/users` | `users.manage` |

Unauthorized deep links redirect to the user’s first allowed path.

### After login

FE navigates to `firstAllowedPath()` (dashboard if open, else first permitted screen — e.g. products-only staff → `/admin/products`).

---

## 6. Backend authorization matrix (recommended)

On each admin API family, require:

| API area | Permission (staff) | Admin role |
|----------|--------------------|------------|
| Products CRUD | `products.manage` | allow |
| Categories | `categories.manage` | allow |
| Designers | `designers.manage` | allow |
| Import | `import` | allow |
| Inquiries | `inquiries` | allow |
| Content | `content.manage` | allow |
| Settings | `settings` | allow |
| Users | `users.manage` | allow |
| Dashboard stats | any authenticated staff | allow |

Return `403` with a clear message when missing.

---

## 7. Acceptance tests for BE

1. Create staff with `permissions: ["products.manage"]` only.  
2. Login as that staff → `user.permissions` is exactly `["products.manage"]`.  
3. That user can call product admin APIs; category/settings APIs return `403`.  
4. Admin opens Staff → Edit → add `inquiries` → `PATCH /admin/users/{id}` succeeds.  
5. Staff logs out and in again → `permissions` includes `products.manage` and `inquiries`.  
6. Admin changes role to `admin` → full console; permissions full set or role wildcard.  
7. `PATCH` without `password` leaves password unchanged.  
8. Deactivated user cannot login.

---

## 8. CORS / ngrok notes (temporary Netlify)

- Allow origins: `http://localhost:4200`, production/Netlify URL.  
- Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.  
- Headers: `Authorization`, `Content-Type`, `ngrok-skip-browser-warning` (FE may send this for ngrok free tier).  
- Credentials: as needed for your auth design (Bearer is primary).

---

## 9. What FE already ships (no BE change needed for these)

- Category / Designer: Edit scrolls to form; Delete clears form if that row was being edited.  
- Staff UI: Create + **Edit/Update** + activate/deactivate.  
- Mock interceptor implements `PATCH /admin/users/{id}` for local `useMockApi: true`.

---

## 10. Minimal implementation checklist for BE

- [ ] Persist `permissions: string[]` on user records  
- [ ] Login / Google / `auth/me` return current `permissions`  
- [ ] JWT includes `role` + `permissions`  
- [ ] `POST /api/admin/users` saves permissions for staff  
- [ ] **`PATCH /api/admin/users/{id}`** updates name, phone, role, permissions, optional password  
- [ ] `PATCH .../status` activate/deactivate  
- [ ] Enforce permission (or admin role) on each `/api/admin/*` resource group  
- [ ] Reject customer accounts on atelier login  

---

## 11. Example: products-only staff

**Create**

```http
POST /api/admin/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Products Clerk",
  "email": "clerk@lincroftjewelers.com",
  "password": "demo1234",
  "role": "staff",
  "permissions": ["products.manage"]
}
```

**Login response user**

```json
{
  "role": "staff",
  "permissions": ["products.manage"]
}
```

**FE result:** Sidebar shows Dashboard + Products only. Direct visit to `/admin/settings` redirects away. Settings API should `403` if called.

**Later update**

```http
PATCH /api/admin/users/u-xxx
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Products Clerk",
  "phone": null,
  "role": "staff",
  "permissions": ["products.manage", "categories.manage"]
}
```

After re-login, Categories appears.

---

If anything in this contract conflicts with existing Nest/Express models, prefer adapting the API to these field names — the Angular app is already wired to them.
