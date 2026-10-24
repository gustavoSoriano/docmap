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
  $('ac-sidebar-count').textContent = allAgentChats.length === 1
    ? '1 sala'
    : allAgentChats.length + ' salas';
  const emptyMsg = allAgentChats.length
    ? 'Nenhuma sala encontrada.'
    : 'Nenhuma sala ainda. Crie a primeira.';
  list.innerHTML = filtered.map((c) => {
    const tags = c.tags || [];
    const shown = tags.slice(0, 2)
      .map((t) => `<span class="chip">${escHtml(t)}</span>`).join('');
    const extra = tags.length > 2 ? `<span class="chip">+${tags.length - 2}</span>` : '';
    const live = acIsRecent(c.updatedAt)
      ? '<span class="status ok ac-card-live" title="Atividade recente"></span>'
      : '';
    return `<button class="ac-card ${c.id === currentAgentChatId ? 'active' : ''}" onclick="openAgentChat('${c.id}')">` +
      `<div class="ac-card-head"><span class="ac-card-title">${escHtml(c.title || 'Sem título')}</span>${live}</div>` +
      ((c.objective || '').trim() ? `<div class="ac-card-meta">${escHtml((c.objective || '').slice(0, 140))}</div>` : '') +
      `<div class="ac-card-foot"><span class="ac-card-tags">${shown}${extra}</span>` +
      `<span class="ac-card-time">${escHtml(acAgo(c.updatedAt))}</span></div>` +
      `</button>`;
  }).join('') || `<div class="ac-list-empty">${emptyMsg}</div>`;
};

// ── Tempo relativo (apresentação a partir de updatedAt) ──
const acIsRecent = (iso) => {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) && Date.now() - t < 10 * 60 * 1000;
};

