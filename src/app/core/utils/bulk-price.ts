import type {
  BulkChanges,
  BulkPreviewRow,
  BulkPriceLine,
  BulkPriceMode,
  KaratPrice,
  Product
} from '../models';

/**
 * Reference implementation of the bulk edit rules. The mock API uses it, and
 * BACKEND_PRODUCT_OPTIONS_AND_BULK_EDIT.md asks the backend to match it exactly.
 *
 * Rules
 *  1. Price-upon-request products (price null) are never given a price.
 *  2. Results never go below 0. With `roundWhole` prices round to whole dollars,
 *     otherwise to cents.
 *  3. Products with karat prices: only the ticked karats change; the main price
 *     is then re-synced to the default karat's price (it is what cards show).
 *     Products without karat prices: the main price changes.
 *  4. Compare-at 'percent_above' = new price × (1 + percent/100), same rounding.
 *     It applies to the same price lines as rule 3, even when the price itself
 *     is not changed. 'remove' clears it on those lines.
 */

function round(value: number, whole: boolean): number {
  const v = Math.max(0, value);
  return whole ? Math.round(v) : Math.round(v * 100) / 100;
}

export function applyPriceMode(price: number, mode: BulkPriceMode, value: number, whole: boolean): number {
  switch (mode) {
    case 'increase_amount': return round(price + value, whole);
    case 'decrease_amount': return round(price - value, whole);
    case 'set_amount': return round(value, whole);
    case 'increase_percent': return round(price * (1 + value / 100), whole);
    case 'decrease_percent': return round(price * (1 - value / 100), whole);
    default: return price;
  }
}

/** True when the changes would do anything at all. */
export function hasBulkChanges(c: BulkChanges): boolean {
  return c.price.mode !== 'none'
    || c.compareAt.mode !== 'none'
    || c.showPrice !== null
    || c.status !== null
    || c.availability !== null;
}

export interface BulkApplyResult {
  row: BulkPreviewRow;
  /** Fields to save (only when `row.changed`). */
  patch: Pick<Product, 'price' | 'compareAtPrice' | 'showPrice' | 'status' | 'availability'> & {
    karatPrices: KaratPrice[] | null;
  };
}

export function applyBulkChanges(product: Product, changes: BulkChanges): BulkApplyResult {
  const { price: pc, compareAt: cc } = changes;
  const whole = pc.roundWhole;
  const karatPrices = product.options?.karatPrices ?? [];
  const hasKarats = karatPrices.length > 0;
  const touchesPrices = pc.mode !== 'none' || cc.mode !== 'none';

  const lines: BulkPriceLine[] = [];

  const nextLine = (price: number | null, compare: number | null): { price: number | null; compare: number | null } => {
    if (price == null) return { price, compare };
    const newPrice = pc.mode === 'none' ? price : applyPriceMode(price, pc.mode, pc.value, whole);
    let newCompare = compare;
    if (cc.mode === 'percent_above') newCompare = round(newPrice * (1 + cc.percent / 100), whole);
    if (cc.mode === 'remove') newCompare = null;
    return { price: newPrice, compare: newCompare };
  };

  const nextKarats: KaratPrice[] | null = hasKarats ? karatPrices.map(k => ({ ...k })) : null;
  let mainPrice = product.price ?? null;
  let mainCompare = product.compareAtPrice ?? null;
  let skippedReason: string | undefined;

  if (touchesPrices) {
    if (hasKarats && nextKarats) {
      const targets = nextKarats.filter(k => pc.karats.includes(k.karat));
      if (!targets.length) skippedReason = 'None of the chosen karats are offered';
      targets.forEach(k => {
        const before = { price: k.price, compare: k.compareAtPrice ?? null };
        const after = nextLine(before.price, before.compare);
        if (before.price == null) return;
        k.price = after.price;
        k.compareAtPrice = after.compare;
        lines.push({
          target: k.karat,
          before: before.price,
          after: after.price,
          compareBefore: before.compare,
          compareAfter: after.compare
        });
      });
      if (targets.length && !lines.length) skippedReason = 'No price (price upon request)';
      // Main price follows the default karat.
      const def = nextKarats.find(k => k.karat === product.options?.defaultKarat) ?? nextKarats[0];
      if (def?.price != null) {
        mainPrice = def.price;
        if (cc.mode !== 'none' && pc.karats.includes(def.karat)) mainCompare = def.compareAtPrice ?? null;
      }
    } else if (mainPrice == null) {
      skippedReason = 'No price (price upon request)';
    } else {
      const after = nextLine(mainPrice, mainCompare);
      lines.push({
        target: 'main',
        before: mainPrice,
        after: after.price,
        compareBefore: mainCompare,
        compareAfter: after.compare
      });
      mainPrice = after.price;
      mainCompare = after.compare;
    }
  }

  const otherChanges: string[] = [];
  const showPrice = changes.showPrice ?? product.showPrice;
  const status = changes.status ?? product.status;
  const availability = changes.availability ?? product.availability;
  if (showPrice !== product.showPrice) otherChanges.push(`Show price: ${product.showPrice ? 'Yes' : 'No'} → ${showPrice ? 'Yes' : 'No'}`);
  if (status !== product.status) otherChanges.push(`Status: ${product.status} → ${status}`);
  if (availability !== product.availability) {
    otherChanges.push(`Availability: ${product.availability.replace('_', ' ')} → ${availability.replace('_', ' ')}`);
  }

  const priceChanged = lines.some(l => l.before !== l.after || l.compareBefore !== l.compareAfter)
    || mainPrice !== (product.price ?? null)
    || mainCompare !== (product.compareAtPrice ?? null);

  return {
    row: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      lines,
      otherChanges,
      changed: priceChanged || otherChanges.length > 0,
      skippedReason
    },
    patch: {
      price: mainPrice,
      compareAtPrice: mainCompare,
      showPrice,
      status,
      availability,
      karatPrices: nextKarats
    }
  };
}
