import {
  AppConfiguration,
  Category,
  CustomJewelryRequest,
  Designer,
  HomeContent,
  InquiryRecord,
  InstagramPost,
  Product,
  ProductMedia,
  ServiceOffering,
  Testimonial
} from '../models';
import { spec } from '../utils/slug';
import { IMG, thumb } from './image-catalog';

function media(id: string, url: string, alt: string, order: number, primary = false): ProductMedia {
  return {
    id,
    url,
    thumbnailUrl: thumb(url),
    alt,
    sortOrder: order,
    type: 'image',
    isPrimary: primary
  };
}

function video(
  id: string,
  order: number,
  url = 'https://assets.mixkit.co/videos/34611/34611-720.mp4',
  thumbUrl = 'https://assets.mixkit.co/videos/34611/34611-thumb-720-0.jpg',
  alt = 'Product video'
): ProductMedia {
  return {
    id,
    url,
    thumbnailUrl: thumbUrl,
    alt,
    sortOrder: order,
    type: 'video',
    isPrimary: false
  };
}

export const MOCK_CONFIG: AppConfiguration = {
  showPricesGlobally: true,
  allowProductPriceOverride: true,
  storeName: 'Lincroft Village Jewelers',
  tagline: 'Lab-grown & natural diamond jewelry in Lincroft, NJ.',
  phone: '+17325550142',
  phoneDisplay: '(732) 555-0142',
  email: 'hello@lincroftjewelers.com',
  whatsApp: '17325550142',
  addressLine: '615 Newman Springs Road',
  city: 'Lincroft',
  region: 'NJ',
  postalCode: '07738',
  mapsUrl: 'https://maps.google.com/?q=615+Newman+Springs+Road+Lincroft+NJ',
  instagramUrl: 'https://instagram.com/',
  facebookUrl: 'https://facebook.com/',
  hours: [
    { day: 'Monday', hours: 'Closed', closed: true },
    { day: 'Tuesday', hours: '10:00am – 6:00pm', closed: false },
    { day: 'Wednesday', hours: '10:00am – 6:00pm', closed: false },
    { day: 'Thursday', hours: '10:00am – 7:00pm', closed: false },
    { day: 'Friday', hours: '10:00am – 6:00pm', closed: false },
    { day: 'Saturday', hours: '10:00am – 5:00pm', closed: false },
    { day: 'Sunday', hours: 'Closed', closed: true }
  ]
};

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-rings', slug: 'ring', name: 'Ring', description: 'Lab-grown engagement rings, lab-grown wedding bands, and natural diamond rings — selected for everyday elegance and lifelong wear.', imageUrl: IMG.catRings, parentId: null, sortOrder: 1, active: true, megaMenu: true },
  { id: 'cat-earrings', slug: 'earring', name: 'Earring', description: 'Lab-grown and natural diamond earrings and classic studs.', imageUrl: IMG.catEarrings, parentId: null, sortOrder: 2, active: true, megaMenu: true },
  { id: 'cat-pendants', slug: 'pendant', name: 'Pendant', description: 'Lab-grown diamond crosses, heart and circle classics, and natural diamond pendants.', imageUrl: IMG.catPendants, parentId: null, sortOrder: 3, active: true, megaMenu: true },
  { id: 'cat-necklaces', slug: 'necklace', name: 'Necklace', description: 'Lab-grown and natural diamond necklaces, including tennis styles.', imageUrl: IMG.catNecklaces, parentId: null, sortOrder: 4, active: true, megaMenu: true },
  { id: 'cat-bracelets', slug: 'bracelet', name: 'Bracelet', description: 'Lab-grown and natural diamond tennis bracelets and everyday bracelets.', imageUrl: IMG.catBracelets, parentId: null, sortOrder: 5, active: true, megaMenu: true },
  { id: 'cat-silver', slug: 'silver-jewelry-with-24k-gold-plating', name: 'Silver Jewelry with 24K Gold Plating', description: 'Sterling silver jewelry finished with 24k gold plating.', imageUrl: IMG.catSilver, parentId: null, sortOrder: 6, active: true, megaMenu: true },

  { id: 'sub-lg-engagement', slug: 'ring-lab-grown-engagement-ring', name: 'Lab-Grown Engagement Ring', description: 'Brilliant lab-grown diamonds set for proposals and forever.', imageUrl: IMG.ring1, parentId: 'cat-rings', sortOrder: 1, active: true, megaMenu: false },
  { id: 'sub-lg-wedding-bands', slug: 'ring-lab-grown-wedding-band', name: 'Lab-Grown Wedding Band', description: 'Matching and complementary bands with lab-grown diamonds.', imageUrl: IMG.ring3, parentId: 'cat-rings', sortOrder: 2, active: true, megaMenu: false },
  { id: 'sub-natural-rings', slug: 'ring-natural-ring', name: 'Natural Ring', description: 'Natural diamond rings with timeless American craftsmanship.', imageUrl: IMG.ring2, parentId: 'cat-rings', sortOrder: 3, active: true, megaMenu: false },

  { id: 'sub-lg-earrings', slug: 'earring-lab-grown-diamond-earring', name: 'Lab-Grown Diamond Earring', description: '', imageUrl: IMG.earring1, parentId: 'cat-earrings', sortOrder: 1, active: true, megaMenu: false },
  { id: 'sub-nat-earrings', slug: 'earring-natural-diamond-earring', name: 'Natural Diamond Earring', description: '', imageUrl: IMG.earring2, parentId: 'cat-earrings', sortOrder: 2, active: true, megaMenu: false },
  { id: 'sub-studs', slug: 'earring-studs', name: 'Studs', description: '', imageUrl: IMG.earring1, parentId: 'cat-earrings', sortOrder: 3, active: true, megaMenu: false },

  { id: 'sub-lg-cross', slug: 'pendant-lab-grown-diamond-cross', name: 'Lab-Grown Diamond Cross', description: '', imageUrl: IMG.necklace3, parentId: 'cat-pendants', sortOrder: 1, active: true, megaMenu: false },
  { id: 'sub-lg-heart-circle', slug: 'pendant-lab-grown-diamond-classic-pendant-heart-circle', name: 'Lab-Grown Diamond Classic Pendant (Heart & Circle)', description: '', imageUrl: IMG.necklace1, parentId: 'cat-pendants', sortOrder: 2, active: true, megaMenu: false },
  { id: 'sub-lg-pendants', slug: 'pendant-lab-grown-diamond-pendant', name: 'Lab-Grown Diamond Pendant', description: '', imageUrl: IMG.necklace3, parentId: 'cat-pendants', sortOrder: 3, active: true, megaMenu: false },
  { id: 'sub-nat-pendants', slug: 'pendant-natural-diamond-pendant', name: 'Natural Diamond Pendant', description: '', imageUrl: IMG.necklace3, parentId: 'cat-pendants', sortOrder: 4, active: true, megaMenu: false },

  { id: 'sub-lg-tennis-n', slug: 'necklace-lab-grown-diamond-tennis-necklace', name: 'Lab-Grown Diamond Tennis Necklace', description: '', imageUrl: IMG.necklace2, parentId: 'cat-necklaces', sortOrder: 1, active: true, megaMenu: false },
  { id: 'sub-lg-necklaces', slug: 'necklace-lab-grown-diamond-necklace', name: 'Lab-Grown Diamond Necklace', description: '', imageUrl: IMG.necklace1, parentId: 'cat-necklaces', sortOrder: 2, active: true, megaMenu: false },
  { id: 'sub-nat-necklaces', slug: 'necklace-natural-diamond-necklace', name: 'Natural Diamond Necklace', description: '', imageUrl: IMG.necklace2, parentId: 'cat-necklaces', sortOrder: 3, active: true, megaMenu: false },

  { id: 'sub-lg-tennis-b', slug: 'bracelet-lab-grown-diamond-tennis-bracelet', name: 'Lab-Grown Diamond Tennis Bracelet', description: '', imageUrl: IMG.bracelet2, parentId: 'cat-bracelets', sortOrder: 1, active: true, megaMenu: false },
  { id: 'sub-lg-bracelets', slug: 'bracelet-lab-grown-diamond-bracelet', name: 'Lab-Grown Diamond Bracelet', description: '', imageUrl: IMG.bracelet1, parentId: 'cat-bracelets', sortOrder: 2, active: true, megaMenu: false },
  { id: 'sub-nat-tennis-b', slug: 'bracelet-natural-diamond-tennis-bracelet', name: 'Natural Diamond Tennis Bracelet', description: '', imageUrl: IMG.bracelet2, parentId: 'cat-bracelets', sortOrder: 3, active: true, megaMenu: false },
  { id: 'sub-nat-bracelets', slug: 'bracelet-natural-diamond-bracelet', name: 'Natural Diamond Bracelet', description: '', imageUrl: IMG.bracelet1, parentId: 'cat-bracelets', sortOrder: 4, active: true, megaMenu: false },

  { id: 'sub-silver-rings', slug: 'silver-jewelry-with-24k-gold-plating-ring', name: 'Ring', description: '', imageUrl: IMG.gold, parentId: 'cat-silver', sortOrder: 1, active: true, megaMenu: false },
  { id: 'sub-silver-earrings', slug: 'silver-jewelry-with-24k-gold-plating-earring', name: 'Earring', description: '', imageUrl: IMG.earring2, parentId: 'cat-silver', sortOrder: 2, active: true, megaMenu: false },
  { id: 'sub-silver-bracelets', slug: 'silver-jewelry-with-24k-gold-plating-bracelet', name: 'Bracelet', description: '', imageUrl: IMG.bracelet1, parentId: 'cat-silver', sortOrder: 3, active: true, megaMenu: false },
  { id: 'sub-silver-pendants', slug: 'silver-jewelry-with-24k-gold-plating-pendant', name: 'Pendant', description: '', imageUrl: IMG.necklace3, parentId: 'cat-silver', sortOrder: 4, active: true, megaMenu: false }
];

