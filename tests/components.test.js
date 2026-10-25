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
