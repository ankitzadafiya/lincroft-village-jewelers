# Lincroft Village Jewelers — Backend API Handoff (.NET)

**Audience:** Backend developer building the ASP.NET Core API  
**Frontend:** Angular 19 SPA (this repo)  
**API base path:** `/api`  
**Current frontend mode:** Mock interceptor when `environment.useMockApi = true`  
**Goal:** Implement a real API that matches these contracts so the Angular app can switch `useMockApi` to `false` with minimal frontend changes.

---

## 1. Project summary

Lincroft Village Jewelers is a **premium local jewelry catalog** (Lincroft, NJ).

| Area | Behavior |
|------|----------|
| Storefront | Browse products, categories, designers, services, custom jewelry, contact |
| Pricing | Inquiry-based catalog — **no checkout / payments** |
| Inquiry bag | Customer collects pieces and submits an inquiry (not a cart checkout) |
| Wishlist / favorites | Guest localStorage + sync to account when signed in |
| Admin | Login, dashboard, products CRUD, categories, Excel import, inquiries, settings |
| Media | Admin uploads images/videos; URLs stored on products |

**Suggested .NET stack (recommendation, not required):**
- ASP.NET Core Web API (.NET 8+)
- EF Core + SQL Server (or PostgreSQL)
- JWT Bearer auth
- Swagger / OpenAPI
- CORS for Angular origin (e.g. `http://localhost:4200`)
- Blob storage (Azure Blob / local `wwwroot/uploads`) for media

---

## 2. Integration rules (must match frontend)

### 2.1 Base URL & JSON

- All routes under **`/api/...`**
- JSON camelCase (ASP.NET default System.Text.Json camelCase is fine)
- Dates as **ISO-8601 strings** (e.g. `2026-08-12T18:00:00.000Z`)
- IDs may be **strings** (GUID strings are fine) — frontend treats them as `string`

### 2.2 Auth header

```http
Authorization: Bearer <token>
```

Frontend token selection:

| Request URL contains | Token used |
|----------------------|------------|
| `/admin` or `/auth/` | Admin token |
| `/customer/` | Customer token |
| Anything else | Admin token if present, else customer token |

### 2.3 Error response shape

Use this body for non-2xx responses:

```json
{
  "message": "Human-readable summary",
  "errors": {
    "sku": ["Duplicate SKU"]
  },
  "status": 400
}
```

- `errors` is optional (field validation)
- Frontend shows `message` in toasts; admin forms may use `errors`

### 2.4 Success message shape

Many POST endpoints return:

```json
{ "message": "..." }
```

### 2.5 Pagination envelope

```json
{
  "data": [],
  "total": 100,
  "page": 1,
  "pageSize": 12,
  "totalPages": 9
}
```

- `page` is **1-based**
- Storefront default `pageSize`: **12**
- Search default `pageSize`: **8**
- Admin products list typically uses **20**

### 2.6 CORS

Allow Angular origin with credentials if needed; at minimum:

- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: `Authorization`, `Content-Type`
- Exposed: none required beyond JSON

### 2.7 Switching the frontend to real API

In `src/environments/environment.ts` (and production):

```ts
apiUrl: 'https://your-api-host/api', // or '/api' with reverse proxy
useMockApi: false
```

---

## 3. Roles & security

| Role | Who | Access |
|------|-----|--------|
| `admin` | Staff | Full admin APIs |
| `staff` | Optional future | Same as admin or subset via `permissions` |
| `customer` | Shopper account | Favorites sync only (today) |
| Anonymous | Public | Storefront read + lead forms |

**Permissions array (admin example):**
`["products.manage", "categories.manage", "import", "settings"]`

**Customer permissions example:**
`["favorites"]`

### Demo accounts (frontend mock — replace in production)

| Type | Email | Password |
|------|-------|----------|
| Admin | `admin@lincroftjewelers.com` | `demo1234` |
| Customer | `guest@example.com` | `welcome123` |

### Admin route protection (frontend)

