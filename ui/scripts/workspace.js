// ════ Deep links — abre entidades direto pela URL ════

// Modo embed: /?embed=<tipo>:<id> mostra só o artefato, sem topbar nem listas.
// É o que a trilha carrega no modal — a mesma tela do app, sem cópia.
const EMBED_OPEN = {
  note: ['notes', (id) => openNote(id)],
  skill: ['skills', (id) => openSkill(id)],
  macro: ['macros', (id) => openMacro(id)],
  podcast: ['podcasts', (id) => openPodcast(id)],
};

const handleEmbed = () => {
  const spec = new URLSearchParams(window.location.search).get('embed') || '';
  const m = spec.match(/^(note|skill|macro|podcast):([a-f0-9-]{36})$/);
  if (!m) return false;
  document.body.classList.add('embed', `embed-${m[1]}`);
  const [mode, open] = EMBED_OPEN[m[1]];
  setMode(mode);
  open(m[2]);
  return true;
};

const handleDeepLink = () => {
  if (handleEmbed()) return;
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
