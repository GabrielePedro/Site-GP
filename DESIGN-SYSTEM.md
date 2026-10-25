# Design system do portfólio

O site continua estático, compatível com Express, Python e GitHub Pages. Não é necessário framework nem JavaScript no navegador para renderizar menu, botões, cases ou footer.

## Onde editar

| Responsabilidade | Arquivo |
| --- | --- |
| Cores, fontes e escala de espaçamento | `styles/_tokens.css` |
| Espaçamento global e ajustes responsivos | `styles/spacing.css` |
| Containers e ritmo das seções da home | `styles/layout.css` |
| Layout comum das páginas de case | `styles/case-layout.css` |
| Menu, botão, card e footer | `components/header.html`, `contact-button.html`, `case-card.html`, `footer.html` |
| Estilo de cada componente | `styles/components/` |
| Animações da home | `styles/home.css`, `scripts/home.js` |

`styles/style.css` é a entrada dos estilos compartilhados em todas as páginas. Os cases carregam sua arte específica e, por último, o contrato comum `case-layout.css`.

## Espaçamento

Não altere `--space-24` para significar outro tamanho no celular. A escala primitiva é constante. Edite os tokens semânticos em `spacing.css`:

| Token | Desktop | Tablet (até 1000px) | Celular (até 700px) |
| --- | --- | --- | --- |
| `--spacing-inline` (margens laterais) | 24px | 24px | 20px |
| `--spacing-section` (padding de seção) | 150px | 96px | 64px |
| `--spacing-case` (entre cards) | 100px | 64px | 48px |
| `--spacing-grid` (colunas) | 48px | 32px | 24px |

Cada seção controla seu padding vertical; containers controlam largura e padding horizontal; componentes controlam somente os espaços internos. Seções coloridas têm padding em ambos os lados. Entre banner e cases da home, o banner já fornece a separação e a seção de cases não repete padding superior.

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

Os testes verificam geração repetível, footer único entre páginas, estrutura e imagens dos cards e detecção real de estilos inline. A CI também rejeita HTML gerado desatualizado. No navegador, confira home, Atlas, Yampi, Mercado Pago e contato nas larguras 375, 768, 1024 e 1440px; valide ausência de rolagem horizontal, navegação, foco, hover, revelação por scroll e movimento reduzido. O protótipo Figma é externo e depende de acesso ao serviço.
