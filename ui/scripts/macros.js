// ════ Macros — runner de scripts bash/deno com output em tempo real ════

let allMacros    = [];
let macroCollections = [];
let activeMacroCollectionId = null;
let currentMacro = null;
let runReader    = null; // leitor SSE ativo
let macroEditor  = null; // instância CodeMirror (lazy init)

// ── CodeMirror helpers ──
const initMacroEditor = () => {
  if (macroEditor || typeof CodeMirror === 'undefined') return;
  const ta = $('macro-script');
  if (!ta) return;

  macroEditor = CodeMirror.fromTextArea(ta, {
    mode:           'shell',
    theme:          'default',
    lineNumbers:    true,
    tabSize:        2,
    indentWithTabs: false,
    lineWrapping:   true,
    viewportMargin: Infinity,
    extraKeys: {
      Tab: (cm) => cm.replaceSelection('  '),
    },
  });

  // auto-detecta interpretador ao editar e troca o mode
  macroEditor.on('change', () => {
    const first = macroEditor.getLine(0) ?? '';
    const interp = first.includes('deno') ? 'deno' : 'bash';
    $('macro-interp-badge').textContent = interp;
    $('macro-interp-badge').className   = `macro-badge ${interp}`;
    setMacroMode(interp);
  });
};

const macroGet = () =>
  macroEditor ? macroEditor.getValue() : ($('macro-script')?.value ?? '');

const macroSet = (value) => {
  if (macroEditor) {
    macroEditor.setValue(value);
  } else {
    const ta = $('macro-script');
    if (ta) ta.value = value;
  }
};

const setMacroMode = (interp) => {
  if (!macroEditor) return;
  const mode = interp === 'deno' ? 'javascript' : 'shell';
  macroEditor.setOption('mode', mode);
};

const macroFocus = () => {
  if (macroEditor) macroEditor.focus();
  else $('macro-script')?.focus();
};

// ── Lista ──
const loadMacrosList = async () => {
  try {
    const [res, collectionsRes] = await Promise.all([
      fetch('/macros'),
      fetch('/macros/collections'),
    ]);
    allMacros = await res.json();
    macroCollections = await collectionsRes.json();
    if (activeMacroCollectionId && !macroCollections.some((c) => c.id === activeMacroCollectionId)) {
      activeMacroCollectionId = null;
    }
    if (!allMacros.length) await seedDefaultMacros();
    else {
      renderMacroCollections();
      renderMacrosList();
      updateMacrosClearBtn();
    }
  } catch (err) { console.error('Erro ao carregar macros:', err); }
};

