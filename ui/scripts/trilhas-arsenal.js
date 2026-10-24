// ════ Trilhas — Arsenal: vincular o acervo à trilha ou a um bloco ════
// Duas escopos, sempre explícitos:
//   Trilha = vale para todos os blocos     Bloco = só para o bloco selecionado
// O Arsenal NÃO lista o acervo: mostra só o que já está vinculado (+ guardrails
// ativos por tag) e busca sob demanda. Itens também se arrastam para um bloco.

const TR_DRAG_TYPE = 'application/x-docmap-ref';

const TR_ARSENAL_SECTIONS = [
  ['guardrails', 'Guardrails', 'shield'],
  ['macros', 'Macros', 'macro'],
  ['skills', 'Skills', 'skill'],
  ['notes', 'Notas', 'notebook'],
  ['podcasts', 'Podcasts', 'mic'],
  ['favorites', 'Favoritos', 'bookmark'],
];

let trilhaArsenalData = null;
let trilhaArsenalSig = '';
let trilhaArsenalQuery = '';
let trilhaRefFocus = null; // { kind, id, title } — mapa mostra só quem usa este item

const trilhaArsenalSignature = () => {
  const { trilha, refs } = currentTrilhaDetail;
  return JSON.stringify([trilha.id, trilha.tags, refs.map((r) => [r.id, r.role, r.missing])]);
};

// Só busca de novo quando algo que muda o Arsenal mudou (tags ou refs).
const syncTrilhaArsenal = () => {
  const sig = trilhaArsenalSignature();
  if (trilhaArsenalData && sig === trilhaArsenalSig) {
    renderTrilhaArsenal();
    return;
  }
  trilhaArsenalSig = sig;
  loadTrilhaArsenal();
};

