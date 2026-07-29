// ════ AI Chat — provider-agnostic via proxy /ai/chat ════
// Backend escolhe adapter (ollama | deepseek) e devolve NDJSON normalizado.
// A chave da DeepSeek nunca chega ao webview.

const DOCMAP_API = 'http://127.0.0.1:3333';

// DELETE bloqueado em http_request — proteção contra ações destrutivas acidentais
const BLOCKED_METHODS = ['DELETE'];

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'http_request',
      description: 'Faz uma requisição HTTP para a API do docmap. Use para notas, diagramas, skills, macros, podcasts, workflows de agentes (/workflows, /agents, /orchestrator) e canvas realtime.',
      parameters: {
        type: 'object',
        required: ['method', 'path'],
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT'], description: 'Método HTTP. DELETE não é permitido.' },
          path:   { type: 'string', description: 'Caminho da API. Ex: /notes, /skills/nome, /workflows, /orchestrator/inbox' },
          body:   { type: 'object', description: 'Body JSON para POST e PUT (opcional)', properties: {}, additionalProperties: true },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lê o conteúdo bruto de um arquivo no workspace atual.',
      parameters: {
        type: 'object',
        required: ['file'],
        properties: {
          file: { type: 'string', description: 'Caminho relativo do arquivo no workspace. Ex: src/main.ts' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'Lista todos os arquivos do workspace atual, opcionalmente filtrados por padrão.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex opcional para filtrar caminhos. Ex: \\.md$, src/.*\\.ts' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_code',
      description: 'Busca texto em qualquer arquivo do workspace (não só markdown).',
      parameters: {
        type: 'object',
        required: ['q'],
        properties: {
          q:     { type: 'string', description: 'Termo de busca' },
          glob:  { type: 'string', description: 'Filtro de caminho estilo glob. Ex: src/**/*.ts' },
          regex: { type: 'boolean', description: 'Se true, trata q como regex' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_status',
      description: 'Retorna git status --porcelain do workspace.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_diff',
      description: 'Retorna git diff do workspace (alterações não commitadas).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_log',
      description: 'Retorna git log --oneline recente.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Quantidade de commits (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Executa um comando no terminal dentro do workspace. SEMPRE peça aprovação do usuário antes de usar. Use apenas para linters ou comandos de análise (ex: deno lint, eslint).',
      parameters: {
        type: 'object',
        required: ['command'],
        properties: {
          command: { type: 'string', description: 'Comando principal. Ex: deno' },
          args:    { type: 'array', items: { type: 'string' }, description: 'Argumentos. Ex: ["lint", "src/"]' },
        },
      },
    },
  },
];

// system prompt normal vem do endpoint /system/skill
let systemPrompt = null;
const getSystemPrompt = async () => {
  if (systemPrompt) return systemPrompt;
  try {
    const res = await fetch('/system/skill');
    systemPrompt = await res.text();
  } catch {
    systemPrompt = 'Você é um assistente do docmap. Use as ferramentas disponíveis para interagir com o workspace, notas e diagramas.';
  }
  return systemPrompt;
};

// ── Estado ──
let chatMessages  = [];
let chatStreaming = false;
let chatAbort     = null;
let chatProvider  = 'ollama';  // default; sobrescrito no boot por /ai/config
let agentOpen     = false;

const AGENT_OPEN_KEY = 'docmap-agent-open';

// ── Provider config (persiste no KV) ──
const loadProvider = async () => {
  try {
    const res = await fetch('/ai/config');
    if (!res.ok) return;
    const cfg = await res.json();
    chatProvider = cfg.provider ?? 'ollama';
    const sel = $('chat-provider');
    if (sel) sel.value = chatProvider;
    if (cfg.deepseekKey === false) {
      const opt = sel?.querySelector('option[value="deepseek"]');
      if (opt) opt.disabled = true;
    }
  } catch { /* ignora — fica no default */ }
};

const changeProvider = async (provider) => {
  if (provider === chatProvider) return;
  if (chatStreaming) return;
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
    chatMessages = [];
    $('chat-feed').innerHTML = '';
    appendChatBubble('assistant', `Provider trocado para ${provider}. Histórico limpo. Como posso ajudar?`);
  } catch { /* ignora */ }
};

// ── Executar tool ──
const executeTool = async (toolCall) => {
  const args = toolCall.function.arguments;
  const params = typeof args === 'string' ? JSON.parse(args) : args;
  const name = toolCall.function.name;

  if (name === 'http_request') {
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
  }

  if (name === 'read_file') {
    const file = params.file;
    if (!file) return { error: 'file é obrigatório' };
    try {
      const res = await fetch(`${DOCMAP_API}/content?file=${encodeURIComponent(file)}`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'list_files') {
    const qs = params.pattern ? `?pattern=${encodeURIComponent(params.pattern)}` : '';
    try {
      const res = await fetch(`${DOCMAP_API}/workspace/files${qs}`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'search_code') {
    const q = params.q;
    if (!q) return { error: 'q é obrigatório' };
    const qp = new URLSearchParams({ q });
    if (params.glob) qp.set('glob', params.glob);
    if (params.regex) qp.set('regex', 'true');
    try {
      const res = await fetch(`${DOCMAP_API}/code/search?${qp.toString()}`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'git_status') {
    try {
      const res = await fetch(`${DOCMAP_API}/git/status`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'git_diff') {
    try {
      const res = await fetch(`${DOCMAP_API}/git/diff`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'git_log') {
    const limit = params.limit ?? 20;
    try {
      const res = await fetch(`${DOCMAP_API}/git/log?limit=${limit}`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'run_command') {
    const command = params.command;
    const args    = params.args || [];
    if (!command) return { error: 'command é obrigatório' };

    const fullCmd = [command, ...args].join(' ');
    const ok = await confirmDialog(`Permitir execução do comando?\n\n${fullCmd}`, { okLabel: 'Executar' });
    if (!ok) return { blocked: true, reason: 'Usuário cancelou a execução.' };

    try {
      const res = await fetch(`${DOCMAP_API}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, args }),
      });
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  return { error: `Tool desconhecida: ${name}` };
};

// ── Chamar o proxy /ai/chat (provider-agnostic, stream NDJSON) ──
const callProvider = async (messages) => {
  const controller = new AbortController();
  chatAbort = controller;

  // timeout de 5 minutos — evita travamento com modelos pesados
  let timedOut = false;
  const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, 300000);

  const res = await fetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      messages,
      tools: TOOLS,
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
        if (err.message && err.message !== 'Unexpected end of JSON input') throw err;
      }
    }
  }

  clearTimeout(timeoutId);
  if (timedOut) throw new Error('Timeout: o modelo demorou mais de 5 minutos para responder.');
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

    while (true) {
      const { content, toolCalls } = await callProvider(messages);

      if (!toolCalls.length) {
        chatMessages.push({ role: 'assistant', content });
        break;
      }

      messages.push({ role: 'assistant', content, tool_calls: toolCalls });
      chatMessages.push({ role: 'assistant', content, tool_calls: toolCalls });

      for (const tc of toolCalls) {
        const result = await executeTool(tc);
        appendToolCall(tc.function.name, tc.function.arguments, result);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        chatMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }

      // reseta o stream element para o próximo ciclo criar um novo bubble
      currentStreamEl = appendChatBubble('assistant', '');
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

const appendToolCall = (name, args, result) => {
  const feed = $('chat-feed');
  const div = document.createElement('div');
  div.className = 'chat-tool-call';
  const argsObj = typeof args === 'string' ? JSON.parse(args) : args;
  const summary = toolCallSummary(name, argsObj);
  const resultStr = JSON.stringify(result);
  const bodyStr = argsObj.body ? JSON.stringify(argsObj.body, null, 2) : null;

  div.innerHTML =
    `<div class="tool-summary-row">` +
      `<button class="tool-toggle" title="Ver detalhes">▶</button>` +
      `<span class="tool-name">${escHtml(name)}</span> ` +
      `<span class="tool-summary">${escHtml(summary)}</span>` +
    `</div>` +
    `<div class="tool-details">` +
      (bodyStr ? `<div class="tool-body">${escHtml(bodyStr)}</div>` : '') +
      `<div class="tool-result">${escHtml(resultStr.slice(0, 500))}${resultStr.length > 500 ? '…' : ''}</div>` +
    `</div>`;

  div.querySelector('.tool-toggle').addEventListener('click', (e) => {
    const open = div.querySelector('.tool-details').classList.toggle('open');
    e.currentTarget.textContent = open ? '▼' : '▶';
  });

  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
};

const toolCallSummary = (name, args) => {
  if (name === 'http_request') return `${args.method || 'GET'} ${args.path || '/'}`;
  if (name === 'read_file')    return args.file;
  if (name === 'list_files')   return args.pattern || 'todos';
  if (name === 'search_code')  return `${args.q}${args.glob ? ` glob:${args.glob}` : ''}`;
  if (name === 'git_status')   return 'git status';
  if (name === 'git_diff')     return 'git diff';
  if (name === 'git_log')      return `git log -n${args.limit || 20}`;
  if (name === 'run_command')  return `${args.command} ${(args.args || []).join(' ')}`;
  return JSON.stringify(args);
};

const setChatStreaming = (on) => {
  chatStreaming = on;
  const btn  = $('chat-send');
  const stop = $('chat-stop');
  btn.disabled    = on;
  stop.style.display = on ? 'flex' : 'none';
};

// ── Sidebar: abrir / recolher (persiste no localStorage) ──
const setAgentOpen = (open, persist = true) => {
  agentOpen = open;
  const panel = $('agent-panel');
  if (!panel) return;
  panel.classList.toggle('open', open);
  if (persist) saveAgentState();
  if (open) {
    if (!chatMessages.length) {
      appendChatBubble('assistant', 'Olá! Posso acessar suas notas, diagramas, skills e macros. Como posso ajudar?');
    }
    setTimeout(() => $('chat-input')?.focus(), 180);
  }
};

const toggleAgent = () => setAgentOpen(!agentOpen);

const loadAgentState = () => {
  let open = false;
  try { open = localStorage.getItem(AGENT_OPEN_KEY) === '1'; } catch { /* ignora */ }
  setAgentOpen(open, false);
};

const saveAgentState = () => {
  try { localStorage.setItem(AGENT_OPEN_KEY, agentOpen ? '1' : '0'); } catch { /* ignora quota */ }
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
  loadAgentState();

  const sel = $('chat-provider');
  if (sel) sel.addEventListener('change', (e) => changeProvider(e.target.value));

  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  $('chat-input').addEventListener('input', function() {
    this.style.height = '';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && agentOpen) toggleAgent();
  });
});
