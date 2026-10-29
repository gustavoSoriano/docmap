// ════ Trilhas — cabeçalho, saúde, foco e estado de visão ════
// A saúde vem pronta do servidor (health + attention): a UI só apresenta.

let trilhaFocus = 'all';
let trilhaCollapsed = new Set();

const TR_FOCUS = [
  ['all', 'Tudo'],
  ['me', 'Precisa de mim'],
  ['blocked', 'Travados'],
  ['active', 'Em andamento'],
];

const trLocal = {
  get: (key, fallback) => {
    try {
      const v = localStorage.getItem(`docmap.trilha.${key}`);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(`docmap.trilha.${key}`, value);
    } catch {
      // sem storage: a preferência só vale na sessão
    }
  },
};

const saveTrilhaCollapsed = () => {
  const id = currentTrilhaDetail?.trilha.id;
  if (id) trLocal.set(`${id}.collapsed`, JSON.stringify([...trilhaCollapsed]));
};

const resetTrilhaViewState = () => {
  trilhaFocus = 'all';
  trilhaRailTab = 'attention';
  trilhaArsenalData = null;
  trilhaArsenalSig = '';
  const id = currentTrilhaDetail?.trilha.id;
  try {
    trilhaCollapsed = new Set(JSON.parse(trLocal.get(`${id}.collapsed`, '[]')));
  } catch {
    trilhaCollapsed = new Set();
  }
  applyTrilhaPanels();
};

const applyTrilhaPanels = () => {
  const arsenalOn = trLocal.get('arsenal', '1') === '1';
  const railOn = trLocal.get('rail', '1') === '1';
  $('trilha-arsenal')?.classList.toggle('collapsed', !arsenalOn);
  $('trilha-rail')?.classList.toggle('collapsed', !railOn);
  $('trilha-arsenal-btn')?.classList.toggle('on', arsenalOn);
  $('trilha-rail-btn')?.classList.toggle('on', railOn);
};

const toggleTrilhaArsenal = () => {
  trLocal.set('arsenal', trLocal.get('arsenal', '1') === '1' ? '0' : '1');
  applyTrilhaPanels();
};

const toggleTrilhaRail = () => {
  trLocal.set('rail', trLocal.get('rail', '1') === '1' ? '0' : '1');
  applyTrilhaPanels();
};

// ── Foco: esmaece o que não importa agora ──

const trilhaFocusIds = () => {
  if (trilhaFocus === 'all' || !currentTrilhaDetail) return null;
  const { nodes, attention } = currentTrilhaDetail;
  const ids = new Set();
  if (trilhaFocus === 'ref' && trilhaRefFocus) {
    trilhaRefUsage(trilhaRefFocus.kind, trilhaRefFocus.id).nodes
      .forEach((r) => ids.add(r.nodeId));
    return ids;
  }
  const byAttention = (kinds) =>
    attention.filter((a) => a.nodeId && kinds.includes(a.kind))
      .forEach((a) => ids.add(a.nodeId));
  if (trilhaFocus === 'me') {
    byAttention(['blocker', 'question', 'pending']);
    nodes.filter((n) => n.assignee?.kind === 'human' && n.status === 'doing')
      .forEach((n) => ids.add(n.id));
  } else if (trilhaFocus === 'blocked') {
    byAttention(['blocker', 'warning', 'stale']);
    nodes.filter((n) => n.status === 'blocked').forEach((n) => ids.add(n.id));
  } else {
    nodes.filter((n) => n.status === 'doing' || (n.claimedBy && !trilhaStaleText(n)))
      .forEach((n) => ids.add(n.id));
  }
  return ids;
};

const setTrilhaFocus = (focus) => {
  trilhaFocus = focus;
  if (focus !== 'ref') trilhaRefFocus = null;
  renderTrilhaFocus();
  renderTrilhaMap();
};

const renderTrilhaFocus = () => {
  const box = $('trilha-focus');
  if (!box) return;
  const refPill = trilhaFocus === 'ref' && trilhaRefFocus
    ? `<button type="button" class="on tr-focus-ref" onclick="setTrilhaFocus('all')" title="Limpar filtro">Usa: ${escHtml(trilhaRefFocus.title)} ${ICON('x')}</button>`
    : '';
  box.innerHTML = TR_FOCUS.map(([key, label]) =>
    `<button type="button" class="${trilhaFocus === key ? 'on' : ''}" onclick="setTrilhaFocus('${key}')">${label}</button>`
  ).join('') + refPill;
  hydrateIcons(box);
};

// ── Saúde ──

