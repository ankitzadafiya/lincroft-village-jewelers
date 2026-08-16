# Lincroft Village Jewelers

Premium Angular storefront and atelier admin for a local fine jewelry business in Lincroft, New Jersey.

The catalog is **inquiry-based** (no payment checkout). A future backend can attach REST APIs without rewriting feature components.

## Stack

- Angular 19, TypeScript, SCSS
- PrimeNG (tables, dialogs, paginator, toast, file-oriented admin)
- RxJS, Reactive Forms, standalone components, lazy-loaded routes

## Run

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

Admin: [http://localhost:4200/admin/login](http://localhost:4200/admin/login)

- Email: `admin@lincroftjewelers.com`
- Password: `demo1234`

## Connecting a real API

1. Set `apiUrl` and `useMockApi: false` in `src/environments/environment.ts` (and production).
2. Keep the existing service methods; they already call REST endpoints such as:

- `GET /api/products` (query: category, subcategory, designer, metal, karat, gemstone, diamondType, price range, availability, sort, q, page, pageSize)
- `GET /api/products/:slug`
- `GET /api/products/facets`
- `GET /api/categories`
- `POST /api/inquiries`
- `POST /api/custom-jewelry`
- `GET /api/config`
- Admin CRUD under `/api/admin/*`

Price visibility is centralized in `ConfigurationService.isPriceVisible()`:

- Global show + product hide → hide
- Global hide + product show → show only if `allowProductPriceOverride` is true

## Excel import

Admin → Import. Download the template, validate rows, then confirm. Invalid rows are never imported. Failed rows can be downloaded.

## Notes

Product copy and photography are **demo placeholders** for UI development. Do not treat them as live inventory.