const renderMacrosList = () => {
  const list = $('macros-list');
  const macros = activeMacroCollectionId
    ? allMacros.filter((m) => m.collectionId === activeMacroCollectionId)
    : allMacros.filter((m) => !m.collectionId);
  const collection = macroCollections.find((c) => c.id === activeMacroCollectionId);
  $('macros-list-heading').textContent = collection?.name ?? 'Sem collection';
  if (!macros.length) {
    const emptyLabel = activeMacroCollectionId ? 'Nenhuma macro nesta collection ainda.' : 'Nenhuma macro sem collection ainda.';
    list.innerHTML = `<div class="macros-empty">${emptyLabel}<br>Clique em <strong>+</strong> para criar.</div>`;
    return;
  }
  list.innerHTML = macros.map((m) => {
    return `<div class="macro-item${currentMacro?.id === m.id ? ' active' : ''}" onclick="openMacro('${m.id}')">
      <div class="macro-item-top">
        <span class="macro-interp-dot ${m.interpreter}">${m.interpreter === 'deno' ? '🦕' : '⬡'}</span>
        <span class="macro-item-title">${escHtml(m.title)}</span>
      </div>
      <div class="macro-item-desc">${escHtml(m.description || '')}</div>
      ${(m.tags||[]).length ? `<div class="macro-item-tags">${m.tags.map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
    </div>`;
  }).join('');
};

const renderMacroCollections = () => {
  const list = $('macros-collections-list');
  if (!macroCollections.length) {
    list.innerHTML = `<div class="macros-col-empty">Nenhuma collection ainda.<br>Crie a primeira.</div>`;
    return;
  }
  list.innerHTML = macroCollections.map((collection) => {
    const count = allMacros.filter((macro) => macro.collectionId === collection.id).length;
    const active = activeMacroCollectionId === collection.id ? ' active' : '';
    return `<div class="macros-col-item${active}" data-macro-collection-id="${collection.id}">
      <div class="macros-col-item-inner" onclick="selectMacroCollection('${collection.id}')">
        <span class="macros-col-dot"></span>
        <span class="macros-col-name">${escHtml(collection.name)}</span>
        <span class="macros-col-count">${count}</span>
      </div>
      <div class="macros-col-actions">
        <button class="macros-col-action-btn" onclick="renameMacroCollection('${collection.id}')" title="Renomear">
          <span data-icon="pencil"></span>
        </button>
        <button class="macros-col-action-btn warn" onclick="clearMacroCollectionMocks('${collection.id}')" title="Limpar macros (mantém collection)">
          <span data-icon="minus"></span>
        </button>
        <button class="macros-col-action-btn danger" onclick="removeMacroCollection('${collection.id}')" title="Remover collection">
          <span data-icon="trash"></span>
        </button>
      </div>
    </div>`;
  }).join('');
  hydrateIcons(list);
};

const selectMacroCollection = (id) => {
  activeMacroCollectionId = activeMacroCollectionId === id ? null : id;
  renderMacroCollections();
  renderMacrosList();
  updateMacrosClearBtn();
};

const newMacroCollection = () => {
  if ($('new-macro-col-row')) return;
  const list = $('macros-collections-list');
  const row = document.createElement('div');
  row.id = 'new-macro-col-row';
  row.className = 'macros-col-new-row';
  row.innerHTML = `<input id="new-macro-col-input" class="macros-col-new-input"
    placeholder="Nome da collection…" autocomplete="off" spellcheck="false" />
    <button class="macros-col-new-ok" onclick="confirmNewMacroCollection()" title="Criar">
      <span data-icon="plus"></span>
    </button>`;
  list.prepend(row);
  hydrateIcons(row);
  const input = $('new-macro-col-input');
  input.focus();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); confirmNewMacroCollection(); }
    if (event.key === 'Escape') row.remove();
  });
};

const confirmNewMacroCollection = async () => {
  const input = $('new-macro-col-input');
  const name = input?.value.trim();
  $('new-macro-col-row')?.remove();
  if (!name) return;
  const res = await fetch('/macros/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) return toast(await res.text() || 'Erro ao criar collection');
  const collection = await res.json();
  activeMacroCollectionId = collection.id;
  await loadMacrosList();
};

const renameMacroCollection = (id) => {
  const collection = macroCollections.find((item) => item.id === id);
  const nameEl = document.querySelector(`[data-macro-collection-id="${id}"] .macros-col-name`);
  if (!collection || !nameEl) return;
  const input = document.createElement('input');
  input.className = 'macros-col-rename-input';
  input.value = collection.name;
  nameEl.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const commit = async () => {
    if (done) return;
    done = true;
    const name = input.value.trim();
    if (name && name !== collection.name) {
      await fetch(`/macros/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    }
    await loadMacrosList();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); commit(); }
    if (event.key === 'Escape') { done = true; loadMacrosList(); }
  });
  input.addEventListener('blur', commit);
};

const removeMacroCollection = async (id) => {
  const collection = macroCollections.find((item) => item.id === id);
  if (!collection) return;
  const count = allMacros.filter((macro) => macro.collectionId === id).length;
  const suffix = count ? ` As ${count} macro(s) serão preservadas sem collection.` : '';
  const ok = await confirmDialog(`Remover collection "${collection.name}"?${suffix}`, {
    okLabel: 'Remover', danger: true,
  });
  if (!ok) return;
  const res = await fetch(`/macros/collections/${id}`, { method: 'DELETE' });
  if (!res.ok) return toast('Erro ao remover collection');
  if (activeMacroCollectionId === id) activeMacroCollectionId = null;
  if (currentMacro?.collectionId === id) currentMacro = { ...currentMacro, collectionId: undefined };
  await loadMacrosList();
  updateMacrosClearBtn();
  if (currentMacro) fillMacroEditor(currentMacro);
};

