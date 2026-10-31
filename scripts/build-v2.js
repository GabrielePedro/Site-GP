/* Hidden alternate case pages. Current public pages remain the source for shared artwork. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const cases = ['case-mercadopago.html', 'case-b3.html', 'case-atlas.html', 'case-yampi.html'];
const locales = [{lang: 'pt-BR', dir: ''}, {lang: 'en-US', dir: 'en/'}, {lang: 'es-419', dir: 'es/'}];
function buildV2() {
 const content = JSON.parse(fs.readFileSync(path.join(root, 'components/v2/process-content.json'), 'utf8'));
 for (const locale of locales) {
  for (const page of cases) {
   let html = fs.readFileSync(path.join(root, locale.dir, page), 'utf8');
   html = html.replace(/<!-- locale-seo -->[\s\S]*?<!-- \/locale-seo -->/g, '');
   html = html.replace(/<!--[\s\S]*?-->/g, '');
   html = html.replace(/<base\b[^>]*>\s*/g, '');
   const base = locale.dir ? '../../' : '../';
   html = html.replace('<head>', `<head>\n<base href="${base}">\n<meta name="robots" content="noindex,nofollow">`);
   // All paths resolve from the site root because of <base>. Home remains the current home.
   html = html.replace(/href="((?:en\/|es\/)?case-[\w-]+\.html)"/g, (_, href) => `href="v2/${href}"`);
   if (page === 'case-atlas.html' && locale.lang === 'pt-BR') {
    const hero = html.match(/<section class="atlas-hero"[\s\S]*?<\/section>/)[0];
    const results = html.match(/<section class="atlas-results"[\s\S]*?<\/section>/)[0];
    const alternate = fs.readFileSync(path.join(root, 'components/v2/atlas.pt-BR.html'), 'utf8').replace('{{atlas-results}}', results);
    html = html.replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/, (_, open, close) => open + hero + alternate + close);
    html = html.replace('</head>', '<link rel="stylesheet" href="styles/components/atlas-v2.css?v=5">\n</head>');
   }
   const process = content[locale.lang]?.[page]?.trim();
   if (process) {
    if (/\sstyle\s*=/i.test(process)) throw new Error(`Inline style in V2 process content: ${page}`);
    html = html.replace(/(<section class="(?:atlas|b3|mp)-gallery"|<section class="prototype-block\b)/, `${process}\n$1`);
   }
   const file = path.join(root, 'v2', locale.dir, page);
   fs.mkdirSync(path.dirname(file), {recursive: true});
   if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) fs.writeFileSync(file, html);
  }
 }
 console.log('12 unlisted V2 case pages generated; alternate content applied where supplied.');
}
module.exports = {buildV2};
