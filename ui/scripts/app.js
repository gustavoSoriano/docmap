// ════ App shell — alternância de modos e atalhos globais ════

let currentMode = 'map';

const MODE_LABEL = { map: 'Mapa', notes: 'Notas', macros: 'Macros', skills: 'Skills', diagrams: 'Diagramas', tasks: 'Kanban', mocks: 'Mocks', favorites: 'Favoritos' };

const setMode = (mode) => {
  currentMode = mode;

  document.querySelectorAll('.mode').forEach((m) => m.classList.remove('active'));
  $('mode-' + mode).classList.add('active');

  document.querySelectorAll('.rail-btn').forEach((b) => b.classList.remove('active'));
  $('rail-' + mode)?.classList.add('active');

  updateTopbarCrumb();

  // Search placeholder muda conforme o modo
  const search = $('search-input');
  if (mode === 'notes') {
    search.placeholder = 'Buscar notas…';
  } else {
    search.placeholder = 'Buscar nos documentos…';
  }

  if (mode === 'macros')        loadMacrosList();
  else if (mode === 'notes')    loadNotesList();
  else if (mode === 'skills')   loadSkillsList();
  else if (mode === 'diagrams') loadDiagramsList();
  else if (mode === 'tasks')    loadTasks();
  else if (mode === 'mocks')     loadMocksData();
  else if (mode === 'favorites') loadFavoritesData();
  else if (sim) requestAnimationFrame(fitGraph);
};

const updateTopbarCrumb = () => {
  const crumb = $('topbar-crumb');
  if (!crumb) return;

  // Se veio de uma visão Diátaxis, o crumb vira botão de retorno.
  if (window.diataxisReturnState && currentMode !== 'map') {
    crumb.classList.add('diataxis-return-crumb');
    crumb.innerHTML = `<button id="diataxis-return-crumb-btn">
      <span data-icon="arrow-left"></span>
      <span class="diataxis-return-label">${escHtml(window.diataxisReturnState.title)}</span>
    </button>`;
    hydrateIcons(crumb);
    const btn = crumb.querySelector('#diataxis-return-crumb-btn');
    if (btn && typeof returnToDiataxis === 'function') {
      btn.onclick = (e) => { e.preventDefault(); returnToDiataxis(); };
    }
    return;
  }

  // Restaura o crumb padrão (vazio — título de cada página fica na sidebar).
  crumb.classList.remove('diataxis-return-crumb');
  crumb.innerHTML = '';
};

// ── Tabs dentro do modo Mapa ──
let currentMapTab = 'graph';

const setMapTab = (tab) => {
  currentMapTab = tab;
  document.querySelectorAll('.map-pane').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.map-tab').forEach((t) => t.classList.remove('active'));

  const paneId = tab === 'graph' ? 'graph-pane'
    : tab === 'markmap' ? 'markmap-pane'
    : tab === 'diataxis' ? 'diataxis-pane'
    : null;
  const tabId = 'tab-' + tab;

  if (paneId && $(paneId)) $(paneId).classList.add('active');
  if ($(tabId)) $(tabId).classList.add('active');

  // O grafo precisa recentralizar quando sua aba fica visível (offsetWidth muda).
  if (tab === 'graph' && sim) requestAnimationFrame(fitGraph);

  // Diátaxis recarrega a visão ao tornar-se visível.
  if (tab === 'diataxis' && typeof loadDiataxis === 'function') loadDiataxis();
};

// ── Global keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $('annot-popover')?.classList.remove('visible');
    $('search-results')?.classList.remove('visible');
    $('search-input')?.blur();
  }
  if (e.ctrlKey && e.key === 'Enter' && $('annot-popover')?.classList.contains('visible')) {
    saveAnnotation();
  }
  // Alternar modos: Cmd/Ctrl + 1 / 2
  if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); setMode('map'); }
  if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); setMode('notes'); }
});
