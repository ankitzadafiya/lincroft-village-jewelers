/**
 * Build-time sitemap for Lincroft Village Jewelers.
 * Writes public/sitemap.xml (copied into the Netlify publish folder via Angular assets).
 *
 * Env:
 *   SITE_URL   — default https://lincroft-village-jewelers.netlify.app
 *   API_URL    — default https://lincroftjewelers.onrender.com/api
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'public', 'sitemap.xml');

const SITE = (process.env.SITE_URL || 'https://lincroft-village-jewelers.netlify.app').replace(/\/$/, '');
const API = (process.env.API_URL || 'https://lincroftjewelers.onrender.com/api').replace(/\/$/, '');

const STATIC_PATHS = [
  '/',
  '/shop',
  '/ring',
  '/earring',
  '/pendant',
  '/necklace',
  '/bracelet',
  '/silver-jewelry-with-24k-gold-plating',
  '/custom-jewelry',
  '/services',
  '/about',
  '/contact',
  '/designers'
];

function urlEntry(loc, changefreq = 'weekly', priority = '0.7') {
  const lastmod = new Date().toISOString().slice(0, 10);
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchProductSlugs() {
  const slugs = new Set();
  let page = 1;
  let totalPages = 1;
  const pageSize = 100;

  while (page <= totalPages && page <= 50) {
    const url = `${API}/products?page=${page}&pageSize=${pageSize}&sort=newest`;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(45000)
      });
      if (!res.ok) {
        console.warn(`[sitemap] products page ${page} HTTP ${res.status}`);
        break;
      }
      const body = await res.json();
      const data = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      for (const item of data) {
        if (item?.slug) slugs.add(String(item.slug));
      }
      totalPages = Number(body?.totalPages) || 1;
      if (!data.length) break;
      page += 1;
    } catch (err) {
      console.warn('[sitemap] product fetch failed:', err?.message || err);
      break;
    }
  }

  return [...slugs];
}

async function fetchDesignerSlugs() {
  try {
    const res = await fetch(`${API}/content/designers`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return [];
    const body = await res.json();
    const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    return list.map(d => d?.slug).filter(Boolean);
  } catch {
    return [];
  }
}

async function main() {
  const productSlugs = await fetchProductSlugs();
  const designerSlugs = await fetchDesignerSlugs();

  const entries = [
    ...STATIC_PATHS.map((p, i) =>
      urlEntry(`${SITE}${p === '/' ? '/' : p}`, i === 0 ? 'daily' : 'weekly', i === 0 ? '1.0' : '0.8')
    ),
    ...designerSlugs.map(slug => urlEntry(`${SITE}/designers/${slug}`, 'weekly', '0.6')),
    ...productSlugs.map(slug => urlEntry(`${SITE}/product/${slug}`, 'weekly', '0.7'))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, xml, 'utf8');
  console.log(
    `[sitemap] Wrote ${entries.length} URLs (${productSlugs.length} products, ${designerSlugs.length} designers) → ${outPath}`
  );
}

main();
