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

export interface ProductMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  sortOrder: number;
  type: 'image' | 'video';
  isPrimary: boolean;
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
}

export interface ProductStatusUpdate {
  status: ProductStatus;
}

/** Identity on write is `url` (and `sourceUrl` if present). `id` is round-tripped but not used to attach. */
export function toMediaWrite(media: ProductMedia): ProductMediaWrite {
  return {
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    alt: media.alt,
    sortOrder: media.sortOrder,
    isPrimary: media.isPrimary
  };
}