// Zera uma collection (deleta as macros, mantém a collection).
const clearMacroCollectionMocks = async (id) => {
  const collection = macroCollections.find((item) => item.id === id);
  if (!collection) return;
  const count = allMacros.filter((macro) => macro.collectionId === id).length;
  if (!count) { toast(`"${collection.name}" já está vazia`); return; }
  const ok = await confirmDialog(
    `Zerar "${collection.name}"?\n${count} macro(s) serão removidas. A collection será mantida.`,
    { okLabel: 'Zerar', danger: true },
  );
  if (!ok) return;
  await fetch(`/macros/collections/${id}/clear`, { method: 'DELETE' });
  if (currentMacro?.collectionId === id) {
    currentMacro = null;
    $('macros-editor-form').classList.remove('visible');
    $('macros-editor-empty').style.display = 'flex';
    clearOutput();
  }
  await loadMacrosList();
  updateMacrosClearBtn();
  toast(`"${collection.name}" zerada`);
};

const updateMacrosCount = () => {
  const el = $('macros-count-text');
  if (el) {
    const n = allMacros.length;
    el.textContent = `${n} macro${n === 1 ? '' : 's'}`;
  }
};

const updateMacrosClearBtn = () => {
  updateMacrosCount();
  const lbl = document.querySelector('#macros-clear-btn .macros-clear-label');
  if (!lbl) return;
  if (activeMacroCollectionId) {
    const col = macroCollections.find((c) => c.id === activeMacroCollectionId);
    lbl.textContent = col ? `Zerar "${col.name}"` : 'Zerar tudo';
  } else {
    lbl.textContent = 'Zerar tudo';
  }
};

// Botão do rodapé: contextual à collection ativa.
// Sem collection ativa, apaga macro por macro + collection por collection
// (não há endpoint de clear-all em macros).
const clearMacrosDatabase = async () => {
  if (activeMacroCollectionId) {
    await clearMacroCollectionMocks(activeMacroCollectionId);
    return;
  }
  const total = allMacros.length;
  const cols = macroCollections.length;
  if (!total && !cols) { toast('Banco já está vazio'); return; }
  const ok = await confirmDialog(
    `Zerar tudo?\n${cols} collection(s) e ${total} macro(s) serão removidas permanentemente.`,
    { okLabel: 'Zerar tudo', danger: true },
  );
  if (!ok) return;
  for (const c of macroCollections) {
    await fetch(`/macros/collections/${c.id}/clear`, { method: 'DELETE' });
    await fetch(`/macros/collections/${c.id}`, { method: 'DELETE' });
  }
  for (const m of allMacros.filter((x) => !x.collectionId)) {
    await fetch(`/macros/${m.id}`, { method: 'DELETE' });
  }
  activeMacroCollectionId = null;
  currentMacro = null;
  $('macros-editor-form').classList.remove('visible');
  $('macros-editor-empty').style.display = 'flex';
  clearOutput();
  await loadMacrosList();
  updateMacrosClearBtn();
  toast('Banco de macros zerado');
};

// ── Seed macro padrão ──
const seedDefaultMacros = async () => {
  let defaultCollection = macroCollections[0];
  if (!defaultCollection) {
    const collectionRes = await fetch('/macros/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Geral' }),
    });
    defaultCollection = await collectionRes.json();
    macroCollections = [defaultCollection];
  }
  const defaults = [
    {
      title: 'Briefing do DocMap',
      name: 'briefing',
      description: 'Lista notas recentes e skills — contexto pra colar numa IA',
      collectionId: defaultCollection.id,
      script: `#!/usr/bin/env -S deno run --allow-net\nconst api = Deno.env.get('DOCMAP_API')\n\nconst notes = await fetch(\`\${api}/notes\`).then(r=>r.json())\nconst skills = await fetch(\`\${api}/skills\`).then(r=>r.json())\n\nconsole.log('# Briefing docmap\\n')\nconsole.log(\`## Notas recentes (\\${notes.length} total)\\n\`)\nnotes.slice(0,8).forEach(n => console.log(\`- **\\${n.title}** (\\${n.category}) — \\${n.preview?.slice(0,80)}...\`))\nconsole.log(\`\\n## Skills disponíveis\\n\`)\nskills.forEach(s => console.log(\`- @\\${s.name} — \\${s.description}\`))\nconsole.log('\\n---\\nCole este briefing no início de qualquer sessão com IA.')`,
    },
  ];

  for (const d of defaults) {
    await fetch('/macros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
  }
  await loadMacrosList();
};

