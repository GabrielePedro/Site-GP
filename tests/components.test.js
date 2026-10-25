const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'case-atlas.html', 'case-yampi.html', 'case-mercadopago.html', 'contact.html'];
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
  for (const value of ['2024, ago – out', 'Product Designer · UX Research · UI Design', 'UX Research, Análise Heurística, Fluxos, Microcopy, Testes A/B.', 'Projeto com resultados documentados.', '+21 pontos percentuais', '+6 pontos percentuais', '−18%']) assert.ok(main.includes(value), value);
  assert.equal([...main.matchAll(/<figure class="mp-showcase /g)].length, 4);
  assert.doesNotMatch(main, /placehold\.co|\sstyle\s*=/i);
  const images = [...main.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)];
  assert.equal(images.length, 6);
  for (const [tag, src] of images) {
    assert.ok(fs.existsSync(path.join(root, src)), src);
    assert.match(tag, /alt="[^"]+"/);
    assert.match(tag, /width="\d+"/);
    assert.match(tag, /height="\d+"/);
  }
});
test('inline style check rejects a real violation', () => {
  const fixture = path.join(root, 'tests', 'inline-fixture.html');
  try {
    fs.writeFileSync(fixture, '<p style="margin: 20px">invalid</p>');
    assert.throws(() => execFileSync('bash', ['scripts/check-inline-styles.sh'], {cwd: root, stdio: 'pipe'}), error => error.status === 1);
  } finally { fs.rmSync(fixture, {force: true}); }
  execFileSync('bash', ['scripts/check-inline-styles.sh'], {cwd: root});
});
