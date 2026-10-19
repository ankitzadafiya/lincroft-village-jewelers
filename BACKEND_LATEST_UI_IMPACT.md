# Backend Impact — Latest Frontend Updates (2026-09-11)

**Repo:** Lincroft Village Jewelers (Angular storefront + admin)  
**Audience:** Backend / API team  
**Status:** **No new backend endpoints or contract changes required for the latest UI work.**

---

## 1. Verdict

| Area | Backend change needed? | Notes |
|------|------------------------|--------|
| Shop for occasions (home) | **No new API** | Uses existing catalog routes + `subcategory` query |
| Occasions card redesign | No | Pure UI |
| Account login / register password UX | No | Frontend-only (password no longer cleared on submit; eye toggle) |
| Admin login password UX | No | Same as above |
| Admin panel visual polish (forms, checkboxes, tables, dashboard styles) | No | CSS / Angular UI only |
| Leads status / tab styling | No | Same existing inquiry/inbox status APIs |

**Bottom line:** Deploy frontend as-is. Do **not** block release on new backend work for these items.

---

## 2. What the frontend changed (for context)

### 2.1 Home — Shop for occasions

- Heading: `Jewelry for every moment, every day`
- Four cards (was Bridal / Everyday / Gifting):

| Label | Route | Query |
|-------|-------|--------|
| Lab-Grown tennis bracelet | `/bracelet` | `subcategory=bracelet-lab-grown-diamond-tennis-bracelet` |
| Lab-Grown Diamond studs | `/earring` | `subcategory=earring-studs` |
| Lab-Grown Diamond Cross | `/pendant` | `subcategory=pendant-lab-grown-diamond-cross` |
| Lab-Grown Diamond Tennis Necklace | `/necklace` | `subcategory=necklace-lab-grown-diamond-tennis-necklace` |

These already match the storefront product list API:

```http
GET /api/products?category={slug}&subcategory={slug}&page=1&pageSize=...
```

No new parameters were added.

### 2.2 Auth UX (account + admin)

- Password field is **not** cleared on submit (fixes empty-looking password while loading).
- Sign-in / register buttons avoid native form `submit` so browsers do not wipe the password input.
- Show/hide password (eye icon) remains client-side only.

**Auth APIs unchanged:**

```http
POST /api/customer/login
POST /api/customer/register
POST /api/customer/login/google
POST /api/auth/login          (admin/staff — existing path)
```

Request bodies (`email`, `password`, etc.) are unchanged.

### 2.3 Admin UI

- Darker form labels, stronger checkboxes, darker table headers, dashboard presentation.
- No new admin routes, payloads, or permissions.

---

## 3. Optional backend verification (not blockers for UI)

If occasions cards open empty catalogs, verify these **existing** subcategory slugs exist, are `active`, and have products assigned. This was already specified in `BACKEND_STOREFRONT_HANDOFF.md` §5 — not a new requirement.

### 3.1 Required subcategory slugs (for occasions deep links)

| Category slug | Subcategory slug | Expected display name |
|---------------|------------------|------------------------|
| `bracelet` | `bracelet-lab-grown-diamond-tennis-bracelet` | Lab-Grown Diamond Tennis Bracelet |
| `earring` | `earring-studs` | Studs |
| `pendant` | `pendant-lab-grown-diamond-cross` | Lab-Grown Diamond Cross Pendant |
| `necklace` | `necklace-lab-grown-diamond-tennis-necklace` | Lab-Grown Diamond Tennis Necklace |

### 3.2 Smoke checks

```bash
ORIGIN="https://lincroftjewelers.onrender.com"

# Categories / children present
curl -s "$ORIGIN/api/categories" | jq '.[].slug, .[].children[]?.slug'

# Each occasions deep link returns products (total > 0 ideally)
curl -s "$ORIGIN/api/products?category=bracelet&subcategory=bracelet-lab-grown-diamond-tennis-bracelet&pageSize=1"
curl -s "$ORIGIN/api/products?category=earring&subcategory=earring-studs&pageSize=1"
curl -s "$ORIGIN/api/products?category=pendant&subcategory=pendant-lab-grown-diamond-cross&pageSize=1"
curl -s "$ORIGIN/api/products?category=necklace&subcategory=necklace-lab-grown-diamond-tennis-necklace&pageSize=1"
```

**Pass criteria:**

- HTTP 200
- JSON list shape unchanged (`items`, `total`, …)
- `subcategory` filter scopes results correctly
- Cross pendant subcategory exists (historically missing on some environments)

If a slug is missing: **create/reorder via admin categories API** — same process as §5 of the storefront handoff. No new endpoint.

---

## 4. Still open from earlier handoffs (unchanged by this UI work)

These are **not** introduced by the latest UI pass. Track them in existing docs if still incomplete:

| Item | Doc | Status expectation |
|------|-----|--------------------|
| Facet counts scoped to `category` / `subcategory` | `BACKEND_PRODUCT_FACETS.md`, `BACKEND_STOREFRONT_HANDOFF.md` §3 | Frontend has a client-side recount fallback; backend scoping still preferred |
| Earring / Pendant subcategory order + Cross pendant | `BACKEND_STOREFRONT_HANDOFF.md` §5 | Data/config, not new API |
| `brandName` / filters / dark mode config | `BACKEND_STOREFRONT_HANDOFF.md` | As previously agreed |

Do **not** reopen settled contracts in `BACKEND_CHANGE_REQUEST.md` §0 unless product asks.

---

## 5. What backend should **not** do for this release

- Do not add “occasions” API or CMS block — home cards are static frontend config.
- Do not change login/register password rules for this UX fix.
- Do not change inquiry status enum (`new` | `reviewed` | `closed`) for Leads UI styling.
- Do not require new CORS, auth headers, or media URL rules for these UI updates.

---

## 6. Sign-off checklist (backend)

- [ ] Confirmed: no deploy of new API code required for latest FE UI
- [ ] Optional: occasions subcategory slugs exist and return products (§3)
- [ ] Optional: Cross pendant subcategory present in production
- [ ] Existing open tickets (facets / category order) remain on their own schedule

---

## 7. Related documents

| File | Use |
|------|-----|
| `BACKEND_STOREFRONT_HANDOFF.md` | Categories, facets, brand, config |
| `BACKEND_PRODUCT_FACETS.md` | Facet count contract |
| `BACKEND_API.md` | Endpoint reference |
| `BACKEND_ADMIN_USERS_PERMISSIONS.md` | Staff permissions |
| `BACKEND_GOOGLE_ADMIN_USERS.md` | Google auth for admin users |

---

**Author note:** Generated from the latest frontend session (occasions section, auth password UX, admin visual polish). If product later wants CMS-managed occasion cards or dynamic lead badges, that would be a **new** ticket — out of scope here.
