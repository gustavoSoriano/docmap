// ════ Workspace — seleção de pasta ════

let currentWorkspace = null;

const setNoWorkspace = (on) => {
  $('no-workspace').classList.toggle('visible', on);
  $('graph').style.opacity = on ? '0' : '1';
  $('topbar-path').textContent = on ? 'nenhuma pasta' : (currentWorkspace?.name + '/');
  if (typeof updateTopbarCrumb === 'function') updateTopbarCrumb();
};

const applyWorkspace = (data) => {
  currentWorkspace = data;
  setNoWorkspace(false);
  loadGraph();
  if (currentMode === 'notes') loadNotesList();
};

const pickWorkspace = async () => {
  const before = currentWorkspace?.root ?? null;
  fetch('/workspace/pick', { method: 'POST' }).catch(() => {});

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch('/workspace');
      const data = await res.json();
      if (data.root && data.root !== before) {
        applyWorkspace(data);
        toast('Pasta carregada: ' + data.name);
        return;
      }
    } catch { /* servidor ocupado, tenta de novo */ }
  }
  // Timeout de 30s: usuário cancelou o diálogo.
};

const initWorkspace = async () => {
  try {
    const res = await fetch('/workspace');
    const data = await res.json();
    if (data.root) applyWorkspace(data);
    else setNoWorkspace(true);
  } catch {
    setNoWorkspace(true);
  }
};

// ── Deep link: #diagram/:id  |  #podcast/:id ──
const handleDeepLink = () => {
  const hash = window.location.hash;
  const diag = hash.match(/^#diagram\/([a-f0-9-]{36})$/);
  if (diag) {
    setMode('diagrams');
    openDiagram(diag[1]);
    history.replaceState(null, '', '/');
    return;
  }
  const pod = hash.match(/^#podcast\/([a-f0-9-]{36})$/);
  if (pod) {
    setMode('podcasts');
    openPodcast(pod[1]);
    history.replaceState(null, '', '/');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initWorkspace();
  handleDeepLink();
});