const trPlural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const trilhaHealthChips = (health, attention) => {
  const count = (kinds) => attention.filter((a) => kinds.includes(a.kind)).length;
  const blockers = count(['blocker']);
  const waiting = count(['question', 'pending']);
  const warnings = count(['warning']);
  const stale = count(['stale']);
  const chip = (cls, text, action, tip) =>
    `<button type="button" class="tr-hchip" onclick="${action}" title="${escHtml(tip)}"><span class="status ${cls}">${text}</span></button>`;
  const out = [];
  if (blockers) out.push(chip('danger', trPlural(blockers, 'bloqueio', 'bloqueios'), "trilhaChipFocus('blocked')", 'Ver o que está travado'));
  if (waiting) out.push(chip('info', `${waiting} ${waiting === 1 ? 'espera' : 'esperam'} você`, "trilhaChipFocus('me')", 'Perguntas e pendências para você'));
  if (warnings) out.push(chip('warn', trPlural(warnings, 'aviso', 'avisos'), "trilhaChipFocus('blocked')", 'Avisos abertos'));
  if (stale) out.push(chip('warn', `${stale} sem sinal`, "trilhaChipFocus('blocked')", 'Reservas sem heartbeat há mais de 5 min'));
  const agents = health.activeAgents || [];
  if (agents.length) out.push(chip('ok', trPlural(agents.length, 'agente ativo', 'agentes ativos'), "trilhaChipFocus('active')", agents.join(', ')));
  const pinned = currentTrilhaDetail.refs.filter((r) => !r.nodeId).length;
  if (pinned) out.push(chip('', `${pinned} na trilha`, 'focusTrilhaArsenalSearch()', 'Itens vinculados à trilha inteira (valem para todos os blocos)'));
  if (!out.length && health.total) out.push(`<span class="status ok">Sem pendências</span>`);
  return out;
};

// Estado derivado mínimo caso o servidor seja antigo e não mande health.
const trilhaFallbackHealth = (nodes) => ({
  total: nodes.length,
  done: nodes.filter((n) => n.status === 'done').length,
  readyForAi: 0,
  activeAgents: [],
});

const trilhaChipFocus = (focus) => {
  setTrilhaRailTab('attention');
  setTrilhaFocus(focus);
};

const renderTrilhaHead = () => {
  const { trilha, nodes, attention } = currentTrilhaDetail;
  const health = currentTrilhaDetail.health || trilhaFallbackHealth(nodes);
  $('trilha-toolbar-title').textContent = trilha.title;
  $('trilha-head-tags').innerHTML = renderTrilhaTags(trilha.tags);
  const obj = $('trilha-objective');
  obj.innerHTML = `${ICON('flag')}<span>${escHtml(trilha.objective)}</span>`;
  obj.title = `Objetivo: ${trilha.objective}\nClique para editar`;
  const total = Math.max(health.total, 1);
  const ready = health.readyForAi
    ? `<span class="tr-meta-quiet" title="Blocos liberados que nenhum agente assumiu">${trPlural(health.readyForAi, 'pronto para agente', 'prontos para agente')}</span>`
    : '';
  $('trilha-health').innerHTML = `
    <span class="status ${TR_STATUS_CLS[trilha.status] || ''}">${escHtml(TR_STATUS_LABEL[trilha.status] || trilha.status)}</span>
    <span class="tr-meta-progress" title="${health.done} de ${health.total} blocos prontos">
      <progress value="${health.done}" max="${total}"></progress>
      <span>${health.done}/${health.total}</span>
    </span>
    ${trilhaHealthChips(health, attention).join('')}
    ${ready}`;
  renderTrilhaFocus();
  applyTrilhaPanels();
};

// ── Mapa vazio: ponto de partida guiado ──

const renderTrilhaOnboard = () => {
  const box = $('trilha-onboard');
  if (!box || !currentTrilhaDetail) return;
  const { nodes, stickies, trilha } = currentTrilhaDetail;
  const empty = !nodes.length && !stickies.length;
  box.hidden = !empty;
  if (!empty) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `
    <div class="tr-onboard-card">
      <span class="tr-onboard-mark">${ICON('flag')}</span>
      <div class="tr-onboard-title">Comece pelo objetivo</div>
      <div class="tr-onboard-obj">${escHtml(trilha.objective)}</div>
      <div class="tr-onboard-steps">
        <button type="button" class="tr-onboard-step" onclick="openNodeModal()">${ICON('plus')}<span><b>Quebre em blocos</b>Cada bloco é uma entrega com critérios de pronto.</span></button>
        <button type="button" class="tr-onboard-step" onclick="focusTrilhaArsenalSearch()">${ICON('shield')}<span><b>Dê contexto</b>Fixe guardrails, skills e macros do Arsenal.</span></button>
        <button type="button" class="tr-onboard-step" onclick="copyTrilhaPrompt()">${ICON('sparkles')}<span><b>Chame a IA</b>Copie o prompt e ela monta e executa a trilha aqui.</span></button>
      </div>
    </div>`;
  hydrateIcons(box);
};
