import { FacetValue } from './api.model';

export type ProductStatus = 'active' | 'inactive' | 'archived';
export type ProductAvailability = 'in_stock' | 'made_to_order' | 'sold';
export type SpecGroup = 'metal' | 'diamond' | 'gemstone' | 'watch' | 'general' | 'dimensions';

export interface ProductSpec {
  key: string;
  label: string;
  value: string;
  group: SpecGroup;
}

export interface ProductSpecInput {
  key: string;
  label?: string;
  value: string;
  group?: SpecGroup;
}

/** Gold tone a customer can pick on the product page. */
export type MetalColor = 'yellow' | 'white' | 'rose';
/** Gold purity a customer can pick on the product page. */
export type Karat = '10K' | '14K' | '18K';

export const METAL_COLORS: { value: MetalColor; label: string }[] = [
  { value: 'yellow', label: 'Yellow Gold' },
  { value: 'white', label: 'White Gold' },
  { value: 'rose', label: 'Rose Gold' }
];

export const KARATS: Karat[] = ['10K', '14K', '18K'];

/** Default ring sizes: 4 to 11 in half sizes. */
export const DEFAULT_RING_SIZES: string[] = Array.from({ length: 15 }, (_, i) => String(4 + i * 0.5));

export function metalColorLabel(color: MetalColor | null | undefined): string {
  return METAL_COLORS.find(c => c.value === color)?.label ?? '';
}

/** Price for one karat option. `compareAtPrice` is optional (shows a strike-through price). */
export interface KaratPrice {
  karat: Karat;
  price: number | null;
  compareAtPrice?: number | null;
}

export interface ProductMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  sortOrder: number;
  type: 'image' | 'video';
  isPrimary: boolean;
  /** Which gold tone this photo shows. Empty = shown for every color. */
  metalColor?: MetalColor | null;
}

/** Admin create/update media row. `id` present when attaching an existing upload. */
export interface ProductMediaWrite {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  sortOrder: number;
  sourceUrl?: string;
  isPrimary: boolean;
  metalColor?: MetalColor | null;
}

/**
 * Customer-selectable options on the product page. Every field is optional —
 * a product without options renders exactly as before.
 */
export interface ProductOptions {
  /** Gold tones offered, in display order. Empty/missing = no color picker. */
  metalColors?: MetalColor[];
  defaultMetalColor?: MetalColor | null;
  /** Karats offered with their own price. Empty/missing = no karat picker. */
  karatPrices?: KaratPrice[];
  defaultKarat?: Karat | null;
  /**
   * Size picker: true = show, false = hide, null/missing = automatic
   * (shown for products in the Ring category).
   */
  showRingSizes?: boolean | null;
  /** Sizes to offer (e.g. "4", "4.5" … "11"). Empty/missing = DEFAULT_RING_SIZES. */
  ringSizes?: string[];
  /** Show the "Customize this item" checkbox + text box. Default true. */
  allowCustomization?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId?: string | null;
  designerId?: string | null;
  designerName?: string | null;
  /** Storefront card/PDP label — free text from admin or Excel Brand column. */
  brandName?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  showPrice: boolean;
  status: ProductStatus;
  availability: ProductAvailability;
  specs: ProductSpec[];
  images: ProductMedia[];
  videos: ProductMedia[];
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  /** Metal color / karat / ring size / customization choices. */
  options?: ProductOptions | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subcategoryName?: string | null;
  brandName?: string | null;
  designerName?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  showPrice: boolean;
  availability: ProductAvailability;
  primaryImage?: ProductMedia | null;
  hoverImage?: ProductMedia | null;
  featured: boolean;
  newArrival: boolean;
}

export interface ProductListQuery {
  category?: string;
  subcategory?: string;
  designer?: string;
  metal?: string;
  karat?: string;
  gemstone?: string;
  diamondType?: string;
  diamondShape?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: string;
  status?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  q?: string;
  sort?: 'newest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'featured';
  page?: number;
  pageSize?: number;
}

export interface ProductFilterFacets {
  metals: FacetValue[];
  karats: FacetValue[];
  gemstones: FacetValue[];
  diamondTypes: FacetValue[];
  diamondShapes: FacetValue[];
  designers: FacetValue[];
  availability: FacetValue[];
  priceRange: { min: number; max: number };
}

export interface ProductWritePayload {
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string | null;
  designerId?: string | null;
  brandName?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  showPrice?: boolean;
  status?: ProductStatus;
  availability?: ProductAvailability;
  specs?: ProductSpecInput[];
  tags?: string[];
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  images?: ProductMediaWrite[];
  videos?: ProductMediaWrite[];
  options?: ProductOptions | null;
}

export function productDisplayBrand(item: {
  brandName?: string | null;
  designerName?: string | null;
  categoryName?: string;
}): string {
  const brand = item.brandName?.trim();
  if (brand) return brand;
  const designer = item.designerName?.trim();
  if (designer) return designer;
  return item.categoryName?.trim() ?? '';
}

/** Identity on write is `url` (and `sourceUrl` if present). `id` is round-tripped but not used to attach. */
export function toMediaWrite(media: ProductMedia): ProductMediaWrite {
  return {
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    alt: media.alt,
    sortOrder: media.sortOrder,
    isPrimary: media.isPrimary,
    metalColor: media.metalColor ?? null
  };
}
