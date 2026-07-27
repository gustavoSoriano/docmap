// ════ Mocks — HTTP Mock Server Manager ════

const MOCK_SERVER = 'http://127.0.0.1:3335';

let allCollections = [];
let allMocks       = [];
let activeColId    = null;   // null = show all
let currentMockId  = null;
let scriptEditor   = null;   // instância CodeMirror (lazy init)

// Inicializa o editor de script uma única vez, quando o form fica visível.
const initScriptEditor = () => {
  if (scriptEditor || typeof CodeMirror === 'undefined') return;
  const ta = $('mock-script-textarea');
  if (!ta) return;

  scriptEditor = CodeMirror.fromTextArea(ta, {
    mode:           'javascript',
    theme:          'default',
    lineNumbers:    true,
    tabSize:        2,
    indentWithTabs: false,
    lineWrapping:   true,
    viewportMargin: Infinity,   // altura automática, sem scroll interno
    extraKeys: {
      Tab: (cm) => cm.replaceSelection('  '),
    },
  });
};

const editorGet = () =>
  scriptEditor ? scriptEditor.getValue() : ($('mock-script-textarea')?.value ?? '');

const editorSet = (value) => {
  if (scriptEditor) {
    scriptEditor.setValue(value);
    requestAnimationFrame(() => scriptEditor.refresh());
  } else if ($('mock-script-textarea')) {
    $('mock-script-textarea').value = value;
  }
};

const editorFocus = () =>
  scriptEditor ? scriptEditor.focus() : $('mock-script-textarea')?.focus();

// ══════════════════════════════════════════
// Data
// ══════════════════════════════════════════

const loadMocksData = async () => {
  try {
    const [colsRes, mocksRes] = await Promise.all([
      fetch('/mocks/collections'),
      fetch('/mocks'),
    ]);
    allCollections = await colsRes.json();
    allMocks       = await mocksRes.json();
    renderCollections();
    renderMocksList();
    updateServerBadge();
    updateGroupsDatalist();
    updateClearBtn();
  } catch (err) {
    console.error('Erro ao carregar mocks:', err);
  }
};

// ══════════════════════════════════════════
// Collections
// ══════════════════════════════════════════

const renderCollections = () => {
  const list = $('mocks-col-list');
  if (!list) return;

  if (!allCollections.length) {
    list.innerHTML = `<div class="mocks-col-empty">Nenhuma collection ainda.<br>Crie a primeira.</div>`;
    return;
  }

  list.innerHTML = allCollections.map((col) => {
    const count  = allMocks.filter((m) => m.collectionId === col.id).length;
    const active = col.id === activeColId ? ' active' : '';
    return `<div class="mocks-col-item${active}" data-id="${col.id}">
      <div class="mocks-col-item-inner" onclick="selectCollection('${col.id}')">
        <span class="mocks-col-dot"></span>
        <span class="mocks-col-name">${escHtml(col.name)}</span>
        <span class="mocks-col-count">${count}</span>
      </div>
      <div class="mocks-col-actions">
        <button class="mocks-col-action-btn" onclick="renameCollection('${col.id}')" title="Renomear">
          <span data-icon="pencil"></span>
        </button>
        <button class="mocks-col-action-btn warn" onclick="clearCollectionMocks('${col.id}')" title="Limpar mocks (mantém collection)">
          <span data-icon="minus"></span>
        </button>
        <button class="mocks-col-action-btn danger" onclick="removeCollection('${col.id}')" title="Deletar collection">
          <span data-icon="trash"></span>
        </button>
      </div>
    </div>`;
  }).join('');
  hydrateIcons(list);
};

const selectCollection = (id) => {
  activeColId = activeColId === id ? null : id;
  renderCollections();
  renderMocksList();
  updateClearBtn();
};

const newCollection = () => {
  if ($('new-col-input-row')) return;  // já aberto

  const list = $('mocks-col-list');
  if (!list) return;

  const row = document.createElement('div');
  row.id = 'new-col-input-row';
  row.className = 'mocks-col-new-row';
  row.innerHTML = `
    <input id="new-col-input" class="mocks-col-new-input"
      placeholder="Nome da collection…" autocomplete="off" spellcheck="false"/>
    <button class="mocks-col-new-ok" onclick="confirmNewCollection()" title="Criar">
      <span data-icon="plus"></span>
    </button>
  `;
  list.prepend(row);
  hydrateIcons(row);

  const input = $('new-col-input');
  input.focus();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmNewCollection(); }
    if (e.key === 'Escape') cancelNewCollection();
  });
};

