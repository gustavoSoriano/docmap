// ════ Markmap — renderiza o documento selecionado ════

let currentFile = null;
let contextMenuBound = false;

const loadFile = async (fileId) => {
  currentFile = fileId;

  const label = fileId.split('/').pop().replace('.md', '');
  $('markmap-filename').textContent = label;
  $('markmap-filepath').textContent = fileId;
  $('tab-doc-name').textContent = '· ' + label;
  $('btn-copy-path').style.display = 'flex';
  $('btn-annot').style.display = 'flex';
  $('markmap-tools').classList.add('visible');
  $('map-empty')?.remove();

  // Abre a aba do mapa mental automaticamente
  setMapTab('markmap');

  try {
    const res  = await fetch('/content?file=' + encodeURIComponent(fileId));
    const data = await res.json();
    renderMarkmap(data.raw);
    loadAnnotations(fileId);
  } catch (err) {
    console.error('Erro ao carregar arquivo:', err);
    toast('Erro ao carregar documento');
  }
};

const renderMarkmap = (markdown, tries = 0) => {
  const mk = window.markmap;
  // Espera markmap-view (Markmap) e markmap-lib (Transformer) carregarem.
  if (!mk?.Markmap || !mk?.Transformer) {
    if (tries < 40) return void setTimeout(() => renderMarkmap(markdown, tries + 1), 150);
    return toast('markmap não carregou (sem internet?)');
  }

  const container = $('markmap-container');
  container.querySelectorAll('svg.markmap-svg').forEach((el) => el.remove());

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('markmap-svg');
  svg.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(svg);

  const { root } = new mk.Transformer().transform(markdown);
  if (window._markmap) { try { window._markmap.destroy(); } catch { /* noop */ } }
  // autoFit: false — evita zoom automático ao colapsar/expandir nós
  window._markmap = mk.Markmap.create(svg, { autoFit: false }, root);

  setTimeout(() => {
    bindContextMenu();
    showMarkmapHint();
    window._markmap?.fit?.();
  }, 300);
};

// Bind uma única vez no container; a seleção de texto é lida no momento do clique.
const bindContextMenu = () => {
  if (contextMenuBound) return;
  contextMenuBound = true;
  $('markmap-container').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const sel = window.getSelection()?.toString().trim();
    if (!sel) { showMarkmapHint('Selecione um trecho do mapa primeiro'); return; }
    openAnnotPopover(sel, e.clientX, e.clientY);
  });
};

let hintTimer = null;
const showMarkmapHint = (msg) => {
  const hint = $('markmap-hint');
  hint.textContent = msg || 'Selecione um trecho e clique com o botão direito para anotar';
  hint.classList.add('visible');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.classList.remove('visible'), 3000);
};

// ── Controles de zoom / foco do markmap ──
// Usa a API do markmap-view; cai no d3-zoom da instância se rescale faltar.
const markmapZoom = (factor) => {
  const mm = window._markmap;
  if (!mm) return;
  if (typeof mm.rescale === 'function') mm.rescale(factor);
  else if (mm.svg && mm.zoom) mm.svg.transition().duration(200).call(mm.zoom.scaleBy, factor);
};

const markmapFit = () => { window._markmap?.fit?.(); };

// Copia o caminho ABSOLUTO no disco (a IA usa isso para abrir o arquivo).
const copyFilePath = () => {
  const root = currentWorkspace?.root;
  const abs = root ? `${root}/${currentFile}` : currentFile;
  copyToClipboard(abs, 'Caminho absoluto copiado');
};
