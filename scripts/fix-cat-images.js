const fs = require('fs');
const p = 'd:/Lincroft/src/app/core/mock/mock-data.ts';
let s = fs.readFileSync(p, 'utf8');
const pairs = [
  ['cat-rings', 'IMG.catRings'],
  ['cat-earrings', 'IMG.catEarrings'],
  ['cat-pendants', 'IMG.catPendants'],
  ['cat-necklaces', 'IMG.catNecklaces'],
  ['cat-bracelets', 'IMG.catBracelets'],
  ['cat-silver', 'IMG.catSilver']
];
for (const [id, img] of pairs) {
  const re = new RegExp(`(id: '${id}'[\\s\\S]*?imageUrl: )IMG\\.[a-zA-Z0-9]+`);
  s = s.replace(re, `$1${img}`);
}
fs.writeFileSync(p, s);
console.log('category images updated');
