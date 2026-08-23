# Backend handoff — Product filter facets & counts

> **Full storefront handoff:** [`BACKEND_STOREFRONT_HANDOFF.md`](./BACKEND_STOREFRONT_HANDOFF.md) — categories, `brandName`, filters, production API, config.  
> This file is the facet-count supplement.

**From:** Angular storefront (`Lincroft` repo)  
**To:** Backend (`Lvj.Api`)  
**Date:** 2026-08-24  
**Purpose:** Document how the shop sidebar filter **counts** work, where they must come from, and how to keep them aligned with real product inventory.

---

## 1. Short answer

**Counts are backend-driven.** The frontend does **not** calculate facet counts in production.

| Environment | Source of counts |
|---|---|
| Production / Render (`useMockApi: false`) | `GET /api/products/facets` response |
| Local mock mode (`useMockApi: true`) | Mock interceptor only (for UI dev) |

Each pill in the filter sidebar renders:

```html
<span class="chip-label">{{ item.label }}</span>
<span class="chip-count">{{ item.count }}</span>
```

`item.count` is taken **directly** from the API. If the count is wrong, fix it on the server — not in Angular.

---

## 2. API contract

### Endpoint

```
GET /api/products/facets
```

Public (storefront). Same auth/CORS rules as `GET /api/products`.

### Query parameters (scope)

The catalog page calls facets with **only** these params today:

| Param | When sent | Purpose |
|---|---|---|
| `category` | Category/shop routes | Slug of top-level category |
| `subcategory` | Optional | Slug of subcategory |
| `designer` | Designer collection pages only | Designer **slug** |

**Not sent on facet refresh today:** `metal`, `gemstone`, `diamondType`, `priceMin`, `priceMax`, `availability`, `q`.

So counts represent **products in the current category/subcategory/designer scope**, not “remaining after other filters are applied.”

Example calls:

```http
GET /api/products/facets
GET /api/products/facets?category=ring
GET /api/products/facets?category=ring&subcategory=engagement-ring
GET /api/products/facets?designer=lincroft-signature
```

### Response shape

```json
{
  "metals": [
    { "value": "White Gold", "label": "White Gold", "count": 12 }
  ],
  "karats": [
    { "value": "14k", "label": "14k", "count": 13 }
  ],
  "gemstones": [],
  "diamondTypes": [
    { "value": "Lab-Grown", "label": "Lab-Grown", "count": 14 }
  ],
  "diamondShapes": [
    { "value": "Round", "label": "Round", "count": 16 }
  ],
  "designers": [
    { "value": "lincroft-signature", "label": "Lincroft Signature", "count": 8 }
  ],
  "availability": [
    { "value": "in_stock", "label": "In Stock", "count": 25 }
  ],
  "priceRange": {
    "min": 180.00,
    "max": 11400.00
  }
}
```

TypeScript types in frontend:

```ts
interface FacetValue {
  value: string;   // sent back as filter query param
  label: string;   // shown in UI
  count: number;   // shown in pill badge — must match real products
}

interface ProductFilterFacets {
  metals: FacetValue[];
  karats: FacetValue[];
  gemstones: FacetValue[];
  diamondTypes: FacetValue[];
  diamondShapes: FacetValue[];
  designers: FacetValue[];
  availability: FacetValue[];
  priceRange: { min: number; max: number };
}
```

---

## 3. How counts must be computed

### Product set

Count only products that would appear on the **public storefront list**:

- `status = active`
- Apply the same `category` / `subcategory` / `designer` / `q` scope as the facet request (when provided)

### Per-facet rules

| Facet array | Product field | `value` must match | `count` meaning |
|---|---|---|---|
| `metals` | `specs[]` where `key = "metal"` | Exact value used in `GET /api/products?metal=` | # active products in scope with that metal spec |
| `karats` | `specs[]` where `key = "karat"` | Exact karat string (`14k`, `18K`, …) | # products with that karat |
| `gemstones` | `specs[]` where `key = "gemstone"` | Gemstone type value | # products with that gemstone |
| `diamondTypes` | `specs[]` where `key = "diamondType"` | e.g. `Lab-Grown`, `Natural` | # products with that diamond type |
| `diamondShapes` | `specs[]` where `key = "shape"` **or** `"diamondShape"` | Shape value | # products with that shape (dedupe by value) |
| `designers` | `designerId` → designer record | Designer **slug** (not display name) | # products for that designer in scope |
| `availability` | `availability` enum | `in_stock`, `made_to_order`, `sold` | # products with that availability |
| `priceRange` | `price` on scoped products | n/a | `min` / `max` of non-null prices in scope |

### Matching list filters

When the shopper selects a pill, the frontend calls:

```http
GET /api/products?metal=White Gold&category=ring&page=1&pageSize=12
GET /api/products?designer=lincroft-signature&page=1&pageSize=12
GET /api/products?diamondType=Lab-Grown&page=1&pageSize=12
```

**Rule:** For every facet row, `count` must equal the `total` returned by `GET /api/products` with **only** that facet param added (plus the same category/subcategory/designer scope).

Example verification:

