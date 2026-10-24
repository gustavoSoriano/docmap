// ════ Notas: editor WYSIWYG (estado, API, modo Markdown, colagem) ════
// Edita HTML num contenteditable e entrega markdown para o resto do app.
// Estado local de runtime (único editor aberto por vez).
// depends on: dom.js ($, toast), note-md.js

const noteEd = {
  baseMd: '', // markdown original — devolvido intacto enquanto não houver edição
  dirty: false,
  source: false, // true = textarea de markdown puro em vez do WYSIWYG
  range: null, // última seleção dentro do editor (some ao abrir diálogos)
};

const noteSurface = () => $('note-surface');

// Todo texto vive num bloco <p> (Enter cria <p>, não <div>): os atalhos
// markdown e a exportação dependem disso.
const NOTE_EMPTY_HTML = '<p><br></p>';
document.execCommand('defaultParagraphSeparator', false, 'p');

// Apagar tudo deixa o editor sem bloco algum: recria o parágrafo base.
const noteEnsureBlock = () => {
  const s = noteSurface();
  if (s.firstChild) return;
  s.innerHTML = NOTE_EMPTY_HTML;
  getSelection().setPosition(s.firstChild, 0);
};

const noteEditorRefreshEmpty = () => {
  const s = noteSurface();
  const empty = !s.textContent.trim() && !s.querySelector('img,hr,table,li');
  s.classList.toggle('is-empty', empty);
};

const noteEditorMarkDirty = () => {
  noteEd.dirty = true;
  noteEditorRefreshEmpty();
};

const noteEditorGetMarkdown = () => {
  if (noteEd.source) return $('note-content-textarea').value;
  return noteEd.dirty ? noteHtmlToMd(noteSurface()) : noteEd.baseMd;
};

// Chamado após salvar: o conteúdo atual passa a ser o "original" sem
// recarregar o editor (preserva cursor e scroll).
const noteEditorMarkSaved = (markdown) => {
  noteEd.baseMd = markdown;
  noteEd.dirty = false;
};

const setNoteSourceMode = (on) => {
  noteEd.source = on;
  $('note-body').classList.toggle('source', on);
  $('notes-editor-form').classList.toggle('source-mode', on);
  const btn = $('btn-source');
  btn.classList.toggle('active', on);
  btn.setAttribute('aria-pressed', String(on));
  btn.title = on ? 'Voltar ao editor visual' : 'Editar o markdown puro';
  btn.innerHTML = on ? `${ICON('eye')} Visual` : `${ICON('code')} Markdown`;
};

const noteEditorSetMarkdown = (md) => {
  noteEd.baseMd = String(md ?? '');
  noteEd.dirty = false;
  noteEd.range = null;
  noteSurface().innerHTML = noteMdToHtml(noteEd.baseMd) || NOTE_EMPTY_HTML;
  $('note-content-textarea').value = noteEd.baseMd;
  setNoteSourceMode(false);
  noteEditorRefreshEmpty();
};

// Alterna WYSIWYG e markdown puro, convertendo o conteúdo entre os dois.
const toggleNoteSource = () => {
  const ta = $('note-content-textarea');
  if (noteEd.source) {
    noteEditorSetMarkdown(ta.value);
    noteSurface().focus();
    return;
  }
  const md = noteEditorGetMarkdown();
  ta.value = md;
  setNoteSourceMode(true);
  ta.focus();
};

// Guarda a seleção enquanto está no editor: diálogos e uploads assíncronos
// roubam o foco e precisamos devolver o cursor ao lugar certo.
document.addEventListener('selectionchange', () => {
  const sel = getSelection();
  if (!sel.rangeCount || !noteSurface().contains(sel.anchorNode)) return;
  noteEd.range = sel.getRangeAt(0).cloneRange();
});

const noteEditorRestoreRange = () => {
  const s = noteSurface();
  const sel = getSelection();
  // Seleção atual já está no editor (ex.: atalho de teclado): não mexe.
  if (sel.rangeCount && s.contains(sel.anchorNode)) return;
  s.focus();
  if (noteEd.range && s.contains(noteEd.range.startContainer)) {
    sel.removeAllRanges();
    sel.addRange(noteEd.range);
    return;
  }
  sel.selectAllChildren(s);
  sel.collapseToEnd();
};

