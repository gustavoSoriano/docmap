// ════ Monitores — relógio + ledger de execuções de agentes externos ════

let allMonitors = [];
let currentMonitorId = null;
let currentMonitor = null;
let monPollTimer = null;

const MON_STATUS_LABEL = {
  active: 'Ativo',
  paused: 'Pausado',
  halted: 'Parado',
  review: 'Revisão',
  done: 'Concluído',
};

const MON_RUN_LABEL = {
  leased: 'Reservado',
  working: 'Executando',
  'no-change': 'Sem novidade',
  done: 'Concluído',
  failed: 'Falhou',
  expired: 'Expirado',
};

const monFmt = (iso) => {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

const monAgo = (iso) => {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '—';
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h atrás`;
  return monFmt(iso);
};

const monIn = (iso) => {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '—';
  const min = Math.ceil((t - Date.now()) / 60000);
  if (min <= 0) return 'agora';
  if (min < 60) return `em ${min} min`;
  const h = Math.round(min / 60);
  return `em ${h} h`;
};

const monK = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return Math.round(v / 1000) + 'k';
  return String(v);
};

// ── Lista ──
const loadMonitorsList = async () => {
  try {
    const res = await fetch('/monitors');
    allMonitors = await res.json();
    renderMonitorsList();
    ensureMonitorPoll();
  } catch (err) {
    console.error('Erro ao carregar monitores:', err);
  }
};

const renderMonitorsList = () => {
  const q = ($('mon-search')?.value || '').toLowerCase();
  const list = $('mon-list');
  if (!list) return;
  const filtered = allMonitors.filter((m) =>
    !q || (m.title || '').toLowerCase().includes(q) ||
    (m.objective || '').toLowerCase().includes(q) ||
    (m.tags || []).join(' ').toLowerCase().includes(q)
  );
  $('mon-sidebar-count').textContent = allMonitors.length === 1
    ? '1 monitor'
    : allMonitors.length + ' monitores';
  const emptyMsg = allMonitors.length
    ? 'Nenhum monitor encontrado.'
    : 'Nenhum monitor ainda. Crie o primeiro.';
  list.innerHTML = filtered.map((m) => {
    const next = m.status === 'active' ? monIn(m.nextRunAt) : MON_STATUS_LABEL[m.status] || m.status;
    return `<button class="mon-card-item ${m.id === currentMonitorId ? 'active' : ''}"
      onclick="openMonitor('${m.id}')">
      <div class="mon-card-head">
        <span class="mon-dot ${escHtml(m.status)}"></span>
        <span class="mon-card-title">${escHtml(m.title || 'Sem título')}</span>
      </div>
      <div class="mon-card-meta">
        <span>a cada ${m.intervalMinutes} min</span>
        <span>${escHtml(next)}</span>
      </div>
    </button>`;
  }).join('') || `<div class="mon-list-empty">${emptyMsg}</div>`;
};

// ── Detalhe ──
const openMonitor = async (id) => {
  currentMonitorId = id;
  renderMonitorsList();
  await refreshCurrentMonitor();
};

const refreshCurrentMonitor = async (silent = false) => {
  if (!currentMonitorId) return;
  try {
    const res = await fetch('/monitors/' + currentMonitorId);
    if (!res.ok) throw new Error('monitor não encontrado');
    currentMonitor = await res.json();
    renderMonitorDetail(currentMonitor);
  } catch (err) {
    console.error('Erro ao carregar monitor:', err);
    if (!silent) toast('Não consegui carregar o monitor');
  }
};

const renderMonitorDetail = (m) => {
  $('mon-empty').hidden = true;
  $('mon-active').hidden = false;

  $('mon-title').textContent = m.title || 'Sem título';
  const status = $('mon-status');
  status.textContent = MON_STATUS_LABEL[m.status] || m.status;
  status.className = 'chip ' + m.status;
  $('mon-objective').textContent = m.objective || '(sem objetivo)';

  const review = $('mon-review');
  if (m.status === 'review') {
    review.hidden = false;
    review.innerHTML =
      `<div><b>Conclusão proposta.</b> ${escHtml(m.haltReason || 'A IA considera o objetivo concluído.')}</div>` +
      `<div class="mon-review-actions">` +
      `<button class="app-primary-btn" onclick="decideMonitor('accept')">Aceitar e concluir</button>` +
      `<button class="app-secondary-btn" onclick="decideMonitor('reject')">Rejeitar</button>` +
      `</div>`;
  } else {
    review.hidden = true;
    review.innerHTML = '';
  }

  // Play/pause
  const btn = $('mon-playpause');
  const canResume = m.status === 'paused' || m.status === 'halted';
  btn.disabled = !(m.status === 'active' || canResume);
  if (m.status === 'active') {
    btn.innerHTML = `${ICON('pause')}<span>Pausar</span>`;
    btn.title = 'Pausar monitor';
  } else if (canResume) {
    btn.innerHTML = `${ICON('play')}<span>Retomar</span>`;
    btn.title = 'Retomar monitor';
  } else {
    btn.innerHTML = `${ICON('pause')}<span>Indisponível</span>`;
    btn.title = 'Este monitor não está ativo';
  }

  renderMonitorStats(m);
  renderMonitorSide(m);
  renderMonitorTimeline(m);
};

const renderMonitorStats = (m) => {
  const el = $('mon-stats');
  if (!el) return;
  const u = m.usage || {};
  const l = m.limits || {};
  const next = m.status === 'active' ? monIn(m.nextRunAt) : (MON_STATUS_LABEL[m.status] || m.status);
  const items = [
    ['Intervalo', `a cada ${m.intervalMinutes} min`],
    ['Próxima', next],
    ['Hoje', `${u.runsToday ?? 0}/${l.maxRunsPerDay ?? '—'}`],
    ['Tokens hoje', `${monK(u.tokensToday)}/${monK(l.maxTokensPerDay)}`],
    ['Custo hoje', `US$ ${u.costToday ?? 0}/${l.maxCostUsdPerDay ?? '—'}`],
  ];
  el.innerHTML = items.map(([k, v]) =>
    `<div class="mon-stat"><div class="mon-stat-label">${k}</div>` +
    `<div class="mon-stat-value" title="${escHtml(v)}">${escHtml(v)}</div></div>`
  ).join('');
};

const monListText = (items, empty) => {
  if (!items || !items.length) return `<div class="mon-muted">${empty}</div>`;
  return `<ul>${items.map((i) => `<li>${escHtml(i)}</li>`).join('')}</ul>`;
};

const monOrderedText = (items, empty) => {
  if (!items || !items.length) return `<div class="mon-muted">${empty}</div>`;
  return `<ol>${items.map((i) => `<li>${escHtml(i)}</li>`).join('')}</ol>`;
};

const renderMonitorSide = (m) => {
  $('mon-guardrails').innerHTML = monListText(m.guardrails, 'Nenhum guardrail escrito.');
  $('mon-criteria').innerHTML = monOrderedText(m.doneCriteria, 'Sem critério definido — a IA propõe e você decide.');

  const state = m.state || {};
  const limits = m.limits || {};
  $('mon-state').innerHTML =
    `<div class="mon-state-grid">` +
    `<div class="mon-state-row"><b>Conclusão</b><span>${escHtml(m.requireDoneApproval ? 'exige sua confirmação' : 'a IA conclui sozinha')}</span></div>` +
    `<div class="mon-state-row"><b>Cursor</b><span>${escHtml(state.cursor || '—')}</span></div>` +
    `<div class="mon-state-row"><b>Memória</b><span>${escHtml(state.memory || '—')}</span></div>` +
    `<div class="mon-state-row"><b>Falhas</b><span>${state.consecutiveFailures || 0}/${limits.maxConsecutiveFailures}</span></div>` +
    `<div class="mon-state-row"><b>Sem mudança</b><span>${state.consecutiveNoChange || 0}/${limits.idleRunsToPause}</span></div>` +
    `<div class="mon-state-row"><b>Lease</b><span>${limits.runTimeoutMinutes} min</span></div>` +
    `<div class="mon-state-row"><b>Prazo</b><span>${escHtml(limits.expiresAt ? monFmt(limits.expiresAt) : 'sem prazo')}</span></div>` +
    (m.haltReason
      ? `<div class="mon-state-row"><b>Motivo</b><span>${escHtml(m.haltReason)}</span></div>`
      : '') +
    `</div>`;

};

const renderMonitorTimeline = (m) => {
  const wrap = $('mon-timeline');
  const scroll = wrap.scrollTop;
  const runs = m.runs || [];
  $('mon-run-count').textContent = runs.length;

  wrap.innerHTML = runs.length
    ? runs.map((r) => {
      const tokens = (r.tokensIn || 0) + (r.tokensOut || 0);
      const summary = r.summary || r.error || '—';
      const criteria = r.criteria || [];
      const criteriaDone = criteria.filter((c) => c.done).length;
      const criteriaMeta = criteria.length
        ? `<span>critérios ${criteriaDone}/${criteria.length}</span>`
        : '';
      return `<div class="mon-run">
        <div class="mon-run-time">${escHtml(monFmt(r.leasedAt))}<br>#${r.seq}</div>
        <div class="mon-run-main">
          <div class="mon-run-top">
            <span class="mon-run-status ${escHtml(r.status)}">${escHtml(MON_RUN_LABEL[r.status] || r.status)}</span>
            <span class="mon-run-seq">${escHtml(r.agent || 'agente')}</span>
          </div>
          <div class="mon-run-summary">${escHtml(summary)}</div>
          <div class="mon-run-meta">
            <span>${monK(tokens)} tokens</span>
            <span>US$ ${r.costUsd ?? 0}</span>
            ${criteriaMeta}
            <span>${escHtml(monAgo(r.finishedAt || r.leasedAt))}</span>
            ${r.hasReport ? `<button onclick="openMonitorReport('${r.id}')">Abrir relatório</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('')
    : '<div class="mon-timeline-empty">Nenhuma execução ainda. O relógio começa quando uma IA entrar no inbox.</div>';

  wrap.scrollTop = scroll;
};

// ── Ações do topo ──
const copyMonitorId = () => {
  if (!currentMonitor) return;
  copyToClipboard(currentMonitor.id, 'ID do monitor copiado');
};

const copyMonitorPrompt = async () => {
  if (!currentMonitor) return;
  try {
    const res = await fetch('/monitors/' + currentMonitor.id + '/prompt');
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    toast('Prompt copiado — cole na IA que vai executar');
  } catch {
    toast('Falha ao copiar o prompt');
  }
};

const toggleMonitorPause = async () => {
  if (!currentMonitor) return;
  const id = currentMonitor.id;
  if (currentMonitor.status === 'active') {
    const res = await fetch(`/monitors/${id}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Pausado por você.' }),
    });
    if (!res.ok) return toast('Não consegui pausar');
    toast('Monitor pausado. A IA para na próxima checagem.');
  } else if (currentMonitor.status === 'paused' || currentMonitor.status === 'halted') {
    const res = await fetch(`/monitors/${id}/resume`, { method: 'POST' });
    if (!res.ok) {
      const msg = await res.text();
      return toast(msg === 'expired'
        ? 'Prazo vencido — edite o prazo antes de retomar'
        : 'Não consegui retomar');
    }
    toast('Monitor retomado. Avise a IA para voltar ao inbox.');
  } else {
    return toast('Este monitor não pode ser retomado agora');
  }
  await loadMonitorsList();
  await refreshCurrentMonitor(true);
};

