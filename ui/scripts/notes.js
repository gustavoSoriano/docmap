// ════ Notas — base de conhecimento (CRUD, exposta à IA via API) ════

let allNotes    = [];
let currentNote = null;
let previewMode = false;

// ── Lista ──
const loadNotesList = async () => {
  try {
    const res = await fetch('/notes');
    allNotes  = await res.json();
    refreshCategoryOptions();
    renderFilters();
    applyFilters();
  } catch (err) { console.error('Erro ao carregar notas:', err); }
};

// Preenche o datalist com as categorias já usadas (sugestões, não obrigatórias).
const refreshCategoryOptions = () => {
  const cats = [...new Set(allNotes.map((n) => n.category).filter(Boolean))].sort();
  $('note-cat-list').innerHTML = cats.map((c) => `<option value="${escHtml(c)}">`).join('');
};

const renderNotesList = (notes) => {
  const list = $('notes-list');
  if (!notes.length) {
    list.innerHTML = `<div class="notes-empty">Nenhuma nota ainda.<br>Clique em <strong>+</strong> para criar.</div>`;
    return;
  }
  list.innerHTML = notes.map((n) => {
    const color = catColor(n.category);
    const tags = (n.tags || []).map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('');
    return `<div class="note-item${currentNote?.id === n.id ? ' active' : ''}" onclick="openNote('${n.id}')">
      <div class="note-item-top">
        <span class="note-cat-dot" style="background:${color}"></span>
        <span class="note-item-title">${escHtml(n.title)}</span>
      </div>
      <div class="note-item-preview">${escHtml(n.preview || '')}</div>
      ${tags ? `<div class="note-item-tags">${tags}</div>` : ''}
    </div>`;
  }).join('');
};

// ── Filtros ──

const renderFilters = () => {
  const selCat = $('notes-filter-cat');
  const selTag = $('notes-filter-tag');
  const curCat = selCat.value;
  const curTag = selTag.value;

  const cats = [...new Set(allNotes.map((n) => n.category).filter(Boolean))].sort();
  selCat.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map((c) => `<option value="${escHtml(c)}"${c === curCat ? ' selected' : ''}>${escHtml(c)}</option>`).join('');

  const tags = [...new Set(allNotes.flatMap((n) => n.tags || []))].sort();
  selTag.innerHTML = '<option value="">Todas as tags</option>' +
    tags.map((t) => `<option value="${escHtml(t)}"${t === curTag ? ' selected' : ''}>${escHtml(t)}</option>`).join('');
};

const applyFilters = () => {
  const q   = $('notes-search-input').value.trim().toLowerCase();
  const cat = $('notes-filter-cat').value;
  const tag = $('notes-filter-tag').value;

  let filtered = allNotes;
  if (cat) filtered = filtered.filter((n) => n.category === cat);
  if (tag) filtered = filtered.filter((n) => (n.tags || []).includes(tag));
  if (q)   filtered = filtered.filter((n) =>
    n.title.toLowerCase().includes(q) ||
    (n.preview || '').toLowerCase().includes(q) ||
    (n.tags || []).some((t) => t.toLowerCase().includes(q)));

  renderNotesList(filtered);
};

const filterNotes = (q) => {
  const ql = q.toLowerCase();
  return allNotes.filter((n) =>
    n.title.toLowerCase().includes(ql) ||
    (n.preview || '').toLowerCase().includes(ql) ||
    (n.tags || []).some((t) => t.toLowerCase().includes(ql)));
};

// ── Abrir / novo ──
const showEditor = () => {
  $('notes-editor-empty').classList.add('hidden');
  $('notes-editor-form').classList.add('visible');
};

const openNote = async (id) => {
  if (currentMode !== 'notes') setMode('notes');
  try {
    const res = await fetch('/notes/' + id);
    currentNote = await res.json();
    fillEditor(currentNote);
    applyFilters(); // preserva filtros ativos ao atualizar item ativo na lista
  } catch (err) { console.error('Erro ao abrir nota:', err); }
};

const updateCatDot = () => {
  $('note-cat-dot').style.background = catColor($('note-cat-input').value.trim() || 'general');
};

const newNote = () => {
  currentNote = null;
  $('note-title-input').value = '';
  $('note-content-textarea').value = '';
  $('note-tags-input').value = '';
  $('note-cat-input').value = '';
  updateCatDot();
  $('note-id-badge').style.display = 'none';
  $('btn-copy-note').style.display = 'none';
  $('btn-delete-note').style.display = 'none';
  showEditor();
  setPreviewMode(false);
  $('note-title-input').focus();
};

const fillEditor = (note) => {
  $('note-title-input').value = note.title;
  $('note-content-textarea').value = note.content;
  $('note-tags-input').value = (note.tags || []).join(', ');
  $('note-cat-input').value = note.category || '';
  updateCatDot();
  const badge = $('note-id-badge');
  badge.textContent = note.id.slice(0, 8);
  badge.style.display = 'inline-block';
  $('btn-copy-note').style.display = 'inline-flex';
  $('btn-delete-note').style.display = 'inline-flex';
  showEditor();
  setPreviewMode(true); // abre em preview; usuário clica "Editar" se quiser modificar
};

// ── Salvar / excluir ──
const saveCurrentNote = async () => {
  const title = $('note-title-input').value.trim();
  const content = $('note-content-textarea').value.trim();
  const tags = $('note-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  const category = $('note-cat-input').value.trim() || 'general';
  if (!title) { $('note-title-input').focus(); return toast('Dê um título à nota'); }

  try {
    const url = currentNote ? '/notes/' + currentNote.id : '/notes';
    const method = currentNote ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tags, category }),
    });
    currentNote = await res.json();
    fillEditor(currentNote);
    const listRes = await fetch('/notes');
    allNotes = await listRes.json();
    refreshCategoryOptions();
    renderFilters();
    applyFilters(); // re-aplica filtros ativos após salvar
    toast('Nota salva');
  } catch (err) { console.error('Erro ao salvar nota:', err); toast('Erro ao salvar'); }
};

const deleteCurrentNote = async () => {
  if (!currentNote) return;
  const ok = await confirmDialog(`Excluir a nota "${currentNote.title}"?`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/notes/' + currentNote.id, { method: 'DELETE' });
  currentNote = null;
  $('notes-editor-form').classList.remove('visible');
  $('notes-editor-empty').classList.remove('hidden');
  await loadNotesList();
  toast('Nota excluída');
};

const copyNoteId = () => currentNote && copyToClipboard(currentNote.id, 'ID copiado — cole numa IA');

// ── Preview ──
const setPreviewMode = (on) => {
  previewMode = on;
  const ta = $('note-content-textarea');
  const pv = $('note-preview');
  const btn = $('btn-preview');
  if (on) {
    pv.innerHTML = window.marked ? marked.parse(ta.value) : `<pre>${escHtml(ta.value)}</pre>`;
    ta.style.display = 'none';
    pv.classList.add('visible');
    btn.innerHTML = `${ICON('pencil')} Editar`;
  } else {
    pv.classList.remove('visible');
    ta.style.display = '';
    btn.innerHTML = `${ICON('eye')} Preview`;
  }
};
const toggleNotePreview = () => setPreviewMode(!previewMode);

// ── Atualiza o pontinho de cor ao digitar a categoria ──
$('note-cat-input').addEventListener('input', updateCatDot);

// ── Busca + filtros combinados ──
$('notes-search-input').addEventListener('input', debounce(() => applyFilters(), 200));

// ── Atalho: Ctrl/Cmd+S salva ──
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'notes') {
    e.preventDefault();
    saveCurrentNote();
  }
});
