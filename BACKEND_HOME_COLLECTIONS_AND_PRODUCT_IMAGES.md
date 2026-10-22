# Backend Requirements — Home Collections (Best sellers / New arrivals) & Two-Photo Product Cards

**Project:** Lincroft Village Jewelers (Angular storefront + admin)
**Audience:** Backend / API developer (and whoever builds the admin screens)
**Date:** 2026-10-23
**Checked against the live API:** `GET /api/products`, `GET /api/products/{slug}`, `GET /api/products/facets`

---

## 0. Summary

| # | Topic | What the backend needs to do | Priority |
|---|-------|------------------------------|----------|
| 1 | Home **Best sellers** (4 products) | Keep `bestSeller=true` filter; add an **admin-controlled order** and a `sort=curated` option | **P1** |
| 2 | Home **New arrivals** (4 products) | Same as above for `newArrival=true` | **P1** |
| 3 | **View all** pages `/best-sellers`, `/new-arrivals` | Flags must combine with every existing filter + pagination; **facets must respect the flags** | **P1** |
| 4 | **Admin "Homepage" screen** | Two small endpoints to read / save the ordered list per collection | P2 |
| 5 | **Two-photo product cards** | `hoverImage` must be a **real second photo**, not a zoomed crop of the first | **P1** |
| 6 | Admin media: label photo 1 / photo 2 | Persist order; import Image 1 / Image 2 correctly | P1 |
| 7 | Account / login page redesign | **No backend change** | — |

What the frontend already does (live now):

- Home calls `GET /api/products?bestSeller=true&pageSize=4&sort=featured` and `GET /api/products?newArrival=true&pageSize=4&sort=newest`.
- New routes `/best-sellers` and `/new-arrivals` call the same list endpoint with the flag, plus the user's filters, sort and page.
- Product cards show `primaryImage` and reveal `hoverImage` with a wipe effect on hover. The card no longer zooms.

---

## 1. Current state (verified 2026-10-23)

| Check | Result |
|-------|--------|
| `GET /api/products?bestSeller=true` | ✅ filter works, 5 products |
| `GET /api/products?newArrival=true` | ✅ filter works, 6 products |
| `GET /api/products?featured=true` | ✅ 7 products |
| `primaryImage` / `hoverImage` present on list items | ✅ 25 / 25 |
| `hoverImage` is a **different photo** | ❌ **25 / 25 are the same photo as `primaryImage`, zoomed in by the URL** (`…&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=2`) |
| `thumbnailUrl` on primary + hover | ✅ present |
| `GET /api/products/facets?bestSeller=true` scoped to the flag | ❌ ignored — returns counts for all 25 products |
| `sort=curated` | ⚠️ accepted (200) but has no defined meaning yet |

The zoomed hover image is why the client saw a zoom effect instead of a second photo.

---

## 2. Home collections — data contract

### 2.1 What the home page shows

```
[ Best sellers ]  heading + subtitle
┌──────────────── navy panel ────────────────┬───┐
│  card 1   card 2   card 3   card 4          │ V │ ← "View all" → /best-sellers
└─────────────────────────────────────────────┴───┘
[ New arrivals ]  heading + subtitle
┌──────────────── navy panel ────────────────┬───┐
│  card 1   card 2   card 3   card 4          │ V │ ← "View all" → /new-arrivals
└─────────────────────────────────────────────┴───┘
```

- Exactly **4** products per collection on the home page (fewer is allowed; the section hides if there are 0).
- **View all** opens a full catalog page with filters, sort and pagination, limited to that collection.

### 2.2 Source of truth

Use the **existing product flags** (already in the admin product form and in `ProductWritePayload`):

| Collection | Flag |
|------------|------|
| Best sellers | `bestSeller: boolean` |
| New arrivals | `newArrival: boolean` |

(`featured` stays as it is; the home page no longer uses it for Best sellers.)

### 2.3 NEW — admin-controlled order (which 4 appear, in what order)

Today, "which 4" depends on `sort=featured` / `sort=newest`, so the store can't choose the order.

**Add two nullable integer fields on Product:**

```text
bestSellerOrder  int | null   // position in Best sellers (1 = first)
newArrivalOrder  int | null   // position in New arrivals (1 = first)
```

**Add a sort value `curated`** to `GET /api/products`:

| Request | Ordering |
|---------|----------|
| `bestSeller=true&sort=curated` | `bestSellerOrder ASC NULLS LAST`, then `updatedAt DESC` |
| `newArrival=true&sort=curated` | `newArrivalOrder ASC NULLS LAST`, then `createdAt DESC` |
| `sort=curated` without a flag | treat as `featured` (current behaviour) |

