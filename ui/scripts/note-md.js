// ════ Notas: conversão markdown e HTML do editor WYSIWYG ════
// O disco/API continuam markdown; o editor edita HTML e converte nas bordas.
// depends on: dom.js (escHtml), vendor: marked, DOMPurify, TurndownService,
// turndownPluginGfm

const NOTE_SANITIZE = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
};

// Markdown para HTML seguro. Diferente do renderMarkdown (preview read-only),
// mantém os checkboxes de task list — e os deixa clicáveis.
const noteMdToHtml = (md) => {
  const raw = String(md ?? '');
  if (!window.marked || !window.DOMPurify) return `<p>${escHtml(raw)}</p>`;
  const tpl = document.createElement('template');
  tpl.innerHTML = DOMPurify.sanitize(marked.parse(raw), NOTE_SANITIZE);
  tpl.content.querySelectorAll('input').forEach((el) => {
    if (el.type !== 'checkbox') el.remove();
    else el.removeAttribute('disabled');
  });
  return tpl.innerHTML;
};

// Escape mínimo: só o que o marked reinterpretaria como sintaxe. O padrão do
// turndown escapa `_` dentro de palavra (snake_case) e deixa notas ilegíveis.
const noteEscapeText = (s) =>
  s
    .replace(/\\(?=[\\`*_{}[\]()#+\-.!>|~<])/g, '\\\\')
    .replace(/([`*[<])/g, '\\$1')
    .replace(/(^|[^\p{L}\p{N}])_/gu, '$1\\_')
    .replace(/_($|[^\p{L}\p{N}])/gu, '\\_$1')
    .replace(/^(#{1,6})(\s)/gm, '\\$1$2')
    .replace(/^>/gm, '\\>')
    .replace(/^([-+])(\s)/gm, '\\$1$2')
    .replace(/^(\d+)\.(\s)/gm, '$1\\.$2');

// Item de lista compacto ("- a", "1. a"): o padrão do turndown usa 3 espaços.
const noteListItemMd = (content, node, options) => {
  const parent = node.parentNode;
  const index = [...parent.children].indexOf(node);
  const start = parent.getAttribute?.('start');
  const prefix = parent.nodeName === 'OL'
    ? `${(start ? Number(start) : 1) + index}. `
    : `${options.bulletListMarker} `;
  const body = content
    .replace(/^\n+/, '')
    .replace(/\n+$/, '\n')
    .replace(/^(\[[ x]\])\s+/, '$1 ')
    .replace(/\n/g, `\n${' '.repeat(prefix.length)}`);
  const tail = node.nextSibling && !/\n$/.test(body) ? '\n' : '';
  return prefix + body + tail;
};

let noteTurndownInstance = null;

const getNoteTurndown = () => {
  if (noteTurndownInstance) return noteTurndownInstance;
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    hr: '---',
  });
  td.use(turndownPluginGfm.gfm);
  td.escape = noteEscapeText;
  // <pre> sem <code> (criado pelo formatBlock do editor) vira bloco fenced.
  td.addRule('plainPre', {
    filter: (n) => n.nodeName === 'PRE' && n.firstChild?.nodeName !== 'CODE',
    replacement: (_c, n) =>
      '\n\n```\n' + n.textContent.replace(/\n$/, '') + '\n```\n\n',
  });
  td.addRule('strike', {
    filter: ['del', 's', 'strike'],
    replacement: (c) => `~~${c}~~`,
  });
  td.addRule('listItem', { filter: 'li', replacement: noteListItemMd });
  noteTurndownInstance = td;
  return td;
};

const NOTE_BLOCK_SEL = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th';

// Limpa o que o contenteditable deixa de lixo: <br> placeholder no fim de
// bloco e parágrafos vazios (viram "  " e linhas fantasma no markdown).
const noteCleanForExport = (root) => {
  // Enter dentro de <pre> vira <br> no contenteditable; no markdown é \n.
  root.querySelectorAll('pre br').forEach((br) => br.replaceWith('\n'));
  root.querySelectorAll(NOTE_BLOCK_SEL).forEach((el) => {
    while (el.lastChild?.nodeName === 'BR') el.lastChild.remove();
  });
  root.querySelectorAll('p').forEach((p) => {
    const empty = !p.textContent.trim() && !p.querySelector('img,hr,input');
    if (empty) p.remove();
  });
};

// HTML do editor para markdown. Sincroniza o estado dos checkboxes no atributo
// (turndown lê o HTML clonado, onde só o atributo `checked` sobrevive).
const noteHtmlToMd = (surface) => {
  surface.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.toggleAttribute('checked', cb.checked);
  });
  const clone = surface.cloneNode(true);
  noteCleanForExport(clone);
  return getNoteTurndown().turndown(clone).trim();
};