const confirmNewCollection = async () => {
  const input = $('new-col-input');
  if (!input) return;
  const name = input.value.trim();
  cancelNewCollection();
  if (!name) return;
  await fetch('/mocks/collections', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name }),
  });
  await loadMocksData();
};

const cancelNewCollection = () => $('new-col-input-row')?.remove();

const renameCollection = (id) => {
  const col = allCollections.find((c) => c.id === id);
  if (!col) return;

  const nameEl = document.querySelector(`[data-id="${id}"] .mocks-col-name`);
  if (!nameEl) return;

  const original = col.name;
  const input = document.createElement('input');
  input.className = 'mocks-col-rename-input';
  input.value = original;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  let done = false;
  const commit = async () => {
    if (done) return;
    done = true;
    const name = input.value.trim();
    if (name && name !== original) {
      await fetch(`/mocks/collections/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      });
    }
    await loadMocksData();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { done = true; loadMocksData(); }
  });
  input.addEventListener('blur', commit);
};

const removeCollection = async (id) => {
  const col   = allCollections.find((c) => c.id === id);
  if (!col) return;
  const count = allMocks.filter((m) => m.collectionId === id).length;
  const msg   = count
    ? `Remover "${col.name}" e seus ${count} mock(s)?`
    : `Remover collection "${col.name}"?`;
  const ok = await confirmDialog(msg, { okLabel: 'Remover', danger: true });
  if (!ok) return;
  await fetch(`/mocks/collections/${id}`, { method: 'DELETE' });
  if (activeColId === id) activeColId = null;
  if (currentMockId && allMocks.find((m) => m.id === currentMockId)?.collectionId === id) {
    currentMockId = null;
    hideEditorPanel();
  }
  await loadMocksData();
};

// ══════════════════════════════════════════
// Mocks list
// ══════════════════════════════════════════

const METHOD_CLS = {
  GET: 'method-get', POST: 'method-post', PUT: 'method-put',
  PATCH: 'method-patch', DELETE: 'method-delete',
  HEAD: 'method-gray', OPTIONS: 'method-gray',
};

const renderMocksList = () => {
  const list    = $('mocks-list');
  const heading = $('mocks-list-heading');
  if (!list) return;

  const filtered = activeColId
    ? allMocks.filter((m) => m.collectionId === activeColId)
    : allMocks;

  if (heading) {
    const col     = allCollections.find((c) => c.id === activeColId);
    heading.textContent = col ? col.name : 'Todos os mocks';
  }

  if (!filtered.length) {
    list.innerHTML = `<div class="mocks-list-empty">
      <span data-icon="share"></span>
      <span>Nenhum mock aqui.<br>Crie o primeiro.</span>
    </div>`;
    hydrateIcons(list);
    return;
  }

  // Agrupa por group (string vazia = sem grupo)
  const groups = new Map();
  for (const mock of filtered) {
    const g = mock.group || '';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(mock);
  }

  // Ungrouped primeiro, depois grupos nomeados em ordem
  const sortedGroups = [
    ...(groups.has('') ? [['', groups.get('')]] : []),
    ...[...groups.entries()].filter(([g]) => g !== '').sort(([a], [b]) => a.localeCompare(b)),
  ];

  let html = '';
  for (const [group, mocks] of sortedGroups) {
    if (group) {
      html += `<div class="mocks-group-sep">
        <span class="mocks-group-line"></span>
        <span class="mocks-group-label">${escHtml(group)}</span>
        <span class="mocks-group-line"></span>
      </div>`;
    }
    html += mocks.map((m) => {
      const active  = m.id === currentMockId ? ' active' : '';
      const mCls    = METHOD_CLS[m.method] ?? 'method-gray';
      const colName = !activeColId
        ? allCollections.find((c) => c.id === m.collectionId)?.name ?? ''
        : '';
      return `<div class="mocks-item${active}" data-id="${m.id}" onclick="openMockEditor('${m.id}')">
        <span class="mock-method-badge ${mCls}">${escHtml(m.method)}</span>
        <div class="mock-item-info">
          <span class="mock-item-path">${escHtml(m.path)}</span>
          ${m.name ? `<span class="mock-item-name">${escHtml(m.name)}</span>` : ''}
          ${(m.tags||[]).length ? `<div class="mock-item-tags">${m.tags.map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
        ${colName ? `<span class="mock-item-col">${escHtml(colName)}</span>` : ''}
      </div>`;
    }).join('');
  }

  list.innerHTML = html;
};

// ══════════════════════════════════════════
// Editor
// ══════════════════════════════════════════

const DEFAULT_SCRIPT = `// ctx: { method, path, params, query, headers, body }
// db:  { get, set, delete, has, list, keys, clear, size }
return {
  status: 200,
  body: {
    message: "ok",
    params: ctx.params,
    query:  ctx.query,
  }
};`;

const openMockEditor = (id) => {
  const mock = allMocks.find((m) => m.id === id);
  if (!mock) return;
  currentMockId = id;
  renderMocksList();
  showEditorForm(mock);
};

const newMock = () => {
  if (!allCollections.length) {
    toast('Crie uma collection primeiro');
    return;
  }
  currentMockId = null;
  const col = allCollections.find((c) => c.id === activeColId) ?? allCollections[0];
  renderMocksList();
  showEditorForm({
    collectionId: col?.id ?? '',
    method: 'GET',
    path: '',
    name: '',
    group: '',
    script: DEFAULT_SCRIPT,
  });
  setTimeout(() => $('mock-path-input')?.focus(), 50);
};

const showEditorForm = (mock) => {
  const empty = $('mocks-editor-empty');
  const form  = $('mocks-editor-form');
  if (empty) empty.style.display = 'none';
  if (form)  form.style.display  = 'flex';

  populateCollectionSelect(mock.collectionId);
  updateMethodSelectColor(mock.method);

  $('mock-method-select').value = mock.method ?? 'GET';
  $('mock-path-input').value    = mock.path   ?? '';
  $('mock-name-input').value    = mock.name   ?? '';
  $('mock-group-input').value   = mock.group  ?? '';
  $('mock-tags-input').value    = (mock.tags || []).join(', ');

  initScriptEditor();
  editorSet(mock.script ?? DEFAULT_SCRIPT);

  const badge   = $('mock-id-badge');
  const delBtn  = $('btn-mock-delete');
  const isNew   = !mock.id;

  if (badge) {
    badge.textContent   = isNew ? '— novo mock —' : `${mock.method}  ${mock.path}`;
    badge.dataset.method = mock.method ?? 'GET';
  }
  if (delBtn) delBtn.style.display = isNew ? 'none' : 'inline-flex';

  hideTestPanel();
};

const hideEditorPanel = () => {
  const empty = $('mocks-editor-empty');
  const form  = $('mocks-editor-form');
  if (empty) empty.style.display = 'flex';
  if (form)  form.style.display  = 'none';
};

const populateCollectionSelect = (selectedId) => {
  const sel = $('mock-collection-select');
  if (!sel) return;
  sel.innerHTML = allCollections.length
    ? allCollections.map((c) =>
        `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${escHtml(c.name)}</option>`
      ).join('')
    : `<option value="">— sem collections —</option>`;
};

const updateMethodSelectColor = (method) => {
  const sel = $('mock-method-select');
  if (!sel) return;
  sel.dataset.method = method ?? 'GET';
};

const saveMock = async () => {
  const colId  = $('mock-collection-select').value;
  const method = $('mock-method-select').value;
  const path   = $('mock-path-input').value.trim();
  const name   = $('mock-name-input').value.trim();
  const group  = $('mock-group-input').value.trim();
  const script = editorGet();

  if (!colId)         { toast('Selecione uma collection'); return; }
  if (!path)          { $('mock-path-input').focus();      return; }
  if (!script.trim()) { editorFocus();                     return; }

  const tags = $('mock-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  const body = { collectionId: colId, method, path, name, group, script, tags };

  try {
    if (currentMockId) {
      await fetch(`/mocks/${currentMockId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
    } else {
      const res     = await fetch('/mocks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const created = await res.json();
      currentMockId = created.id;
    }

    await loadMocksData();
    toast('Mock salvo');

    // Atualiza badge
    const badge = $('mock-id-badge');
    if (badge) {
      badge.textContent    = `${method}  ${path}`;
      badge.dataset.method = method;
    }
    $('btn-mock-delete') && ($('btn-mock-delete').style.display = 'inline-flex');
  } catch { toast('Erro ao salvar mock'); }
};

const deleteCurrentMock = async () => {
  if (!currentMockId) return;
  const mock = allMocks.find((m) => m.id === currentMockId);
  const ok   = await confirmDialog(
    `Remover mock "${mock?.method ?? ''} ${mock?.path ?? ''}"?`,
    { okLabel: 'Remover', danger: true },
  );
  if (!ok) return;
  await fetch(`/mocks/${currentMockId}`, { method: 'DELETE' });
  currentMockId = null;
  hideEditorPanel();
  await loadMocksData();
};

// ── Method select color sync ──
const onMethodChange = (sel) => updateMethodSelectColor(sel.value);

// ══════════════════════════════════════════
// Test panel
// ══════════════════════════════════════════

const extractPathParams = (path) =>
  [...(path.matchAll(/:(\w+)/g))].map((m) => m[1]);

const showTestPanel = () => {
  const path  = $('mock-path-input').value.trim();
  const panel = $('mock-test-panel');
  if (!panel || !path) return;

  panel.style.display = 'flex';

  const params    = extractPathParams(path);
  const paramsEl  = $('mock-test-params');
  if (paramsEl) {
    if (params.length) {
      paramsEl.style.display = 'block';
      paramsEl.innerHTML     = `<div class="test-params-label">Path params</div>` +
        params.map((p) =>
          `<div class="test-param-row">
            <span class="test-param-name">:${escHtml(p)}</span>
            <input class="test-param-input" id="test-param-${escHtml(p)}" value="1" spellcheck="false"/>
          </div>`
        ).join('');
    } else {
      paramsEl.innerHTML     = '';
      paramsEl.style.display = 'none';
    }
  }

  $('mock-test-result') && ($('mock-test-result').style.display = 'none');
};

const hideTestPanel = () => {
  const panel = $('mock-test-panel');
  if (panel) panel.style.display = 'none';
};

const runTest = async () => {
  const path   = $('mock-path-input').value.trim();
  const method = $('mock-method-select').value;
  if (!path) return;

  const params = extractPathParams(path);
  let resolved = path;
  for (const p of params) {
    const val = $(`test-param-${p}`)?.value || '1';
    resolved  = resolved.replace(`:${p}`, encodeURIComponent(val));
  }

  const btn = $('btn-test-run');
  if (btn) { btn.disabled = true; btn.textContent = 'Chamando…'; }

  try {
    const t0   = performance.now();
    const res  = await fetch(`${MOCK_SERVER}${resolved}`, { method });
    const ms   = Math.round(performance.now() - t0);
    const text = await res.text();

    let bodyDisplay;
    try {
      bodyDisplay = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      bodyDisplay = text;
    }

    renderTestResult({ status: res.status, ms, body: bodyDisplay, ok: res.ok });
  } catch (err) {
    renderTestResult({ status: 0, ms: 0, body: String(err), ok: false });
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Executar'; }
  }
};

const renderTestResult = ({ status, ms, body, ok }) => {
  const el = $('mock-test-result');
  if (!el) return;
  el.style.display = 'flex';

  const sCls   = ok ? 'test-status-ok' : 'test-status-err';
  const sLabel = status ? String(status) : 'ERR';

  el.innerHTML = `
    <div class="test-result-meta">
      <span class="test-status-badge ${sCls}">${escHtml(sLabel)}</span>
      ${ms ? `<span class="test-ms">${ms}ms</span>` : ''}
    </div>
    <pre class="test-body">${escHtml(body)}</pre>
  `;
};

// ══════════════════════════════════════════
// Clear
// ══════════════════════════════════════════

// Zera os mocks de uma collection sem deletá-la.
// Chamado pelo botão do footer (contextual) e pelo botão − do hover.
const clearCollectionMocks = async (id) => {
  const col   = allCollections.find((c) => c.id === id);
  if (!col) return;
  const count = allMocks.filter((m) => m.collectionId === id).length;
  if (!count) { toast(`"${col.name}" já está vazia`); return; }

  const ok = await confirmDialog(
    `Zerar banco de "${col.name}"?\n${count} mock(s) serão removidos. A collection será mantida.`,
    { okLabel: 'Zerar banco', danger: true },
  );
  if (!ok) return;

  await fetch(`/mocks/collections/${id}/clear`, { method: 'DELETE' });
  if (currentMockId && allMocks.find((m) => m.id === currentMockId)?.collectionId === id) {
    currentMockId = null;
    hideEditorPanel();
  }
  await loadMocksData();
  toast(`Banco de "${col.name}" zerado`);
};

// Botão do rodapé: contextual à collection selecionada.
// Se nenhuma collection ativa, zera tudo (collections + mocks).
const clearMockDatabase = async () => {
  if (activeColId) {
    await clearCollectionMocks(activeColId);
    return;
  }

  // Nenhuma collection selecionada → zerar tudo
  const total = allMocks.length;
  const cols  = allCollections.length;
  if (!total && !cols) { toast('Banco já está vazio'); return; }

  const ok = await confirmDialog(
    `Zerar tudo?\n${cols} collection(s) e ${total} mock(s) serão removidos permanentemente.`,
    { okLabel: 'Zerar tudo', danger: true },
  );
  if (!ok) return;

  await fetch('/mocks/clear', { method: 'DELETE' });
  activeColId   = null;
  currentMockId = null;
  hideEditorPanel();
  await loadMocksData();
  toast('Banco de mocks zerado');
};

// ══════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════

const formatScript = () => {
  if (typeof js_beautify === 'undefined') {
    toast('Formatter não carregado ainda');
    return;
  }
  const code = editorGet();
  if (!code.trim()) return;

  const formatted = js_beautify(code, {
    indent_size:                2,
    indent_char:                ' ',
    max_preserve_newlines:      2,
    preserve_newlines:          true,
    keep_array_indentation:     false,
    break_chained_methods:      false,
    brace_style:                'collapse',
    space_before_conditional:   true,
    unescape_strings:           false,
    jslint_happy:               false,
    end_with_newline:           false,
    wrap_line_length:           0,
    comma_first:                false,
    e4x:                        false,
    indent_empty_lines:         false,
  });

  editorSet(formatted);
};

const copyCurl = () => {
  const method = $('mock-method-select').value;
  const path   = $('mock-path-input').value.trim();
  if (!path) { toast('Defina o path primeiro'); return; }

  // Substitui :param por valor de exemplo
  const resolved = path.replace(/:(\w+)/g, '1');
  const url      = `${MOCK_SERVER}${resolved}`;

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const parts   = [`curl -X ${method}`];
  if (hasBody) parts.push(`-H 'Content-Type: application/json'`, `-d '{}'`);
  parts.push(`'${url}'`);

  copyToClipboard(parts.join(' \\\n  '), 'curl copiado');
};

const updateServerBadge = () => {
  const el = $('mocks-server-count');
  if (el) el.dataset.count = String(allMocks.length);
};

const updateClearBtn = () => {
  const btn = $('mocks-clear-btn');
  const lbl = btn?.querySelector('.mocks-clear-label');
  if (!lbl) return;
  if (activeColId) {
    const col  = allCollections.find((c) => c.id === activeColId);
    lbl.textContent = col ? `Zerar "${col.name}"` : 'Zerar banco';
  } else {
    lbl.textContent = 'Zerar tudo';
  }
};

const updateGroupsDatalist = () => {
  const dl = $('mock-groups-list');
  if (!dl) return;
  const groups = [...new Set(allMocks.map((m) => m.group).filter(Boolean))].sort();
  dl.innerHTML = groups.map((g) => `<option value="${escHtml(g)}"></option>`).join('');
};
