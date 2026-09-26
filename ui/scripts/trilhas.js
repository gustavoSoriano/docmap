// ════ Trilhas — objetivo visual editável (humano + IA) ════
// Mapa: blocos HTML arrastáveis + setas SVG. Sem libs, sem bundler.

const TR_STATUS_LABEL = {
  draft: 'Rascunho',
  running: 'Em execução',
  done: 'Concluída',
  cancelled: 'Cancelada',
};

const TR_NODE_STATUS_LABEL = {
  todo: 'A fazer',
  doing: 'Fazendo',
  done: 'Pronto',
  blocked: 'Bloqueado',
};

const TR_NODE_W = 232;
const TR_POLL_MS = 4000;

let allTrilhas = [];
let currentTrilhaDetail = null;
let selectedTrilhaNodeId = null;
let selectedTrilhaStickyId = null;
let trilhaNodeHeights = new Map();
let trilhaMe = null;
let trilhaActivityOpen = false;

// ── Zoom + pan do canvas ──
// O canvas usa CSS `zoom` (layout escala junto, scroll continua certo).
// O arrasto dos nós divide o delta pelo zoom para manter 1:1 com o cursor.
let trilhaZoom = 1;
const TRILHA_ZOOM_MIN = 0.4;
const TRILHA_ZOOM_MAX = 1.75;
const TRILHA_ZOOM_STEP = 0.15;
let trilhaPanBound = false;

const trilhaBody = (body) => trilhaMe ? { ...body, by: trilhaMe } : body;

const trilhaStaleText = (node) => {
  const beat = node.lastHeartbeatAt || node.claimedAt;
  if (!node.claimedBy || !beat) return '';
  const mins = Math.floor((Date.now() - new Date(beat).getTime()) / 60000);
  if (mins < 5) return '';
  return mins < 60 ? `há ${mins}min` : `há ${Math.floor(mins / 60)}h`;
};

const trilhaTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
let trBusy = false;
let trDragging = false;
let trPollTimer = null;

const trilhaCsv = (value) =>
  String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

const renderTrilhaTags = (tags) =>
  (tags || []).map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('');

const trilhaNodeById = (id) =>
  currentTrilhaDetail?.nodes.find((n) => n.id === id);

const trilhaStickyById = (id) =>
  currentTrilhaDetail?.stickies?.find((s) => s.id === id);

const trilhaIncoming = (nodeId) =>
  (currentTrilhaDetail?.edges || []).filter((e) => e.toNodeId === nodeId);

const trilhaOutgoing = (nodeId) =>
  (currentTrilhaDetail?.edges || []).filter((e) => e.fromNodeId === nodeId);

// ── Lista ──

const loadTrilhas = async () => {
  startTrilhaPolling();
  try {
    const res = await fetch('/trilhas');
    if (!res.ok) throw new Error(await res.text());
    allTrilhas = await res.json();
    renderTrilhasList();
  } catch (err) {
    console.error('Erro ao carregar trilhas:', err);
    toast('Falha ao carregar trilhas');
  }
};

let trilhaFilter = 'all';

const setTrilhaFilter = (f) => {
  trilhaFilter = f || 'all';
  document.querySelectorAll('.tr-filter-chip').forEach((chip) => {
    chip.classList.toggle('on', chip.dataset.trilhaFilter === trilhaFilter);
  });
  renderTrilhasList();
};

const renderTrilhasList = () => {
  const list = $('trilha-list');
  if (!list) return;
  const q = ($('trilha-search')?.value || '').trim().toLowerCase();
  const items = allTrilhas.filter((t) => {
    if (trilhaFilter !== 'all' && t.status !== trilhaFilter) return false;
    return !q || t.title.toLowerCase().includes(q) ||
      (t.objective || '').toLowerCase().includes(q) ||
      (t.tags || []).join(' ').toLowerCase().includes(q);
  });
  const total = allTrilhas.length;
  $('trilha-sidebar-count').textContent =
    trilhaFilter === 'all' || items.length === total
      ? `${total} ${total === 1 ? 'trilha' : 'trilhas'}`
      : `${items.length} de ${total}`;
  if (!items.length) {
    list.innerHTML = q || trilhaFilter !== 'all'
      ? '<div class="trilha-sidebar-empty">Nada por aqui.<br>Tente outro filtro ou busca.</div>'
      : '<div class="trilha-sidebar-empty">Nenhuma trilha ainda.<br>Crie a primeira para começar.</div>';
    return;
  }
  list.innerHTML = items.map((t) => {
    const active = currentTrilhaDetail?.trilha.id === t.id;
    const blocks = t.nodeCount || 0;
    return `<button class="trilha-list-item${active ? ' active' : ''}" data-trilha-id="${t.id}">
      <span class="trilha-list-title">${escHtml(t.title)}</span>
      ${t.objective ? `<span class="trilha-list-objective">${escHtml(t.objective)}</span>` : ''}
      <span class="trilha-list-meta">
        <span class="tr-status-dot ${t.status}"></span>
        <span>${escHtml(TR_STATUS_LABEL[t.status] || t.status)}</span>
        <span class="trilha-list-count">${blocks} ${blocks === 1 ? 'bloco' : 'blocos'}</span>
      </span>
    </button>`;
  }).join('');
  list.querySelectorAll('.trilha-list-item').forEach((item) => {
    item.addEventListener('click', () => openTrilha(item.dataset.trilhaId));
  });
};

