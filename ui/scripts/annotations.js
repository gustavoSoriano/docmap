// ════ Anotações do markmap (contextuais ao documento/nota) ════
// Persistidas via /comments no backend. Separado da base de Notas.

let annotations = [];
let popQuote = null;
let popType  = 'note';
let currentAnnotationContext = null; // 'note:<id>'
let currentAnnotationLabel   = '';   // título legível para o cabeçalho ao copiar

const setAnnotationContext = (ctx, label) => {
  currentAnnotationContext = ctx;
  currentAnnotationLabel   = label || '';
};

const TYPE_LABEL = {
  note:     'Nota',
  decision: 'Decisão',
  question: 'Dúvida',
  todo:     'TODO',
  warning:  'Atenção',
};

const loadAnnotations = async (fileId) => {
  if (!fileId.startsWith('note:')) return;
  try {
    const res = await fetch('/comments?file=' + encodeURIComponent(fileId));
    annotations = await res.json();
    renderAnnotations();
    updateAnnotBadge();
  } catch (err) { console.error('Erro ao carregar anotações:', err); }
};

const updateAnnotBadge = () => {
  $('annot-count').textContent = annotations.length;
  if (!annotations.length) $('annot-panel').classList.remove('visible');
};

const toggleAnnotations = () => {
  const open = $('annot-panel').classList.toggle('visible');
  $('btn-annot').classList.toggle('active', open);
};

const renderAnnotations = () => {
  const list = $('annot-list');
  if (!annotations.length) {
    list.innerHTML = '<div id="annot-empty">Selecione um trecho do mapa e clique em <strong>Comentar</strong> para anotar.</div>';
    return;
  }
  list.innerHTML = annotations.map((a) => {
    const qAttr = JSON.stringify(a.quote).replace(/"/g, '&quot;');
    const color = CAT_COLOR[a.type] || CAT_COLOR.note;
    return `<div class="annot-item">
      <div class="annot-type-bar" style="background:${color}"></div>
      <div class="annot-main">
        <span class="annot-quote" title="${escHtml(a.quote)}">${escHtml(a.quote)}</span>
        <span class="annot-type-label" style="color:${color}">${TYPE_LABEL[a.type] || '◦ Nota'}</span>
        <div class="annot-note">${escHtml(a.note)}</div>
      </div>
      <div class="annot-actions">
        <button class="annot-btn" onclick="editAnnotation(${qAttr})" title="Editar">${ICON('pencil')}</button>
        <button class="annot-btn del" onclick="removeAnnotation(${qAttr})" title="Excluir">${ICON('x')}</button>
      </div>
    </div>`;
  }).join('');
};

// ── Popover ──
const selectAnnotType = (btn) => {
  document.querySelectorAll('#pop-types .type-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  popType = btn.dataset.type;
};

const openAnnotPopover = (quote, x, y) => {
  if (typeof hideCommentButton === 'function') hideCommentButton();
  popQuote = quote;
  const existing = annotations.find((a) => a.quote === quote);
  $('pop-quote').textContent = quote;
  $('pop-textarea').value = existing?.note || '';
  $('pop-delete').style.display = existing ? 'block' : 'none';

  popType = existing?.type || 'note';
  document.querySelectorAll('#pop-types .type-btn').forEach((b) => b.classList.toggle('active', b.dataset.type === popType));

  const pop = $('annot-popover');
  let px = x + 12, py = y + 8;
  if (px + 330 > window.innerWidth)  px = x - 342;
  if (py + 260 > window.innerHeight) py = y - 272;
  pop.style.left = Math.max(8, px) + 'px';
  pop.style.top  = Math.max(8, py) + 'px';
  pop.classList.add('visible');
  setTimeout(() => $('pop-textarea').focus(), 40);
};

const closeAnnotPopover = () => { $('annot-popover').classList.remove('visible'); popQuote = null; };

const saveAnnotation = async () => {
  if (!popQuote || !currentAnnotationContext) return;
  const note = $('pop-textarea').value.trim();
  if (!note) return deleteAnnotation();

  await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: currentAnnotationContext, quote: popQuote, note, type: popType }),
  });
  const idx = annotations.findIndex((a) => a.quote === popQuote);
  const entry = { quote: popQuote, note, type: popType, updatedAt: new Date().toISOString() };
  if (idx >= 0) annotations[idx] = entry; else annotations.push(entry);
  closeAnnotPopover();
  renderAnnotations();
  updateAnnotBadge();
  $('annot-panel').classList.add('visible');
  $('btn-annot').classList.add('active');
};

const deleteAnnotation = async () => {
  if (!popQuote || !currentAnnotationContext) return;
  await postDeleteAnnotation(popQuote);
  closeAnnotPopover();
};

const postDeleteAnnotation = async (quote) => {
  await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: currentAnnotationContext, quote, note: '' }),
  });
  annotations = annotations.filter((a) => a.quote !== quote);
  renderAnnotations();
  updateAnnotBadge();
};

const editAnnotation = (quote) => {
  const anchor = $('note-markmap') || document.body;
  const rect = anchor.getBoundingClientRect();
  openAnnotPopover(quote, rect.left + rect.width / 2 - 165, rect.top + 70);
};

const removeAnnotation = (quote) => postDeleteAnnotation(quote);

// ── Copiar para IA ──
const copyAnnotationsForAI = () => {
  if (!annotations.length) return toast('Nenhuma anotação para copiar');
  const label = currentAnnotationLabel || currentAnnotationContext || 'nota';
  const lines = [`# Anotações — ${label}`, ''];
  for (const a of annotations) {
    lines.push(`## ${TYPE_LABEL[a.type] || '◦ Nota'}`);
    lines.push(`> Trecho: "${a.quote}"`);
    lines.push('');
    lines.push(a.note);
    lines.push('');
  }
  copyToClipboard(lines.join('\n'), `${annotations.length} anotação(ões) copiada(s) para IA`);
};

// Fecha popover ao clicar fora
document.addEventListener('mousedown', (e) => {
  const pop = $('annot-popover');
  if (pop.classList.contains('visible') && !pop.contains(e.target)) closeAnnotPopover();
});
