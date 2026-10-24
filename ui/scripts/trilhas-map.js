// ════ Trilhas — mapa: grupos, blocos compactos e setas ════
// Blocos são cartões de leitura rápida (status, título, sinais, contexto):
// o texto longo mora no painel lateral, nunca no mapa.

const TR_PILL_H = 74;
const TR_GROUP_PAD = 18;
const TR_GROUP_TOP = 42;
const TR_REF_ICON = {
  note: 'notebook',
  skill: 'skill',
  macro: 'macro',
  podcast: 'mic',
  favorite: 'bookmark',
  guardrail: 'shield',
};
const TR_SIGNAL_ICON = {
  blocker: 'x-circle',
  warning: 'alert-triangle',
  question: 'alert-circle',
  pending: 'clock',
};
const TR_SIGNAL_LABEL = {
  blocker: 'Bloqueio',
  warning: 'Aviso',
  question: 'Pergunta',
  pending: 'Pendência',
};

let trilhaCollapsedRects = new Map();

const trNodeH = (id) => trilhaNodeHeights.get(id) || 108;

const trilhaGroupNodes = (group) =>
  currentTrilhaDetail.nodes.filter((n) => n.group === group);

const trilhaIsHidden = (node) =>
  !!node.group && trilhaCollapsed.has(node.group);

// Retângulo do bloco; se estiver num grupo recolhido, o da pílula do grupo.
const trilhaRectOf = (node) => {
  if (trilhaIsHidden(node)) return trilhaCollapsedRects.get(node.group);
  return { x: node.position.x, y: node.position.y, w: TR_NODE_W, h: trNodeH(node.id) };
};

// Geometria da seta: escolhe o par saída/entrada mais curto, preferindo o
// lado para onde o destino realmente está. Funciona com retângulos, então
// vale igual para blocos e para pílulas de grupo recolhido.
const trilhaEdgeD = (a, b) => {
  const exits = [
    { x: a.x + a.w, y: a.y + a.h / 2, dx: 1, dy: 0 },
    { x: a.x, y: a.y + a.h / 2, dx: -1, dy: 0 },
    { x: a.x + a.w / 2, y: a.y + a.h, dx: 0, dy: 1 },
    { x: a.x + a.w / 2, y: a.y, dx: 0, dy: -1 },
  ];
  const entries = [
    { x: b.x, y: b.y + b.h / 2, dx: -1, dy: 0 },
    { x: b.x + b.w, y: b.y + b.h / 2, dx: 1, dy: 0 },
    { x: b.x + b.w / 2, y: b.y, dx: 0, dy: -1 },
    { x: b.x + b.w / 2, y: b.y + b.h, dx: 0, dy: 1 },
  ];
  let best = [exits[0], entries[0]];
  let bestScore = Infinity;
  for (let i = 0; i < 4; i++) {
    const p = exits[i];
    const q = entries[i];
    const dist = Math.hypot(q.x - p.x, q.y - p.y);
    const ahead = (q.x - p.x) * p.dx + (q.y - p.y) * p.dy;
    const score = dist + (ahead > 0 ? 0 : 600);
    if (score < bestScore) {
      bestScore = score;
      best = [p, q];
    }
  }
  const [p, q] = best;
  const k = Math.min(160, Math.max(40, Math.hypot(q.x - p.x, q.y - p.y) / 2));
  return `M ${p.x} ${p.y} C ${p.x + p.dx * k} ${p.y + p.dy * k}, ` +
    `${q.x + q.dx * k} ${q.y + q.dy * k}, ${q.x} ${q.y}`;
};

const trilhaAssigneeBadge = (node) => {
  const a = node.assignee || { kind: 'ai', label: 'IA' };
  const icon = a.kind === 'ai' ? ICON('bot') : ICON('user');
  return `<span class="tr-node-assignee ${a.kind}">${icon}<span>${escHtml(a.label)}</span></span>`;
};

// ── Cartão do bloco ──

const trilhaSignalBadges = (signals) => {
  const counts = {};
  signals.forEach((s) => { counts[s.kind] = (counts[s.kind] || 0) + 1; });
  return ['blocker', 'question', 'pending', 'warning']
    .filter((k) => counts[k])
    .map((k) => `<span class="tr-sig sig-${k}" title="${counts[k]} ${TR_SIGNAL_LABEL[k].toLowerCase()} aberto">${ICON(TR_SIGNAL_ICON[k])}${counts[k]}</span>`)
    .join('');
};