const kickCurrentMonitor = async () => {
  if (!currentMonitor) return;
  if (currentMonitor.status !== 'active') {
    return toast('Só monitor ativo pode rodar agora');
  }
  const res = await fetch(`/monitors/${currentMonitor.id}/kick`, { method: 'POST' });
  if (!res.ok) return toast('Não consegui antecipar');
  toast('Antecipado. A IA acorda no próximo inbox (até 2s).');
  await refreshCurrentMonitor(true);
};

const decideMonitor = async (decision) => {
  if (!currentMonitor) return;
  const res = await fetch(`/monitors/${currentMonitor.id}/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, by: 'user' }),
  });
  if (!res.ok) return toast('Não consegui registrar a decisão');
  toast(decision === 'accept' ? 'Monitor concluído' : 'Conclusão rejeitada');
  await loadMonitorsList();
  await refreshCurrentMonitor(true);
};

// ── Modal criar/editar ──
const openMonitorModal = (id) => {
  const m = id && currentMonitor && currentMonitor.id === id ? currentMonitor : null;
  $('mon-modal-title').textContent = m ? 'Editar monitor' : 'Novo monitor';
  $('mon-f-id').value = m?.id || '';
  $('mon-f-title').value = m?.title || '';
  $('mon-f-objective').value = m?.objective || '';
  $('mon-f-interval').value = m?.intervalMinutes ?? 30;
  setMonitorGuardrails(m?.guardrails || []);
  $('mon-f-guardrail-input').value = '';
  setMonitorCriteria(m?.doneCriteria || []);
  $('mon-f-criterion-input').value = '';
  $('mon-f-runs-day').value = m?.limits?.maxRunsPerDay ?? 50;
  $('mon-f-tokens-day').value = m?.limits?.maxTokensPerDay ?? 200000;
  $('mon-f-cost-day').value = m?.limits?.maxCostUsdPerDay ?? 5;
  $('mon-f-failures').value = m?.limits?.maxConsecutiveFailures ?? 5;
  $('mon-f-idle').value = m?.limits?.idleRunsToPause ?? 6;
  $('mon-f-timeout').value = m?.limits?.runTimeoutMinutes ?? 15;
  $('mon-f-expires').value = m?.limits?.expiresAt
    ? new Date(m.limits.expiresAt).toISOString().slice(0, 10)
    : '';
  setMonitorApproval(m ? m.requireDoneApproval === true : false);
  $('mon-f-tags').value = (m?.tags || []).join(', ');
  $('mon-modal-overlay').classList.add('visible');
};

const closeMonitorModal = (e) => {
  if (e && e.target !== $('mon-modal-overlay')) return;
  $('mon-modal-overlay').classList.remove('visible');
};

let monGuardrailDraft = [];

const renderMonitorGuardrailsEditor = () => {
  const el = $('mon-f-guardrails-list');
  if (!el) return;
  el.innerHTML = monGuardrailDraft.length
    ? monGuardrailDraft.map((text, i) =>
      `<div class="mon-edit-item"><span>${escHtml(text)}</span>` +
      `<button type="button" class="icon-btn danger" onclick="removeMonitorGuardrail(${i})" ` +
      `title="Remover" aria-label="Remover guardrail">${ICON('x')}</button></div>`
    ).join('')
    : '<div class="mon-muted">Nenhum guardrail adicionado.</div>';
};

const setMonitorGuardrails = (items) => {
  monGuardrailDraft = (Array.isArray(items) ? items : []).slice();
  renderMonitorGuardrailsEditor();
};

const addMonitorGuardrail = () => {
  const input = $('mon-f-guardrail-input');
  const text = String(input?.value || '').trim();
  if (!text) return;
  if (!monGuardrailDraft.includes(text)) monGuardrailDraft.push(text);
  input.value = '';
  renderMonitorGuardrailsEditor();
};

const removeMonitorGuardrail = (index) => {
  monGuardrailDraft = monGuardrailDraft.filter((_, i) => i !== index);
  renderMonitorGuardrailsEditor();
};

let monCriteriaDraft = [];

const renderMonitorCriteriaEditor = () => {
  const el = $('mon-f-criteria-list');
  if (!el) return;
  el.innerHTML = monCriteriaDraft.length
    ? monCriteriaDraft.map((text, i) =>
      `<div class="mon-edit-item"><span>${escHtml(text)}</span>` +
      `<button type="button" class="icon-btn danger" onclick="removeMonitorCriterion(${i})" ` +
      `title="Remover" aria-label="Remover critério">${ICON('x')}</button></div>`
    ).join('')
    : '<div class="mon-muted">Nenhum critério adicionado.</div>';
};

const setMonitorCriteria = (items) => {
  monCriteriaDraft = (Array.isArray(items) ? items : []).slice();
  renderMonitorCriteriaEditor();
};

const addMonitorCriterion = () => {
  const input = $('mon-f-criterion-input');
  const text = String(input?.value || '').trim();
  if (!text) return;
  if (!monCriteriaDraft.includes(text)) monCriteriaDraft.push(text);
  input.value = '';
  renderMonitorCriteriaEditor();
};

const removeMonitorCriterion = (index) => {
  monCriteriaDraft = monCriteriaDraft.filter((_, i) => i !== index);
  renderMonitorCriteriaEditor();
};

const setMonitorApproval = (on) => {
  const btn = $('mon-f-approval');
  btn.setAttribute('aria-checked', on ? 'true' : 'false');
  $('mon-f-approval-label').textContent = on ? 'Sim' : 'Não';
};

const toggleMonitorApproval = () => {
  const btn = $('mon-f-approval');
  setMonitorApproval(btn.getAttribute('aria-checked') !== 'true');
};

const saveMonitorFromModal = async (e) => {
  e.preventDefault();
  const id = $('mon-f-id').value;
  const expiresRaw = $('mon-f-expires').value;
  let expiresAt = null;
  if (expiresRaw) {
    const [y, m, d] = expiresRaw.split('-').map(Number);
    expiresAt = new Date(y, m - 1, d, 23, 59, 0).toISOString();
  }
  const payload = {
    title: $('mon-f-title').value,
    objective: $('mon-f-objective').value,
    intervalMinutes: Number($('mon-f-interval').value),
    guardrails: monGuardrailDraft,
    doneCriteria: monCriteriaDraft,
    requireDoneApproval: $('mon-f-approval').getAttribute('aria-checked') === 'true',
    tags: String($('mon-f-tags').value || '')
      .split(',').map((v) => v.trim()).filter(Boolean),
    limits: {
      maxRunsPerDay: Number($('mon-f-runs-day').value),
      maxTokensPerDay: Number($('mon-f-tokens-day').value),
      maxCostUsdPerDay: Number($('mon-f-cost-day').value),
      maxConsecutiveFailures: Number($('mon-f-failures').value),
      idleRunsToPause: Number($('mon-f-idle').value),
      runTimeoutMinutes: Number($('mon-f-timeout').value),
      expiresAt,
    },
  };

  const res = await fetch(id ? '/monitors/' + id : '/monitors', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    return toast(msg || 'Não consegui salvar');
  }
  const saved = await res.json();
  closeMonitorModal();
  toast(id ? 'Monitor atualizado' : 'Monitor criado — copie o prompt para a IA');
  await loadMonitorsList();
  await openMonitor(saved.id);
};

const deleteCurrentMonitor = async () => {
  if (!currentMonitor) return;
  const ok = await confirmDialog(
    `Excluir "${currentMonitor.title}" e todo o histórico de execuções?`,
    { okLabel: 'Excluir', danger: true },
  );
  if (!ok) return;
  const res = await fetch('/monitors/' + currentMonitor.id, { method: 'DELETE' });
  if (!res.ok) return toast('Não consegui excluir');
  toast('Monitor excluído');
  currentMonitor = null;
  currentMonitorId = null;
  $('mon-active').hidden = true;
  $('mon-empty').hidden = false;
  await loadMonitorsList();
};

// ── Relatório ──
const openMonitorReport = async (runId) => {
  try {
    const res = await fetch('/monitors/runs/' + runId + '/report');
    if (!res.ok) return toast('Relatório não encontrado');
    const md = await res.text();
    const run = (currentMonitor?.runs || []).find((r) => r.id === runId);
    $('mon-report-title').textContent = run
      ? `Relatório — execução #${run.seq}`
      : 'Relatório';
    $('mon-report-body').innerHTML = renderMarkdown(md);
    $('mon-report-overlay').classList.add('visible');
  } catch {
    toast('Falha ao abrir o relatório');
  }
};

const closeMonitorReport = (e) => {
  if (e && e.target !== $('mon-report-overlay')) return;
  $('mon-report-overlay').classList.remove('visible');
};

// ── Polling suave enquanto o modo está aberto ──
const ensureMonitorPoll = () => {
  if (monPollTimer) return;
  monPollTimer = setInterval(() => {
    if (currentMode !== 'monitors' || document.hidden) return;
    if (currentMonitorId) refreshCurrentMonitor(true);
  }, 8000);
};
