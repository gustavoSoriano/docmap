// ════ App shell — alternância de modos e atalhos globais ════

let currentMode = 'graph';

const MODE_LABEL = { notes: 'Notas', macros: 'Macros', skills: 'Skills', tasks: 'Kanban', trilhas: 'Trilhas', agentchats: 'Chats', mocks: 'Mocks', favorites: 'Favoritos', podcasts: 'Podcasts', canvas: 'Canvas', debug: 'Debug', graph: 'Grafo' };

// ── Sidebar panel collapse (notes-col, macros-col, etc.) ──
// depends on: dom.js ($)
const PANEL_BY_MODE = {
  notes:     'notes-col',
  macros:    'macros-col',
  skills:    'skills-col',
  mocks:     'mocks-col',
  favorites: 'fav-sidebar',
  podcasts:  'pod-col',
  trilhas: 'trilha-sidebar',
  agentchats: 'ac-sidebar',
};

const toggleSidebar = () => {
  // No modo canvas não há sidebar (lousa única) — nada a alternar.
  if (currentMode === 'canvas') return;
  const panelId = PANEL_BY_MODE[currentMode];
  if (!panelId) return;
  const panel = $(panelId);
  if (!panel) return;
  const collapsed = panel.classList.toggle('col-collapsed');
  const btn = $('top-panel');
  btn?.classList.toggle('active', collapsed);
  btn?.setAttribute('data-tip', collapsed ? 'Mostrar painel' : 'Recolher painel');
};

const setMode = (mode) => {
  currentMode = mode;

  document.querySelectorAll('.mode').forEach((m) => m.classList.remove('active'));
  $('mode-' + mode)?.classList.add('active');

  document.querySelectorAll('.nav-btn, .top-btn').forEach((b) => b.classList.remove('active'));
  $('nav-' + mode)?.classList.add('active');
  // o botão de recolher painel só faz sentido em modos que têm coluna lateral
  const panelBtn = $('top-panel');
  if (panelBtn) panelBtn.toggleAttribute('disabled', !PANEL_BY_MODE[mode]);

  if (mode === 'macros')         loadMacrosList();
  else if (mode === 'notes')     loadNotesList();
  else if (mode === 'skills')    loadSkillsList();
  else if (mode === 'tasks')     { loadProjects(); loadTasks(); }
  else if (mode === 'trilhas') loadTrilhas();
  else if (mode === 'agentchats') loadAgentChatsList();
  else if (mode === 'mocks')     loadMocksData();
  else if (mode === 'favorites') loadFavoritesData();
  else if (mode === 'podcasts')  loadPodcastsList();
  else if (mode === 'canvas')    loadCanvas();
  else if (mode === 'debug')     loadDebug();
  else if (mode === 'graph')     loadGraph();
};

document.addEventListener('DOMContentLoaded', () => {
  // Em embed o grafo não carrega: só o artefato pedido.
  if (!new URLSearchParams(window.location.search).has('embed')) loadGraph();
});

// ── Settings modal ──
// depends on: theme.js (getStoredTheme, toggleTheme), system.js (copyHeadlessBootstrap, downloadBackup, triggerRestore)
const openSettings = () => {
  const label = $('settings-theme-label');
  if (label && typeof getStoredTheme === 'function') {
    label.textContent = getStoredTheme() === 'dark' ? 'Escuro' : 'Claro';
  }
  $('settings-overlay')?.classList.add('open');
};

const closeSettings = (e) => {
  if (e && e.target !== $('settings-overlay')) return;
  $('settings-overlay')?.classList.remove('open');
};

// ── Global keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Só fecha settings se o confirm dialog não estiver visível
    if (!$('modal-overlay')?.classList.contains('visible')) {
      $('settings-overlay')?.classList.remove('open');
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); setMode('notes'); }
  if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); setMode('macros'); }
});

// ── Canvas mode ──
// O canvas (lousa única) carrega via iframe apontando para /canvas.
const loadCanvas = () => {
  const iframe = document.getElementById('canvas-iframe');
  if (iframe && !iframe.getAttribute('src')) {
    iframe.setAttribute('src', '/canvas');
  }
};

// ── Debug mode ──
// O Debug Audit carrega via iframe apontando para /debug.
const loadDebug = () => {
  const iframe = document.getElementById('debug-iframe');
  if (iframe && iframe.getAttribute('src') !== '/debug') {
    iframe.setAttribute('src', '/debug');
  }
};

// ── Global external link handler ──
// Webview não suporta window.open — redireciona links http/https para o navegador padrão
document.addEventListener('click', (e) => {
  if (e.defaultPrevented) return;
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || !/^(https?:)?\/\//i.test(href)) return;
  e.preventDefault();
  openExternalUrl(href);
});