```http
GET /api/products/facets
→ metals includes { "value": "White Gold", "count": 12 }

GET /api/products?metal=White%20Gold&page=1&pageSize=1
→ total must be 12
```

### Omit zero counts

Frontend hides empty sections. Prefer **omit** facet values with `count: 0` (mock does this for designers/availability).

### Sorting (recommended)

Return facet arrays sorted for UX:

- **Designers / metals / types:** `label` A→Z
- **Counts:** optional secondary sort descending

---

## 4. What the storefront UI shows today

Not every field in `ProductFilterFacets` is visible. Backend should still return accurate data for all fields (future-proofing).

| Facet | Shown in sidebar? | Notes |
|---|---|---|
| `priceRange` | Yes (slider + inputs) | Drives min/max on price filter |
| `designers` | **Only if** `AppConfiguration.showBrandFilter === true` | Label shown as **Brand** |
| `metals` | Yes | Frontend **hides** Platinum & Sterling Silver pills client-side only |
| `gemstones` | Yes (when non-empty) | |
| `diamondTypes` | Yes (when non-empty) | |
| `karats` | No (not wired yet) | Still return; UI may add later |
| `diamondShapes` | No (not wired yet) | Still return |
| `availability` | **Removed from UI** | Still returned by API; not displayed |

### Metal exclusions (frontend-only today)

These metals are filtered out in Angular before render:

- Platinum
- Sterling Silver

**Recommendation for backend:** Do not include them in `metals[]` at all, so counts stay consistent if we remove the client-side filter later.

### Brand toggle (config)

```json
{
  "showBrandFilter": true
}
```

When `false` or omitted, Brand pills are hidden and `designer` query params are cleared. See `BACKEND_CHANGE_REQUEST.md` §1.5 for persisting this on `GET/PUT /api/config`.

---

## 5. Live API snapshot (Render, 2026-08-24)

Current production response (abbreviated):

```json
{
  "metals": [
    { "value": "Platinum", "label": "Platinum", "count": 3 },
    { "value": "Rose Gold", "label": "Rose Gold", "count": 2 },
    { "value": "Sterling Silver", "label": "Sterling Silver", "count": 4 },
    { "value": "White Gold", "label": "White Gold", "count": 12 },
    { "value": "Yellow Gold", "label": "Yellow Gold", "count": 5 }
  ],
  "designers": [
    { "value": "heritage-collection", "label": "Heritage Collection", "count": 6 },
    { "value": "lincroft-atelier", "label": "Lincroft Atelier", "count": 12 },
    { "value": "lincroft-signature", "label": "Lincroft Signature", "count": 8 }
  ],
  "diamondTypes": [
    { "value": "Lab-Grown", "label": "Lab-Grown", "count": 14 },
    { "value": "Natural", "label": "Natural", "count": 8 }
  ],
  "priceRange": { "min": 180.00, "max": 11400.00 }
}
```

Total active products on storefront: **26** (`GET /api/products?pageSize=1` → `total: 26`).

Backend should confirm facet counts sum logically against that inventory (e.g. designer counts 6+12+8 = 26 ✓).

---

## 6. Frontend code references

| File | Role |
|---|---|
| `src/app/core/services/product.service.ts` | `facets()` → `GET {apiUrl}/products/facets` |
| `src/app/features/catalog/catalog.component.ts` | Loads facets on category/designer scope change |
| `src/app/shared/components/product-filters/product-filters.component.ts` | Renders pills; displays `item.count` |
| `src/app/core/models/api.model.ts` | `FacetValue` |
| `src/app/core/models/product.model.ts` | `ProductFilterFacets` |
| `src/app/core/mock/mock-api.handlers.ts` | Mock count logic (dev only) |

---

## 7. Backend checklist

- [ ] `GET /api/products/facets` returns all arrays + `priceRange`
- [ ] Counts include **active** products only
- [ ] Counts respect `category` / `subcategory` / `designer` query scope
- [ ] `designers[].value` is **slug**; `label` is display name
- [ ] Spec-based facets use the same `value` strings as `GET /api/products?metal=` / `?diamondType=` etc.
- [ ] For each facet row, `count === GET /products` total with that filter applied
- [ ] Omit rows with `count: 0`
- [ ] `priceRange.min` / `max` from real priced products in scope
- [ ] Persist `showBrandFilter` on config (see change request doc)
- [ ] Optional: exclude Platinum / Sterling Silver from `metals[]`

---

## 8. Quick verification script

Replace `{origin}` with `https://lincroftjewelers.onrender.com`:

```bash
# Facet counts
curl "{origin}/api/products/facets"

# Cross-check one metal count
curl "{origin}/api/products?metal=White%20Gold&page=1&pageSize=1"
# → "total" should match facets.metals where value = "White Gold"

# Cross-check one designer count
curl "{origin}/api/products?designer=lincroft-signature&page=1&pageSize=1"
# → "total" should be 8
```

---

## 9. Future enhancement (not required now)

If product counts should **update when other filters are selected** (e.g. show only metals available among Lab-Grown diamonds), the frontend would need to pass active filters to `GET /api/products/facets` and refetch on each change. Today it does **not** — document this if you implement dynamic/refining facets on the backend.
