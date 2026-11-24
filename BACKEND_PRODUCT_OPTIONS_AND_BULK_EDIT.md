# Backend Changes — Product Options, Color Photos, Rich Description, Inquiry Choices, Excel Columns & Bulk Edit (2026-11-25)

**Repo:** Lincroft Village Jewelers (Angular storefront + admin)
**Audience:** Backend / API team
**Status:** Frontend is finished and builds. It reads every new field as **optional**, so the live site keeps working before the backend ships. The new features only fully work once the items below are in place.

> Related, already shipped docs: `BACKEND_API.md` (base contract), `BACKEND_DIAMOND_SELECTION.md` (diamond inquiry items). This document only covers what is **new**.

---

## 0. Summary — what you need to build

| # | Area | Endpoint(s) | Priority | What breaks without it |
|---|------|-------------|----------|------------------------|
| 1 | Product `options` object (metal colors, karat prices, ring sizes, customization) | `GET /api/products/{slug}`, `GET/POST/PUT /api/admin/products…` | **Must** | Admin saves are silently lost; no color / karat pickers on the site |
| 2 | `metalColor` on each product image | same as above | **Must** | Photos don't switch when a customer picks Yellow / White / Rose gold |
| 3 | Store description exactly as typed (new lines + emoji) | same as above | **Must** | Description sections collapse into one paragraph |
| 4 | New optional fields on inquiry items | `POST /api/inquiries`, `GET /api/admin/inquiries` | **Must** | Admin can't see which color / karat / size / custom request the customer chose |
| 5 | New Excel import columns | `POST /api/admin/import/validate`, `/confirm` | **Must** | Bulk upload of the client's spreadsheet ignores options and color photos |
| 6 | Bulk edit | **new** `POST /api/admin/products/bulk-update` | **Must** | "Bulk edit" button in admin shows an error |
| 7 | Optional extras (filters, audit log) | — | Nice to have | Nothing |

Everything is backwards compatible: products without `options` behave exactly like today.

---

## 1. What changed on the site (context)

On the product page the customer now sees, under the price (like Etsy / Elise Jewelry):

1. **Metal color**: round swatches for *Yellow Gold / White Gold / Rose Gold*. Picking one **swaps the gallery** to photos of that color.
2. **Metal type**: buttons `10K / 14K / 18K`. Each karat has **its own price**; the price, the strike-through "was" price and "Save %" update instantly.
3. **Size**: `4, 4.5, 5 … 11` plus "Not sure". Shown automatically for products in the **Ring** category.
4. **Customize**: a "Customize this item" checkbox that opens a text box (max 500 chars).
5. **Product details** (below the fold): the description is shown **once**, split into cards (Diamond details, Center stone, Side diamonds, Certification, Custom jewelry, Packaging & shipping, Note). Specs that the description already lists are not repeated.

"Inquire about this piece" adds the product **with the chosen options** to the inquiry bag. The same ring in two colors is two separate lines.

In admin:
- The product form has a new **Customer options** block (colors, karat price table, ring size mode, customization on/off).
- Media has **four photo uploaders**: *Photos for every color*, *Yellow Gold photos*, *White Gold photos*, *Rose Gold photos*.
- The description box has a **live preview**.
- The product list has **checkboxes + Bulk edit** (Shopify-style price changes, compare-at %, show price, status, availability).

---

## 2. Product model changes

### 2.1 New enums

```ts
MetalColor = 'yellow' | 'white' | 'rose'     // lower-case, exactly these values
Karat      = '10K' | '14K' | '18K'           // upper-case K, exactly these values
```

### 2.2 `ProductMedia.metalColor` (new, optional)

```jsonc
{
  "id": "m_123",
  "url": "https://…/ring-rose-1.jpg",
  "thumbnailUrl": "https://…/ring-rose-1-480.jpg",
  "alt": "Ring in rose gold",
  "sortOrder": 2,
  "type": "image",
  "isPrimary": false,
  "metalColor": "rose"          // NEW: "yellow" | "white" | "rose" | null
}
```