- `/admin/login` — guest only
- `/admin/*` — requires admin session
- On **401** for admin URLs → frontend clears admin session and redirects to `/admin/login`

Storefront `/account` is **not** route-guarded; customer APIs return 401 if unauthenticated.

---

## 4. Domain model (database sketch)

### 4.1 Core entities

```
Users (admin + customer)
Categories (self-referencing parentId)
Designers
Products
ProductSpecs
ProductMedia (images + videos)
Inquiries + InquiryItems
CustomJewelryRequests
ContactMessages
NewsletterSubscribers
AppConfiguration (singleton / settings row)
Favorites (CustomerId + ProductId)
Services / Testimonials / InstagramPosts / HomeContent (CMS-ish)
ImportJobs (optional audit)
```

### 4.2 Important product rules

- **SKU** unique
- **Slug** unique (URL key); auto-generate from name if omitted
- `categoryId` must be a **top-level** category (`parentId == null`)
- If `subcategoryId` is set, that category’s `parentId` must equal `categoryId`
- Soft-delete / hide via `status = archived` (DELETE endpoint archives; do not hard-delete if referenced)
- Storefront list/detail only returns **`status = active`**
- Admin list returns all statuses (filterable)

### 4.3 Price visibility (business rule)

Computed on **frontend** from config + product:

- If `showPricesGlobally === false` → hide prices unless `allowProductPriceOverride && product.showPrice`
- Backend should still store `price`, `compareAtPrice`, `showPrice` accurately

---

## 5. Enums / allowed values

| Field | Values |
|-------|--------|
| `ProductStatus` | `active`, `inactive`, `archived` |
| `ProductAvailability` | `in_stock`, `made_to_order`, `sold` |
| `SpecGroup` | `metal`, `diamond`, `gemstone`, `watch`, `general`, `dimensions` |
| `MediaType` | `image`, `video` |
| `InquirySource` | `cart`, `product`, `whatsapp`, `email` |
| `InquiryStatus` | `new`, `reviewed`, `closed` |
| `UserRole` | `admin`, `staff`, `customer` |
| Product `sort` | `newest`, `name_asc`, `name_desc`, `price_asc`, `price_desc`, `featured` |

---

## 6. DTO contracts (JSON shapes)

### 6.1 Auth

```json
// LoginRequest
{ "email": "string", "password": "string" }

// RegisterRequest
{ "name": "string", "email": "string", "password": "string", "phone": "string?" }

// AuthUser
{
  "id": "string",
  "email": "string",
  "name": "string",
  "role": "admin|staff|customer",
  "permissions": ["string"]
}

// AuthSession
{
  "token": "string",
  "user": { /* AuthUser */ },
  "expiresAt": "ISO-8601"
}
```

### 6.2 Category / Designer

```json
// Category
{
  "id": "string",
  "slug": "string",
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "parentId": "string|null",
  "sortOrder": 0,
  "active": true,
  "megaMenu": true,
  "productCount": 0
}

// Designer
{
  "id": "string",
  "slug": "string",
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "active": true
}
```

`productCount` on storefront category list = count of **active** products in that category or its children.

### 6.3 Product

```json
// ProductSpec
{ "key": "metal", "label": "Metal", "value": "Yellow Gold", "group": "metal" }

// ProductMedia
{
  "id": "string",
  "url": "string",
  "thumbnailUrl": "string",
  "alt": "string",
  "sortOrder": 0,
  "type": "image|video",
  "isPrimary": true
}

// Product (full)
{
  "id": "string",
  "sku": "string",
  "slug": "string",
  "name": "string",
  "description": "string",
  "categoryId": "string",
  "subcategoryId": "string|null",
  "designerId": "string|null",
  "designerName": "string|null",
  "price": 1299.00,
  "compareAtPrice": null,
  "showPrice": true,
  "status": "active",
  "availability": "in_stock",
  "specs": [],
  "images": [],
  "videos": [],
  "tags": [],
  "featured": false,
  "newArrival": true,
  "bestSeller": false,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}

// ProductListItem (storefront cards)
{
  "id": "string",
  "sku": "string",
  "slug": "string",
  "name": "string",
  "categoryId": "string",
  "categoryName": "string",
  "subcategoryName": "string|null",
  "designerName": "string|null",
  "price": 1299.00,
  "compareAtPrice": null,
  "showPrice": true,
  "availability": "in_stock",
  "primaryImage": { /* ProductMedia|null */ },
  "featured": false,
  "newArrival": true
}

// ProductWritePayload (admin create/update body)
{
  "sku": "string",
  "name": "string",
  "slug": "string?",
  "description": "string",
  "categoryId": "string",
  "subcategoryId": "string|null",
  "designerId": "string|null",
  "price": null,
  "compareAtPrice": null,
  "showPrice": true,
  "status": "active",
  "availability": "in_stock",
  "specs": [],
  "tags": [],
  "featured": false,
  "newArrival": false,
  "bestSeller": false,
  "images": [],
  "videos": []
}
```

