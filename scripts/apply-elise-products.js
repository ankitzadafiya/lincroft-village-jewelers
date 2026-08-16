/**
 * Rebuild MOCK_PRODUCTS gallery images + names from Elise Etsy photos.
 */
const fs = require('fs');
const path = 'd:/Lincroft/src/app/core/mock/mock-data.ts';
let s = fs.readFileSync(path, 'utf8');

/** Map product id -> [name, imageKeys[], category hints already set] */
const updates = {
  p1: ['Star Pattern Diamond Ring', ['elise.starRing', 'elise.celestial']],
  p2: ['Celestial Wish Round Diamond Ring', ['elise.celestial', 'elise.celestialStars']],
  p3: ['Vintage Emerald-Cut Diamond Ring', ['elise.vintageEmerald', 'elise.emeraldElegance']],
  p4: ['Enchanted Embrace Diamond Ring', ['elise.enchanted', 'elise.paveWhite']],
  p5: ['Lab-Grown Diamond Ring Band', ['elise.labBand', 'elise.yellowBand']],
  p6: ["Men's Natural Diamond Ring", ['elise.mensDiamond', 'elise.yellowVS1']],
  p7: ['Classic Diamond Stud Earrings', ['elise.studReview', 'elise.hoopInOut']],
  p8: ['Lab-Grown In & Out Hoop Earrings', ['elise.labHoop', 'elise.hoopInOut']],
  p9: ['14K White Gold In & Out Hoop Earrings', ['elise.hoopInOut', 'elise.tigerEarrings']],
  p10: ['Elegant Cross Pendant', ['elise.crossBracelet', 'elise.tennisLab']],
  p11: ['Lab-Grown Diamond Tennis Necklace', ['elise.tennisLab', 'elise.tennis7ct']],
  p12: ['Gold Chain Necklace', ['elise.crossBracelet', 'elise.yellowNatural']],
  p13: ['7ct Lab-Grown Diamond Tennis Bracelet', ['elise.tennis7ct', 'elise.tennisLab']],
  p14: ['Flexible Diamond Bracelet', ['elise.flexBracelet1', 'elise.flexBracelet2']],
  p15: ['Gold-Plated Cross Bracelet', ['elise.crossBracelet', 'elise.flexBracelet3']],
  p16: ['Tiger Face Diamond Earrings', ['elise.tigerEarrings', 'elise.hoopInOut']],
  p17: ['Marquise Lab-Grown Diamond Ring', ['elise.marquiseLabY', 'elise.marquiseLab2']],
  p18: ['Sapphire & Lab-Grown Diamond Pendant Ring', ['elise.blueSapphire', 'elise.sapphireBlue']],
  p19: ['Natural Diamond Stud Pair', ['elise.studReview', 'elise.paveWhite']],
  p20: ['Yellow Gold Lab-Grown Diamond Band', ['elise.yellowBand', 'elise.labBand']],
  p21: ['Minimalist Stacking Diamond Ring', ['elise.stacking', 'elise.celestial']],
  p22: ['Emerald-Cut Diamond Tennis Bracelet', ['elise.emeraldBracelet', 'elise.flexBracelet4']],
  p23: ['Cocktail Lab-Grown Diamond Ring', ['elise.cocktailLab', 'elise.labParty']],
  p24: ['Heart & Circle Classic Pendant', ['elise.crossBracelet', 'elise.butterfly']],
  p25: ['Flexible Diamond Bracelet — Rose Tone', ['elise.flexBracelet5', 'elise.flexBracelet6']],
  p26: ['Lab-Grown Diamond Hoop Earrings', ['elise.labHoop', 'elise.studReview']],
  p27: ['Dual Diamond Stacking Rings', ['elise.dualDiamond', 'elise.stacking']],
  p28: ['Natural Diamond Flexible Bracelet', ['elise.flexBracelet3', 'elise.flexBracelet1']],
  p29: ['Lab-Grown Engagement Draft Ring', ['elise.marquiseColor', 'elise.emeraldColor']],
  p30: ['Color-Stone Statement Pendant Ring', ['elise.colorStoneRing', 'elise.emeraldElegance']],
  p31: ['Emerald Marquise Lab-Grown Engagement Ring', ['elise.emeraldMarquise', 'elise.marquiseColor']],
  p32: ['Horizon Diamond Bar Necklace', ['elise.tennisLab', 'elise.paveWhite']],
  p33: ['Lab-Grown Diamond Cross Pendant', ['elise.crossBracelet', 'elise.tennis7ct']],
  p34: ['Gilded Silver Heart Pendant', ['elise.butterfly', 'elise.crossBracelet']]
};

function toImgExpr(key) {
  // elise.starRing -> IMG.elise.starRing
  if (key.startsWith('elise.')) return `IMG.${key}`;
  return `IMG.${key}`;
}

for (const [id, [name, imgs]] of Object.entries(updates)) {
  // Update name
  const nameRe = new RegExp(`(id: '${id}'[\\s\\S]*?name: ')[^']*'`);
  const next = s.replace(nameRe, `$1${name.replace(/'/g, "\\'")}'`);
  if (next === s) console.warn('name miss', id);
  s = next;

  // Replace designerName Lincroft Atelier -> Elise Jewelry for these
  s = s.replace(
    new RegExp(`(id: '${id}'[\\s\\S]*?designerName: ')Lincroft Atelier'`),
    `$1Elise Jewelry'`
  );

  // Replace images array block — match images: [ ... ],
  const imgRe = new RegExp(`(id: '${id}'[\\s\\S]*?images: )\\[[\\s\\S]*?\\](,\\s*videos:)`);
  const media = imgs
    .map(
      (k, i) =>
        `media('${id}-${i + 1}', ${toImgExpr(k)}, '${name.replace(/'/g, "\\'")}', ${i}, ${i === 0})`
    )
    .join(', ');
  const next2 = s.replace(imgRe, `$1[${media}]$2`);
  if (next2 === s) console.warn('images miss', id);
  s = next2;
}

// Global replace remaining Lincroft Atelier designer labels
s = s.replace(/designerName: 'Lincroft Atelier'/g, "designerName: 'Elise Jewelry'");
s = s.replace(/Lincroft atelier/gi, 'Elise Jewelry NYC atelier');
s = s.replace(/our Lincroft atelier/gi, 'our NYC atelier');

fs.writeFileSync(path, s);
console.log('products remounted with Elise photos');
