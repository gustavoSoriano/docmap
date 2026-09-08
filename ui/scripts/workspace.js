// ════ Deep links — abre entidades direto pela URL ════

// Abre um desenho salvo no modo canvas (iframe carrega com ?open=<id>).
const openDrawing = (id) => {
  setMode('canvas');
  const iframe = document.getElementById('canvas-iframe');
  if (iframe) {
    iframe.setAttribute('src', '/canvas?open=' + encodeURIComponent(id));
  }
};

const handleDeepLink = () => {
  const hash = window.location.hash;
  const drawing = hash.match(/^#drawing\/([a-f0-9-]{36})$/);
  if (drawing) {
    openDrawing(drawing[1]);
    history.replaceState(null, '', '/');
    return;
  }
  const pod = hash.match(/^#podcast\/([a-f0-9-]{36})$/);
  if (pod) {
    setMode('podcasts');
    openPodcast(pod[1]);
    history.replaceState(null, '', '/');
    return;
  }
  const task = hash.match(/^#task\/([a-f0-9-]{36})$/);
  if (task) {
    setMode('tasks');
    history.replaceState(null, '', '/');
    return;
  }
  const workflow = hash.match(/^#workflow\/([a-f0-9-]{36})$/);
  if (workflow) {
    setMode('workflows');
    openWorkflow(workflow[1]);
    history.replaceState(null, '', '/');
    return;
  }
  // Sem deep link → abre no grafo por padrão.
  setMode('graph');
};

document.addEventListener('DOMContentLoaded', handleDeepLink);
