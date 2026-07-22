// ════ App shell — alternância de modos e atalhos globais ════

let currentMode = 'graph';

const MODE_LABEL = { notes: 'Notas', macros: 'Macros', skills: 'Skills', diagrams: 'Diagramas', tasks: 'Kanban', mocks: 'Mocks', favorites: 'Favoritos', podcasts: 'Podcasts', graph: 'Grafo' };

const setMode = (mode) => {
  currentMode = mode;

  document.querySelectorAll('.mode').forEach((m) => m.classList.remove('active'));
  $('mode-' + mode)?.classList.add('active');

  document.querySelectorAll('.rail-btn').forEach((b) => b.classList.remove('active'));
  $('rail-' + mode)?.classList.add('active');

  updateTopbarCrumb();

  const search = $('search-input');
  if (search) search.placeholder = mode === 'graph' ? 'Buscar no grafo…' : 'Buscar notas…';
  $('search-results')?.classList.remove('visible');

  if (mode === 'macros')         loadMacrosList();
  else if (mode === 'notes')     loadNotesList();
  else if (mode === 'skills')    loadSkillsList();
  else if (mode === 'diagrams')  loadDiagramsList();
  else if (mode === 'tasks')     loadTasks();
  else if (mode === 'mocks')     loadMocksData();
  else if (mode === 'favorites') loadFavoritesData();
  else if (mode === 'podcasts')  loadPodcastsList();
  else if (mode === 'graph')     loadGraph();
};

const updateTopbarCrumb = () => {
  const crumb = $('topbar-crumb');
  if (!crumb) return;
  crumb.innerHTML = '';
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
  if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); setMode('notes'); }
  if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); setMode('macros'); }
});
