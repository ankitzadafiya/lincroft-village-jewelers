# Backend Change Request — Lincroft Village Jewelers

**From:** Angular frontend (Lincroft repo)  
**To:** Backend (`Lvj.Api`)  
**Date:** 2026-08-15  
**Purpose:** Remaining backend work so the live storefront + admin can ship against the current API. Frontend is now aligned to `API_ENDPOINTS_AND_MODELS.md` plus your `FRONTEND_INTEGRATION_RESPONSE.md`.

Please treat this as the implementation ticket. Do **not** re-open items already decided (listed in §0). For every new or changed endpoint, update `API_ENDPOINTS_AND_MODELS.md` so it stays the contract.

Current tunnel we are calling:

```
https://boss-caravan-unpaved.ngrok-free.dev
```

Frontend `apiUrl` is `{origin}/api` (example: `https://boss-caravan-unpaved.ngrok-free.dev/api`).  
Every request also sends `ngrok-skip-browser-warning: true` (browser header for ngrok’s free-tier interstitial; not an API field).

---

## 0. Already decided — do not change

These were confirmed in `FRONTEND_INTEGRATION_RESPONSE.md`. Frontend has been updated to match. **Do not rename or add these.**

| Topic | Decision |
|---|---|
| `AppConfiguration.whatsApp` | Keep camelCase `whatsApp`. Frontend renamed off `whatsapp`. |
| `ProductListItem.hoverImage` | Keep. Frontend product cards hover-swap `primaryImage` ↔ `hoverImage`. |
| `rotatingImages` on list items | Not wanted. Removed from frontend. |
| Custom jewelry file upload | Not in v1. Frontend now submits `referenceImageUrls: string[]` (public URLs only). |
| Import preview vs confirm errors | Keep as-is: validate `rows[].errors: string[]`; confirm/jobs `errors: ImportRowError[]`. |
| Angular proxy | Not used. Frontend calls the public origin directly. CORS must keep allowing `http://localhost:4200`. |
| Price visibility BR-PRICE-1 | Keep server-side nulling of `price` / `compareAtPrice` on public reads. Frontend treats `null` as “Price upon request”. |
| Category slug optional | Frontend omits empty slug so the server slugifies `name`. |
| Enums | Frontend sends/expects snake_case (`in_stock`, `price_asc`, `new`, …). |

---

## 1. Must-have — blockers

### 1.1 Absolute media / image URLs in every JSON response

**Problem:** The Angular app runs on `http://localhost:4200` and the API on the ngrok host. If any image field is a **relative** path (`/media/abc.webp`, `~/uploads/...`, `images/x.jpg`), the browser requests `http://localhost:4200/media/...` and the image 404s.

**Required:** Every URL the browser will load must be an **absolute `https://...` URL** in JSON, including:

- `ProductMedia.url`, `ProductMedia.thumbnailUrl`
- `ProductListItem.primaryImage` / `hoverImage` URLs
- `Category.imageUrl`, `Designer.imageUrl`
- `HomeContent.heroImage`, `ServiceOffering.imageUrl`, `InstagramPost.imageUrl`, `Testimonial` (if any image)
- Inquiry item `imageUrl`
- Any URL returned by `POST /api/admin/media/upload`

Use the API’s public origin (the ngrok URL in this environment; later the real host), e.g.:

```json
{
  "url": "https://boss-caravan-unpaved.ngrok-free.dev/media/{id}.webp",
  "thumbnailUrl": "https://boss-caravan-unpaved.ngrok-free.dev/media/{id}-thumb.webp"
}
```

Static files must be reachable **without auth** (product photos are shown on the public storefront). If media is on a different host, that host must send CORS/cache headers suitable for `<img>` tags (simple GET; CORS is only required if you ever fetch the bytes from JS).

If you cannot bake the origin into stored rows, rewrite URLs at serialization time from a config `PublicBaseUrl`.