// Vínculos do bloco com nome: dá para ler no mapa o que está ligado a ele.
// Macros ficam de fora (já aparecem como botão ▶).
const trilhaRefChips = (refs) => {
  const list = refs.filter((r) => r.kind !== 'macro');
  const named = list.slice(0, 2).map((r) => {
    const icon = TR_REF_ICON[r.role === 'guardrail' ? 'guardrail' : r.kind];
    return `<span class="tr-ref-chip named${r.missing ? ' missing' : ''}" title="${escHtml(r.title)}">${ICON(icon)}<span>${escHtml(r.title)}</span></span>`;
  }).join('');
  const rest = list.length > 2
    ? `<span class="tr-ref-chip" title="${escHtml(list.slice(2).map((r) => r.title).join(', '))}">+${list.length - 2}</span>`
    : '';
  return named + rest;
};

const trilhaCritMini = (node) => {
  const list = node.doneCriteria || [];
  if (!list.length) return '';
  const done = list.filter((c) => c.done).length;
  return `<span class="tr-crit-mini" title="${done} de ${list.length} critérios">
    <progress value="${done}" max="${list.length}"></progress>${done}/${list.length}</span>`;
};

const trilhaMacroButtons = (refs) => {
  const macros = refs.filter((r) => r.kind === 'macro' && !r.missing);
  const shown = macros.slice(0, 2).map((r) =>
    `<button type="button" class="tr-node-macro" data-run-macro="${r.targetId}" title="Executar macro: ${escHtml(r.title)}">${ICON('play')}<span>${escHtml(r.title)}</span></button>`
  ).join('');
  const extra = macros.length > 2 ? `<span class="tr-ref-chip">+${macros.length - 2}</span>` : '';
  return shown || extra ? `<div class="tr-node-macros">${shown}${extra}</div>` : '';
};

const trilhaNodeCard = (node, focusIds) => {
  const selected = node.id === selectedTrilhaNodeId;
  const stale = node.claimedBy ? trilhaStaleText(node) : '';
  const deps = trilhaIncoming(node.id).length;
  const outs = trilhaOutgoing(node.id).length;
  const refs = trilhaNodeRefs(node.id);
  const dim = focusIds && !focusIds.has(node.id);
  const meta = trilhaCritMini(node) + trilhaRefChips(refs);
  return `<div class="tr-node st-${node.status}${selected ? ' selected' : ''}${stale ? ' has-stale' : ''}${dim ? ' dim' : ''}"
    data-node-id="${node.id}" title="Duplo clique para editar"
    style="left:${node.position.x}px;top:${node.position.y}px">
    <i class="tr-port l"></i><i class="tr-port r"></i><i class="tr-port t"></i><i class="tr-port b"></i>
    <div class="tr-node-head">
      <span class="status ${TR_NODE_STATUS_CLS[node.status] || ''}">${escHtml(TR_NODE_STATUS_LABEL[node.status] || node.status)}</span>
      ${trilhaSignalBadges(trilhaNodeSignals(node.id))}
      ${node.claimedBy ? `<span class="tr-node-claim${stale ? ' stale' : ''}" title="Reservado por ${escHtml(node.claimedBy)}${stale ? `: sem sinal ${stale}` : ''}">${ICON('lock')}<span>${escHtml(node.claimedBy)}</span>${stale ? `<span class="tr-stale">${stale}</span>` : ''}</span>` : ''}
      <button class="tr-node-icon" data-copy-id="${node.id}" title="Copiar ID do bloco">${ICON('copy')}</button>
    </div>
    <div class="tr-node-title">${escHtml(node.title)}</div>
    ${meta ? `<div class="tr-node-meta">${meta}</div>` : ''}
    ${trilhaMacroButtons(refs)}
    <div class="tr-node-foot">
      ${trilhaAssigneeBadge(node)}
      <span class="tr-node-deps">
        ${deps ? `<span title="Depende de ${deps}">${ICON('arrow-left')}${deps}</span>` : ''}
        ${outs ? `<span title="Libera ${outs}">${ICON('arrow-right')}${outs}</span>` : ''}
      </span>
    </div>
  </div>`;
};

// ── Grupos: moldura (aberto) ou pílula (recolhido) ──

