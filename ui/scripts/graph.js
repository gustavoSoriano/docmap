// ════ Grafo de conhecimento (D3 force) ════
// Nós = entidades. Arestas: 'shared' (compartilham tag) e 'reference' (task→nota).
// Clique destaca vizinhos; duplo-clique abre a entidade; a legenda filtra por tipo.

let kgSim = null;
let kgZoom = null;
let kgG = null;
let kgLinkSel = null;
let kgNodeSel = null;
let kgLinks = [];
let kgRaw = null; // {nodes, links} cru do fetch (fonte pro filtro por tipo)
let kgTagQuery = '';
const kgHidden = new Set(); // tipos de nó ocultados pelo usuário

const KG_KINDS = ['note', 'task', 'macro', 'podcast', 'favorite', 'skill', 'mock', 'workflow', 'agentchat', 'tag'];
const KG_LABELS = {
  note: 'Notas', task: 'Tasks', macro: 'Macros',
  podcast: 'Podcasts', favorite: 'Favoritos', skill: 'Skills', mock: 'Mocks',
  workflow: 'Workflows', agentchat: 'Chats', tag: 'Tags',
};
const KG_COLOR = {};

const kgCss = (name) => {
  const host = $('mode-graph');
  return (host && getComputedStyle(host).getPropertyValue(name).trim()) || '#888';
};

const normalizeKgTagQuery = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const kgNodeTags = (node) => Array.isArray(node.tags) ? node.tags.map(String) : [];

const kgTagFromNode = (node) =>
  node.kind === 'tag' ? node.id.slice('tag:'.length) : '';

const kgMatchesTagQuery = (node, term) => {
  if (!term) return true;
  if (node.kind === 'tag') return kgTagFromNode(node).includes(term);
  return kgNodeTags(node).some((tag) => tag.toLowerCase().includes(term));
};

// Duplo-clique numa entidade → abre no modo dela.
const OPEN_BY_KIND = {
  note: (id) => openNote(id),
  macro: (id) => openMacro(id),
  podcast: (id) => openPodcast(id),
  skill: (id) => openSkill(id),
  task: (id) => { setMode('tasks'); openTaskModal(id); },
  mock: (id) => { setMode('mocks'); if (typeof openMockEditor === 'function') openMockEditor(id); },
  workflow: (id) => { setMode('workflows'); if (typeof openWorkflow === 'function') openWorkflow(id); },
  agentchat: (id) => { setMode('agentchats'); if (typeof openAgentChat === 'function') openAgentChat(id); },
  // Favorito é um link salvo → abre a URL no browser (registra acesso).
  favorite: async (id) => {
    try {
      const fav = await (await fetch('/favorites/' + id)).json();
      if (fav && fav.url) { openFavLink(fav.id, fav.url); return; }
    } catch { /* cai no fallback */ }
    setMode('favorites');
  },
};

const openGraphNode = (nodeId) => {
  const i = nodeId.indexOf(':');
  const kind = nodeId.slice(0, i);
  const uuid = nodeId.slice(i + 1);
  OPEN_BY_KIND[kind]?.(uuid);
};

const loadGraph = async () => {
  try {
    const res = await fetch('/graph');
    kgRaw = await res.json();
    updateKgTagOptions();
    drawKgGraph();
  } catch (err) {
    console.error('Erro ao carregar grafo:', err);
    toast('Erro ao carregar grafo');
  }
};

// Aplica o filtro por tipo e (re)desenha. Não refaz o fetch.
const drawKgGraph = () => {
  if (!kgRaw) return;
  const visibleNodes = kgRaw.nodes.filter((n) => !kgHidden.has(n.kind));
  const visibleById = new Map(visibleNodes.map((n) => [n.id, n]));
  const term = normalizeKgTagQuery(kgTagQuery);

  let nodes = visibleNodes;
  if (term) {
    const keepIds = new Set();
    const matchingTagIds = new Set();

    for (const node of visibleNodes) {
      if (!kgMatchesTagQuery(node, term)) continue;
      keepIds.add(node.id);
      if (node.kind === 'tag') {
        matchingTagIds.add(node.id);
      } else {
        for (const tag of kgNodeTags(node)) {
          if (!tag.toLowerCase().includes(term)) continue;
          const tagId = `tag:${tag}`;
          if (visibleById.has(tagId)) keepIds.add(tagId);
        }
      }
    }

    for (const link of kgRaw.links) {
      if (link.kind !== 'tagged') continue;
      const source = link.source.id || link.source;
      const target = link.target.id || link.target;
      if (!matchingTagIds.has(source) && !matchingTagIds.has(target)) continue;
      if (visibleById.has(source)) keepIds.add(source);
      if (visibleById.has(target)) keepIds.add(target);
    }

    nodes = visibleNodes.filter((n) => keepIds.has(n.id));
  }

  const keep = new Set(nodes.map((n) => n.id));
  const links = kgRaw.links.filter((l) =>
    keep.has(l.source.id || l.source) && keep.has(l.target.id || l.target));
  renderKnowledgeGraph({ nodes, links });
};

