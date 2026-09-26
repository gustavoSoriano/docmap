// ════ Notas — base de conhecimento (CRUD, exposta à IA via API) ════

let allNotes           = [];
let allCategories      = [];
let currentNote        = null;
let previewMode        = false;

// ── Lista ──
const loadNotesList = async () => {
  try {
    const [notesRes, catsRes] = await Promise.all([
      fetch('/notes'),
      fetch('/categories'),
    ]);
    allNotes = await notesRes.json();
    try { allCategories = await catsRes.json(); } catch { allCategories = []; }
    refreshCategoryOptions();
    renderFilters();
    applyFilters();
  } catch (err) { console.error('Erro ao carregar notas:', err); }
};

// Categorias vêm do cadastro próprio (com descrição). Fallback: deriva das notas.
const categoryNames = () => {
  if (allCategories.length) return allCategories.map((c) => c.name).sort();
  return [...new Set(allNotes.map((n) => n.category).filter(Boolean))].sort();
};

// Preenche o datalist com as categorias cadastradas (sugestões, não obrigatórias).
const refreshCategoryOptions = () => {
  const cats = categoryNames();
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

  const cats = categoryNames();
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
  const category = $('note-cat-input').value.trim();
  if (!title) { $('note-title-input').focus(); toast('Dê um título à nota'); return null; }

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
    const [listRes, catsRes] = await Promise.all([fetch('/notes'), fetch('/categories')]);
    allNotes = await listRes.json();
    try { allCategories = await catsRes.json(); } catch { /* mantém anterior */ }
    refreshCategoryOptions();
    renderFilters();
    applyFilters(); // re-aplica filtros ativos após salvar
    toast('Nota salva');
    return currentNote;
  } catch (err) { console.error('Erro ao salvar nota:', err); toast('Erro ao salvar'); return null; }
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

// ── Imagens coladas (binário no disco, markdown no conteúdo) ──
const insertAtCursor = (ta, text) => {
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? ta.value.length;
  ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
  const pos = start + text.length;
  ta.selectionStart = ta.selectionEnd = pos;
  ta.focus();
};

const insertImageMarkdown = (url) => {
  const ta = $('note-content-textarea');
  insertAtCursor(ta, `\n![](${url})\n`);
  if (previewMode) setPreviewMode(true); // re-renderiza o preview
  toast('Imagem anexada');
};

const ensureNoteForAttachment = async () => {
  if (currentNote) return true;
  const saved = await saveCurrentNote();
  if (!saved) toast('Salve a nota antes de colar imagens');
  return !!saved;
};

