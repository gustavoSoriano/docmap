// ════ Trilhas — harness compartilhado entre você e os agentes ════
// Núcleo: estado, lista, abertura e modal da trilha. O resto vive em módulos
// próprios: trilhas-head (cabeçalho e saúde), trilhas-map (mapa), trilhas-rail
// (atenção, atividade, bloco), trilhas-arsenal (acervo), trilhas-embed
// (artefatos em modal) e trilhas-live (tempo real). Sem libs, sem bundler.

const TR_STATUS_LABEL = {
  draft: 'Rascunho',
  running: 'Em execução',
  done: 'Concluída',
  cancelled: 'Cancelada',
};

const TR_NODE_STATUS_LABEL = {
  todo: 'A fazer',
  doing: 'Fazendo',
  done: 'Pronto',
  blocked: 'Bloqueado',
};

// Classe `.status` (components.css) por estado: só apresentação.
const TR_STATUS_CLS = { draft: '', running: 'info', done: 'ok', cancelled: 'warn' };
const TR_NODE_STATUS_CLS = { todo: '', doing: 'info', done: 'ok', blocked: 'danger' };

const TR_NODE_W = 232; // casa com LAYOUT.nodeW do servidor (src/trilhas/layout.ts)

let allTrilhas = [];
let currentTrilhaDetail = null;
let selectedTrilhaNodeId = null;
let selectedTrilhaStickyId = null;
let trilhaNodeHeights = new Map();
let trilhaMe = null;
let trBusy = false;
let trDragging = false;

// ── Zoom + pan do canvas ──
// O canvas usa CSS `zoom` (layout escala junto, scroll continua certo).
// O arrasto dos nós divide o delta pelo zoom para manter 1:1 com o cursor.
let trilhaZoom = 1;
const TRILHA_ZOOM_MIN = 0.3;
const TRILHA_ZOOM_MAX = 1.75;
const TRILHA_ZOOM_STEP = 0.15;
let trilhaPanBound = false;

const trilhaBody = (body) => trilhaMe ? { ...body, by: trilhaMe } : body;

const trilhaStaleText = (node) => {
  const beat = node.lastHeartbeatAt || node.claimedAt;
  if (!node.claimedBy || !beat) return '';
  const mins = Math.floor((Date.now() - new Date(beat).getTime()) / 60000);
  if (mins < 5) return '';
  return mins < 60 ? `há ${mins}min` : `há ${Math.floor(mins / 60)}h`;
};

const trilhaTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// "há 3min", "há 2h", "há 4d" — para a fila de atenção.
const trilhaAgo = (iso) => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (Number.isNaN(mins)) return '';
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  if (mins < 1440) return `há ${Math.floor(mins / 60)}h`;
  return `há ${Math.floor(mins / 1440)}d`;
};

const trilhaCsv = (value) =>
  String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

const renderTrilhaTags = (tags) =>
  (tags || []).map((t) => `<span class="chip">${escHtml(t)}</span>`).join('');

const trilhaNodeById = (id) =>
  currentTrilhaDetail?.nodes.find((n) => n.id === id);

const trilhaStickyById = (id) =>
  currentTrilhaDetail?.stickies?.find((s) => s.id === id);

const trilhaIncoming = (nodeId) =>
  (currentTrilhaDetail?.edges || []).filter((e) => e.toNodeId === nodeId);

const trilhaOutgoing = (nodeId) =>
  (currentTrilhaDetail?.edges || []).filter((e) => e.fromNodeId === nodeId);

const trilhaNodeRefs = (nodeId) =>
  (currentTrilhaDetail?.refs || []).filter((r) => r.nodeId === nodeId);

const trilhaNodeSignals = (nodeId) =>
  (currentTrilhaDetail?.signals || [])
    .filter((s) => s.nodeId === nodeId && s.status === 'open');

// Servidor antigo (ou resposta parcial): garante todas as listas.
const normalizeTrilhaDetail = (detail) => ({
  ...detail,
  stickies: Array.isArray(detail.stickies) ? detail.stickies : [],
  refs: Array.isArray(detail.refs) ? detail.refs : [],
  signals: Array.isArray(detail.signals) ? detail.signals : [],
  attention: Array.isArray(detail.attention) ? detail.attention : [],
  health: detail.health || null,
});