**Please confirm in the API doc** which origin is used and that list/detail/upload all share the same rule.

---

### 1.2 CORS must allow the ngrok skip header (and preflight)

Frontend `HttpClient` from `http://localhost:4200` → `https://boss-caravan-unpaved.ngrok-free.dev` is cross-origin.

You already allow origin `http://localhost:4200`. Please also confirm:

1. `Access-Control-Allow-Origin` is exactly `http://localhost:4200` (or a list that includes it), **not** `*` when `Authorization` is present.
2. `Access-Control-Allow-Credentials` is **not** required (we send Bearer tokens, not cookies). Either credentials-off + explicit origin, or credentials-on + explicit origin — never `*` + credentials.
3. Allowed request headers include at least:
   - `Authorization`
   - `Content-Type`
   - `ngrok-skip-browser-warning`  ← custom header; triggers a preflight `OPTIONS`
4. Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
5. Preflight `OPTIONS` must return **2xx** without JWT.

If CORS is `AllowAnyHeader()` / `AllowAnyMethod()` with an explicit origin list, that already satisfies this. Please confirm that is the case in this environment (ngrok → Kestrel), not only on localhost.

When the frontend later moves off localhost (preview URL, production domain), those origins must be added to the same CORS list.

---

### 1.3 Seeded admin credentials (and a customer test user)

Frontend admin login is `POST /api/auth/login` `{ email, password }`. There is no mock fallback when `ACTIVE_BACKEND = 'ngrok'`.

**Please reply with (or seed and document):**

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | ? | ? | Must have `products.manage` (and whatever you use for categories/import/settings) |
| Staff (optional) | ? | ? | Reduced permissions — frontend hides by `user.permissions` |
| Customer | ? | ? | For favorites + `/api/customer/login` |

Also document lockout rules (failed-attempt count / duration) so we do not trip it while testing.

If the seed currently uses SQL Server LocalDB names but this environment is **PostgreSQL**, confirm the seed still runs and the admin user exists.

---

### 1.4 `PUT /api/admin/config` must not wipe omitted fields

Admin Settings UI only edits a subset (`showPricesGlobally`, `allowProductPriceOverride`, `email`, `phoneDisplay`, `whatsApp`). Frontend **merges** those into the last `GET /api/config` object and PUTs the **full** `AppConfiguration` (including `hours`, address, social URLs).

**Please confirm one of these and document it:**

- **A (preferred):** PUT is a **full replace** of the singleton. Frontend will always send the complete object from GET + edits. Missing `hours` would wipe the week — we are sending `hours` from GET.
- **B:** PUT is a **merge**; omitted properties keep previous values. Safer if a client sends a partial by mistake.

If the C# model uses non-nullable `string` for `email` / `whatsApp` / address fields, sending JSON `null` vs omitting the property vs `""` must be defined. Frontend sends `undefined` (omitted) for empty optional strings, and always includes `showPricesGlobally`, `allowProductPriceOverride`, `storeName`, `hours`.

---

### 1.5 Admin inbox for the other lead types

The storefront posts three lead types besides product inquiries. Admin UI today can only list **inquiries**.

| Public POST (already exists) | Stored table (from overview) | Missing admin API |
|---|---|---|
| `POST /api/inquiries` | `Inquiries` | `GET /api/admin/inquiries` exists; `PATCH .../status` exists — **done** |
| `POST /api/custom-jewelry` | `CustomJewelryRequests` | **No admin list/get/status** |
| `POST /api/contact` | `ContactMessages` | **No admin list/get** |
| `POST /api/newsletter` | `NewsletterSubscribers` | **No admin list / unsubscribe** |

Without these, custom-design requests, contact form messages, and newsletter signups are write-only from the website.

**Please add (AdminOnly, same error envelope):**

#### Custom jewelry

```
GET    /api/admin/custom-jewelry
GET    /api/admin/custom-jewelry/{id}
PATCH  /api/admin/custom-jewelry/{id}/status
```

