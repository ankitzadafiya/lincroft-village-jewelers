const fs = require('fs');
const text = fs.readFileSync(
  'C:/Users/ankit/.cursor/projects/d-Lincroft/agent-tools/d6a662ea-00d1-4f7c-be73-173821d659ad.txt',
  'utf8'
);
const re = /!\[([^\]]*)\]\((https:\/\/i\.etsystatic\.com\/[^)]+il_[^)]+)\)/g;
const items = [];
let m;
while ((m = re.exec(text))) {
  const title = m[1].replace(/&#39;/g, "'").trim();
  const url = m[2].replace(/il_\d+x\d+/, 'il_1588xN');
  if (!title || title.length < 8) continue;
  if (items.some((i) => i.url === url)) continue;
  items.push({ title, url });
}
function cat(t) {
  const s = t.toLowerCase();
  if (s.includes('earring') || s.includes('hoop') || s.includes('stud')) return 'earrings';
  if (s.includes('pendant') || s.includes('cross')) return 'pendants';
  if (s.includes('necklace') || s.includes('chain')) return 'necklaces';
  if (s.includes('bracelet') || s.includes('tennis')) return 'bracelets';
  if (s.includes('ring') || s.includes('band')) return 'rings';
  return 'other';
}
const by = {};
for (const i of items) {
  const c = cat(i.title);
  (by[c] ||= []).push(i);
}
for (const [k, v] of Object.entries(by)) {
  console.log('\n==', k, v.length);
  v.slice(0, 10).forEach((x) => console.log('-', x.title.slice(0, 72), '\n ', x.url));
}
fs.writeFileSync('d:/Lincroft/.ref-willis/elise-etsy-catalog.json', JSON.stringify({ by, items }, null, 2));
console.log('\nTOTAL', items.length);
