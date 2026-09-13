// ==== Agent chats — UI realtime via SSE (agentes usam inbox bloqueante) ====

let allAgentChats = [];
let currentAgentChatId = null;
let currentAgentChatDetail = null;
let agentChatEventsOn = false;
let agentChatRefreshTimer = null;
let acReplyTo = null; // { name, snippet }
let acMsgById = {};
let acStickToBottom = true;
let acLastOpenChatId = null;
let acLastMsgCount = 0;
let acForceScrollBottom = false;
let acScrollListenerOn = false;
let acPendingNewCount = 0;

const loadAgentChatsList = async () => {
  try {
    const res = await fetch('/agentchats');
    allAgentChats = await res.json();
    renderAgentChatsList();
    ensureAgentChatEvents();
  } catch (err) {
    console.error('Erro ao carregar chats:', err);
  }
};

const renderAgentChatsList = () => {
  const q = ($('ac-search')?.value || '').toLowerCase();
  const list = $('ac-list');
  if (!list) return;
  const filtered = allAgentChats.filter((c) =>
    !q || (c.title || '').toLowerCase().includes(q) ||
    (c.objective || '').toLowerCase().includes(q) ||
    (c.tags || []).join(' ').toLowerCase().includes(q)
  );
  $('ac-sidebar-count').textContent = allAgentChats.length + ' salas';
  list.innerHTML = filtered.map((c) =>
    `<button class="ac-card ${c.id === currentAgentChatId ? 'active' : ''}" onclick="openAgentChat('${c.id}')">` +
    `<div class="ac-card-title">${escHtml(c.title || 'Sem título')}</div>` +
    `<div class="ac-card-meta">${escHtml((c.objective || '').slice(0, 80))}</div>` +
    ((c.tags || []).length ? `<div class="ac-card-tags">${c.tags.map((t) => `<span class="note-tag">#${escHtml(t)}</span>`).join('')}</div>` : '') +
    `</button>`
  ).join('') || '<div class="ac-card-meta">Nenhuma sala. Crie a primeira.</div>';
};

const openAgentChatModal = (id) => {
  // Sem id => sempre CRIAR nova sala (nunca herda a aberta).
  // Com id => editar a sala indicada.
  const targetId = id ?? null;
  const chat = targetId
    ? (currentAgentChatDetail?.chat?.id === targetId
      ? currentAgentChatDetail.chat
      : allAgentChats.find((c) => c.id === targetId))
    : null;
  $('ac-modal-form').reset();
  $('ac-modal-edit-id').value = chat?.id || '';
  $('ac-modal-title').value = chat?.title || '';
  $('ac-modal-objective').value = chat?.objective || '';
  $('ac-modal-tags').value = (chat?.tags || []).join(', ');
  $('ac-modal-title-label').textContent = chat ? 'Editar chat' : 'Novo chat';
  $('ac-modal-submit-label').textContent = chat ? 'Salvar' : 'Criar chat';
  $('ac-modal-overlay').classList.add('visible');
  setTimeout(() => $('ac-modal-title').focus(), 0);
};

// Alias antigo (botões legados e console): abre o formulário único.
const openNewAgentChat = () => openAgentChatModal();

const closeAgentChatModal = (event) => {
  if (event && event.target !== $('ac-modal-overlay')) return;
  $('ac-modal-overlay').classList.remove('visible');
};

const saveAgentChatFromModal = async (event) => {
  event.preventDefault();
  const editId = $('ac-modal-edit-id').value.trim();
  const title = $('ac-modal-title').value.trim();
  const objective = $('ac-modal-objective').value.trim();
  const tags = $('ac-modal-tags').value.split(',').map((t) => t.trim()).filter(Boolean);
  try {
    const res = editId
      ? await fetch(`/agentchats/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, objective, tags }),
      })
      : await fetch('/agentchats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Chat sem título', objective, tags }),
      });
    if (!res.ok) throw new Error(await res.text());
    const chat = await res.json();
    closeAgentChatModal();
    await loadAgentChatsList();
    openAgentChat(chat.id);
    if (editId) toast('Sala atualizada');
  } catch (err) {
    toast(err.message || 'Falha ao salvar sala');
  }
};

const editCurrentAgentChat = () => openAgentChatModal();

const openAgentChat = async (id) => {
  currentAgentChatId = id;
  acReplyTo = null;
  acForceScrollBottom = true;
  acPendingNewCount = 0;
  renderAgentChatsList();
  await refreshCurrentAgentChat();
};

const refreshCurrentAgentChat = async () => {
  if (!currentAgentChatId) return;
  try {
    const res = await fetch(`/agentchats/${currentAgentChatId}?limit=200`);
    if (!res.ok) throw new Error(await res.text());
    currentAgentChatDetail = await res.json();
    renderAgentChatDetail();
  } catch (err) {
    console.error('Erro ao abrir chat:', err);
  }
};

// ── Identidade visual por autor (cor determinística + iniciais) ──
const acColorFor = (name) => {
  const s = String(name || '?').toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h} 65% 55%)`;
};

const acInitials = (name) => {
  const parts = String(name || '?').trim().split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Robozinho determinístico por agente (olhos + boca + antena variam) ──
const acRobotSvg = (name) => {
  const s = String(name || '?');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const eyes = h % 3;
  const mouth = (h >> 2) % 3;
  const antenna = (h >> 4) % 3;

  const eyeSvg = eyes === 0
    ? '<circle cx="12" cy="13.5" r="1.7" fill="#ffffff" stroke="none"/>' +
      '<circle cx="20" cy="13.5" r="1.7" fill="#ffffff" stroke="none"/>'
    : eyes === 1
    ? '<path d="M10.2 14.2 Q12 12 13.8 14.2"/><path d="M18.2 14.2 Q20 12 21.8 14.2"/>'
    : '<path d="M10.3 13.8 h3.2"/><path d="M18.5 13.8 h3.2"/>';

  const mouthSvg = mouth === 0
    ? '<path d="M12 17.6 Q16 20.6 20 17.6"/>'
    : mouth === 1
    ? '<rect x="12.4" y="16.4" width="7.2" height="3.2" rx="1.6" fill="#ffffff" stroke="none"/>'
    : '<path d="M13 18.2 h6"/>';

  const antennaSvg = antenna === 0
    ? '<path d="M16 8 V4.4"/><circle cx="16" cy="3" r="1.5" fill="#ffffff" stroke="none"/>'
    : antenna === 1
    ? '<path d="M16 8 V5"/><path d="M14.6 5 L16.4 2.8 L15.4 2.8 L17 0.8"/>'
    : '';

  return `<svg viewBox="0 0 32 32" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    antennaSvg +
    `<rect x="5.5" y="11" width="2.6" height="6" rx="1.3"/><rect x="23.9" y="11" width="2.6" height="6" rx="1.3"/>` +
    `<rect x="8" y="8" width="16" height="13.5" rx="4.5"/>` +
    eyeSvg + mouthSvg + `</svg>`;
};

const acTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// ── Responder: preenche @nome, mostra chip e foca o input ──
const replyToAgentChatById = (msgId) => {
  const m = acMsgById[msgId];
  if (!m) return;
  acReplyTo = { name: m.authorName, snippet: String(m.body || '').slice(0, 120) };
  const input = $('ac-input');
  if (input && !input.value.trim()) input.value = `@${m.authorName} `;
  else if (input && !input.value.includes(`@${m.authorName}`)) {
    input.value = `@${m.authorName} ` + input.value;
  }
  renderAcReplyChip();
  $('ac-input')?.focus();
};

const renderAcReplyChip = () => {
  const chip = $('ac-reply-chip');
  if (!chip) return;
  if (!acReplyTo) {
    chip.hidden = true;
    return;
  }
  chip.hidden = false;
  $('ac-reply-label').textContent =
    `Respondendo a ${acReplyTo.name}: ${acReplyTo.snippet}`;
  if (window.hydrateIcons) hydrateIcons(chip);
};

const cancelAcReply = () => {
  acReplyTo = null;
  renderAcReplyChip();
};

const renderAgentChatDetail = () => {
  const detail = currentAgentChatDetail;
  const has = !!(detail && detail.chat);
  $('ac-empty').style.display = has ? 'none' : 'flex';
  $('ac-active').style.display = has ? 'flex' : 'none';
  if (!has) return;
  $('ac-toolbar-title').textContent = detail.chat.title || 'Sem título';
  $('ac-toolbar-objective').textContent = detail.chat.objective
    ? 'Objetivo: ' + detail.chat.objective
    : 'Sem objetivo definido. Edite e diga aos agentes o que fazer.';
  $('ac-toolbar-tags').innerHTML = (detail.chat.tags || [])
    .map((t) => `<span class="note-tag">#${escHtml(t)}</span>`).join('');

  const parts = detail.participants || [];
  $('ac-participants').innerHTML = parts.length
    ? parts.map((p) =>
      `<span class="ac-presence ${p.presence === 'online' ? 'online' : ''}">` +
      `<span class="ac-dot" style="background:${acColorFor(p.name)}"></span>` +
      `<span class="ac-presence-name">${escHtml(p.name)}</span>` +
      `<span class="ac-presence-state"> · ${escHtml(p.presence)}</span></span>`
    ).join('')
    : '<span>Nenhum agente conectado. Copie o prompt e chame os agentes.</span>';

  const box = $('ac-messages');
  ensureAcScrollListener();
  const messages = detail.messages || [];
  const isChatSwitch = acLastOpenChatId !== detail.chat.id;
  const prevCount = isChatSwitch ? messages.length : acLastMsgCount;
  // Mede antes de trocar o DOM: se o usuário estava lendo em cima, não puxa.
  const wasNearBottom = acIsNearBottom(box);
  const prevScrollTop = box.scrollTop;
  acMsgById = {};
  for (const m of messages) acMsgById[m.id] = m;
  box.innerHTML = messages.map((m) => {
    if (m.authorKind === 'system') {
      return `<div class="ac-msg system">${escHtml(m.body)}</div>`;
    }
    const mine = m.authorKind === 'user' ? ' mine' : '';
    const color = m.authorKind === 'user' ? 'var(--accent)' : acColorFor(m.authorName);
    const avatar = m.authorKind === 'user'
      ? escHtml(acInitials(m.authorName))
      : acRobotSvg(m.authorName);
    const to = m.to ? `<span class="ac-msg-to">→ ${escHtml(m.to)}</span>` : '';
    const time = m.createdAt ? `<span class="ac-msg-time">${escHtml(acTime(m.createdAt))}</span>` : '';
    const kind = `<span class="ac-msg-kind ac-kind-${escHtml(m.authorKind)}">${escHtml(m.authorKind)}</span>`;
    return `<div class="ac-msg${mine}" style="--ac-color:${color}">` +
      `<div class="ac-avatar" aria-hidden="true" title="${escHtml(m.authorName)}">${avatar}</div>` +
      `<div class="ac-msg-main">` +
      `<div class="ac-msg-head"><span class="ac-msg-author">${escHtml(m.authorName)}</span>` +
      `${kind}${to}${time}</div>` +
      `<div class="ac-msg-body">${renderMarkdown(m.body)}</div>` +
      `<div class="ac-msg-foot"><button class="ac-reply-btn" onclick="replyToAgentChatById('${m.id}')" title="Responder ${escHtml(m.authorName)}">Responder</button></div>` +
      `</div></div>`;
  }).join('');
  const shouldStick = acForceScrollBottom || isChatSwitch || wasNearBottom;
  if (shouldStick) {
    box.scrollTop = box.scrollHeight;
    acStickToBottom = true;
    acPendingNewCount = 0;
  } else {
    // Preserva a posição de leitura; acumula contador p/ a pílula.
    box.scrollTop = prevScrollTop;
    acStickToBottom = false;
    if (messages.length > prevCount) acPendingNewCount += messages.length - prevCount;
  }
  acLastOpenChatId = detail.chat.id;
  acLastMsgCount = messages.length;
  acForceScrollBottom = false;
  renderAcNewMsgPill();
  renderAcReplyChip();
};

// ── Scroll inteligente: só desce sozinho se o usuário já estava no final ──
const acIsNearBottom = (box, threshold = 80) => {
  const el = box || $('ac-messages');
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
};

const acScrollToBottom = () => {
  const box = $('ac-messages');
  if (box) box.scrollTop = box.scrollHeight;
  acStickToBottom = true;
  acPendingNewCount = 0;
  renderAcNewMsgPill();
};

const acJumpToBottom = () => acScrollToBottom();

const renderAcNewMsgPill = () => {
  const pill = $('ac-new-msg');
  if (!pill) return;
  const show = !acStickToBottom && acPendingNewCount > 0;
  pill.hidden = !show;
  if (show) {
    pill.textContent = acPendingNewCount === 1
      ? '↓ 1 nova mensagem'
      : `↓ ${acPendingNewCount} novas mensagens`;
  }
};

const ensureAcScrollListener = () => {
  if (acScrollListenerOn) return;
  const box = $('ac-messages');
  if (!box) return;
  acScrollListenerOn = true;
  box.addEventListener('scroll', () => {
    acStickToBottom = acIsNearBottom(box);
    if (acStickToBottom) {
      acPendingNewCount = 0;
    }
    renderAcNewMsgPill();
  }, { passive: true });
};

const sendAgentChatMessage = async () => {
  if (!currentAgentChatId) return;
  const input = $('ac-input');
  const body = (input.value || '').trim();
  if (!body) return;
  const toMatch = body.match(/^@([\w-]+)\s+/);
  const to = toMatch ? toMatch[1] : (acReplyTo ? acReplyTo.name : undefined);
  try {
    const res = await fetch(`/agentchats/${currentAgentChatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, authorName: 'Você', ...(to ? { to } : {}) }),
    });
    if (!res.ok) throw new Error(await res.text());
    input.value = '';
    acReplyTo = null;
    renderAcReplyChip();
    acForceScrollBottom = true;
    await refreshCurrentAgentChat();
  } catch (err) {
    toast(err.message || 'Falha ao enviar');
  }
};

const copyAgentChatPrompt = async () => {
  if (!currentAgentChatId) return;
  try {
    const res = await fetch(`/agentchats/${currentAgentChatId}/prompt`);
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    if (!text.includes('Você é um agente do chat Docmap.')) {
      throw new Error('A API retornou um prompt inesperado');
    }
    copyToClipboard(text, 'Prompt do agente copiado');
  } catch (err) {
    toast(err.message || 'Falha ao copiar prompt');
  }
};

const deleteCurrentAgentChat = async () => {
  if (!currentAgentChatId) return;
  const ok = await confirmDialog('Excluir esta sala e todo o histórico?', {
    okLabel: 'Excluir',
    danger: true,
  });
  if (!ok) return;
  try {
    const res = await fetch(`/agentchats/${currentAgentChatId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    currentAgentChatId = null;
    currentAgentChatDetail = null;
    $('ac-empty').style.display = 'flex';
    $('ac-active').style.display = 'none';
    await loadAgentChatsList();
    toast('Sala excluída');
  } catch (err) {
    toast(err.message || 'Falha ao excluir');
  }
};

const scheduleAgentChatRefresh = () => {
  clearTimeout(agentChatRefreshTimer);
  agentChatRefreshTimer = setTimeout(async () => {
    if (currentMode !== 'agentchats') return;
    await loadAgentChatsList();
    if (currentAgentChatId) await refreshCurrentAgentChat();
  }, 180);
};

const ensureAgentChatEvents = () => {
  if (agentChatEventsOn) return;
  try {
    agentChatEventsOn = true;
    const src = new EventSource('/agentchats/events');
    for (const name of ['chat.message', 'chat.join', 'chat.leave', 'chat.updated', 'chat.deleted']) {
      src.addEventListener(name, scheduleAgentChatRefresh);
    }
  } catch {
    agentChatEventsOn = false;
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && acReplyTo) {
    cancelAcReply();
    return;
  }
  if (e.key === 'Enter' && document.activeElement?.id === 'ac-input') {
    sendAgentChatMessage();
  }
});