const trilhaGroupStats = (members) => {
  const att = currentTrilhaDetail.attention;
  const ids = new Set(members.map((n) => n.id));
  return {
    total: members.length,
    done: members.filter((n) => n.status === 'done').length,
    blocked: members.filter((n) => n.status === 'blocked').length,
    needs: att.filter((a) => a.nodeId && ids.has(a.nodeId) &&
      ['blocker', 'question', 'pending'].includes(a.kind)).length,
    active: members.filter((n) => n.status === 'doing').length,
  };
};

const trilhaGroupLabel = (group, stats, collapsed) => `
  <button type="button" class="tr-group-label" data-group-toggle="${escHtml(group)}" title="${collapsed ? 'Expandir' : 'Recolher'} grupo">
    ${ICON(collapsed ? 'chevron-right' : 'chevron-down')}
    <span class="tr-group-name">${escHtml(group)}</span>
    <span class="tr-group-count">${stats.done}/${stats.total}</span>
    ${stats.blocked ? `<span class="status danger">${stats.blocked}</span>` : ''}
    ${stats.needs && !stats.blocked ? `<span class="status info">${stats.needs}</span>` : ''}
  </button>`;

const trilhaExpandedBox = (members) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  members.forEach((n) => {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + TR_NODE_W);
    maxY = Math.max(maxY, n.position.y + trNodeH(n.id));
  });
  return {
    x: minX - TR_GROUP_PAD,
    y: minY - TR_GROUP_TOP,
    w: maxX - minX + TR_GROUP_PAD * 2,
    h: maxY - minY + TR_GROUP_PAD + TR_GROUP_TOP,
  };
};

const trilhaGroupBoxStyle = (box) =>
  `left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px`;

const renderTrilhaGroups = () => {
  const el = $('trilha-groups');
  trilhaCollapsedRects = new Map();
  const names = [...new Set(currentTrilhaDetail.nodes.map((n) => n.group).filter(Boolean))];
  el.innerHTML = names.map((group) => {
    const members = trilhaGroupNodes(group);
    const stats = trilhaGroupStats(members);
    if (!trilhaCollapsed.has(group)) {
      const box = trilhaExpandedBox(members);
      return `<div class="tr-group" data-group="${escHtml(group)}" style="${trilhaGroupBoxStyle(box)}">${trilhaGroupLabel(group, stats, false)}</div>`;
    }
    const x = Math.min(...members.map((n) => n.position.x));
    const y = Math.min(...members.map((n) => n.position.y));
    trilhaCollapsedRects.set(group, { x, y, w: TR_NODE_W, h: TR_PILL_H });
    const pct = stats.total ? Math.round(stats.done / stats.total * 100) : 0;
    return `<div class="tr-group-pill${stats.blocked ? ' has-blocked' : ''}" data-group="${escHtml(group)}" style="left:${x}px;top:${y}px;width:${TR_NODE_W}px;height:${TR_PILL_H}px">
      ${trilhaGroupLabel(group, stats, true)}
      <div class="tr-pill-bar"><i style="width:${pct}%"></i></div>
      <div class="tr-pill-meta">${stats.active ? `${stats.active} fazendo · ` : ''}${stats.total - stats.done} abertos</div>
    </div>`;
  }).join('');
};

// Durante o arrasto: só reposiciona as molduras abertas (sem remontar).
const redrawTrilhaGroups = () => {
  $('trilha-groups').querySelectorAll('.tr-group').forEach((el) => {
    const members = trilhaGroupNodes(el.dataset.group);
    if (members.length) el.style.cssText = trilhaGroupBoxStyle(trilhaExpandedBox(members));
  });
};

const toggleTrilhaGroup = (group) => {
  if (trilhaCollapsed.has(group)) trilhaCollapsed.delete(group);
  else trilhaCollapsed.add(group);
  saveTrilhaCollapsed();
  renderTrilhaMap();
};

// ── Limites do conteúdo (dimensiona o canvas e o "ajustar à tela") ──