// ── Abertura ──

const openTrilha = async (id) => {
  if (currentMode !== 'trilhas') setMode('trilhas');
  trBusy = true;
  try {
    const res = await fetch(`/trilhas/${id}`);
    if (!res.ok) throw new Error(await res.text());
    currentTrilhaDetail = await res.json();
    if (!Array.isArray(currentTrilhaDetail.stickies)) {
      currentTrilhaDetail.stickies = [];
    }
    selectedTrilhaNodeId = null;
    selectedTrilhaStickyId = null;
    trilhaMe = null;
    trilhaActivityOpen = false;
    renderTrilhasList();
    renderCurrentTrilha();
  } catch (err) {
    console.error('Erro ao abrir trilha:', err);
    toast('Falha ao abrir trilha');
  } finally {
    trBusy = false;
  }
};

// ── Auto-refresh ──
// A IA mexe na mesma trilha via API: polling leve para o mapa não ficar velho.
// Só redesenha quando algo mudou de fato (assinatura), e nunca durante
// arrasto de nó, modal aberto ou requisição em voo.

const trilhaSignature = (detail) => JSON.stringify({
  t: detail.trilha.status,
  u: detail.trilha.updatedAt,
  n: detail.nodes.map((n) => [n.id, n.status, n.title, n.details || '', n.position.x, n.position.y]),
  e: detail.edges.map((e) => e.id),
  s: (detail.stickies || []).map((s) => [s.id, s.text, s.color, s.position.x, s.position.y, s.updatedAt]),
});

const trilhaModalOpen = () => !!document.querySelector(
  '#trilha-modal-overlay.visible, #trilha-node-modal-overlay.visible, #trilha-sticky-modal-overlay.visible, #modal-overlay.visible, #fav-modal-overlay.visible',
);