### 6.4 Facets

```json
{
  "metals": [{ "value": "Yellow Gold", "label": "Yellow Gold", "count": 12 }],
  "karats": [],
  "gemstones": [],
  "diamondTypes": [],
  "diamondShapes": [],
  "designers": [],
  "availability": [],
  "priceRange": { "min": 0, "max": 25000 }
}
```

Facet sources (from **active** products, optionally scoped by the same `category` / `subcategory` / `designer` / `q` query params as the product list):
- metals / karats / gemstones / diamondTypes → matching `specs[].key`
- diamondShapes → spec key `shape` **or** `diamondShape`
- designers → `value` must be **slug** (or id) so it matches `GET /products?designer=`
- availability → product availability enum
- priceRange → min/max of priced products in that scoped set

### 6.5 Config

```json
{
  "showPricesGlobally": true,
  "allowProductPriceOverride": true,
  "storeName": "Lincroft Village Jewelers",
  "tagline": "string",
  "phone": "17325550142",
  "phoneDisplay": "(732) 555-0142",
  "email": "hello@lincroftjewelers.com",
  "whatsapp": "17325550142",
  "addressLine": "string",
  "city": "Lincroft",
  "region": "NJ",
  "postalCode": "07738",
  "mapsUrl": "https://...",
  "instagramUrl": "https://...",
  "facebookUrl": "https://...",
  "hours": [
    { "day": "Tuesday", "hours": "10:00–6:00", "closed": false }
  ]
}
```

### 6.6 Inquiries & leads

```json
// InquiryRequest
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "message": "string",
  "items": [
    {
      "productId": "string",
      "sku": "string",
      "slug": "string",
      "name": "string",
      "imageUrl": "string|null",
      "quantity": 1
    }
  ],
  "source": "cart"
}

// InquiryRecord (admin list)
{
  /* InquiryRequest fields */
  "id": "string",
  "createdAt": "ISO-8601",
  "status": "new"
}

// CustomJewelryRequest
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "jewelryType": "string",
  "preferredMetal": "string",
  "gemstone": "string",
  "budget": "string",
  "description": "string",
  "referenceImageUrls": ["https://drive.google.com/...", "https://..."]
}

// ContactRequest
{ "name": "string", "email": "string", "phone": "string", "subject": "string", "message": "string" }

// NewsletterRequest
{ "email": "string" }
```

> **v1 default:** Custom jewelry accepts **one or more public/share links** (`referenceImageUrls`). Backend downloads each link (or stores the URL if download fails) and notifies the store by email. Optional multipart file upload can be added later without breaking this field.

### 6.7 Content

```json
// HomeContent
{
  "heroEyebrow": "string",
  "heroTitle": "string",
  "heroSubtitle": "string",
  "heroImage": "string",
  "aboutExcerpt": "string"
}

// Testimonial
{ "id": "string", "name": "string", "location": "string", "quote": "string", "rating": 5 }

// ServiceOffering
{
  "id": "string",
  "slug": "string",
  "title": "string",
  "summary": "string",
  "description": "string",
  "imageUrl": "string",
  "active": true,
  "sortOrder": 1
}

// InstagramPost
{ "id": "string", "imageUrl": "string", "alt": "string", "href": "string" }
```

