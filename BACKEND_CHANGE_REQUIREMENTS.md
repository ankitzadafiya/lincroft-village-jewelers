# Backend Change Requirements — Storefront Redesign (Oct 2026)

**Project:** Lincroft Village Jewelers (Angular storefront + admin)
**Audience:** Backend / API developer
**Date:** 2026-10-22
**Checked against:** live API (`GET /api/products`, `/api/products/{slug}`, `/api/categories`, `/api/content/services`, `/api/content/home`, `/api/config`, `/api/products/facets`)

The storefront redesign uses the **existing API contracts** — no endpoint was renamed or removed and no new query parameters were added. The items below are what the backend needs to supply (data, or a small response change) for the new design to work as intended.

---

## 1. Summary

| # | Item | Type | Priority | Blocking? |
|---|------|------|----------|-----------|
| 2 | Product images: `primaryImage` + `hoverImage` on list items (hover photo swap) | Response rule + data | **P1** | Cards show "Photography coming soon" until fixed |
| 3 | `thumbnailUrl` for card-sized images | Media pipeline | **P1** | No (falls back to full `url`, but slow) |
| 4 | `brandName` missing from product responses | Response field | **P1** | No (falls back to designer / category name) |
| 5 | Category `imageUrl` (home hero + "Our Categories") | Data | P2 | No (falls back to built-in images) |
| 6 | Services slugs don't match the home "We're Here To Help" section | Data / content | P2 | No (falls back to built-in text) |
| 7 | Store contact details are placeholders | Admin data | P2 | No |
| 8 | Optional: `mapEmbedUrl` in config | Optional field | P3 | No |
| 9 | Doc fix: add `hoverImage` to `BACKEND_API.md` | Docs | P3 | No |

Section 10 lists everything in the redesign that needs **no** backend change.

---

## 2. Product card images — `primaryImage` + `hoverImage` (P1)

### What the frontend does
Every product grid (home best sellers, category/catalog pages, search, favorites) uses one card component:

- Shows `primaryImage`.
- On hover (desktop), cross-fades to `hoverImage` — a second photo of the same product (side view, on-hand / on-model, detail shot).
- If `hoverImage` is `null`, or has the same URL as `primaryImage`, the card simply doesn't swap (no error).
- If `primaryImage` is `null`, the card shows a "Photography coming soon" placeholder.

The field `hoverImage` **is already in the list response** (key present), but:

> **Live API today:** 25 / 25 products have `primaryImage: null` and `hoverImage: null`. Product detail also returns `images: []` for every product. So every card currently shows the placeholder.

### Required response rule — `GET /api/products` (`PagedResult<ProductListItem>`)

Derive both fields from the product's `images` (type `image` only, ignore videos):

| Field | Rule |
|-------|------|
| `primaryImage` | The image with `isPrimary = true`. If none is flagged, the image with the lowest `sortOrder`. `null` only when the product has no images. |
| `hoverImage` | The **next** image by `sortOrder` that is **not** the primary (i.e. the lowest `sortOrder` among non-primary images). `null` when the product has only one image. Must never be the same media row/URL as `primaryImage`. |

Both are full `ProductMedia` objects:

```json
{
  "id": "…",
  "sku": "LVJ-R-1001",
  "slug": "aurelia-solitaire-engagement-ring",
  "name": "Aurelia Solitaire Engagement Ring",
  "...": "...",
  "primaryImage": {
    "id": "m_1",
    "url": "https://<api-or-cdn-host>/media/products/aurelia/1.jpg",
    "thumbnailUrl": "https://<api-or-cdn-host>/media/products/aurelia/1_800.webp",
    "alt": "Aurelia solitaire engagement ring, front view",
    "sortOrder": 0,
    "type": "image",
    "isPrimary": true
  },
  "hoverImage": {
    "id": "m_2",
    "url": "https://<api-or-cdn-host>/media/products/aurelia/2.jpg",
    "thumbnailUrl": "https://<api-or-cdn-host>/media/products/aurelia/2_800.webp",
    "alt": "Aurelia solitaire engagement ring, side profile",
    "sortOrder": 1,
    "type": "image",
    "isPrimary": false
  }
}
```

