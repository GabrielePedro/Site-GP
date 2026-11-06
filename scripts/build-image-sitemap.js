/* Expose public portfolio images to search engines; unlisted V2 pages stay excluded. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const site = 'https://gabrielepedro.com/';
const xml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function buildImageSitemap(pages) {
 const entries = [];
 for (const dir of ['', 'en/', 'es/']) for (const page of pages) {
  const file = path.join(root, dir, page);
  let html = fs.readFileSync(file, 'utf8');
  const preview = '<meta name="robots" content="index,follow,max-image-preview:large">';
  if (!html.includes(preview)) {
   html = html.replace('</head>', preview + '\n</head>');
   fs.writeFileSync(file, html);
  }
  const images = new Set();
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || '';
  for (const [, src] of main.matchAll(/<img\b[^>]*\bsrc="(assets\/images\/[^"?#]+)(?:[^" ]*)"/g)) {
   if (/\/Atlas\/(?:festa|reducao|NPS|mundo)\.png$|\/Mercado-Pago\/(?:08|09|10|11)-/.test(src)) continue;
   if (!fs.existsSync(path.join(root, src))) throw new Error(`Missing sitemap image: ${src}`);
   images.add(new URL(src, site).href);
  }
  entries.push('  <url>\n    <loc>' + xml(site + dir + page) + '</loc>\n' + [...images].map(src => '    <image:image><image:loc>' + xml(src) + '</image:loc></image:image>').join('\n') + '\n  </url>');
 }
 const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + entries.join('\n') + '\n</urlset>\n';
 fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
 console.log('Public page and image sitemap generated.');
}
module.exports = {buildImageSitemap};