const acAgo = (iso) => {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '';
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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

// ── Identidade visual por autor (matiz determinístico + iniciais) ──
// Matiz entre 75 e 330: evita o âmbar (reservado) e o vermelho (status).
const acHue = (name) => {
  const str = String(name || '?').toLowerCase();
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 255;
  return 75 + h;
};

const acInitials = (name) => {
  const parts = String(name || '?').trim().split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Destaca @menções no HTML já sanitizado (ignora code, pre e links).
const acHighlightMentions = (html) => {
  const box = document.createElement('div');
  box.innerHTML = html;
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.parentElement.closest('code, pre, a') && /@[\w-]+/.test(n.nodeValue)) nodes.push(n);
  }
  for (const n of nodes) {
    const frag = document.createDocumentFragment();
    let last = 0;
    n.nodeValue.replace(/(^|[^\w@])@([\w-]+)/g, (m, pre, name, idx) => {
      const start = idx + pre.length;
      frag.append(n.nodeValue.slice(last, start));
      const span = document.createElement('span');
      span.className = 'ac-mention';
      span.textContent = '@' + name;
      frag.append(span);
      last = start + name.length + 1;
      return m;
    });
    frag.append(n.nodeValue.slice(last));
    n.replaceWith(frag);
  }
  return box.innerHTML;
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
  $('ac-reply-label').innerHTML =
    `<span class="ac-reply-to">Respondendo a ${escHtml(acReplyTo.name)}</span>` +
    `<span class="ac-reply-snippet">${escHtml(acReplyTo.snippet.replace(/[*_`#>]+/g, ''))}</span>`;
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
  $('ac-toolbar-title').title = detail.chat.title || '';
  $('ac-toolbar-objective').textContent = detail.chat.objective ||
    'Sem objetivo definido. Edite e diga aos agentes o que fazer.';
  $('ac-toolbar-tags').innerHTML = (detail.chat.tags || [])
    .map((t) => `<span class="chip">${escHtml(t)}</span>`).join('');
  if (acLastOpenChatId !== detail.chat.id) acSetObjectiveOpen(false);
  acSyncObjectiveToggle();

  const parts = detail.participants || [];
  $('ac-participants').innerHTML = parts.length
    ? parts.map((p) => {
      const on = p.presence === 'online';
      const role = [p.tool, p.model].filter(Boolean)
        .map((r) => `<span>${escHtml(r)}</span>`).join('');
      return `<span class="ac-presence ${on ? 'online' : ''}" style="--h:${acHue(p.name)}" title="${escHtml(p.presence)}">` +
        `<span class="ac-avatar" aria-hidden="true">${escHtml(acInitials(p.name))}</span>` +
        `<span class="ac-presence-text"><span class="ac-presence-name">${escHtml(p.name)}</span>` +
        `<span class="ac-presence-role">${role}</span></span>` +
        (on ? '<span class="status ok ac-presence-state">online</span>' : '') +
        `</span>`;
    }).join('')
    : '<span class="ac-participants-empty">Nenhum agente conectado. Copie o prompt e chame os agentes.</span>';

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
  let prev = null;
  box.innerHTML = messages.map((m) => {
    if (m.authorKind === 'system') {
      prev = null;
      return `<div class="ac-msg system"><span>${escHtml(m.body)}</span></div>`;
    }
    const isUser = m.authorKind === 'user';
    const gap = prev && m.createdAt && prev.createdAt
      ? Date.parse(m.createdAt) - Date.parse(prev.createdAt) : 0;
    const cont = !!prev && prev.authorKind === m.authorKind &&
      prev.authorName === m.authorName && (prev.to || '') === (m.to || '') &&
      gap < 5 * 60 * 1000;
    prev = m;
    const time = m.createdAt ? acTime(m.createdAt) : '';
    const to = m.to
      ? `<span class="ac-msg-to">${ICON('arrow-right')}${escHtml(m.to)}</span>` : '';
    const avatar = isUser || cont ? '' : `<div class="ac-avatar" aria-hidden="true" title="${escHtml(m.authorName)}">${escHtml(acInitials(m.authorName))}</div>`;
    const head = cont ? '' :
      `<div class="ac-msg-head"><span class="ac-msg-author">${escHtml(m.authorName)}</span>${to}` +
      `<span class="ac-msg-time">${escHtml(time)}</span></div>`;
    return `<div class="ac-msg${isUser ? ' mine' : ''}${cont ? ' cont' : ''}" style="--h:${acHue(m.authorName)}">` +
      avatar +
      `<div class="ac-msg-main">` + head +
      `<div class="ac-bubble-row"><div class="ac-msg-body">${acHighlightMentions(renderMarkdown(m.body))}</div>` +
      `<div class="ac-msg-foot">${cont ? `<span class="ac-msg-time">${escHtml(time)}</span>` : ''}` +
      `<button class="ac-reply-btn icon-btn" onclick="replyToAgentChatById('${m.id}')" title="Responder ${escHtml(m.authorName)}" aria-label="Responder ${escHtml(m.authorName)}">${ICON('reply')}</button></div>` +
      `</div></div></div>`;
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

// ── Objetivo recolhível (2 linhas + expandir) ──
const acSetObjectiveOpen = (open) => {
  $('ac-toolbar')?.classList.toggle('open', open);
  $('ac-objective-toggle')?.setAttribute('aria-expanded', String(open));
};

const acToggleObjective = () =>
  acSetObjectiveOpen(!$('ac-toolbar').classList.contains('open'));

// Só oferece o botão quando o texto realmente passa de 2 linhas.
const acSyncObjectiveToggle = () => {
  const obj = $('ac-toolbar-objective');
  const btn = $('ac-objective-toggle');
  if (!obj || !btn) return;
  const wasOpen = $('ac-toolbar').classList.contains('open');
  $('ac-toolbar').classList.remove('open');
  const overflows = obj.scrollHeight > obj.clientHeight + 1;
  $('ac-toolbar').classList.toggle('open', wasOpen);
  btn.hidden = !overflows && !wasOpen;
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
    pill.innerHTML = ICON('arrow-down') + (acPendingNewCount === 1
      ? ' 1 nova mensagem'
      : ` ${acPendingNewCount} novas mensagens`);
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