const trilhaContentBounds = () => {
  const { nodes, stickies } = currentTrilhaDetail;
  const rects = [];
  nodes.forEach((n) => { if (!trilhaIsHidden(n)) rects.push(trilhaRectOf(n)); });
  trilhaCollapsedRects.forEach((r) => rects.push(r));
  stickies.forEach((s) => rects.push({ x: s.position.x, y: s.position.y, w: 200, h: 160 }));
  $('trilha-groups').querySelectorAll('.tr-group').forEach((el) => {
    rects.push({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  });
  if (!rects.length) return null;
  return {
    minX: Math.min(...rects.map((r) => r.x)),
    minY: Math.min(...rects.map((r) => r.y)),
    maxX: Math.max(...rects.map((r) => r.x + r.w)),
    maxY: Math.max(...rects.map((r) => r.y + r.h)),
  };
};

const renderTrilhaEdges = () => {
  const svg = $('trilha-edges');
  const edges = currentTrilhaDetail.edges.map((edge) => {
    const from = trilhaNodeById(edge.fromNodeId);
    const to = trilhaNodeById(edge.toNodeId);
    if (!from || !to) return '';
    if (trilhaIsHidden(from) && trilhaIsHidden(to) && from.group === to.group) return '';
    const rel = selectedTrilhaNodeId &&
      (edge.fromNodeId === selectedTrilhaNodeId || edge.toNodeId === selectedTrilhaNodeId);
    return `<path class="tr-edge${rel ? ' rel' : ''}" data-edge-id="${edge.id}"
      d="${trilhaEdgeD(trilhaRectOf(from), trilhaRectOf(to))}"
      marker-end="url(#tr-arrow)"><title>${escHtml(from.title)} para ${escHtml(to.title)}</title></path>`;
  }).join('');
  svg.innerHTML = `<defs>
      <marker id="tr-arrow" viewBox="0 0 10 10" refX="9" refY="5"
        markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="var(--text-4)" stroke-width="1.6"/>
      </marker>
      <marker id="tr-arrow-hi" viewBox="0 0 10 10" refX="9" refY="5"
        markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="var(--info)" stroke-width="1.6"/>
      </marker>
    </defs>${edges}`;
};

const renderTrilhaStickies = () => {
  const el = $('trilha-stickies');
  el.innerHTML = currentTrilhaDetail.stickies.map((s) => {
    const selected = s.id === selectedTrilhaStickyId;
    return `<div class="tr-sticky c-${escHtml(s.color || 'yellow')}${selected ? ' selected' : ''}"
      data-sticky-id="${s.id}" title="Duplo clique para editar"
      style="left:${s.position.x}px;top:${s.position.y}px">
      <button class="tr-sticky-del icon-btn danger" data-sticky-del="${s.id}" title="Excluir sticker">${ICON('x')}</button>
      <div class="tr-sticky-text">${renderMarkdown(s.text || '')}</div>
    </div>`;
  }).join('');
};

const renderTrilhaMap = () => {
  const nodesEl = $('trilha-nodes');
  const canvas = $('trilha-canvas');
  const { nodes } = currentTrilhaDetail;
  const focusIds = trilhaFocusIds();
  trilhaNodeHeights = new Map();

  // Mede alturas sem escala: o offsetHeight inclui o zoom, então reseta
  // temporariamente para as setas usarem coordenadas reais (dados).
  canvas.style.zoom = '1';
  nodesEl.innerHTML = nodes.filter((n) => !trilhaIsHidden(n))
    .map((n) => trilhaNodeCard(n, focusIds)).join('');
  nodesEl.querySelectorAll('.tr-node').forEach((el) => {
    trilhaNodeHeights.set(el.dataset.nodeId, el.offsetHeight);
  });

  renderTrilhaGroups();
  renderTrilhaStickies();

  const b = trilhaContentBounds();
  const w = Math.max(900, b ? b.maxX + 240 : 0);
  const h = Math.max(620, b ? b.maxY + 200 : 0);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const svg = $('trilha-edges');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  renderTrilhaEdges();

  bindTrilhaMap();
  bindTrilhaStickies();
  bindTrilhaPan();
  trilhaApplyZoom();
  hydrateIcons(nodesEl);
  hydrateIcons($('trilha-groups'));
  hydrateIcons($('trilha-stickies'));
};

// Centraliza o bloco na tela (clicar na fila de atenção leva até ele).
const trilhaScrollToNode = (id) => {
  const node = trilhaNodeById(id);
  const wrap = $('trilha-map-wrap');
  if (!node || !wrap) return;
  if (trilhaIsHidden(node)) {
    trilhaCollapsed.delete(node.group);
    saveTrilhaCollapsed();
    renderTrilhaMap();
  }
  const r = trilhaRectOf(node);
  wrap.scrollTo({
    left: Math.max(0, (r.x + r.w / 2) * trilhaZoom - wrap.clientWidth / 2),
    top: Math.max(0, (r.y + r.h / 2) * trilhaZoom - wrap.clientHeight / 2),
    behavior: 'smooth',
  });
};
