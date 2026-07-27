import { html } from '../server/response.ts';

// Página standalone do canvas — self-contained (CSS + JS inline)
// Renderiza HTML recebido via WebSocket em um iframe sandboxed.
const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>docmap — canvas</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0f0f;--surface:#1a1a2e;--border:#2a2a3e;--text:#e0e0e0;--text-dim:#888;--accent:#6c5ce7;--hover:rgba(255,255,255,0.08)}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column;overflow:hidden}
#header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0;min-height:40px}
#header h1{font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px}
#header h1::before{content:"\\25C6";color:var(--accent)}
#status{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim)}
#status-dot{width:7px;height:7px;border-radius:50%;background:#f44336;transition:background .3s}
#status-dot.connected{background:#4caf50}
#status-dot.connecting{background:#ff9800;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
#conn-count{font-size:10px;background:rgba(255,255,255,.06);padding:1px 7px;border-radius:8px}
#actions{display:flex;gap:4px}
.btn{background:none;border:1px solid var(--border);color:var(--text);padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .15s}
.btn:hover{background:var(--hover)}
.btn-danger:hover{background:rgba(244,67,54,.15);border-color:#f44336}
#render-area{flex:1;position:relative;overflow:hidden}
#render-frame{width:100%;height:100%;border:none;background:#fff;display:block}
#empty-state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-dim);font-size:13px;pointer-events:none;transition:opacity .4s;z-index:1}
#empty-state.hidden{opacity:0}
#empty-state .ico{font-size:40px;margin-bottom:10px;opacity:.25}
#empty-state .hint{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:8px}
#empty-state code{background:rgba(255,255,255,.06);padding:3px 8px;border-radius:4px;font-size:12px;color:var(--accent);font-family:ui-monospace,monospace}
#toast{position:fixed;bottom:16px;right:16px;background:var(--surface);border:1px solid var(--border);padding:6px 14px;border-radius:6px;font-size:12px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:100}
#toast.show{opacity:1}
</style>
</head>
<body>

<div id="header">
  <h1>Canvas</h1>
  <div id="status">
    <span id="status-dot" class="connecting"></span>
    <span id="status-text">conectando...</span>
    <span id="conn-count"></span>
  </div>
  <div id="actions">
    <button class="btn btn-danger" onclick="clearCanvas()" title="Limpar canvas">✕ Limpar</button>
  </div>
</div>

<div id="render-area">
  <iframe id="render-frame" sandbox="allow-scripts"></iframe>
  <div id="empty-state">
    <div class="ico">🎨</div>
    <div>Canvas vazio</div>
    <div class="hint">
      <span>Envie HTML via API:</span>
      <code>POST /canvas/push { "html": "&lt;h1&gt;Ol&amp;aacute;&lt;/h1&gt;", "type": "replace" }</code>
    </div>
  </div>
</div>

<div id="toast"></div>

<script>
(function(){
  var frame = document.getElementById('render-frame');
  var empty = document.getElementById('empty-state');
  var dot = document.getElementById('status-dot');
  var stxt = document.getElementById('status-text');
  var cnt  = document.getElementById('conn-count');
  var toastEl = document.getElementById('toast');
  var reconnectAttempts = 0;
  var MAX_RECONNECT = 20;

  function setFrame(html){
    if (!frame || !empty) return;
    frame.srcdoc = html;
    empty.classList.toggle('hidden', html.length > 0);
  }

  function showToast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._hide);
    toastEl._hide = setTimeout(function(){ toastEl.classList.remove('show'); }, 2500);
  }

  window.clearCanvas = function(){
    showToast('Limpando...');
    fetch('/canvas/clear', { method:'POST' })
      .then(function(){ showToast('Canvas limpo'); })
      .catch(function(){ showToast('Erro ao limpar'); });
  };

  function connect(){
    if (reconnectAttempts >= MAX_RECONNECT) {
      if (stxt) stxt.textContent = 'falha na conexao';
      if (dot) dot.className = '';
      return;
    }
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var ws = new WebSocket(proto + '//' + location.host + '/canvas/ws');

    ws.onopen = function(){
      reconnectAttempts = 0;
      if (dot) dot.className = 'connected';
      if (stxt) stxt.textContent = 'conectado';
    };

    ws.onmessage = function(e){
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'replace') setFrame(msg.html || '');
      } catch(err){
        console.warn('canvas WS: invalid message', err, e.data);
      }
    };

    ws.onclose = function(){
      reconnectAttempts++;
      if (dot) dot.className = 'connecting';
      if (stxt) stxt.textContent = 'reconectando...';
      var delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts - 1), 30000);
      delay += Math.random() * 1000;
      setTimeout(connect, delay);
    };

    ws.onerror = function(){
      if (dot) dot.className = '';
      if (stxt) stxt.textContent = 'erro';
    };
  }

  // Começa com iframe vazio
  setFrame('<!DOCTYPE html><html><head></head><body></body></html>');
  connect();
})();
<\/script>
</body>
</html>`;

export const serveCanvasPage = (): Promise<Response> =>
  Promise.resolve(html(PAGE));