- `null` / missing = a **shared** photo shown with every color (e.g. on-hand shot).
- Only images use it; videos may ignore it (send `null`).
- Must be accepted on write (`ProductMediaWrite.metalColor`) and returned on read.

**How the storefront uses it:** gallery = photos tagged with the selected color + shared photos. If the selected color has no photos, it falls back to shared photos, then to all photos.

### 2.3 `Product.options` (new, optional object)

```jsonc
"options": {
  "metalColors": ["yellow", "white", "rose"],   // colors offered, display order is fixed Y/W/R on the site
  "defaultMetalColor": "rose",                    // or null → first offered
  "karatPrices": [                                // karats offered + their prices
    { "karat": "10K", "price": 540.00,  "compareAtPrice": null },
    { "karat": "14K", "price": 637.50,  "compareAtPrice": 850.00 },
    { "karat": "18K", "price": 790.00,  "compareAtPrice": null }
  ],
  "defaultKarat": "14K",                          // or null → first in karatPrices
  "showRingSizes": null,                          // true = show, false = hide, null = automatic (Ring category)
  "ringSizes": ["4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11"],
  "allowCustomization": true                      // default true
}
```

| Field | Type | Default when missing | Validation |
|-------|------|----------------------|------------|
| `metalColors` | `MetalColor[]` | `[]` → no color picker | unique values from the enum |
| `defaultMetalColor` | `MetalColor \| null` | first of `metalColors` | must be in `metalColors`, else store `null` |
| `karatPrices` | `{karat, price, compareAtPrice?}[]` | `[]` → no karat picker | unique `karat`; `price` ≥ 0 and **required** for every listed karat; `compareAtPrice` ≥ 0 or null |
| `defaultKarat` | `Karat \| null` | first of `karatPrices` | must be in `karatPrices`, else `null` |
| `showRingSizes` | `bool \| null` | `null` (automatic) | — |
| `ringSizes` | `string[]` | the 4–11 half-size list | strings, keep order, max ~40 entries |
| `allowCustomization` | `bool` | `true` | — |

> Note: storing `options` as a **JSON column** on the product row is simplest; a `ProductKaratPrice` child table is also fine. Either way, the API shape must be exactly as above.

### 2.4 Price consistency rule (important)

When `karatPrices` is not empty, **`product.price` must equal the default karat's price** (and `product.compareAtPrice` the default karat's `compareAtPrice` when it has one). Product cards, sorting, price filters and JSON-LD all use `product.price`.

- The admin form already sends it this way.
- The Excel import and bulk edit must keep it in sync (see §5 and §6).
- Please also enforce it server-side on `POST/PUT /api/admin/products`, so `price` can never drift from the default karat.

### 2.5 Endpoints affected

| Endpoint | Change |
|----------|--------|
| `GET /api/products/{slug}` | return `options` and `images[].metalColor` |
| `GET /api/admin/products` (list) | return `options` too (the list shows a "10K–18K: $540 – $790" line) |
| `GET /api/admin/products/{id}` | return `options` and `images[].metalColor` |
| `POST /api/admin/products`, `PUT /api/admin/products/{id}` | accept `options` and `images[].metalColor`, validate (§2.3), enforce §2.4 |
| `GET /api/products` (storefront list / `ProductListItem`) | **no change**; `price` already holds the default karat price |

Example write payload (only new parts shown):