### 6.8 Dashboard

```json
{
  "totalProducts": 0,
  "activeProducts": 0,
  "inactiveProducts": 0,
  "categories": 0,
  "inquiries": 0,
  "missingImages": 0,
  "missingInformation": 0,
  "recentProducts": [
    { "id": "string", "sku": "string", "name": "string", "updatedAt": "ISO-8601" }
  ]
}
```

Suggested definitions:
- `missingImages` — active products with no images
- `missingInformation` — products missing description / critical specs / price when expected
- `categories` — count of **top-level** categories
- `recentProducts` — last ~6 by `updatedAt` desc

### 6.9 Import

```json
// ImportColumnMapping
{ "excelHeader": "SKU", "field": "sku", "required": true }

// ImportPreviewResult
{
  "headers": ["SKU", "Product Name", "..."],
  "rows": [
    {
      "rowNumber": 2,
      "data": { "sku": "LVJ-001", "name": "..." },
      "valid": true,
      "errors": []
    }
  ],
  "validCount": 10,
  "errorCount": 2,
  "mapping": [ /* ImportColumnMapping[] */ ]
}

// ImportConfirmResult
{
  "imported": 10,
  "failed": 2,
  "errors": [
    { "rowNumber": 5, "sku": "X", "field": "category", "message": "Unknown category" }
  ]
}
```

**Default Excel header → field mapping** (frontend template):

| Excel header | Field | Required |
|--------------|-------|----------|
| SKU | `sku` | yes |
| Product Name | `name` | yes |
| Description | `description` | |
| Category | `category` (match by **name**, top-level) | yes |
| Subcategory | `subcategory` (by name) | |
| Brand/Designer | `designer` (by name) | |
| Metal Type | `metal` | |
| Metal Karat | `karat` | |
| Diamond Type | `diamondType` | |
| Diamond Shape | `diamondShape` | |
| Diamond Carat | `diamondCarat` | |
| Diamond Color | `diamondColor` | |
| Diamond Clarity | `diamondClarity` | |
| Gemstone | `gemstone` | |
| Weight | `weight` | |
| Price | `price` | |
| Show Price | `showPrice` | |
| Status | `status` | |
| Image 1…12 | `image1`…`image12` | |
| Video 1…3 | `video1`…`video3` | |

Excel is **parsed in the browser**; backend receives JSON rows. Row numbers start at **2** (row 1 = headers).

On confirm:
- Upsert by SKU (create or update)
- Map category/subcategory/designer by name
- Build specs from metal/diamond/gemstone fields
- **Image 1–12 / Video 1–3 columns are URLs** (Google Drive share links, Dropbox, direct CDN, etc.)
- Backend must **download each URL → save into media storage → attach as `ProductMedia`**
- If a URL fails, record a row warning/error but still import the product when possible
- Prefer **direct download links**; for Google Drive, convert/share as “Anyone with the link” and use a downloadable URL format (backend should normalize common Drive/Dropbox URL patterns)

### Media URL import helper (recommended)

```
Input:  https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
Output: saved file under /uploads/products/{sku}/img-01.jpg + ProductMedia record
```

---

## 7. Complete API endpoint list

Unless noted, responses are JSON. Auth: **Public** / **Admin** / **Customer**.

### 7.1 Admin auth

| Method | Path | Auth | Request | Success |
|--------|------|------|---------|---------|
| POST | `/api/auth/login` | Public | `LoginRequest` | `200 AuthSession` |
| GET | `/api/auth/me` | Admin | — | `200 AuthUser` (optional; frontend may not call yet) |
| POST | `/api/auth/logout` | Public/Admin | `{}` | `200 { message }` |

Errors: `401` invalid credentials / unauthorized.

Suggested token lifetime: **12 hours** (admin).

### 7.2 Customer auth & favorites

