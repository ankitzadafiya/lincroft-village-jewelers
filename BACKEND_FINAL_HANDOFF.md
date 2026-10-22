# Lincroft Village Jewelers: Final Backend Handoff (Storefront Redesign)

**Audience:** Backend / API developer and whoever maintains the admin panel
**Date:** 23 October 2026
**Verified against the live API on:** 23 October 2026 (`GET /api/products`, `/api/products/{slug}`, `/api/products/facets`, `/api/categories`, `/api/content/services`, `/api/content/home`, `/api/config`)

This document **replaces** the two earlier files:

- `BACKEND_CHANGE_REQUIREMENTS.md`
- `BACKEND_HOME_COLLECTIONS_AND_PRODUCT_IMAGES.md`

Everything still relevant from those files is included here, with the current status of each item.

**Contract note:** the storefront redesign uses the existing API. No endpoint was renamed or removed. The only new requirements are listed in section 2 and are additive.

---

## 1. Status at a glance

| # | Item | Status | Priority |
|---|------|--------|----------|
| 1 | `brandName` on product list + detail | ✅ Done | |
| 2 | `primaryImage` + `hoverImage` present on list items | ✅ Present (25 / 25) | |
| 3 | `thumbnailUrl` (card size images) | ✅ Done (25 / 25) | |
| 4 | Service slugs match the home "Jewelry services" section | ✅ Done (all 6) | |
| 5 | Category `imageUrl` for top level categories | ✅ Done (6 / 6) | |
| 6 | `bestSeller` / `newArrival` filters on `GET /api/products` | ✅ Working (5 / 6 products) | |
| 7 | **Hover photo must be a real second photo** | ❌ **All 25 hover images are a zoomed crop of the main photo** | **P1** |
| 8 | **Facets must respect `bestSeller` / `newArrival`** | ❌ Ignored (counts all 25 products) | **P1** |
| 9 | **Home order fields + `sort=curated`** | ❌ Order fields not on the product DTO; `curated` accepted but not defined | **P1** |
| 10 | **Exclude sold items from the home collections** | ⚠️ Not verifiable yet (no sold items); please confirm param | P2 |
| 11 | **Admin "Homepage" endpoints** | ❌ `GET /api/admin/home-collections/{key}` returns 404 | P2 |
| 12 | **Store address / phone** | ❌ Still placeholders ("123 Main Street", "(732) 555-0142") | P2 (admin data) |
| 13 | Content text style (no dashes) | ℹ️ Guideline for admin entered text | P3 |
| 14 | Optional: manage home videos, hero photos, announcement bar from admin | ℹ️ Optional, later | P3 |

---

## 2. Open requirements (details)

### 2.1 Real second photo for product cards (P1)

**What the storefront does (live now)**

- Every product card shows **photo 1** (`primaryImage`).
- On hover (desktop), **photo 2** (`hoverImage`) is revealed with a soft upward wipe. There is no zoom effect any more.
- If `hoverImage` is `null` (or the same URL as photo 1), the card simply stays on photo 1.

**Problem found:** every `hoverImage` is the *same picture* as the primary image, zoomed in by the URL:

```
...&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=2
```

The client sees this as a "zoom" instead of a second photo.

**Required rule for every endpoint that returns `ProductListItem`** (list, search, related, favourites):

| Field | Rule |
|-------|------|
| `primaryImage` | Image with `isPrimary = true`, otherwise lowest `sortOrder`. `null` only if there are no images. |
| `hoverImage` | The **next** image by `sortOrder` that is not the primary. `null` if the product has only one image. |
| Both | Must be **real uploaded photos**. Never generate the hover image by re-cropping or zooming the primary URL. |
| Both | Absolute `https://` URLs, public, with `thumbnailUrl` (about 800 px WebP). |

**Action now:** replace the seeded hover images on all 25 products with a genuinely different photo, or set `hoverImage` to `null` until real photos exist.

**Admin / import**

- Product form: label the first two images **"Main photo"** and **"Hover photo"**. Drag to reorder changes which is which. Persist `sortOrder` and `isPrimary` exactly as shown.
- Show a soft warning when a product has only one image ("Add a second photo for the hover effect").
- Excel import: **Image 1** becomes primary (`sortOrder 0`), **Image 2** becomes hover (`sortOrder 1`), **Image 3 to 12** become gallery images.
- Product detail `images[]`: sorted by `sortOrder` (primary first), with no synthetic duplicates.

**Photo guidance (for the content team)**

- Photo 1: a clean front shot on a white or very light background.
- Photo 2: a different angle, an on-hand shot, or a close-up detail, with the same framing and background.
- Square (1:1) or 4:5, at least 1600 px on the long side.

---

### 2.2 Home collections: Best sellers and New arrivals (P1)

**What the storefront shows**

- Two home sections, **Best sellers** and **New arrivals**, each with **4 products** on a navy panel and a **View all** strip.
- View all opens new pages **`/best-sellers`** and **`/new-arrivals`**, which have filters, sort and pagination.

**Calls made today**