// ── Abrir / Novo ──
const openMacro = async (id) => {
  if (currentMode !== 'macros') setMode('macros');
  try {
    const res = await fetch('/macros/' + id);
    currentMacro = await res.json();
    fillMacroEditor(currentMacro);
    renderMacrosList();
  } catch (err) { console.error('Erro ao abrir macro:', err); }
};

const newMacro = () => {
  currentMacro = null;
  $('macro-title-input').value = '';
  $('macro-desc-input').value  = '';
  $('macro-input-label').value = '';
  $('macro-tags-input').value  = '';
  $('macro-slug-value').textContent = '';
  $('macro-slug-copy-btn').style.display = 'none';
  populateMacroCollectionSelect(activeMacroCollectionId);
  macroSet('#!/bin/bash\n# Seu script aqui\n# $DOCMAP_API       → http://127.0.0.1:3334\n\necho "Olá do docmap!"');
  $('macro-interp-badge').textContent = 'bash';
  $('macro-interp-badge').className   = 'macro-badge bash';
  setMacroMode('bash');
  $('btn-macro-delete').style.display = 'none';
  clearOutput();
  showMacroEditor();
  $('macro-title-input').focus();
};

const fillMacroEditor = (m) => {
  $('macro-title-input').value       = m.title;
  $('macro-desc-input').value        = m.description || '';
  $('macro-input-label').value       = m.inputLabel || '';
  $('macro-tags-input').value        = (m.tags || []).join(', ');
  populateMacroCollectionSelect(m.collectionId);
  macroSet(m.script);
  $('macro-interp-badge').textContent = m.interpreter;
  $('macro-interp-badge').className   = `macro-badge ${m.interpreter}`;
  $('macro-slug-value').textContent = m.name || '';
  $('macro-slug-copy-btn').style.display = m.name ? 'inline-flex' : 'none';
  setMacroMode(m.interpreter);
  $('btn-macro-delete').style.display = 'inline-flex';
  clearOutput();
  showMacroEditor();
};

const showMacroEditor = () => {
  $('macros-editor-empty').style.display = 'none';
  $('macros-editor-form').classList.add('visible');
  initMacroEditor();
};

const populateMacroCollectionSelect = (selectedId) => {
  const select = $('macro-collection-select');
  select.innerHTML = `<option value="">— sem collection —</option>` +
    macroCollections.map((collection) =>
      `<option value="${collection.id}"${collection.id === selectedId ? ' selected' : ''}>${escHtml(collection.name)}</option>`
    ).join('');
};

const copyCurrentMacroSlug = () => {
  const slug = currentMacro?.name;
  if (!slug) return toast('Salve a macro para gerar o slug');
  copyToClipboard(slug, 'Slug copiado');
};

// auto-detect é feita no evento 'change' do CodeMirror dentro de initMacroEditor

// ── Salvar / Excluir ──
const saveCurrentMacro = async () => {
  const title  = $('macro-title-input').value.trim();
  const desc   = $('macro-desc-input').value.trim();
  const inputLabel = $('macro-input-label').value.trim();
  const script = macroGet().trim();
  if (!title)  { $('macro-title-input').focus(); toast('Dê um nome à macro'); return false; }
  if (!script) { macroFocus();                   toast('Script vazio'); return false; }

  const tags   = $('macro-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  const collectionId = $('macro-collection-select').value || null;
  const url    = currentMacro ? '/macros/' + currentMacro.id : '/macros';
  const method = currentMacro ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name: title, description: desc, script, inputLabel: inputLabel || null, tags, collectionId }),
    });
    if (!res.ok) { toast(await res.text() || 'Erro ao salvar'); return false; }
    currentMacro = await res.json();
    fillMacroEditor(currentMacro);
    const listRes = await fetch('/macros');
    allMacros = await listRes.json();
    renderMacroCollections();
    renderMacrosList();
    updateMacrosClearBtn();
    toast('Macro salva');
    return true;
  } catch { toast('Erro ao salvar'); return false; }
};

