# Backend change request — Google sign-in & admin user rights

**Frontend repo:** Lincroft Village Jewelers (Angular 19)  
**Date:** 2026-08-16  
**API base:** `/api`  
**Related docs:** `BACKEND_API.md`

This file is the contract for two new capabilities already wired in the Angular app:

1. **Google (Gmail) sign-in** for shoppers, and for staff who already have atelier access  
2. **Admin user directory** so a signed-in admin can grant **admin / staff / customer** rights to any account

Until these endpoints exist, Google buttons and **Users & access** will fail against the live API. The mock interceptor implements the same shapes for local UI work.

---

## 1. What the frontend now does

| UI | Behavior |
|----|----------|
| `/account` | Email login/register **or** Google. Payload is `{ email, password }` or `{ idToken }` only — never `confirmPassword`. |
| `/admin/login` | Staff door. Successful login **always navigates to `/admin/dashboard`**. Google is allowed only if that Google user already has `admin` or `staff` role. |
| `/admin/users` | Admin-only. Search accounts and patch role. |

Staff credentials must **not** be printed on the page. Seeded mock accounts (replace in production):

| Door | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | `admin@lincroftjewelers.com` | *(your secret)* | `/admin/dashboard` |
| Customer | `guest@example.com` | *(your secret)* | storefront profile / favorites |

Do **not** return passwords in JSON, logs, or error messages.

---

## 2. AuthUser (extended)

Keep existing fields. Add the optional ones so the profile and users table can render sign-in method.

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "admin | staff | customer",
  "permissions": ["string"],
  "phone": "string?",
  "provider": "password | google",
  "createdAt": "ISO-8601?"
}
```

`AuthSession` is unchanged: `{ token, user, expiresAt }`.

Suggested permissions:

| Role | `permissions` |
|------|----------------|
| `admin` | `products.manage`, `categories.manage`, `import`, `settings`, `content.manage`, `users.manage` |
| `staff` | `products.manage`, `categories.manage`, `import` |
| `customer` | `favorites` |

**Rules**

- `POST /api/auth/login` succeeds only when `role` is `admin` or `staff`. Customers get `403` with `"This account does not have atelier access."`
- `POST /api/customer/login` may succeed for any role (admins can also shop).
- JWT must include `role` and `permissions`.
- Admin APIs require `role` in `{ admin, staff }` except **role changes**, which require `admin` (or `users.manage`).

---

## 3. Google sign-in

### 3.1 Google Cloud setup (backend + frontend)

1. Create an OAuth 2.0 **Web application** client in Google Cloud.  
2. Authorized JavaScript origins: Angular origins (`http://localhost:4200`, production site).  
3. Authorized redirect URIs: not required for GIS ID-token flow.  
4. Give the **Client ID** to frontend (`environment.googleClientId`) **and** keep the same ID (or the token audience) on the API for verification.  
5. Enable Google Identity Services. Scopes needed: `openid email profile`.

Frontend sends the GIS **ID token** (JWT) as `idToken`. It does **not** send a Google access token or a password.

### 3.2 Verify the ID token (required)

On the API, verify with Google’s libraries (e.g. `Google.Apis.Auth`):

- Signature valid  
- `aud` = your Google Client ID  
- `iss` is `accounts.google.com` or `https://accounts.google.com`  
- `exp` not expired  
- `email` present; prefer `email_verified == true`

Then upsert the user by Google `sub` (stable) or verified email.

Never trust `email` / `name` from a request field other than the verified token.

### 3.3 Endpoints

| Method | Path | Auth | Body | Success |
|--------|------|------|------|---------|
| POST | `/api/customer/login/google` | Public | `{ "idToken": "string" }` | `200 AuthSession` (create customer if new) |
| POST | `/api/auth/login/google` | Public | `{ "idToken": "string" }` | `200 AuthSession` only if user is `admin` or `staff` |

**Customer Google**

- If no user: create `role: customer`, `provider: google`, no password.  
- If user exists with same email (password account): **link** Google `sub` to that row and sign them in. Do not create a duplicate.  
- Return the same `AuthSession` shape as email login.

**Admin Google**

