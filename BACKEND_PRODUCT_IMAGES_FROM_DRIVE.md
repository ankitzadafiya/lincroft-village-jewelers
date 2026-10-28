# Product and category images from the Drive renders

**For:** backend developer
**Date:** 29 October 2026
**Status:** the frontend no longer overrides any product or category photo. Everything the storefront shows now comes from the API. This file says which Drive render goes where, so the backend can load them.

---

## 1. Summary

| What | Action |
|---|---|
| 8 products | Load the renders listed in section 4 (main photo + hover photo) |
| 4 categories | Set `imageUrl` from the renders in section 5 |
| Earrings, necklaces | No renders exist in Drive yet. Keep current photos until real ones arrive |
| All other products | Optional: pick renders using the rules in section 3 |

No frontend change is needed after the upload. Cards, product pages, category tiles and search update by themselves.

---

## 2. Where the files are

**Drive folder:** RENDERING
https://drive.google.com/drive/folders/1Lo9lieegDezTXYxRutdSppqoFHOxixt-

The folder is restricted. It has been shared with you directly; open it while signed in with that account.

Structure:

```
RENDERING/
  28-09-2026/  29-09-2026/  30-09-2026/  01-10-2026/ ... 21-10-2026/   (date folders)
    LR10914AF/                      (one folder per design code)
      LR10914AF-R (1).jpeg ... (6)  (R = rose gold)
      LR10914AF-W (1).jpeg ... (6)  (W = white gold)
      LR10914AF-Y (1).jpeg ... (6)  (Y = yellow gold)
      LR10914AF-R.mp4 / -W.mp4 / -Y.mp4   (turntable videos)
```

Design code prefixes: **LR** = ring, **PD** = pendant, **BR** = bracelet. There are no earring or necklace codes in this folder.

All stills are **2160 × 2160 JPEG on a pure white background**.

---

## 3. Rules for choosing photos

### Which angle is which

| Type | Main photo (card + first in gallery) | Hover photo | Other angles |
|---|---|---|---|
| Rings (LR) | **(6)** three-quarter side view | **(1)** front | (2) back, (3) low side, (4) upright profile, (5) edge |
| Pendants (PD) | **(2)** three-quarter side | **(1)** front | (3)–(5) other angles |
| Bracelets (BR) | **(2)** angled | **(1)** flat front | (3) vertical edge, (4) flat edge, (5) top-down circle |

A few ring folders number their angles differently. Check (4)–(6) and use whichever is the angled side view as the main photo.

### How to store them

Follow the image contract already agreed in `BACKEND_FINAL_HANDOFF.md`:

- `primaryImage` = image with `isPrimary = true` (the **main photo** above), `sortOrder 0`.
- `hoverImage` = next image by `sortOrder` (the **hover photo** above), `sortOrder 1`.
- Remaining angles may follow as gallery images, `sortOrder 2+`.
- Use **one metal per product** (R, W or Y). Do not mix metals in one gallery unless the product is sold in several metals and the page explains it.
- `alt` text: product name plus metal, for example `Aurelia Solitaire Engagement Ring in white gold`.
- Recommended upload: resize to **1600 × 1600**, WebP or high quality JPEG (about 100–200 KB each). Keep the white background; do not crop.
- `thumbnailUrl`: about 600 × 600 of the same image.
- The `.mp4` turntables can go into `videos[]` later; the gallery already supports video.

---

## 4. Products to update (8)

These are the products that showed Drive renders in the client demo. Please load exactly these files.