const deleteCurrentMacro = async () => {
  if (!currentMacro) return;
  const ok = await confirmDialog(`Excluir a macro "${currentMacro.title}"?`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/macros/' + currentMacro.id, { method: 'DELETE' });
  currentMacro = null;
  $('macros-editor-form').classList.remove('visible');
  $('macros-editor-empty').style.display = 'flex';
  clearOutput();
  const listRes = await fetch('/macros');
  allMacros = await listRes.json();
  renderMacroCollections();
  renderMacrosList();
  updateMacrosClearBtn();
  toast('Macro excluída');
};

// ── Executar ──
const runCurrentMacro = async () => {
  if (!currentMacro) return;

  // salva antes de rodar pra garantir que executa a versão atual
  const saved = await saveCurrentMacro();
  if (!saved) return;

  const inputLabel = currentMacro.inputLabel?.trim();
  let input;
  if (inputLabel) {
    const value = await promptDialog(inputLabel, {
      okLabel: 'Executar',
      placeholder: 'Valor em texto',
    });
    if (value === null) return;
    input = value;
  }

  setRunning(true);
  clearOutput();
  appendOutput(`▶ Executando: ${currentMacro.title}\n`, 'info');
  appendOutput(`─────────────────────────────────────\n`, 'info');

  try {
    const res = await fetch(`/macros/${currentMacro.id}/run`, inputLabel
      ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      }
      : { method: 'POST' });

    if (res.status === 403) {
      const data = await res.json();
      appendOutput(`🚫 Bloqueado: ${data.reason}\n`, 'error');
      setRunning(false);
      return;
    }

    const reader = res.body.getReader();
    runReader = reader;
    const dec = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event: stdout')) continue;
        if (line.startsWith('event: stderr')) continue;
        if (line.startsWith('event: exit')) continue;
        if (line.startsWith('data: ')) {
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw);
            const isExit = /^\d+$/.test(parsed);
            if (isExit) {
              const code = parseInt(parsed);
              appendOutput(`\n─────────────────────────────────────\n`, 'info');
              appendOutput(code === 0 ? '✓ Concluído com sucesso\n' : `✗ Saiu com código ${code}\n`, code === 0 ? 'success' : 'error');
            } else {
              appendOutput(parsed + '\n', 'out');
            }
          } catch { /* linha incompleta */ }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      appendOutput(`\n✗ Erro: ${err.message}\n`, 'error');
    }
  } finally {
    runReader = null;
    setRunning(false);
  }
};

const stopMacro = async () => {
  if (runReader) {
    try { runReader.cancel(); } catch { /* noop */ }
    runReader = null;
  }
  appendOutput('\n⬛ Interrompido pelo usuário\n', 'info');
  setRunning(false);
};

// ── Output ──
const clearOutput = () => {
  $('macro-output').innerHTML = '';
  $('btn-macro-clear').style.display = 'none';
  $('macro-status-badge').textContent = '';
  $('macro-status-badge').className   = 'macro-status';
};

const appendOutput = (text, type = 'out') => {
  const out = $('macro-output');
  const span = document.createElement('span');
  span.className = `out-${type}`;
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
  $('btn-macro-clear').style.display = 'inline-flex';
};

const setRunning = (running) => {
  const runBtn  = $('btn-macro-run');
  const stopBtn = $('btn-macro-stop');
  const badge   = $('macro-status-badge');

  runBtn.disabled = running;
  runBtn.innerHTML = running
    ? `<span class="run-spinner"></span> Executando…`
    : `${ICON('sparkles')} Executar`;
  stopBtn.style.display  = running ? 'inline-flex' : 'none';
  badge.textContent      = running ? 'rodando' : '';
  badge.className        = running ? 'macro-status running' : 'macro-status';
};

// Ctrl+Enter executa
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && currentMode === 'macros') {
    e.preventDefault();
    runCurrentMacro();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'macros') {
    e.preventDefault();
    saveCurrentMacro();
  }
});
