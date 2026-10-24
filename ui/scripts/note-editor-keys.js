// ════ Notas: atalhos de teclado e markdown "digitado" (estilo Notion) ════
// "# " vira título, "- " lista, "1. " numerada, "> " citação, "[] " tarefa,
// "```" + Enter bloco de código, "---" + Enter linha horizontal.
// O webview não liga o menu Edit: Cmd+B/I/Z precisam de tratamento manual.
// depends on: note-editor.js, note-editor-format.js

const NOTE_BLOCK_START = [
  [/^#{1,3}$/, (m) => `h${m.length}`],
  [/^[-*+]$/, () => 'ul'],
  [/^\d+\.$/, () => 'ol'],
  [/^>$/, () => 'quote'],
  [/^\[ ?\]$/, () => 'task'],
];

// Texto do bloco atual até o cursor (para detectar o gatilho markdown).
const noteTextBeforeCaret = () => {
  const sel = getSelection();
  if (!sel.rangeCount || !sel.isCollapsed) return null;
  const block = noteCaretEl()?.closest('p,div');
  if (!block || block === noteSurface()) return null;
  const r = document.createRange();
  r.selectNodeContents(block);
  r.setEnd(sel.anchorNode, sel.anchorOffset);
  return { block, text: r.toString() };
};

const noteEraseBeforeCaret = (text) => {
  for (let i = 0; i < text.length; i++) document.execCommand('delete');
};

const noteOnSpace = (e) => {
  const ctx = noteTextBeforeCaret();
  if (!ctx) return;
  const hit = NOTE_BLOCK_START.find(([re]) => re.test(ctx.text));
  if (!hit) return;
  e.preventDefault();
  noteEraseBeforeCaret(ctx.text);
  noteFormat(hit[1](ctx.text));
};

// Enter em "```" ou "---" (sozinhos na linha) cria bloco de código / hr.
const noteOnEnterTrigger = (e) => {
  const ctx = noteTextBeforeCaret();
  if (!ctx || ctx.block.textContent !== ctx.text) return false;
  const kind = ctx.text.startsWith('```') ? 'codeblock' : ctx.text === '---' ? 'hr' : '';
  if (!kind) return false;
  e.preventDefault();
  noteEraseBeforeCaret(ctx.text);
  noteFormat(kind);
  return true;
};

// Enter num item de tarefa vazio: tira o checkbox e deixa o Enter nativo sair
// da lista (com o checkbox ele não reconheceria o item como vazio).
const noteTaskEmptyExit = (li) => {
  if (li.textContent.replace(/\s+/g, '') || !noteLiHasCheckbox(li)) return;
  li.innerHTML = '<br>';
  getSelection().setPosition(li, 0);
};

// Enter dentro de <pre> segue o nativo (\n); numa linha vazia no fim do
// bloco, sai dele para um parágrafo novo.
const noteCaretAtEnd = (el) => {
  const sel = getSelection();
  if (!sel.isCollapsed) return false;
  const r = document.createRange();
  r.selectNodeContents(el);
  r.setStart(sel.anchorNode, sel.anchorOffset);
  return r.toString() === '';
};

const noteExitPre = (pre) => {
  while (pre.lastChild?.nodeName === 'BR') pre.lastChild.remove();
  const p = document.createElement('p');
  p.innerHTML = '<br>';
  pre.after(p);
  getSelection().setPosition(p, 0);
  noteEditorMarkDirty();
};

// Linha vazia no fim do bloco = dois <br> seguidos (o nativo insere o
// segundo como placeholder da linha nova).
const noteOnEnterInPre = (e, pre) => {
  const tail = pre.lastChild;
  const prev = tail?.previousSibling;
  if (tail?.nodeName !== 'BR' || prev?.nodeName !== 'BR') return;
  if (!noteCaretAtEnd(pre)) return;
  e.preventDefault();
  noteExitPre(pre);
};

const noteOnEnter = (e) => {
  const el = noteCaretEl();
  if (!el || e.shiftKey) return;
  const pre = el.closest('pre');
  if (pre) return noteOnEnterInPre(e, pre);
  const quote = el.closest('blockquote');
  if (quote && !quote.textContent.trim()) {
    e.preventDefault();
    return document.execCommand('outdent');
  }
  const li = el.closest('li');
  if (li) noteTaskEmptyExit(li);
  noteOnEnterTrigger(e);
};

// Tab: indenta item de lista, avança célula de tabela, ou 2 espaços em código.
const noteNextCell = (cell, back) => {
  const cells = [...cell.closest('table').querySelectorAll('th,td')];
  const next = cells[cells.indexOf(cell) + (back ? -1 : 1)];
  if (!next) return;
  getSelection().selectAllChildren(next);
  getSelection().collapseToEnd();
};

const noteOnTab = (e) => {
  const el = noteCaretEl();
  if (!el) return;
  const cell = el.closest('td,th');
  if (cell) { e.preventDefault(); return noteNextCell(cell, e.shiftKey); }
  if (el.closest('li')) { e.preventDefault(); return noteExec(e.shiftKey ? 'outdent' : 'indent'); }
  if (el.closest('pre')) { e.preventDefault(); noteExec('insertText', '  '); }
};

const NOTE_SHORTCUTS = {
  b: () => noteFormat('bold'),
  i: () => noteFormat('italic'),
  k: () => noteFormat('link'),
  e: () => noteFormat('code'),
};

const noteOnModKey = (e) => {
  const key = e.key.toLowerCase();
  if (key === 'z') { e.preventDefault(); return noteExec(e.shiftKey ? 'redo' : 'undo'); }
  const run = NOTE_SHORTCUTS[key];
  if (run && !e.shiftKey && !e.altKey) { e.preventDefault(); run(); }
};

noteSurface().addEventListener('keydown', (e) => {
  if (e.isComposing) return;
  if (e.ctrlKey || e.metaKey) return noteOnModKey(e);
  if (e.key === ' ') noteOnSpace(e);
  else if (e.key === 'Enter') noteOnEnter(e);
  else if (e.key === 'Tab') noteOnTab(e);
});

// Imagens inline: ao clicar numa, seleciona (Delete/Backspace remove).
noteSurface().addEventListener('click', (e) => {
  if (e.target.tagName !== 'IMG') return;
  getSelection().selectAllChildren(e.target.parentElement);
});