Once `curated` works, the frontend switches the two home calls to `sort=curated`. That is a one-line change on our side; tell us when it's deployed.

**Rules**

- When a flag is turned **off**, clear its order field (`bestSeller=false` sets `bestSellerOrder` to null).
- Orders do not need to be unique in the DB, but the admin endpoint in §4 always saves a clean 1…n sequence.
- Expose both fields on the admin product DTO (read and write). They are optional on the public `ProductListItem`; the frontend doesn't need them.

### 2.4 Visibility rules for the home calls

Apply on every public product list call (most are probably already in place):

- Only `status = active`.
- Respect price visibility (BR-PRICE-1): `price` / `compareAtPrice` are nulled when hidden.
- **Recommended:** exclude `availability = sold` from the two home collections. Either:
  - support `availability=in_stock,made_to_order` (comma list) and we pass it; **or**
  - add `excludeSold=true`.

  Tell us which one you implement.

### 2.5 Example responses

```http
GET /api/products?bestSeller=true&pageSize=4&sort=curated
```

```json
{
  "data": [
    {
      "id": "…",
      "slug": "aurelia-solitaire-engagement-ring",
      "name": "Aurelia Solitaire Engagement Ring",
      "categoryName": "Ring",
      "brandName": "Lincroft Signature",
      "price": 3450,
      "compareAtPrice": 3990,
      "showPrice": true,
      "availability": "in_stock",
      "primaryImage": { "url": "https://…/1.jpg", "thumbnailUrl": "https://…/1_800.webp", "alt": "…", "sortOrder": 0, "isPrimary": true, "type": "image", "id": "…" },
      "hoverImage":   { "url": "https://…/2.jpg", "thumbnailUrl": "https://…/2_800.webp", "alt": "…", "sortOrder": 1, "isPrimary": false, "type": "image", "id": "…" },
      "featured": true,
      "newArrival": false
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 4,
  "totalPages": 2
}
```

---

## 3. View all pages — `/best-sellers` and `/new-arrivals`

The frontend calls the normal list endpoint with the flag **plus** whatever the shopper picks:

```http
GET /api/products?bestSeller=true&metal=yellow-gold&priceMin=500&sort=price_asc&page=2&pageSize=12
GET /api/products?newArrival=true&gemstone=diamond&sort=newest&page=1&pageSize=12
```

**Requirements**

1. `bestSeller` / `newArrival` combine (AND) with **every** existing filter: `category`, `subcategory`, `designer`, `metal`, `karat`, `gemstone`, `diamondType`, `diamondShape`, `priceMin`, `priceMax`, `availability`, `q`.
2. All sort values work with the flags (`newest`, `name_asc`, `name_desc`, `price_asc`, `price_desc`, `featured`, and the new `curated`).
3. `total` / `totalPages` reflect the filtered collection.
4. **Facets must respect the flags.** `GET /api/products/facets` must accept `bestSeller` and `newArrival` (same as `category` / `subcategory` / `q`) and only count products in that collection. Today the flag is ignored and the filter dropdowns show counts for the whole catalog.

   ```http
   GET /api/products/facets?bestSeller=true
   GET /api/products/facets?newArrival=true&category=ring
   ```

   Once this is live, the frontend will pass the flag to the facets call; tell us when.

---

## 4. Admin panel — choosing the 4 home products

### 4.1 Already available (no change)

Admin → Products → product form already has the checkboxes **Featured**, **New arrival** and **Best seller**. Ticking them adds a product to the collection today.

### 4.2 NEW — "Homepage" admin screen (frontend will build it)

One screen with two lists (Best sellers / New arrivals):

- Shows the flagged products with photo, name, SKU and status.
- Drag to reorder. The **first 4** are marked "Shown on home page".
- Search box to add a product (sets the flag) and a remove button (clears the flag).
- Warning when fewer than 4 active products are in a list.

**Endpoints needed** (admin auth, same rules as other `/api/admin/*` routes):

```http
GET /api/admin/home-collections/{key}
```

`key` = `best-sellers` | `new-arrivals`. Returns the ordered list:

```json
{
  "key": "best-sellers",
  "items": [
    { "productId": "…", "order": 1, "slug": "…", "name": "…", "sku": "…", "status": "active", "availability": "in_stock", "primaryImage": { "url": "…", "thumbnailUrl": "…" } }
  ]
}
```

```http
PUT /api/admin/home-collections/{key}
Content-Type: application/json

{ "productIds": ["id-1", "id-2", "id-3", "id-4", "id-5"] }
```

**Server behaviour for the PUT (one transaction):**