| Method | Path | Auth | Request | Success |
|--------|------|------|---------|---------|
| POST | `/api/customer/login` | Public | `LoginRequest` | `200 AuthSession` |
| POST | `/api/customer/register` | Public | `RegisterRequest` | `201 AuthSession` |
| POST | `/api/customer/logout` | Public/Customer | `{}` | `200 { message }` |
| GET | `/api/customer/favorites` | Customer | — | `200 { "productIds": ["..."] }` |
| PUT | `/api/customer/favorites` | Customer | `{ "productIds": ["..."] }` | `200 { "productIds": ["..."] }` |

Errors:
- Login `401`
- Register `400` missing fields / email exists
- Favorites `401` if not signed in

Suggested token lifetime: **30 days** (customer).

**Favorites sync flow (frontend):**
1. Guest toggles store IDs in `localStorage`
2. On login/register → GET server favorites → **union** with guest IDs → PUT merged list
3. While logged in, every toggle also PUTs full list

### 7.3 Configuration & content (public reads)

| Method | Path | Auth | Success |
|--------|------|------|---------|
| GET | `/api/config` | Public | `AppConfiguration` |
| PUT | `/api/admin/config` | Admin | updated `AppConfiguration` |
| GET | `/api/content/home` | Public | `HomeContent` |
| GET | `/api/content/testimonials` | Public | `Testimonial[]` |
| GET | `/api/content/services` | Public | `ServiceOffering[]` (active only recommended) |
| GET | `/api/content/instagram` | Public | `InstagramPost[]` |
| GET | `/api/content/designers` | Public | active `Designer[]` |

### 7.4 Categories (storefront)

| Method | Path | Auth | Success | Errors |
|--------|------|------|---------|--------|
| GET | `/api/categories` | Public | `Category[]` (+ `productCount`) | — |
| GET | `/api/categories/{slug}` | Public | `Category` | `404` |

### 7.5 Products (storefront)

| Method | Path | Auth | Success | Errors |
|--------|------|------|---------|--------|
| GET | `/api/products/facets` | Public | `ProductFilterFacets` | same category/subcategory/designer/q as list (optional) |
| GET | `/api/products` | Public | `PaginatedResponse<ProductListItem>` | — |
| GET | `/api/products/{slugOrId}` | Public | full `Product` (active) | `404` |
| GET | `/api/products/{slugOrId}/related` | Public | up to **4** `ProductListItem` same category | `404` |
| GET | `/api/search` | Public | same as products list | — |

#### Product list / search query parameters

| Param | Type | Notes |
|-------|------|-------|
| `category` | string | **slug**; top-level includes child products; if subcategory slug, filter that subcategory |
| `subcategory` | string | slug |
| `designer` | string | slug or id |
| `metal`, `karat`, `gemstone`, `diamondType` | string | case-insensitive match on specs |
| `diamondShape` | string | matches spec `shape` or `diamondShape` |
| `availability` | string | enum |
| `status` | string | **admin only**; storefront ignores / forces active |
| `priceMin`, `priceMax` | number | |
| `featured`, `newArrival`, `bestSeller` | bool as `"true"` | |
| `q` | string | search name, sku, description, designerName, spec values |
| `sort` | string | see enums |
| `page` | int | default 1 |
| `pageSize` | int | default 12 (search default 8) |

**Sort behavior:**
- `newest` (default) → `createdAt` desc
- `name_asc` / `name_desc`
- `price_asc` → null prices last
- `price_desc` → null as 0 / last as appropriate
- `featured` → featured first, then newest

### 7.6 Public lead forms

| Method | Path | Auth | Request | Success |
|--------|------|------|---------|---------|
| POST | `/api/inquiries` | Public | `InquiryRequest` | `201 { message }` + persist `InquiryRecord` (`status: new`) |
| POST | `/api/custom-jewelry` | Public | `CustomJewelryRequest` | `201 { message }` |
| POST | `/api/contact` | Public | `ContactRequest` | `201 { message }` |
| POST | `/api/newsletter` | Public | `NewsletterRequest` | `201 { message }` |

Validate email formats; rate-limit recommended.

### 7.7 Admin — dashboard & products