const uploadNoteImage = async (file) => {
  if (!file || file.size === 0) { toast('Imagem vazia'); return; }
  // Servidor valida pelos magic bytes — aqui aceitamos blob sem MIME (ex.: UTI).
  const contentType = file.type && file.type.startsWith('image/')
    ? file.type
    : 'image/png';
  if (!await ensureNoteForAttachment()) return;
  try {
    const res = await fetch(`/notes/${currentNote.id}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!res.ok) throw new Error(await res.text());
    const { url } = await res.json();
    insertImageMarkdown(url);
  } catch (err) { console.error('Erro ao anexar imagem:', err); toast('Falha ao anexar imagem'); }
};

// Caminho de arquivo local vindo da área de transferência (ex.: print que
// foi copiado como referência em vez dos dados). O servidor lê do disco.
const uploadNoteImagePath = async (filePath) => {
  if (!await ensureNoteForAttachment()) return;
  try {
    const res = await fetch(`/notes/${currentNote.id}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { url } = await res.json();
    insertImageMarkdown(url);
  } catch (err) { console.error('Erro ao anexar arquivo:', err); toast('Falha ao ler o arquivo'); }
};

const looksLikeImagePath = (text) => {
  const t = (text || '').trim();
  if (!t || t.includes('\n')) return null;
  if (/^file:\/\//i.test(t)) return t;
  if (/^~?\//.test(t) && /\.(png|jpe?g|gif|webp|tiff?|bmp)$/i.test(t)) return t;
  if (/^[A-Za-z]:[\\/]/.test(t) && /\.(png|jpe?g|gif|webp|tiff?|bmp)$/i.test(t)) return t;
  return null;
};

const onNotePaste = (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) { toast('Não consegui ler a imagem — tente Ctrl+V'); return; }
      uploadNoteImage(file);
      return;
    }
  }
  // Imagem na área sem item legível: evita o "colar em branco" silencioso.
  const types = [...(e.clipboardData?.types || [])];
  if (types.some((t) => /^image\//i.test(t) || /tiff|picture|public\.image/i.test(t))) {
    e.preventDefault();
    toast('Formato de imagem não suportado');
  }
};

// macOS: Ctrl+V não tem binding nativo (colar é Cmd+V) — o WebKit nem
// dispara o evento `paste`. Lê o clipboard manualmente só nesse caso.
// (Win/Linux mantêm o Ctrl+V nativo, que já cai no onNotePaste.)
const IS_MAC = /mac/i.test(navigator.platform || '') ||
  /mac/i.test(navigator.userAgent || '');

// Colagem manual no macOS (Ctrl+V e Cmd+V): o host do webview nem sempre
// transforma o atalho em evento `paste` (diagnóstico mostrou Cmd+V chegando
// sem `paste` em seguida). Lê o clipboard direto e insere. Win/Linux seguem
// no Ctrl+V nativo, que já cai no onNotePaste.
const onNoteManualPaste = async (e) => {
  if (!IS_MAC) return;
  if (e.altKey) return;
  // `code` cobre teclado remapeado (posição física), `key` cobre o normal.
  if (String(e.key || '').toLowerCase() !== 'v' && e.code !== 'KeyV') return;
  // Ctrl+V não tem nativo no mac; Cmd+V interceptamos só se a Clipboard
  // API existir (sem ela, melhor não roubar o nativo).
  const wantCtrl = e.ctrlKey && !e.metaKey;
  const wantMeta = e.metaKey && !e.ctrlKey && !!navigator.clipboard?.read;
  if (!wantCtrl && !wantMeta) return;
  if (e.target !== $('note-content-textarea')) return;
  e.preventDefault();
  try {
    if (!navigator.clipboard?.read) {
      toast('Clipboard API indisponível — use Cmd+V');
      return;
    }
    const items = await navigator.clipboard.read();
    const seenTypes = items.flatMap((i) => [...i.types]);
    console.log('[notas] clipboard types:', seenTypes);
    if (!items.length) { toast('Clipboard vazio'); return; }
    // Liberal aqui, estrito no servidor (magic bytes decidem).
    for (const item of items) {
      for (const t of item.types) {
        if (!/^image\//i.test(t) && !/tiff|png|jpe?g|gif|webp|picture|public\.image/i.test(t)) continue;
        try {
          const blob = await item.getType(t);
          if (blob && blob.size > 0) { await uploadNoteImage(blob); return; }
        } catch { /* tenta o próximo tipo */ }
      }
    }
    // Sem dados de imagem: pode ser referência de arquivo (text/uri-list)
    // ou texto comum.
    for (const item of items) {
      const textType = item.types.find((t) =>
        t === 'text/uri-list' || t === 'text/plain');
      if (textType) {
        const text = await (await item.getType(textType)).text();
        const path = looksLikeImagePath(text);
        if (path) { await uploadNoteImagePath(path); return; }
        if (text) { insertAtCursor($('note-content-textarea'), text); return; }
      }
    }
    const text = await navigator.clipboard?.readText?.();
    const path = looksLikeImagePath(text || '');
    if (path) { await uploadNoteImagePath(path); return; }
    if (text) { insertAtCursor($('note-content-textarea'), text); return; }
    toast('Clipboard tem só: ' + (seenTypes.join(', ') || 'nada legível'));
  } catch (err) {
    console.error('Erro ao ler clipboard:', err);
    toast('Sem acesso ao clipboard — use Cmd+V');
  }
};

// ── Categorias (cadastro com descrição, busca paginada no servidor) ──
const CATS_PAGE = 30;
let catsQuery = '';
let catsLimit = CATS_PAGE;
let catsTotal = 0;
let catsItems = [];
let catsSelected = null;

const openCatsModal = async () => {
  catsQuery = '';
  catsLimit = CATS_PAGE;
  catsSelected = null;
  const search = $('cats-search');
  if (search) search.value = '';
  $('cats-modal-overlay').classList.add('visible');
  await resolveSelectedCat();
  await loadCatsList();
};

const closeCatsModal = (e) => {
  if (e && e.target !== e.currentTarget && e.type === 'click') return;
  $('cats-modal-overlay').classList.remove('visible');
};

// Resolve a categoria da nota em edição (1 match exato, sem baixar o banco).
const resolveSelectedCat = async () => {
  catsSelected = null;
  const cur = (($('note-cat-input') && $('note-cat-input').value) || '').trim().toLowerCase();
  if (!cur) return;
  try {
    const res = await fetch('/categories?q=' + encodeURIComponent(cur) + '&limit=10');
    const items = await res.json();
    catsSelected = items.find((c) =>
      c.id.toLowerCase() === cur || c.name.toLowerCase() === cur) || null;
  } catch { /* sem seleção */ }
};

const filterCats = (q) => {
  catsQuery = q || '';
  catsLimit = CATS_PAGE;
  loadCatsList();
};
const filterCatsDebounced = debounce((q) => filterCats(q), 200);

const catsMore = async () => {
  catsLimit += CATS_PAGE;
  await loadCatsList();
  $('cats-list')?.lastElementChild?.scrollIntoView?.({ block: 'nearest' });
};

const catRowHtml = (c, isSel) => `
    <div class="cat-row${isSel ? ' selected' : ''}" data-id="${escHtml(c.id)}">
      <div class="cat-row-head">
        <strong>${escHtml(c.name)}</strong>
        ${isSel ? '<span class="cat-current-badge">atual</span>' : ''}
        <span class="note-tag">${escHtml(c.id)}</span>
        <span class="note-tag">${c.notes ?? 0} notas</span>
        <button class="ghost-btn" onclick="applyCatToNote('${escHtml(c.id)}')">usar</button>
        <button class="ghost-btn danger" onclick="deleteCat('${escHtml(c.id)}')">excluir</button>
      </div>
      <input class="cat-desc-input" data-id="${escHtml(c.id)}"
        placeholder="Descrição (para a IA entender o uso)…"
        value="${escHtml(c.description || '')}"
        onchange="saveCatDescription('${escHtml(c.id)}', this.value)" />
    </div>`;

const renderCatsList = () => {
  const list = $('cats-list');
  const q = catsQuery.trim();
  const items = catsItems.filter((c) => !catsSelected || c.id !== catsSelected.id);
  let html = '';
  if (catsSelected) {
    html += '<div class="cat-section-label">Categoria da nota</div>' + catRowHtml(catsSelected, true);
  }
  if (items.length) {
    const label = q ? `Resultados (${catsTotal} no total)` : 'Todas';
    html += `<div class="cat-section-label">${label}</div>` +
      items.map((c) => catRowHtml(c, false)).join('');
    if (catsTotal > catsLimit) {
      html += `<button class="ghost-btn cats-more" onclick="catsMore()">Mostrar mais (${Math.min(catsLimit, catsTotal)} de ${catsTotal})</button>`;
    }
  } else if (q) {
    html += `<div class="notes-empty">Nada para “${escHtml(q)}”.</div>`;
  } else if (!catsSelected) {
    html += '<div class="notes-empty">Nenhuma categoria ainda.</div>';
  }
  list.innerHTML = html;
};

// Busca UMA página no servidor — nunca baixa o banco todo.
const loadCatsList = async () => {
  try {
    const params = new URLSearchParams({ limit: String(catsLimit) });
    if (catsQuery.trim()) params.set('q', catsQuery.trim());
    const res = await fetch('/categories?' + params);
    catsTotal = Number(res.headers.get('X-Total-Count') ?? '0') || 0;
    catsItems = await res.json();
    if (!catsTotal) catsTotal = catsItems.length;
  } catch { /* mantém anterior */ }
  renderCatsList();
};

const reloadCatsModal = async () => {
  await resolveSelectedCat();
  await loadCatsList();
};

// Aplica a categoria na nota em edição e fecha a modal.
const applyCatToNote = (id) => {
  const cat = (catsSelected && catsSelected.id === id)
    ? catsSelected
    : catsItems.find((c) => c.id === id);
  if (!cat) return;
  $('note-cat-input').value = cat.name;
  updateCatDot();
  closeCatsModal();
  toast(`Categoria “${cat.name}” aplicada`);
};

const saveCatDescription = async (id, description) => {
  try {
    const res = await fetch('/categories/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (!res.ok) throw new Error(await res.text());
    toast('Descrição salva');
  } catch (err) { console.error('Erro ao salvar categoria:', err); toast('Erro ao salvar'); }
};

const createCatFromModal = async () => {
  const name = $('cats-new-name').value.trim();
  const description = $('cats-new-desc').value.trim();
  if (!name) { $('cats-new-name').focus(); return toast('Dê um nome à categoria'); }
  try {
    const res = await fetch('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (res.status === 409) return toast('Categoria já existe');
    if (!res.ok) throw new Error(await res.text());
    const created = await res.json();
    $('cats-new-name').value = '';
    $('cats-new-desc').value = '';
    if (created && created.id && !allCategories.some((c) => c.id === created.id)) {
      allCategories.push({ ...created, notes: 0 });
      refreshCategoryOptions();
      renderFilters();
    }
    await reloadCatsModal();
    toast('Categoria criada');
  } catch (err) { console.error('Erro ao criar categoria:', err); toast('Erro ao criar'); }
};

const deleteCat = async (id) => {
  const cat = allCategories.find((c) => c.id === id) || catsItems.find((c) => c.id === id);
  const count = cat?.notes ?? 0;
  const ok = await confirmDialog(
    count > 0
      ? `Excluir a categoria "${id}"? ${count} ${count === 1 ? 'nota ficará' : 'notas ficarão'} sem categoria.`
      : `Excluir a categoria "${id}"?`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;
  const res = await fetch('/categories/' + id, { method: 'DELETE' });
  if (!res.ok) return toast('Erro ao excluir');
  const data = await res.json().catch(() => ({}));
  allCategories = allCategories.filter((c) => c.id !== id);
  // As notas vinculadas ficaram sem categoria — recarrega a lista e o editor.
  try {
    const listRes = await fetch('/notes');
    allNotes = await listRes.json();
    if (currentNote && currentNote.category === id) {
      currentNote = { ...currentNote, category: '' };
      $('note-cat-input').value = '';
      updateCatDot();
    }
  } catch { /* mantém lista anterior */ }
  refreshCategoryOptions();
  renderFilters();
  applyFilters();
  await reloadCatsModal();
  const moved = data && typeof data.uncategorized === 'number' ? data.uncategorized : count;
  toast(moved > 0 ? `Categoria excluída — ${moved} ${moved === 1 ? 'nota ficou' : 'notas ficaram'} sem categoria` : 'Categoria excluída');
};

// ── Preview ──
const setPreviewMode = (on) => {
  previewMode = on;
  const ta = $('note-content-textarea');
  const pv = $('note-preview');
  const btn = $('btn-preview');
  if (on) {
    pv.innerHTML = renderMarkdown(ta.value);
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

// ── Colar imagem direto no conteúdo ──
$('note-content-textarea').addEventListener('paste', onNotePaste);
$('note-content-textarea').addEventListener('keydown', onNoteManualPaste);

// ── Busca + filtros combinados ──
$('notes-search-input').addEventListener('input', debounce(() => applyFilters(), 200));

// ── Atalho: Ctrl/Cmd+S salva ──
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'notes') {
    e.preventDefault();
    saveCurrentNote();
  }
});
