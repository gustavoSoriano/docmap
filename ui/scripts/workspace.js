// ════ Deep links — abre entidades direto pela URL ════

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
