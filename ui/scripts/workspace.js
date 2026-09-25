// ════ Deep links — abre entidades direto pela URL ════

const handleDeepLink = () => {
  const hash = window.location.hash;
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
  const trilha = hash.match(/^#trilha\/([a-f0-9-]{36})$/);
  if (trilha) {
    setMode('trilhas');
    openTrilha(trilha[1]);
    history.replaceState(null, '', '/');
    return;
  }
  // Sem deep link → abre no grafo por padrão.
  setMode('graph');
};

document.addEventListener('DOMContentLoaded', handleDeepLink);
