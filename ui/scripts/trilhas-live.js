// ════ Trilhas — tempo real ════
// O agente mexe na trilha pela API; o servidor avisa por SSE ("mudou") e a UI
// refaz o GET (fonte única de estado). Um poll lento fica de rede de
// segurança, e também atualiza o que depende só do relógio (reserva sem sinal).
// Nunca redesenha durante arrasto, modal aberto, digitação ou requisição em voo.

const TR_FALLBACK_POLL_MS = 15000;
const TR_EDITING_FORMS = '#trilha-modal-form, #trilha-node-modal-form, #trilha-sticky-modal-form, #trilha-rail-body, #trilha-arsenal';

let trilhaStream = null;
let trilhaFallbackTimer = null;
let trilhaQueueTimer = null;

const trilhaSignature = (detail) => JSON.stringify({
  t: detail.trilha,
  n: detail.nodes.map((n) => [
    n.id, n.status, n.title, n.details || '', n.result || '', n.group || '',
    n.claimedBy || '', trilhaStaleText(n) ? 1 : 0, n.position.x, n.position.y,
    n.blockedReason || '', n.assignee, (n.doneCriteria || []).map((c) => c.done ? 1 : 0).join(''),
  ]),
  e: detail.edges.map((e) => e.id),
  s: detail.stickies.map((s) => [s.id, s.text, s.color, s.position.x, s.position.y, s.updatedAt]),
  r: detail.refs.map((r) => [r.id, r.title, r.role, r.missing || false]),
  g: detail.signals.map((s) => [s.id, s.status, s.text]),
});

const trilhaModalOpen = () => !!document.querySelector(
  '#trilha-modal-overlay.visible, #trilha-node-modal-overlay.visible, #trilha-sticky-modal-overlay.visible, #trilha-embed-modal-overlay.visible, #trilha-macro-modal-overlay.visible, #modal-overlay.visible, #fav-modal-overlay.visible',
);

const trilhaTypingNow = () => {
  const el = document.activeElement;
  return !!el?.closest?.(TR_EDITING_FORMS) && el.matches('input, textarea, select');
};

// Devolve true se atualizou (ou não havia nada novo); false se adiou.
const pollTrilhaOnce = async () => {
  if (!currentTrilhaDetail || currentMode !== 'trilhas') return true;
  if (trBusy || trDragging || trilhaModalOpen() || trilhaTypingNow()) return false;
  trBusy = true;
  try {
    const id = currentTrilhaDetail.trilha.id;
    const fresh = await fetchTrilhaDetail(id);
    if (currentTrilhaDetail?.trilha.id === id &&
      trilhaSignature(fresh) !== trilhaSignature(currentTrilhaDetail)) {
      currentTrilhaDetail = fresh;
      if (!trilhaNodeById(selectedTrilhaNodeId)) selectedTrilhaNodeId = null;
      if (!trilhaStickyById(selectedTrilhaStickyId)) selectedTrilhaStickyId = null;
      renderTrilhasList();
      renderCurrentTrilha();
    }
  } catch (err) {
    console.error('Erro no auto-refresh da trilha:', err);
  } finally {
    trBusy = false;
  }
  return true;
};

// Rajadas de eventos viram uma única atualização; se estiver ocupado, tenta de novo.
const queueTrilhaRefresh = () => {
  clearTimeout(trilhaQueueTimer);
  trilhaQueueTimer = setTimeout(async () => {
    if (!(await pollTrilhaOnce())) queueTrilhaRefresh();
  }, 300);
};

const connectTrilhaLive = (id) => {
  disconnectTrilhaLive();
  if (!window.EventSource) return;
  trilhaStream = new EventSource(`/trilhas/${id}/stream`);
  trilhaStream.addEventListener('change', queueTrilhaRefresh);
};

const disconnectTrilhaLive = () => {
  trilhaStream?.close();
  trilhaStream = null;
};

const startTrilhaLive = () => {
  if (trilhaFallbackTimer) return;
  trilhaFallbackTimer = setInterval(pollTrilhaOnce, TR_FALLBACK_POLL_MS);
  window.addEventListener('focus', queueTrilhaRefresh);
};