export const MOCK_DESIGNERS: Designer[] = [
  { id: 'des-atelier', slug: 'lincroft-atelier', name: 'Lincroft Atelier', description: 'Our house collection — lab-grown and natural diamond jewelry from Lincroft Village Jewelers.', imageUrl: IMG.atelier, active: true },
  { id: 'des-aurora', slug: 'aurora-and-co', name: 'Aurora & Co', description: 'Sculptural diamond jewelry with a quietly contemporary silhouette.', imageUrl: IMG.ring2, active: true },
  { id: 'des-celeste', slug: 'maison-celeste', name: 'Maison Céleste', description: 'Parisian-inspired settings in 18k gold and natural diamonds.', imageUrl: IMG.necklace1, active: true },
  { id: 'des-hartwell', slug: 'hartwell', name: 'Hartwell', description: 'Heritage bands and signet jewelry with American workshop character.', imageUrl: IMG.gold, active: true },
  { id: 'des-vesper', slug: 'vesper', name: 'Vesper Silver', description: 'Sterling silver jewelry with 24k gold plating for everyday American wear.', imageUrl: IMG.gold, active: true }
];

const iso = '2026-03-12T14:00:00.000Z';

function product(p: Omit<Product, 'createdAt' | 'updatedAt' | 'status'> & { status?: Product['status'] }): Product {
  return { createdAt: iso, updatedAt: iso, status: p.status ?? 'active', ...p };
}

