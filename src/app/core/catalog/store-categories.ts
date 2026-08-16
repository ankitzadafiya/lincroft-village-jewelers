/** Official storefront categories — slugs and names must match the API. */
export interface StoreCategoryDef {
  slug: string;
  name: string;
  /** Shorter header/footer label. Catalog pages use `name` from the API. */
  navLabel: string;
}

export const STORE_TOP_CATEGORIES: StoreCategoryDef[] = [
  { slug: 'ring', name: 'Ring', navLabel: 'Rings' },
  { slug: 'earring', name: 'Earring', navLabel: 'Earrings' },
  { slug: 'pendant', name: 'Pendant', navLabel: 'Pendants' },
  { slug: 'necklace', name: 'Necklace', navLabel: 'Necklaces' },
  { slug: 'bracelet', name: 'Bracelet', navLabel: 'Bracelets' },
  {
    slug: 'silver-jewelry-with-24k-gold-plating',
    name: 'Silver Jewelry with 24K Gold Plating',
    navLabel: 'Silver + 24K Gold'
  }
];

/** Old USA bookmarks → current API slugs. */
export const LEGACY_CATEGORY_REDIRECTS: { from: string; to: string }[] = [
  { from: 'rings', to: '/ring' },
  { from: 'earrings', to: '/earring' },
  { from: 'pendants', to: '/pendant' },
  { from: 'necklaces', to: '/necklace' },
  { from: 'bracelets', to: '/bracelet' },
  { from: 'silver-gold-plating', to: '/silver-jewelry-with-24k-gold-plating' },
  { from: 'engagement-rings', to: '/ring' },
  { from: 'wedding-bands', to: '/ring' },
  { from: 'watches', to: '/silver-jewelry-with-24k-gold-plating' }
];