```jsonc
PUT /api/admin/products/p_42
{
  "sku": "LVJ-RNG-9999",
  "name": "0.10 CT Round Lab Grown Diamond Cluster Ring",
  "price": 637.50,                 // = default karat price
  "compareAtPrice": 850.00,
  "images": [
    { "url": "https://…/on-hand.jpg",    "sortOrder": 0, "isPrimary": true,  "metalColor": null },
    { "url": "https://…/yellow-1.jpg",   "sortOrder": 1, "isPrimary": false, "metalColor": "yellow" },
    { "url": "https://…/white-1.jpg",    "sortOrder": 2, "isPrimary": false, "metalColor": "white" },
    { "url": "https://…/rose-1.jpg",     "sortOrder": 3, "isPrimary": false, "metalColor": "rose" }
  ],
  "options": { /* as in §2.3 */ }
  // …all existing fields unchanged
}
```

Error messages the admin shows as-is (`400`, `{ "message": "…" }`):
- `"Enter a price for 18K, or untick it."`
- `"Default karat must be one of the offered karats."` (or silently correct it, the frontend handles both)
- `"metalColor must be yellow, white or rose."`

---

## 3. Description: store it exactly as typed

The client writes long descriptions (in admin or Excel) like this:

```
Crafted in 14K solid gold, this vintage-inspired ring is perfect for …

💎 DIAMOND DETAILS:
* Diamond Type: Lab Grown Diamond
* Shape: Round Cut
* Carat Weight: 0.10 TCW Approx.

CENTER STONE DETAILS
Diamond Type: Lab Grown Diamond
Carat Weight: Approximately 2.25 CT

📦 PACKAGING & SHIPPING
* Comes in a premium jewelry gift box ready for gifting.
```

The **frontend** turns this into sections (CAPITALS line = section title, `Label: value` = table row, `* text` = bullet). The backend only has to:

- **Keep line breaks** (`\n`, and `\r\n` → fine either way) and **emoji** (store as UTF-8 / `nvarchar`, not `varchar`).
- **Not** trim inner lines, strip `*`, convert to HTML or collapse whitespace.
- Allow at least **10,000 characters** (`nvarchar(max)` recommended).
- From Excel: cells keep Alt+Enter line breaks, so pass the cell text through unchanged.
- Search (`q`) may keep matching on description; no change needed.

---

## 4. Inquiry items: customer's choices

`InquiryItem` gets five new **optional** fields (product items only):

```jsonc
POST /api/inquiries
{
  "name": "Jane", "email": "jane@x.com", "phone": "…", "message": "…",
  "source": "cart",
  "items": [
    {
      "productId": "p_42",
      "sku": "LVJ-RNG-9999",
      "slug": "cluster-ring",
      "name": "0.10 CT Round Lab Grown Diamond Cluster Ring",
      "imageUrl": "https://…/rose-1-480.jpg",   // photo of the chosen color
      "quantity": 1,
      "metalColor": "rose",                      // NEW
      "karat": "18K",                            // NEW
      "ringSize": "6.5",                         // NEW: may also be "Not sure"
      "customization": "Engrave 'J & M 2026' inside the band",   // NEW, max 500 chars
      "unitPrice": 790.00                        // NEW: price shown when added; null if price hidden
    }
  ]
}
```

- **Persist** all five and **return** them in `GET /api/admin/inquiries` (admin shows "Rose Gold · 18K · Size 6.5" + the customization text).
- The **same `productId` can appear more than once** with different options. Do **not** merge or de-duplicate lines by `productId`/`sku`.
- `unitPrice` is informational (what the customer saw). Don't use it for billing.
- If you send inquiry notification emails, please include these fields per line.
- Validation: `customization` ≤ 500 chars; other fields free strings ≤ 50 chars. Unknown values are not an error.

---

## 5. Excel import: new columns

The browser parses the sheet and sends rows as JSON (unchanged flow). The frontend **mapping** now includes these extra fields; they arrive in `rows[].data` / `rows[]` under the **field** name:

| Excel header | Field key | Example | Rule |
|--------------|-----------|---------|------|
| Compare At Price | `compareAtPrice` | `850` | number or empty |
| Metal Colors | `metalColors` | `Yellow, White, Rose` | comma / slash / new-line separated; accept `Yellow`, `Yellow Gold`, any case → `yellow` |
| Default Metal Color | `defaultMetalColor` | `Rose` | same parsing; must be offered, else first offered |
| Price 10K | `price10k` | `540` | number or empty; empty = 10K not offered |
| Price 14K | `price14k` | `637.50` | ″ |
| Price 18K | `price18k` | `790` | ″ |
| Default Karat | `defaultKarat` | `14K` | `10K`/`14K`/`18K` (case/space-insensitive); must have a price, else first priced karat |
| Ring Sizes | `ringSizes` | empty / `5, 5.5, 6` / `none` | empty → `showRingSizes: null` (automatic); list → `showRingSizes: true` + that list; `none`/`no`/`off` → `showRingSizes: false` |
| Allow Customization | `allowCustomization` | `yes` | `no`/`false`/`0` → false; anything else or empty → true |
| Yellow Gold Images | `imagesYellow` | URLs | one per line (Alt+Enter) **or** comma separated |
| White Gold Images | `imagesWhite` | URLs | ″ |
| Rose Gold Images | `imagesRose` | URLs | ″ |

Existing `Image 1 … Image 12` columns stay and become **shared** photos (`metalColor: null`).

**On confirm (per row):**
1. Prices: if any `Price 10K/14K/18K` is filled → build `karatPrices`, set `price` = default karat price (§2.4). Otherwise use `Price` as today.
2. Colors: `metalColors` = parsed `Metal Colors` **plus** any color that has photo URLs in its column (so a forgotten "Metal Colors" cell still works).
3. Photos: download every URL as today (Drive/Dropbox normalisation, `BACKEND_API.md` §6) and create `ProductMedia` with:
   - shared images first (`metalColor: null`), then yellow, white, rose;
   - `sortOrder` = running index, `isPrimary` = first image.
4. A failed photo download is a **row warning**, not a failed product.
5. Upsert by SKU as today. On update, replacing the color photo set is fine.

**Validation messages** (shown in the preview table, row stays invalid):
- `"Price 14K must be a number."` (same for Price, Compare At Price, Price 10K, Price 18K; strip `$` and `,` first)
- `"Metal Colors must be Yellow, White and/or Rose."`
- `"Default Karat must be 10K, 14K or 18K."`

The reference implementation is in `src/app/core/mock/mock-api.handlers.ts` → `priceAndOptionsFromRow()`, `imagesFromRow()`, `parseColors()`, `parseUrls()`. Please match it.

The downloadable template (frontend) now has these columns, the client's description as the sample row, and a second sheet **"How to fill"** explaining every column, so nothing to do on the backend for the template.

---

## 6. Bulk edit (new endpoint)

Admin → Products → tick products (or none) → **Bulk edit**. One endpoint does both the live preview (`dryRun: true`) and the real update (`dryRun: false`).

### 6.1 Request

```
POST /api/admin/products/bulk-update      (Admin auth, same as other /admin routes)
```

```jsonc
{
  "scope": { "type": "ids", "ids": ["p_1", "p_7"] },
  //   or  { "type": "filter", "filter": { "q": "tennis" } }   // same filters as GET /admin/products
  //   or  { "type": "all" }                                     // all products EXCEPT archived
  "changes": {
    "price": {
      "mode": "increase_percent",     // none | increase_amount | decrease_amount | set_amount | increase_percent | decrease_percent
      "value": 5,                     // dollars for *_amount, percent for *_percent (5 = 5%)
      "roundWhole": true,             // round results to whole dollars (else to cents)
      "karats": ["10K", "14K", "18K"] // which karat prices to change (see rules)
    },
    "compareAt": {
      "mode": "percent_above",        // none | percent_above | remove
      "percent": 20                   // compare-at = new price × 1.20
    },
    "showPrice": null,                // true | false | null (= no change)
    "status": null,                   // "active" | "inactive" | null
    "availability": null              // "in_stock" | "made_to_order" | "sold" | null
  },
  "dryRun": true
}
```

