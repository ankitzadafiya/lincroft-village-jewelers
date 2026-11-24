# Backend Impact — "Select Your Diamond" Feature (2026-11-24)

**Repo:** Lincroft Village Jewelers (Angular storefront + admin)
**Audience:** Backend / API team
**Status:** **Works today with zero backend changes.** Everything below is about making the admin side show the new data *properly* instead of just as a generic line item.

---

## 1. Verdict

| Area | Backend change needed? | Notes |
|------|------------------------|-------|
| Customer can select a diamond shape/carat/clarity/color and submit a request | **No** | Reuses the existing `POST /api/inquiries` endpoint and `InquiryItem` shape — see §3 |
| Admin sees *which exact diamond* was requested | **No, but recommended** | The full spec is already in `item.name` as readable text, so it is visible today. Persisting the new optional fields (§3) lets admin show/filter it as structured data instead of a sentence. |
| Admin "Diamond" badge on the inquiry card | **Needs `kind` persisted** | If the backend drops unknown JSON fields on save, the new highlight styling in admin silently falls back to a plain chip — not broken, just less distinct. |

**Bottom line:** Ship frontend as-is. Persisting the new fields is a nice-to-have, not a blocker.

---

## 2. What changed on the frontend (for context)

A new homepage section, **"Select your diamond"**, sits between the "We're Here To Help" and "Custom Jewelry Design" sections. It shows the 10 standard diamond shapes, in this order:

```
Round, Oval, Marquise, Radiant, Emerald, Cushion, Pear, Princess, Heart, Asscher
```

Clicking a shape opens a full-screen modal where the customer:

1. Picks a carat weight: `1.00, 1.50, 2.00, 2.50, 3.00, 3.50, 4.00` ct.
2. Picks any number of clarity × color combinations for that carat — clarity is one of `VVS1, VVS2, VS1`, color is one of `D, E, F` (9 combinations per carat, generated client-side, not hand-authored).
3. Can switch to another shape via a sticky "Explore other shapes" strip at the bottom of the modal — earlier selections are **not** cleared when switching shapes, so a customer can build a multi-shape, multi-carat selection in one session.
4. Each checked combination is added as a line item to the **existing inquiry bag** (`InquiryService`, same mechanism as "add this product to my inquiry"). A sticky bar in the modal shows a running count and lets the customer remove a selection before submitting.
5. "Review & send request" routes to the existing `/inquiry` page, which already has the name/email/phone/message form and submit button — unchanged.

No new page, no new form, no new submit flow. Diamond selections are just a new *kind* of item inside the inquiry bag that already exists.

---

## 3. The only contract change: `InquiryItem` has new optional fields

The frontend model (`InquiryItem`, used in both `InquiryRequest` and `InquiryRecord`) gained these fields. **All of them are optional** — any `InquiryItem` without them (i.e. every existing product inquiry) is unaffected.

```ts
export type InquiryItemKind = 'product' | 'diamond'; // defaults to 'product' when absent

export interface InquiryItem {
  kind?: InquiryItemKind;        // NEW
  productId?: string;
  sku: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  diamondShape?: string;         // NEW — "Round", "Oval", ...
  diamondCarat?: number;         // NEW — 1, 1.5, 2, 2.5, 3, 3.5, 4
  diamondClarity?: string;       // NEW — "VVS1" | "VVS2" | "VS1"
  diamondColor?: string;         // NEW — "D" | "E" | "F"
}
```

### Example payload for a diamond selection

Sent exactly like a normal `POST /api/inquiries`, just with one (or more) items shaped like this mixed in among any product items:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 0100",
  "message": "I would like information about: ...",
  "items": [
    {
      "kind": "diamond",
      "sku": "DIAMOND-ROUND-1.5-VVS1-D",
      "slug": "diamond-selection",
      "name": "Round Cut Diamond — 1.50 ct, VVS1, D",
      "imageUrl": "https://lincrofvillagejewelers.com/images/diamond-shapes/round-icon.jpg",
      "quantity": 1,
      "diamondShape": "Round",
      "diamondCarat": 1.5,
      "diamondClarity": "VVS1",
      "diamondColor": "D"
    }
  ],
  "source": "cart"
}
```

Notes on the values above, since they're synthetic (not real catalog records):

- **`sku`** is a deterministic string built as `DIAMOND-{SHAPE}-{CARAT}-{CLARITY}-{COLOR}` (uppercased shape). It's used client-side as the de-duplication/removal key for a selection — it is **not** a real product SKU and won't match anything in the product catalog. Please don't validate it against the products table.
- **`slug`** is always the literal string `"diamond-selection"` — it is **not** a routable product slug. Don't link to `/product/diamond-selection` anywhere; there is no such product.
- **`productId`** is omitted entirely for diamond items (no catalog product backs it).
- **`name`** is always a complete, human-readable sentence of the spec (shape, carat, clarity, color), so even if nothing else below is implemented, admin staff can read exactly what was requested.
- **`imageUrl`** points at one of the 10 static shape thumbnails already deployed at `/images/diamond-shapes/{shape}-icon.jpg` (e.g. `round-icon.jpg`, `oval-icon.jpg`, …), not an uploaded asset.

---

## 4. Recommended backend changes (optional, for a proper admin experience)

1. **Persist the new fields as-is** on whatever table/collection stores `InquiryItem` rows (add nullable columns: `kind`, `diamond_shape`, `diamond_carat`, `diamond_clarity`, `diamond_color`). If the current storage is schema-flexible (e.g. a JSON column, a document store), this may already work with no changes at all — worth checking before adding columns.
2. **Return them unchanged** in `GET /api/admin/inquiries` (`InquiryRecord[]`) so the admin item list round-trips `kind` and the `diamond*` fields.
3. That's it — no new endpoints, no new statuses, no new permissions. `POST /api/inquiries` and `GET /api/admin/inquiries` keep their existing routes and auth (documented in `BACKEND_API.md` §6.6 and §7.9).

If step 1–2 aren't done, the feature still fully works end-to-end (customer selects, submits, admin sees a readable line item) — admin just won't get the "Diamond" highlight badge or be able to query/report on diamond requests as structured data later.

---

## 5. Reference: existing endpoints used (unchanged)

```http
POST /api/inquiries              (public)   — unchanged route, extended item shape (backward compatible)
GET  /api/admin/inquiries        (admin)    — unchanged route, extended item shape (backward compatible)
PATCH /api/admin/inquiries/{id}/status (admin) — unchanged
```

See `BACKEND_API.md` §6.6 and §7.9 for the full existing contract these fit into.