1. Sets the collection flag on every listed product and writes the order 1…n in array order.
2. Clears the flag **and** the order on products in that collection that are **not** in the list.
3. Rejects unknown or archived product ids (`400` with the bad ids).
4. Returns the same shape as the GET.
5. Busts any cache for public product lists.

If you'd rather not add new routes, PATCHing `bestSeller` / `bestSellerOrder` (and the new-arrival pair) through the existing product update also works. Tell us which approach you choose.

### 4.3 Product form additions

Show the order fields next to the checkboxes, e.g. *Best seller ☑, position [ 2 ]*. They are optional; the Homepage screen is the main way to set them.

---

## 5. Two-photo product cards (hover)

### 5.1 Frontend behaviour (live)

- The card shows **photo 1** (`primaryImage`).
- On hover (desktop), **photo 2** (`hoverImage`) is revealed with a soft upward wipe. There is **no zoom**.
- If `hoverImage` is `null`, or is the same URL as photo 1, the card stays on photo 1 with no effect.
- Phones (no hover) show photo 1 only.

### 5.2 Required rule — every list endpoint returning `ProductListItem`

| Field | Rule |
|-------|------|
| `primaryImage` | Image with `isPrimary = true`; otherwise the lowest `sortOrder`. `null` only when the product has no images. |
| `hoverImage` | The **next** image by `sortOrder` that is not the primary. `null` when the product has only one image. |
| Both | Must be **real uploaded photos**. Never generate the hover image by re-cropping or zooming the primary URL (e.g. `fp-z=`, `crop=focalpoint`). |
| Both | Absolute `https://` URLs, publicly readable; `thumbnailUrl` ≈ 800 px WebP. |

**Action now:** replace the seeded hover images on all 25 products with a genuinely different second photo, or set them to `null`. A zoomed copy of the main photo looks like a broken zoom effect to shoppers.

### 5.3 Product detail

`GET /api/products/{slug}` → `images[]` sorted by `sortOrder` (primary first). It must not include the synthetic zoomed duplicates either.

### 5.4 Admin media manager + Excel import

- Admin product form: label the first two images **"Main photo"** and **"Hover photo"**. Reordering (drag) changes which is which. Persist `sortOrder` / `isPrimary` exactly as shown.
- Show a soft warning when a product has only one image ("Add a second photo for the hover effect").
- Excel import: **Image 1** → primary (`sortOrder 0`), **Image 2** → hover (`sortOrder 1`), Image 3–12 → gallery.
- Generate `thumbnailUrl` (≈800 px WebP) for every image on upload and on import.

### 5.5 Photo guidance (for the content team)

- Same framing and background for photo 1 and photo 2, so the swap feels seamless.
- Photo 1: clean front/hero shot on a white or very light background.
- Photo 2: a different angle, an on-hand / on-model shot, or a detail close-up (a real photo).
- Square 1:1 or 4:5 portrait, at least 1600 px on the long edge.

---

## 6. Login / account page redesign — no backend change

The storefront `/account` page was redesigned visually only. It still uses the existing endpoints, unchanged:

```http
POST /api/customer/login
POST /api/customer/register
POST /api/customer/login/google
```

---

## 7. Frontend changes already made (for reference)

| Change | Files |
|--------|-------|
| New home collection rails (navy panel, 4 items, vertical View all) | `shared/components/home-collection/*`, `features/home/*` |
| Best sellers now uses `bestSeller=true` (was `featured=true`), `pageSize=4` | `features/home/home.component.ts` |
| New routes `/best-sellers`, `/new-arrivals` (catalog page + flag from route data); added to `sitemap.xml` | `app.routes.ts`, `features/catalog/catalog.component.ts`, `public/sitemap.xml` |
| Product card: dark variant for the navy panel; hover = second-photo wipe, no zoom | `shared/components/product-card/*` |
| Account page redesign | `features/account/*` |

---

## 8. Test checklist (backend)

- [ ] `GET /api/products?bestSeller=true&pageSize=4&sort=curated` returns the 4 products in admin order
- [ ] Same for `newArrival=true`
- [ ] Unflagging a product clears its order and removes it from the collection
- [ ] Flags combine with every filter, sort and pagination; `total` is correct
- [ ] `GET /api/products/facets?bestSeller=true` counts only best sellers (same for `newArrival`)
- [ ] Sold items are excluded from the home calls (whichever param you choose)
- [ ] `GET/PUT /api/admin/home-collections/{key}` work, are admin-only, and validate ids
- [ ] No product has a `hoverImage` that is a re-crop / zoom of its `primaryImage`
- [ ] Products with one photo return `hoverImage: null`
- [ ] Image 1 / Image 2 order from admin and Excel import is preserved; `thumbnailUrl` generated