const loadTrilhaArsenal = async () => {
  if (!currentTrilhaDetail) return;
  const id = currentTrilhaDetail.trilha.id;
  const q = trilhaArsenalQuery;
  try {
    const res = await fetch(`/trilhas/${id}/arsenal?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (currentTrilhaDetail?.trilha.id !== id || q !== trilhaArsenalQuery) return;
    trilhaArsenalData = data;
    renderTrilhaArsenal();
  } catch (err) {
    console.error('Erro ao carregar o Arsenal:', err);
  }
};

const onTrilhaArsenalSearch = debounce(() => {
  trilhaArsenalQuery = ($('trilha-arsenal-q')?.value || '').trim();
  loadTrilhaArsenal();
}, 250);

const focusTrilhaArsenalSearch = () => {
  trLocal.set('arsenal', '1');
  applyTrilhaPanels();
  $('trilha-arsenal-q')?.focus();
};

// ── Vínculos: quem usa o quê ──

const trilhaRefUsage = (kind, id) => {
  const refs = (currentTrilhaDetail?.refs || []).filter((r) => r.kind === kind && r.targetId === id);
  const sel = selectedTrilhaNodeId;
  return {
    pin: refs.find((r) => !r.nodeId) || null,
    nodes: refs.filter((r) => r.nodeId),
    here: sel ? refs.find((r) => r.nodeId === sel) || null : null,
  };
};

const trilhaItemFromRef = (r) => ({
  kind: r.kind,
  id: r.targetId,
  title: r.title,
  tags: r.tags || [],
  role: r.role,
  extra: r.extra,
  missing: r.missing,
});

// Realça no mapa os blocos que usam o item (passar o mouse na linha do Arsenal).
const hlTrilhaRef = (kind, id, on) => {
  trilhaRefUsage(kind, id).nodes.forEach((r) => {
    document.querySelector(`.tr-node[data-node-id="${r.nodeId}"]`)
      ?.classList.toggle('ref-hl', on);
  });
};

const focusTrilhaRefUsage = (kind, id) => {
  const meta = trilhaArtifactMeta(kind, id);
  trilhaRefFocus = { kind, id, title: meta.title };
  setTrilhaFocus('ref');
};

// ── Linha do item: botões de vínculo sempre visíveis, com rótulo e estado ──

const trLinkBtn = (on, label, tip, action, disabled = false) =>
  `<button type="button" class="tr-link-btn${on ? ' on' : ''}" ${disabled ? 'disabled' : ''} title="${escHtml(tip)}" onclick="${action}">${ICON(on ? 'check' : 'plus')}${label}</button>`;

const trilhaLinkButtons = (item) => {
  const u = trilhaRefUsage(item.kind, item.id);
  const node = trilhaNodeById(selectedTrilhaNodeId);
  const trilhaBtn = u.pin
    ? trLinkBtn(true, 'Na trilha', 'Vinculado à trilha inteira — clique para remover', `unlinkTrilhaRef('${u.pin.id}','a trilha')`)
    : trLinkBtn(false, 'Trilha', 'Vincular à trilha inteira (vale para todos os blocos)', `pinTrilhaRef('${item.kind}','${item.id}')`);
  const blocoBtn = u.here
    ? trLinkBtn(true, 'Neste bloco', `Vinculado ao bloco "${node?.title}" — clique para remover`, `unlinkTrilhaRef('${u.here.id}','o bloco')`)
    : trLinkBtn(false, 'Bloco', node ? `Vincular ao bloco "${node.title}"` : 'Selecione um bloco no mapa para vincular', `attachTrilhaRef('${item.kind}','${item.id}',selectedTrilhaNodeId)`, !node);
  const guard = item.kind === 'note' && !(u.pin && u.pin.role === 'guardrail')
    ? `<button type="button" class="tr-link-btn" title="Vincular à trilha como guardrail (regra inegociável para os agentes)" onclick="pinTrilhaRef('note','${item.id}','guardrail')">${ICON('shield')}Regra</button>`
    : '';
  const used = u.nodes.length
    ? `<button type="button" class="tr-link-used" title="Mostrar no mapa os blocos que usam este item" onclick="focusTrilhaRefUsage('${item.kind}','${item.id}')">${ICON('link')}${u.nodes.length} ${u.nodes.length === 1 ? 'bloco' : 'blocos'}</button>`
    : '';
  return trilhaBtn + blocoBtn + guard + used;
};

const trilhaDockItem = (item) => {
  const u = trilhaRefUsage(item.kind, item.id);
  const guardBadge = item.role === 'guardrail' || (u.pin && u.pin.role === 'guardrail')
    ? `<span class="tr-guard-badge" title="Guardrail: regra inegociável no pacote do agente">${ICON('shield')}Guardrail</span>`
    : item.via === 'tag'
    ? '<span class="tr-guard-badge" title="Ativo pela tag da trilha (i-guardrail)">por tag</span>'
    : '';
  const run = item.kind === 'macro' && !item.missing
    ? `<button type="button" class="icon-btn" onclick="runTrilhaMacro('${item.id}')" title="Executar macro">${ICON('play')}</button>`
    : '';
  if (item.missing) {
    return `<div class="tr-dock-item missing"><div class="tr-dock-line"><span class="tr-dock-open">${ICON('alert-triangle')}<span>${escHtml(item.title)}</span></span></div>
      <div class="tr-dock-links">${u.pin ? trLinkBtn(true, 'Na trilha', 'Remover vínculo', `unlinkTrilhaRef('${u.pin.id}','a trilha')`) : ''}</div></div>`;
  }
  return `<div class="tr-dock-item" draggable="true"
    onmouseenter="hlTrilhaRef('${item.kind}','${item.id}',true)" onmouseleave="hlTrilhaRef('${item.kind}','${item.id}',false)"
    ondragstart="event.dataTransfer.setData(TR_DRAG_TYPE,'${item.kind}:${item.id}');event.dataTransfer.effectAllowed='copy'">
    <div class="tr-dock-line">
      <button type="button" class="tr-dock-open" onclick="openTrilhaArtifact('${item.kind}','${item.id}')" title="Abrir ${escHtml(item.title)}">
        ${ICON(TR_REF_ICON[item.kind])}<span>${escHtml(item.title)}</span>
      </button>${guardBadge}${run}
    </div>
    <div class="tr-dock-links">${trilhaLinkButtons(item)}</div>
  </div>`;
};

// ── Seções ──

const trilhaDockSection = (label, hint, items, icon) => items.length
  ? `<section class="tr-dock-sec">
      <div class="tr-dock-sec-h">${ICON(icon)}<span>${label}</span><span class="chip">${items.length}</span></div>
      ${hint ? `<div class="tr-dock-hint">${hint}</div>` : ''}
      ${items.map(trilhaDockItem).join('')}
    </section>`
  : '';

const trilhaScopeBar = (node) => `
  <div class="tr-scope">
    <div class="tr-scope-row"><span class="tr-scope-pill">Trilha</span><span>vale para todos os blocos</span></div>
    <div class="tr-scope-row ${node ? 'on' : ''}"><span class="tr-scope-pill">Bloco</span>
      ${node
        ? `<span class="tr-scope-node" title="${escHtml(node.title)}">${escHtml(node.title)}</span><button type="button" class="icon-btn" onclick="closeTrilhaInspector()" title="Soltar bloco">${ICON('x')}</button>`
        : '<span>selecione um bloco no mapa</span>'}
    </div>
  </div>`;

// Sem busca: só o que já está vinculado + guardrails ativos por tag.
const trilhaLinkedHtml = (node) => {
  const refs = currentTrilhaDetail.refs;
  const pinned = refs.filter((r) => !r.nodeId).map(trilhaItemFromRef);
  const here = node ? refs.filter((r) => r.nodeId === node.id).map(trilhaItemFromRef) : [];
  const byTag = (trilhaArsenalData?.guardrails || []).filter((g) => g.via === 'tag' && !g.pinned);
  const html = trilhaDockSection('Na trilha inteira', 'Todos os blocos e agentes recebem estes itens.', pinned, 'bookmark') +
    (node ? trilhaDockSection('Neste bloco', `Só para “${escHtml(node.title)}”.`, here, 'link') : '') +
    trilhaDockSection('Guardrails ativos por tag', 'Valem sem fixar, porque a nota tem i-guardrail e a tag da trilha.', byTag, 'shield');
  return html || `<div class="tr-dock-empty">Nada vinculado ainda.<br>Busque acima uma nota, skill, macro, podcast ou favorito e vincule à trilha ou a um bloco.</div>`;
};

const trilhaResultsHtml = (node) => {
  const data = trilhaArsenalData || {};
  const html = TR_ARSENAL_SECTIONS
    .map(([key, label, icon]) => trilhaDockSection(label, '', data[key] || [], icon)).join('');
  return html || `<div class="tr-dock-empty">Nada encontrado para “${escHtml(trilhaArsenalQuery)}”.</div>`;
};

const renderTrilhaArsenal = () => {
  const body = $('trilha-arsenal-body');
  if (!body || !currentTrilhaDetail) return;
  const { trilha } = currentTrilhaDetail;
  $('trilha-arsenal-sub').textContent = trilha.tags.length ? trilha.tags.join(' · ') : 'sem tags';
  const node = trilhaNodeById(selectedTrilhaNodeId);
  const top = body.scrollTop;
  body.innerHTML = trilhaScopeBar(node) +
    (trilhaArsenalQuery ? trilhaResultsHtml(node) : trilhaLinkedHtml(node));
  body.scrollTop = top;
  hydrateIcons(body);
};

// ── Vincular, desvincular ──

const postTrilhaRef = async (payload) => {
  const res = await fetch(`/trilhas/${currentTrilhaDetail.trilha.id}/refs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
};

const pinTrilhaRef = async (kind, targetId, role = 'context') => {
  if (!currentTrilhaDetail) return;
  try {
    await postTrilhaRef({ kind, targetId, role });
    await refreshCurrentTrilha();
    toast(role === 'guardrail' ? 'Vinculado à trilha como guardrail' : 'Vinculado à trilha inteira');
  } catch (err) {
    toast(err.message || 'Falha ao vincular');
  }
};

const attachTrilhaRef = async (kind, targetId, nodeId) => {
  if (!currentTrilhaDetail || !nodeId) {
    toast('Selecione um bloco no mapa para vincular');
    return;
  }
  try {
    await postTrilhaRef({ kind, targetId, nodeId });
    await refreshCurrentTrilha();
    toast(`Vinculado ao bloco “${trilhaNodeById(nodeId)?.title || ''}”`);
  } catch (err) {
    toast(err.message || 'Falha ao vincular');
  }
};

const unlinkTrilhaRef = async (refId, scope) => {
  if (!currentTrilhaDetail) return;
  const res = await fetch(`/trilhas/${currentTrilhaDetail.trilha.id}/refs/${refId}`, { method: 'DELETE' });
  if (!res.ok) {
    toast('Falha ao remover o vínculo');
    return;
  }
  await refreshCurrentTrilha();
  toast(`Vínculo removido d${scope}`);
};

// Linha de vínculo no painel do bloco (herdado = vem da trilha inteira).
const trilhaRefRow = (ref, inherited = false) => `
  <div class="tr-ref-row${ref.missing ? ' missing' : ''}${inherited ? ' inherited' : ''}">
    <button type="button" class="tr-dock-open" ${ref.missing ? 'disabled' : `onclick="openTrilhaArtifact('${ref.kind}','${ref.targetId}')"`} title="${escHtml(ref.title)}">
      ${ICON(ref.role === 'guardrail' ? 'shield' : TR_REF_ICON[ref.kind])}<span>${escHtml(ref.title)}</span>
    </button>
    ${ref.kind === 'macro' && !ref.missing ? `<button type="button" class="icon-btn" onclick="runTrilhaMacro('${ref.targetId}','${ref.nodeId || ''}')" title="Executar macro">${ICON('play')}</button>` : ''}
    <button type="button" class="icon-btn danger" onclick="unlinkTrilhaRef('${ref.id}','${inherited ? 'a trilha' : 'o bloco'}')" title="${inherited ? 'Remover da trilha inteira' : 'Remover do bloco'}">${ICON('x')}</button>
  </div>`;

const trilhaFindMacro = (id) => {
  const pool = Object.values(trilhaArsenalData || {}).flat();
  const hit = pool.find((i) => i.kind === 'macro' && i.id === id);
  if (hit) return { title: hit.title, inputLabel: hit.extra?.inputLabel || '' };
  const ref = (currentTrilhaDetail?.refs || []).find((r) => r.kind === 'macro' && r.targetId === id);
  return ref ? { title: ref.title, inputLabel: ref.extra?.inputLabel || '' } : { title: 'Macro', inputLabel: '' };
};
