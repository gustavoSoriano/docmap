// ════ Markmap — renderiza o documento selecionado ════

let currentFile = null;
let currentSelectionQuote = null;
let selectionBtnTimer = null;

const loadFile = async (fileId) => {
  currentFile = fileId;

  const label = fileId.split('/').pop().replace('.md', '');
  $('markmap-filename').textContent = label;
  $('markmap-filepath').textContent = fileId;
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
    bindSelectionButton();
    showMarkmapHint();
    window._markmap?.fit?.();
  }, 300);
};

// Mostra/esconde o botão flutuante "Comentar" logo abaixo da seleção.
const updateCommentButton = () => {
  const btn = $('markmap-comment-btn');
  const sel = window.getSelection();
  const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
  if (!range || range.collapsed) {
    hideCommentButton();
    return;
  }

  const container = $('markmap-container');
  const text = sel.toString().trim();
  if (!text || !container.contains(range.commonAncestorContainer)) {
    hideCommentButton();
    return;
  }

  currentSelectionQuote = text;
  const rect = range.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Só mostra se a seleção estiver visível dentro do container.
  if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
    hideCommentButton();
    return;
  }

  const x = rect.left + rect.width / 2;
  const y = rect.bottom + 8;

  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;
  btn.classList.add('visible');
  btn.style.display = 'block';
};

const hideCommentButton = () => {
  currentSelectionQuote = null;
  const btn = $('markmap-comment-btn');
  btn.classList.remove('visible');
  btn.style.display = 'none';
};

const onCommentButtonClick = () => {
  const btn = $('markmap-comment-btn');
  const quote = currentSelectionQuote;
  if (!quote) return;
  const rect = btn.getBoundingClientRect();
  hideCommentButton();
  openAnnotPopover(quote, rect.left + rect.width / 2, rect.bottom + 6);
};

// Bind uma única vez no container; a seleção de texto é lida no momento do clique.
let selectionBound = false;
const bindSelectionButton = () => {
  if (selectionBound) return;
  selectionBound = true;

  const container = $('markmap-container');

  // selectionchange pode disparar muito durante a seleção; debounce leve.
  document.addEventListener('selectionchange', () => {
    clearTimeout(selectionBtnTimer);
    selectionBtnTimer = setTimeout(updateCommentButton, 80);
  });

  // Esconde ao clicar fora do botão (cliques no SVG não devem manter o botão antigo).
  document.addEventListener('mousedown', (e) => {
    const btn = $('markmap-comment-btn');
    if (!btn.classList.contains('visible')) return;
    if (e.target === btn || btn.contains(e.target)) return;
    hideCommentButton();
  });

  // Esconde ao interagir com o markmap (zoom/pan/scroll).
  container.addEventListener('scroll', hideCommentButton);

  $('markmap-comment-btn').addEventListener('click', onCommentButtonClick);
};

let hintTimer = null;
const showMarkmapHint = (msg) => {
  const hint = $('markmap-hint');
  hint.textContent = msg || 'Selecione um trecho do mapa para comentar';
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
