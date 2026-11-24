import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage, DiamondSelection, InquiryItem, InquiryRecord, InquiryRequest, InquiryStatus, Product, ProductListItem } from '../models';

const KEY = 'lvj_inquiry_cart';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly itemsSignal = signal<InquiryItem[]>(this.read());

  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0));

  add(product: Pick<Product, 'id' | 'sku' | 'slug' | 'name' | 'images'> | ProductListItem): void {
    let imageUrl: string | null = null;
    if ('images' in product && product.images) {
      const images = product.images;
      imageUrl = images.find(i => i.isPrimary)?.thumbnailUrl ?? images[0]?.url ?? null;
    } else if ('primaryImage' in product) {
      imageUrl = product.primaryImage?.thumbnailUrl ?? product.primaryImage?.url ?? null;
    }
    const current = this.itemsSignal();
    const existing = current.find(i => i.productId === product.id);
    const next = existing
      ? current.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...current, { productId: product.id, sku: product.sku, slug: product.slug, name: product.name, imageUrl, quantity: 1 }];
    this.persist(next);
  }

  remove(key: string): void {
    this.persist(this.itemsSignal().filter(i => i.productId !== key && i.sku !== key));
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
