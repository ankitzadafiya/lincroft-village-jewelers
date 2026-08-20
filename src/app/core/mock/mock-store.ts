import {
  AppConfiguration,
  Category,
  Designer,
  InquiryRecord,
  Product,
  ProductListItem,
  ProductListQuery,
  ProductWritePayload
} from '../models';
import { slugify } from '../utils/slug';
import {
  MOCK_CATEGORIES,
  MOCK_CONFIG,
  MOCK_DESIGNERS,
  MOCK_INQUIRIES,
  MOCK_PRODUCTS
} from './mock-data';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MockStore {
  products: Product[] = clone(MOCK_PRODUCTS);
  categories: Category[] = clone(MOCK_CATEGORIES);
  designers: Designer[] = clone(MOCK_DESIGNERS);
  config: AppConfiguration = clone(MOCK_CONFIG);
  inquiries: InquiryRecord[] = clone(MOCK_INQUIRIES);
  private seq = 100;

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  categoryById(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  categoryBySlug(slug: string): Category | undefined {
    return this.categories.find(c => c.slug === slug);
  }

  designerById(id: string | null | undefined): Designer | undefined {
    return id ? this.designers.find(d => d.id === id) : undefined;
  }

  toListItem(product: Product): ProductListItem {
    const category = this.categoryById(product.categoryId);
    const subcategory = product.subcategoryId ? this.categoryById(product.subcategoryId) : undefined;
    const images = product.images.filter(i => i.type !== 'video');
    const primary = images.find(i => i.isPrimary) ?? images[0] ?? null;
    let hover = images.find(i => i.id !== primary?.id) ?? null;
    if (!hover && primary) {
      // Willis-style hover swap: fall back to another piece in the same category
      const alt = this.products.find(
        p =>
          p.id !== product.id &&
          p.categoryId === product.categoryId &&
          p.status === 'active' &&
          p.images.some(i => i.type !== 'video' && i.url !== primary.url)
      );
      const altImg = alt?.images.find(i => i.type !== 'video' && i.url !== primary.url) ?? null;
      hover = altImg;
    }

    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: category?.name ?? '',
      subcategoryName: subcategory?.name ?? null,
      designerName: product.designerName,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      showPrice: product.showPrice,
      availability: product.availability,
      primaryImage: primary,
      hoverImage: hover,
      featured: product.featured,
      newArrival: product.newArrival
    };
  }

  queryProducts(query: ProductListQuery, storefrontOnly = true): { items: Product[]; total: number } {
    let list = [...this.products];

    if (storefrontOnly) {
      list = list.filter(p => p.status === 'active');
    } else if (query.status) {
      list = list.filter(p => p.status === query.status);
    }

    const category = query.category ? this.categoryBySlug(query.category) : undefined;
    if (category) {
      if (category.parentId) {
        list = list.filter(p => p.subcategoryId === category.id);
      } else {
        const childIds = this.categories.filter(c => c.parentId === category.id).map(c => c.id);
        list = list.filter(p => p.categoryId === category.id || (p.subcategoryId && childIds.includes(p.subcategoryId)));
      }
    }

    if (query.subcategory) {
      const sub = this.categoryBySlug(query.subcategory);
      if (sub) list = list.filter(p => p.subcategoryId === sub.id);
    }

    if (query.designer) {
      const wanted = query.designer.toLowerCase();
      const designer = this.designers.find(d =>
        d.slug.toLowerCase() === wanted ||
        d.id.toLowerCase() === wanted ||
        d.name.toLowerCase() === wanted
      );
      if (designer) {
        list = list.filter(p => p.designerId === designer.id);
      } else {
        list = list.filter(p => (p.designerName ?? '').toLowerCase() === wanted);
      }
    }

    const specMatch = (product: Product, key: string, value: string) =>
      product.specs.some(s => s.key.toLowerCase() === key.toLowerCase() && s.value.toLowerCase() === value.toLowerCase());

    if (query.metal) list = list.filter(p => specMatch(p, 'metal', query.metal!));
    if (query.karat) list = list.filter(p => specMatch(p, 'karat', query.karat!));
    if (query.gemstone) list = list.filter(p => specMatch(p, 'gemstone', query.gemstone!));
    if (query.diamondType) list = list.filter(p => specMatch(p, 'diamondType', query.diamondType!));
    if (query.diamondShape) list = list.filter(p => specMatch(p, 'shape', query.diamondShape!) || specMatch(p, 'diamondShape', query.diamondShape!));
    if (query.availability) list = list.filter(p => p.availability === query.availability);
    if (query.featured) list = list.filter(p => p.featured);
    if (query.newArrival) list = list.filter(p => p.newArrival);
    if (query.bestSeller) list = list.filter(p => p.bestSeller);
    if (query.priceMin != null) list = list.filter(p => p.price != null && p.price >= query.priceMin!);
    if (query.priceMax != null) list = list.filter(p => p.price != null && p.price <= query.priceMax!);

    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.designerName ?? '').toLowerCase().includes(q) ||
        p.specs.some(s => s.value.toLowerCase().includes(q))
      );
    }

    switch (query.sort) {
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        list.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
        break;
      case 'price_desc':
        list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'featured':
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
      default:
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const total = list.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const start = (page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total };
  }

  upsertProduct(payload: ProductWritePayload, id?: string): Product {
    const designer = this.designerById(payload.designerId ?? null);
    const toMedia = (
      m: NonNullable<ProductWritePayload['images']>[number],
      type: 'image' | 'video'
    ) => ({
      id: m.id ?? this.nextId('media'),
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      alt: m.alt,
      sortOrder: m.sortOrder,
      type,
      isPrimary: m.isPrimary
    });
    const product: Product = {
      id: id ?? this.nextId('p'),
      sku: payload.sku.trim(),
      slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
      name: payload.name.trim(),
      description: payload.description ?? '',
      categoryId: payload.categoryId,
      subcategoryId: payload.subcategoryId ?? null,
      designerId: payload.designerId ?? null,
      designerName: designer?.name ?? null,
      price: payload.price ?? null,
      compareAtPrice: payload.compareAtPrice ?? null,
      showPrice: payload.showPrice ?? true,
      status: payload.status ?? 'active',
      availability: payload.availability ?? 'in_stock',
      specs: (payload.specs ?? []).map(s => ({
        key: s.key,
        label: s.label ?? s.key,
        value: s.value,
        group: s.group ?? 'general'
      })),
      images: (payload.images ?? []).map(m => toMedia(m, 'image')),
      videos: (payload.videos ?? []).map(m => toMedia(m, 'video')),
      tags: payload.tags ?? [],
      featured: payload.featured ?? false,
      newArrival: payload.newArrival ?? false,
      bestSeller: payload.bestSeller ?? false,
      createdAt: id ? this.products.find(p => p.id === id)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (id) {
      this.products = this.products.map(p => (p.id === id ? product : p));
    } else {
      this.products = [product, ...this.products];
    }
    return product;
  }
}

export const mockStore = new MockStore();
