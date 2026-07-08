// ════ AI Chat — provider-agnostic via proxy /ai/chat ════
// Backend escolhe adapter (ollama | deepseek) e devolve NDJSON normalizado.
// A chave da DeepSeek nunca chega ao webview.

const DOCMAP_API = 'http://127.0.0.1:3333';

// DELETE bloqueado — proteção contra ações destrutivas acidentais
const BLOCKED_METHODS = ['DELETE'];

const HTTP_TOOL = {
  type: 'function',
  function: {
    name: 'http_request',
    description: 'Faz uma requisição HTTP para a API do docmap. Use para ler e criar notas, diagramas, skills e macros.',
    parameters: {
      type: 'object',
      required: ['method', 'path'],
      properties: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT'], description: 'Método HTTP. DELETE não é permitido.' },
        path:   { type: 'string', description: 'Caminho da API. Ex: /notes, /diagrams, /skills/nome' },
        body:   { type: 'object', description: 'Body JSON para POST e PUT (opcional)' },
      },
    },
  },
};

// system prompt vem do endpoint /system/skill
let systemPrompt = null;
const getSystemPrompt = async () => {
  if (systemPrompt) return systemPrompt;
  try {
    const res = await fetch('/system/skill');
    systemPrompt = await res.text();
  } catch {
    systemPrompt = 'Você é um assistente do docmap. Use http_request para interagir com a API em http://127.0.0.1:3334.';
  }
  return systemPrompt;
};