| Method | Path | Auth | Request | Success | Errors |
|--------|------|------|---------|---------|--------|
| GET | `/api/admin/dashboard` | Admin | — | `DashboardStats` | 401 |
| GET | `/api/admin/products` | Admin | ProductListQuery | `PaginatedResponse<Product>` (full) | 401 |
| GET | `/api/admin/products/{id}` | Admin | — | `Product` | 404 |
| POST | `/api/admin/products` | Admin | `ProductWritePayload` | `201 Product` | 400 duplicate SKU / bad category |
| PUT | `/api/admin/products/{id}` | Admin | `ProductWritePayload` | `200 Product` | 404 / 400 |
| DELETE | `/api/admin/products/{id}` | Admin | — | `{ message: "Product archived" }` soft archive | 404 |
| PATCH | `/api/admin/products/{id}/status` | Admin | `{ "status": "active\|inactive\|archived" }` | `Product` | 404 |

Duplicate SKU example:

```json
{ "message": "Validation failed", "errors": { "sku": ["Duplicate SKU"] }, "status": 400 }
```

### 7.8 Admin — categories

| Method | Path | Auth | Request | Success | Errors |
|--------|------|------|---------|---------|--------|
| GET | `/api/admin/categories` | Admin | — | all `Category[]` | |
| POST | `/api/admin/categories` | Admin | category fields (`slug` optional → slugify name) | `201 Category` | 400 invalid parent |
| PUT | `/api/admin/categories/{id}` | Admin | full/partial | `Category` | 404 |
| DELETE | `/api/admin/categories/{id}` | Admin | — | `{ message }` | 400 if products reference it; cascade-delete children if unused |

### 7.9 Admin — inquiries, import, media

| Method | Path | Auth | Request | Success |
|--------|------|------|---------|---------|
| GET | `/api/admin/inquiries` | Admin | — | `InquiryRecord[]` (newest first recommended) |
| POST | `/api/admin/import/validate` | Admin | `{ "rows": [ { "SKU": "...", ... } ], "mapping": [ ... ]? }` | `ImportPreviewResult` |
| POST | `/api/admin/import/confirm` | Admin | `{ "rows": [ { "sku": "...", "name": "...", ... } ] }` | `ImportConfirmResult` |
| POST | `/api/admin/media/upload` | Admin | `multipart/form-data` | `ProductMedia` |

#### Media upload form fields

| Field | Value |
|-------|-------|
| `file` | binary |
| `type` | `image` or `video` |

**Limits (must enforce server-side too):**

| Rule | Value |
|------|-------|
| Max images per product | 12 |
| Max videos per product | 3 |
| Max image size | 8 MB |
| Max video size | 50 MB |
| Image types | `image/jpeg`, `image/png`, `image/webp` |
| Video types | `video/mp4`, `video/webm` |

Return absolute or CDN `url` + `thumbnailUrl` (thumb can equal url initially). Frontend assigns `sortOrder` / `isPrimary` when saving the product.

---

## 8. End-to-end flows

### 8.1 Admin login → manage product

1. `POST /api/auth/login`
2. Store token (frontend `localStorage`)
3. `GET /api/admin/dashboard`
4. `POST /api/admin/media/upload` (optional images)
5. `POST /api/admin/products` with media arrays
6. Storefront `GET /api/products` / `GET /api/products/{slug}` shows piece if `active`

### 8.2 Customer wishlist sync

1. Guest adds favorites locally
2. `POST /api/customer/login` or `register`
3. `GET /api/customer/favorites`
4. Merge with guest → `PUT /api/customer/favorites`
5. Further toggles → PUT full list

### 8.3 Inquiry bag submit

1. Frontend keeps bag in `localStorage` (`lvj_inquiry_cart`)
2. User submits form on `/inquiry`
3. `POST /api/inquiries` with `items[]` and `source: "cart"`
4. Admin sees via `GET /api/admin/inquiries`
5. (Recommended) Email notification to store inbox

### 8.4 Excel import

