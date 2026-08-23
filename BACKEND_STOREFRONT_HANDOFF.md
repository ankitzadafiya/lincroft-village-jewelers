# Backend Handoff — Lincroft Storefront (Aug 2026)

**From:** Angular frontend (`Lincroft` repo)  
**To:** Backend team (`Lvj.Api` on Render)  
**Date:** 2026-08-24  
**Purpose:** Single implementation ticket covering production API wiring, catalog filters, category/subcategory structure, product brand display, facet counts, and admin configuration — based on the current frontend and client requirements.

**Production API:** `https://lincroftjewelers.onrender.com/api`  
**Production storefront:** `https://lincroft-village-jewelers.netlify.app`

Please update `API_ENDPOINTS_AND_MODELS.md` (or equivalent) whenever you implement or change any contract below.

---

## Table of contents

1. [Production connection & CORS](#1-production-connection--cors)
2. [Catalog filters (storefront UI)](#2-catalog-filters-storefront-ui)
3. [Filter facet counts (`GET /products/facets`)](#3-filter-facet-counts-get-productsfacets)
4. [App configuration (`showBrandFilter`, `darkModeEnabled`)](#4-app-configuration-showbrandfilter-darkmodeenabled)
5. [Category & subcategory structure](#5-category--subcategory-structure)
6. [Product brand display (`brandName`)](#6-product-brand-display-brandname)
7. [Excel import columns](#7-excel-import-columns)
8. [Frontend code map](#8-frontend-code-map)
9. [Verification checklist](#9-verification-checklist)

---

## 1. Production connection & CORS

The Angular production build calls the Render API directly (not same-origin `/api`).

| Setting | Value |
|---|---|
| `environment.apiUrl` | `https://lincroftjewelers.onrender.com/api` |
| `useMockApi` | `false` in production |
| Local dev | Also points at Render (`ACTIVE_BACKEND = 'production'`) |

**CORS must allow:**

- `https://lincroft-village-jewelers.netlify.app`
- `http://localhost:4200`

**Headers:** `Authorization`, `Content-Type`  
**Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS

Media URLs in JSON must be **absolute `https://...`** (not relative paths).

---

## 2. Catalog filters (storefront UI)

Location: `/shop`, category pages (e.g. `/earring`, `/pendant`).

### 2.1 Sort dropdown

Frontend **removed** name sort options. Allowed values only:

| Label | Query `sort` value |
|---|---|
| Newest | `newest` (default) |
| Best selling | `featured` |
| Price · low to high | `price_asc` |
| Price · high to low | `price_desc` |

If the URL contains `sort=name_asc` or `sort=name_desc`, the frontend resets to `newest`.

Backend may keep supporting `name_asc` / `name_desc` for other clients, but the storefront no longer sends them.

### 2.2 Filter sections shown

| Section | Shown? | Query param | Notes |
|---|---|---|---|
| Price | Yes | `priceMin`, `priceMax` | Slider + inputs from `priceRange` in facets |
| Brand | **Config-gated** | `designer` | Hidden unless `showBrandFilter === true` |
| Metal | Yes | `metal` | Frontend hides Platinum & Sterling Silver pills |
| Gemstone Type | Yes (if data) | `gemstone` | |
| Diamond Type | Yes (if data) | `diamondType` | |
| Availability | **Removed from UI** | — | Frontend clears `availability` from URL |

### 2.3 Filter UI pattern

- No checkboxes — **list rows** with label + count: `White Gold (12)`
- Click toggles filter on/off
- Selected row: light highlight + navy left accent bar

### 2.4 Metal exclusions (frontend-only today)

These are hidden client-side before render:

- Platinum
- Sterling Silver

**Recommendation:** Omit them from `metals[]` in facets and do not expose as filter values, so counts stay consistent.

---

## 3. Filter facet counts (`GET /products/facets`)

### Endpoint

```
GET /api/products/facets
```

### Counts are 100% backend-driven

The storefront displays `count` from the API on every filter row. **The frontend does not compute counts in production.**

```json
{ "value": "White Gold", "label": "White Gold", "count": 12 }
```

### Query scope (what frontend sends today)

| Param | When |
|---|---|
| `category` | Category catalog pages |
| `subcategory` | Optional |
| `designer` | Designer collection pages only |

**Not sent on facet refresh:** `metal`, `gemstone`, `diamondType`, `priceMin`, `priceMax`, `availability`, `q`.

Counts = **active products in category/subcategory/designer scope**, not “remaining after other filters.”

### Response shape

```json
{
  "metals": [{ "value": "White Gold", "label": "White Gold", "count": 12 }],
  "karats": [],
  "gemstones": [],
  "diamondTypes": [{ "value": "Lab-Grown", "label": "Lab-Grown", "count": 14 }],
  "diamondShapes": [],
  "designers": [{ "value": "lincroft-signature", "label": "Lincroft Signature", "count": 8 }],
  "availability": [],
  "priceRange": { "min": 180.00, "max": 11400.00 }
}
```

### Count rules

1. Only `status = active` products
2. Respect same `category` / `subcategory` / `designer` scope as request
3. **`designers[].value` must be designer slug** (matches `GET /products?designer=`)
4. Spec facets (`metals`, `diamondTypes`, etc.) use `specs[].key` values matching list filters
5. **Validation rule:** for each facet row, `count` must equal `GET /api/products?{filter}={value}` → `total` (same scope)
6. Omit rows with `count: 0`
7. `priceRange.min` / `max` = min/max of non-null prices in scoped set

### Cross-check example (live data Aug 2026)

```bash
curl "https://lincroftjewelers.onrender.com/api/products/facets"
curl "https://lincroftjewelers.onrender.com/api/products?designer=lincroft-signature&pageSize=1"
# total should match designers[].count where value = lincroft-signature
```

---

## 4. App configuration (`showBrandFilter`, `darkModeEnabled`)

Admin → **Settings** (Pricing & store).

### Required on `GET /api/config` and `PUT /api/admin/config`

```json
{
  "showBrandFilter": false,
  "darkModeEnabled": false
}
```

| Field | Type | Default | Behavior |
|---|---|---|---|
| `showBrandFilter` | `boolean` | `false` when missing | When `true`: Brand filter section appears and `designer` query param is used. When `false`: Brand hidden; frontend strips `?designer=` from URLs. |
| `darkModeEnabled` | `boolean` | `false` when missing | When `true`: entire storefront (and admin shell) uses dark theme. When `false`: light theme. **No visitor-facing theme toggle** — admin controls this only. |

**Current Render API omits these fields** — toggles do not persist after refresh until backend stores them.

Other config fields unchanged (`showPricesGlobally`, `allowProductPriceOverride`, store contact, `hours`, etc.).

### Storefront navigation — Home link

The header now includes an explicit **Home** nav item (`routerLink="/"`) as the first link, before category links (Ring, Earring, etc.). Logo still links home; Home is for visitors who do not know to click the logo.

No backend change required for Home navigation.

---

## 5. Category & subcategory structure

Categories are loaded from `GET /api/categories`. Subcategories are children with `parentId` set. Order = `sortOrder` ascending.

### 5.1 Top-level categories (unchanged)

| sortOrder | slug | name |
|---:|---|---|
| 1 | `ring` | Ring |
| 2 | `earring` | Earring |
| 3 | `pendant` | Pendant |
| 4 | `necklace` | Necklace |
| 5 | `bracelet` | Bracelet |
| 6 | `silver-jewelry-with-24k-gold-plating` | Silver Jewelry with 24K Gold Plating |

### 5.2 Earring subcategories — **UPDATED order & set**

Parent: `earring` (`cat-earrings`)

| sortOrder | Name (exact) | Suggested slug |
|---:|---|---|
| 1 | **Studs** | `earring-studs` |
| 2 | **Lab-Grown Diamond Earring** | `earring-lab-grown-diamond-earring` |
| 3 | **Natural Diamond Earring** | `earring-natural-diamond-earring` |

Previously Lab-Grown and Natural existed but **Studs was last**. Client requirement: Studs first, then Lab-Grown, then Natural.

### 5.3 Pendant subcategories — **UPDATED order, names & set**

Parent: `pendant` (`cat-pendants`)

| sortOrder | Name (exact) | Suggested slug |
|---:|---|---|
| 1 | **Lab-Grown Diamond Cross Pendant** | `pendant-lab-grown-diamond-cross` |
| 2 | **Lab-Grown Diamond Classic Pendant (Heart & Circle)** | `pendant-lab-grown-diamond-classic-pendant-heart-circle` |
| 3 | **Lab-Grown Diamond Pendant** | `pendant-lab-grown-diamond-pendant` |
| 4 | **Natural Diamond Pendant** | `pendant-natural-diamond-pendant` |

**Spelling notes (client-approved):**

- Use **Diamond** (not “Dimond”)
- Use **Lab-Grown** with hyphen and capital G where shown above
- Cross subcategory name includes **Pendant** suffix: “Lab-Grown Diamond Cross Pendant”

### 5.4 Backend actions

- [ ] Seed/update category rows with exact names and `sortOrder`
- [ ] Keep slugs stable (or provide redirect map if slugs change)
- [ ] Reassign existing products to correct `subcategoryId` where needed
- [ ] Admin category CRUD and Excel import must resolve subcategories **by exact name** under the correct parent category

### 5.5 Subcategory matching (import & admin)

Excel **Subcategory** column and admin dropdown match on **display name** (case-insensitive), e.g.:

- `Studs`
- `Lab-Grown Diamond Earring`
- `Natural Diamond Earring`

Validation error if subcategory’s `parentId` does not match the selected top-level category.

---

## 6. Product brand display (`brandName`)

### Problem

Product cards and PDP currently show **`designerName`** (e.g. “Lincroft Signature”, “Heritage Collection”) because the API denormalizes the linked designer record.

**Client requirement:** The text above the product title on cards must be whatever the admin enters as **Brand** when creating a product or uploading Excel — not necessarily the designer/collection name.

Example card layout:

```
LINCROFT SIGNATURE          ← brand line (from brandName)
Riviera Tennis Necklace     ← product name
$7,800
```

### Solution — new field `brandName`

Add a **free-text** field separate from `designerId` / `designerName`.

| Field | Purpose |
|---|---|
| `designerId` | Relational link for **Brand filter** facet (`GET /products?designer=slug`) |
| `designerName` | Denormalized designer display name (optional, from designer table) |
| **`brandName`** | **Storefront card + PDP eyebrow** — admin/Excel controlled |

### Required on API models

**Product (detail), ProductListItem (list), ProductWritePayload (admin create/update):**

```json
{
  "brandName": "Lincroft Signature",
  "designerId": "…",
  "designerName": "Lincroft Atelier"
}
```

| Field | Type | Required |
|---|---|---|
| `brandName` | `string \| null` | No |

### Display precedence (frontend)

```ts
brandName  →  if set, show on card/PDP
else designerName
else categoryName (cards only)
else "Lincroft Atelier" (PDP fallback)
```

Implement in backend list/detail responses:

```csharp
// Pseudocode — list item mapping
BrandName = product.BrandName,
DesignerName = product.Designer?.Name,
```

**Do not** overwrite `brandName` with designer name on read unless `brandName` is null and you want a server-side fallback (optional). Frontend already falls back to `designerName`.

### Admin UI (frontend shipped)

- **Products → Edit:** new **Brand** text field (above Designer dropdown)
- **Designer** dropdown still sets `designerId` for filtering

### Search

Include `brandName` in product search (`q` param) alongside name, SKU, designerName, specs.

---

## 7. Excel import columns

### Updated column mapping (frontend template)

| Excel header | Maps to | Notes |
|---|---|---|
| SKU | `sku` | Required |
| Product Name | `name` | Required |
| Description | `description` | |
| Category | `category` | Required; top-level name |
| Subcategory | `subcategory` | Must match §5 names |
| **Brand** | **`brandName`** | **Shown on storefront cards** |
| **Designer** | `designer` | Lookup designer by name → `designerId` |
| Metal Type | `metal` | Spec |
| Metal Karat | `karat` | Spec |
| Diamond Type | `diamondType` | Spec |
| … | … | (unchanged) |

**Breaking change from old template:** `Brand/Designer` single column split into:

- **Brand** → `brandName` (display)
- **Designer** → designer relation (filter)

Backend import validate/confirm must accept both fields.

Example row:

| Brand | Designer |
|---|---|
| Lincroft Signature | Lincroft Atelier |

Expected result: card shows **Lincroft Signature**; `designerId` points at Lincroft Atelier for facets/filter.

---

## 8. Frontend code map

| Area | Path |
|---|---|
| Product models + `productDisplayBrand()` | `src/app/core/models/product.model.ts` |
| Product card brand line | `src/app/shared/components/product-card/product-card.component.ts` |
| PDP eyebrow | `src/app/features/product/product.component.html` |
| Admin brand field | `src/app/features/admin/products/product-form/*` |
| Import mapping | `src/app/core/mock/mock-data.ts` → `DEFAULT_IMPORT_MAPPING` |
| Filter UI | `src/app/shared/components/product-filters/*` |
| Catalog sort options | `src/app/features/catalog/catalog.component.ts` |
| Brand filter config | `src/app/core/services/configuration.service.ts` |
| Dark mode config | `src/app/core/services/theme.service.ts`, admin settings |
| Header Home nav | `src/app/shared/components/header/header.component.ts` |
| Mock categories (dev) | `src/app/core/mock/mock-data.ts` → `MOCK_CATEGORIES` |
| Production API URL | `src/environments/api-backend.ts` |

---

## 9. Verification checklist

### API & deployment

- [ ] Render API live at `https://lincroftjewelers.onrender.com/api`
- [ ] CORS allows Netlify + localhost
- [ ] Absolute media URLs in product/category JSON

### Categories

- [ ] Earring subcategories: Studs (1), Lab-Grown Diamond Earring (2), Natural Diamond Earring (3)
- [ ] Pendant subcategories: four rows in §5.3 order with correct spelling
- [ ] `GET /api/categories` returns correct `sortOrder` for mega-menu and admin dropdowns

### Brand display

- [ ] `brandName` on Product, ProductListItem, admin write DTO
- [ ] List + detail return `brandName` from DB (not only `designerName`)
- [ ] Excel import writes `brandName`
- [ ] Sample product: `brandName: "Lincroft Signature"` shows on card even if designer is different

### Filters & facets

- [ ] `GET /products/facets` counts match `GET /products?filter=` totals
- [ ] `showBrandFilter` persisted on config GET/PUT
- [ ] `darkModeEnabled` persisted on config GET/PUT; storefront theme follows value (no visitor toggle)
- [ ] Designer facet `value` = slug
- [ ] Optional: exclude Platinum / Sterling Silver from metal facets

### Sort

- [ ] `newest`, `featured`, `price_asc`, `price_desc` work on list endpoint

### Quick smoke tests

```bash
ORIGIN=https://lincroftjewelers.onrender.com

curl "$ORIGIN/api/config"
curl "$ORIGIN/api/categories"
curl "$ORIGIN/api/products/facets?category=earring"
curl "$ORIGIN/api/products?category=earring&subcategory=earring-studs&pageSize=1"
curl "$ORIGIN/api/products?pageSize=2"
# Confirm list items include brandName when set
```

---

## Appendix A — Session change log (for context)

| Date | Change |
|---|---|
| 2026-08-22 | Production API pointed to Render (not Netlify relative `/api`) |
| 2026-08-24 | Removed A–Z / Z–A sort options |
| 2026-08-24 | Removed Availability filter from UI |
| 2026-08-24 | Hide Platinum & Sterling Silver in metal filter (FE) |
| 2026-08-24 | Brand filter gated by `showBrandFilter` admin setting |
| 2026-08-24 | Filter UI: list rows with counts (no checkboxes) |
| 2026-08-24 | Earring + Pendant subcategory reorder/add |
| 2026-08-24 | **`brandName` field** for card/PDP display vs designer link |
| 2026-08-24 | Header **Home** nav link (first item) |
| 2026-08-24 | Removed visitor theme toggle; **`darkModeEnabled`** admin config |

---

## Appendix B — Related docs in repo

- `BACKEND_API.md` — full API reference
- `BACKEND_CHANGE_REQUEST.md` — earlier tickets (CORS, media URLs, admin inbox, etc.)
- `BACKEND_PRODUCT_FACETS.md` — short facet-count supplement (superseded by §3 here)

**This file (`BACKEND_STOREFRONT_HANDOFF.md`) is the primary document to share with backend for storefront work as of 2026-08-24.**
