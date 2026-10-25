// Static component expansion: works with Express, Python and GitHub Pages.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'case-atlas.html', 'case-b3.html', 'case-yampi.html', 'case-mercadopago.html', 'contact.html'];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const template = name => fs.readFileSync(path.join(root, 'components', `${name}.html`), 'utf8').trim();
function expandButtons(html) {
  return html.replace(/<!-- component:button (.*?) -->[\s\S]*?<!-- \/component:button -->/g, (_, json) => {
    const data = JSON.parse(json);
    if (!/^(https?:\/\/|mailto:|[\w#./-])/.test(data.href) || /^javascript:/i.test(data.href)) throw new Error('Unsupported button URL');
    const button = template('contact-button').replace(/{{(href|label|external)}}/g, (_, key) => key === 'external' ? (data.external ? ' target="_blank" rel="noopener noreferrer"' : '') : escape(data[key]));
    return `<!-- component:button ${json} -->\n${button}\n<!-- /component:button -->`;
  });
}
// Editorial case images progressively open in a same-page modal.
// Authored links stay intact; generated links follow image revisions automatically.
function expandCaseImageLinks(html) {
  return html.replace(/<main\b[\s\S]*?<\/main>/, main => main.replace(/<a\b[^>]*>[\s\S]*?<\/a>|<img\b[^>]*>/g, tag => {
    if (!tag.startsWith('<img')) {
      if (!/^<a\b[^>]*class="case-media-link"/.test(tag)) return tag;
      const image = tag.match(/<img\b[^>]*>/);
      if (!image) return tag;
      tag = image[0];
    }
    const src = tag.match(/\bsrc="([^"]+)"/);
    if (!src || !/^\/?assets\/images\//.test(src[1])) return tag;
    const alt = tag.match(/\balt="([^"]*)"/)?.[1] || 'Imagem do case';
    return `<a class="case-media-link" href="${src[1]}" aria-haspopup="dialog" aria-controls="case-image-viewer" aria-label="Ampliar: ${alt}" title="Ampliar imagem">${tag}</a>`;
  }));
}
// The home card data is the single source for related case titles/copy/images.
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const catalog = [...home.matchAll(/<!-- component:case (.*?) -->/g)].map(match => JSON.parse(match[1]));
const relatedOrder = ['Atlas', 'B3', 'Mercado Pago', 'Yampi'];
const relatedSummaries = JSON.parse(fs.readFileSync(path.join(root, 'components/related-case-summaries.json'), 'utf8'));
function renderRelatedCases(page) {
  const current = catalog.find(item => item.action.href === page);
  if (!current || !relatedOrder.includes(current.title)) throw new Error(`Missing case data: ${page}`);
  const cards = relatedOrder.filter(title => title !== current.title).map(title => {
    const data = catalog.find(item => item.title === title);
    if (!data || !relatedSummaries[title]) throw new Error(`Missing related case or summary: ${title}`);
    return template('related-case-card').replace(/{{(\w+)}}/g, (_, key) => {
      if (key === 'key') return escape(data.action.href.replace(/^case-/, '').replace(/\.html$/, ''));
      if (key === 'href') return escape(data.action.href);
      if (key === 'tag') return escape(data.pill || '');
      if (key === 'description') return escape(relatedSummaries[title].intro);
      if (key === 'metric') return escape(relatedSummaries[title].highlight);
      if (key === 'action') return `<!-- component:button ${JSON.stringify({href: data.action.href, label: 'Conhecer projeto'})} -->\n<!-- /component:button -->`;
      return escape(data[key]);
    });
  }).join('\n');
  return template('related-cases').replace('{{cards}}', cards);
}
for (const page of pages) {
  const file = path.join(root, page);
  const original = fs.readFileSync(file, 'utf8');
  let source = original;
  if (!source.includes('<!-- component:motion -->')) source = source.replace('</body>', '<!-- component:motion -->\n<!-- /component:motion -->\n</body>');
  if (!/href="styles\/motion\.css/.test(source)) source = source.replace('</head>', '<link rel="stylesheet" href="styles/motion.css?v=case-images-3">\n</head>');
  if (page.startsWith('case-')) {
    if (!source.includes('<!-- component:related-cases -->')) source = source.replace('<!-- component:footer -->', '<!-- component:related-cases -->\n<!-- /component:related-cases -->\n<!-- component:footer -->');
    if (!source.includes('styles/components/related-cases.css')) source = source.replace('</head>', '<link rel="stylesheet" href="styles/components/related-cases.css?v=related-4">\n</head>');
    if (!source.includes('<!-- component:image-viewer -->')) source = source.replace('</body>', '<!-- component:image-viewer -->\n<!-- /component:image-viewer -->\n</body>');
    if (!source.includes('styles/components/image-viewer.css')) source = source.replace('</head>', '<link rel="stylesheet" href="styles/components/image-viewer.css?v=viewer-1">\n</head>');
  }
  let html = source.replace(/<!-- component:(header|footer|motion|image-viewer|related-cases) -->[\s\S]*?<!-- \/component:\1 -->/g, (_, name) => {
    let content = name === 'related-cases' ? renderRelatedCases(page) : template(name);
    if (name === 'header') content = content.replace(/<a href="([^"]+)"(?: class="active")?>/g, (tag, href) => `<a href="${href}"${href === page ? ' class="active" aria-current="page"' : ''}>`);
    return `<!-- component:${name} -->\n${content}\n<!-- /component:${name} -->`;
  });
  html = html.replace(/<!-- component:case (.*?) -->[\s\S]*?<!-- \/component:case -->/g, (_, json) => {
    const data = JSON.parse(json);
    if (!/^hero-variant-[abc]$/.test(data.variant)) throw new Error('Unknown case variant');
    const card = template('case-card').replace(/{{(\w+)}}/g, (_, key) => {
      if (key === 'imageHref') return escape(data.action.href);
      if (key === 'imageExternal') return data.action.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      if (key === 'imageLabel') return escape(`${data.action.label} — ${data.title}`);
      if (key === 'reverse') return data.reverse ? ' case-row--reverse' : '';
      if (key === 'pill') return data.pill ? `<span class="pill">${escape(data.pill)}</span>` : '';
      // Lead is authored HTML, like the rest of the page; never use untrusted input here.
      if (key === 'lead') return data.lead;
      if (key === 'action') return `<!-- component:button ${JSON.stringify(data.action)} -->\n<!-- /component:button -->`;
      return escape(data[key]);
    });
    return `<!-- component:case ${json} -->\n${card}\n<!-- /component:case -->`;
  });
  html = expandButtons(html);
  if (page.startsWith('case-')) html = expandCaseImageLinks(html);
  html = html.replace(/[ \t]+$/gm, '');
  if (html !== original) fs.writeFileSync(file, html);
}
console.log(`Shared components and motion generated for ${pages.length} pages.`);