1. Admin downloads template (generated client-side)
2. Uploads file → browser parses to row objects
3. `POST /api/admin/import/validate`
4. Admin reviews preview
5. `POST /api/admin/import/confirm` with valid mapped rows
6. Products upserted by SKU

### 8.5 Custom jewelry / contact / newsletter

Public POSTs → persist + email notification (recommended). No auth.

---

## 9. Suggested seed data

Match mock storefront so QA is easy:

**Top-level categories (examples):**
`jewelry`, `engagement-rings`, `wedding-bands`, `earrings`, `necklaces`, `bracelets`, `watches`

**Admin user** with password hash for `demo1234` (dev only)  
**Customer** `guest@example.com` / `welcome123` (dev only)

**Config** singleton with Lincroft address, phone, WhatsApp, hours, price flags.

---

## 10. Non-functional requirements

| Topic | Recommendation |
|-------|----------------|
| HTTPS | Required in production |
| Passwords | ASP.NET Identity / BCrypt / PBKDF2 — never store plain text |
| JWT | Separate admin vs customer claims (`role`, `permissions`) |
| Validation | DataAnnotations / FluentValidation; return `errors` map |
| Logging | Serilog; log import failures and lead submissions |
| Email | Inquiry / contact / custom jewelry / newsletter notifications |
| Files | Virus scan optional; unique blob names; public read URLs |
| Rate limit | Public POST endpoints |
| Soft delete | Products archived; categories blocked if in use |
| Idempotency | Import confirm should be safe to retry by SKU upsert |
| OpenAPI | Publish Swagger for frontend/QA |

---

## 11. Implementation checklist for .NET

- [ ] Solution + Web API project + EF Core DbContext
- [ ] Entities + migrations matching DTOs above
- [ ] JWT auth (admin + customer)
- [ ] All public storefront GETs
- [ ] Lead POSTs (inquiry, custom, contact, newsletter)
- [ ] Customer favorites GET/PUT
- [ ] Admin CRUD products/categories/config
- [ ] Admin dashboard stats
- [ ] Media upload to blob/disk
- [ ] Excel import validate + confirm
- [ ] CORS + reverse proxy notes for Angular
- [ ] Seed data + Swagger
- [ ] Hand off `apiUrl` to frontend team

---

## 12. Frontend source of truth (in this repo)

| Area | Path |
|------|------|
| Mock handlers (behavior) | `src/app/core/mock/mock-api.handlers.ts` |
| Mock store / rules | `src/app/core/mock/mock-store.ts` |
| Seed / import mapping | `src/app/core/mock/mock-data.ts` |
| Models | `src/app/core/models/*.ts` |
| HTTP services | `src/app/core/services/*.ts` |
| Environments | `src/environments/environment*.ts` |

If a contract conflict appears, **prefer the Angular models + service call sites** as the live contract, and update this document.

---

## 13. v1 defaults (provisional — can change later)

These are the **easiest / free / normal-website** defaults. Change anytime; frontend will adapt.

### 13.1 Media storage — **local disk on the API server** (easiest)

**Decision:** Store all photos & videos on the **.NET server filesystem** and serve them as static files.

| Item | Default |
|------|---------|
| Root folder | `wwwroot/uploads/` |
| Product media | `wwwroot/uploads/products/{productId-or-sku}/` |
| Custom jewelry refs | `wwwroot/uploads/custom-jewelry/{requestId}/` |
| Public URL | `https://{api-host}/uploads/...` |
| Multiple images/videos | Unlimited folders; enforce per-product caps (12 images / 3 videos) |
| Why this | Zero cloud setup, free, simple for a local jewelry shop, works like classic websites |

**Later upgrade path (when needed):** Azure Blob Storage or Cloudflare R2 — keep the same `url` / `thumbnailUrl` fields so DB schema does not change.

**Also support:**
1. Admin multipart upload → `POST /api/admin/media/upload`
2. **Import-from-URL** — Excel / custom jewelry links (Drive, Dropbox, direct) → backend downloads → same local folder

### 13.2 Email — **Gmail SMTP (free)** for inquiries & leads