```http
GET /api/products?bestSeller=true&pageSize=4&sort=featured
GET /api/products?newArrival=true&pageSize=4&sort=newest

# View all pages (plus the shopper's filters, sort and page)
GET /api/products?bestSeller=true&metal=yellow-gold&sort=price_asc&page=2&pageSize=12
GET /api/products?newArrival=true&page=1&pageSize=12
```

**Source of truth:** the existing product flags `bestSeller` and `newArrival` (already in the admin product form).

#### a) Admin controlled order (which 4, in what order)

Add two nullable integer fields on Product (admin read/write DTO):

```text
bestSellerOrder  int | null   // 1 = first
newArrivalOrder  int | null
```

Define `sort=curated`:

| Request | Ordering |
|---------|----------|
| `bestSeller=true&sort=curated` | `bestSellerOrder ASC NULLS LAST`, then `updatedAt DESC` |
| `newArrival=true&sort=curated` | `newArrivalOrder ASC NULLS LAST`, then `createdAt DESC` |
| `sort=curated` without a flag | same as `featured` |

Rules:

- Turning a flag **off** clears its order field.
- When this is live, tell the frontend. We switch the two home calls to `sort=curated` (one line change).

#### b) Flags must work with everything else

- `bestSeller` / `newArrival` combine (AND) with every filter: `category`, `subcategory`, `designer`, `metal`, `karat`, `gemstone`, `diamondType`, `diamondShape`, `priceMin`, `priceMax`, `availability`, `q`.
- All sort values work with the flags.
- `total` / `totalPages` reflect the filtered collection. ✅ already true

#### c) Facets must respect the flags (P1)

`GET /api/products/facets` must accept `bestSeller` and `newArrival` and count **only** products in that collection.

```http
GET /api/products/facets?bestSeller=true
GET /api/products/facets?newArrival=true&category=ring
```

Today the flag is ignored: metal counts total 25 with and without `bestSeller=true`, so the filter dropdowns on `/best-sellers` show counts for the whole catalogue. Tell the frontend when this is fixed, and we will pass the flag to the facets call.

#### d) Hide sold items on the home collections (P2)

Please support **one** of these and tell us which:

- `availability=in_stock,made_to_order` (comma separated list), **or**
- `excludeSold=true`

There are no sold products in the data right now, so we could not confirm either one.

#### e) Admin "Homepage" screen (P2)

The frontend will build an admin screen that shows both lists with drag to reorder. The first 4 are marked "Shown on home page", and products can be added and removed. It needs:

```http
GET /api/admin/home-collections/{key}         # key = best-sellers | new-arrivals
PUT /api/admin/home-collections/{key}
Content-Type: application/json

{ "productIds": ["id-1", "id-2", "id-3", "id-4", "id-5"] }
```

GET response:

```json
{
  "key": "best-sellers",
  "items": [
    {
      "productId": "...",
      "order": 1,
      "slug": "...",
      "name": "...",
      "sku": "...",
      "status": "active",
      "availability": "in_stock",
      "primaryImage": { "url": "...", "thumbnailUrl": "..." }
    }
  ]
}
```

PUT behaviour (one transaction):

1. Sets the flag on every listed product and writes the order 1…n in array order.
2. Clears the flag and the order on products in that collection that are not in the list.
3. Rejects unknown or archived ids with `400` and lists the bad ids.
4. Returns the same shape as the GET and refreshes any public product list cache.

Admin only, same auth as other `/api/admin/*` routes. If you would rather extend the existing product update instead, that works too; just tell us.

---

### 2.3 Store details (P2, admin data, no code)

`GET /api/config` still returns placeholder values:

| Field | Current value |
|-------|---------------|
| `addressLine` | `123 Main Street` |
| `phone` / `phoneDisplay` | `(732) 555-0142` |

They show in the footer "Visit the store" card, on the contact page and in Google structured data (SEO). Please enter the real values in **Admin → Settings**.

`hours` (7 rows) and `mapsUrl` are present ✅. The footer highlights today's row using New York time.

---

### 2.4 Content text style (P3, guideline)

The client asked for simple, plain wording **without dashes** ("—", "–", or " - " used as a dash) anywhere on the site. All frontend text has been updated. Please apply the same rule to text entered in the admin or seeded in the database, which appears directly on the site:

- service `title` / `description` / `summary`
- category `description`
- product `description`
- home content (`heroTitle`, `heroSubtitle`, `aboutExcerpt`)

Use a comma, a full stop, or the word "to" (for ranges: "10:00 am to 6:00 pm", "$500 to $1,000"). Avoid stiff words such as "atelier", "curated", "bespoke" and "timeless elegance".

---

### 2.5 Optional: make new home content manageable from admin (P3, later)

These sections currently use fixed frontend content. No backend work is needed for launch. If the store wants to change them without a developer, add the fields below and we will connect them.

**a) Home video features (4 videos)**

There are two home sections with two video tiles each, currently using free Pexels clips as placeholders:

| Section | Tile 1 | Tile 2 |
|---------|--------|--------|
| "Made to be worn" (bridal) | Lab-grown engagement rings | Lab-grown wedding bands |
| "Shine every day" (mirrored layout) | Everyday jewelry | Silver + 24k gold |

