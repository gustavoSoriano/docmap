import { html } from '../server/response.ts';

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>docmap — canvas</title>
<link rel="stylesheet" href="/canvas/vendor/quickdraw/quickdraw.css">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0f0f;--border:#2a2a3e;--text:#e0e0e0;--text-dim:#888;--accent:#6c5ce7;--hover:rgba(255,255,255,0.08)}
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);display:flex;flex-direction:column;position:fixed;inset:0}
#header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:#0f1217;border-bottom:1px solid var(--border);flex-shrink:0;min-height:40px;gap:8px}
#header h1{font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;white-space:nowrap}
#header h1::before{content:"\\25C6";color:var(--accent)}
#tablet-url{font-size:11px;color:var(--text-dim);font-family:ui-monospace,monospace;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tablet-url:hover{color:var(--accent)}
#tablet-url b{color:var(--text);font-weight:500}
#status{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);white-space:nowrap}
#status-dot{width:7px;height:7px;border-radius:50%;background:#f44336;transition:background .3s}
#status-dot.connected{background:#4caf50}
#status-dot.connecting{background:#ff9800;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
#conn-count{font-size:10px;background:rgba(255,255,255,.06);padding:1px 7px;border-radius:8px}
#actions{display:flex;gap:4px}
.btn{background:none;border:1px solid var(--border);color:var(--text);padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn:hover{background:var(--hover)}
.btn-danger:hover{background:rgba(244,67,54,.15);border-color:#f44336}
#board{flex:1;position:relative;touch-action:none}
#board .qd-watermark{display:none}
#toast{position:fixed;bottom:16px;right:16px;background:#1a1a2e;border:1px solid var(--border);padding:6px 14px;border-radius:6px;font-size:12px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:100}
#toast.show{opacity:1}
</style>
</head>
<body>

<div id="header">
  <h1>Canvas</h1>
  <span id="tablet-url" title="Clique para copiar — abra no tablet">…</span>
  <div id="status">
    <span id="status-dot" class="connecting"></span>
    <span id="status-text">conectando...</span>
    <span id="conn-count" title="pessoas no board"></span>
  </div>
  <div id="actions">
    <button class="btn btn-danger" onclick="clearBoard()" title="Apagar tudo (para todos)">✕ Limpar</button>
  </div>
</div>

<div id="board"></div>
<div id="toast"></div>

<script type="module">
import { createQuickdraw } from '/canvas/vendor/quickdraw/index.js';

var boardEl = document.getElementById('board');
var dot = document.getElementById('status-dot');
var stxt = document.getElementById('status-text');
var cnt = document.getElementById('conn-count');
var urlEl = document.getElementById('tablet-url');
var toastEl = document.getElementById('toast');
var reconnectAttempts = 0;
var MAX_RECONNECT = 20;
var ws = null;
var fittedOnce = false;

var board = createQuickdraw({
  container: boardEl,
  theme: 'dark',
  grid: 'dots',
  watermark: false,
});
var store = board.editor.store;

function showToast(msg){
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._hide);
  toastEl._hide = setTimeout(function(){ toastEl.classList.remove('show'); }, 2500);
}

// Envia ao servidor só edições locais ('user'). Diffs 'remote' aplicados
// abaixo não re-emitem (filtro do listen) — sem loop de eco.
store.listen(function(diff){
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'diff', diff: diff }));
  }
  // Sem fila offline: diffs desenhados desconectado são descartados para
  // não ressuscitar records que outros apagaram nesse meio-tempo.
}, { source: 'user' });

// ── Frame para a IA ──
// Todo viewer exporta o board (debounce) e envia ao servidor, que guarda o
// último como GET /canvas/frame.png. Usa o próprio export do board, então o
// PNG é idêntico à tela. Downscale p/ 1568px: legível pro modelo, leve.
var uploading = false;
var uploadTimer = 0;

