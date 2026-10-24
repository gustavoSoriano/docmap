// ════ Trilhas — painel lateral: atenção, atividade e bloco ════
// Uma única coluna à direita, sempre visível: o que pede olhar vem primeiro.

let trilhaRailTab = 'attention';

const TR_ATT_LABEL = {
  blocker: 'Bloqueio',
  question: 'Pergunta',
  pending: 'Pendência',
  warning: 'Aviso',
  stale: 'Sem sinal',
};
const TR_ATT_ICON = { ...TR_SIGNAL_ICON, stale: 'clock' };

const TR_EVENT_TEXT = {
  'trilha.created': () => 'Trilha criada',
  'trilha.updated': (e) => `Trilha atualizada${e.detail ? ` (${e.detail})` : ''}`,
  'node.created': (e) => `Bloco criado: ${e.nodeTitle || ''}`,
  'node.updated': (e) => `Bloco editado: ${e.nodeTitle || ''}`,
  'node.status': (e) => `${e.nodeTitle || 'Bloco'}: ${e.detail || ''}`,
  'node.result': (e) => `Relatório em: ${e.nodeTitle || ''}`,
  'node.claim': (e) => `${e.nodeTitle || 'Bloco'} assumido por ${e.by || '?'}`,
  'node.takeover': (e) =>
    `${e.nodeTitle || 'Bloco'} tomado por ${e.by || '?'}${e.detail ? ` (${e.detail})` : ''}`,
  'node.release': (e) => `Trava liberada: ${e.nodeTitle || ''}`,
  'edge.created': (e) => `Seta: ${e.detail || ''}`,
  'edge.removed': (e) => `Seta removida: ${e.detail || ''}`,
  'sticky.created': (e) => `Sticker criado: ${(e.nodeTitle || '').slice(0, 60)}`,
  'sticky.updated': (e) => `Sticker editado: ${(e.nodeTitle || '').slice(0, 60)}`,
  'sticky.removed': (e) => `Sticker removido: ${(e.nodeTitle || '').slice(0, 60)}`,
  'signal.created': (e) => `Sinal aberto${e.nodeTitle ? ` em ${e.nodeTitle}` : ''}: ${e.detail || ''}`,
  'signal.resolved': (e) => `Sinal resolvido${e.nodeTitle ? ` em ${e.nodeTitle}` : ''}: ${e.detail || ''}`,
  'signal.reopened': (e) => `Sinal reaberto${e.nodeTitle ? ` em ${e.nodeTitle}` : ''}`,
  'ref.added': (e) => `Anexado${e.nodeTitle ? `: ${e.nodeTitle}` : ''}${e.detail ? ` (${e.detail})` : ''}`,
  'ref.removed': (e) => `Desanexado${e.nodeTitle ? `: ${e.nodeTitle}` : ''}`,
  'macro.run': (e) => `Macro ${e.nodeTitle || ''}: ${e.detail || ''}`,
  'layout.applied': (e) => `Blocos organizados (${e.detail || ''})`,
};

const setTrilhaRailTab = (tab) => {
  trilhaRailTab = tab;
  renderTrilhaRail();
};

const renderTrilhaRailTabs = () => {
  const count = currentTrilhaDetail.attention.length;
  const hasNode = !!selectedTrilhaNodeId;
  const tab = (key, label, extra = '', off = false) =>
    `<button type="button" class="${trilhaRailTab === key ? 'on' : ''}" ${off ? 'disabled' : ''} onclick="setTrilhaRailTab('${key}')">${label}${extra}</button>`;
  $('trilha-rail-tabs').innerHTML =
    tab('attention', 'Atenção', count ? `<span class="tr-tab-count">${count}</span>` : '') +
    tab('node', 'Bloco', '', !hasNode) +
    tab('activity', 'Atividade');
};

