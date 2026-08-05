// ════ Macros — runner de scripts bash/deno com output em tempo real ════

let allMacros    = [];
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
    const res = await fetch('/macros');
    allMacros  = await res.json();
    if (!allMacros.length) await seedDefaultMacros();
    else renderMacrosList(allMacros);
  } catch (err) { console.error('Erro ao carregar macros:', err); }
};

const renderMacrosList = (macros) => {
  const list = $('macros-list');
  if (!macros.length) {
    list.innerHTML = `<div class="macros-empty">Nenhuma macro ainda.<br>Clique em <strong>+</strong> para criar.</div>`;
    return;
  }
  list.innerHTML = macros.map((m) =>
    `<div class="macro-item${currentMacro?.id === m.id ? ' active' : ''}" onclick="openMacro('${m.id}')">
      <div class="macro-item-top">
        <span class="macro-interp-dot ${m.interpreter}">${m.interpreter === 'deno' ? '🦕' : '⬡'}</span>
        <span class="macro-item-title">${escHtml(m.title)}</span>
      </div>
      <div class="macro-item-desc">${escHtml(m.description || '')}</div>
      ${(m.tags||[]).length ? `<div class="macro-item-tags">${m.tags.map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
    </div>`
  ).join('');
};

// ── Seed macro padrão ──
const seedDefaultMacros = async () => {
  const defaults = [
    {
      title: 'Briefing do DocMap',
      name: 'briefing',
      description: 'Lista notas recentes e skills — contexto pra colar numa IA',
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
  const res = await fetch('/macros');
  allMacros = await res.json();
  renderMacrosList(allMacros);
};

// ── Abrir / Novo ──
const openMacro = async (id) => {
  if (currentMode !== 'macros') setMode('macros');
  try {
    const res = await fetch('/macros/' + id);
    currentMacro = await res.json();
    fillMacroEditor(currentMacro);
    renderMacrosList(allMacros);
  } catch (err) { console.error('Erro ao abrir macro:', err); }
};

const newMacro = () => {
  currentMacro = null;
  $('macro-title-input').value = '';
  $('macro-desc-input').value  = '';
  $('macro-tags-input').value  = '';
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
  $('macro-tags-input').value        = (m.tags || []).join(', ');
  macroSet(m.script);
  $('macro-interp-badge').textContent = m.interpreter;
  $('macro-interp-badge').className   = `macro-badge ${m.interpreter}`;
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

// auto-detect é feita no evento 'change' do CodeMirror dentro de initMacroEditor

// ── Salvar / Excluir ──
const saveCurrentMacro = async () => {
  const title  = $('macro-title-input').value.trim();
  const desc   = $('macro-desc-input').value.trim();
  const script = macroGet().trim();
  if (!title)  { $('macro-title-input').focus(); return toast('Dê um nome à macro'); }
  if (!script) { macroFocus();                   return toast('Script vazio'); }

  const tags   = $('macro-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  const url    = currentMacro ? '/macros/' + currentMacro.id : '/macros';
  const method = currentMacro ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name: title, description: desc, script, tags }),
    });
    currentMacro = await res.json();
    fillMacroEditor(currentMacro);
    const listRes = await fetch('/macros');
    allMacros = await listRes.json();
    renderMacrosList(allMacros);
    toast('Macro salva');
  } catch { toast('Erro ao salvar'); }
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
  renderMacrosList(allMacros);
  toast('Macro excluída');
};

// ── Executar ──
const runCurrentMacro = async () => {
  if (!currentMacro) return;

  // salva antes de rodar pra garantir que executa a versão atual
  await saveCurrentMacro();

  setRunning(true);
  clearOutput();
  appendOutput(`▶ Executando: ${currentMacro.title}\n`, 'info');
  appendOutput(`─────────────────────────────────────\n`, 'info');

  try {
    const res = await fetch(`/macros/${currentMacro.id}/run`, { method: 'POST' });

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
