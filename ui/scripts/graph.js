// ════ Force graph (D3) ════

let sim = null;
let zoomBehavior = null;
let graphG = null;
let graphLinkSel = null;
let graphNodeSel = null;
let graphLinks = [];

const NODE_COLOR = {
  entry:    getCss('--cat-entry'),
  arch:     getCss('--cat-arch'),
  design:   getCss('--cat-design'),
  security: getCss('--cat-security'),
  process:  getCss('--cat-process'),
  default:  getCss('--cat-default'),
};

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#999';
}

const loadGraph = async () => {
  try {
    const res  = await fetch('/graph');
    const data = await res.json();
    renderGraph(data);
  } catch (err) {
    console.error('Erro ao carregar grafo:', err);
    toast('Erro ao carregar grafo');
  }
};

const renderGraph = (data) => {
  const svg = d3.select('#graph');
  svg.selectAll('*').remove();

  const panel = $('graph-pane');
  const W = panel.offsetWidth;
  const H = panel.offsetHeight;

  graphG = svg.append('g');
  zoomBehavior = d3.zoom().scaleExtent([0.15, 5]).on('zoom', (e) => graphG.attr('transform', e.transform));
  svg.call(zoomBehavior);
  svg.on('dblclick.zoom', null); // libera o duplo-clique para abrir o nó

  // clone links so d3 mutation doesn't corrupt the source data
  graphLinks = data.links.map((l) => ({ ...l }));

  sim = d3.forceSimulation(data.nodes)
    .force('link',      d3.forceLink(graphLinks).id((d) => d.id).distance(130))
    .force('charge',    d3.forceManyBody().strength(-400))
    .force('center',    d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(46));

  graphLinkSel = graphG.append('g').attr('class', 'links')
    .selectAll('line')
    .data(graphLinks)
    .join('line')
    .attr('class', 'link');

  graphNodeSel = graphG.append('g').attr('class', 'nodes')
    .selectAll('g')
    .data(data.nodes)
    .join('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
    .on('click',     (e, d) => selectNode(d.id))
    .on('dblclick',  (e, d) => { e.stopPropagation(); selectNode(d.id); loadFile(d.id); })
    .on('mouseover', (e, d) => showNodeTooltip(e, d))
    .on('mousemove', (e)    => moveTooltip(e))
    .on('mouseout',  ()     => hideTooltip());

  // halo
  graphNodeSel.append('circle')
    .attr('r', (d) => (d.group === 'entry' ? 17 : 11) + 7)
    .attr('fill', (d) => (NODE_COLOR[d.group] || NODE_COLOR.default) + '22')
    .attr('stroke', 'none');

  // core
  graphNodeSel.append('circle')
    .attr('class', 'node-core')
    .attr('r', (d) => d.group === 'entry' ? 17 : 11)
    .attr('fill', (d) => NODE_COLOR[d.group] || NODE_COLOR.default)
    .attr('stroke', (d) => NODE_COLOR[d.group] || NODE_COLOR.default)
    .attr('stroke-opacity', .35)
    .style('transform-origin', 'center')
    .style('transform-box', 'fill-box');

  graphNodeSel.append('text')
    .attr('dy', (d) => (d.group === 'entry' ? 17 : 11) + 15)
    .attr('text-anchor', 'middle')
    .text((d) => d.label);

  sim.on('tick', () => {
    graphLinkSel
      .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
    graphNodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
  });

  sim.on('end', () => requestAnimationFrame(fitGraph));
};

// ── Selection + neighbor highlight ──
const selectNode = (id) => {
  const neighbors = new Set([id]);
  graphLinks.forEach((l) => {
    const s = l.source.id || l.source;
    const t = l.target.id || l.target;
    if (s === id) neighbors.add(t);
    if (t === id) neighbors.add(s);
  });

  graphNodeSel?.classed('selected', (d) => d.id === id)
    .classed('dimmed', (d) => !neighbors.has(d.id));

  graphLinkSel?.classed('highlighted', (l) =>
    (l.source.id || l.source) === id || (l.target.id || l.target) === id);
};

const fitGraph = () => {
  if (!graphG || !zoomBehavior) return;
  const panel = $('graph-pane');
  const bounds = graphG.node().getBBox();
  if (!bounds.width || !bounds.height) return;
  const W = panel.offsetWidth, H = panel.offsetHeight;
  const scale = Math.min(W / bounds.width, H / bounds.height) * 0.82;
  const tx = (W - bounds.width * scale) / 2 - bounds.x * scale;
  const ty = (H - bounds.height * scale) / 2 - bounds.y * scale;
  d3.select('#graph').transition().duration(450)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
};

// ── Tooltip ──
const showNodeTooltip = (e, d) => {
  const inc = graphLinks.filter((l) => (l.target.id || l.target) === d.id).length;
  const out = graphLinks.filter((l) => (l.source.id || l.source) === d.id).length;
  const el = $('tooltip');
  el.innerHTML = `${escHtml(d.label)} · ←${inc} →${out} · <span style="opacity:.6">duplo-clique p/ abrir</span>`;
  el.style.opacity = '1';
  moveTooltip(e);
};
const moveTooltip = (e) => {
  const el = $('tooltip');
  el.style.left = (e.clientX + 14) + 'px';
  el.style.top  = (e.clientY - 8)  + 'px';
};
const hideTooltip = () => { $('tooltip').style.opacity = '0'; };