const renderTrilhaRail = () => {
  if (!currentTrilhaDetail) return;
  if (trilhaRailTab === 'node' && !selectedTrilhaNodeId) trilhaRailTab = 'attention';
  renderTrilhaRailTabs();
  renderTrilhaArsenal(); // o Arsenal acompanha o bloco selecionado
  const body = $('trilha-rail-body');
  if (trilhaRailTab === 'activity') {
    body.innerHTML = '<div id="trilha-activity-list"><div class="tr-inspector-empty">Carregando</div></div>';
    loadTrilhaActivity();
  } else if (trilhaRailTab === 'node') {
    renderTrilhaInspector(body);
  } else {
    renderTrilhaAttention(body);
  }
  hydrateIcons(body);
};

// ── Atenção ──

const trilhaAttentionLabel = (item) =>
  item.source === 'node' && item.kind === 'pending' ? 'Sua vez' : TR_ATT_LABEL[item.kind];

const trilhaAttentionItem = (item) => {
  const node = item.nodeId ? trilhaNodeById(item.nodeId) : null;
  const where = node && item.text !== node.title
    ? `<span class="tr-att-node">${escHtml(node.title)}</span>` : '';
  const meta = [
    `<span>${trilhaAttentionLabel(item)}</span>`,
    where,
    item.by ? `<span>${escHtml(item.by)}</span>` : '',
    `<span>${trilhaAgo(item.at)}</span>`,
  ].filter(Boolean).join('<i></i>');
  const resolve = item.signalId
    ? `<button type="button" class="icon-btn" onclick="event.stopPropagation();resolveTrilhaSignal('${item.signalId}','${item.kind}')" title="Resolver">${ICON('check')}</button>`
    : '';
  return `<div class="tr-att-item k-${item.kind}" ${item.nodeId ? `onclick="focusTrilhaNode('${item.nodeId}')"` : ''}>
    <span class="tr-att-ico">${ICON(TR_ATT_ICON[item.kind])}</span>
    <div class="tr-att-main">
      <div class="tr-att-text">${escHtml(item.text)}</div>
      <div class="tr-att-meta">${meta}</div>
    </div>${resolve}
  </div>`;
};

const renderTrilhaAttention = (body) => {
  const items = currentTrilhaDetail.attention;
  body.innerHTML = `${trilhaSignalForm()}
    <div class="tr-att-list">${items.length
      ? items.map(trilhaAttentionItem).join('')
      : `<div class="tr-att-empty">${ICON('check-circle')}<span>Nada pede sua atenção agora.</span></div>`}
    </div>`;
};

// Seleciona o bloco, abre o painel dele e leva o mapa até lá.
const focusTrilhaNode = (id) => {
  selectedTrilhaNodeId = id;
  selectedTrilhaStickyId = null;
  trilhaRailTab = 'node';
  renderTrilhaMap();
  renderTrilhaRail();
  trilhaScrollToNode(id);
};

// ── Atividade ──

const loadTrilhaActivity = async () => {
  if (!currentTrilhaDetail || trilhaRailTab !== 'activity') return;
  const list = $('trilha-activity-list');
  try {
    const res = await fetch(`/trilhas/${currentTrilhaDetail.trilha.id}/events?limit=60`);
    if (!res.ok) throw new Error(await res.text());
    const events = await res.json();
    if (trilhaRailTab !== 'activity' || !list) return;
    list.innerHTML = events.length
      ? events.map((e) => {
        const text = (TR_EVENT_TEXT[e.type] || (() => e.type))(e);
        return `<div class="tr-activity-item">
          <span class="tr-activity-time">${escHtml(trilhaTime(e.createdAt))}</span>
          <span>${escHtml(text)}${e.by ? ` <span class="tr-activity-by">${escHtml(e.by)}</span>` : ''}</span>
        </div>`;
      }).join('')
      : '<div class="tr-inspector-empty">Nenhum evento ainda.</div>';
  } catch {
    if (trilhaRailTab === 'activity' && list) {
      list.innerHTML = '<div class="tr-inspector-empty">Falha ao carregar.</div>';
    }
  }
};

// ── Bloco (inspetor) ──
// Sanfona: o estado vale para a sessão toda (expandiu uma vez, segue assim).
const TR_INSP_CARDS = ['sinais', 'contexto', 'briefing', 'criterios', 'resultado', 'conexoes'];
let trInspCollapsed = new Set(['briefing', 'criterios', 'resultado', 'conexoes']);