Suggested response item:

```ts
interface CustomJewelryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  jewelryType: string;
  preferredMetal?: string;
  gemstone?: string;
  budget?: string;
  description?: string;
  referenceImageUrls: string[];      // public or mirrored absolute URLs
  status: 'new' | 'reviewed' | 'closed';  // or your existing status enum if you already have one
  createdAt: string;                 // ISO 8601
}
```

If you already have `DownloadStatus` on reference images, include it:

```ts
interface CustomJewelryReference {
  url: string;                       // absolute
  downloadStatus: 'pending' | 'downloaded' | 'failed';
}
```

`PATCH` body: `{ status: 'new' | 'reviewed' | 'closed' }` → returns the updated record.

#### Contact messages

```
GET    /api/admin/contact
GET    /api/admin/contact/{id}          // optional if list is enough
PATCH  /api/admin/contact/{id}/status   // optional; at minimum list + createdAt
```

```ts
interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status?: 'new' | 'reviewed' | 'closed';
  createdAt: string;
}
```

#### Newsletter

```
GET    /api/admin/newsletter
PATCH  /api/admin/newsletter/{id}       // { active: false } to unsubscribe
```

```ts
interface NewsletterSubscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
  unsubscribedAt?: string;
}
```

Newest-first. No paging required for v1 if counts stay small; if you page, use the existing `PagedResult<T>` (`data`, `total`, `page`, `pageSize`, `totalPages`).

---

## 2. Should-have — session + content CMS

### 2.1 `GET /api/customer/me`

Admin already has `GET /api/auth/me` (AdminOnly). Frontend now calls it on boot to validate a stored admin JWT.

Customers have **no equivalent**. After refresh, we trust `localStorage` until the next 401 on favorites.

**Please add:**

```
GET /api/customer/me     CustomerOnly     → AuthUser     200
```

Same `AuthUser` shape as login (`id`, `email`, `name`, `role: 'customer'`, `permissions`).  
401 + standard `ErrorResponse` if the token is missing, expired, or revoked.

Do **not** accept an admin token on this route (and vice versa for `/api/auth/me`).

---

### 2.2 Admin write APIs for storefront content

Public reads exist and the storefront uses them:

| GET | Used on |
|---|---|
| `/api/content/home` | Home hero / about excerpt (if the home template binds it) |
| `/api/content/testimonials` | Testimonials |
| `/api/content/services` | Services page |
| `/api/content/instagram` | Instagram strip |
| `/api/content/designers` | Public designer list (active only) |

There is **no admin PUT/POST** for home, testimonials, services, or Instagram. Designers already have `/api/admin/designers` (frontend now has CRUD). Config has `PUT /api/admin/config`.

If merchandising is expected to edit hero copy, testimonials, services, or IG tiles without a DB tool, please add AdminOnly endpoints, for example:

```
PUT   /api/admin/content/home            body: HomeContent
GET   /api/admin/testimonials            (include inactive)
POST  /api/admin/testimonials
PUT   /api/admin/testimonials/{id}
DELETE /api/admin/testimonials/{id}

GET/POST/PUT/DELETE /api/admin/services
GET/POST/PUT/DELETE /api/admin/instagram
```

If this is **intentionally seed-only for v1**, say so in the API doc so we do not build admin screens for it.

---

## 3. Confirmations (no code if already true — reply in the doc)

Please answer each with **yes / no + one-line note**. Frontend will code to the answers.

### 3.1 Media attach flow

Frontend does:

1. `POST /api/admin/media/upload` (multipart `file` + `type=image|video`) → `ProductMedia` with `id` + absolute `url`
2. Collect those objects into `ProductWritePayload.images` / `videos` (`id`, `url`, `sortOrder`, `isPrimary`, optional `thumbnailUrl`/`alt`)
3. `POST /api/admin/products` or `PUT /api/admin/products/{id}`

Confirm:

