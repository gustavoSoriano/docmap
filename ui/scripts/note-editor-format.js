// ════ Notas: comandos de formatação (toolbar + atalhos) ════
// depends on: dom.js ($, toast, escHtml, promptDialog), note-editor.js

const noteExec = (cmd, value) => {
  noteEditorRestoreRange();
  document.execCommand(cmd, false, value);
  noteEditorMarkDirty();
};

// Elemento do nó de seleção (anchorNode pode ser texto).
const noteCaretEl = () => {
  const node = getSelection().anchorNode;
  if (!node || !noteSurface().contains(node)) return null;
  return node.nodeType === 1 ? node : node.parentElement;
};

const noteToggleBlock = (tag) => {
  const el = noteCaretEl();
  const cur = el?.closest(tag);
  if (tag === 'blockquote' && cur) return noteExec('outdent');
  noteExec('formatBlock', cur ? '<p>' : `<${tag}>`);
};

const noteCheckbox = () => {
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  return cb;
};

const noteLiHasCheckbox = (li) => !!li.querySelector(':scope > input[type="checkbox"]');

const noteAddCheckbox = (li) => {
  li.prepend(noteCheckbox(), document.createTextNode(' '));
};

const noteRemoveCheckbox = (li) => {
  li.querySelector(':scope > input[type="checkbox"]')?.remove();
  const first = li.firstChild;
  if (first?.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
};

// Caret logo depois do checkbox (senão o texto digitado entra antes dele).
const noteCaretAfterCheckbox = (li) => {
  const gap = li.querySelector(':scope > input[type="checkbox"]')?.nextSibling;
  if (gap?.nodeType === 3) getSelection().setPosition(gap, gap.length);
};

// Lista de tarefas: vira lista com marcadores e liga/desliga o checkbox.
const noteTaskList = () => {
  if (!noteCaretEl()?.closest('li')) noteExec('insertUnorderedList');
  noteEditorRestoreRange();
  const range = getSelection().getRangeAt(0);
  const items = [...noteSurface().querySelectorAll('li')]
    .filter((li) => range.intersectsNode(li));
  const allTasks = items.every(noteLiHasCheckbox);
  items.forEach((li) => {
    if (allTasks) noteRemoveCheckbox(li);
    else if (!noteLiHasCheckbox(li)) noteAddCheckbox(li);
  });
  const caretLi = noteCaretEl()?.closest('li');
  const bare = caretLi && !caretLi.textContent.trim();
  if (bare && noteLiHasCheckbox(caretLi)) noteCaretAfterCheckbox(caretLi);
  noteEditorMarkDirty();
};

// Enter num item de tarefa ganha checkbox novo (o nativo cria <li> vazio).
const noteTaskOnInput = (e) => {
  if (e.inputType !== 'insertParagraph') return;
  const li = noteCaretEl()?.closest('li');
  const prev = li?.previousElementSibling;
  if (li && prev && noteLiHasCheckbox(prev) && !noteLiHasCheckbox(li)) {
    noteAddCheckbox(li);
    noteCaretAfterCheckbox(li);
  }
};

const noteInlineCode = () => {
  noteEditorRestoreRange();
  const code = noteCaretEl()?.closest('code');
  if (code && !code.closest('pre')) {
    code.replaceWith(document.createTextNode(code.textContent));
    return noteEditorMarkDirty();
  }
  const text = getSelection().toString() || 'código';
  noteExec('insertHTML', `<code>${escHtml(text)}</code>`);
};

const NOTE_URL_BAD = /^\s*(javascript|data|vbscript):/i;

const noteLink = async () => {
  const sel = getSelection();
  const selected = noteSurface().contains(sel.anchorNode) ? sel.toString() : '';
  const raw = await promptDialog('URL do link', { placeholder: 'https://…' });
  const url = (raw || '').trim();
  if (!url) return;
  if (NOTE_URL_BAD.test(url)) return toast('Link inválido');
  const href = /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(url) ? url : `https://${url}`;
  if (selected) noteExec('createLink', href);
  else noteExec('insertHTML', `<a href="${escHtml(href)}">${escHtml(url)}</a>`);
};

const noteInsertTable = () => {
  if (noteCaretEl()?.closest('table')) return toast('Já está dentro de uma tabela');
  const cell = (t) => `<${t}>${t === 'th' ? 'Coluna' : '<br>'}</${t}>`;
  const row = (t) => `<tr>${[1, 2, 3].map(() => cell(t)).join('')}</tr>`;
  noteExec(
    'insertHTML',
    `<table><thead>${row('th')}</thead><tbody>${row('td')}${row('td')}</tbody></table><p><br></p>`,
  );
};

const NOTE_FORMATS = {
  bold: () => noteExec('bold'),
  italic: () => noteExec('italic'),
  strike: () => noteExec('strikeThrough'),
  h1: () => noteToggleBlock('h1'),
  h2: () => noteToggleBlock('h2'),
  h3: () => noteToggleBlock('h3'),
  ul: () => noteExec('insertUnorderedList'),
  ol: () => noteExec('insertOrderedList'),
  task: noteTaskList,
  quote: () => noteToggleBlock('blockquote'),
  codeblock: () => noteToggleBlock('pre'),
  code: noteInlineCode,
  link: noteLink,
  hr: () => noteExec('insertHorizontalRule'),
  table: noteInsertTable,
};

const noteFormat = (name) => {
  if (noteEd.source) return toast('Volte ao modo visual para formatar');
  NOTE_FORMATS[name]?.();
  noteFmtRefresh();
};

// ── Estado ativo dos botões (negrito, título, lista…) ──
const NOTE_FMT_STATES = {
  bold: () => document.queryCommandState('bold'),
  italic: () => document.queryCommandState('italic'),
  strike: () => document.queryCommandState('strikeThrough'),
  ul: () => document.queryCommandState('insertUnorderedList'),
  ol: () => document.queryCommandState('insertOrderedList'),
  h1: () => !!noteCaretEl()?.closest('h1'),
  h2: () => !!noteCaretEl()?.closest('h2'),
  h3: () => !!noteCaretEl()?.closest('h3'),
  quote: () => !!noteCaretEl()?.closest('blockquote'),
  codeblock: () => !!noteCaretEl()?.closest('pre'),
};

const noteFmtRefresh = () => {
  if (!noteCaretEl()) return;
  document.querySelectorAll('#note-fmt-bar [data-fmt]').forEach((b) => {
    const state = NOTE_FMT_STATES[b.dataset.fmt];
    b.classList.toggle('on', !!state && state());
  });
};

document.addEventListener('selectionchange', () => requestAnimationFrame(noteFmtRefresh));

// Barra: mousedown não pode roubar o foco/seleção do editor.
$('note-fmt-bar').addEventListener('mousedown', (e) => e.preventDefault());
$('note-fmt-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-fmt]');
  if (btn) noteFormat(btn.dataset.fmt);
});
