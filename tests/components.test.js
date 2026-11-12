const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'case-atlas.html', 'case-b3.html', 'case-yampi.html', 'case-mercadopago.html'];
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
    assert.deepEqual([...nav.matchAll(/href="([^"]+)"/g)].map(m => m[1]), ['case-mercadopago.html', 'case-b3.html', 'case-atlas.html']);
    assert.doesNotMatch(nav, /href="case-yampi.html"|href="index.html"/);
    assert.match(html, /<details class="language-switcher">/);
    assert.match(html, /class="brand-logo" href="index.html"/);
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
  assert.deepEqual(cards.slice(0, 3).map(([, json]) => JSON.parse(json).title), ['Mercado Pago', 'B3', 'Atlas']);
  for (const [html, json] of cards) {
    const data = JSON.parse(json);
    assert.ok(fs.existsSync(path.join(root, data.image.split('?')[0])), data.image);
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
test('Mercado Pago contains the supplied overview and seven real image panels', () => {
  build();
  const html = read('case-mercadopago.html');
  const main = html.match(/<main[\s\S]*?<\/main>/)[0];
  for (const value of ['2024, ago – out', 'Analisei reclamações, mapeei a jornada e desenhei uma alternativa de fluxo e duas de comunicação.', 'Pesquisa documental, análise heurística, regras de negócio, fluxos, UX Writing e UI, Testes A/B.', 'Projeto com resultados documentados.', '+21pp de compreensão', '+6pp na taxa de pagamento em atraso', '–18% de chamados no suporte', '+9pp de clareza percebida']) assert.ok(main.includes(value), value);
  assert.equal([...main.matchAll(/<figure class="mp-showcase"/g)].length, 7);
  assert.doesNotMatch(main, /placehold\.co|\sstyle\s*=/i);
  const images = [...main.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)];
  assert.equal(images.length, 13);
  assert.equal((main.match(/width="2280" height="1400"/g) || []).length, 7);
  assert.ok(main.indexOf('class="mp-results"') < main.indexOf('class="mp-gallery"'));
  assert.doesNotMatch(main.match(/<section class="mp-overview(?: mp-overview--revised)?"[\s\S]*?<\/section>/)[0], /Resultados/);
  assert.equal([...main.matchAll(/class="mp-result-icon"[^>]+width="53" height="53"/g)].length, 4);
  for (const [tag, src] of images) {
    assert.ok(fs.existsSync(path.join(root, src.split('?')[0])), src);
    assert.match(tag, /alt="[^"]+"/);
    assert.match(tag, /width="\d+"/);
    assert.match(tag, /height="\d+"/);
  }
});
test('Atlas presents the supplied context and visible Figma results before the gallery', () => {
  build();
  const main = read('case-atlas.html').match(/<main[\s\S]*?<\/main>/)[0];
  assert.doesNotMatch(main, /Conteúdo do case Atlas/);
  for (const value of ['2025, mai –jun', 'Implementado em produção, com resultados reportados.', '+22% na taxa de conclusão', 'Tempo médio caiu cerca de 93%', 'Redução de 30%', 'Lovable']) assert.ok(main.includes(value), value);
  assert.equal((main.match(/class="atlas-result-card"/g) || []).length, 4);
  assert.equal((main.match(/width="2280" height="1400"/g) || []).length, 5);
  assert.ok(main.indexOf('class="atlas-results') < main.indexOf('class="atlas-gallery"'));
});
test('B3 uses its supplied case content, four full-resolution panels and requested result icons', () => {
 build();
 const main = read('case-b3.html').match(/<main[\s\S]*?<\/main>/)[0];
 for (const copy of ['−32% de abandono', '−41% de cancelamentos', '−27% no tempo', '−35% nos erros', 'Google Analytics', 'Microsoft Clarity', '2025–2026']) assert.ok(main.includes(copy), copy);
 const cards = [...main.matchAll(/<li class="b3-result-card">[\s\S]*?<\/li>/g)].map(m => m[0]);
 const icons = ['Atlas/festa.png', 'Mercado-Pago/09-Gabriele-Pedro-Mercado_pago.png', 'Atlas/reducao.png', 'Atlas/NPS.png'];
 assert.equal(cards.length, 4);
 cards.forEach((card, i) => assert.ok(card.includes(icons[i])));
 assert.equal((main.match(/width="4560" height="3200"/g) || []).length, 4);
 assert.ok(main.indexOf('class="b3-results"') < main.indexOf('class="b3-gallery"'));
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
  const order = ['Mercado Pago', 'B3', 'Atlas', 'Yampi'];
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
  assert.doesNotMatch(read('index.html'), /class="related-cases"/);
});
test('localized pages cover all five routes, preserve locale navigation and include translated metadata', () => {
 build();
 for (const [dir, lang] of [['en', 'en-US'], ['es', 'es-419']]) {
  for (const page of pages) {
   const html = read(`${dir}/${page}`);
   assert.match(html, new RegExp(`<html lang="${lang}"`));
   assert.match(html, /<base href="\.\.\/">/);
   assert.ok(html.includes(`data-language="${lang}"`));
   assert.ok(html.includes(`href="${dir}/case-b3.html"`));
   assert.ok(html.includes('hreflang="pt-BR"'));
   assert.equal(html.match(/<link id="site-header-styles"[^>]*>/)[0], read(page).match(/<link id="site-header-styles"[^>]*>/)[0]);
   assert.ok(html.includes('hreflang="en-US"'));
   assert.ok(html.includes('hreflang="es-419"'));
   assert.doesNotMatch(html, /Entenda o processo|Conhecer projeto|Navegação principal|{{\w+}}/);
   assert.equal((html.match(/aria-current="true"/g) || []).length, 1);
   for (const [, src] of html.matchAll(/(?:src|href)="((?:assets|styles|scripts)\/[^"?#]+)/g)) assert.ok(fs.existsSync(path.join(root,src)), src);
  }
 }
 assert.match(read('en/index.html').replace(/<[^>]+>/g, '').replace(/\s+/g, ' '), /people and businesses/);
 assert.match(read('es/index.html'), /personas y negocios/);
 assert.match(read('en/index.html'), /class="current-language"[^>]*>English/);
 assert.match(read('es/index.html'), /class="current-language"[^>]*>Español/);
});
test('V2 case pages remain unlisted, noindex and connected only to alternate cases', () => {
 build();
 const cases = pages.filter(page => page.startsWith('case-'));
 for (const dir of ['', 'en/', 'es/']) {
  for (const page of cases) {
   const html = read(`v2/${dir}${page}`);
   assert.match(html, /name="robots" content="noindex,nofollow"/);
   assert.ok(html.includes(`<base href="${dir ? '../../' : '../'}">`));
   assert.ok(html.includes(`href="v2/${dir}case-b3.html"`));
   assert.ok(html.includes('id="case-image-viewer"'));
   assert.doesNotMatch(html, /rel="canonical"|rel="alternate"/);
  }
 }
 for (const page of pages) assert.doesNotMatch(read(page), /href="v2\//);
});
test('inline style check rejects a real violation', () => {
  const fixture = path.join(root, 'tests', 'inline-fixture.html');
  try {
    fs.writeFileSync(fixture, '<p style="margin: 20px">invalid</p>');
    assert.throws(() => execFileSync('bash', ['scripts/check-inline-styles.sh'], {cwd: root, stdio: 'pipe'}), error => error.status === 1);
  } finally { fs.rmSync(fixture, {force: true}); }
  execFileSync('bash', ['scripts/check-inline-styles.sh'], {cwd: root});
});

test('Atlas V2 uses the supplied process structure without changing the public case', () => {
 build();
 const html = read('v2/case-atlas.html');
 const sections = ['atlas-hero', 'contexto atlas-context-inner', 'metodologia', 'soluo', 'atlas-gallery', 'atlas-results atlas-results--revised'];
 let previous = -1;
 for (const section of sections) {
  const position = html.indexOf(`class="${section}"`, previous + 1);
  assert.ok(position > previous, section);
  previous = position;
 }
 assert.equal(html.match(/<section class="atlas-hero"[\s\S]*?<\/section>/)[0], read('case-atlas.html').match(/<section class="atlas-hero"[\s\S]*?<\/section>/)[0]);
 assert.match(html, /Discovery & Assessment/);
 assert.match(html, /Notebook LM/);
 assert.match(html, /styles\/components\/atlas-v2.css/);
 assert.equal((html.match(/class="case-media-link"/g) || []).length, 12);
 assert.equal(html.match(/<section class="atlas-results(?: atlas-results--revised)?"[\s\S]*?<\/section>/)[0], read('case-atlas.html').match(/<section class="atlas-results(?: atlas-results--revised)?"[\s\S]*?<\/section>/)[0]);
 assert.doesNotMatch(read('case-atlas.html'), /class="atlas-v2"|class="metodologia"/);
 for (const [, src] of html.matchAll(/src="(assets\/[^"?#]+)/g)) assert.ok(fs.existsSync(path.join(root, src)), src);
});

test('English banner uses approved lines and locales use the custom SEO domain and alphabetical picker', () => {
 build();
 const banner = read('en/index.html').match(/<h1 class="hero-lines">([\s\S]*?)<\/h1>/)[1];
 assert.deepEqual([...banner.matchAll(/class="hero-line">([^<]+)/g)].map(match => match[1]),
  ['Product Designer,', 'creating experiences', 'for 6+ years that', 'deliver value for', 'people and', 'businesses']);
 for (const dir of ['', 'en/', 'es/']) for (const page of pages) {
  const html = read(dir + page);
  assert.deepEqual([...html.matchAll(/data-language="([^"]+)"/g)].map(match => match[1]), ['en-US','es-419','pt-BR']);
  assert.ok(html.includes(`rel="canonical" href="https://gabrielepedro.com/${dir}${page}"`));
  assert.doesNotMatch(html, /gabrielepedro\.github\.io\/Site-GP/);
 }
});

test('Mercado Pago V2 keeps the V1 banner and adds the supplied first block only to the alternate page', () => {
 build();
 const current = read('case-mercadopago.html');
 const alternate = read('v2/case-mercadopago.html');
 const hero = html => html.match(/<section class="mp-hero"[\s\S]*?<\/section>/)[0];
 assert.equal(hero(alternate), hero(current));
 assert.match(alternate, /class="mp-v2-first-block"/);
 assert.match(alternate, /bloqueios totais e pouco transparentes/);
 const roadmap = alternate.match(/<table class="mp-v2-roadmap-table"[\s\S]*?<\/table>/)[0];
 assert.equal((roadmap.match(/<td><strong>Ago\/2024<\/strong><\/td>/g) || []).length, 6);
 assert.ok(alternate.indexOf('class="mp-v2-roadmap"') > alternate.indexOf('class="mp-v2-first-block"'));
 assert.ok(alternate.indexOf('class="mp-v2-roadmap"') < alternate.indexOf('class="mp-results"'));
 assert.doesNotMatch(current, /class="mp-v2-roadmap"/);
 for (const block of ['mp-gallery','mp-results']) {
  const pattern = new RegExp('<section class="' + block + '"[\\s\\S]*?<\\/section>');
  assert.equal(alternate.match(pattern)[0], current.match(pattern)[0]);
 }
 assert.ok(alternate.indexOf('class="mp-gallery"') < alternate.indexOf('class="mp-results"'));
 assert.doesNotMatch(alternate, /class="mp-overview"/);
 assert.doesNotMatch(current, /class="mp-v2-first-block"/);
 assert.doesNotMatch(alternate, /<img\b[^>]*src=""/);
});

test('public image sitemap uses the custom domain and leaves unlisted cases unindexed', () => {
 build();
 const sitemap = read('sitemap.xml');
 assert.equal((sitemap.match(/<url>/g) || []).length, pages.length * 3);
 assert.match(sitemap, /xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/);
 assert.match(sitemap, /<image:loc>https:\/\/gabrielepedro.com\/assets\/images\/Gabriele_Pedro_Product_Designer.webp<\/image:loc>/);
 assert.doesNotMatch(sitemap, /\/v2\/|github\.io|contact\.html/);
 assert.match(read('robots.txt'), /Sitemap: https:\/\/gabrielepedro.com\/sitemap.xml/);
 for (const dir of ['', 'en/', 'es/']) {
  assert.match(read(dir + 'index.html'), /max-image-preview:large/);
  for (const page of pages.filter(p => p.startsWith('case-'))) {
   const alternate = read('v2/' + dir + page);
   assert.equal((alternate.match(/name="robots"/g) || []).length, 1);
   assert.match(alternate, /noindex,nofollow/);
  }
 }
});

test('public SEO metadata is localized, complete and has a single primary heading', () => {
 build();
 const canonicalUrls = new Set();
 for (const dir of ['', 'en/', 'es/']) for (const page of pages) {
  const html = read(dir + page);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, dir + page);
  assert.equal((html.match(/name="description"/g) || []).length, 1);
  assert.equal((html.match(/property="og:title"/g) || []).length, 1);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
  assert.ok(!canonicalUrls.has(canonical));
  canonicalUrls.add(canonical);
  assert.ok(html.includes(`property="og:url" content="${canonical}"`));
  const structured = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(structured['@context'], 'https://schema.org');
  const webpage = structured['@graph'].find(item => /Page$/.test(item['@type']));
  assert.equal(webpage.url, canonical);
  assert.equal(webpage.inLanguage, html.match(/<html lang="([^"]+)"/)[1]);
 }
 for (const dir of ['', 'en/', 'es/']) for (const page of pages.filter(p => p.startsWith('case-'))) {
  assert.doesNotMatch(read('v2/' + dir + page), /property="og:url"|application\/ld\+json/);
 }
});

test('optimized images retain original files and resolve throughout the public pages', () => {
 const manifest = JSON.parse(read('scripts/image-optimization-manifest.json'));
 assert.ok(manifest.optimizedBytes < manifest.originalBytes);
 assert.equal(manifest.resized, false);
 for (const [original, optimized] of Object.entries(manifest.files)) {
  assert.ok(fs.existsSync(path.join(root, original)));
  assert.ok(fs.existsSync(path.join(root, optimized)));
 }
 for (const dir of ['', 'en/', 'es/']) for (const page of pages) {
  for (const [, src] of read(dir + page).matchAll(/<img\b[^>]*src="(assets\/[^"?#]+)/g)) assert.ok(fs.existsSync(path.join(root, src)), src);
 }
});

test('Mercado Pago revised overview follows the supplied seven-tag rows and short banner copy', () => {
 build();
 const source = read('case-mercadopago.html');
 const overview = source.match(/<section class="mp-overview mp-overview--revised"[\s\S]*?<\/section>/)[0];
 assert.deepEqual([...overview.matchAll(/<h2 class="mp-label"[^>]*>([^<]+)<\/h2>/g)].map(m=>m[1]),
  ['Problema','Atuação','Escopo','Decisão','Hoje faria diferente','Status','Período']);
 assert.equal((overview.match(/class="mp-overview-row(?: mp-overview-row--metadata)?"/g)||[]).length,3);
 assert.doesNotMatch(overview, /<img|Resultados|Contexto/);
 assert.match(source, /<h1 class="mp-title" id="mp-title"><span>Retenção<\/span> <span>de saldo<\/span><\/h1>/);
 assert.match(source, /<strong>clareza<\/strong> e <strong>autonomia<\/strong> para/);
 assert.match(source, /regularizar dívidas!/);
 assert.match(overview, /<strong>a retenção integral do saldo dificultava o pagamento<\/strong>/);
 assert.match(overview, /uma alternativa de fluxo e duas de comunicação/);
 assert.match(overview, /<strong>propondo retenção parcial e uso do saldo para quitar a dívida<\/strong>/);
 assert.match(overview, /fora do teste/);
 assert.match(overview, /antes de rodar novos testes/);
 for (const dir of ['en/','es/']) {
  const translated = read(dir+'case-mercadopago.html');
  assert.equal((translated.match(/class="mp-fact(?: mp-fact--period)?"/g)||[]).length,7);
 }
});

test('Atlas revised copy has its own tags, evidence and the supplied result order', () => {
 build();
 const source = read('case-atlas.html');
 const context = source.match(/<section class="atlas-context atlas-context--revised"[\s\S]*?<\/section>/)[0];
 const labels = [...context.matchAll(/<(?:h2|dt) class="atlas-label"[^>]*>([^<]+)<\/(?:h2|dt)>/g)].map(m=>m[1]);
 assert.deepEqual(labels,['Problema','Atuação','Escopo','Decisão','Hoje faria diferente','Status','Período']);
 assert.match(source, /<h1 id="atlas-title"><span>Cadastro<\/span> <span>Internacional<\/span><\/h1>/);
 assert.match(context, /<strong>128 respostas e quatro entrevistas<\/strong>/);
 assert.match(context, /<strong>priorizando a conclusão inicial e adiando a completude do perfil<\/strong>/);
 assert.doesNotMatch(context, /Resultados|97,9%/);
 const result = source.match(/<section class="atlas-results atlas-results--revised"[\s\S]*?<\/section>/)[0];
 assert.deepEqual([...result.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),
 ['+22% na taxa de conclusão','Tempo médio caiu cerca de 93%','Redução de 30% na complexidade','Estrutura p/ escalabilidade']);
 assert.match(result, /<strong>Lovable<\/strong>/);
 assert.doesNotMatch(result, /79%|Figma Maker/);
});
