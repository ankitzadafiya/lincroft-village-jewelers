const fs = require('fs');
const path = 'd:/Lincroft/src/app/core/mock/mock-data.ts';
let s = fs.readFileSync(path, 'utf8');

// Brand / store config
s = s.replace(/storeName: 'Lincroft Village Jewelers'/, "storeName: 'Elise Jewelry'");
s = s.replace(
  /tagline: '[^']*'/,
  "tagline: 'Lab-grown & natural diamond jewelry from New York.'"
);
s = s.replace(/email: 'hello@lincroftjewelers.com'/, "email: 'info@elisejewelry.com'");
s = s.replace(
  /addressLine: '615 Newman Springs Road'/,
  "addressLine: 'New York, NY'"
);
s = s.replace(/city: 'Lincroft'/, "city: 'New York'");
s = s.replace(/region: 'NJ'/, "region: 'NY'");
s = s.replace(/postalCode: '07738'/, "postalCode: '10001'");
s = s.replace(
  /mapsUrl: '[^']*'/,
  "mapsUrl: 'https://maps.google.com/?q=Elise+Jewelry+NYC'"
);

// Category images — use Elise category keys
s = s.replace(/imageUrl: IMG\.catEngagement/, 'imageUrl: IMG.catRings');
s = s.replace(
  /{ id: 'cat-rings', slug: 'rings', name: 'Rings', description: '[^']*', imageUrl: IMG\.[^,]+/,
  `{ id: 'cat-rings', slug: 'rings', name: 'Rings', description: 'Lab-grown engagement rings, lab-grown wedding bands, and natural diamond rings from Elise Jewelry NYC.', imageUrl: IMG.catRings`
);
s = s.replace(
  /{ id: 'cat-earrings', slug: 'earrings', name: 'Earrings', description: '[^']*', imageUrl: IMG\.[^,]+/,
  `{ id: 'cat-earrings', slug: 'earrings', name: 'Earrings', description: 'Lab-grown and natural diamond earrings and classic studs.', imageUrl: IMG.catEarrings`
);
s = s.replace(
  /{ id: 'cat-pendants', slug: 'pendants', name: 'Pendants', description: '[^']*', imageUrl: IMG\.[^,]+/,
  `{ id: 'cat-pendants', slug: 'pendants', name: 'Pendants', description: 'Lab-grown diamond crosses, heart and circle classics, and natural diamond pendants.', imageUrl: IMG.catPendants`
);
s = s.replace(
  /{ id: 'cat-necklaces', slug: 'necklaces', name: 'Necklaces', description: '[^']*', imageUrl: IMG\.[^,]+/,
  `{ id: 'cat-necklaces', slug: 'necklaces', name: 'Necklaces', description: 'Lab-grown and natural diamond necklaces, including tennis styles.', imageUrl: IMG.catNecklaces`
);
s = s.replace(
  /{ id: 'cat-bracelets', slug: 'bracelets', name: 'Bracelets', description: '[^']*', imageUrl: IMG\.[^,]+/,
  `{ id: 'cat-bracelets', slug: 'bracelets', name: 'Bracelets', description: 'Lab-grown and natural diamond tennis bracelets and everyday bracelets.', imageUrl: IMG.catBracelets`
);
s = s.replace(
  /{ id: 'cat-silver', slug: 'silver-gold-plating', name: 'Silver Jewelry with 24k Gold Plating', description: '[^']*', imageUrl: IMG\.[^,]+/,
  `{ id: 'cat-silver', slug: 'silver-gold-plating', name: 'Silver Jewelry with 24k Gold Plating', description: 'Sterling silver jewelry finished with 24k gold plating.', imageUrl: IMG.catSilver`
);

// Designers → Elise house brand
s = s.replace(
  /{ id: 'des-atelier', slug: 'lincroft-atelier', name: 'Lincroft Atelier', description: '[^']*', imageUrl: IMG\.[^,]+, active: true }/,
  `{ id: 'des-atelier', slug: 'elise-jewelry', name: 'Elise Jewelry', description: 'Our house collection — lab-grown and natural diamond jewelry from Elise Jewelry NYC.', imageUrl: IMG.atelier, active: true }`
);

s = s.replace(
  /heroEyebrow: '[^']*'/,
  "heroEyebrow: 'Elise Jewelry · New York'"
);
s = s.replace(
  /heroTitle: '[^']*'/,
  "heroTitle: 'Lab-grown and natural diamonds from our NYC atelier.'"
);
s = s.replace(
  /heroSubtitle: '[^']*'/,
  "heroSubtitle: 'Rings, earrings, pendants, necklaces, and bracelets — photos from our EliseJewelryNYC shop until the full catalog is live.'"
);
s = s.replace(
  /aboutExcerpt: '[^']*'/,
  "aboutExcerpt: 'Elise Jewelry designs and sells lab-grown and natural diamond jewelry across the United States. Browse the same pieces featured in our EliseJewelryNYC Etsy shop.'"
);

fs.writeFileSync(path, s);
console.log('config/categories updated');