const noteEditorInsertHtml = (html) => {
  noteEditorRestoreRange();
  document.execCommand('insertHTML', false, html);
  noteEditorMarkDirty();
};

const noteInPre = () => {
  const node = getSelection().anchorNode;
  return !!(node && (node.nodeType === 1 ? node : node.parentElement)?.closest('pre'));
};

// Texto colado: se parece markdown vira estrutura; senão entra como texto
// (código colado não pode ser reflowed como parágrafo).
const NOTE_MD_HINT = /^(#{1,6}\s|\s*[-*+]\s|\s*\d+\.\s|>\s|```|\|.+\|)|\*\*.+\*\*|\[.+\]\(.+\)/m;

const noteEditorPasteText = (text) => {
  if (!text) return;
  const s = noteSurface();
  s.focus();
  if (!noteInPre() && NOTE_MD_HINT.test(text)) {
    document.execCommand('insertHTML', false, noteMdToHtml(text));
  } else if (noteInPre() || !text.includes('\n')) {
    document.execCommand('insertText', false, text);
  } else {
    text.split('\n').forEach((line, i) => {
      if (i) document.execCommand('insertParagraph');
      if (line) document.execCommand('insertText', false, line);
    });
  }
  noteEditorMarkDirty();
};

// Cola texto na posição do cursor, no modo ativo (WYSIWYG ou markdown).
const notePasteAtCursor = (text) => {
  if (noteEd.source) insertAtCursor($('note-content-textarea'), text);
  else noteEditorPasteText(text);
};

// execCommand aninha listas, <pre>, citações e títulos dentro de <p> (HTML
// inválido). Desembrulha o <p> e devolve a seleção ao mesmo nó/offset.
const NOTE_P_BAD = 'p > ul, p > ol, p > pre, p > blockquote, p > table, p > hr, ' +
  'p > h1, p > h2, p > h3, p > p, p > div';

const NOTE_BLOCK_TAGS = /^(P|UL|OL|PRE|BLOCKQUOTE|TABLE|HR|H[1-6]|DIV)$/;

// Nós soltos na raiz (texto/<br>/inline que sobram ao sair de citação ou
// lista) ganham um <p>. Corridas só de espaço entre blocos ficam como estão.
const noteWrapLoose = (s) => {
  let run = [];
  const flush = () => {
    const blank = run.every((n) => n.nodeType === 3 && !n.textContent.trim());
    if (run.length && !blank) {
      const p = document.createElement('p');
      run[0].before(p);
      p.append(...run);
    }
    run = [];
  };
  [...s.childNodes].forEach((n) => {
    if (n.nodeType === 1 && NOTE_BLOCK_TAGS.test(n.nodeName)) flush();
    else run.push(n);
  });
  flush();
};

const noteNormalizeBlocks = () => {
  const s = noteSurface();
  const bad = new Set([...s.querySelectorAll(NOTE_P_BAD)].map((n) => n.parentElement));
  const sel = getSelection();
  const { anchorNode: an, anchorOffset: ao, focusNode: fn, focusOffset: fo } = sel;
  // Âncora na própria raiz aponta por índice: guarda o nó seguinte.
  const next = an === s ? s.childNodes[ao] : null;
  bad.forEach((p) => p.replaceWith(...p.childNodes));
  noteWrapLoose(s);
  if (next?.parentNode) sel.setPosition(next.parentNode, [...next.parentNode.childNodes].indexOf(next));
  else if (an && fn && s.contains(an) && s.contains(fn)) sel.setBaseAndExtent(an, ao, fn, fo);
};

noteSurface().addEventListener('input', (e) => {
  noteNormalizeBlocks();
  noteEnsureBlock();
  noteEditorMarkDirty();
  noteTaskOnInput(e);
});
noteSurface().addEventListener('change', noteEditorMarkDirty); // checkbox