const pollTrilhas = async () => {
  const shouldSkip = !currentTrilhaDetail || currentMode !== 'trilhas' ||
    trBusy || trDragging || trilhaModalOpen() ||
    document.activeElement?.closest?.('#trilha-modal-form, #trilha-node-modal-form');
  if (!shouldSkip) {
    trBusy = true;
    try {
      const id = currentTrilhaDetail.trilha.id;
      const res = await fetch(`/trilhas/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const fresh = await res.json();
      if (!Array.isArray(fresh.stickies)) fresh.stickies = [];
      if (currentTrilhaDetail?.trilha.id === id &&
        trilhaSignature(fresh) !== trilhaSignature(currentTrilhaDetail)) {
        currentTrilhaDetail = fresh;
        if (!trilhaNodeById(selectedTrilhaNodeId)) selectedTrilhaNodeId = null;
        if (!trilhaStickyById(selectedTrilhaStickyId)) {
          selectedTrilhaStickyId = null;
        }
        renderTrilhasList();
        renderCurrentTrilha();
      }
    } catch (err) {
      console.error('Erro no auto-refresh da trilha:', err);
    } finally {
      trBusy = false;
    }
  }
  trPollTimer = setTimeout(pollTrilhas, TR_POLL_MS);
};

const startTrilhaPolling = () => {
  if (trPollTimer) return;
  trPollTimer = setTimeout(pollTrilhas, TR_POLL_MS);
};

const refreshCurrentTrilha = async () => {
  if (!currentTrilhaDetail) return;
  trBusy = true;
  try {
    const res = await fetch(`/trilhas/${currentTrilhaDetail.trilha.id}`);
    if (!res.ok) throw new Error(await res.text());
    currentTrilhaDetail = await res.json();
    if (!Array.isArray(currentTrilhaDetail.stickies)) {
      currentTrilhaDetail.stickies = [];
    }
    if (!trilhaNodeById(selectedTrilhaNodeId)) selectedTrilhaNodeId = null;
    if (!trilhaStickyById(selectedTrilhaStickyId)) {
      selectedTrilhaStickyId = null;
    }
    renderCurrentTrilha();
    await loadTrilhas();
  } catch (err) {
    console.error('Erro ao atualizar trilha:', err);
  } finally {
    trBusy = false;
  }
};

const renderCurrentTrilha = () => {
  if (!currentTrilhaDetail) {
    $('trilha-empty').style.display = '';
    $('trilha-active').style.display = 'none';
    return;
  }
  const { trilha, nodes, edges } = currentTrilhaDetail;
  const stickies = currentTrilhaDetail.stickies || [];
  $('trilha-empty').style.display = 'none';
  $('trilha-active').style.display = '';
  $('trilha-toolbar-title').textContent = trilha.title;
  const doneCount = nodes.filter((n) => n.status === 'done').length;
  const blockedCount = nodes.filter((n) => n.status === 'blocked').length;
  const staleCount = nodes.filter((n) => trilhaStaleText(n)).length;
  $('trilha-toolbar-meta').innerHTML = `
    <span class="tr-status-dot ${trilha.status}"></span>
    <span>${escHtml(TR_STATUS_LABEL[trilha.status] || trilha.status)}</span>
    <span>${nodes.length} ${nodes.length === 1 ? 'bloco' : 'blocos'}</span>
    <span>${doneCount} prontos</span>
    ${blockedCount ? `<span class="tr-meta-alert">${blockedCount} bloqueados</span>` : ''}
    ${staleCount ? `<span class="tr-meta-alert">${staleCount} sem sinal</span>` : ''}
    <span>${edges.length} ${edges.length === 1 ? 'seta' : 'setas'}</span>
    ${stickies.length ? `<span>📝 ${stickies.length} ${stickies.length === 1 ? 'sticker' : 'stickers'}</span>` : ''}
    ${renderTrilhaTags(trilha.tags)}`;
  $('trilha-activity-btn')?.classList.toggle('on', trilhaActivityOpen);
  renderTrilhaMap();
  renderTrilhaInspector();
  hydrateIcons($('mode-trilhas'));
};

// ── Mapa ──

// Geometria da seta: escolhe o par saída→entrada com menor distância,
// preferindo o lado para onde o destino realmente está (direita, esquerda,
// embaixo, em cima). Evita os "S" esquisitos com blocos distantes.
const trilhaEdgeD = (from, to) => {
  const ha = trilhaNodeHeights.get(from.id) || 120;
  const hb = trilhaNodeHeights.get(to.id) || 120;
  const ax = from.position.x;
  const ay = from.position.y;
  const bx = to.position.x;
  const by = to.position.y;
  const exits = [
    { x: ax + TR_NODE_W, y: ay + ha / 2, dx: 1, dy: 0 },
    { x: ax, y: ay + ha / 2, dx: -1, dy: 0 },
    { x: ax + TR_NODE_W / 2, y: ay + ha, dx: 0, dy: 1 },
    { x: ax + TR_NODE_W / 2, y: ay, dx: 0, dy: -1 },
  ];
  const entries = [
    { x: bx, y: by + hb / 2, dx: -1, dy: 0 },
    { x: bx + TR_NODE_W, y: by + hb / 2, dx: 1, dy: 0 },
    { x: bx + TR_NODE_W / 2, y: by, dx: 0, dy: -1 },
    { x: bx + TR_NODE_W / 2, y: by + hb, dx: 0, dy: 1 },
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
  return `<span class="tr-node-assignee ${a.kind}">${icon} ${escHtml(a.label)}</span>`;
};

const renderTrilhaMap = () => {
  const nodesEl = $('trilha-nodes');
  const stickiesEl = $('trilha-stickies');
  const svg = $('trilha-edges');
  const canvas = $('trilha-canvas');
  const { nodes } = currentTrilhaDetail;
  const stickies = currentTrilhaDetail.stickies || [];
  trilhaNodeHeights = new Map();

  // Mede alturas sem escala: o offsetHeight inclui o zoom, então reseta
  // temporariamente para as setas usarem coordenadas reais (dados).
  canvas.style.zoom = '1';

  nodesEl.innerHTML = nodes.map((node) => {
    const selected = node.id === selectedTrilhaNodeId;
    const stale = node.claimedBy ? trilhaStaleText(node) : '';
    const deps = trilhaIncoming(node.id).length;
    const outs = trilhaOutgoing(node.id).length;
    return `<div class="tr-node st-${node.status}${selected ? ' selected' : ''}${stale ? ' has-stale' : ''}"
      data-node-id="${node.id}" title="Duplo clique para editar"
      style="left:${node.position.x}px;top:${node.position.y}px">
      <div class="tr-node-head">
        <span class="tr-node-status">${escHtml(TR_NODE_STATUS_LABEL[node.status] || node.status)}</span>
        ${node.claimedBy ? `<span class="tr-node-claim${stale ? ' stale' : ''}" title="Reservado por ${escHtml(node.claimedBy)}${stale ? ` — sem sinal ${stale}` : ''}">${ICON('lock')} ${escHtml(node.claimedBy)}${stale ? ` · ${stale}` : ''}</span>` : ''}
        <button class="tr-node-icon" data-copy-id="${node.id}" title="Copiar ID do bloco">${ICON('copy')}</button>
      </div>
      <div class="tr-node-title">${escHtml(node.title)}</div>
      ${node.details ? `<div class="tr-node-details">${renderMarkdown(node.details)}</div>` : ''}
      <div class="tr-node-foot">
        ${trilhaAssigneeBadge(node)}
        <span class="tr-node-deps">${deps ? `←${deps}` : ''}${outs ? ` ${outs}→` : ''}</span>
      </div>
    </div>`;
  }).join('');

  // Mede alturas reais antes de traçar as setas.
  nodesEl.querySelectorAll('.tr-node').forEach((el) => {
    trilhaNodeHeights.set(el.dataset.nodeId, el.offsetHeight);
  });

  // Stickers: post-it solto, sem status nem setas.
  if (stickiesEl) {
    stickiesEl.innerHTML = stickies.map((s) => {
      const selected = s.id === selectedTrilhaStickyId;
      return `<div class="tr-sticky c-${escHtml(s.color || 'yellow')}${selected ? ' selected' : ''}"
        data-sticky-id="${s.id}" title="Duplo clique para editar"
        style="left:${s.position.x}px;top:${s.position.y}px">
        <button class="tr-sticky-del" data-sticky-del="${s.id}" title="Excluir sticker">${ICON('x')}</button>
        <div class="tr-sticky-text">${renderMarkdown(s.text || '')}</div>
      </div>`;
    }).join('');
  }

  // Dimensiona o canvas pelo conteúdo.
  let maxX = 900;
  let maxY = 620;
  nodes.forEach((node) => {
    const h = trilhaNodeHeights.get(node.id) || 120;
    maxX = Math.max(maxX, node.position.x + TR_NODE_W + 240);
    maxY = Math.max(maxY, node.position.y + h + 200);
  });
  stickies.forEach((s) => {
    maxX = Math.max(maxX, s.position.x + 200 + 240);
    maxY = Math.max(maxY, s.position.y + 160 + 200);
  });
  canvas.style.width = `${maxX}px`;
  canvas.style.height = `${maxY}px`;
  svg.setAttribute('width', String(maxX));
  svg.setAttribute('height', String(maxY));

  svg.innerHTML = `<defs>
      <marker id="tr-arrow" viewBox="0 0 10 10" refX="9" refY="5"
        markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="var(--text-3)" stroke-width="1.6"/>
      </marker>
    </defs>` + currentTrilhaDetail.edges.map((edge) => {
    const from = trilhaNodeById(edge.fromNodeId);
    const to = trilhaNodeById(edge.toNodeId);
    if (!from || !to) return '';
    return `<path class="tr-edge" data-edge-id="${edge.id}"
      d="${trilhaEdgeD(from, to)}"
      marker-end="url(#tr-arrow)"><title>${escHtml(from.title)} → ${escHtml(to.title)}</title></path>`;
  }).join('');

  bindTrilhaMap();
  bindTrilhaStickies();
  bindTrilhaPan();
  trilhaApplyZoom();
  hydrateIcons(nodesEl);
  if (stickiesEl) hydrateIcons(stickiesEl);
};

// ── Zoom ──

const trilhaApplyZoom = () => {
  const canvas = $('trilha-canvas');
  if (canvas) canvas.style.zoom = String(trilhaZoom);
  const label = $('trilha-zoom-label');
  if (label) label.textContent = `${Math.round(trilhaZoom * 100)}%`;
};

// Ancora o zoom num ponto da tela (cursor ou centro): o ponto de dados sob
// o cursor continua sob o cursor depois do zoom.
const trilhaZoomTo = (next, anchorX, anchorY) => {
  const clamped = Math.min(
    TRILHA_ZOOM_MAX,
    Math.max(TRILHA_ZOOM_MIN, Math.round(next * 100) / 100),
  );
  if (clamped === trilhaZoom) return;
  const wrap = $('trilha-map-wrap');
  const prev = trilhaZoom;
  trilhaZoom = clamped;
  if (wrap && anchorX !== undefined && anchorY !== undefined) {
    const dataX = (wrap.scrollLeft + anchorX) / prev;
    const dataY = (wrap.scrollTop + anchorY) / prev;
    trilhaApplyZoom();
    wrap.scrollLeft = dataX * clamped - anchorX;
    wrap.scrollTop = dataY * clamped - anchorY;
  } else {
    trilhaApplyZoom();
  }
};

const trilhaZoomAnchorCenter = () => {
  const wrap = $('trilha-map-wrap');
  if (!wrap) return [];
  const rect = wrap.getBoundingClientRect();
  return [rect.width / 2, rect.height / 2];
};

const trilhaZoomIn = () => {
  const [ax, ay] = trilhaZoomAnchorCenter();
  trilhaZoomTo(trilhaZoom + TRILHA_ZOOM_STEP, ax, ay);
};

const trilhaZoomOut = () => {
  const [ax, ay] = trilhaZoomAnchorCenter();
  trilhaZoomTo(trilhaZoom - TRILHA_ZOOM_STEP, ax, ay);
};

const trilhaZoomReset = () => trilhaZoomTo(1);

const trilhaZoomFit = () => {
  const wrap = $('trilha-map-wrap');
  const stickies = currentTrilhaDetail?.stickies || [];
  if (!wrap || (!currentTrilhaDetail?.nodes.length && !stickies.length)) {
    trilhaZoomTo(1);
    return;
  }
  const { nodes } = currentTrilhaDetail;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  stickies.forEach((s) => {
    minX = Math.min(minX, s.position.x);
    minY = Math.min(minY, s.position.y);
    maxX = Math.max(maxX, s.position.x + 200);
    maxY = Math.max(maxY, s.position.y + 160);
  });
  nodes.forEach((node) => {
    const h = trilhaNodeHeights.get(node.id) || 120;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + TR_NODE_W);
    maxY = Math.max(maxY, node.position.y + h);
  });
  const pad = 80;
  const contentW = (maxX - minX) + pad * 2;
  const contentH = (maxY - minY) + pad * 2;
  const availW = Math.max(200, wrap.clientWidth - 40);
  const availH = Math.max(200, wrap.clientHeight - 40);
  trilhaZoomTo(Math.min(1.25, availW / contentW, availH / contentH));
  const cx = (minX + maxX) / 2 * trilhaZoom;
  const cy = (minY + maxY) / 2 * trilhaZoom;
  wrap.scrollLeft = Math.max(0, cx - wrap.clientWidth / 2);
  wrap.scrollTop = Math.max(0, cy - wrap.clientHeight / 2);
};

// ── Pan: arrastar o fundo move o scroll ──

const bindTrilhaPan = () => {
  const wrap = $('trilha-map-wrap');
  if (!wrap || trilhaPanBound) return;
  trilhaPanBound = true;
  let panning = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  wrap.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (
      e.target.closest('.tr-node') || e.target.closest('.tr-sticky') ||
      e.target.closest('button')
    ) return;
    panning = true;
    trDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = wrap.scrollLeft;
    startTop = wrap.scrollTop;
    wrap.classList.add('panning');
    try {
      wrap.setPointerCapture(e.pointerId);
    } catch {
      // sem capture: o pan continua funcionando no move
    }
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!panning) return;
    wrap.scrollLeft = startLeft - (e.clientX - startX);
    wrap.scrollTop = startTop - (e.clientY - startY);
  });
  const endPan = () => {
    if (!panning) return;
    panning = false;
    trDragging = false;
    wrap.classList.remove('panning');
  };
  wrap.addEventListener('pointerup', endPan);
  wrap.addEventListener('pointercancel', endPan);
  // Ctrl/cmd + scroll = zoom ancorado no cursor (pinch do trackpad incluso).
  wrap.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    trilhaZoomTo(
      trilhaZoom + (e.deltaY > 0 ? -TRILHA_ZOOM_STEP : TRILHA_ZOOM_STEP),
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
  }, { passive: false });
};

const bindTrilhaMap = () => {
  const nodesEl = $('trilha-nodes');
  nodesEl.querySelectorAll('[data-copy-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyTrilhaNodeId(btn.dataset.copyId);
    });
  });
  nodesEl.querySelectorAll('.tr-node').forEach((el) => {
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let dragging = false;
    const id = el.dataset.nodeId;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      trDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const node = trilhaNodeById(id);
      baseX = node.position.x;
      baseY = node.position.y;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      // Delta de tela ÷ zoom = delta em coordenadas de dados.
      const dx = (e.clientX - startX) / trilhaZoom;
      const dy = (e.clientY - startY) / trilhaZoom;
      if (Math.abs(dx) + Math.abs(dy) < 4 / trilhaZoom) return;
      const node = trilhaNodeById(id);
      node.position = {
        x: Math.max(8, Math.round(baseX + dx)),
        y: Math.max(8, Math.round(baseY + dy)),
      };
      el.style.left = `${node.position.x}px`;
      el.style.top = `${node.position.y}px`;
      redrawTrilhaEdges();
      el.dataset.moved = '1';
    });
    el.addEventListener('pointerup', async (e) => {
      el.classList.remove('dragging');
      if (!dragging) return;
      dragging = false;
      trDragging = false;
      if (el.dataset.moved) {
        delete el.dataset.moved;
        const node = trilhaNodeById(id);
        await saveTrilhaNodePosition(id, node.position);
      } else {
        onTrilhaNodeClick(id);
      }
    });
    el.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      openTrilhaNode(id);
    });
  });
};

const openTrilhaNode = (id) => {
  if (selectedTrilhaNodeId !== id) {
    selectedTrilhaNodeId = id;
    renderTrilhaMap();
    renderTrilhaInspector();
  }
  openNodeModal(id);
};

const redrawTrilhaEdges = () => {
  // Atualiza só os paths (durante o arrasto, sem remontar os nós).
  $('trilha-edges').querySelectorAll('.tr-edge').forEach((path) => {
    const edge = (currentTrilhaDetail?.edges || [])
      .find((e) => e.id === path.dataset.edgeId);
    if (!edge) return;
    const from = trilhaNodeById(edge.fromNodeId);
    const to = trilhaNodeById(edge.toNodeId);
    if (!from || !to) return;
    path.setAttribute('d', trilhaEdgeD(from, to));
  });
};

const saveTrilhaNodePosition = async (nodeId, position) => {
  const { trilha } = currentTrilhaDetail;
  try {
    await fetch(`/trilhas/${trilha.id}/nodes/${nodeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trilhaBody({ position })),
    });
  } catch (err) {
    console.error('Erro ao salvar posição:', err);
  }
};