Apply the same rule wherever a `ProductListItem` is returned (list, featured/best-seller/new-arrival queries, search, related products, favorites if served by the API).

### URL requirements (repeat of existing rule, still important)
- Absolute `https://` URLs, publicly readable with no cookie/auth header (the browser loads them directly from `<img>`).
- Google Drive / Dropbox share links from the Excel import must be resolved to a **direct image URL** (or mirrored to your media store). A share-page URL renders as a broken image.

### Admin / import behaviour to confirm
- Admin product form and Excel import (`Image 1…Image 12`) already allow multiple images. Please confirm: **Image 1 → `isPrimary: true, sortOrder 0`**, **Image 2 → `sortOrder 1`** (becomes the hover image), etc.
- Reordering images in admin (changing `sortOrder` / `isPrimary`) must be reflected in the list response immediately (watch for caching).

### Guidance for whoever uploads photos (please forward to the content team)
- Cards are portrait, **5 : 6** ratio, product centred. Square (1:1) or 4:5 source images crop well.
- Plain **white or very light background**. The card tints the background slightly and the photo blends into it, so white backgrounds look intentional.
- Image 1 = clean front/hero shot. Image 2 = a *different* angle or on-hand shot (this is what appears on hover).

### Acceptance check
```http
GET /api/products?page=1&pageSize=24
```
- For a product with ≥2 images: `primaryImage.url` ≠ `hoverImage.url`, both open in a private browser window.
- For a product with 1 image: `hoverImage` is `null`.
- `GET /api/products/{slug}` returns the same images in `images[]` sorted by `sortOrder`.

---

## 3. `thumbnailUrl` — card-sized images (P1, performance)

Cards render at roughly **300–600 px wide** (up to ~2× on retina). Each card loads **two** images (primary + hover). The frontend uses `thumbnailUrl` when present and falls back to `url`.

Today, the sample photos used elsewhere on the site are ~1600 px JPEGs; with 12–24 cards per page that's 24–48 full-size downloads.

**Request:** when an image is uploaded or imported, generate a card-size variant and return it as `thumbnailUrl`:

| Property | Value |
|----------|-------|
| Width | **800 px** on the long edge (keep aspect ratio) |
| Format | WebP (JPEG fallback acceptable) |
| Quality | ~80 |
| Size target | < 120 KB |

Keep `url` as the full-size original (used on the product detail page gallery and zoom). Also cache-friendly headers on media (`Cache-Control: public, max-age=31536000, immutable` for content-hashed file names) are recommended.

---

## 4. `brandName` missing from product responses (P1)

The product model has `brandName` (free text — admin "Brand" field and Excel **Brand** column). The admin form sends it on create/update, and the storefront card + product page show it above the product name.

**Live API today:** `brandName` is **not present** in either the list response (`ProductListItem`) or the detail response (`Product`). The frontend currently falls back to `designerName`, then category name.

**Request:**
- Return `brandName: string | null` on **both** `ProductListItem` and `Product`.
- Confirm it is persisted from `POST/PUT /api/admin/products` (`ProductWritePayload.brandName`) and from the Excel import Brand column.

---

## 5. Category images (P2 — data)

The redesigned home page uses category images in two places:

| Section | Uses |
|---------|------|
| Hero (3 panels: Ring / Earring / Bracelet) | `Category.imageUrl` of top-level categories `ring`, `earring`, `bracelet` |
| "Our Categories" mosaic (6 tiles) | `Category.imageUrl` of the 6 top-level categories (`ring`, `earring`, `pendant`, `necklace`, `bracelet`, `silver-jewelry-with-24k-gold-plating`) |

**Live API today:** 0 / 27 categories have an `imageUrl`, so the site uses built-in placeholder images.

**Request:** no code change if admin category image upload already saves `imageUrl` — please confirm it does, and that the URL is absolute `https://`. Then images just need to be added in **Admin → Categories**.

Recommended category image: portrait, at least 1200 × 1500 px, product on a plain light background.

---

## 6. Services — slugs don't match the home page section (P2 — content decision)

