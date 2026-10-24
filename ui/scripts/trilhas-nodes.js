// ════ Trilhas — blocos e stickers: modais e ações ════

const openStickyModal = (id) => {
  if (!currentTrilhaDetail) return;
  const s = id ? trilhaStickyById(id) : null;
  $('trilha-sticky-edit-id').value = s?.id || '';
  $('trilha-sticky-text').value = s?.text || '';
  $('trilha-sticky-color').value = s?.color || 'yellow';
  $('trilha-sticky-modal-title-label').textContent = s
    ? 'Editar sticker'
    : 'Novo sticker';
  $('trilha-sticky-modal-submit-label').textContent = s ? 'Salvar' : 'Criar sticker';
  $('trilha-sticky-delete-btn').style.display = s ? '' : 'none';
  $('trilha-sticky-modal-overlay').classList.add('visible');
  setTimeout(() => $('trilha-sticky-text')?.focus(), 60);
};

const closeStickyModal = (e) => {
  if (e && e.target !== $('trilha-sticky-modal-overlay')) return;
  $('trilha-sticky-modal-overlay').classList.remove('visible');
};

const saveStickyFromModal = async (e) => {
  e.preventDefault();
  if (!currentTrilhaDetail) return;
  const { trilha } = currentTrilhaDetail;
  const id = $('trilha-sticky-edit-id').value;
  const body = {
    text: $('trilha-sticky-text').value.trim(),
    color: $('trilha-sticky-color').value,
  };
  if (!body.text) {
    toast('Escreva o texto do sticker');
    return;
  }
  try {
    const res = await fetch(
      id ? `/trilhas/${trilha.id}/stickies/${id}` : `/trilhas/${trilha.id}/stickies`,
      {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    const saved = await res.json();
    $('trilha-sticky-modal-overlay').classList.remove('visible');
    selectedTrilhaNodeId = null;
    selectedTrilhaStickyId = saved.id || id;
    await refreshCurrentTrilha();
  } catch (err) {
    toast(err.message || 'Falha ao salvar sticker');
  }
};

const deleteStickyFromModal = async () => {
  const id = $('trilha-sticky-edit-id').value;
  if (!id) return;
  $('trilha-sticky-modal-overlay').classList.remove('visible');
  await deleteTrilhaSticky(id);
};

const deleteTrilhaSticky = async (id) => {
  if (!currentTrilhaDetail || !id) return;
  const s = trilhaStickyById(id);
  const ok = await confirmDialog(
    `Excluir o sticker "${(s?.text || '').slice(0, 60)}"?`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;
  const res = await fetch(
    `/trilhas/${currentTrilhaDetail.trilha.id}/stickies/${id}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    toast('Falha ao excluir sticker');
    return;
  }
  if (selectedTrilhaStickyId === id) selectedTrilhaStickyId = null;
  await refreshCurrentTrilha();
  toast('Sticker excluído');
};

// ── Critérios de pronto: checklist real ──
// O modelo é [{ id, text, done }] (migração v18 converte strings antigas).
// Sem parsing de texto: done é campo próprio.

const trilhaChecklistItem = (criterion, extraAttrs) => {
  const done = criterion?.done === true;
  const text = criterion?.text ?? '';
  return `<li class="${done ? 'done' : ''}"${extraAttrs || ''}>` +
    `<span class="tr-check">${ICON('check')}</span>` +
    `<span class="tr-check-label">${escHtml(text)}</span></li>`;
};

const toggleTrilhaCriterion = async (nodeId, criterionId) => {
  const node = trilhaNodeById(nodeId);
  if (!node || !currentTrilhaDetail) return;
  const list = (node.doneCriteria || []).map((c) =>
    c.id === criterionId ? { ...c, done: !c.done } : c
  );
  trBusy = true;
  try {
    const res = await fetch(
      `/trilhas/${currentTrilhaDetail.trilha.id}/nodes/${nodeId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trilhaBody({
          doneCriteria: list,
          expectedUpdatedAt: node.updatedAt,
        })),
      },
    );
    if (res.status === 409) {
      toast(`${await res.text()} — recarregando`);
      await refreshCurrentTrilha();
      return;
    }
    if (!res.ok) throw new Error(await res.text());
    await refreshCurrentTrilha();
  } catch (err) {
    toast(err.message || 'Falha ao marcar critério');
  } finally {
    trBusy = false;
  }
};

// ── Modal bloco: editor de critérios ──
// Rascunho local [{ id, text, done }]; texto edita inline, check alterna,
// lixeira remove, botão adiciona. Só persiste no submit da modal.

let trCriteriaDraft = [];

const renderTrilhaCriteriaDraft = (focusLast) => {
  const box = $('trilha-node-criteria-list');
  if (!box) return;
  box.innerHTML = trCriteriaDraft.map((c, i) =>
    `<div class="tr-crit-row${c.done ? ' done' : ''}" data-criterion="${i}">
      <button type="button" class="tr-crit-check" data-act="toggle"
        title="Marcar/desmarcar" aria-pressed="${c.done}">${ICON('check')}</button>
      <input type="text" data-act="text" maxlength="300" placeholder="Novo critério"
        value="${escHtml(c.text)}">
      <button type="button" class="tr-crit-del icon-btn danger" data-act="del"
        title="Remover critério">${ICON('x')}</button>
    </div>`
  ).join('') ||
    '<div class="tr-inspector-empty">Nenhum critério. Adicione abaixo.</div>';
  hydrateIcons(box);
  box.querySelectorAll('.tr-crit-row').forEach((row) => {
    const i = Number(row.dataset.criterion);
    row.querySelector('[data-act="toggle"]')?.addEventListener(
      'click',
      () => {
        trCriteriaDraft[i] = { ...trCriteriaDraft[i], done: !trCriteriaDraft[i].done };
        renderTrilhaCriteriaDraft(false);
      },
    );
    row.querySelector('[data-act="text"]')?.addEventListener('input', (e) => {
      trCriteriaDraft[i] = { ...trCriteriaDraft[i], text: e.target.value };
    });
    row.querySelector('[data-act="del"]')?.addEventListener('click', () => {
      trCriteriaDraft = trCriteriaDraft.filter((_, k) => k !== i);
      renderTrilhaCriteriaDraft(false);
    });
  });
  if (focusLast) {
    box.querySelector('.tr-crit-row:last-child input')?.focus();
  }
};

const addTrilhaCriterionDraft = () => {
  trCriteriaDraft = [...trCriteriaDraft, { text: '', done: false }];
  renderTrilhaCriteriaDraft(true);
};

const setTrilhaNodeStatus = async (nodeId, status) => {
  const { trilha } = currentTrilhaDetail;
  const node = trilhaNodeById(nodeId);
  trBusy = true;
  try {
    const res = await fetch(`/trilhas/${trilha.id}/nodes/${nodeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trilhaBody({
        status,
        ...(node ? { expectedUpdatedAt: node.updatedAt } : {}),
      })),
    });
    if (res.status === 409) {
      toast(await res.text());
      await refreshCurrentTrilha();
      return;
    }
    if (!res.ok) throw new Error(await res.text());
    await refreshCurrentTrilha();
  } catch (err) {
    toast(err.message || 'Falha ao mudar status');
  } finally {
    trBusy = false;
  }
};

const claimTrilhaNode = async () => {
  if (!selectedTrilhaNodeId || !currentTrilhaDetail) return;
  const node = trilhaNodeById(selectedTrilhaNodeId);
  trilhaMe = node.assignee?.label?.trim() || 'Você';
  const stale = trilhaStaleText(node);
  let force = false;
  if (stale) {
    const ok = await confirmDialog(
      `Sem sinal ${stale} — o dono pode ter morrido. Assumir mesmo assim?`,
      { okLabel: 'Assumir' },
    );
    if (!ok) return;
    force = true;
  }
  try {
    const res = await fetch(
      `/trilhas/${currentTrilhaDetail.trilha.id}/nodes/${node.id}/claim`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ by: trilhaMe, ...(force ? { force: true } : {}) }),
      },
    );
    if (res.status === 409) {
      toast(await res.text());
      await refreshCurrentTrilha();
      return;
    }
    if (!res.ok) throw new Error(await res.text());
    toast(`Bloco assumido como ${trilhaMe}`);
    await refreshCurrentTrilha();
  } catch (err) {
    toast(err.message || 'Falha ao assumir');
  }
};

const releaseTrilhaNode = async () => {
  if (!selectedTrilhaNodeId || !currentTrilhaDetail) return;
  const ok = await confirmDialog(
    'Liberar a trava? Use quando o dono travou ou morreu.',
    { okLabel: 'Liberar' },
  );
  if (!ok) return;
  const res = await fetch(
    `/trilhas/${currentTrilhaDetail.trilha.id}/nodes/${selectedTrilhaNodeId}/release`,
    { method: 'POST' },
  );
  if (!res.ok) {
    toast('Falha ao liberar');
    return;
  }
  toast('Trava liberada');
  await refreshCurrentTrilha();
};

// ── Setas ──

const removeTrilhaEdge = async (edgeId) => {
  const { trilha } = currentTrilhaDetail;
  const res = await fetch(`/trilhas/${trilha.id}/edges/${edgeId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    toast('Falha ao remover seta');
    return;
  }
  await refreshCurrentTrilha();
};

// ── Modal bloco: abas ──
// Conteúdo (briefing) | Entrega (resultado + critérios) | Config (status, dono, deps).
// Título fica fixo fora das abas para o submit nunca esconder campo required.

const TR_NODE_TABS = ['conteudo', 'entrega', 'config'];

let trNodeTab = 'conteudo';

const setTrilhaNodeTab = (tab) => {
  if (!TR_NODE_TABS.includes(tab)) return;
  trNodeTab = tab;
  TR_NODE_TABS.forEach((t) => {
    $(`trilha-node-tab-${t}`)?.classList.toggle('on', t === tab);
    const btn = $(`trilha-node-tabbtn-${t}`);
    btn?.classList.toggle('on', t === tab);
    btn?.setAttribute('aria-selected', t === tab ? 'true' : 'false');
  });
};

// ── Modal bloco: detalhes preview/edit ──
// Os detalhes são markdown (é assim que a IA devolve o relatório). O preview
// é o modo padrão: quem abre o bloco lê formatado, quem edita troca pra texto.

let trDetailsMode = 'preview';

const renderTrilhaDetailsPreview = () => {
  const ta = $('trilha-node-details');
  const pv = $('trilha-node-details-preview');
  if (!ta || !pv) return;
  pv.innerHTML = renderMarkdown(ta.value);
};

const setTrilhaDetailsMode = (mode) => {
  trDetailsMode = mode === 'edit' ? 'edit' : 'preview';
  const ta = $('trilha-node-details');
  const pv = $('trilha-node-details-preview');
  if (!ta || !pv) return;
  const edit = trDetailsMode === 'edit';
  ta.style.display = edit ? '' : 'none';
  pv.classList.toggle('visible', !edit);
  $('trilha-node-tab-preview')?.classList.toggle('on', !edit);
  $('trilha-node-tab-edit')?.classList.toggle('on', edit);
  if (!edit) renderTrilhaDetailsPreview();
};

const onTrilhaDetailsInput = () => {
  if (trDetailsMode === 'edit') renderTrilhaDetailsPreview();
};

const openNodeModal = (id) => {
  if (!currentTrilhaDetail) return;
  const node = id ? trilhaNodeById(id) : null;
  $('trilha-node-edit-id').value = node?.id || '';
  $('trilha-node-title').value = node?.title || '';
  $('trilha-node-details').value = node?.details || '';
  $('trilha-node-result').value = node?.result || '';
  trCriteriaDraft = (node?.doneCriteria || []).map((c) => ({ ...c }));
  $('trilha-node-blocked-reason').value = node?.blockedReason || '';
  $('trilha-node-status').value = node?.status || 'todo';
  $('trilha-node-assignee-kind').value = node?.assignee?.kind || 'ai';
  $('trilha-node-assignee-label').value = node?.assignee?.label || '';
  $('trilha-node-group').value = node?.group || '';
  $('trilha-group-list').innerHTML = [...new Set(currentTrilhaDetail.nodes.map((n) => n.group).filter(Boolean))]
    .map((g) => `<option value="${escHtml(g)}"></option>`).join('');
  $('trilha-node-modal-title-label').textContent = node ? 'Editar bloco' : 'Novo bloco';
  $('trilha-node-modal-submit-label').textContent = node ? 'Salvar' : 'Criar bloco';
  const currentDeps = new Set(trilhaIncoming(node?.id || '').map((e) => e.fromNodeId));
  $('trilha-node-deps').innerHTML = currentTrilhaDetail.nodes
    .filter((n) => n.id !== node?.id)
    .map((n) =>
      `<label class="tr-dep-check"><input type="checkbox" data-dep-id="${n.id}"${currentDeps.has(n.id) ? ' checked' : ''}><span>${escHtml(n.title)}</span></label>`
    ).join('') || '<div class="tr-inspector-empty">Nenhum outro bloco ainda.</div>';
  $('trilha-node-modal-overlay').classList.add('visible');
  setTrilhaNodeTab('conteudo');
  setTrilhaDetailsMode(node?.details ? 'preview' : 'edit');
  renderTrilhaCriteriaDraft(false);
  setTimeout(() => $('trilha-node-title')?.focus(), 60);
};

const closeNodeModal = (e) => {
  if (e && e.target !== $('trilha-node-modal-overlay')) return;
  $('trilha-node-modal-overlay').classList.remove('visible');
};

const saveNodeFromModal = async (e) => {
  e.preventDefault();
  const { trilha } = currentTrilhaDetail;
  const id = $('trilha-node-edit-id').value;
  const label = $('trilha-node-assignee-label').value.trim();
  const criteria = trCriteriaDraft
    .filter((c) => c.text.trim())
    .map((c) => ({ ...c, text: c.text.trim() }));
  const editing = id ? trilhaNodeById(id) : null;
  const body = {
    title: $('trilha-node-title').value.trim(),
    details: $('trilha-node-details').value,
    result: $('trilha-node-result').value,
    doneCriteria: criteria,
    blockedReason: $('trilha-node-blocked-reason').value.trim(),
    group: $('trilha-node-group').value.trim(),
    status: $('trilha-node-status').value,
    assignee: {
      kind: $('trilha-node-assignee-kind').value,
      label: label || ($('trilha-node-assignee-kind').value === 'ai' ? 'IA' : 'Você'),
    },
  };
  try {
    let nodeId = id;
    if (!id) {
      const wantedDeps = [...$('trilha-node-deps').querySelectorAll('input[data-dep-id]:checked')]
        .map((input) => input.dataset.depId);
      const res = await fetch(`/trilhas/${trilha.id}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, dependsOn: wantedDeps }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      nodeId = created.id;
    } else {
      const res = await fetch(`/trilhas/${trilha.id}/nodes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trilhaBody({
          ...body,
          ...(editing ? { expectedUpdatedAt: editing.updatedAt } : {}),
        })),
      });
      if (res.status === 409) {
        toast(`${await res.text()} — recarregando`);
        $('trilha-node-modal-overlay').classList.remove('visible');
        await refreshCurrentTrilha();
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      await reconcileTrilhaDeps(id);
    }
    $('trilha-node-modal-overlay').classList.remove('visible');
    selectedTrilhaNodeId = nodeId;
    await refreshCurrentTrilha();
  } catch (err) {
    toast(err.message || 'Falha ao salvar bloco');
  }
};

const reconcileTrilhaDeps = async (nodeId) => {
  const { trilha } = currentTrilhaDetail;
  const wanted = new Set(
    [...$('trilha-node-deps').querySelectorAll('input[data-dep-id]:checked')]
      .map((input) => input.dataset.depId),
  );
  const current = trilhaIncoming(nodeId);
  for (const edge of current) {
    if (!wanted.has(edge.fromNodeId)) {
      await fetch(`/trilhas/${trilha.id}/edges/${edge.id}`, { method: 'DELETE' });
    }
  }
  for (const depId of wanted) {
    if (!current.some((edge) => edge.fromNodeId === depId)) {
      const res = await fetch(`/trilhas/${trilha.id}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromNodeId: depId, toNodeId: nodeId }),
      });
      if (res.status === 409) toast(`Seta de "${trilhaNodeById(depId)?.title}" recusada (ciclo)`);
    }
  }
};

const deleteSelectedTrilhaNode = async () => {
  if (!selectedTrilhaNodeId || !currentTrilhaDetail) return;
  const node = trilhaNodeById(selectedTrilhaNodeId);
  const ok = await confirmDialog(`Excluir o bloco "${node?.title || ''}"?`, {
    danger: true,
    okLabel: 'Excluir',
  });
  if (!ok) return;
  const res = await fetch(
    `/trilhas/${currentTrilhaDetail.trilha.id}/nodes/${selectedTrilhaNodeId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    toast('Falha ao excluir bloco');
    return;
  }
  selectedTrilhaNodeId = null;
  await refreshCurrentTrilha();
  toast('Bloco excluído');
};