const toggleKgKind = (kind) => {
  if (kgHidden.has(kind)) kgHidden.delete(kind);
  else kgHidden.add(kind);
  drawKgGraph();
};

// Legenda = filtro. Cada item liga/desliga o tipo (classe .off quando oculto).
const buildKgLegend = () => {
  const el = $('kg-legend');
  if (!el) return;
  el.innerHTML = KG_KINDS.map((k) =>
    `<span class="kg-leg kg-leg-${k}${kgHidden.has(k) ? ' off' : ''}" onclick="toggleKgKind('${k}')" title="mostrar/ocultar ${KG_LABELS[k]}"><i></i>${KG_LABELS[k]}</span>`
  ).join('');
};

const updateKgTagOptions = () => {
  const el = $('kg-tag-options');
  if (!el || !kgRaw) return;
  const tags = new Set();
  for (const node of kgRaw.nodes) {
    if (node.kind === 'tag') tags.add(kgTagFromNode(node));
    for (const tag of kgNodeTags(node)) tags.add(tag);
  }
  el.innerHTML = [...tags].sort((a, b) => a.localeCompare(b))
    .map((tag) => `<option value="${escHtml(tag)}"></option>`)
    .join('');
};

const renderKnowledgeGraph = (data) => {
  KG_KINDS.forEach((k) => { KG_COLOR[k] = kgCss('--kg-' + k); });
  buildKgLegend();

  const countEl = $('kg-count');
  if (countEl) {
    countEl.textContent = `${data.nodes.length} entidades · ${data.links.length} conexões`;
  }

  const svg = d3.select('#kg-svg');
  svg.selectAll('*').remove();

  const host = $('kg-canvas');
  const W = host.offsetWidth || 800;
  const H = host.offsetHeight || 600;

  const empty = $('kg-empty');
  if (!data.nodes.length) {
    if (empty) empty.dataset.show = '1';
    const hint = empty?.querySelector('.kg-empty-hint');
    if (hint) {
      hint.textContent = kgTagQuery.trim()
        ? 'Nenhuma entidade encontrada com essa tag.'
        : 'Nenhuma entidade ainda. Crie notas, tasks, macros... e adicione tags; elas viram os nós que conectam tudo por tema.';
    }
    return;
  }
  if (empty) empty.dataset.show = '0';

  kgG = svg.append('g');
  kgZoom = d3.zoom().scaleExtent([0.1, 5]).on('zoom', (e) => kgG.attr('transform', e.transform));
  svg.call(kgZoom);
  svg.on('dblclick.zoom', null);
  svg.on('click', clearKgSelection);

  kgLinks = data.links.map((l) => ({ ...l }));

  kgSim = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(kgLinks).id((d) => d.id)
      .distance((l) => (l.kind === 'reference' ? 66 : 92)).strength(0.5))
    .force('charge', d3.forceManyBody()
      .strength((d) => (d.kind === 'tag' ? -600 : -280)).distanceMax(620))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('x', d3.forceX(W / 2).strength(0.04))
    .force('y', d3.forceY(H / 2).strength(0.04))
    .force('collision', d3.forceCollide((d) => (d.kind === 'tag' ? 30 : 24)));

  kgLinkSel = kgG.append('g').selectAll('line')
    .data(kgLinks).join('line')
    .attr('class', (l) => 'kg-link kg-link-' + l.kind);

  kgNodeSel = kgG.append('g').selectAll('g')
    .data(data.nodes).join('g')
    .attr('class', (d) => 'kg-node kg-node-' + d.kind)
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) kgSim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) kgSim.alphaTarget(0); d.fx = null; d.fy = null; }))
    .on('click', (e, d) => { e.stopPropagation(); selectKgNode(d.id); })
    .on('dblclick', (e, d) => { e.stopPropagation(); if (d.kind !== 'tag') openGraphNode(d.id); })
    .on('mouseover', (e, d) => showKgTip(e, d))
    .on('mousemove', (e) => moveKgTip(e))
    .on('mouseout', hideKgTip);

  kgNodeSel.append('circle').attr('class', 'kg-halo')
    .attr('r', (d) => (d.kind === 'tag' ? 9 : 12) + 6)
    .attr('fill', (d) => (KG_COLOR[d.kind] || '#888') + '22');
  kgNodeSel.append('circle').attr('class', 'kg-core')
    .attr('r', (d) => (d.kind === 'tag' ? 9 : 12))
    .attr('fill', (d) => KG_COLOR[d.kind] || '#888')
    .style('transform-origin', 'center')
    .style('transform-box', 'fill-box');
  kgNodeSel.append('text').attr('class', 'kg-label')
    .attr('dy', (d) => (d.kind === 'tag' ? 9 : 12) + 15)
    .attr('text-anchor', 'middle')
    .text((d) => (d.label.length > 26 ? d.label.slice(0, 25) + '…' : d.label));

  let kgTicks = 0;
  let kgFitted = false;
  kgSim.on('tick', () => {
    kgLinkSel
      .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
    kgNodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
    if (!kgFitted && ++kgTicks >= 50) { kgFitted = true; fitKg(); }
  });
};