function downscale(blob, maxSide, done){
  if (typeof createImageBitmap !== 'function') { done(blob); return; }
  createImageBitmap(blob).then(function(bmp){
    var s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (s >= 1) { if (bmp.close) bmp.close(); done(blob); return; }
    var c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    c.toBlob(function(b){ done(b || blob); }, 'image/png');
  }).catch(function(){ done(blob); });
}

function uploadFrame(){
  if (uploading) { scheduleFrameUpload(); return; }
  if (store.size === 0) return;
  uploading = true;
  board.editor.exportImage({ background: true, scale: 1, margin: 48 }).then(function(blob){
    if (!blob) { uploading = false; return; }
    downscale(blob, 1568, function(final){
      fetch('/canvas/frame', {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: final,
      }).catch(function(){}).finally(function(){ uploading = false; });
    });
  }).catch(function(){ uploading = false; });
}

function scheduleFrameUpload(){
  if (uploadTimer) return;
  uploadTimer = setTimeout(function(){
    uploadTimer = 0;
    uploadFrame();
  }, 3000);
}

// Qualquer mudança (local ou remota) agenda um novo frame.
store.listen(function(){ scheduleFrameUpload(); });

window.clearBoard = function(){
  fetch('/canvas/clear', { method: 'POST' })
    .then(function(){ showToast('Board limpo para todos'); })
    .catch(function(){ showToast('Erro ao limpar'); });
};

function setPeers(n){
  if (!cnt) return;
  cnt.textContent = n > 0 ? ('◉ ' + n) : '';
}

function applySnapshot(snapshot){
  store.loadSnapshot(snapshot, 'remote');
  if (!fittedOnce) {
    fittedOnce = true;
    try {
      var recs = (snapshot && snapshot.document && snapshot.document.store) || {};
      if (Object.keys(recs).length > 0) board.editor.fitContent();
    } catch (e) { /* board vazio — ignora */ }
  }
  // Viewer recém-chegado com conteúdo garante um frame fresco pra IA.
  scheduleFrameUpload();
}

function connect(){
  if (reconnectAttempts >= MAX_RECONNECT) {
    if (stxt) stxt.textContent = 'falha na conexao';
    if (dot) dot.className = '';
    return;
  }
  var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(proto + '//' + location.host + '/canvas/ws');

  ws.onopen = function(){
    reconnectAttempts = 0;
    if (dot) dot.className = 'connected';
    if (stxt) stxt.textContent = 'conectado';
  };

  ws.onmessage = function(e){
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'diff' && msg.diff) store.applyDiff(msg.diff, 'remote');
      else if (msg.type === 'snapshot' && msg.snapshot) applySnapshot(msg.snapshot);
      else if (msg.type === 'peers') setPeers(msg.count);
    } catch (err) {
      console.warn('canvas WS: invalid message', err);
    }
  };

  ws.onclose = function(){
    reconnectAttempts++;
    ws = null;
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

// Mostra a URL do tablet (IP da LAN). O servidor já expõe /system/network.
function loadTabletUrl(){
  if (!urlEl) return;
  fetch('/system/network').then(function(r){ return r.json(); }).then(function(data){
    var ips = (data && data.ips) || [];
    if (!ips.length) { urlEl.textContent = ''; return; }
    var addr = ips[0].address;
    var url = 'http://' + addr + ':' + (location.port || '3333') + '/canvas';
    urlEl.innerHTML = '';
    var label = document.createElement('span');
    label.textContent = 'tablet: ';
    var b = document.createElement('b');
    b.textContent = url;
    urlEl.appendChild(label);
    urlEl.appendChild(b);
    urlEl.onclick = function(){
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function(){
        showToast('URL do tablet copiada');
      });
    };
  }).catch(function(){ urlEl.textContent = ''; });
}

loadTabletUrl();
connect();
<\/script>
</body>
</html>`;

export const serveCanvasPage = (): Promise<Response> =>
  Promise.resolve(html(PAGE));
