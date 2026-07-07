// ════ AI Chat — Ollama local com http_request tool ════

const OLLAMA_URL  = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'gemma4:12b';
// usa :3333 (UI server) — garantido no ar se o app está rodando
// :3334 é pra IAs externas; o chat embutido não precisa depender dele
const DOCMAP_API  = 'http://127.0.0.1:3333';

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
let chatMessages  = []; // histórico da conversa
let chatOpen      = false;
let chatStreaming  = false;
let chatAbort     = null;

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

// ── Chamar Ollama com tool loop ──
const callOllama = async (messages) => {
  const controller = new AbortController();
  chatAbort = controller;

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model:    OLLAMA_MODEL,
      messages,
      tools:    [HTTP_TOOL],
      stream:   true,
    }),
  });

  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);

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
        const msg = chunk.message;
        if (!msg) continue;

        if (msg.content) {
          fullContent += msg.content;
          streamToChat(msg.content);
        }
        if (msg.tool_calls?.length) {
          toolCalls = toolCalls.concat(msg.tool_calls);
        }
      } catch { /* linha incompleta */ }
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
      const { content, toolCalls } = await callOllama(messages);

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
        messages.push({ role: 'tool', content: JSON.stringify(result) });
        chatMessages.push({ role: 'tool', content: JSON.stringify(result) });
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

// ── Abrir / fechar FAB ──
const toggleChat = () => {
  chatOpen = !chatOpen;
  $('chat-panel').classList.toggle('open', chatOpen);
  $('chat-fab').classList.toggle('active', chatOpen);
  if (chatOpen && !chatMessages.length) {
    appendChatBubble('assistant', 'Olá! Posso acessar suas notas, diagramas, skills e macros. Como posso ajudar?');
  }
  if (chatOpen) setTimeout(() => $('chat-input').focus(), 150);
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