The UI calls it with `dryRun: true` about 0.4 s after each setting change, so please keep the dry run fast (one query + in-memory maths; no writes).

### 6.2 Response (same shape for dry run and real run)

```jsonc
{
  "matched": 48,            // products in scope
  "updated": 45,            // products that change (would change, on dry run)
  "unchanged": 3,           // in scope but nothing to change
  "dryRun": true,
  "preview": [              // first 200 products in scope (any stable order, e.g. name)
    {
      "id": "p_42",
      "sku": "LVJ-RNG-9999",
      "name": "Cluster Ring",
      "changed": true,
      "skippedReason": null, // e.g. "No price (price upon request)" or "None of the chosen karats are offered"
      "lines": [
        { "target": "10K", "before": 540,   "after": 567, "compareBefore": null, "compareAfter": 680 },
        { "target": "14K", "before": 637.5, "after": 669, "compareBefore": 850,  "compareAfter": 803 },
        { "target": "18K", "before": 790,   "after": 830, "compareBefore": null, "compareAfter": 996 }
      ],
      "otherChanges": ["Show price: Yes → No"]   // human-readable, shown as-is
    },
    {
      "id": "p_9", "sku": "LVJ-NK-4580", "name": "Tennis Necklace", "changed": true,
      "lines": [ { "target": "main", "before": 1000, "after": 1050, "compareBefore": null, "compareAfter": 1260 } ],
      "otherChanges": []
    }
  ]
}
```

Errors: `400 { "message": "…" }` for invalid input (e.g. negative value, decrease ≥ 100%, empty `ids`), shown as a toast.

### 6.3 Calculation rules (must match exactly)

Reference implementation: **`src/app/core/utils/bulk-price.ts` → `applyBulkChanges()`**. The mock API uses it, so the admin preview you see in mock mode is the expected result.

1. **Price modes** (`p` = current price, `v` = value):
   - `increase_amount` → `p + v`
   - `decrease_amount` → `p − v`
   - `set_amount` → `v`
   - `increase_percent` → `p × (1 + v/100)`
   - `decrease_percent` → `p × (1 − v/100)`
2. **Floor and rounding:** never below `0`. With `roundWhole` → `Math.round` to whole dollars, otherwise round to cents (2 decimals, half away from zero).
3. **Price upon request** (`price` is `null`): never given a price. The row is unchanged and gets `skippedReason: "No price (price upon request)"`.
4. **Products with `options.karatPrices`:**
   - only karats listed in `changes.price.karats` change; others are untouched;
   - then `product.price` is re-synced to the **default karat's** new price (§2.4);
   - if the default karat was targeted and compare-at changed, `product.compareAtPrice` = default karat's new `compareAtPrice`.
5. **Products without karat prices:** `product.price` changes (the `karats` list is ignored).
6. **Compare-at** applies to the **same lines** as rules 4/5, **even when price mode is `none`**:
   - `percent_above` → `compareAtPrice = round(newPrice × (1 + percent/100))` (same rounding as rule 2)
   - `remove` → `null`
7. **showPrice / status / availability:** set when not `null`; each real difference adds an `otherChanges` text.
8. `changed` = any price / compare-at / other field actually differs. `updated` counts `changed` rows only.
9. `scope.type = "all"` **excludes archived** products. `filter` uses the same filter logic as `GET /api/admin/products`.

Worked examples (verified against the reference code):

| Product | Change | Result |
|---------|--------|--------|
| Plain, $1,000 | +5 %, round | $1,050 |
| Karat 10K $540 / 14K $637.50 / 18K $790, default 14K | +5 %, round, all karats | $567 / $669 / $830 → main price $669 |
| Same | −$50, only 18K | 18K $740; 10K & 14K unchanged; main stays $637.50 |
| Plain, $1,000 | price none, compare 20 % above | compare-at $1,200 |
| Price upon request | +5 % | skipped |

