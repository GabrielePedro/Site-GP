# Design system do portfólio

O site continua estático, compatível com Express, Python e GitHub Pages. Não é necessário framework nem JavaScript no navegador para renderizar menu, botões, cases ou footer.

## Onde editar

| Responsabilidade | Arquivo |
| --- | --- |
| Cores, fontes e escala de espaçamento | `styles/_tokens.css` |
| Espaçamento global e ajustes responsivos | `styles/spacing.css` |
| Containers compartilhados e medidas dos frames da home | `styles/layout.css`, `styles/home-layout.css` |
| Layout comum das páginas de case | `styles/case-layout.css` |
| Menu, botão, card e footer | `components/header.html`, `contact-button.html`, `case-card.html`, `footer.html` |
| Estilo de cada componente | `styles/components/` |
| Animações e cursor em todas as páginas | `styles/motion.css`, `scripts/site-motion.js`, `components/motion.html` |

`styles/style.css` é a entrada dos estilos compartilhados em todas as páginas. Os cases carregam sua arte específica e, por último, o contrato comum `case-layout.css`.

## Espaçamento

Não altere `--space-24` para significar outro tamanho no celular. A escala primitiva é constante. Edite os tokens semânticos em `spacing.css`:

| Token | Desktop | Tablet (até 1000px) | Celular (até 700px) |
| --- | --- | --- | --- |
| `--spacing-inline` (margens laterais) | 24px | 24px | 20px |
| `--spacing-section` (padding de seção) | 150px | 96px | 64px |
| `--spacing-case` (entre cards) | 100px | 64px | 48px |
| `--spacing-grid` (colunas) | 48px | 32px | 24px |

Cada seção controla seu padding vertical; containers controlam largura e padding horizontal; componentes controlam somente os espaços internos. Seções coloridas têm padding em ambos os lados. Na home, o banner tem padding de 100px no topo, 150px nas laterais e zero na base; a seção de cases fornece os 150px de separação seguintes. Banner, Cases, Como trabalho e Projetos usam frames de até 1440px, definidos em `home-layout.css`. Os containers recebem o padding uma única vez; o espaço entre cards/cabeçalho vem do `gap`, sem margens adicionais.

Cards usam altura natural no texto e proporção reservada na imagem. Evite alturas fixas para conteúdo, margens negativas para espaçamento e `100vw` para escapar de containers. Uma página de case usa `.case-page`; cada bloco usa `.case-section`, com seu container interno `.case-section__content`. O contexto Yampi tem conteúdo diretamente na seção e aplica o mesmo contrato ali.

## Componentes estáticos

Execute `npm run build` depois de editar templates ou dados. `npm start` e `npm run dev` também geram os componentes. A publicação no GitHub Pages executa a geração antes de copiar os arquivos.

Os trechos entre `<!-- component:header -->` / `<!-- /component:header -->` e os equivalentes de footer são gerados. Edite o template, não as cópias expandidas nas páginas.

Botões têm seus dados no comentário de abertura:

```html
<!-- component:button {"href":"case-yampi.html","label":"Entenda o processo"} -->
<!-- /component:button -->
```

O build preenche esse intervalo com `components/contact-button.html`. `external: true` adiciona abertura em nova aba com `noopener noreferrer`. A âncora é o único elemento interativo; o wrapper não recebe `role="link"`.

Cards seguem o mesmo padrão `component:case`, com `title`, `lead`, `image`, `alt`, `variant` (`hero-variant-a`, `b` ou `c`), `reverse`, `pill` opcional e `action` (dados do botão). `lead` aceita HTML editorial como `<strong>`; use apenas conteúdo do próprio projeto, nunca entrada de usuários. Copie um comentário de card existente para adicionar outro e rode o build. O texto vem primeiro no celular, inclusive nos cards invertidos.

Menu e footer já estão presentes no HTML inicial, evitando deslocamentos por carregamento assíncrono. O menu é sticky e ocupa espaço no fluxo; não adicione compensação de altura ao `body`.

## Animações sem quebrar layout

Anime `transform`, `opacity` e cores. Evite animar `height`, `width`, `margin`, `padding`, `gap` ou `display` de elementos estruturais. Botões usam uma camada absoluta de fundo com `scaleY`; hover e foco preservam dimensões. Decorações absolutas precisam de um wrapper com tamanho reservado e não devem definir o tamanho do conteúdo.

Mantenha regras de movimento separadas das regras de layout. Se duas animações precisarem de `transform`, aplique-as em elementos internos distintos. Respeite `prefers-reduced-motion` e deixe o conteúdo visível quando JavaScript estiver desativado.

## Verificação

```bash
npm run build
npm test
npm run check:styles
npm run dev
```

Os testes verificam geração repetível, footer único entre páginas, estrutura e imagens dos cards e detecção real de estilos inline. A CI também rejeita HTML gerado desatualizado. No navegador, confira home, Atlas, B3, Yampi, Mercado Pago e contato nas larguras 375, 768, 1024 e 1440px; valide ausência de rolagem horizontal, navegação, foco, hover, revelação por scroll e movimento reduzido. O protótipo Figma é externo e depende de acesso ao serviço.

O build injeta um único cursor e os arquivos de movimento compartilhados em todas as páginas. Imagens dos cards usam uma âncora nativa com o mesmo destino e comportamento de nova aba do botão, gerados de `action`. As imagens recebem entrada por scroll e efeitos de hover/foco sem alterar o tamanho de layout. O movimento reduzido pode ser ativado durante a navegação; o conteúdo permanece visível e o cursor decorativo é desativado. Em telas de toque, o cursor fica oculto.

A página Mercado Pago usa `styles/components/mercadopago.css` para os novos frames enviados do Figma: banner de 1440 × 770px, resumo com os dados do projeto e quatro painéis de 1140 × 800px. As imagens `00-Gabriele-Pedro-Case_Mercado-Pago-01.png` a `04.png` já incluem os celulares e os fundos; não recrie essas camadas sobre as fotos. Os painéis preservam a imagem completa com `object-fit: contain`. Menu, footer e movimento continuam vindo dos componentes compartilhados; os ajustes de medida do footer ficam restritos à classe `mercadopago-page`.

Nas páginas `case-*.html`, o build envolve as imagens editoriais em links `.case-media-link` para abrir o visualizador `.image-viewer` sobre a própria página. O modal usa `<dialog>`, permite zoom e fecha por botão, Esc ou clique fora; o foco e a rolagem retornam ao ponto de origem. O link para o arquivo é mantido como fallback sem JavaScript. Logos e ícones não entram nessa regra. O `href` acompanha o `src`, inclusive a versão para cache. Na home, as imagens dos cards continuam levando ao mesmo destino do botão. O cinza do resumo Mercado Pago pertence à seção `.mp-overview` inteira; o container interno controla somente largura e padding, evitando faixas brancas nas laterais.

O menu compartilhado usa B3 no lugar de Yampi. O card B3 da home aponta para `case-b3.html`, criada com o texto, a tag Service Design e a imagem já existentes no portfólio. O case Yampi continua disponível pelo seu card em Projetos UI/UX. Novas páginas precisam entrar na lista de `scripts/build-components.js` para receber menu, footer, cursor e visualizador de imagens.
