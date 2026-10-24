// ════ Trilhas — artefatos em modal (embed) e execução de macros ════
// O modal NÃO reimplementa nota, skill, macro ou podcast: carrega o próprio
// app em modo embed (/?embed=<tipo>:<id>). A tela original é a única fonte
// da verdade — quando ela evolui, o modal evolui junto, sem duplicar código.

const TR_EMBED_OPEN = {
  note: (id) => openNote(id),
  skill: (id) => openSkill(id),
  macro: (id) => openMacro(id),
  podcast: (id) => openPodcast(id),
};

let trilhaEmbed = null;

const trilhaArtifactMeta = (kind, id) => {
  const pool = Object.values(trilhaArsenalData || {}).flat();
  const hit = pool.find((i) => i.kind === kind && i.id === id) ||
    (currentTrilhaDetail?.refs || []).find((r) => r.kind === kind && r.targetId === id);
  return { title: hit?.title || 'Artefato', url: hit?.extra?.url || '' };
};

const openTrilhaArtifact = (kind, id) => {
  const meta = trilhaArtifactMeta(kind, id);
  if (kind === 'favorite') {
    openExternalUrl(meta.url);
    return;
  }
  trilhaEmbed = { kind, id };
  $('trilha-embed-title').textContent = meta.title;
  $('trilha-embed-body').innerHTML =
    `<iframe id="trilha-embed-frame" title="${escHtml(meta.title)}" src="/?embed=${kind}:${id}"></iframe>`;
  $('trilha-embed-modal-overlay').classList.add('visible');
};

const closeTrilhaEmbed = (e) => {
  if (e && e.target !== $('trilha-embed-modal-overlay')) return;
  $('trilha-embed-modal-overlay').classList.remove('visible');
  $('trilha-embed-body').innerHTML = ''; // descarrega o iframe (para áudio)
  trilhaEmbed = null;
  if (currentTrilhaDetail) {
    refreshCurrentTrilha();
    loadTrilhaArsenal();
  }
};

const openTrilhaEmbedFull = () => {
  const target = trilhaEmbed;
  if (!target) return;
  closeTrilhaEmbed();
  TR_EMBED_OPEN[target.kind]?.(target.id);
};

// ── Macro: entrada opcional, execução e saída ──

let trilhaMacroCtx = null;

const runTrilhaMacro = (macroId, nodeId) => {
  const meta = trilhaFindMacro(macroId);
  trilhaMacroCtx = { id: macroId, nodeId: nodeId || '', ...meta };
  $('trilha-macro-title').textContent = meta.title;
  $('trilha-macro-input').value = '';
  $('trilha-macro-input-label').textContent = meta.inputLabel || 'Entrada';
  $('trilha-macro-input-wrap').style.display = meta.inputLabel ? '' : 'none';
  $('trilha-macro-result').hidden = true;
  $('trilha-macro-run-label').textContent = 'Executar';
  $('trilha-macro-modal-overlay').classList.add('visible');
  if (meta.inputLabel) {
    setTimeout(() => $('trilha-macro-input')?.focus(), 60);
  } else {
    submitTrilhaMacro();
  }
};

const closeTrilhaMacro = (e) => {
  if (e && e.target !== $('trilha-macro-modal-overlay')) return;
  $('trilha-macro-modal-overlay').classList.remove('visible');
  trilhaMacroCtx = null;
};

const submitTrilhaMacro = async (e) => {
  e?.preventDefault();
  if (!trilhaMacroCtx || !currentTrilhaDetail) return;
  const ctx = trilhaMacroCtx;
  const status = $('trilha-macro-status');
  $('trilha-macro-result').hidden = false;
  status.className = 'status info';
  status.textContent = 'Executando';
  $('trilha-macro-output').textContent = '';
  $('trilha-macro-run-btn').disabled = true;
  try {
    const res = await fetch(
      `/trilhas/${currentTrilhaDetail.trilha.id}/macros/${ctx.id}/run`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: $('trilha-macro-input').value,
          nodeId: ctx.nodeId || undefined,
          by: TR_HUMAN,
        }),
      },
    );
    const data = await res.json();
    const ok = res.ok && data.ok;
    status.className = `status ${ok ? 'ok' : 'danger'}`;
    status.textContent = data.blocked ? `Bloqueada: ${data.reason}` : ok ? 'Concluída' : `Falhou (código ${data.code ?? res.status})`;
    $('trilha-macro-output').textContent = data.output || '(sem saída)';
    $('trilha-macro-run-label').textContent = 'Executar de novo';
  } catch (err) {
    status.className = 'status danger';
    status.textContent = err.message || 'Falha ao executar';
  } finally {
    $('trilha-macro-run-btn').disabled = false;
    if (currentTrilhaDetail) refreshCurrentTrilha();
  }
};