// ── Seleção + destaque de vizinhos (grafo-local) ──
const selectKgNode = (id) => {
  const neighbors = new Set([id]);
  kgLinks.forEach((l) => {
    const s = l.source.id || l.source;
    const t = l.target.id || l.target;
    if (s === id) neighbors.add(t);
    if (t === id) neighbors.add(s);
  });
  kgNodeSel?.classed('kg-selected', (d) => d.id === id)
    .classed('kg-dim', (d) => !neighbors.has(d.id));
  kgLinkSel?.classed('kg-hi', (l) => (l.source.id || l.source) === id || (l.target.id || l.target) === id)
    .classed('kg-dim', (l) => (l.source.id || l.source) !== id && (l.target.id || l.target) !== id);
};

const clearKgSelection = () => {
  kgNodeSel?.classed('kg-selected', false).classed('kg-dim', false);
  kgLinkSel?.classed('kg-hi', false).classed('kg-dim', false);
};

// Busca da topbar no modo grafo → destaca nós cujo label casa com o termo.
const filterGraph = (q) => {
  const term = (q || '').trim().toLowerCase();
  if (!kgNodeSel) return;
  if (!term) { clearKgSelection(); return; }
  const match = new Set();
  kgNodeSel.each((d) => { if (d.label.toLowerCase().includes(term)) match.add(d.id); });
  kgNodeSel.classed('kg-selected', (d) => match.has(d.id))
    .classed('kg-dim', (d) => !match.has(d.id));
  kgLinkSel.classed('kg-hi', false)
    .classed('kg-dim', (l) =>
      !(match.has(l.source.id || l.source) && match.has(l.target.id || l.target)));
};

const setKgTagQuery = (value) => {
  kgTagQuery = value || '';
  $('kg-tag-search-clear')?.classList.toggle('visible', !!kgTagQuery.trim());
  drawKgGraph();
};

const fitKg = () => {
  if (!kgG || !kgZoom) return;
  const host = $('kg-canvas');
  const b = kgG.node().getBBox();
  if (!b.width || !b.height) return;
  const W = host.offsetWidth, H = host.offsetHeight;
  const scale = Math.min(W / b.width, H / b.height) * 0.82;
  const tx = (W - b.width * scale) / 2 - b.x * scale;
  const ty = (H - b.height * scale) / 2 - b.y * scale;
  d3.select('#kg-svg').transition().duration(450)
    .call(kgZoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
};

// ── Tooltip ──
const showKgTip = (e, d) => {
  const deg = kgLinks.filter((l) =>
    (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id).length;
  const kindLbl = d.kind === 'tag' ? 'tag' : (KG_LABELS[d.kind]?.replace(/s$/, '') || d.kind);
  const hint = d.kind === 'tag' ? ' · clique isola o grupo' : ' · duplo-clique abre';
  const el = $('tooltip');
  el.innerHTML = `${escHtml(d.label)} · <span style="opacity:.6">${kindLbl} · ${deg} conexões${hint}</span>`;
  el.style.opacity = '1';
  moveKgTip(e);
};
const moveKgTip = (e) => {
  const el = $('tooltip');
  el.style.left = (e.clientX + 14) + 'px';
  el.style.top = (e.clientY - 8) + 'px';
};
const hideKgTip = () => { $('tooltip').style.opacity = '0'; };

document.addEventListener('DOMContentLoaded', () => {
  const input = $('kg-tag-search');
  const clear = $('kg-tag-search-clear');
  input?.addEventListener('input', (e) => setKgTagQuery(e.target.value));
  clear?.addEventListener('click', () => {
    if (input) input.value = '';
    setKgTagQuery('');
    input?.focus();
  });
});