const toggleTrilhaInspCard = (key) => {
  if (!TR_INSP_CARDS.includes(key)) return;
  if (trInspCollapsed.has(key)) trInspCollapsed.delete(key);
  else trInspCollapsed.add(key);
  renderTrilhaRail();
};

const trInspCardClass = (key) =>
  `tr-insp-card${trInspCollapsed.has(key) ? ' closed' : ''}`;

const trInspCardHead = (key, label) =>
  `<button type="button" class="tr-insp-card-h" onclick="toggleTrilhaInspCard('${key}')" aria-expanded="${!trInspCollapsed.has(key)}"><span>${label}</span>${ICON('chevron-down')}</button>`;

const trilhaConnRow = (edge, otherId, icon) => {
  const other = trilhaNodeById(otherId);
  return `<div class="tr-inspector-dep"><span class="tr-dep-title">${ICON(icon)}<span>${escHtml(other?.title || '?')}</span></span><button class="icon-btn danger" onclick="removeTrilhaEdge('${edge.id}')" title="Remover dependência">${ICON('x')}</button></div>`;
};

const trilhaInspectorCards = (node) => {
  const incoming = trilhaIncoming(node.id);
  const outgoing = trilhaOutgoing(node.id);
  const critDone = (node.doneCriteria || []).filter((c) => c.done).length;
  const signals = trilhaNodeSignals(node.id);
  const refs = trilhaNodeRefs(node.id);
  const inherited = (currentTrilhaDetail.refs || []).filter((r) => !r.nodeId);
  return `
    <section class="${trInspCardClass('sinais')}">
      ${trInspCardHead('sinais', `Sinais <span class="chip">${signals.length}</span>`)}
      ${signals.length ? signals.map(trilhaSignalRow).join('') : '<div class="tr-inspector-empty">Nenhum sinal aberto neste bloco.</div>'}
      ${trilhaSignalForm()}
    </section>
    <section class="${trInspCardClass('contexto')}">
      ${trInspCardHead('contexto', `Contexto <span class="chip">${refs.length + inherited.length}</span>`)}
      <div class="tr-insp-conn-h">Vinculado a este bloco (${refs.length})</div>
      ${refs.length ? refs.map((r) => trilhaRefRow(r, false)).join('') : '<div class="tr-inspector-empty">Nada só deste bloco. Busque no Arsenal e vincule, ou arraste para o cartão.</div>'}
      <div class="tr-insp-conn-h">Herdado da trilha inteira (${inherited.length})</div>
      ${inherited.length ? inherited.map((r) => trilhaRefRow(r, true)).join('') : '<div class="tr-inspector-empty">Nada vinculado à trilha inteira.</div>'}
      <button type="button" class="tr-crit-add" onclick="focusTrilhaArsenalSearch()">${ICON('plus')} Buscar no Arsenal</button>
    </section>
    <section class="${trInspCardClass('briefing')}">
      ${trInspCardHead('briefing', 'Briefing')}
      ${node.details ? `<div class="tr-inspector-details">${renderMarkdown(node.details)}</div>` : '<div class="tr-inspector-empty">Sem detalhes ainda. Edite o bloco para documentar.</div>'}
    </section>
    ${node.doneCriteria?.length ? `<section class="${trInspCardClass('criterios')}">
      ${trInspCardHead('criterios', `Critérios de pronto <span class="chip">${critDone}/${node.doneCriteria.length}</span>`)}
      <ul class="tr-inspector-criteria checklist">${node.doneCriteria.map((c) =>
        trilhaChecklistItem(c, ` onclick="toggleTrilhaCriterion('${node.id}','${c.id}')" title="Marcar/desmarcar"`)).join('')}</ul>
    </section>` : ''}
    ${node.result ? `<section class="${trInspCardClass('resultado')}">
      ${trInspCardHead('resultado', 'Resultado da entrega')}
      <div class="tr-inspector-details result">${renderMarkdown(node.result)}</div>
    </section>` : ''}
    <section class="${trInspCardClass('conexoes')}">
      ${trInspCardHead('conexoes', `Conexões <span class="chip">${incoming.length + outgoing.length}</span>`)}
      <div class="tr-insp-conn-h">Depende de (${incoming.length})</div>
      ${incoming.length ? incoming.map((e) => trilhaConnRow(e, e.fromNodeId, 'arrow-left')).join('') : '<div class="tr-inspector-empty">Nenhuma. Pode começar em paralelo.</div>'}
      <div class="tr-insp-conn-h">Libera (${outgoing.length})</div>
      ${outgoing.length ? outgoing.map((e) => trilhaConnRow(e, e.toNodeId, 'arrow-right')).join('') : '<div class="tr-inspector-empty">Nenhum bloco depende deste.</div>'}
    </section>`;
};