- Upload may happen **before** a product exists (orphans until attach).
- Sending `id` on write **attaches** that media row to the product.
- Replacing the `images` array on PUT **removes** media omitted from the array (or document if we must DELETE separately).
- Exactly one `isPrimary: true` among images; frontend enforces UI-side; DB unique index is the backstop.

### 3.2 `null` vs omitted on optional GUIDs and prices

On product write we send:

```json
{
  "subcategoryId": null,
  "designerId": null,
  "price": null,
  "compareAtPrice": null
}
```

when the admin clears those fields. Confirm JSON `null` clears the column (does not 400). Same for `parentId: null` on a top-level category.

### 3.3 Public product list vs admin list

- `GET /api/products` — only `status=active`; default `pageSize=12`
- `GET /api/admin/products` — all statuses; `status` query honored; default `pageSize=20`
- `{slugOrId}` accepts slug **or** GUID

Confirm `GET /api/products/{slug}` 404s for `inactive` / `archived` (not just empty body).

### 3.4 Favorites

`GET/PUT /api/customer/favorites` body/response `{ productIds: string[] }` (GUIDs).  
Confirm unknown IDs are ignored or 400 — we need to know which. Frontend merges guest local IDs after login.

### 3.5 Logout

`POST /api/auth/logout` and `POST /api/customer/logout` revoke by JWT `jti` even if body is `{}`. Frontend sends Bearer token. Confirm logout is **AllowAnonymous** except for the token in the header (your table marked logout 🔓).

### 3.6 Import confirm row shape

Frontend parse → validate → confirm sends **only valid rows**, keyed by **mapped field name** (`sku`, `name`, `category`, …), not Excel headers:

```json
{ "rows": [ { "sku": "LVJ-1", "name": "...", "category": "Rings" } ] }
```

Confirm that matches `ImportConfirmRequest`. (We still have `POST /api/admin/import/upload` available as a fallback; not the primary UI.)

### 3.7 Rate limits

Auth 5/min and leads 10/min — confirm 429 uses the same `ErrorResponse` `{ message, status }` (your original note mentioned `MessageResponse` for 429; the contract §1.2 says every non-2xx is `ErrorResponse`). Frontend reads `error.error.message`. Please make 429 consistent with §1.2.

### 3.8 Postgres vs SQL Server

Project overview described SQL Server LocalDB + EF migrations under `Lvj.Infrastructure`. This environment was described as **PostgreSQL, seeded**. Confirm:

- The same JSON contract (no Postgres-specific type leaks, e.g. decimal as string).
- GUIDs still serialize as strings.
- `decimal` prices serialize as JSON numbers, not strings.

---

## 4. Nice-to-have (v1.1 — do not block catalog)

1. **Public custom-jewelry photo upload** — rejected for v1; keep as a future ticket if “upload from phone” becomes required.
2. **`rotatingImages` on list items** — rejected; we hover-swap two images only.
3. **Admin import job history UI** — endpoints `GET /api/admin/import/jobs` and `/{id}` already exist; frontend has service methods but no screen yet. No backend change.
4. **`GET /api/admin/dashboard` “inactiveProducts”** — confirm it counts `inactive` only vs `inactive + archived`.
5. **Content-type sniffing on media** — already on backend; frontend still pre-checks jpeg/png/webp and mp4/webm.

---

## 5. Frontend mapping (for your awareness — no action unless something below is wrong)

These HTTP calls are now live in Angular services. Paths are relative to `{apiUrl}` which already includes `/api`.

### Storefront (anonymous)