Suggested addition to `GET /api/content/home`:

```json
"videoFeatures": [
  {
    "key": "bridal",
    "kicker": "Lab-grown bridal",
    "title": "Made to be worn",
    "text": "...",
    "tiles": [
      {
        "title": "Engagement rings",
        "kicker": "Lab-grown",
        "videoUrl": "https://.../engagement.mp4",
        "videoUrlSmall": "https://.../engagement-540.mp4",
        "posterUrl": "https://.../engagement.jpg",
        "thumbUrl": "https://.../thumb.jpg",
        "href": "/ring?subcategory=ring-lab-grown-engagement-ring"
      }
    ]
  }
]
```

Video spec: portrait 9:16, MP4 (H.264), muted, 8 to 20 s loop, 720 px wide (plus about 540 px for phones), under about 4 MB, and a poster JPG.

**b) Home hero (3 panels):** currently fixed store photos (ring on hand, eternity band, diamond studs). They could become a `heroPanels` list (image, label, title, link) in home content.

**c) Announcement bar:** the moving top bar is hidden for now at the client's request. If it returns, an `announcements: string[]` field in config or home content would let the store edit it. The old text "Free shipping on orders over $500" should not return unless that offer is real.

---

## 3. What changed on the frontend (no backend action)

| Area | Change | Backend impact |
|------|--------|----------------|
| Theme | Navy and white, Cormorant Garamond headings, Outfit for everything else | None |
| Header | Text wordmark logo, menu in the dropdown style, hides on scroll down and returns on scroll up | None |
| Menu dropdowns | One per category with subcategory links | Uses `GET /api/categories` (`parentId`, `megaMenu`, `sortOrder`) |
| Home hero | Three fixed store photos (Rings, Wedding bands, Earrings) | None (optional CMS in 2.5b) |
| Our Categories | Five tiles (Silver + 24k gold not shown here; still in the menu) | Uses category `imageUrl` ✅ |
| Best sellers / New arrivals | Four products on a navy panel, plus View all pages | See 2.2 |
| Video features | Two sections, four video tiles | Optional, see 2.5a |
| Jewelry services | Six animated steps, auto play every 4 s | Uses `GET /api/content/services` titles and text ✅ (service `imageUrl` no longer used on the home page) |
| Custom jewelry story | Scroll story: Sketch, CAD design & 3D model, Casting, Setting | None |
| Product cards | Second photo wipe on hover, dark variant on navy panels | See 2.1 |
| Catalog | Pill filters, sort menu, filter chips | Same query params as before |
| Login / register | Redesigned page | Same endpoints |
| About page | Hidden: link removed, `/about` redirects to home, removed from sitemap | None |
| Footer | Newsletter, store hours, map, visit card | `POST /api/newsletter`, `GET /api/config` |
| Copy | Dashes removed, simpler wording | See 2.4 for admin text |

**New storefront routes:** `/best-sellers`, `/new-arrivals` (both added to `sitemap.xml`).
**Removed from navigation:** `/about` (redirects to `/`).

---

## 4. Storefront API calls (for reference)

```text
GET  /api/config
GET  /api/categories
GET  /api/categories/{slug}
GET  /api/products              (list, filters, flags, sort, paging)
GET  /api/products/facets
GET  /api/products/{slug}
GET  /api/products/{slug}/related
GET  /api/search
GET  /api/content/home
GET  /api/content/services
GET  /api/content/designers
GET  /api/content/testimonials
GET  /api/content/instagram
POST /api/inquiries
POST /api/contact
POST /api/custom-jewelry
POST /api/newsletter
POST /api/customer/register
POST /api/customer/login
POST /api/customer/login/google
GET  /api/customer/me
GET  /api/customer/favorites
PUT  /api/customer/favorites
```

The frontend adds an internal `X-Skip-Loader` header to some background calls and **removes it before the request is sent**, so no CORS change is needed.

---

## 5. Test checklist

**Images**
- [ ] No product has a `hoverImage` that is a crop or zoom of its `primaryImage`
- [ ] Products with one photo return `hoverImage: null`
- [ ] Image 1 / Image 2 order from admin and from Excel import is kept; `thumbnailUrl` is generated

**Home collections**
- [ ] `GET /api/products?bestSeller=true&pageSize=4&sort=curated` returns products in admin order (same for `newArrival`)
- [ ] Turning a flag off clears its order and removes the product from the collection
- [ ] Flags work with every filter, sort and page; `total` is correct
- [ ] `GET /api/products/facets?bestSeller=true` counts only best sellers (same for `newArrival`)
- [ ] Sold items can be excluded (tell us which parameter)
- [ ] `GET` / `PUT /api/admin/home-collections/{key}` work, are admin only, and validate ids

**Data**
- [ ] Real address and phone set in Admin → Settings
- [ ] Admin entered text follows the no-dash style (2.4)

Please reply with: the sold-items parameter you chose (2.2d), whether you used the new home-collections endpoints or the product update (2.2e), and when `sort=curated` and facet scoping are live, so the frontend can switch over.