const fetchTrilhaDetail = async (id) => {
  const res = await fetch(`/trilhas/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return normalizeTrilhaDetail(await res.json());
};

// ── Lista ──

const loadTrilhas = async () => {
  startTrilhaLive();
  try {
    const res = await fetch('/trilhas');
    if (!res.ok) throw new Error(await res.text());
    allTrilhas = await res.json();
    renderTrilhasList();
  } catch (err) {
    console.error('Erro ao carregar trilhas:', err);
    toast('Falha ao carregar trilhas');
  }
};

let trilhaFilter = 'all';

const setTrilhaFilter = (f) => {
  trilhaFilter = f || 'all';
  document.querySelectorAll('.tr-filter-chip').forEach((chip) => {
    chip.classList.toggle('on', chip.dataset.trilhaFilter === trilhaFilter);
  });
  renderTrilhasList();
};

const renderTrilhasList = () => {
  const list = $('trilha-list');
  if (!list) return;
  const q = ($('trilha-search')?.value || '').trim().toLowerCase();
  const items = allTrilhas.filter((t) => {
    if (trilhaFilter !== 'all' && t.status !== trilhaFilter) return false;
    return !q || t.title.toLowerCase().includes(q) ||
      (t.objective || '').toLowerCase().includes(q) ||
      (t.tags || []).join(' ').toLowerCase().includes(q);
  });
  const total = allTrilhas.length;
  $('trilha-sidebar-count').textContent =
    trilhaFilter === 'all' || items.length === total
      ? `${total} ${total === 1 ? 'trilha' : 'trilhas'}`
      : `${items.length} de ${total}`;
  if (!items.length) {
    list.innerHTML = q || trilhaFilter !== 'all'
      ? '<div class="trilha-sidebar-empty">Nada por aqui.<br>Tente outro filtro ou outra busca.</div>'
      : '<div class="trilha-sidebar-empty">Nenhuma trilha ainda.<br>Crie a primeira para começar.</div>';
    return;
  }
  list.innerHTML = items.map((t) => {
    const active = currentTrilhaDetail?.trilha.id === t.id;
    const blocks = t.nodeCount || 0;
    return `<button class="trilha-list-item${active ? ' active' : ''}" data-trilha-id="${t.id}">
      <span class="trilha-list-title">${escHtml(t.title)}</span>
      ${t.objective ? `<span class="trilha-list-objective">${escHtml(t.objective)}</span>` : ''}
      <span class="trilha-list-meta">
        <span class="status ${TR_STATUS_CLS[t.status] || ''}">${escHtml(TR_STATUS_LABEL[t.status] || t.status)}</span>
        <span class="chip trilha-list-count">${blocks} ${blocks === 1 ? 'bloco' : 'blocos'}</span>
      </span>
    </button>`;
  }).join('');
  list.querySelectorAll('.trilha-list-item').forEach((item) => {
    item.addEventListener('click', () => openTrilha(item.dataset.trilhaId));
  });
};

// ── Abertura ──

const openTrilha = async (id) => {
  if (currentMode !== 'trilhas') setMode('trilhas');
  trBusy = true;
  try {
    currentTrilhaDetail = await fetchTrilhaDetail(id);
    selectedTrilhaNodeId = null;
    selectedTrilhaStickyId = null;
    trilhaMe = null;
    resetTrilhaViewState();
    renderTrilhasList();
    renderCurrentTrilha();
    // Abre enquadrado: a trilha inteira à vista, qualquer que seja o tamanho.
    trilhaZoom = 1;
    requestAnimationFrame(trilhaZoomFit);
    connectTrilhaLive(id);
  } catch (err) {
    console.error('Erro ao abrir trilha:', err);
    toast('Falha ao abrir trilha');
  } finally {
    trBusy = false;
  }
};

const refreshCurrentTrilha = async () => {
  if (!currentTrilhaDetail) return;
  trBusy = true;
  try {
    currentTrilhaDetail = await fetchTrilhaDetail(currentTrilhaDetail.trilha.id);
    if (!trilhaNodeById(selectedTrilhaNodeId)) selectedTrilhaNodeId = null;
    if (!trilhaStickyById(selectedTrilhaStickyId)) selectedTrilhaStickyId = null;
    renderCurrentTrilha();
    await loadTrilhas();
  } catch (err) {
    console.error('Erro ao atualizar trilha:', err);
  } finally {
    trBusy = false;
  }
};

const renderCurrentTrilha = () => {
  if (!currentTrilhaDetail) {
    $('trilha-empty').style.display = '';
    $('trilha-active').style.display = 'none';
    disconnectTrilhaLive();
    return;
  }
  $('trilha-empty').style.display = 'none';
  $('trilha-active').style.display = '';
  renderTrilhaHead();
  renderTrilhaMap();
  renderTrilhaRail();
  renderTrilhaOnboard();
  syncTrilhaArsenal();
  hydrateIcons($('mode-trilhas'));
};

// ── Copiar para a IA: curto, o resto o servidor monta em /context ──

const copyTrilhaId = () => {
  if (!currentTrilhaDetail) return;
  copyToClipboard(currentTrilhaDetail.trilha.id, 'ID da trilha copiado');
};

const copyTrilhaNodeId = (nodeId) => {
  copyToClipboard(nodeId || selectedTrilhaNodeId || '', 'ID do bloco copiado');
};

const TRILHA_API = 'http://127.0.0.1:3334';

const copyTrilhaPrompt = () => {
  if (!currentTrilhaDetail) return;
  const { trilha } = currentTrilhaDetail;
  const base = `${TRILHA_API}/trilhas/${trilha.id}`;
  copyToClipboard([
    `Você vai trabalhar na TRILHA "${trilha.title}" do docmap (API local ${TRILHA_API}).`,
    `Objetivo: ${trilha.objective}`,
    ``,
    `1. Leia o contexto (guardrails, estado, como operar): GET ${base}/context`,
    `2. Pegue o próximo bloco: GET ${base}/next?by=<seu-nome>  (já reserva)`,
    `3. Contexto do bloco: GET ${base}/context?node=<id>`,
    `4. Heartbeat a cada ~2min; entregue em 'result' e marque done.`,
    `5. Travou ou precisa de decisão? POST ${base}/signals {"kind":"blocker|warning|question|pending","text":"…","nodeId":"<id>","by":"<seu-nome>"}`,
    ``,
    `Manual completo: GET ${TRILHA_API}/headless/manual?feature=trilhas`,
  ].join('\n'), 'Prompt da trilha copiado');
};

const copyTrilhaNodePackage = (nodeId) => {
  const { trilha } = currentTrilhaDetail;
  const node = trilhaNodeById(nodeId);
  const base = `${TRILHA_API}/trilhas/${trilha.id}`;
  copyToClipboard([
    `Execute UM BLOCO da TRILHA "${trilha.title}" do docmap (API local ${TRILHA_API}).`,
    `Bloco: ${node?.title || nodeId} (id: ${nodeId})`,
    ``,
    `Leia tudo em: GET ${base}/context?node=${nodeId}`,
    `(guardrails obrigatórios, briefing, critérios, resultado das dependências, referências e como operar).`,
    `Faça claim com seu nome, heartbeat a cada ~2min, relate em 'result' e conclua. Travou? POST ${base}/signals.`,
  ].join('\n'), 'Pacote do bloco copiado');
};

// ── Modal trilha ──

const openTrilhaModal = (id) => {
  const trilha = id
    ? allTrilhas.find((t) => t.id === id) || currentTrilhaDetail?.trilha
    : null;
  $('trilha-modal-edit-id').value = trilha?.id || '';
  $('trilha-modal-title').value = trilha?.title || '';
  $('trilha-modal-objective').value = trilha?.objective || '';
  $('trilha-modal-description').value = trilha?.description || '';
  $('trilha-modal-status').value = trilha?.status || 'draft';
  $('trilha-modal-tags').value = (trilha?.tags || []).join(', ');
  renderTrilhaTagSuggest();
  $('trilha-modal-title-label').textContent = trilha ? 'Editar trilha' : 'Nova trilha';
  $('trilha-modal-submit-label').textContent = trilha ? 'Salvar' : 'Criar trilha';
  $('trilha-modal-overlay').classList.add('visible');
  setTimeout(() => $('trilha-modal-title')?.focus(), 60);
};

// Tags já usadas em outras trilhas: um clique adiciona (mantém o vocabulário).
const renderTrilhaTagSuggest = () => {
  const used = new Set(trilhaCsv($('trilha-modal-tags').value));
  const counts = new Map();
  allTrilhas.forEach((t) => (t.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  const top = [...counts].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
    .filter((tag) => !used.has(tag)).slice(0, 8);
  $('trilha-tag-suggest').innerHTML = top.map((tag) =>
    `<button type="button" class="chip tr-tag-pick" onclick="addTrilhaModalTag('${escHtml(tag)}')">${escHtml(tag)}</button>`
  ).join('');
};

const addTrilhaModalTag = (tag) => {
  const input = $('trilha-modal-tags');
  input.value = [...trilhaCsv(input.value), tag].join(', ');
  renderTrilhaTagSuggest();
};

const closeTrilhaModal = (e) => {
  if (e && e.target !== $('trilha-modal-overlay')) return;
  $('trilha-modal-overlay').classList.remove('visible');
};

const saveTrilhaFromModal = async (e) => {
  e.preventDefault();
  const id = $('trilha-modal-edit-id').value;
  const body = {
    title: $('trilha-modal-title').value.trim(),
    objective: $('trilha-modal-objective').value.trim(),
    description: $('trilha-modal-description').value,
    status: $('trilha-modal-status').value,
    tags: trilhaCsv($('trilha-modal-tags').value),
  };
  try {
    const res = await fetch(id ? `/trilhas/${id}` : '/trilhas', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const saved = await res.json();
    $('trilha-modal-overlay').classList.remove('visible');
    await loadTrilhas();
    await openTrilha(saved.id);
  } catch (err) {
    toast(err.message || 'Falha ao salvar trilha');
  }
};

const deleteCurrentTrilha = async () => {
  if (!currentTrilhaDetail) return;
  const { trilha } = currentTrilhaDetail;
  const ok = await confirmDialog(
    `Excluir a trilha "${trilha.title}" e todos os blocos?`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;
  const res = await fetch(`/trilhas/${trilha.id}`, { method: 'DELETE' });
  if (!res.ok) {
    toast('Falha ao excluir');
    return;
  }
  currentTrilhaDetail = null;
  selectedTrilhaNodeId = null;
  selectedTrilhaStickyId = null;
  renderCurrentTrilha();
  await loadTrilhas();
  toast('Trilha excluída');
};