The home section **"We're Here To Help"** lists six services and merges API data **by slug** (the API value wins for title / description / image):

| Slug the frontend expects | Title shown |
|---------------------------|-------------|
| `jewelry-repair` | Jewelry Repair & Cleaning |
| `gold-buying` | We Buy Gold |
| `watch-repair` | Watch Repairs |
| `jewelry-appraisal` | Appraisals |
| `battery-links` | Same Day Watch Battery Replacement & Link Adjustments |
| `estate-consulting` | Estate Jewelry Consulting |

**Live API today** (`GET /api/content/services`) returns 3 services with different slugs: `custom-design`, `repairs-resizing`, `appraisals`. None match, so the section shows only built-in text and images, and nothing edited in admin appears there.

**Request (pick one, tell the frontend):**
- **A (recommended):** create/rename services in admin/DB to use the six slugs above (with `title`, `description`, `imageUrl`, `active`, `sortOrder`).
- **B:** keep your slugs and send the frontend the final list; we'll update the mapping.

Note: for `gold-buying`, `battery-links` and `estate-consulting` the frontend keeps its own wording and only takes `imageUrl` from the API (client-approved copy).

---

## 7. Store contact details (P2 — admin data, no code)

The new footer shows address, phone, email, store hours (today's row highlighted, America/New_York time) and a "Get directions" link, all from `GET /api/config`.

`addressLine` and `phone` currently look like placeholders ("123 Main Street", "(732) 555-0142"). Please update the real values via **Admin → Settings**, and confirm `hours` is returned in the existing `StoreHours[]` shape.

---

## 8. Optional — `mapEmbedUrl` in config (P3)

The footer embeds a Google Map of the store. The embed URL is currently a constant in the frontend. If you'd like the store to manage it, add an optional field:

```json
// GET /api/config
{ "...": "...", "mapEmbedUrl": "https://www.google.com/maps/embed?pb=…" }
```

Only `https://www.google.com/maps/embed…` values should be accepted (validate on save). If absent, the frontend keeps using its constant. **Not required for launch.**

---

## 9. Docs fix (P3)

`BACKEND_API.md` §6 "ProductListItem (storefront cards)" example is missing `hoverImage` (and `brandName`). Please add both so the doc matches the contract in sections 2 and 4.

---

## 10. Redesign items that need **no backend change**

| Area | Why no change |
|------|---------------|
| New navy/white theme, fonts, scroll effects, spacing | CSS only |
| Header dropdown menus (per category, with subcategory links) | Existing `GET /api/categories` (`parentId`, `megaMenu`, `sortOrder`) |
| Catalog page: pill filters, sort menu, filter chips, grid density | Same query params as before (`category`, `subcategory`, `designer`, `metal`, `gemstone`, `diamondType`, `priceMin`, `priceMax`, `sort`, `page`, `pageSize`) and `GET /api/products/facets` |
| Card badges ("Sold", "% off", "New in") | Derived from existing `availability`, `price`, `compareAtPrice`, `newArrival` (respects price visibility) |
| Card "add to inquiry bag" button | Existing client-side inquiry bag → existing inquiry POST |
| Footer newsletter | Existing `POST /api/newsletter` |
| Ring-creation story ("If you can dream it, we can build it") | Static content + links to `/contact` and `/custom-jewelry` |
| Occasions section | Existing catalog routes + `subcategory` query |
| Silent background product loads | Frontend adds an internal `X-Skip-Loader` header and **strips it before the request leaves the browser** — no CORS change needed |

---

## 11. Quick test list for backend

- [ ] `GET /api/products` — products with 2+ images return distinct `primaryImage` and `hoverImage`; 1 image → `hoverImage: null`
- [ ] All image `url` / `thumbnailUrl` values are absolute `https://` and load without auth
- [ ] `thumbnailUrl` generated (~800 px WebP) on upload and on Excel import
- [ ] `brandName` present on list + detail responses, persisted from admin and import
- [ ] Category `imageUrl` saves from admin and is returned by `GET /api/categories`
- [ ] Services slug decision made (section 6)
- [ ] Real address / phone set in Admin → Settings
