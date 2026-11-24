import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiMessage,
  DiamondSelection,
  InquiryItem,
  InquiryRecord,
  InquiryRequest,
  InquiryStatus,
  MetalColor,
  Product,
  ProductListItem,
  metalColorLabel
} from '../models';

const KEY = 'lvj_inquiry_cart';

/** Options picked on the product page, carried into the inquiry bag. */
export interface ProductChoice {
  metalColor?: MetalColor | null;
  karat?: string | null;
  ringSize?: string | null;
  customization?: string | null;
  unitPrice?: number | null;
  /** Photo of the picked color, used as the bag thumbnail. */
  imageUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InquiryService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly itemsSignal = signal<InquiryItem[]>(this.read());

  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0));

  add(
    product: Pick<Product, 'id' | 'sku' | 'slug' | 'name' | 'images'> | ProductListItem,
    choice: ProductChoice = {}
  ): void {
    let imageUrl: string | null = choice.imageUrl ?? null;
    if (!imageUrl && 'images' in product && product.images) {
      const images = product.images;
      imageUrl = images.find(i => i.isPrimary)?.thumbnailUrl ?? images[0]?.url ?? null;
    } else if (!imageUrl && 'primaryImage' in product) {
      imageUrl = product.primaryImage?.thumbnailUrl ?? product.primaryImage?.url ?? null;
    }
    const candidate: InquiryItem = {
      productId: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      imageUrl,
      quantity: 1,
      metalColor: choice.metalColor || undefined,
      karat: choice.karat || undefined,
      ringSize: choice.ringSize || undefined,
      customization: choice.customization?.trim() || undefined,
      unitPrice: choice.unitPrice ?? undefined
    };
    const key = InquiryService.lineKey(candidate);
    const current = this.itemsSignal();
    const existing = current.find(i => InquiryService.lineKey(i) === key);
    const next = existing
      ? current.map(i => InquiryService.lineKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i)
      : [...current, candidate];
    this.persist(next);
  }

  /**
   * Identity of one bag line. The same product in a different color / karat / size /
   * custom request is a separate line.
   */
  static lineKey(item: InquiryItem): string {
    return [
      item.productId || item.sku,
      item.metalColor ?? '',
      item.karat ?? '',
      item.ringSize ?? '',
      item.customization ?? ''
    ].join('|');
  }

  /** Removes one line (by `lineKey`). Product id / SKU still work and remove every matching line. */
  remove(key: string): void {
    this.persist(this.itemsSignal().filter(i =>
      InquiryService.lineKey(i) !== key && i.productId !== key && i.sku !== key));
  }

  /** Short human summary of the picked options, e.g. "Rose Gold · 18K · Size 6.5". */
  static optionSummary(item: InquiryItem): string {
    const color = item.metalColor ? metalColorLabel(item.metalColor as MetalColor) || item.metalColor : '';
    return [color, item.karat, item.ringSize ? `Size ${item.ringSize}` : '']
      .filter(Boolean)
      .join(' · ');
  }

  /** Stable identity for a diamond selection — same shape+carat+clarity+color always maps to one line item. */
  private diamondSku(selection: DiamondSelection): string {
    return `DIAMOND-${selection.shape.toUpperCase()}-${selection.carat}-${selection.clarity}-${selection.color}`;
  }

  hasDiamond(selection: DiamondSelection): boolean {
    const sku = this.diamondSku(selection);
    return this.itemsSignal().some(i => i.sku === sku);
  }

  /** Adds the selection if not already present, or removes it if it is — mirrors a checkbox toggle. */
  toggleDiamond(selection: DiamondSelection): void {
    const sku = this.diamondSku(selection);
    const current = this.itemsSignal();
    if (current.some(i => i.sku === sku)) {
      this.persist(current.filter(i => i.sku !== sku));
      return;
    }
    const item: InquiryItem = {
      kind: 'diamond',
      sku,
      slug: 'diamond-selection',
      name: `${selection.shape} Cut Diamond — ${selection.carat.toFixed(2)} ct, ${selection.clarity}, ${selection.color}`,
      imageUrl: selection.imageUrl ?? null,
      quantity: 1,
      diamondShape: selection.shape,
      diamondCarat: selection.carat,
      diamondClarity: selection.clarity,
      diamondColor: selection.color
    };
    this.persist([...current, item]);
  }

  clear(): void {
    this.persist([]);
  }

  submit(payload: Omit<InquiryRequest, 'items' | 'source'> & { source?: InquiryRequest['source'] }): Observable<ApiMessage> {
    const request: InquiryRequest = {
      ...payload,
      items: this.itemsSignal(),
      source: payload.source ?? 'cart'
    };
    return this.http.post<ApiMessage>(`${this.api}/inquiries`, request);
  }

  submitDirect(request: InquiryRequest): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.api}/inquiries`, request);
  }

  adminList(): Observable<InquiryRecord[]> {
    return this.http.get<InquiryRecord[]>(`${this.api}/admin/inquiries`);
  }

  setStatus(id: string, status: InquiryStatus): Observable<InquiryRecord> {
    return this.http.patch<InquiryRecord>(`${this.api}/admin/inquiries/${id}/status`, { status });
  }

  private persist(items: InquiryItem[]): void {
    this.itemsSignal.set(items);
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  private read(): InquiryItem[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]') as InquiryItem[];
    } catch {
      return [];
    }
  }
}
