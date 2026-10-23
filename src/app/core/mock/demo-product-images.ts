import { ProductListItem, ProductMedia } from '../models';

/**
 * DEMO ONLY: the store's own studio renders (public/images/jewelry, taken from
 * the RENDERING Drive folder) shown on product cards until real product photos
 * are uploaded through the admin panel. Products not listed here (earrings,
 * necklaces) keep their API photos.
 * Remove this file (and its call sites in home + catalog) once the backend has real images.
 */
const J = '/images/jewelry/';

/** Product name keyword → [main side view, hover view]. */
const BY_NAME: [RegExp, string, string | null][] = [
  [/aurelia|solitaire/i, 'solitaire-white-side', 'solitaire-white-front'],
  [/corinne|eternity/i, 'band-white-side', 'band-white-front'],
  [/vine/i, 'vine-yellow-side', 'vine-yellow-front'],
  [/riviera|tennis bracelet/i, 'bracelet-white-side', 'bracelet-white-front'],
  [/cuff/i, 'bracelet-yellow-side', 'bracelet-yellow-front'],
  [/harbour|link bracelet/i, 'tennis-bracelet', null],
  [/amara/i, 'star-pendant-white-side', 'star-pendant-white-front'],
  [/marchesa/i, 'pear-halo-pendant-rose-side', 'pear-halo-pendant-rose-front'],
  // No earring renders yet: free Unsplash photos (Unsplash licence), background brightened to white
  [/luminous/i, 'studs-hexagon-white', null],
  [/petite classic/i, 'studs-gold-white', null]
];

/** Fallback by type for any other best seller / new arrival. */
const BY_TYPE: [RegExp, string, string][] = [
  [/band|eternity/i, 'twist-band-side', 'twist-band-front'],
  [/ring/i, 'engagement-ring-side', 'pear-cluster-ring'],
  [/pendant|cross/i, 'pear-drop-pendant', 'pear-drop-pendant-side'],
  [/bracelet/i, 'tennis-bracelet', 'bracelet-white-front']
];

const src = (name: string) => (name.startsWith('http') ? name : `${J}${name}.webp`);

const media = (name: string, alt: string, primary: boolean): ProductMedia => ({
  id: `demo-${name.slice(-24)}`,
  url: src(name),
  thumbnailUrl: src(name),
  alt,
  sortOrder: primary ? 0 : 1,
  type: 'image',
  isPrimary: primary
});

export function withDemoImages(list: ProductListItem[]): ProductListItem[] {
  return list.map(p => {
    const text = `${p.name} ${p.subcategoryName ?? ''} ${p.categoryName ?? ''}`;
    const named = BY_NAME.find(([re]) => re.test(p.name));
    if (!named && /earring|stud|necklace/i.test(text)) return p;
    const hit = named ?? BY_TYPE.find(([re]) => re.test(text));
    if (!hit) return p;
    const [, main, hover] = hit;
    return {
      ...p,
      primaryImage: media(main, p.name, true),
      hoverImage: hover ? media(hover, p.name, false) : null
    };
  });
}