| SKU | Product (slug) | Drive folder | Main photo (`sortOrder 0`) | Hover photo (`sortOrder 1`) |
|---|---|---|---|---|
| LVJ-RNG-001 | Aurelia Solitaire Engagement Ring (`aurelia-solitaire-engagement-ring`) | [LR10914AF](https://drive.google.com/drive/folders/1y3TyWcOWPyz8ertQnJr0q3e2_zLunNOn) (08-10-2026) | `LR10914AF-W (6).jpeg` | `LR10914AF-W (1).jpeg` |
| LVJ-RNG-004 | Corinne Eternity Band (`corinne-eternity-band`) | [LR10943AF](https://drive.google.com/drive/folders/1-JykHhYxHFCONWHwHep4jgwn52EvKTnh) (08-10-2026) | `LR10943AF-W (6).jpeg` | `LR10943AF-W (1).jpeg` |
| LVJ-SLV-001 | Gilded Vine Ring (`gilded-vine-ring`) | [LR10930AF](https://drive.google.com/drive/folders/14Y4Tdqi70y4pQ_gONB5hElBh9jbvrhZ-) (09-10-2026) | `LR10930AF-Y (6).jpeg` | `LR10930AF-Y (1).jpeg` |
| LVJ-BRC-001 | Riviera Tennis Bracelet (`riviera-tennis-bracelet`) | [BR9366AF V.30](https://drive.google.com/drive/folders/1x2DCNm5Sa-PxpHvvgETMfzze-9v1oRNJ) (30-09-2026) | `BR9366AF V.30-W (2).jpeg` | `BR9366AF V.30-W (1).jpeg` |
| LVJ-SLV-003 | Gilded Cuff Bracelet (`gilded-cuff-bracelet`) | [BR9366AF V.30](https://drive.google.com/drive/folders/1x2DCNm5Sa-PxpHvvgETMfzze-9v1oRNJ) (30-09-2026) | `BR9366AF V.30-Y (2).jpeg` | `BR9366AF V.30-Y (1).jpeg` |
| LVJ-BRC-004 | Harbour Link Bracelet (`harbour-link-bracelet`) | [BR9366AF V.31](https://drive.google.com/drive/folders/1vuy0i84pB3P3esa4QNshDER2sik4FA2Y) (30-09-2026) | `BR9366AF V.31-R (2).jpeg` | `BR9366AF V.31-R (1).jpeg` |
| LVJ-PND-001 | Amara Heart Pendant (`amara-heart-pendant`) | [PD11884AF](https://drive.google.com/drive/folders/1vIefI2mHm-65EB-1PPbzeguNqGjsKQAn) (19-10-2026) | `PD11884AF-W (2).jpeg` | `PD11884AF-W (1).jpeg` |
| LVJ-PND-004 | Marchesa Diamond Pendant (`marchesa-diamond-pendant`) | [PD12133AF](https://drive.google.com/drive/folders/1BgOZx6fjp8fBxJMEgTTh6I6fWkkvLqu7) (19-10-2026) | `PD12133A-Y (2).jpeg` | `PD12133A-Y (1).jpeg` |

Notes:
- In the PD12133AF folder the yellow files are named `PD12133A-Y (…)` (missing the F). That is the file to use.
- The product names and descriptions are still the seeded demo text (for example "Amara Heart Pendant" now shows an oval halo design). If the store wants names to match the renders, update the name and description at the same time.

### Suggested renders for other products (optional)

| SKU | Product | Suggested folder | Main / hover |
|---|---|---|---|
| LVJ-RNG-002 | Seraphine Halo Engagement Ring | [LR10997AF](https://drive.google.com/drive/folders/1Slb_ce0NIxnjnlPupCQJS9PNTvneUHFj) (09-10-2026) | `-R (6)` / `-R (1)` |
| LVJ-RNG-003 | Meridian Pavé Wedding Band | [LR11065AF](https://drive.google.com/drive/folders/175iL7xuR9r460Ddn6TXiHI8s8zbAzSg9) (08-10-2026) | `-R (5)` / `-R (6)` |
| LVJ-PND-002 | Solene Circle Pendant | [PD11486AF](https://drive.google.com/drive/folders/1-p5XMIxUvF0kNoiWeQIM5QWPoic-QrVx) (19-10-2026) | `-Y (1)` / `-Y (2)` |
| LVJ-PND-003 | Celeste Solitaire Pendant | [PD12256AF](https://drive.google.com/drive/folders/1Bxjn6pa8VULwLAPOu8YxPCks62ZeoLb4) (19-10-2026) | `-R (1)` / `-R (2)` |
| LVJ-BRC-002 / 003 | Lune Bezel, Whitfield Tennis | [BR9366AF V.32](https://drive.google.com/drive/folders/1-aUc6eoQ4ymPNakYcbtvXTkhC6JkmTS6) (30-09-2026) | `-W (2)` / `-W (1)`, or another metal |

Earrings (LVJ-EAR-001 to 004, LVJ-SLV-002) and necklaces (LVJ-NCK-001 to 004): **no renders available**. Keep the current photos until the store supplies earring and necklace renders.

---

## 5. Category images ("Our categories" tiles)

Set `imageUrl` on the top level categories:

| Category slug | Tile on home page | File |
|---|---|---|
| `ring` | Rings (large centre tile) | [LR10997AF](https://drive.google.com/drive/folders/1Slb_ce0NIxnjnlPupCQJS9PNTvneUHFj) `LR10997AF-R (6).png` |
| `pendant` | Pendants | [PD12256AF](https://drive.google.com/drive/folders/1Bxjn6pa8VULwLAPOu8YxPCks62ZeoLb4) `PD12256AF-R (1).jpeg` |
| `bracelet` | Bracelets | [BR9366AF V.31](https://drive.google.com/drive/folders/1vuy0i84pB3P3esa4QNshDER2sik4FA2Y) `BR9366AF V.31-R (2).jpeg` |
| `necklace` | Necklaces | [PD11486AF](https://drive.google.com/drive/folders/1-p5XMIxUvF0kNoiWeQIM5QWPoic-QrVx) `PD11486AF-Y (1).jpeg` (temporary, until a necklace render exists) |
| `earring` | Earrings | No render. Keep the current image |
| `silver-jewelry-with-24k-gold-plating` | (menu only) | No change |

The Rings tile is tall (portrait), the others are wider than they are tall. Renders are square with the piece centred, so they crop well; upload the full square image.

---

## 6. What the frontend still shows locally (not your job)

These are site decoration, not product data, and stay in the frontend:
- Home hero images (`public/images/hero/`)
- The small round thumbnails on the "Engagement rings / Wedding bands" video tiles, and the "Lab-Grown tennis bracelet" occasion card (`public/images/jewelry/`)
- Home videos (`public/videos/`)

---

## 7. Checklist

- [ ] 8 products in section 4 have the listed main and hover photos (`sortOrder` 0 and 1, `isPrimary` on the main one)
- [ ] `primaryImage` and `hoverImage` on list endpoints return those two files
- [ ] Product detail `images[]` starts with the main photo
- [ ] Category `imageUrl` set for ring, pendant, bracelet, necklace
- [ ] Images resized (about 1600 px) with thumbnails (about 600 px), white background kept
- [ ] `alt` text set (name plus metal)
- [ ] Earring and necklace products left unchanged
