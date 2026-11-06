/* Metadata is generated from each localized page, never copied between languages. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const site = 'https://gabrielepedro.com/';
const decode = text => text.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const escape = text => text.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const images = {
 'index.html':'assets/images/Gabriele_Pedro_Product_Designer.png',
 'case-atlas.html':'assets/images/case-images/UX-Atlas.png',
 'case-b3.html':'assets/images/case-images/UX-B3.png',
 'case-mercadopago.html':'assets/images/case-images/UX-Mercado-Pago.png',
 'case-yampi.html':'assets/images/case-images/UX-Yampi.png'
};
function buildSearchMetadata(pages) {
 for (const locale of [{dir:'',lang:'pt-BR'}, {dir:'en/',lang:'en-US'}, {dir:'es/',lang:'es-419'}]) for (const page of pages) {
  const file = path.join(root, locale.dir, page);
  let html = fs.readFileSync(file,'utf8').replace(/<!-- search-metadata -->[\s\S]*?<!-- \/search-metadata -->\s*/g,'');
  const title = decode(html.match(/<title>([^<]+)<\/title>/)[1]);
  const description = decode(html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/)[1]);
  const url = site + locale.dir + page;
  const image = site + images[page];
  if (!fs.existsSync(path.join(root, images[page]))) throw new Error(`Missing social image: ${page}`);
  const person = {'@type':'Person','@id':site+'#person',name:'Gabriele Pedro',jobTitle:'Product Designer',url:site,image:site+images['index.html']};
  const main = {'@type':page==='index.html'?'ProfilePage':'WebPage','@id':url+'#webpage',url,name:title,description,inLanguage:locale.lang,primaryImageOfPage:{'@type':'ImageObject',contentUrl:image},isPartOf:{'@id':site+'#website'},mainEntity:page==='index.html'?{'@id':person['@id']}:{'@type':'CreativeWork',name:title,description,author:{'@id':person['@id']},inLanguage:locale.lang,image}};
  const graph = {'@context':'https://schema.org','@graph':[person,{'@type':'WebSite','@id':site+'#website',url:site,name:'Gabriele Pedro — Product Designer'},main]};
  const tags = [
   ['property','og:type','website'], ['property','og:site_name','Gabriele Pedro'],
   ['property','og:title',title], ['property','og:description',description],
   ['property','og:url',url], ['property','og:image',image], ['property','og:image:alt',title],
   ['name','twitter:card','summary_large_image'], ['name','twitter:title',title],
   ['name','twitter:description',description], ['name','twitter:image',image]
  ].map(([attr,key,value])=>`<meta ${attr}="${key}" content="${escape(value)}">`).join('\n');
  const block = '<!-- search-metadata -->\n'+tags+'\n<script type="application/ld+json">'+JSON.stringify(graph).replace(/</g,'\\u003c')+'</script>\n<!-- /search-metadata -->\n';
  html = html.replace('</head>',block+'</head>');
  if (fs.readFileSync(file,'utf8')!==html) fs.writeFileSync(file,html);
 }
}
module.exports = {buildSearchMetadata};