### 6.4 Real run (`dryRun: false`)

- Apply all changes in **one transaction** (all or nothing).
- Update `updatedAt` on changed products only.
- Return the same response shape (`dryRun: false`).
- Recommended: write an **audit row** per run (admin user, timestamp, request JSON, `updated` count), because a bulk price change cannot be undone from the UI. A later "undo last bulk edit" could use it.
- Performance target: ~2,000 products in < 3 s.

---

## 7. Nice to have (not required now)

- **Filters:** let the storefront `metal` facet also match `options.metalColors` (e.g. a product offered in rose gold shows under "Rose Gold").
- **Price filter / sort** keeps using `product.price` (= default karat price). Nothing else is needed.
- **Inquiry email template:** show the options line + customization per item (see §4).

---

## 8. Test checklist

**Product options**
- [ ] `PUT` with `options` + `images[].metalColor` → `GET` returns them unchanged.
- [ ] Product without `options` → `GET` returns `options: null` (or omits it); the site renders as before.
- [ ] Karat price missing for a listed karat → 400 with a clear message.
- [ ] `price` ends up equal to the default karat price even if the request sent something else.
- [ ] Description with emoji + blank lines round-trips byte-for-byte.

**Inquiries**
- [ ] Two lines with the same `productId` but different `metalColor` are both stored and returned.
- [ ] `customization` of 500 chars saves; 501 → 400.

**Excel**
- [ ] Template sample row imports with 3 karat prices, 3 colors, default 14K, main price = 14K price.
- [ ] `Ring Sizes = none` → `showRingSizes: false`; empty → `null`; `5, 6` → `true` + `["5","6"]`.
- [ ] URLs in "Rose Gold Images" (Alt+Enter separated) → images with `metalColor: "rose"`.
- [ ] `Price 14K = abc` → row invalid with "Price 14K must be a number."

**Bulk edit**
- [ ] Each row of the table in §6.3 gives exactly the shown result.
- [ ] `dryRun: true` writes nothing.
- [ ] `scope: all` skips archived products.
- [ ] A failure mid-way rolls back everything.

---

## 9. Frontend files touched (for reference)

| File | Purpose |
|------|---------|
| `src/app/core/models/product.model.ts` | `MetalColor`, `Karat`, `KaratPrice`, `ProductOptions`, `ProductMedia.metalColor`, `DEFAULT_RING_SIZES` |
| `src/app/core/models/inquiry.model.ts` | new `InquiryItem` fields |
| `src/app/core/models/bulk-edit.model.ts` | bulk edit request/response types |
| `src/app/core/utils/bulk-price.ts` | **reference bulk edit calculation** |
| `src/app/core/mock/mock-api.handlers.ts` | **reference Excel parsing** + mock bulk endpoint |
| `src/app/core/mock/mock-data.ts` | Excel column mapping (`DEFAULT_IMPORT_MAPPING`) + demo product "Star Pattern Diamond Ring" with options |
| `src/app/core/services/import.service.ts` | template download + "How to fill" sheet |
| `src/app/features/product/*` | product page pickers, gallery by color, single description |
| `src/app/shared/components/product-description/*` | description parser + renderer |
| `src/app/features/admin/products/product-form/*` | options block, color photo uploaders, description preview |
| `src/app/features/admin/products/bulk-edit/*` | bulk edit dialog |
| `src/app/features/admin/products/product-list/*` | row checkboxes, selection bar, bulk edit button |
| `src/app/features/inquiry/*`, `src/app/features/admin/inquiries/*` | show chosen options per line |

**Try it without a backend:** set `ACTIVE_BACKEND = 'mock'` in `src/environments/api-backend.ts`, open *Star Pattern Diamond Ring* on the site, and use Admin → Products → Bulk edit. Set it back to `'production'` afterwards.
