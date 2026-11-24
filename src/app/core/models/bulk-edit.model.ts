import { Karat, ProductAvailability, ProductListQuery, ProductStatus } from './product.model';

/** How the price changes — same choices as Shopify / Etsy bulk edit. */
export type BulkPriceMode =
  | 'none'
  | 'increase_amount'
  | 'decrease_amount'
  | 'set_amount'
  | 'increase_percent'
  | 'decrease_percent';

/** Compare-at ("was") price: leave, set as % above the new price, or remove. */
export type BulkCompareMode = 'none' | 'percent_above' | 'remove';

/** Which products the change applies to. */
export type BulkScope =
  | { type: 'ids'; ids: string[] }
  /** Every product matching the admin list filters (same params as GET /admin/products). */
  | { type: 'filter'; filter: Pick<ProductListQuery, 'q' | 'category' | 'status'> }
  | { type: 'all' };

export interface BulkPriceChange {
  mode: BulkPriceMode;
  /** Dollars for *_amount modes, percent (e.g. 5 = 5%) for *_percent modes. */
  value: number;
  /** Round every resulting price to the nearest whole dollar. */
  roundWhole: boolean;
  /**
   * Which karat prices to change on products that have karat pricing.
   * Products without karat prices always have their main price changed.
   */
  karats: Karat[];
}

export interface BulkCompareChange {
  mode: BulkCompareMode;
  /** For 'percent_above': compare-at = new price × (1 + percent / 100). */
  percent: number;
}

export interface BulkChanges {
  price: BulkPriceChange;
  compareAt: BulkCompareChange;
  /** null = leave unchanged. */
  showPrice: boolean | null;
  status: ProductStatus | null;
  availability: ProductAvailability | null;
}

export interface BulkUpdateRequest {
  scope: BulkScope;
  changes: BulkChanges;
  /** true = calculate and return the preview only, save nothing. */
  dryRun: boolean;
}

/** One price line in the preview (main price or one karat). */
export interface BulkPriceLine {
  /** 'main' or a karat, e.g. '14K'. */
  target: 'main' | Karat;
  before: number | null;
  after: number | null;
  compareBefore: number | null;
  compareAfter: number | null;
}

export interface BulkPreviewRow {
  id: string;
  sku: string;
  name: string;
  lines: BulkPriceLine[];
  /** Human-readable non-price changes, e.g. ["Show price: Yes → No"]. */
  otherChanges: string[];
  changed: boolean;
  /** Why the price was not changed, e.g. "No price (price upon request)". */
  skippedReason?: string;
}

export interface BulkUpdateResult {
  /** Products in scope. */
  matched: number;
  /** Products that changed (or would change, on dry run). */
  updated: number;
  /** Products in scope with nothing to change. */
  unchanged: number;
  /** First rows for the preview table (backend may cap, e.g. 200). */
  preview: BulkPreviewRow[];
  dryRun: boolean;
}
