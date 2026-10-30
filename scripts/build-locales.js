/* Generate static US English and Latin American Spanish pages from the Portuguese source. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const site = 'https://gabrielepedro.com/';
const locales = [{lang: 'pt-BR', dir: ''}, {lang: 'en-US', dir: 'en/'}, {lang: 'es-419', dir: 'es/'}];
const decode = text => text.replace(/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi, entity => {
 const known = {'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '};
 return known[entity] ?? String.fromCodePoint(entity.startsWith('&#x') ? parseInt(entity.slice(3),16) : parseInt(entity.slice(2),10));
});
const normalize = value => decode(value).trim().replace(/\s+/g, ' ');
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function seo(page, current) {
 return '<!-- locale-seo -->\n' + `<link rel="canonical" href="${site}${current.dir}${page}">\n` + locales.map(locale => `<link rel="alternate" hreflang="${locale.lang}" href="${site}${locale.dir}${page}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${site}${page}">\n<!-- /locale-seo -->`;
}
function buildLocales(pages) {
 for (const page of pages) {
  const file = path.join(root,page);
  let source = fs.readFileSync(file,'utf8').replace(/<!-- locale-seo -->[\s\S]*?<!-- \/locale-seo -->\s*/g, '');
  const original = source;
  source = source.replace('</head>', seo(page,locales[0])+'\n</head>');
  if (fs.readFileSync(file,'utf8') !== source) fs.writeFileSync(file,source);
  for (const locale of locales.slice(1)) {
   const dictionary = JSON.parse(fs.readFileSync(path.join(root,'locales',locale.lang+'.json'),'utf8'));
   const translate = value => {
    const key = normalize(value);
    if (!key) return value;
    if (!Object.hasOwn(dictionary,key)) throw new Error(`Missing ${locale.lang} translation in ${page}: ${key}`);
    return value.match(/^\s*/)[0] + escape(dictionary[key]) + value.match(/\s*$/)[0];
   };
   let skip = false;
   let html = original.split(/(<!--[\s\S]*?-->|<[^>]+>)/g).map(token => {
    if (token.startsWith('<!--')) return ''; // Build metadata stays in source pages only.
    if (token.startsWith('<')) {
     if (/^<(script|style)\b/i.test(token)) skip = true;
     if (/^<\/(script|style)\b/i.test(token)) skip = false;
     let tag = token.replace(/\b(alt|aria-label|title|placeholder)="([^"]*)"/g, (_, attr, value) => `${attr}="${translate(value)}"`);
     if (/^<meta\b/.test(tag) && /name="(?:description|keywords)"/.test(tag)) tag = tag.replace(/content="([^"]*)"/, (_, value) => `content="${translate(value)}"`);
     if (/^<html\b/.test(tag)) tag = tag.replace(/lang="[^"]*"/, `lang="${locale.lang}"`);
     if (/^<a\b/.test(tag) && !tag.includes('data-language=')) tag = tag.replace(/href="([^"]+)"/, (_, href) => pages.includes(href.split(/[?#]/)[0]) ? `href="${locale.dir}${href}"` : `href="${href}"`);
     if (/^<a\b/.test(tag) && tag.includes('data-language=')) {
      tag = tag.replace(/ aria-current="true"/g, '');
      if (tag.includes(`data-language="${locale.lang}"`)) tag = tag.replace('>', ' aria-current="true">');
     }
     return tag;
    }
    return skip ? token : translate(token);
   }).join('');
   if (locale.lang === 'en-US' && page === 'index.html') {
    html = html.replace('people and businesses</div>', 'people and <span class="hero-last-word">businesses</span></div>');
   }
   html = html.replace(/(<span class="current-language"[^>]*>).*?(<\/span>)/, (_, open, close) => open + (locale.lang === 'en-US' ? 'English' : 'Español') + close);
   html = html.replace('</head>', seo(page,locale)+'\n</head>').replace(/<head>/,'<head>\n<base href="../">');
   const out = path.join(root,locale.dir,page);
   fs.mkdirSync(path.dirname(out),{recursive:true});
   if (!fs.existsSync(out) || fs.readFileSync(out,'utf8') !== html) fs.writeFileSync(out,html);
  }
 }
 console.log('Static en-US and es-419 pages generated.');
}
module.exports = {buildLocales};
