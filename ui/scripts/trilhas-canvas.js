// ════ Trilhas — canvas: zoom, pan, arrasto de blocos e stickers ════

// Nível semântico: de longe o cartão vira só status + título (CSS por
// data-level); --z deixa rótulos de grupo legíveis em qualquer zoom.
const trilhaZoomLevel = () =>
  trilhaZoom < 0.55 ? 'far' : trilhaZoom < 0.85 ? 'mid' : 'near';

const trilhaApplyZoom = () => {
  const canvas = $('trilha-canvas');
  if (canvas) {
    canvas.style.zoom = String(trilhaZoom);
    canvas.style.setProperty('--z', String(trilhaZoom));
    canvas.dataset.level = trilhaZoomLevel();
  }
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
  const b = currentTrilhaDetail ? trilhaContentBounds() : null;
  if (!wrap || !b) {
    trilhaZoomTo(1);
    return;
  }
  const pad = 60;
  const contentW = (b.maxX - b.minX) + pad * 2;
  const contentH = (b.maxY - b.minY) + pad * 2;
  const availW = Math.max(200, wrap.clientWidth - 40);
  const availH = Math.max(200, wrap.clientHeight - 40);
  trilhaZoomTo(Math.min(1.25, availW / contentW, availH / contentH));
  const cx = (b.minX + b.maxX) / 2 * trilhaZoom;
  const cy = (b.minY + b.maxY) / 2 * trilhaZoom;
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
  $('trilha-groups').querySelectorAll('[data-group-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTrilhaGroup(btn.dataset.groupToggle);
    });
  });
  nodesEl.querySelectorAll('[data-run-macro]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      runTrilhaMacro(btn.dataset.runMacro, btn.closest('.tr-node')?.dataset.nodeId);
    });
  });
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
      redrawTrilhaGroups();
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
    bindTrilhaDrop(el, id);
  });
};

// Soltar um item do Arsenal sobre o bloco anexa a referência a ele.
const bindTrilhaDrop = (el, nodeId) => {
  const accepts = (e) => e.dataTransfer?.types?.includes(TR_DRAG_TYPE);
  el.addEventListener('dragover', (e) => {
    if (!accepts(e)) return;
    e.preventDefault();
    el.classList.add('drop-target');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
  el.addEventListener('drop', (e) => {
    el.classList.remove('drop-target');
    if (!accepts(e)) return;
    e.preventDefault();
    const [kind, targetId] = e.dataTransfer.getData(TR_DRAG_TYPE).split(':');
    attachTrilhaRef(kind, targetId, nodeId);
  });
};

const openTrilhaNode = (id) => {
  if (selectedTrilhaNodeId !== id) {
    selectedTrilhaNodeId = id;
    trilhaRailTab = 'node';
    renderTrilhaMap();
    renderTrilhaRail();
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
    path.setAttribute('d', trilhaEdgeD(trilhaRectOf(from), trilhaRectOf(to)));
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
  selectedTrilhaStickyId = null;
  trilhaRailTab = 'node';
  if (selectedTrilhaNodeId !== id) {
    selectedTrilhaNodeId = id;
    renderTrilhaMap();
  }
  renderTrilhaRail();
};

// ── Stickers: post-it solto (sem status, sem setas, fora do next) ──

const onTrilhaStickyClick = (id) => {
  selectedTrilhaNodeId = null;
  if (selectedTrilhaStickyId !== id) {
    selectedTrilhaStickyId = id;
    renderTrilhaMap();
  }
  renderTrilhaRail();
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
      renderTrilhaRail();
      openStickyModal(id);
    });
  });
};