// ── Estado ──
let chatMessages  = [];
let chatOpen      = false;
let chatStreaming = false;
let chatAbort     = null;
let chatProvider  = 'ollama';  // default; sobrescrito no boot por /ai/config
let chatMinimized = false;
let chatDragged   = false;
let chatDrag      = { active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

const CHAT_LAYOUT_KEY = 'docmap-chat-layout';

// ── Provider config (persiste no KV) ──
const loadProvider = async () => {
  try {
    const res = await fetch('/ai/config');
    if (!res.ok) return;
    const cfg = await res.json();
    chatProvider = cfg.provider ?? 'ollama';
    const sel = $('chat-provider');
    if (sel) sel.value = chatProvider;
    // se deepseek não tem chave, desabilita a opção
    if (cfg.deepseekKey === false) {
      const opt = sel?.querySelector('option[value="deepseek"]');
      if (opt) opt.disabled = true;
    }
  } catch { /* ignora — fica no default */ }
};

const changeProvider = async (provider) => {
  if (provider === chatProvider) return;
  if (chatStreaming) return; // não troca com stream rolando
  try {
    const res = await fetch('/ai/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    if (!res.ok) {
      const sel = $('chat-provider');
      if (sel) sel.value = chatProvider;
      return;
    }
    chatProvider = provider;
    // ao trocar de provider, zera o histórico (modelos têm schemas de tool diferentes)
    chatMessages = [];
    $('chat-feed').innerHTML = '';
    appendChatBubble('assistant', `Provider trocado para ${provider}. Histórico limpo. Como posso ajudar?`);
  } catch { /* ignora */ }
};

// ── Executar tool ──
const executeTool = async (toolCall) => {
  const args = toolCall.function.arguments;
  const params = typeof args === 'string' ? JSON.parse(args) : args;
  const method = (params.method || 'GET').toUpperCase();
  const path   = params.path || '/';
  const body   = params.body;

  if (BLOCKED_METHODS.includes(method)) {
    return { error: `Método ${method} bloqueado por segurança.` };
  }

  try {
    const res = await fetch(`${DOCMAP_API}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { response: text }; }
  } catch (err) {
    return { error: err.message };
  }
};

// ── Chamar o proxy /ai/chat (provider-agnostic, stream NDJSON) ──
const callProvider = async (messages) => {
  const controller = new AbortController();
  chatAbort = controller;

  const res = await fetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      messages,
      tools: [HTTP_TOOL],
      provider: chatProvider,
    }),
  });

  if (!res.ok) throw new Error(`proxy /ai/chat ${res.status}: ${await res.text()}`);

  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let buf = '';
  let fullContent = '';
  let toolCalls = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error(chunk.error);
        if (chunk.content) {
          fullContent += chunk.content;
          streamToChat(chunk.content);
        }
        if (chunk.toolCalls?.length) {
          toolCalls = toolCalls.concat(chunk.toolCalls);
        }
      } catch (err) {
        // linha incompleta OU erro embutido no stream — relança erros explícitos
        if (err.message && err.message !== 'Unexpected end of JSON input') throw err;
      }
    }
  }

  return { content: fullContent, toolCalls };
};

// ── Enviar mensagem (com tool loop) ──
const sendChatMessage = async () => {
  if (chatStreaming) return;
  const input = $('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = '';

  const prompt = await getSystemPrompt();
  if (!chatMessages.length) {
    chatMessages.push({ role: 'system', content: prompt });
  }

  chatMessages.push({ role: 'user', content: text });
  appendChatBubble('user', text);

  setChatStreaming(true);
  const assistantEl = appendChatBubble('assistant', '');

  try {
    let messages = [...chatMessages];

    // loop de tool calling
    while (true) {
      const { content, toolCalls } = await callProvider(messages);

      if (!toolCalls.length) {
        // resposta final — já foi streamada, só registra no histórico
        chatMessages.push({ role: 'assistant', content });
        break;
      }

      // tem tool calls — executa e continua
      messages.push({ role: 'assistant', content, tool_calls: toolCalls });
      chatMessages.push({ role: 'assistant', content, tool_calls: toolCalls });

      for (const tc of toolCalls) {
        const result = await executeTool(tc);
        appendToolCall(assistantEl, tc.function.name, tc.function.arguments, result);
        // deepseek exige tool_call_id casando com o id do tool_call original
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        chatMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }

      // pede pro modelo continuar depois dos tool results
      streamToChat('\n');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      appendChatBubble('error', `Erro: ${err.message}`);
    }
  } finally {
    chatAbort = null;
    setChatStreaming(false);
  }
};

// ── UI helpers ──
let currentStreamEl = null;

const appendChatBubble = (role, text) => {
  const feed = $('chat-feed');
  const div  = document.createElement('div');
  div.className = `chat-bubble chat-${role}`;
  if (text) div.textContent = text;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  currentStreamEl = role === 'assistant' ? div : null;
  return div;
};

const streamToChat = (chunk) => {
  if (!currentStreamEl) return;
  currentStreamEl.textContent += chunk;
  $('chat-feed').scrollTop = $('chat-feed').scrollHeight;
};

const appendToolCall = (parentEl, name, args, result) => {
  const div = document.createElement('div');
  div.className = 'chat-tool-call';
  const argsObj = typeof args === 'string' ? JSON.parse(args) : args;
  const method = argsObj.method || 'GET';
  const path   = argsObj.path   || '';
  div.innerHTML =
    `<span class="tool-method ${method.toLowerCase()}">${escHtml(method)}</span> ` +
    `<span class="tool-path">${escHtml(path)}</span>` +
    (argsObj.body ? `<div class="tool-body">${escHtml(JSON.stringify(argsObj.body, null, 2))}</div>` : '') +
    `<div class="tool-result">${escHtml(JSON.stringify(result).slice(0, 300))}${JSON.stringify(result).length > 300 ? '…' : ''}</div>`;

  // insere antes do texto já streamado (ou no final)
  const feed = $('chat-feed');
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
};

const setChatStreaming = (on) => {
  chatStreaming = on;
  const btn  = $('chat-send');
  const stop = $('chat-stop');
  btn.disabled    = on;
  stop.style.display = on ? 'flex' : 'none';
};

// ── Layout: posição e minimização ──
const loadChatLayout = () => {
  try {
    const raw = localStorage.getItem(CHAT_LAYOUT_KEY);
    if (!raw) return;
    const layout = JSON.parse(raw);
    if (typeof layout.minimized === 'boolean') chatMinimized = layout.minimized;
    if (layout.left != null && layout.top != null) {
      const panel = $('chat-panel');
      panel.classList.add('dragged');
      panel.style.left = `${layout.left}px`;
      panel.style.top = `${layout.top}px`;
      chatDragged = true;
    }
    applyMinimizeState();
  } catch { /* ignora layout corrompido */ }
};

const saveChatLayout = () => {
  try {
    const panel = $('chat-panel');
    const layout = { minimized: chatMinimized };
    if (chatDragged) {
      layout.left = parseInt(panel.style.left || '0', 10);
      layout.top = parseInt(panel.style.top || '0', 10);
    }
    localStorage.setItem(CHAT_LAYOUT_KEY, JSON.stringify(layout));
  } catch { /* ignora quota excedida */ }
};

const applyMinimizeState = () => {
  const panel = $('chat-panel');
  const icon = $('chat-minimize-icon');
  panel.classList.toggle('minimized', chatMinimized);
  if (icon) {
    icon.dataset.icon = chatMinimized ? 'maximize' : 'minus';
    icon.dataset.hydrated = '';
    icon.innerHTML = ICON(chatMinimized ? 'maximize' : 'minus');
    icon.dataset.hydrated = '1';
  }
  const btn = $('chat-minimize');
  if (btn) btn.title = chatMinimized ? 'Expandir' : 'Minimizar';
};

const toggleMinimizeChat = () => {
  chatMinimized = !chatMinimized;
  applyMinimizeState();
  saveChatLayout();
};

const clampChatPosition = (left, top) => {
  const panel = $('chat-panel');
  const rect = panel.getBoundingClientRect();
  const minVisible = 48; // área mínima visível
  const maxLeft = window.innerWidth - minVisible;
  const maxTop = window.innerHeight - minVisible;
  return {
    left: Math.max(minVisible - rect.width, Math.min(left, maxLeft)),
    top: Math.max(minVisible - rect.height, Math.min(top, maxTop)),
  };
};

const startChatDrag = (e) => {
  if (e.button !== 0) return;
  // não arrasta ao interagir com controles do header
  if (e.target.closest('#chat-provider, .ghost-btn')) return;

  const panel = $('chat-panel');
  const rect = panel.getBoundingClientRect();
  chatDrag.active = true;
  chatDrag.startX = e.clientX;
  chatDrag.startY = e.clientY;
  chatDrag.startLeft = rect.left;
  chatDrag.startTop = rect.top;

  panel.classList.add('dragged');
  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.top}px`;
  panel.style.right = 'auto';
  panel.style.transform = 'none';

  window.addEventListener('mousemove', onChatDrag);
  window.addEventListener('mouseup', stopChatDrag);
  e.preventDefault();
};

const onChatDrag = (e) => {
  if (!chatDrag.active) return;
  const dx = e.clientX - chatDrag.startX;
  const dy = e.clientY - chatDrag.startY;
  const { left, top } = clampChatPosition(chatDrag.startLeft + dx, chatDrag.startTop + dy);
  const panel = $('chat-panel');
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
};

const stopChatDrag = () => {
  if (!chatDrag.active) return;
  chatDrag.active = false;
  chatDragged = true;
  window.removeEventListener('mousemove', onChatDrag);
  window.removeEventListener('mouseup', stopChatDrag);
  saveChatLayout();
};

// ── Abrir / fechar FAB ──
const toggleChat = () => {
  chatOpen = !chatOpen;
  const panel = $('chat-panel');
  panel.classList.toggle('open', chatOpen);
  $('chat-fab').classList.toggle('active', chatOpen);
  if (chatOpen) {
    if (chatDragged) {
      panel.style.transform = 'none';
      panel.style.right = 'auto';
    }
    if (!chatMessages.length) {
      appendChatBubble('assistant', 'Olá! Posso acessar suas notas, diagramas, skills e macros. Como posso ajudar?');
    }
    setTimeout(() => $('chat-input').focus(), 150);
  }
};

const stopChat = () => {
  chatAbort?.abort();
  chatAbort = null;
  setChatStreaming(false);
};

const clearChat = async () => {
  const ok = await confirmDialog('Limpar o histórico da conversa?', { okLabel: 'Limpar' });
  if (!ok) return;
  chatMessages = [];
  $('chat-feed').innerHTML = '';
  appendChatBubble('assistant', 'Histórico limpo. Como posso ajudar?');
};

// ── Event listeners ──
document.addEventListener('DOMContentLoaded', () => {
  loadProvider();
  loadChatLayout();

  const sel = $('chat-provider');
  if (sel) sel.addEventListener('change', (e) => changeProvider(e.target.value));

  $('chat-header').addEventListener('mousedown', startChatDrag);

  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  // auto-resize textarea
  $('chat-input').addEventListener('input', function() {
    this.style.height = '';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
  });
  // fechar com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOpen) toggleChat();
  });
});
