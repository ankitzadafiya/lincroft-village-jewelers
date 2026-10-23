import { ProductListItem, ProductMedia } from '../models';

/**
 * DEMO ONLY: the store's own studio renders (public/images/jewelry) shown on
 * product cards until real product photos are uploaded through the admin panel.
 * Earrings and other types without a render keep their API photos.
 * Remove this file (and its two call sites) once the backend has real images.
 */
const J = '/images/jewelry/';
const POOLS: { match: RegExp; shots: [string, string][] }[] = [
  {
    match: /band|eternity/i,
    shots: [
      ['twist-band-side', 'twist-band-front'],
      ['scalloped-band-side', 'scalloped-band-front']
    ]
  },
  {
    match: /ring/i,
    shots: [
      ['engagement-ring-side', 'pear-cluster-ring'],
      ['pear-cluster-ring', 'engagement-ring-side']
    ]
  },
  {
    match: /pendant|cross/i,
    shots: [
      ['pear-drop-pendant', 'pear-drop-pendant-side'],
      ['pear-drop-pendant-side', 'pear-drop-pendant']
    ]
  },
  { match: /bracelet/i, shots: [['tennis-bracelet', 'tennis-bracelet']] }
];

const media = (name: string, alt: string, primary: boolean): ProductMedia => ({
  id: `demo-${name}-${primary ? 'a' : 'b'}`,
  url: `${J}${name}.webp`,
  thumbnailUrl: `${J}${name}.webp`,
  alt,
  sortOrder: primary ? 0 : 1,
  type: 'image',
  isPrimary: primary
});

/** `offset` lets a second section start on different shots. */
export function withDemoImages(list: ProductListItem[], offset = 0): ProductListItem[] {
  const used = new Map<RegExp, number>();
  return list.map(p => {
    const text = `${p.subcategoryName ?? ''} ${p.categoryName ?? ''} ${p.name}`;
    if (/earring|stud|necklace/i.test(text)) return p;
    const pool = POOLS.find(x => x.match.test(text));
    if (!pool) return p;
    const i = used.get(pool.match) ?? offset;
    used.set(pool.match, i + 1);
    const [a, b] = pool.shots[i % pool.shots.length];
    return { ...p, primaryImage: media(a, p.name, true), hoverImage: a === b ? p.hoverImage ?? null : media(b, p.name, false) };
  });
}