**Decision:** Use a Gmail (or Google Workspace) account with an **App Password** via SMTP.

| Item | Default |
|------|---------|
| Provider | Gmail SMTP (`smtp.gmail.com:587`) |
| Cost | Free |
| Sends | Inquiry submitted, contact form, custom jewelry request, optional newsletter confirm |
| To | Store inbox from `AppConfiguration.email` |
| Reply-To | Customer email from the form |

**Setup notes for backend:**
- Enable 2FA on Gmail → create App Password
- Store SMTP user/password in `appsettings` / user-secrets / env vars (never commit)
- Daily Gmail limits are enough for a small shop; if volume grows later → SendGrid free tier

**Alternative free option later:** SendGrid free tier (~100 emails/day).

### 13.3 Custom jewelry — **reference image/video links**

**Decision:** Customer (or staff) pastes **Drive / Dropbox / direct links**. Backend downloads into local storage and emails the store.

```json
"referenceImageUrls": ["https://...", "https://..."]
```

Keep form fields as already defined (name, email, metal, budget, description, etc.).

### 13.4 Excel import — **URL columns for media**

**Decision:** Image 1–12 and Video 1–3 cells contain **links**, not binary files.

Flow:
1. Validate rows (SKU, name, category, etc.)
2. On confirm, for each media URL → download → save under `uploads/products/{sku}/` → attach to product
3. Failed downloads → error row entry; product can still be created

Staff should share Drive files as **“Anyone with the link”** (or provide direct file URLs).

### 13.5 Everything else — normal website defaults

| Topic | v1 default |
|-------|------------|
| Payments / checkout | **Out of scope** (inquiry-only catalog) |
| Inquiry admin | List + **PATCH status** `new` → `reviewed` → `closed` (normal CRM-lite) |
| Designers | Seed + public read; admin CRUD optional later |
| Home / testimonials / services / Instagram | Seed in DB; simple admin edit later if needed |
| Auth | JWT admin + JWT customer (standard) |
| Passwords | Hashed (ASP.NET Identity / BCrypt) |
| CORS | Allow Angular localhost + production domain |
| HTTPS | Required in production |
| Newsletter | Store email in DB + optional thank-you mail |
| Rate limiting | On public POST forms |
| Soft delete | Products → `archived` |

Optional admin endpoint to add when convenient:

```
PATCH /api/admin/inquiries/{id}/status
Body: { "status": "new|reviewed|closed" }
```

---

## 14. Quick reference — all routes

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

POST   /api/customer/login
POST   /api/customer/register
POST   /api/customer/logout
GET    /api/customer/favorites
PUT    /api/customer/favorites

GET    /api/config
PUT    /api/admin/config

GET    /api/content/home
GET    /api/content/testimonials
GET    /api/content/services
GET    /api/content/instagram
GET    /api/content/designers

GET    /api/categories
GET    /api/categories/{slug}

GET    /api/products/facets
GET    /api/products
GET    /api/products/{slugOrId}
GET    /api/products/{slugOrId}/related
GET    /api/search

POST   /api/inquiries
POST   /api/custom-jewelry
POST   /api/contact
POST   /api/newsletter

GET    /api/admin/dashboard
GET    /api/admin/products
GET    /api/admin/products/{id}
POST   /api/admin/products
PUT    /api/admin/products/{id}
DELETE /api/admin/products/{id}
PATCH  /api/admin/products/{id}/status

GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/{id}
DELETE /api/admin/categories/{id}

GET    /api/admin/inquiries
PATCH  /api/admin/inquiries/{id}/status
POST   /api/admin/import/validate
POST   /api/admin/import/confirm
POST   /api/admin/media/upload
```

---

**Document version:** 1.1  
**App:** Lincroft Village Jewelers  
**Frontend stack:** Angular 19 + TypeScript + SCSS + PrimeNG (admin)  
**Backend target:** ASP.NET Core Web API  
**v1 defaults:** Local disk media · Gmail SMTP · URL-based media import (Drive/links)