export const MOCK_PRODUCTS: Product[] = [
  product({
    id: 'p1', sku: 'LVJ-ER-1042', slug: 'aurora-halo-diamond-ring', name: 'Star Pattern Diamond Ring',
    description: 'A luminous round brilliant held in a finely milgrain halo, set in 18k white gold. Designed to catch light from every angle without excess. Available for viewing and sizing at our Lincroft atelier.',
    categoryId: 'cat-rings', subcategoryId: 'sub-natural-rings', designerId: 'des-aurora', designerName: 'Aurora & Co',
    price: 6280, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: true, bestSeller: true,
    tags: ['engagement', 'halo', 'diamond'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '18k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Round', 'diamond'),
      spec('carat', 'Carat', '1.01 ct', 'diamond'), spec('color', 'Color', 'F', 'diamond'),
      spec('clarity', 'Clarity', 'VS1', 'diamond'), spec('size', 'Size', '6.5 (resizable)', 'general')
    ],
    images: [media('p1-1', IMG.elise.starRing, 'Star Pattern Diamond Ring', 0, true), media('p1-2', IMG.elise.celestial, 'Star Pattern Diamond Ring', 1, false)],
    videos: [video('p1-v1', 0)]
  }),
  product({
    id: 'p2', sku: 'LVJ-ER-1108', slug: 'east-gate-solitaire', name: 'Celestial Wish Round Diamond Ring',
    description: 'A classic solitaire with a low cathedral profile, crafted in 14k yellow gold. The setting was designed in-house for comfortable daily wear.',
    categoryId: 'cat-rings', subcategoryId: 'sub-natural-rings', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 4120, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: false, bestSeller: true,
    tags: ['engagement', 'solitaire'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Oval', 'diamond'),
      spec('carat', 'Carat', '0.90 ct', 'diamond'), spec('color', 'Color', 'G', 'diamond'), spec('clarity', 'Clarity', 'VS2', 'diamond')
    ],
    images: [media('p2-1', IMG.elise.celestial, 'Celestial Wish Round Diamond Ring', 0, true), media('p2-2', IMG.elise.celestialStars, 'Celestial Wish Round Diamond Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p3', sku: 'LVJ-ER-1180', slug: 'celeste-vintage-cushion', name: 'Vintage Emerald-Cut Diamond Ring',
    description: 'An antique-inspired cushion halo with hand-engraved gallery work in 18k rose gold. A piece with presence, never costume.',
    categoryId: 'cat-rings', subcategoryId: 'sub-natural-rings', designerId: 'des-celeste', designerName: 'Maison Céleste',
    price: 8750, compareAtPrice: 9200, showPrice: true, availability: 'made_to_order', featured: true, newArrival: true, bestSeller: false,
    tags: ['engagement', 'vintage'],
    specs: [
      spec('metal', 'Metal', 'Rose Gold', 'metal'), spec('karat', 'Karat', '18k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Cushion', 'diamond'),
      spec('carat', 'Carat', '1.24 ct', 'diamond'), spec('color', 'Color', 'F', 'diamond'), spec('clarity', 'Clarity', 'VVS2', 'diamond')
    ],
    images: [media('p3-1', IMG.elise.vintageEmerald, 'Vintage Emerald-Cut Diamond Ring', 0, true), media('p3-2', IMG.elise.emeraldElegance, 'Vintage Emerald-Cut Diamond Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p4', sku: 'LVJ-ER-1211', slug: 'three-stone-emerald-ring', name: 'Enchanted Embrace Diamond Ring',
    description: 'An emerald-cut center flanked by tapered baguettes. Architectural, calm, and exceptionally wearable.',
    categoryId: 'cat-rings', subcategoryId: 'sub-natural-rings', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 9900, compareAtPrice: null, showPrice: false, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: ['engagement', 'three-stone'],
    specs: [
      spec('metal', 'Metal', 'Platinum', 'metal'), spec('karat', 'Karat', '950', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Emerald', 'diamond'),
      spec('carat', 'Carat', '1.50 ct tw', 'diamond'), spec('color', 'Color', 'E', 'diamond'), spec('clarity', 'Clarity', 'VS1', 'diamond')
    ],
    images: [media('p4-1', IMG.elise.enchanted, 'Enchanted Embrace Diamond Ring', 0, true), media('p4-2', IMG.elise.paveWhite, 'Enchanted Embrace Diamond Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p5', sku: 'LVJ-WB-2044', slug: 'hartwell-knife-edge-band', name: 'Lab-Grown Diamond Ring Band',
    description: 'A knife-edge wedding band in 14k yellow gold, finished by hand. Comfort-fit interior.',
    categoryId: 'cat-rings', subcategoryId: 'sub-lg-wedding-bands', designerId: 'des-hartwell', designerName: 'Hartwell',
    price: 980, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: true,
    tags: ['wedding', 'band'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('width', 'Width', '2.5 mm', 'dimensions'), spec('profile', 'Profile', 'Knife-edge', 'general')
    ],
    images: [media('p5-1', IMG.elise.labBand, 'Lab-Grown Diamond Ring Band', 0, true), media('p5-2', IMG.elise.yellowBand, 'Lab-Grown Diamond Ring Band', 1, false)],
    videos: []
  }),
  product({
    id: 'p6', sku: 'LVJ-WB-2090', slug: 'satin-mens-band', name: 'Men\'s Natural Diamond Ring',
    description: 'A 6mm satin-finished men’s band in 14k white gold with a polished edge.',
    categoryId: 'cat-rings', subcategoryId: 'sub-lg-wedding-bands', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 1240, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: ['wedding', 'mens'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('width', 'Width', '6 mm', 'dimensions'), spec('finish', 'Finish', 'Satin', 'general')
    ],
    images: [media('p6-1', IMG.elise.mensDiamond, 'Men\'s Natural Diamond Ring', 0, true), media('p6-2', IMG.elise.yellowVS1, 'Men\'s Natural Diamond Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p7', sku: 'LVJ-ER-3301', slug: 'dewdrop-diamond-studs', name: 'Classic Diamond Stud Earrings',
    description: 'Round brilliant diamond studs in 14k white gold with secure friction backs. A quiet essential.',
    categoryId: 'cat-earrings', subcategoryId: 'sub-studs', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 1450, compareAtPrice: 1650, showPrice: true, availability: 'in_stock', featured: true, newArrival: false, bestSeller: true,
    tags: ['earrings', 'studs'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Round', 'diamond'),
      spec('carat', 'Carat', '0.50 ctw', 'diamond'), spec('color', 'Color', 'F-G', 'diamond'), spec('clarity', 'Clarity', 'SI1', 'diamond')
    ],
    images: [media('p7-1', IMG.elise.studReview, 'Classic Diamond Stud Earrings', 0, true), media('p7-2', IMG.elise.hoopInOut, 'Classic Diamond Stud Earrings', 1, false)],
    videos: []
  }),
  product({
    id: 'p8', sku: 'LVJ-ER-3388', slug: 'crescent-gold-hoops', name: 'Lab-Grown In & Out Hoop Earrings',
    description: 'Sculpted 18k yellow gold hoops with a hollow, lightweight interior. Polished to a warm mirror finish.',
    categoryId: 'cat-earrings', subcategoryId: 'sub-lg-earrings', designerId: 'des-celeste', designerName: 'Maison Céleste',
    price: 890, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['earrings', 'hoops', 'gold'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '18k', 'metal'),
      spec('diameter', 'Diameter', '25 mm', 'dimensions'), spec('weight', 'Weight', '3.2 g', 'dimensions')
    ],
    images: [media('p8-1', IMG.elise.labHoop, 'Lab-Grown In & Out Hoop Earrings', 0, true), media('p8-2', IMG.elise.hoopInOut, 'Lab-Grown In & Out Hoop Earrings', 1, false)],
    videos: []
  }),
  product({
    id: 'p9', sku: 'LVJ-ER-3412', slug: 'willow-drop-earrings', name: '14K White Gold In & Out Hoop Earrings',
    description: 'Elongated pear-shaped drops with a mixed-cut diamond language. Evening jewelry with a light presence.',
    categoryId: 'cat-earrings', subcategoryId: 'sub-nat-earrings', designerId: 'des-aurora', designerName: 'Aurora & Co',
    price: 2380, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: true, bestSeller: false,
    tags: ['earrings', 'drops'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Pear', 'diamond'),
      spec('carat', 'Carat', '0.72 ctw', 'diamond'), spec('length', 'Length', '28 mm', 'dimensions')
    ],
    images: [media('p9-1', IMG.elise.hoopInOut, '14K White Gold In & Out Hoop Earrings', 0, true), media('p9-2', IMG.elise.tigerEarrings, '14K White Gold In & Out Hoop Earrings', 1, false)],
    videos: []
  }),
  product({
    id: 'p10', sku: 'LVJ-NK-4502', slug: 'lumen-diamond-pendant', name: 'Elegant Cross Pendant',
    description: 'A single round diamond on a fine 16–18 inch adjustable chain. Designed to sit close to the collarbone.',
    categoryId: 'cat-pendants', subcategoryId: 'sub-lg-pendants', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 1680, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: false, bestSeller: true,
    tags: ['necklace', 'pendant'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Round', 'diamond'),
      spec('carat', 'Carat', '0.25 ct', 'diamond'), spec('length', 'Chain', '16–18 in', 'dimensions')
    ],
    images: [media('p10-1', IMG.elise.crossBracelet, 'Elegant Cross Pendant', 0, true), media('p10-2', IMG.elise.tennisLab, 'Elegant Cross Pendant', 1, false)],
    videos: []
  }),
  product({
    id: 'p11', sku: 'LVJ-NK-4580', slug: 'river-tennis-necklace', name: 'Lab-Grown Diamond Tennis Necklace',
    description: 'A continuous line of round brilliant diamonds in 14k white gold. Graduated for a natural fall at the neck.',
    categoryId: 'cat-necklaces', subcategoryId: 'sub-lg-tennis-n', designerId: 'des-aurora', designerName: 'Aurora & Co',
    price: 12400, compareAtPrice: null, showPrice: true, availability: 'made_to_order', featured: true, newArrival: true, bestSeller: false,
    tags: ['necklace', 'tennis'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Round', 'diamond'),
      spec('carat', 'Carat', '5.00 ctw', 'diamond'), spec('length', 'Length', '16 in', 'dimensions')
    ],
    images: [media('p11-1', IMG.elise.tennisLab, 'Lab-Grown Diamond Tennis Necklace', 0, true), media('p11-2', IMG.elise.tennis7ct, 'Lab-Grown Diamond Tennis Necklace', 1, false)],
    videos: [video('p11-v1', 0)]
  }),
  product({
    id: 'p12', sku: 'LVJ-NK-4610', slug: 'paperclip-gold-chain', name: 'Gold Chain Necklace',
    description: 'An elongated paperclip chain in 14k yellow gold. Substantial without stiffness.',
    categoryId: 'cat-necklaces', subcategoryId: 'sub-lg-necklaces', designerId: 'des-hartwell', designerName: 'Hartwell',
    price: 1120, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['necklace', 'gold', 'chain'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('length', 'Length', '18 in', 'dimensions'), spec('weight', 'Weight', '8.4 g', 'dimensions')
    ],
    images: [media('p12-1', IMG.elise.crossBracelet, 'Gold Chain Necklace', 0, true), media('p12-2', IMG.elise.yellowNatural, 'Gold Chain Necklace', 1, false)],
    videos: []
  }),
  product({
    id: 'p13', sku: 'LVJ-BR-5104', slug: 'harbor-tennis-bracelet', name: '7ct Lab-Grown Diamond Tennis Bracelet',
    description: 'A classic tennis bracelet with a concealed box clasp and figure-eight safety. Everyday brilliance, securely made.',
    categoryId: 'cat-bracelets', subcategoryId: 'sub-lg-tennis-b', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 4200, compareAtPrice: 4550, showPrice: true, availability: 'in_stock', featured: true, newArrival: false, bestSeller: true,
    tags: ['bracelet', 'tennis'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Round', 'diamond'),
      spec('carat', 'Carat', '2.00 ctw', 'diamond'), spec('length', 'Length', '7 in', 'dimensions')
    ],
    images: [media('p13-1', IMG.elise.tennis7ct, '7ct Lab-Grown Diamond Tennis Bracelet', 0, true), media('p13-2', IMG.elise.tennisLab, '7ct Lab-Grown Diamond Tennis Bracelet', 1, false)],
    videos: [video('p13-v1', 1)]
  }),
  product({
    id: 'p14', sku: 'LVJ-BR-5166', slug: 'dune-cuff', name: 'Flexible Diamond Bracelet',
    description: 'A hammered 18k yellow gold cuff with a soft organic edge. No stones — only metal and light.',
    categoryId: 'cat-bracelets', subcategoryId: 'sub-lg-bracelets', designerId: 'des-celeste', designerName: 'Maison Céleste',
    price: 2400, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['bracelet', 'cuff', 'gold'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '18k', 'metal'),
      spec('width', 'Width', '12 mm', 'dimensions'), spec('weight', 'Weight', '18 g', 'dimensions')
    ],
    images: [media('p14-1', IMG.elise.flexBracelet1, 'Flexible Diamond Bracelet', 0, true), media('p14-2', IMG.elise.flexBracelet2, 'Flexible Diamond Bracelet', 1, false)],
    videos: []
  }),
  product({
    id: 'p14b', sku: 'LVJ-BRC-002', slug: 'lune-bezel-bracelet', name: 'Lune Bezel Bracelet',
    description: 'Round bezels linked edge to edge in rose gold. Sits closer to a chain than a tennis bracelet, and is the easier of the two to wear with a watch.',
    categoryId: 'cat-bracelets', subcategoryId: 'sub-lg-bracelets', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 1680, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: true, bestSeller: true,
    tags: ['bezel', 'everyday', 'rose-gold'],
    specs: [
      spec('metal', 'Metal', 'Rose Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Lab-Grown', 'diamond'), spec('shape', 'Shape', 'Round', 'diamond'),
      spec('carat', 'Carat', '0.85 ctw', 'diamond')
    ],
    images: [
      media('p14b-1', IMG.elise.flexBracelet2, 'Lune Bezel Bracelet', 0, true),
      media('p14b-2', IMG.elise.flexBracelet1, 'Lune Bezel Bracelet', 1, false)
    ],
    videos: [
      video(
        '8a3c765f-4ff4-4282-b7c2-ab7e2b920b64',
        1,
        'https://assets.mixkit.co/videos/34611/34611-720.mp4',
        'https://assets.mixkit.co/videos/34611/34611-thumb-720-0.jpg',
        'Lune Bezel Bracelet shown in motion'
      )
    ]
  }),
  product({
    id: 'p15', sku: 'LVJ-SG-7001', slug: 'gilded-silver-signet-ring', name: 'Gold-Plated Cross Bracelet',
    description: 'Sterling silver signet finished in 24k gold plating. An everyday look with a polished face ready for optional engraving.',
    categoryId: 'cat-silver', subcategoryId: 'sub-silver-rings', designerId: 'des-vesper', designerName: 'Vesper Silver',
    price: 320, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: false, bestSeller: false,
    tags: ['silver', 'signet', 'gold-plating'],
    specs: [
      spec('metal', 'Metal', 'Sterling Silver', 'metal'), spec('finish', 'Finish', '24k Gold Plating', 'metal'),
      spec('face', 'Face', '14 x 12 mm', 'dimensions')
    ],
    images: [media('p15-1', IMG.elise.crossBracelet, 'Gold-Plated Cross Bracelet', 0, true), media('p15-2', IMG.elise.flexBracelet3, 'Gold-Plated Cross Bracelet', 1, false)],
    videos: []
  }),
  product({
    id: 'p16', sku: 'LVJ-SG-7044', slug: 'soleil-gold-plated-hoops', name: 'Tiger Face Diamond Earrings',
    description: 'Lightweight sterling silver hoops with 24k gold plating — polished for everyday wear across the United States.',
    categoryId: 'cat-silver', subcategoryId: 'sub-silver-earrings', designerId: 'des-vesper', designerName: 'Vesper Silver',
    price: 185, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['silver', 'hoops', 'gold-plating'],
    specs: [
      spec('metal', 'Metal', 'Sterling Silver', 'metal'), spec('finish', 'Finish', '24k Gold Plating', 'metal'),
      spec('diameter', 'Diameter', '28 mm', 'dimensions')
    ],
    images: [media('p16-1', IMG.elise.tigerEarrings, 'Tiger Face Diamond Earrings', 0, true), media('p16-2', IMG.elise.hoopInOut, 'Tiger Face Diamond Earrings', 1, false)],
    videos: []
  }),
  product({
    id: 'p17', sku: 'LVJ-ER-1290', slug: 'lab-grown-oval-halo', name: 'Marquise Lab-Grown Diamond Ring',
    description: 'An oval lab-grown diamond in a discreet halo. Same atelier setting standards, with a more accessible center stone.',
    categoryId: 'cat-rings', subcategoryId: 'sub-lg-engagement', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 2890, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['engagement', 'lab-grown'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Lab-Grown', 'diamond'), spec('shape', 'Shape', 'Oval', 'diamond'),
      spec('carat', 'Carat', '1.20 ct', 'diamond'), spec('color', 'Color', 'D', 'diamond'), spec('clarity', 'Clarity', 'VS1', 'diamond')
    ],
    images: [media('p17-1', IMG.elise.marquiseLabY, 'Marquise Lab-Grown Diamond Ring', 0, true), media('p17-2', IMG.elise.marquiseLab2, 'Marquise Lab-Grown Diamond Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p18', sku: 'LVJ-NK-4702', slug: 'sapphire-drop-pendant', name: 'Sapphire & Lab-Grown Diamond Pendant Ring',
    description: 'A cornflower sapphire suspended from a diamond bail. Color chosen in person is always recommended.',
    categoryId: 'cat-pendants', subcategoryId: 'sub-nat-pendants', designerId: 'des-celeste', designerName: 'Maison Céleste',
    price: 3200, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: ['necklace', 'sapphire'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '18k', 'metal'),
      spec('gemstone', 'Gemstone', 'Sapphire', 'gemstone'), spec('diamondType', 'Diamond', 'Natural', 'diamond'),
      spec('carat', 'Carat', '1.10 ct sapphire', 'gemstone')
    ],
    images: [media('p18-1', IMG.elise.blueSapphire, 'Sapphire & Lab-Grown Diamond Pendant Ring', 0, true), media('p18-2', IMG.elise.sapphireBlue, 'Sapphire & Lab-Grown Diamond Pendant Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p19', sku: 'LVJ-ER-3505', slug: 'pearl-station-earrings', name: 'Natural Diamond Stud Pair',
    description: 'Akoya pearls with a diamond station above. Freshwater alternatives available upon request.',
    categoryId: 'cat-earrings', subcategoryId: 'sub-nat-earrings', designerId: 'des-celeste', designerName: 'Maison Céleste',
    price: 760, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: ['earrings', 'pearl'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('gemstone', 'Gemstone', 'Akoya Pearl', 'gemstone'), spec('size', 'Pearl size', '6.5 mm', 'dimensions')
    ],
    images: [media('p19-1', IMG.elise.studReview, 'Natural Diamond Stud Pair', 0, true), media('p19-2', IMG.elise.paveWhite, 'Natural Diamond Stud Pair', 1, false)],
    videos: []
  }),
  product({
    id: 'p20', sku: 'LVJ-WB-2201', slug: 'diamond-knife-band', name: 'Yellow Gold Lab-Grown Diamond Band',
    description: 'A knife-edge band with a single row of micro-pavé. Pairs with the East Gate solitaire.',
    categoryId: 'cat-rings', subcategoryId: 'sub-lg-wedding-bands', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 1680, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: false, bestSeller: true,
    tags: ['wedding', 'pave'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('carat', 'Carat', '0.28 ctw', 'diamond'),
      spec('width', 'Width', '2.3 mm', 'dimensions')
    ],
    images: [media('p20-1', IMG.elise.yellowBand, 'Yellow Gold Lab-Grown Diamond Band', 0, true), media('p20-2', IMG.elise.labBand, 'Yellow Gold Lab-Grown Diamond Band', 1, false)],
    videos: []
  }),
  product({
    id: 'p21', sku: 'LVJ-JW-8001', slug: 'signet-oval-gold', name: 'Minimalist Stacking Diamond Ring',
    description: 'A classic oval signet in 14k yellow gold, prepared for engraving or left plain.',
    categoryId: 'cat-silver', subcategoryId: 'sub-silver-rings', designerId: 'des-hartwell', designerName: 'Hartwell',
    price: 980, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: ['signet', 'gold'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('face', 'Face', '12 x 10 mm', 'dimensions')
    ],
    images: [media('p21-1', IMG.elise.stacking, 'Minimalist Stacking Diamond Ring', 0, true), media('p21-2', IMG.elise.celestial, 'Minimalist Stacking Diamond Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p22', sku: 'LVJ-BR-5220', slug: 'emerald-tennis-alt', name: 'Emerald-Cut Diamond Tennis Bracelet',
    description: 'Alternating emerald and diamond stations. A color story best seen in daylight.',
    categoryId: 'cat-bracelets', subcategoryId: 'sub-nat-tennis-b', designerId: 'des-aurora', designerName: 'Aurora & Co',
    price: 5600, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['bracelet', 'emerald'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '18k', 'metal'),
      spec('gemstone', 'Gemstone', 'Emerald', 'gemstone'), spec('diamondType', 'Diamond', 'Natural', 'diamond'),
      spec('carat', 'Carat', '3.10 ctw', 'diamond')
    ],
    images: [media('p22-1', IMG.elise.emeraldBracelet, 'Emerald-Cut Diamond Tennis Bracelet', 0, true), media('p22-2', IMG.elise.flexBracelet4, 'Emerald-Cut Diamond Tennis Bracelet', 1, false)],
    videos: []
  }),
  product({
    id: 'p23', sku: 'LVJ-ER-1422', slug: 'hidden-halo-round', name: 'Cocktail Lab-Grown Diamond Ring',
    description: 'A round brilliant with a hidden halo beneath the head — sparkle reserved for the wearer.',
    categoryId: 'cat-rings', subcategoryId: 'sub-lg-engagement', designerId: 'des-aurora', designerName: 'Aurora & Co',
    price: 5400, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: false, bestSeller: true,
    tags: ['engagement', 'hidden-halo'],
    specs: [
      spec('metal', 'Metal', 'Platinum', 'metal'), spec('karat', 'Karat', '950', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Round', 'diamond'),
      spec('carat', 'Carat', '1.00 ct', 'diamond'), spec('color', 'Color', 'G', 'diamond'), spec('clarity', 'Clarity', 'VS2', 'diamond')
    ],
    images: [media('p23-1', IMG.elise.cocktailLab, 'Cocktail Lab-Grown Diamond Ring', 0, true), media('p23-2', IMG.elise.labParty, 'Cocktail Lab-Grown Diamond Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p24', sku: 'LVJ-NK-4811', slug: 'initial-script-pendant', name: 'Heart & Circle Classic Pendant',
    description: 'A hand-drawn initial in 14k gold. Please allow two weeks for lettering.',
    categoryId: 'cat-pendants', subcategoryId: 'sub-lg-heart-circle', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 420, compareAtPrice: null, showPrice: true, availability: 'made_to_order', featured: false, newArrival: false, bestSeller: false,
    tags: ['necklace', 'initial', 'custom'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('length', 'Chain', '18 in', 'dimensions')
    ],
    images: [media('p24-1', IMG.elise.crossBracelet, 'Heart & Circle Classic Pendant', 0, true), media('p24-2', IMG.elise.butterfly, 'Heart & Circle Classic Pendant', 1, false)],
    videos: []
  }),
  product({
    id: 'p25', sku: 'LVJ-SG-7102', slug: 'field-gold-plated-cuff', name: 'Flexible Diamond Bracelet — Rose Tone',
    description: 'A sculptural sterling silver cuff with 24k gold plating. Designed for stackable, everyday American style.',
    categoryId: 'cat-silver', subcategoryId: 'sub-silver-bracelets', designerId: 'des-vesper', designerName: 'Vesper Silver',
    price: 265, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: ['silver', 'cuff', 'gold-plating'],
    specs: [
      spec('metal', 'Metal', 'Sterling Silver', 'metal'), spec('finish', 'Finish', '24k Gold Plating', 'metal'),
      spec('width', 'Width', '18 mm', 'dimensions')
    ],
    images: [media('p25-1', IMG.elise.flexBracelet5, 'Flexible Diamond Bracelet — Rose Tone', 0, true), media('p25-2', IMG.elise.flexBracelet6, 'Flexible Diamond Bracelet — Rose Tone', 1, false)],
    videos: []
  }),
  product({
    id: 'p26', sku: 'LVJ-ER-3600', slug: 'emerald-huggies', name: 'Lab-Grown Diamond Hoop Earrings',
    description: 'Petite huggies channel-set with emeralds. A color accent for daily wear.',
    categoryId: 'cat-earrings', subcategoryId: 'sub-lg-earrings', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 1100, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['earrings', 'emerald'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('gemstone', 'Gemstone', 'Emerald', 'gemstone'), spec('diameter', 'Diameter', '12 mm', 'dimensions')
    ],
    images: [media('p26-1', IMG.elise.labHoop, 'Lab-Grown Diamond Hoop Earrings', 0, true), media('p26-2', IMG.elise.studReview, 'Lab-Grown Diamond Hoop Earrings', 1, false)],
    videos: []
  }),
  product({
    id: 'p27', sku: 'LVJ-JW-8104', slug: 'stacking-band-set', name: 'Dual Diamond Stacking Rings',
    description: 'Three mixed-finish stacking rings in 14k gold. Sold as a set; individual bands available in-store.',
    categoryId: 'cat-silver', subcategoryId: 'sub-silver-rings', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 780, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: true, bestSeller: false,
    tags: ['stacking', 'gold'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('width', 'Width', '1.5–2 mm each', 'dimensions')
    ],
    images: [media('p27-1', IMG.elise.dualDiamond, 'Dual Diamond Stacking Rings', 0, true), media('p27-2', IMG.elise.stacking, 'Dual Diamond Stacking Rings', 1, false)],
    videos: []
  }),
  product({
    id: 'p28', sku: 'LVJ-BR-5308', slug: 'paperclip-bracelet', name: 'Natural Diamond Flexible Bracelet',
    description: 'A substantial paperclip bracelet with a concealed clasp. Matches the Shrewsbury chain.',
    categoryId: 'cat-bracelets', subcategoryId: 'sub-nat-bracelets', designerId: 'des-hartwell', designerName: 'Hartwell',
    price: 860, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: ['bracelet', 'gold'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('length', 'Length', '7.25 in', 'dimensions'), spec('weight', 'Weight', '7.1 g', 'dimensions')
    ],
    images: [media('p28-1', IMG.elise.flexBracelet3, 'Natural Diamond Flexible Bracelet', 0, true), media('p28-2', IMG.elise.flexBracelet1, 'Natural Diamond Flexible Bracelet', 1, false)],
    videos: []
  }),
  product({
    id: 'p29', sku: 'LVJ-ER-1500', slug: 'draft-untitled-ring', name: 'Lab-Grown Engagement Draft Ring',
    description: '',
    categoryId: 'cat-rings', subcategoryId: 'sub-lg-engagement', designerId: null, designerName: null,
    price: null, compareAtPrice: null, showPrice: false, availability: 'in_stock', featured: false, newArrival: false, bestSeller: false,
    tags: [], status: 'inactive',
    specs: [],
    images: [media('p29-1', IMG.elise.marquiseColor, 'Lab-Grown Engagement Draft Ring', 0, true), media('p29-2', IMG.elise.emeraldColor, 'Lab-Grown Engagement Draft Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p30', sku: 'LVJ-NK-4900', slug: 'ruby-halo-pendant', name: 'Color-Stone Statement Pendant Ring',
    description: 'An oval ruby in a diamond halo, suspended from an 18 inch cable chain.',
    categoryId: 'cat-pendants', subcategoryId: 'sub-nat-pendants', designerId: 'des-celeste', designerName: 'Maison Céleste',
    price: 2100, compareAtPrice: null, showPrice: true, availability: 'sold', featured: false, newArrival: false, bestSeller: false,
    tags: ['necklace', 'ruby'],
    specs: [
      spec('metal', 'Metal', 'Rose Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('gemstone', 'Gemstone', 'Ruby', 'gemstone'), spec('diamondType', 'Diamond', 'Natural', 'diamond')
    ],
    images: [media('p30-1', IMG.elise.colorStoneRing, 'Color-Stone Statement Pendant Ring', 0, true), media('p30-2', IMG.elise.emeraldElegance, 'Color-Stone Statement Pendant Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p31', sku: 'LVJ-ER-1618', slug: 'marquise-east-west', name: 'Emerald Marquise Lab-Grown Engagement Ring',
    description: 'A marquise diamond set east-west in a minimal 18k gold bezel. Distinctive without being loud.',
    categoryId: 'cat-rings', subcategoryId: 'sub-lg-engagement', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 4700, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: true, bestSeller: false,
    tags: ['engagement', 'marquise'],
    specs: [
      spec('metal', 'Metal', 'Yellow Gold', 'metal'), spec('karat', 'Karat', '18k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('shape', 'Shape', 'Marquise', 'diamond'),
      spec('carat', 'Carat', '0.85 ct', 'diamond'), spec('color', 'Color', 'H', 'diamond'), spec('clarity', 'Clarity', 'VS2', 'diamond')
    ],
    images: [media('p31-1', IMG.elise.emeraldMarquise, 'Emerald Marquise Lab-Grown Engagement Ring', 0, true), media('p31-2', IMG.elise.marquiseColor, 'Emerald Marquise Lab-Grown Engagement Ring', 1, false)],
    videos: []
  }),
  product({
    id: 'p32', sku: 'LVJ-JW-8200', slug: 'diamond-bar-necklace', name: 'Horizon Diamond Bar Necklace',
    description: 'A horizontal diamond bar on a 16 inch chain. Minimal, architectural, and easy to layer.',
    categoryId: 'cat-necklaces', subcategoryId: 'sub-nat-necklaces', designerId: 'des-aurora', designerName: 'Aurora & Co',
    price: 1320, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['necklace', 'bar'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Natural', 'diamond'), spec('carat', 'Carat', '0.18 ctw', 'diamond')
    ],
    images: [media('p32-1', IMG.elise.tennisLab, 'Horizon Diamond Bar Necklace', 0, true), media('p32-2', IMG.elise.paveWhite, 'Horizon Diamond Bar Necklace', 1, false)],
    videos: []
  }),
  product({
    id: 'p33', sku: 'LVJ-PD-4920', slug: 'lab-grown-diamond-cross-pendant', name: 'Lab-Grown Diamond Cross Pendant',
    description: 'A refined lab-grown diamond cross pendant in 14k white gold. Faithful proportions with brilliant sparkle for everyday wear across the USA.',
    categoryId: 'cat-pendants', subcategoryId: 'sub-lg-cross', designerId: 'des-atelier', designerName: 'Lincroft Atelier',
    price: 980, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: true, newArrival: true, bestSeller: false,
    tags: ['pendant', 'cross', 'lab-grown'],
    specs: [
      spec('metal', 'Metal', 'White Gold', 'metal'), spec('karat', 'Karat', '14k', 'metal'),
      spec('diamondType', 'Diamond', 'Lab-Grown', 'diamond'), spec('carat', 'Carat', '0.35 ctw', 'diamond')
    ],
    images: [media('p33-1', IMG.elise.crossBracelet, 'Lab-Grown Diamond Cross Pendant', 0, true), media('p33-2', IMG.elise.tennis7ct, 'Lab-Grown Diamond Cross Pendant', 1, false)],
    videos: []
  }),
  product({
    id: 'p34', sku: 'LVJ-SG-8301', slug: 'gilded-silver-heart-pendant', name: 'Gilded Silver Heart Pendant',
    description: 'Sterling silver heart pendant with 24k gold plating — a thoughtful gift finished for lasting everyday wear.',
    categoryId: 'cat-silver', subcategoryId: 'sub-silver-pendants', designerId: 'des-vesper', designerName: 'Vesper Silver',
    price: 220, compareAtPrice: null, showPrice: true, availability: 'in_stock', featured: false, newArrival: true, bestSeller: false,
    tags: ['silver', 'pendant', 'gold-plating'],
    specs: [
      spec('metal', 'Metal', 'Sterling Silver', 'metal'), spec('finish', 'Finish', '24k Gold Plating', 'metal')
    ],
    images: [media('p34-1', IMG.elise.butterfly, 'Gilded Silver Heart Pendant', 0, true), media('p34-2', IMG.elise.crossBracelet, 'Gilded Silver Heart Pendant', 1, false)],
    videos: []
  })
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  { id: 't1', name: 'Claire M.', location: 'Rumson, NJ', quote: 'We designed my grandmother’s diamonds into an engagement ring. The process was unhurried, and the result feels like it has always belonged to us.', rating: 5, active: true, sortOrder: 1 },
  { id: 't2', name: 'James & Priya', location: 'Middletown, NJ', quote: 'They treated a first-time buyer with the same care as a collector. We left with a band we both still look at.', rating: 5, active: true, sortOrder: 2 },
  { id: 't3', name: 'Elena V.', location: 'Red Bank, NJ', quote: 'Ring sizing, a birthday pendant, and a cleaning — all handled with the kind of attention you cannot get from a counter.', rating: 5, active: true, sortOrder: 3 },
  { id: 't4', name: 'Michael R.', location: 'Holmdel, NJ', quote: 'I came in unsure of the stone. They explained options without pressure and set a timeline that actually held.', rating: 5, active: true, sortOrder: 4 }
];

export const MOCK_SERVICES: ServiceOffering[] = [
  { id: 's1', slug: 'jewelry-repair', title: 'Jewelry Repair & Cleaning', summary: 'Restore the beauty and integrity of your cherished pieces.', description: 'Restore the beauty and integrity of your cherished pieces with our comprehensive jewelry repair and cleaning services. From prong retipping to professional ultrasonic cleaning, every piece is inspected before it leaves the bench.', imageUrl: IMG.serviceRepair, active: true, sortOrder: 1 },
  { id: 's2', slug: 'gold-buying', title: 'We Buy Gold', summary: 'Fair evaluation of gold jewelry and scrap.', description: 'We buy gold with transparent weighing and pricing. Bring your pieces in for a no-obligation evaluation and clear offer.', imageUrl: IMG.serviceGold, active: true, sortOrder: 2 },
  { id: 's3', slug: 'watch-repair', title: 'Watch Repairs', summary: 'Batteries, links, and service coordination.', description: 'Same-visit battery replacement and bracelet sizing when parts allow. Mechanical service is coordinated with trusted specialists.', imageUrl: IMG.serviceWatch, active: true, sortOrder: 3 },
  { id: 's4', slug: 'jewelry-appraisal', title: 'Appraisals', summary: 'Documented appraisals for insurance and estate.', description: 'Written appraisals prepared with current market context. Appointments recommended for multiple items.', imageUrl: IMG.serviceAppraisal, active: true, sortOrder: 4 },
  { id: 's5', slug: 'custom-jewelry-design', title: 'Custom Jewelry Design', summary: 'From sketch to setting, designed with you.', description: 'Bring an heirloom, a drawing, or simply an idea. Our atelier works with you on metal, stone, and proportion — then builds the piece in stages you can see and approve.', imageUrl: IMG.serviceCustom, active: true, sortOrder: 5 },
  { id: 's6', slug: 'diamond-buying', title: 'Diamond Buying', summary: 'Discreet purchase of diamonds and diamond jewelry.', description: 'Bring certificates when available. We evaluate cut, color, clarity, and current demand before making an offer.', imageUrl: IMG.serviceClean, active: true, sortOrder: 6 },
  { id: 's7', slug: 'engraving', title: 'Engraving & Laser Inscription', summary: 'Hand and laser engraving for rings and pendants.', description: 'Dates, coordinates, handwriting, and interior inscriptions. Lead times depend on the piece and method.', imageUrl: IMG.gold, active: true, sortOrder: 7 },
  { id: 's8', slug: 'jewelry-cleaning', title: 'Professional Cleaning', summary: 'Ultrasonic and steam cleaning with inspection.', description: 'Complimentary inspection with cleaning. Ideal before events or as seasonal care for frequently worn pieces.', imageUrl: IMG.diamond, active: true, sortOrder: 8 }
];

export const MOCK_INSTAGRAM: InstagramPost[] = [
  { id: 'ig1', imageUrl: IMG.ring2, alt: 'Halo ring in natural light', href: '#', active: true, sortOrder: 1 },
  { id: 'ig2', imageUrl: IMG.necklace1, alt: 'Gold necklace detail', href: '#', active: true, sortOrder: 2 },
  { id: 'ig3', imageUrl: IMG.earring1, alt: 'Diamond studs', href: '#', active: true, sortOrder: 3 },
  { id: 'ig4', imageUrl: IMG.watch1, alt: 'Watch cabinet', href: '#', active: true, sortOrder: 4 },
  { id: 'ig5', imageUrl: IMG.bracelet2, alt: 'Tennis bracelet', href: '#', active: true, sortOrder: 5 },
  { id: 'ig6', imageUrl: IMG.atelier, alt: 'Atelier workbench', href: '#', active: true, sortOrder: 6 }
];

export const MOCK_HOME: HomeContent = {
  heroEyebrow: 'Lincroft Village Jewelers · New Jersey',
  heroTitle: 'Lab-grown and natural diamonds from our Lincroft atelier.',
  heroSubtitle: 'Rings, earrings, pendants, necklaces, and bracelets — selected for everyday brilliance and lifelong wear.',
  heroImage: IMG.hero,
  aboutExcerpt: 'Lincroft Village Jewelers is a fine jewelry studio in Lincroft, New Jersey. We keep a considered collection on the floor and build the rest with you — one appointment at a time.'
};

export const MOCK_INQUIRIES: InquiryRecord[] = [
  {
    id: 'inq-1',
    name: 'Sarah Klein',
    email: 'sarah.k@example.com',
    phone: '(732) 555-0198',
    message: 'Could I see the Aurora Halo in person this Saturday?',
    items: [{ productId: 'p1', sku: 'LVJ-ER-1042', slug: 'aurora-halo-diamond-ring', name: 'Aurora Halo Diamond Ring', imageUrl: IMG.ring2, quantity: 1 }],
    source: 'cart',
    createdAt: '2026-08-08T15:22:00.000Z',
    status: 'new'
  }
];

export const MOCK_CUSTOM_REQUESTS: CustomJewelryRequest[] = [];

export const DEFAULT_IMPORT_MAPPING = [
  { excelHeader: 'SKU', field: 'sku', required: true },
  { excelHeader: 'Product Name', field: 'name', required: true },
  { excelHeader: 'Description', field: 'description', required: false },
  { excelHeader: 'Category', field: 'category', required: true },
  { excelHeader: 'Subcategory', field: 'subcategory', required: false },
  { excelHeader: 'Brand/Designer', field: 'designer', required: false },
  { excelHeader: 'Metal Type', field: 'metal', required: false },
  { excelHeader: 'Metal Karat', field: 'karat', required: false },
  { excelHeader: 'Diamond Type', field: 'diamondType', required: false },
  { excelHeader: 'Diamond Shape', field: 'diamondShape', required: false },
  { excelHeader: 'Diamond Carat', field: 'diamondCarat', required: false },
  { excelHeader: 'Diamond Color', field: 'diamondColor', required: false },
  { excelHeader: 'Diamond Clarity', field: 'diamondClarity', required: false },
  { excelHeader: 'Gemstone', field: 'gemstone', required: false },
  { excelHeader: 'Weight', field: 'weight', required: false },
  { excelHeader: 'Price', field: 'price', required: false },
  { excelHeader: 'Show Price', field: 'showPrice', required: false },
  { excelHeader: 'Status', field: 'status', required: false },
  ...Array.from({ length: 12 }, (_, i) => ({ excelHeader: `Image ${i + 1}`, field: `image${i + 1}`, required: false })),
  ...Array.from({ length: 3 }, (_, i) => ({ excelHeader: `Video ${i + 1}`, field: `video${i + 1}`, required: false }))
];
