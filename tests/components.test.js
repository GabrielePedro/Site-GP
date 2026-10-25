const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'case-atlas.html', 'case-b3.html', 'case-yampi.html', 'case-mercadopago.html', 'contact.html'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const build = () => execFileSync(process.execPath, ['scripts/build-components.js'], { cwd: root });
test('static build is repeatable and all pages share the same footer', () => {
  build();
  const first = pages.map(read);
  build();
  assert.deepEqual(pages.map(read), first);
  const footer = html => html.match(/<footer\b[\s\S]*?<\/footer>/)[0];
  for (const html of first) {
    assert.equal((html.match(/<header class="site-header"/g) || []).length, 1);
    assert.equal((html.match(/<footer class="footer-section"/g) || []).length, 1);
    assert.equal(footer(html), footer(first[0]));
    const nav = html.match(/<nav class="header-nav"[\s\S]*?<\/nav>/)[0];
    assert.match(nav, /href="case-b3.html"/);
    assert.doesNotMatch(nav, /href="case-yampi.html"/);
    assert.doesNotMatch(html, /{{\w+}}|\sstyle\s*=/i);
    assert.match(html, /styles\/style.css/);
    assert.equal((html.match(/class="custom-cursor"/g) || []).length, 1);
    assert.equal((html.match(/src="scripts\/site-motion.js/g) || []).length, 1);
    assert.equal((html.match(/href="styles\/motion.css/g) || []).length, 1);
  }
});
test('generated case cards preserve all content and valid local images', () => {
  build();
  const home = read('index.html');
  const cards = [...home.matchAll(/<!-- component:case (.*?) -->[\s\S]*?<!-- \/component:case -->/g)];
  assert.equal(cards.length, 5);
  for (const [html, json] of cards) {
    const data = JSON.parse(json);
    assert.ok(fs.existsSync(path.join(root, data.image)), data.image);
    assert.ok(html.includes(data.lead));
    assert.match(html, /class="case-left"/);
    assert.match(html, /class="case-right"/);
    assert.match(html, /class="cb-link"/);
    const imageLink = html.match(/<a class="case-hero case-image-link[^"]*"([^>]*)>/);
    assert.ok(imageLink, `${data.title}: missing image link`);
    const button = html.match(/<a class="cb-link"([^>]*)>/);
    assert.equal(imageLink[1].match(/href="([^"]*)"/)[1], button[1].match(/href="([^"]*)"/)[1]);
    assert.equal(imageLink[1].includes('target="_blank"'), button[1].includes('target="_blank"'));
    assert.match(imageLink[1], /aria-label="[^"]+"/);
  }
});
test('Mercado Pago contains the supplied overview and four real image panels', () => {
  build();
  const html = read('case-mercadopago.html');
  const main = html.match(/<main[\s\S]*?<\/main>/)[0];
  for (const value of ['2024, ago – out', 'Product Designer · UX Research · UI Design', 'UX Research, Análise Heurística, Fluxos, Microcopy, Testes A/B.', 'Projeto com resultados documentados.', '+21pp de compreensão', '+6pp na taxa de pagamento em atraso', '–18% de chamados no suporte', '+9pp de clareza percebida']) assert.ok(main.includes(value), value);
  assert.equal([...main.matchAll(/<figure class="mp-showcase /g)].length, 4);
  assert.doesNotMatch(main, /placehold\.co|\sstyle\s*=/i);
  const images = [...main.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)];
  assert.equal(images.length, 10);
  assert.ok(main.indexOf('class="mp-results"') < main.indexOf('class="mp-gallery"'));
  assert.doesNotMatch(main.match(/<section class="mp-overview"[\s\S]*?<\/section>/)[0], /Resultados/);
  assert.equal([...main.matchAll(/class="mp-result-icon"[^>]+width="100" height="100"/g)].length, 4);
  for (const [tag, src] of images) {
    assert.ok(fs.existsSync(path.join(root, src.split('?')[0])), src);
    assert.match(tag, /alt="[^"]+"/);
    assert.match(tag, /width="\d+"/);
    assert.match(tag, /height="\d+"/);
  }
});
test('case images share a same-page viewer, without changing home cards', () => {
  build();
  for (const page of pages.filter(page => page.startsWith('case-'))) {
    const main = read(page).match(/<main[\s\S]*?<\/main>/)[0];
    const images = [...main.matchAll(/<img[^>]+src="(assets\/images\/[^"]+)"[^>]*>/g)];
    const links = [...main.matchAll(/<a class="case-media-link"([^>]*)>(<img[^>]*>)<\/a>/g)];
    assert.ok(images.length > 0, page);
    assert.equal(links.length, images.length, page);
    assert.equal((read(page).match(/<dialog id="case-image-viewer"/g) || []).length, 1);
    for (const [, attrs, img] of links) {
      assert.equal(attrs.match(/href="([^"]+)"/)[1], img.match(/src="([^"]+)"/)[1]);
      assert.doesNotMatch(attrs, /target="_blank"/);
      assert.match(attrs, /aria-haspopup="dialog"/);
      assert.match(attrs, /aria-controls="case-image-viewer"/);
    }
  }
  assert.doesNotMatch(read('index.html'), /class="case-media-link"/);
});
test('related cases exclude the current case and use the right summaries in the requested order', () => {
  build();
  const catalog = [...read('index.html').matchAll(/<!-- component:case (.*?) -->/g)].map(m => JSON.parse(m[1]));
  const order = ['Atlas', 'B3', 'Mercado Pago', 'Yampi'];
  const summaries = JSON.parse(read('components/related-case-summaries.json'));
  for (const current of catalog.filter(item => order.includes(item.title))) {
    const html = read(current.action.href);
    const section = html.match(/<!-- component:related-cases -->([\s\S]*?)<!-- \/component:related-cases -->/)[1];
    const expected = order.filter(title => title !== current.title);
    const cards = [...section.matchAll(/<article class="related-card"[\s\S]*?<\/article>/g)].map(m => m[0]);
    assert.equal(cards.length, 3, current.title);
    assert.deepEqual(cards.map(card => card.match(/<h3[^>]*>(.*?)<\/h3>/)[1]), expected);
    for (let i = 0; i < cards.length; i++) {
      const data = catalog.find(item => item.title === expected[i]);
      assert.ok(cards[i].includes(summaries[data.title].intro));
      assert.ok(cards[i].includes(summaries[data.title].highlight));
      assert.ok(cards[i].includes(data.pill));
      const media = cards[i].match(/<a class="related-card__media case-image-link"[^>]*href="([^"]+)"/)[1];
      const button = cards[i].match(/<a class="cb-link"[^>]*href="([^"]+)"/)[1];
      assert.equal(media, data.action.href);
      assert.equal(button, data.action.href);
      assert.match(cards[i], /Conhecer projeto/);
      assert.doesNotMatch(cards[i], /class="case-media-link"/);
    }
    assert.ok(html.indexOf('<!-- component:related-cases -->') < html.indexOf('<!-- component:footer -->'));
  }
  for (const page of ['index.html', 'contact.html']) assert.doesNotMatch(read(page), /class="related-cases"/);
});
test('inline style check rejects a real violation', () => {
  const fixture = path.join(root, 'tests', 'inline-fixture.html');
  try {
    fs.writeFileSync(fixture, '<p style="margin: 20px">invalid</p>');
    assert.throws(() => execFileSync('bash', ['scripts/check-inline-styles.sh'], {cwd: root, stdio: 'pipe'}), error => error.status === 1);
  } finally { fs.rmSync(fixture, {force: true}); }
  execFileSync('bash', ['scripts/check-inline-styles.sh'], {cwd: root});
});
