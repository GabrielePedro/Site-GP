// Static component expansion: works with Express, Python and GitHub Pages.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'case-atlas.html', 'case-yampi.html', 'case-mercadopago.html', 'contact.html'];
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
for (const page of pages) {
  const file = path.join(root, page);
  const original = fs.readFileSync(file, 'utf8');
  let source = original;
  if (!source.includes('<!-- component:motion -->')) source = source.replace('</body>', '<!-- component:motion -->\n<!-- /component:motion -->\n</body>');
  if (!/href="styles\/motion\.css/.test(source)) source = source.replace('</head>', '<link rel="stylesheet" href="styles/motion.css?v=site-motion-1">\n</head>');
  let html = source.replace(/<!-- component:(header|footer|motion) -->[\s\S]*?<!-- \/component:\1 -->/g, (_, name) => {
    let content = template(name);
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
  html = html.replace(/[ \t]+$/gm, '');
  if (html !== original) fs.writeFileSync(file, html);
}
console.log('Shared components and motion generated for 5 pages.');