| Method | Path |
|---|---|
| GET | `/config` |
| GET | `/content/home` |
| GET | `/content/testimonials` |
| GET | `/content/services` |
| GET | `/content/instagram` |
| GET | `/content/designers` |
| GET | `/categories` |
| GET | `/categories/{slug}` |
| GET | `/products/facets` |
| GET | `/products` |
| GET | `/search` |
| GET | `/products/{slugOrId}` |
| GET | `/products/{slugOrId}/related` |
| POST | `/inquiries` |
| POST | `/custom-jewelry` |
| POST | `/contact` |
| POST | `/newsletter` |
| POST | `/customer/login` |
| POST | `/customer/register` |
| POST | `/customer/logout` |
| GET/PUT | `/customer/favorites` |

### Admin (admin/staff JWT)

| Method | Path |
|---|---|
| POST | `/auth/login` |
| GET | `/auth/me` |
| POST | `/auth/logout` |
| GET | `/admin/dashboard` |
| GET/POST | `/admin/products` |
| GET/PUT/DELETE | `/admin/products/{id}` |
| PATCH | `/admin/products/{id}/status` |
| GET/POST | `/admin/categories` |
| PUT/DELETE | `/admin/categories/{id}` |
| GET/POST | `/admin/designers` |
| PUT/DELETE | `/admin/designers/{id}` |
| GET | `/admin/inquiries` |
| PATCH | `/admin/inquiries/{id}/status` |
| PUT | `/admin/config` |
| POST | `/admin/media/upload` |
| POST | `/admin/import/validate` |
| POST | `/admin/import/confirm` |
| POST | `/admin/import/upload` (available, not primary UI) |
| GET | `/admin/import/jobs` and `/admin/import/jobs/{id}` (service ready, no UI yet) |

### Model fixes already applied on frontend

- `whatsApp` (not `whatsapp`)
- `hoverImage` consumed; `rotatingImages` removed
- `CustomJewelryRequest.referenceImageUrls: string[]`
- Import validate errors as `string[]`
- Optional fields match §3 of the API doc
- `ProductWritePayload` media sent as `ProductMediaWrite` (`id`, `url`, `sortOrder`, `isPrimary`, …)
- Category/designer write: empty slug omitted
- Config PUT sends the full merged `AppConfiguration`

---

## 6. What we need back from you

A short reply (or an updated API doc) covering:

1. **§1.1** Absolute URLs — done / in progress / need `PublicBaseUrl` config from us.
2. **§1.2** CORS header list — confirm `ngrok-skip-browser-warning` is allowed.
3. **§1.3** Seed emails + passwords for this Postgres environment.
4. **§1.4** Config PUT replace vs merge.
5. **§1.5** Will you add admin list APIs for custom jewelry, contact, and newsletter? If yes, ship the TypeScript shapes above (or yours) in `API_ENDPOINTS_AND_MODELS.md`.
6. **§2.1** `GET /api/customer/me` — yes/no.
7. **§2.2** Content CMS — yes for v1 / seed-only.
8. **§3** Yes/no on each confirmation.

Until **§1.1, §1.2, and §1.3** are confirmed, frontend can call the API but catalog images, CORS preflight, and admin login may still fail in the browser.

---

## 7. How to verify on your side (before telling us to retest)

```http
GET https://boss-caravan-unpaved.ngrok-free.dev/api/config
ngrok-skip-browser-warning: true
Origin: http://localhost:4200
```

Expect JSON `AppConfiguration` with `whatsApp` (camelCase), not HTML.

```http
GET https://boss-caravan-unpaved.ngrok-free.dev/api/products?page=1&pageSize=2
ngrok-skip-browser-warning: true
Origin: http://localhost:4200
```

Expect `PagedResult<ProductListItem>` where `primaryImage.url` (and `hoverImage.url` if present) is an `https://` URL you can open in a browser with no cookie.

```http
OPTIONS https://boss-caravan-unpaved.ngrok-free.dev/api/config
Origin: http://localhost:4200
Access-Control-Request-Method: GET
Access-Control-Request-Headers: ngrok-skip-browser-warning
```

Expect 204/200 with `Access-Control-Allow-Origin: http://localhost:4200` and `Access-Control-Allow-Headers` containing `ngrok-skip-browser-warning`.