const renderTrilhaInspector = (body) => {
  const node = trilhaNodeById(selectedTrilhaNodeId);
  if (!node) {
    trilhaRailTab = 'attention';
    renderTrilhaAttention(body);
    return;
  }
  const a = node.assignee || { kind: 'ai', label: 'IA' };
  const stale = node.claimedBy ? trilhaStaleText(node) : '';
  body.innerHTML = `<div class="tr-insp">
    <div class="tr-insp-top">
      <span class="status ${TR_NODE_STATUS_CLS[node.status] || ''}">${escHtml(TR_NODE_STATUS_LABEL[node.status] || node.status)}</span>
      ${node.group ? `<span class="chip">${escHtml(node.group)}</span>` : ''}
      <button class="tr-inspector-close icon-btn" onclick="closeTrilhaInspector()" title="Fechar">${ICON('x')}</button>
    </div>
    <div class="tr-inspector-title" ondblclick="openNodeModal('${node.id}')" title="Duplo clique para editar">${escHtml(node.title)}</div>
    <div class="tr-insp-sub">
      <span class="tr-insp-assignee ${a.kind}">${a.kind === 'ai' ? ICON('bot') : ICON('user')}<span>${escHtml(a.label)}</span></span>
      ${node.claimedBy
        ? `<span class="tr-insp-claim${stale ? ' stale' : ''}">${ICON('lock')}<span>${escHtml(node.claimedBy)}</span>${stale ? `<span>sem sinal ${stale}</span>` : ''}</span>`
        : '<span class="tr-insp-free">Trava livre</span>'}
    </div>
    <div class="seg tr-inspector-row">
      ${['todo', 'doing', 'done', 'blocked'].map((s) =>
        `<button class="tr-status-btn${node.status === s ? ' on' : ''}" onclick="setTrilhaNodeStatus('${node.id}','${s}')">${escHtml(TR_NODE_STATUS_LABEL[s])}</button>`
      ).join('')}
    </div>
    ${node.status === 'blocked' && node.blockedReason
      ? `<div class="tr-inspector-blocked">${ICON('alert-triangle')}<span><b>Bloqueio:</b> ${escHtml(node.blockedReason)}</span></div>`
      : ''}
    ${trilhaInspectorCards(node)}
    <div class="tr-inspector-actions">
      ${node.claimedBy
        ? `<button class="app-secondary-btn danger" onclick="releaseTrilhaNode()">${ICON('unlink')} Liberar trava</button>`
        : `<button class="app-primary-btn" onclick="claimTrilhaNode()">${ICON('lock')} Assumir bloco</button>`}
      <div class="tr-insp-tools">
        <button class="ghost-btn" onclick="openNodeModal('${node.id}')">${ICON('pencil')} Editar</button>
        <button class="ghost-btn" onclick="copyTrilhaNodePackage('${node.id}')">${ICON('copy')} Pacote para IA</button>
        <button class="ghost-btn" onclick="copyTrilhaNodeId('${node.id}')">${ICON('hash')} ID</button>
        <button class="icon-btn danger" onclick="deleteSelectedTrilhaNode()" title="Excluir bloco">${ICON('trash')}</button>
      </div>
    </div>
  </div>`;
};

const closeTrilhaInspector = () => {
  selectedTrilhaNodeId = null;
  selectedTrilhaStickyId = null;
  trilhaRailTab = 'attention';
  renderTrilhaMap();
  renderTrilhaRail();
};