// Clique simples só seleciona (idempotente): sem isso o duplo clique
// piscava — 1º clique selecionava, 2º desselecionava, e o dblclick
// precisava reselecionar. Desselecionar é pelo X do inspetor.
const onTrilhaNodeClick = async (id) => {
  trilhaActivityOpen = false;
  selectedTrilhaStickyId = null;
  if (selectedTrilhaNodeId !== id) {
    selectedTrilhaNodeId = id;
    renderTrilhaMap();
  }
  renderTrilhaInspector();
};

// ── Stickers: post-it solto (sem status, sem setas, fora do next) ──

const onTrilhaStickyClick = (id) => {
  trilhaActivityOpen = false;
  selectedTrilhaNodeId = null;
  if (selectedTrilhaStickyId !== id) {
    selectedTrilhaStickyId = id;
    renderTrilhaMap();
  }
  renderTrilhaInspector();
};

const saveTrilhaStickyPosition = async (stickyId, position) => {
  const { trilha } = currentTrilhaDetail;
  try {
    await fetch(`/trilhas/${trilha.id}/stickies/${stickyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position }),
    });
  } catch (err) {
    console.error('Erro ao salvar posição do sticker:', err);
  }
};

const bindTrilhaStickies = () => {
  const box = $('trilha-stickies');
  if (!box) return;
  box.querySelectorAll('[data-sticky-del]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTrilhaSticky(btn.dataset.stickyDel);
    });
  });
  box.querySelectorAll('.tr-sticky').forEach((el) => {
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let dragging = false;
    const id = el.dataset.stickyId;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      trDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const s = trilhaStickyById(id);
      baseX = s.position.x;
      baseY = s.position.y;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // sem capture: o arrasto continua no move
      }
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = (e.clientX - startX) / trilhaZoom;
      const dy = (e.clientY - startY) / trilhaZoom;
      if (Math.abs(dx) + Math.abs(dy) < 4 / trilhaZoom) return;
      const s = trilhaStickyById(id);
      s.position = {
        x: Math.max(8, Math.round(baseX + dx)),
        y: Math.max(8, Math.round(baseY + dy)),
      };
      el.style.left = `${s.position.x}px`;
      el.style.top = `${s.position.y}px`;
      el.dataset.moved = '1';
    });
    el.addEventListener('pointerup', async () => {
      el.classList.remove('dragging');
      if (!dragging) return;
      dragging = false;
      trDragging = false;
      if (el.dataset.moved) {
        delete el.dataset.moved;
        const s = trilhaStickyById(id);
        await saveTrilhaStickyPosition(id, s.position);
      } else {
        onTrilhaStickyClick(id);
      }
    });
    el.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      selectedTrilhaNodeId = null;
      selectedTrilhaStickyId = id;
      renderTrilhaMap();
      renderTrilhaInspector();
      openStickyModal(id);
    });
  });
};

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
      <input type="text" data-act="text" maxlength="300" placeholder="Novo critério…"
        value="${escHtml(c.text)}">
      <button type="button" class="tr-crit-del" data-act="del"
        title="Remover critério">${ICON('x')}</button>
    </div>`
  ).join('') ||
    '<div class="tr-inspector-empty">Nenhum critério — adicione abaixo.</div>';
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

// ── Inspetor ──

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
};

// ── Cartões do inspetor: sanfona, todos fechados por padrão ──
// O estado é global à sessão (não por bloco): expandiu uma vez, segue
// expandido ao trocar de bloco. Clique no cabeçalho alterna.
const TR_INSP_CARDS = ['briefing', 'criterios', 'resultado', 'conexoes'];
let trInspCollapsed = new Set(TR_INSP_CARDS);

const toggleTrilhaInspCard = (key) => {
  if (!TR_INSP_CARDS.includes(key)) return;
  if (trInspCollapsed.has(key)) trInspCollapsed.delete(key);
  else trInspCollapsed.add(key);
  renderTrilhaInspector();
};

const trInspCardClass = (key) =>
  `tr-insp-card${trInspCollapsed.has(key) ? ' closed' : ''}`;

const trInspCardHead = (key, label) =>
  `<button type="button" class="tr-insp-card-h" onclick="toggleTrilhaInspCard('${key}')" aria-expanded="${!trInspCollapsed.has(key)}"><span>${label}</span>${ICON('chevron-right')}</button>`;

const renderTrilhaInspector = () => {
  const panel = $('trilha-inspector');
  const content = $('trilha-inspector-content');
  if (trilhaActivityOpen) {
    panel.hidden = false;
    content.innerHTML = `
      <div class="tr-insp-top">
        <span class="tr-insp-title-sm">Atividade</span>
        <button class="tr-inspector-close" onclick="toggleTrilhaActivity()" title="Fechar">${ICON('x')}</button>
      </div>
      <div id="trilha-activity-list"><div class="tr-inspector-empty">Carregando…</div></div>`;
    hydrateIcons(content);
    loadTrilhaActivity();
    return;
  }
  if (!selectedTrilhaNodeId) {
    panel.hidden = true;
    content.innerHTML = '';
    return;
  }
  const node = trilhaNodeById(selectedTrilhaNodeId);
  if (!node) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  const incoming = trilhaIncoming(node.id);
  const outgoing = trilhaOutgoing(node.id);
  const a = node.assignee || { kind: 'ai', label: 'IA' };
  const stale = node.claimedBy ? trilhaStaleText(node) : '';
  const critDone = (node.doneCriteria || []).filter((c) => c.done).length;
  content.innerHTML = `
    <div class="tr-insp-top">
      <span class="tr-insp-pill st-${node.status}"><span class="tr-status-dot ${node.status}"></span>${escHtml(TR_NODE_STATUS_LABEL[node.status] || node.status)}</span>
      <button class="tr-inspector-close" onclick="closeTrilhaInspector()" title="Fechar">${ICON('x')}</button>
    </div>
    <div class="tr-inspector-title" ondblclick="openNodeModal('${node.id}')" title="Duplo clique para editar">${escHtml(node.title)}</div>
    <div class="tr-insp-sub">
      <span class="tr-insp-assignee ${a.kind}">${a.kind === 'ai' ? ICON('bot') : ICON('user')} ${escHtml(a.label)}</span>
      <span class="tr-insp-sep">·</span>
      ${node.claimedBy
        ? `<span class="tr-insp-claim${stale ? ' stale' : ''}">${ICON('lock')} ${escHtml(node.claimedBy)}${stale ? ` · sem sinal ${stale}` : ''}</span>`
        : '<span class="tr-insp-free">Trava livre</span>'}
    </div>
    <div class="tr-inspector-row">
      ${['todo', 'doing', 'done', 'blocked'].map((s) =>
        `<button class="tr-status-btn${node.status === s ? ' on' : ''}" onclick="setTrilhaNodeStatus('${node.id}','${s}')">${escHtml(TR_NODE_STATUS_LABEL[s])}</button>`
      ).join('')}
    </div>
    ${node.status === 'blocked' && node.blockedReason
      ? `<div class="tr-inspector-blocked"><b>Bloqueio:</b> ${escHtml(node.blockedReason)}</div>`
      : ''}
    <section class="${trInspCardClass('briefing')}">
      ${trInspCardHead('briefing', 'Briefing')}
      ${node.details ? `<div class="tr-inspector-details">${renderMarkdown(node.details)}</div>` : '<div class="tr-inspector-empty">Sem detalhes ainda — edite para documentar.</div>'}
    </section>
    ${(node.doneCriteria?.length)
      ? `<section class="${trInspCardClass('criterios')}">
          ${trInspCardHead('criterios', `Critérios de pronto · ${critDone}/${node.doneCriteria.length}`)}
          <ul class="tr-inspector-criteria checklist">${node.doneCriteria.map((c) =>
            trilhaChecklistItem(c, ` onclick="toggleTrilhaCriterion('${node.id}','${c.id}')" title="Marcar/desmarcar"`)).join('')}</ul>
        </section>`
      : ''}
    ${node.result
      ? `<section class="${trInspCardClass('resultado')}">
          ${trInspCardHead('resultado', 'Resultado da entrega')}
          <div class="tr-inspector-details result">${renderMarkdown(node.result)}</div>
        </section>`
      : ''}
    <section class="${trInspCardClass('conexoes')}">
      ${trInspCardHead('conexoes', 'Conexões')}
      <div class="tr-insp-conn-h">Depende de · ${incoming.length}</div>
      ${incoming.length ? incoming.map((e) => {
        const from = trilhaNodeById(e.fromNodeId);
        return `<div class="tr-inspector-dep"><span>← ${escHtml(from?.title || '?')}</span><button onclick="removeTrilhaEdge('${e.id}')" title="Remover seta">${ICON('x')}</button></div>`;
      }).join('') : '<div class="tr-inspector-empty">Nenhuma — pode começar em paralelo.</div>'}
      <div class="tr-insp-conn-h">Libera · ${outgoing.length}</div>
      ${outgoing.length ? outgoing.map((e) => {
        const to = trilhaNodeById(e.toNodeId);
        return `<div class="tr-inspector-dep"><span>→ ${escHtml(to?.title || '?')}</span><button onclick="removeTrilhaEdge('${e.id}')" title="Remover seta">${ICON('x')}</button></div>`;
      }).join('') : '<div class="tr-inspector-empty">Nenhum bloco depende deste.</div>'}
    </section>
    <div class="tr-inspector-actions">
      ${node.claimedBy
        ? `<button class="app-secondary-btn danger" onclick="releaseTrilhaNode()">Liberar</button>`
        : `<button class="app-primary-btn" onclick="claimTrilhaNode()">Assumir</button>`}
    </div>
    <div class="tr-inspector-hint">Duplo clique no bloco para editar</div>
    <div class="tr-inspector-actions sub">
      <button class="tr-insp-ghost" onclick="copyTrilhaNodePackage('${node.id}')">${ICON('copy')} Pacote p/ IA</button>
      <button class="tr-insp-ghost" onclick="copyTrilhaNodeId('${node.id}')">${ICON('copy')} ID</button>
      <button class="tr-insp-ghost danger" onclick="deleteSelectedTrilhaNode()">Excluir</button>
    </div>`;
  hydrateIcons(content);
};

const closeTrilhaInspector = () => {
  selectedTrilhaNodeId = null;
  selectedTrilhaStickyId = null;
  renderTrilhaMap();
  renderTrilhaInspector();
};

const toggleTrilhaActivity = () => {
  if (!currentTrilhaDetail) return;
  trilhaActivityOpen = !trilhaActivityOpen;
  if (trilhaActivityOpen) {
    selectedTrilhaNodeId = null;
    selectedTrilhaStickyId = null;
  }
  renderCurrentTrilha();
};

const loadTrilhaActivity = async () => {
  if (!currentTrilhaDetail || !trilhaActivityOpen) return;
  const list = $('trilha-activity-list');
  try {
    const res = await fetch(
      `/trilhas/${currentTrilhaDetail.trilha.id}/events?limit=50`,
    );
    if (!res.ok) throw new Error(await res.text());
    const events = await res.json();
    if (!trilhaActivityOpen) return;
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
    if (trilhaActivityOpen && list) {
      list.innerHTML = '<div class="tr-inspector-empty">Falha ao carregar.</div>';
    }
  }
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

const copyTrilhaId = () => {
  if (!currentTrilhaDetail) return;
  copyToClipboard(currentTrilhaDetail.trilha.id, 'ID da trilha copiado');
};

const copyTrilhaNodeId = (nodeId) => {
  copyToClipboard(nodeId || selectedTrilhaNodeId || '', 'ID do bloco copiado');
};

const copyTrilhaPrompt = () => {
  if (!currentTrilhaDetail) return;
  const { trilha } = currentTrilhaDetail;
  const prompt =
    `Você vai executar a TRILHA "${trilha.title}" (id: ${trilha.id}) do docmap. ` +
    `O app está rodando e a API local está em http://127.0.0.1:3334.\n` +
    `\nAprenda a operar trilhas: GET /headless/manual?feature=trilhas ` +
    `(endpoints, claim, loop de execução). Descubra o resto por lá.\n` +
    `\nOBJETIVO: ${trilha.objective}\n` +
    `\nComece lendo a trilha: GET /trilhas/${trilha.id}\n` +
    `\nConvenção: 'details' de cada bloco é o briefing (nunca sobrescreva); ` +
    `o relatório da entrega vai em 'result'; faça claim com seu nome antes de executar.\n` +
    `Rotina: claim → heartbeat a cada ~2min (POST /trilhas/${trilha.id}/nodes/<id>/heartbeat) → doing → result → done → próximo via GET /trilhas/${trilha.id}/next?by=<seu-nome>.`;
  copyToClipboard(prompt, 'Prompt da trilha copiado');
};

const copyTrilhaNodePackage = async (nodeId) => {
  const { trilha } = currentTrilhaDetail;
  try {
    const res = await fetch(`/trilhas/${trilha.id}/nodes/${nodeId}`);
    if (!res.ok) throw new Error(await res.text());
    const node = await res.json();
    const nodeRef = `/trilhas/${trilha.id}/nodes/${node.id}`;
    const pkg = [
      `Você vai executar UM BLOCO da TRILHA "${trilha.title}" (trilha id: ${trilha.id}) do docmap.`,
      `O app está rodando e a API local está em http://127.0.0.1:3334.`,
      ``,
      `Aprenda a operar trilhas: GET /headless/manual?feature=trilhas. Descubra o resto por lá.`,
      ``,
      `BLOCO: ${node.title} (id: ${node.id})`,
      `Leia o bloco: GET ${nodeRef} — o briefing está em 'details'.`,
      ``,
      `Convenção: faça claim {"by": "<seu-nome>"} antes de executar; o relatório vai em 'result' (nunca sobrescreva 'details'); concluir (done) libera a trava.`,
      `Rotina: heartbeat a cada ~2min (POST ${nodeRef}/heartbeat); terminou? GET /trilhas/${trilha.id}/next?by=<seu-nome>.`,
    ].join('\n');
    copyToClipboard(pkg, 'Pacote do bloco copiado');
  } catch {
    toast('Falha ao copiar pacote');
  }
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

// ── Modal trilha ──

const openTrilhaModal = (id) => {
  const trilha = id
    ? allTrilhas.find((t) => t.id === id) || currentTrilhaDetail?.trilha
    : null;
  $('trilha-modal-edit-id').value = trilha?.id || '';
  $('trilha-modal-title').value = trilha?.title || '';
  $('trilha-modal-objective').value = trilha?.objective || '';
  $('trilha-modal-description').value = trilha?.description || '';
  $('trilha-modal-status').value = trilha?.status || 'draft';
  $('trilha-modal-tags').value = (trilha?.tags || []).join(', ');
  $('trilha-modal-title-label').textContent = trilha ? 'Editar trilha' : 'Nova trilha';
  $('trilha-modal-submit-label').textContent = trilha ? 'Salvar' : 'Criar trilha';
  $('trilha-modal-overlay').classList.add('visible');
  setTimeout(() => $('trilha-modal-title')?.focus(), 60);
};

const closeTrilhaModal = (e) => {
  if (e && e.target !== $('trilha-modal-overlay')) return;
  $('trilha-modal-overlay').classList.remove('visible');
};

const saveTrilhaFromModal = async (e) => {
  e.preventDefault();
  const id = $('trilha-modal-edit-id').value;
  const body = {
    title: $('trilha-modal-title').value.trim(),
    objective: $('trilha-modal-objective').value.trim(),
    description: $('trilha-modal-description').value,
    status: $('trilha-modal-status').value,
    tags: trilhaCsv($('trilha-modal-tags').value),
  };
  try {
    const res = await fetch(id ? `/trilhas/${id}` : '/trilhas', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const saved = await res.json();
    $('trilha-modal-overlay').classList.remove('visible');
    await loadTrilhas();
    await openTrilha(saved.id);
  } catch (err) {
    toast(err.message || 'Falha ao salvar trilha');
  }
};

const deleteCurrentTrilha = async () => {
  if (!currentTrilhaDetail) return;
  const { trilha } = currentTrilhaDetail;
  const ok = await confirmDialog(
    `Excluir a trilha "${trilha.title}" e todos os blocos?`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;
  const res = await fetch(`/trilhas/${trilha.id}`, { method: 'DELETE' });
  if (!res.ok) {
    toast('Falha ao excluir');
    return;
  }
  currentTrilhaDetail = null;
  selectedTrilhaNodeId = null;
  selectedTrilhaStickyId = null;
  renderCurrentTrilha();
  await loadTrilhas();
  toast('Trilha excluída');
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