- If the Google account is `customer` (or unknown): `403` `{ "message": "This Google account does not have atelier access." }`  
- After an admin grants them `admin`/`staff` on `/admin/users`, this endpoint succeeds and the SPA opens the dashboard.

**Errors**

| Status | When |
|--------|------|
| 400 | Missing/invalid `idToken`, failed Google verification |
| 403 | Admin Google used by a non-staff user |
| 401 | Not used for “wrong password”; Google has no password |

Suggested token lifetimes unchanged: admin ~12h, customer ~30d.

---

## 4. Admin users & granting rights

### 4.1 List

```
GET /api/admin/users?q=&role=&page=1&pageSize=20
```

Auth: **Admin or staff** (read). Query:

| Param | Notes |
|-------|--------|
| `q` | Optional. Match name or email (contains, case-insensitive) |
| `role` | Optional. `admin` \| `staff` \| `customer` |
| `page` | 1-based |
| `pageSize` | Default 20 |

Response: standard pagination envelope.

```json
{
  "data": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "admin",
      "permissions": ["users.manage"],
      "phone": "string | null",
      "provider": "google",
      "createdAt": "2026-03-02T14:00:00.000Z",
      "lastLoginAt": "2026-08-16T12:00:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

Never include `password` or Google tokens.

### 4.2 Change role (grant / revoke admin)

```
PATCH /api/admin/users/{id}/role
```

Auth: **`admin` only** (or permission `users.manage`).

```json
{ "role": "admin" }
```

`role` must be one of `admin`, `staff`, `customer`.

On success return the updated `AdminUserRecord` (`200`).

**Side effects**

- Recalculate `permissions` for the new role.  
- Staff can sign in at `POST /api/auth/login` (email) or `POST /api/auth/login/google`.  
- Demoting to `customer` immediately rejects further admin API calls for that user’s **new** tokens; existing admin JWTs should be short-lived or revoked.

**Guardrails (must implement)**

1. Cannot demote the **last remaining admin**.  
2. An admin cannot remove **their own** admin role (`400`).  
3. Unknown id → `404`.  
4. Invalid role → `400`.  
5. Staff calling this endpoint → `403`.

---

## 5. Email + password login (unchanged except role gate)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/login` | `{ email, password }` only. `403` if customer. Then frontend routes to dashboard. |
| POST | `/api/customer/login` | `{ email, password }` only. |
| POST | `/api/customer/register` | `{ name, email, password, phone? }` — never `confirmPassword`. |
| GET | `/api/auth/me` | Current staff user from admin JWT. |
| GET | `/api/customer/me` | Current shopper from customer JWT. Return the **logged-in** user, not a hardcoded demo row. |

Hash passwords with bcrypt/argon2. Google users may have `PasswordHash = null`.

---

## 6. Suggested ASP.NET sketch

```text
Users
  Id, Email (unique), Name, Phone, Role, Permissions (json/csv),
  PasswordHash (nullable), GoogleSubject (nullable, unique),
  Provider, CreatedAt, LastLoginAt, Lockout fields

POST /api/customer/login/google
  -> GoogleJsonWebSignature.ValidateAsync(idToken)
  -> find by GoogleSubject or Email, else insert Role=Customer
  -> issue customer JWT

POST /api/auth/login/google
  -> same validate
  -> if Role not Admin/Staff -> 403
  -> issue admin JWT

PATCH /api/admin/users/{id}/role
  -> [Authorize(Roles = "admin")] or permission policy
  -> transaction: last-admin check, update Role + Permissions
```

CORS: already allow `Authorization` and `Content-Type`. Google GIS runs in the browser; the API only receives `idToken` over HTTPS.

---

## 7. Frontend switch after you ship

1. Deploy the endpoints above.  
2. Put the Google Web Client ID in Angular `environment.googleClientId` (dev + production).  
3. Keep `POST` bodies camelCase.  
4. Confirm: staff email login → `200` → browser is on `/admin/dashboard`.  
5. Confirm: promote a Google customer to `admin` → they can use **Continue with Google** on `/admin/login`.

No other product/catalog contract changes are required for this request.
