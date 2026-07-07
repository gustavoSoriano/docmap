// ════ Workspace — seleção de pasta ════

let currentWorkspace = null;

const setNoWorkspace = (on) => {
  $('no-workspace').classList.toggle('visible', on);
  $('graph').style.opacity = on ? '0' : '1';
  $('topbar-path').textContent = on ? 'nenhuma pasta' : (currentWorkspace?.name + '/');
};

const applyWorkspace = (data) => {
  currentWorkspace = data;
  setNoWorkspace(false);
  loadGraph();
  if (currentMode === 'notes') loadNotesList();
};

const pickWorkspace = async () => {
  try {
    const res = await fetch('/workspace/pick', { method: 'POST' });
    const data = await res.json();
    if (data.cancelled) return;
    applyWorkspace(data);
    toast('Pasta carregada: ' + data.name);
  } catch (err) {
    console.error('Erro ao selecionar pasta:', err);
    toast('Erro ao abrir pasta');
  }
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

// ── Deep link: #diagram/:id ──
const handleDeepLink = () => {
  const hash = window.location.hash;
  const match = hash.match(/^#diagram\/([a-f0-9-]{36})$/);
  if (match) {
    setMode('diagrams');
    openDiagram(match[1]);
    history.replaceState(null, '', '/'); // limpa o hash depois de navegar
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initWorkspace();
  handleDeepLink();
});
