export interface StoreHours {
  day: string;
  hours: string;
  closed: boolean;
}

/** Matches backend `AppConfiguration`. Wire name is `whatsApp` (not `whatsapp`). */
export interface AppConfiguration {
  showPricesGlobally: boolean;
  allowProductPriceOverride: boolean;
  storeName: string;
  tagline?: string;
  phone?: string;
  phoneDisplay?: string;
  email?: string;
  whatsApp?: string;
  addressLine?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  mapsUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  hours: StoreHours[];
}

export interface PriceVisibilityInput {
  showPrice: boolean;
}
