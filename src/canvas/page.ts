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
:root{--bg:#0b0c0e;--surface:#101216;--surface-2:#16191f;--surface-3:#1e222a;--border:#22262e;--text:#edeef1;--text-dim:#9ca3af;--accent:#37d99a;--accent-dim:rgba(55,217,154,.14);--accent-line:rgba(55,217,154,.35);--hover:rgba(255,255,255,.08)}
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);display:flex;flex-direction:column;position:fixed;inset:0}
#header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0;min-height:40px;gap:8px}
#header h1{font-size:13px;font-weight:600;white-space:nowrap;margin:0;display:flex;align-items:center;gap:8px}
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
#actions .btn{display:inline-flex;align-items:center;gap:5px}
#actions .btn svg.ico,#drawer svg.ico{width:13px;height:13px;flex-shrink:0}
.lib-icon{background:none;border:none;color:var(--text-dim);font-size:12px;cursor:pointer;padding:3px;border-radius:4px;display:inline-flex;align-items:center}
#conn-count:not(:empty)::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#4caf50;margin-right:5px;vertical-align:1px}
#drawing-name.dirty::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:5px;vertical-align:1px}
.btn{background:none;border:1px solid var(--border);color:var(--text);padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn:hover{background:var(--hover)}
.btn-danger:hover{background:rgba(244,67,54,.15);border-color:#f44336}
#board{flex:1;position:relative;touch-action:none}
#board .qd-watermark{display:none}
#drawing-name{font-size:11px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
#drawing-name.dirty{color:var(--accent)}
/* ── Drawer da biblioteca ── */
#drawer{position:fixed;top:41px;bottom:0;left:0;width:288px;max-width:86vw;background:var(--surface);border-right:1px solid var(--border);z-index:50;transform:translateX(-102%);transition:transform .22s ease;display:flex;flex-direction:column}
#drawer.open{transform:none}
#drawer-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600}
#drawer-close{background:none;border:none;color:var(--text-dim);font-size:16px;cursor:pointer;padding:0 4px}
#drawer-close:hover{color:var(--text)}
#drawer-body{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:14px}
.lib-title{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-dim);margin-bottom:6px}
.lib-form{display:flex;gap:4px;margin-bottom:6px}
.lib-input{flex:1;min-width:0;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:5px;font-size:12px;outline:none}
.lib-input:focus{border-color:var(--accent)}
.lib-add{background:none;border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:5px;font-size:12px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
.lib-add:hover{background:var(--hover)}
.lib-list{display:flex;flex-direction:column;gap:2px}
.lib-row{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;font-size:12px;cursor:pointer;border:1px solid transparent}
.lib-row:hover{background:var(--hover)}
.lib-row.selected{background:var(--accent-dim);border-color:var(--accent-line)}
.lib-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lib-count{font-size:10px;background:rgba(255,255,255,.07);padding:0 6px;border-radius:8px;color:var(--text-dim)}
.lib-meta{font-size:10px;color:var(--text-dim);white-space:nowrap}
.lib-icon{background:none;border:none;color:var(--text-dim);font-size:12px;cursor:pointer;padding:2px 4px;border-radius:4px}
.lib-icon:hover{color:var(--text);background:var(--hover)}
.lib-icon.danger:hover{color:#f44336}
.lib-empty{font-size:12px;color:var(--text-dim);padding:6px 2px}
.lib-rename{flex:1;min-width:0;background:var(--bg);border:1px solid var(--accent);color:var(--text);padding:2px 6px;border-radius:4px;font-size:12px;outline:none}
/* ── Confirm ── */
#confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;display:none;align-items:center;justify-content:center}
#confirm-overlay.open{display:flex}
#confirm-box{background:var(--surface);border:1px solid var(--border);border-radius:10px;width:360px;max-width:88vw;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.8)}
#confirm-msg{font-size:13px;margin-bottom:14px;line-height:1.5}
#confirm-actions{display:flex;gap:6px;justify-content:flex-end}
#confirm-ok{background:var(--accent);border-color:var(--accent);color:#fff}
html[data-theme='light'] #drawer{background:#ffffff}
html[data-theme='light'] #confirm-box{background:#ffffff}
html[data-theme='light'] .lib-count{background:rgba(0,0,0,.07)}
html[data-theme='light']{--bg:#f6f7f9;--surface:#ffffff;--surface-2:#eef0f4;--border:#d4d8e0;--text:#1a1d23;--text-dim:#828b9a;--accent:#0e9f6e;--accent-dim:rgba(14,159,110,.12);--accent-line:rgba(14,159,110,.32);--hover:rgba(0,0,0,.06)}
html[data-theme='light'] #header{background:#ffffff}
html[data-theme='light'] #conn-count{background:rgba(0,0,0,.06)}
html[data-theme='light'] #toast{background:#ffffff}
#toast{position:fixed;bottom:16px;right:16px;background:var(--surface-2);border:1px solid var(--border);padding:6px 14px;border-radius:6px;font-size:12px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:100;display:flex;align-items:center;gap:10px;max-width:min(420px,90vw)}
#toast.show{opacity:1;pointer-events:auto;flex-wrap:wrap}
#toast button{background:var(--accent-dim);border:1px solid var(--accent-line);color:var(--text);padding:2px 10px;border-radius:5px;font-size:11px;cursor:pointer;white-space:nowrap}
#toast button:hover{background:var(--hover)}
</style>
</head>
<body>

<div id="header">
  <h1>Canvas</h1>
  <span id="tablet-url" title="Clique para copiar — abra no tablet">…</span>
  <span id="drawing-name" title="desenho aberto"></span>
  <div id="status">
    <span id="status-dot" class="connecting"></span>
    <span id="status-text">conectando...</span>
    <span id="conn-count" title="pessoas no board"></span>
  </div>
  <div id="actions">
    <button class="btn btn-danger" onclick="clearBoard()" title="Apagar tudo (para todos)"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>Limpar</button>
  </div>
</div>

<div id="drawer" class="open">
  <div id="drawer-head">
    <span>Desenhos salvos</span>
    <button id="drawer-close" class="lib-icon" onclick="toggleDrawer()" title="Fechar"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
  </div>
  <div id="drawer-body">
    <div>
      <div class="lib-title">Collections</div>
      <div class="lib-form">
        <input id="new-col-input" class="lib-input" placeholder="Nova collection…" maxlength="120">
        <button class="lib-add" onclick="createCollection()" title="Criar collection"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
      </div>
      <div id="col-list" class="lib-list"></div>
    </div>
    <div>
      <div class="lib-title" id="drawings-title">Desenhos</div>
      <div class="lib-form">
        <input id="new-drawing-input" class="lib-input" placeholder="Salvar board atual como…" maxlength="120">
        <button class="lib-add" onclick="saveDrawing()">Salvar</button>
      </div>
      <div id="drawing-list" class="lib-list"></div>
    </div>
  </div>
</div>

<div id="confirm-overlay">
  <div id="confirm-box">
    <div id="confirm-msg"></div>
    <div id="confirm-actions">
      <button class="btn" onclick="confirmLib(false)">Cancelar</button>
      <button class="btn" id="confirm-ok" onclick="confirmLib(true)">Confirmar</button>
    </div>
  </div>
</div>

<div id="board"></div>
<div id="toast"></div>

<script>
// Script clássico (não-módulo): roda mesmo se o módulo do board falhar.
window.toggleDrawer = function(){
  var d = document.getElementById('drawer');
  // DEBUG temporário: prova que o toque chegou no handler.
  var t = document.getElementById('toast');
  if (t) {
    t.textContent = 'toggle!';
    t.classList.add('show');
    clearTimeout(t._hide);
    t._hide = setTimeout(function(){ t.classList.remove('show'); }, 800);
  }
  if (d) d.classList.toggle('open');
};
// A logo do rail principal (UI docmap) alterna esta sidebar via postMessage
// no modo canvas — mesmo comportamento das outras páginas.
window.addEventListener('message', function(e){
  if (e.origin !== location.origin) return;
  if (e.data && e.data.type === 'docmap-canvas-toggle-drawer') window.toggleDrawer();
});
</script>

<script type="module">
import { createQuickdraw } from '/canvas/vendor/quickdraw/index.js';

// Handlers da página registrados primeiro: mesmo que algo abaixo falhe,
// os botões do header continuam funcionando.
window.clearBoard = function(){
  fetch('/canvas/clear', { method: 'POST' })
    .then(function(){ showToast('Board limpo para todos'); })
    .catch(function(){ showToast('Erro ao limpar'); });
};

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
  theme: docmapTheme(),
  grid: 'dots',
  watermark: false,
});
var store = board.editor.store;
document.documentElement.dataset.theme = board.editor.theme.id;

// ── Temas casados com o docmap ──
// A lib só traz light/dark fixos; aqui sobrescrevemos papel, grid e seleção
// com os tokens do docmap (ui/styles/tokens.css). O theme é objeto mutável
// compartilhado, então o patch vale até trocar de tema — por isso reaplicamos
// no evento 'theme' (menu ⋮ também troca).
function patchTheme(t){
  if (!t) return;
  if (t.id === 'dark') {
    t.background = '#0b0c0e';
    t.grid = {
      line: { minor: 'rgba(255,255,255,0.07)', major: 'rgba(255,255,255,0.14)' },
      dot: { minor: 'rgba(255,255,255,0.16)', major: 'rgba(255,255,255,0.30)' },
    };
    t.selection = '#37d99a';
    t.selectionFill = 'rgba(55,217,154,0.10)';
    t.handleFill = '#1e222a';
  } else {
    t.background = '#f6f7f9';
    t.grid = {
      line: { minor: 'rgba(20,25,35,0.08)', major: 'rgba(20,25,35,0.16)' },
      dot: { minor: 'rgba(20,25,35,0.18)', major: 'rgba(20,25,35,0.34)' },
    };
    t.selection = '#0e9f6e';
    t.selectionFill = 'rgba(14,159,110,0.10)';
    t.handleFill = '#ffffff';
  }
  if (board.editor.requestRender) board.editor.requestRender();
}

function docmapTheme(){
  try {
    return localStorage.getItem('docmap-theme') === 'light' ? 'light' : 'dark';
  } catch (e) { return 'dark'; }
}

patchTheme(board.editor.theme);
board.editor.on('theme', function(){
  patchTheme(board.editor.theme);
  document.documentElement.dataset.theme = board.editor.theme.id;
});

function showToast(msg){
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._hide);
  toastEl._hide = setTimeout(function(){ toastEl.classList.remove('show'); }, 2500);
}

// Toast com ação (Fase 2: Desfazer após abrir/limpar/troca remota).
function showToastUndo(msg, actionLabel, onAction, timeoutMs){
  if (!toastEl) return;
  toastEl.innerHTML = '';
  var span = document.createElement('span');
  span.textContent = msg;
  var btn = document.createElement('button');
  btn.textContent = actionLabel || 'Desfazer';
  btn.onclick = function(){
    try { toastEl.classList.remove('show'); } catch(e){}
    try { clearTimeout(toastEl._hide); } catch(e){}
    onAction();
  };
  toastEl.appendChild(span);
  toastEl.appendChild(btn);
  toastEl.classList.add('show');
  clearTimeout(toastEl._hide);
  toastEl._hide = setTimeout(function(){ toastEl.classList.remove('show'); }, timeoutMs || 8000);
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

function setPeers(n){
  if (!cnt) return;
  cnt.textContent = n > 0 ? String(n) : '';
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
      if (msg.type === 'diff' && msg.diff) {
        store.applyDiff(msg.diff, 'remote');
        try { detectAiDiff(msg.diff); } catch(errAi){}
      }
      else if (msg.type === 'snapshot' && msg.snapshot) {
        // Snapshot remoto (outro usuário abriu desenho, limpou, ou IA).
        // Nunca perde silenciosamente: backup + rascunho antes de aplicar.
        var hadWork = false;
        try {
          hadWork = (typeof isDirty === 'function' && isDirty()) || (typeof store !== 'undefined' && store.size > 0);
          if (hadWork) {
            if (typeof takeBackup === 'function') takeBackup('troca remota');
            if (typeof backupDraftNow === 'function') backupDraftNow();
          }
          if (typeof cancelAutoSave === 'function') cancelAutoSave();
        } catch(err2){}
        applySnapshot(msg.snapshot);
        // Board remoto não pertence mais ao desenho aberto local.
        try {
          if (typeof currentDrawing !== 'undefined' && currentDrawing) {
            currentDrawing = null;
            if (typeof dirty !== 'undefined') dirty = false;
            if (typeof updateDrawingLabel === 'function') updateDrawingLabel();
          }
        } catch(err3){}
        try {
          if (hadWork && typeof showUndoToast === 'function') showUndoToast('Board trocado por outro — rascunho guardado');
        } catch(err4){}
      }
      else if (msg.type === 'proposal' && msg.proposal) {
        try { showProposalToast(msg.proposal); } catch(errP){}
      }
      else if (msg.type === 'proposal-retracted' && msg.id) {
        try { hideProposalToast(msg.id); } catch(errR){}
      }
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

// ── Biblioteca: collections + desenhos salvos ──
var drawerEl = document.getElementById('drawer');
var colListEl = document.getElementById('col-list');
var drawingListEl = document.getElementById('drawing-list');
var drawingsTitleEl = document.getElementById('drawings-title');
var drawingNameEl = document.getElementById('drawing-name');
var collections = [];
var drawings = [];
var selectedCol = null;
var currentDrawing = null;
var dirty = false;

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Ícones Lucide (mesmos paths de ui/scripts/icons.js).
function icon(n){
  var P = {
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h5"/>'
  };
  return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (P[n] || '') + '</svg>';
}

function apiGet(p){ return fetch(p).then(function(r){ if(!r.ok) throw new Error('http '+r.status); return r.json(); }); }
function apiSend(method, p, body){
  return fetch(p, { method: method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error((j && (j.message || j.error)) || ('http '+r.status)); return j; }); });
}

function updateDrawingLabel(){
  if (!drawingNameEl) return;
  if (savingState) {
    var base = currentDrawing ? currentDrawing.name : 'Sem título';
    drawingNameEl.textContent = base + ' • Salvando…';
    drawingNameEl.className = 'dirty';
    drawingNameEl.title = 'salvando…';
    return;
  }
  if (!currentDrawing) {
    if (store.size === 0) { drawingNameEl.textContent = ''; drawingNameEl.className = ''; drawingNameEl.title = ''; return; }
    drawingNameEl.textContent = 'Sem título • Editado';
    drawingNameEl.className = 'dirty';
    drawingNameEl.title = 'rascunho não salvo — salve para guardar';
    return;
  }
  drawingNameEl.textContent = dirty ? (currentDrawing.name + ' • Editado') : currentDrawing.name;
  drawingNameEl.className = dirty ? 'dirty' : '';
  drawingNameEl.title = dirty ? 'editado — autosave em segundos (Ctrl+S salva agora)' : 'desenho aberto — salvo';
}

function isDirty(){ return dirty; }

var editSeq = 0;
function markDirty(){
  editSeq++;
  if (!dirty) { dirty = true; updateDrawingLabel(); }
  scheduleDraftSave();
  scheduleAutoSave();
}
function markClean(){
  dirty = false;
  cancelAutoSave();
  updateDrawingLabel();
}
// Só edição local suja o desenho. Mudança remota (IA, outro usuário,
// snapshot de abertura) nunca marca dirty — sem falso "Editado".
store.listen(function(){ markDirty(); }, { source: 'user' });

// ── Rascunho local (Fase 1: sobrevive a fechar sem salvar) ──
var DRAFT_KEY = 'docmap-canvas-draft-v1';
var savingState = false;
var draftTimer = 0;
// ── Autosave servidor (Fase 2: salva sozinho após idle) ──
var autoSaveTimer = 0;
var autoSaving = false;
var inboxCreating = false;
var AUTO_SAVE_MS = 2500;
var AUTO_INBOX_MS = 5000;
// ── Backup p/ Desfazer (Fase 2: abrir/limpar/remoto) ──
var lastBackup = null;

function scheduleDraftSave(){
  try {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(function(){ draftTimer = 0; saveDraftLocal(); }, 1500);
  } catch(e){}
}
function saveDraftLocal(){
  try {
    if (store.size === 0) {
      // Board vazio não precisa de rascunho — limpa resto antigo.
      try { localStorage.removeItem(DRAFT_KEY); } catch(e){}
      return;
    }
    var snap = store.getSnapshot();
    var payload = { snapshot: snap, updatedAt: new Date().toISOString(), drawingId: currentDrawing ? currentDrawing.id : null, drawingName: currentDrawing ? currentDrawing.name : null };
    var body = JSON.stringify(payload);
    // localStorage tem ~5MB — acima disso, ignora (o save real valida 20MB).
    if (body.length > 4 * 1024 * 1024) return;
    localStorage.setItem(DRAFT_KEY, body);
  } catch(e){}
}
function getDraftLocal(){
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    var p = JSON.parse(raw);
    if (!p || !p.snapshot || !p.snapshot.document || !p.snapshot.document.store) return null;
    return p;
  } catch(e){ return null; }
}
function clearDraftLocal(){
  try {
    if (draftTimer) { clearTimeout(draftTimer); draftTimer = 0; }
    localStorage.removeItem(DRAFT_KEY);
  } catch(e){}
}
function backupDraftNow(){
  try { if (draftTimer) { clearTimeout(draftTimer); draftTimer = 0; } } catch(e){}
  saveDraftLocal();
}

// ── Autosave servidor (Fase 2) ──
// Com desenho aberto: atualiza silencioso após 2,5s parado.
// Sem desenho (rascunho): cria "Rascunho <data>" após 5s parado, uma vez.
function scheduleAutoSave(){
  try {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    var delay = currentDrawing ? AUTO_SAVE_MS : AUTO_INBOX_MS;
    autoSaveTimer = setTimeout(function(){ autoSaveTimer = 0; autoSaveNow(); }, delay);
  } catch(e){}
}
function cancelAutoSave(){
  try { if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = 0; } } catch(e){}
}
function autoSaveNow(){
  try {
    if (!isDirty()) return;
    if (savingState || autoSaving || inboxCreating) { scheduleAutoSave(); return; }
    if (store.size === 0) return;
    // Board vazio com desenho aberto: nunca apaga sozinho (exige ação manual).
    if (currentDrawing) {
      autoSaving = true;
      savingState = true; updateDrawingLabel();
      var seq = editSeq;
      var snap = store.getSnapshot();
      apiSend('POST', '/canvas/drawings/' + encodeURIComponent(currentDrawing.id) + '/save', { snapshot: snap }).then(function(){
        autoSaving = false; savingState = false;
        // Editou durante o save? Mantém dirty e reagenda (sem perder traço).
        if (seq !== editSeq) { dirty = true; updateDrawingLabel(); scheduleDraftSave(); scheduleAutoSave(); return; }
        markClean();
        clearDraftLocal();
      }).catch(function(){
        autoSaving = false; savingState = false; updateDrawingLabel();
        scheduleAutoSave();
      });
    } else {
      inboxCreating = true;
      savingState = true; updateDrawingLabel();
      var seq2 = editSeq;
      var snap2 = store.getSnapshot();
      var d = new Date();
      var pad = function(n){ return (n < 10 ? '0' : '') + n; };
      var autoName = 'Rascunho ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
      var body = { name: autoName, snapshot: snap2 };
      if (selectedCol) body.collectionId = selectedCol;
      apiSend('POST', '/canvas/drawings', body).then(function(meta){
        inboxCreating = false; savingState = false;
        currentDrawing = { id: meta.id, name: meta.name };
        if (seq2 !== editSeq) { dirty = true; updateDrawingLabel(); scheduleDraftSave(); scheduleAutoSave(); }
        else { markClean(); clearDraftLocal(); }
        showToast('Rascunho salvo automaticamente');
        refreshLibrary().then(function(){
          selectedCol = meta.collectionId; storeCol(selectedCol);
          renderCols(); return refreshDrawings();
        }).catch(function(){});
      }).catch(function(){
        inboxCreating = false; savingState = false; updateDrawingLabel();
        scheduleAutoSave();
      });
    }
  } catch(e){}
}

// ── Backup + Desfazer (Fase 2) ──
function takeBackup(reason){
  try {
    if (store.size === 0) return;
    lastBackup = {
      snapshot: store.getSnapshot(),
      drawing: currentDrawing ? { id: currentDrawing.id, name: currentDrawing.name } : null,
      reason: reason || 'alteração',
      at: new Date().toISOString()
    };
  } catch(e){}
}
function restoreBackup(){
  if (!lastBackup) { showToast('Nada a desfazer'); return; }
  try {
    // Como 'user': volta a sincronizar via WS e marca dirty.
    store.loadSnapshot(lastBackup.snapshot, 'user');
    if (lastBackup.drawing) currentDrawing = { id: lastBackup.drawing.id, name: lastBackup.drawing.name };
    else currentDrawing = null;
    dirty = true;
    updateDrawingLabel();
    scheduleDraftSave();
    scheduleAutoSave();
    try { board.editor.fitContent(); } catch(e){}
    lastBackup = null;
    showToast('Desfeito');
  } catch(e){ showToast('Falha ao desfazer'); }
}
function showUndoToast(msg){
  try {
    if (!lastBackup) { showToast(msg); return; }
    showToastUndo(msg, 'Desfazer', restoreBackup, 9000);
  } catch(e){ showToast(msg); }
}

// ── IA com consentimento (Fase 3) ──
var shownProposalId = null;
var recentAppliedAi = {};

function hideProposalToast(id){
  if (id && shownProposalId !== id) return;
  shownProposalId = null;
  try {
    if (toastEl) {
      toastEl.classList.remove('show');
      clearTimeout(toastEl._hide);
    }
  } catch(e){}
}

function showProposalToast(p){
  if (!p || !p.id) return;
  if (!toastEl) return;
  shownProposalId = p.id;
  var label = p.label || 'proposta da IA';
  var count = p.count || 0;
  toastEl.innerHTML = '';
  var span = document.createElement('span');
  span.textContent = 'IA propõe "' + label + '" (' + count + ' shapes). Aplicar?';
  var applyBtn = document.createElement('button');
  applyBtn.textContent = 'Aplicar';
  applyBtn.onclick = function(){ applyProposal(p.id); };
  var newBtn = document.createElement('button');
  newBtn.textContent = 'Novo desenho';
  newBtn.onclick = function(){ saveProposalAsDrawing(p.id, label); };
  var noBtn = document.createElement('button');
  noBtn.textContent = 'Descartar';
  noBtn.onclick = function(){ dismissProposal(p.id); };
  toastEl.appendChild(span);
  toastEl.appendChild(applyBtn);
  toastEl.appendChild(newBtn);
  toastEl.appendChild(noBtn);
  toastEl.classList.add('show');
  clearTimeout(toastEl._hide);
  toastEl._hide = setTimeout(function(){
    if (shownProposalId === p.id) {
      toastEl.classList.remove('show');
      shownProposalId = null;
    }
  }, 60000);
}

function applyProposal(id){
  apiSend('POST', '/canvas/proposals/' + encodeURIComponent(id) + '/apply').then(function(res){
    hideProposalToast(id);
    var ids = (res && res.ids) || [];
    for (var i = 0; i < ids.length; i++) recentAppliedAi[ids[i]] = Date.now();
    showToastUndo('IA adicionou ' + ids.length + ' shapes', 'Desfazer', function(){ undoAiShapes(ids); }, 9000);
    showNextProposal();
  }).catch(function(e){ showToast(e.message || 'Falha ao aplicar'); });
}

function dismissProposal(id){
  hideProposalToast(id);
  apiSend('DELETE', '/canvas/proposals/' + encodeURIComponent(id)).then(function(){
    showNextProposal();
  }).catch(function(){ showNextProposal(); });
}

function saveProposalAsDrawing(id, label){
  var body = { name: (label || 'Desenho da IA').slice(0, 120) };
  if (selectedCol) body.collectionId = selectedCol;
  apiSend('POST', '/canvas/proposals/' + encodeURIComponent(id) + '/save', body).then(function(meta){
    hideProposalToast(id);
    refreshLibrary().then(function(){
      if (meta && meta.collectionId) { selectedCol = meta.collectionId; storeCol(selectedCol); }
      renderCols(); return refreshDrawings();
    }).catch(function(){});
    showToastUndo('Desenho "' + ((meta && meta.name) || label) + '" criado', 'Abrir', function(){
      if (meta && meta.id) openDrawing(meta.id);
    }, 9000);
    showNextProposal();
  }).catch(function(e){ showToast(e.message || 'Falha ao salvar proposta'); });
}

function showNextProposal(){
  apiGet('/canvas/proposals').then(function(list){
    if (list && list.length) showProposalToast(list[list.length - 1]);
  }).catch(function(){});
}

// Rede de segurança: IA no modo imediato (POST /canvas/shapes live).
// Detecta records shape:ai-* vindos da rede e oferece Desfazer preciso.
function detectAiDiff(diff){
  var added = (diff && diff.added) || {};
  var ids = Object.keys(added).filter(function(k){
    return k.indexOf('shape:ai-') === 0;
  });
  // Remove os que acabamos de aplicar (já têm toast com Desfazer).
  var fresh = [];
  var cutoff = Date.now() - 10000;
  for (var i = 0; i < ids.length; i++) {
    var at = recentAppliedAi[ids[i]];
    if (at && at > cutoff) delete recentAppliedAi[ids[i]];
    else fresh.push(ids[i]);
  }
  if (!fresh.length) return;
  showToastUndo('IA adicionou ' + fresh.length + ' shapes no board', 'Desfazer', function(){ undoAiShapes(fresh); }, 12000);
}

function undoAiShapes(ids){
  try {
    var existing = [];
    for (var i = 0; i < ids.length; i++) {
      if (store.records && store.records.has ? store.records.has(ids[i]) : store.getSnapshot().document.store[ids[i]]) existing.push(ids[i]);
    }
    if (!existing.length) { showToast('Nada a desfazer'); return; }
    store.remove(existing, 'user');
    showToast('Shapes da IA removidos');
  } catch(e){ showToast('Falha ao desfazer'); }
}

var confirmResolve = null;
var tripleResolve = null;
function askConfirm(msg, okLabel){
  tripleResolve = null;
  document.getElementById('confirm-msg').textContent = msg;
  var actions = document.getElementById('confirm-actions');
  actions.innerHTML = '';
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = function(){ window.confirmLib(false); };
  var okBtn = document.createElement('button');
  okBtn.className = 'btn';
  okBtn.id = 'confirm-ok';
  okBtn.textContent = okLabel || 'Confirmar';
  okBtn.onclick = function(){ window.confirmLib(true); };
  actions.appendChild(cancelBtn);
  actions.appendChild(okBtn);
  document.getElementById('confirm-overlay').classList.add('open');
  return new Promise(function(res){ confirmResolve = res; });
}
window.confirmLib = function(ok){
  document.getElementById('confirm-overlay').classList.remove('open');
  if (confirmResolve) { confirmResolve(!!ok); confirmResolve = null; }
};
// Guarda de 3 vias: Salvar / Descartar / Cancelar. Evita perda silenciosa.
function askTriple(msg){
  confirmResolve = null;
  document.getElementById('confirm-msg').textContent = msg;
  var actions = document.getElementById('confirm-actions');
  actions.innerHTML = '';
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = function(){ window.confirmTriple('cancel'); };
  var discardBtn = document.createElement('button');
  discardBtn.className = 'btn btn-danger';
  discardBtn.textContent = 'Descartar';
  discardBtn.onclick = function(){ window.confirmTriple('discard'); };
  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.id = 'confirm-ok';
  saveBtn.textContent = 'Salvar';
  saveBtn.onclick = function(){ window.confirmTriple('save'); };
  actions.appendChild(cancelBtn);
  actions.appendChild(discardBtn);
  actions.appendChild(saveBtn);
  document.getElementById('confirm-overlay').classList.add('open');
  return new Promise(function(res){ tripleResolve = res; });
}
window.confirmTriple = function(choice){
  document.getElementById('confirm-overlay').classList.remove('open');
  if (tripleResolve) { tripleResolve(choice); tripleResolve = null; }
};

function storedCol(){ try { return localStorage.getItem('docmap-canvas-col'); } catch(e){ return null; } }
function storeCol(id){ try { if (id) localStorage.setItem('docmap-canvas-col', id); else localStorage.removeItem('docmap-canvas-col'); } catch(e){} }

function refreshLibrary(){
  apiGet('/canvas/collections').then(function(cols){
    collections = cols || [];
    if (!selectedCol || !collections.some(function(c){ return c.id === selectedCol; })) {
      selectedCol = storedCol();
      if (!selectedCol || !collections.some(function(c){ return c.id === selectedCol; })) {
        selectedCol = collections.length ? collections[0].id : null;
      }
    }
    storeCol(selectedCol);
    renderCols();
    return refreshDrawings();
  }).catch(function(){ showToast('Falha ao carregar biblioteca'); });
}

function renderCols(){
  if (!colListEl) return;
  if (!collections.length) { colListEl.innerHTML = '<div class="lib-empty">Nenhuma collection. Crie uma acima.</div>'; return; }
  colListEl.innerHTML = collections.map(function(c){
    return '<div class="lib-row' + (c.id === selectedCol ? ' selected' : '') + '" data-id="' + esc(c.id) + '">' +
      '<span class="lib-name">' + esc(c.name) + '</span>' +
      '<span class="lib-count">' + (c.drawings || 0) + '</span>' +
      '<button class="lib-icon" data-act="rename" title="Renomear">' + icon('pencil') + '</button>' +
      '<button class="lib-icon danger" data-act="del" title="Excluir collection e desenhos">' + icon('trash') + '</button>' +
      '</div>';
  }).join('');
  Array.prototype.forEach.call(colListEl.querySelectorAll('.lib-row'), function(row){
    var id = row.getAttribute('data-id');
    row.addEventListener('click', function(e){
      var t = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
      var act = t && t.getAttribute('data-act');
      if (act === 'rename') { e.stopPropagation(); inlineRename(row, id, 'col'); return; }
      if (act === 'del') { e.stopPropagation(); deleteCollection(id); return; }
      selectedCol = id; storeCol(id); renderCols(); refreshDrawings();
    });
  });
}

function refreshDrawings(){
  if (!selectedCol) { drawings = []; renderDrawings(); return Promise.resolve(); }
  var col = null;
  for (var i = 0; i < collections.length; i++) { if (collections[i].id === selectedCol) col = collections[i]; }
  if (drawingsTitleEl) drawingsTitleEl.textContent = col ? ('Desenhos — ' + col.name) : 'Desenhos';
  return apiGet('/canvas/drawings?collectionId=' + encodeURIComponent(selectedCol)).then(function(list){
    drawings = list || [];
    renderDrawings();
  }).catch(function(){ showToast('Falha ao carregar desenhos'); });
}

function fmtDate(iso){
  try { return new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }
  catch(e){ return ''; }
}

function renderDrawings(){
  if (!drawingListEl) return;
  if (!selectedCol) { drawingListEl.innerHTML = '<div class="lib-empty">Selecione uma collection.</div>'; return; }
  if (!drawings.length) { drawingListEl.innerHTML = '<div class="lib-empty">Nenhum desenho. Salve o board atual acima.</div>'; return; }
  drawingListEl.innerHTML = drawings.map(function(d){
    return '<div class="lib-row' + (currentDrawing && currentDrawing.id === d.id ? ' selected' : '') + '" data-id="' + esc(d.id) + '" title="' + esc(d.shapes) + ' shapes • ' + esc(fmtDate(d.updatedAt)) + '">' +
      '<span class="lib-name">' + esc(d.name) + '</span>' +
      '<span class="lib-meta">' + esc(d.shapes) + '</span>' +
      '<button class="lib-icon" data-act="save" title="Sobrescrever com o board atual">' + icon('save') + '</button>' +
      '<button class="lib-icon" data-act="rename" title="Renomear">' + icon('pencil') + '</button>' +
      '<button class="lib-icon danger" data-act="del" title="Excluir">' + icon('trash') + '</button>' +
      '</div>';
  }).join('');
  Array.prototype.forEach.call(drawingListEl.querySelectorAll('.lib-row'), function(row){
    var id = row.getAttribute('data-id');
    row.addEventListener('click', function(e){
      var t = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
      var act = t && t.getAttribute('data-act');
      if (act === 'save') { e.stopPropagation(); overwriteDrawing(id); return; }
      if (act === 'rename') { e.stopPropagation(); inlineRename(row, id, 'drawing'); return; }
      if (act === 'del') { e.stopPropagation(); deleteDrawing(id); return; }
      openDrawing(id);
    });
  });
}

function findCol(id){
  for (var i = 0; i < collections.length; i++) { if (collections[i].id === id) return collections[i]; }
  return null;
}
function findDrawing(id){
  for (var i = 0; i < drawings.length; i++) { if (drawings[i].id === id) return drawings[i]; }
  return null;
}

function inlineRename(row, id, what){
  var nameEl = row.querySelector('.lib-name');
  if (!nameEl) return;
  var obj = what === 'col' ? findCol(id) : findDrawing(id);
  var old = (obj && obj.name) || '';
  var input = document.createElement('input');
  input.className = 'lib-rename';
  input.value = old;
  input.maxLength = 120;
  nameEl.replaceWith(input);
  input.focus();
  input.select();
  var done = false;
  function commit(save){
    if (done) return; done = true;
    var v = input.value.trim();
    if (!save || !v || v === old) { what === 'col' ? renderCols() : renderDrawings(); return; }
    if (what === 'col') {
      apiSend('PUT', '/canvas/collections/' + encodeURIComponent(id), { name: v }).then(function(){
        refreshLibrary();
      }).catch(function(){ showToast('Falha ao renomear'); renderCols(); });
    } else {
      apiSend('PUT', '/canvas/drawings/' + encodeURIComponent(id), { name: v }).then(function(updated){
        if (currentDrawing && currentDrawing.id === id) { currentDrawing.name = updated.name; updateDrawingLabel(); }
        refreshDrawings();
      }).catch(function(){ showToast('Falha ao renomear'); renderDrawings(); });
    }
  }
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter') commit(true);
    else if (e.key === 'Escape') commit(false);
  });
  input.addEventListener('blur', function(){ commit(true); });
}

window.createCollection = function(){
  var input = document.getElementById('new-col-input');
  var name = input ? input.value.trim() : '';
  if (!name) return;
  apiSend('POST', '/canvas/collections', { name: name }).then(function(col){
    if (input) input.value = '';
    collections.push(col);
    selectedCol = col.id; storeCol(col.id);
    renderCols(); refreshDrawings();
    showToast('Collection criada');
  }).catch(function(e){ showToast(e.message || 'Falha ao criar'); });
};

function deleteCollection(id){
  var col = findCol(id);
  var n = col && col.drawings ? col.drawings : 0;
  askConfirm('Excluir "' + (col ? col.name : '') + '" e seus ' + n + ' desenho(s)?', 'Excluir').then(function(ok){
    if (!ok) return;
    apiSend('DELETE', '/canvas/collections/' + encodeURIComponent(id)).then(function(){
      collections = collections.filter(function(c){ return c.id !== id; });
      if (selectedCol === id) { selectedCol = collections.length ? collections[0].id : null; storeCol(selectedCol); }
      renderCols(); refreshDrawings();
      showToast('Collection excluída');
    }).catch(function(){ showToast('Falha ao excluir'); });
  });
}

window.saveDrawing = function(){
  var input = document.getElementById('new-drawing-input');
  var name = input ? input.value.trim() : '';
  if (!name) { showToast('Dê um nome ao desenho'); if (input) input.focus(); return; }
  if (store.size === 0) { showToast('Board vazio — nada a salvar'); return; }
  var body = { name: name, snapshot: store.getSnapshot() };
  if (selectedCol) body.collectionId = selectedCol;
  cancelAutoSave();
  savingState = true; updateDrawingLabel();
  apiSend('POST', '/canvas/drawings', body).then(function(meta){
    if (input) input.value = '';
    currentDrawing = { id: meta.id, name: meta.name };
    savingState = false;
    markClean();
    clearDraftLocal();
    return refreshLibrary().then(function(){
      selectedCol = meta.collectionId; storeCol(selectedCol);
      renderCols(); return refreshDrawings();
    });
  }).then(function(){ showToast('Desenho salvo'); })
  .catch(function(e){ savingState = false; updateDrawingLabel(); showToast(e.message || 'Falha ao salvar'); scheduleAutoSave(); });
};

// Salvamento silencioso no desenho atual (Ctrl+S, guarda de troca).
// Envia o snapshot do cliente — não depende do hub estar sincronizado.
function saveCurrentDrawing(){
  if (!currentDrawing) return Promise.reject(new Error('sem desenho aberto'));
  if (store.size === 0) { showToast('Board vazio — nada a salvar'); return Promise.reject(new Error('board vazio')); }
  cancelAutoSave();
  savingState = true; updateDrawingLabel();
  var seq = editSeq;
  return apiSend('POST', '/canvas/drawings/' + encodeURIComponent(currentDrawing.id) + '/save', { snapshot: store.getSnapshot() }).then(function(){
    savingState = false;
    // Traço durante o save: não limpa — reagenda para salvar o resto.
    if (seq !== editSeq) { dirty = true; updateDrawingLabel(); scheduleDraftSave(); scheduleAutoSave(); refreshDrawings(); return; }
    markClean();
    clearDraftLocal();
    refreshDrawings();
    showToast('Desenho salvo');
  }).catch(function(e){
    savingState = false; updateDrawingLabel();
    showToast(e.message || 'Falha ao salvar');
    scheduleAutoSave();
    throw e;
  });
}

function doOpenDrawing(id){
  takeBackup('abertura');
  cancelAutoSave();
  return apiSend('POST', '/canvas/drawings/' + encodeURIComponent(id) + '/open').then(function(res){
    currentDrawing = { id: res.drawing.id, name: res.drawing.name };
    markClean();
    clearDraftLocal();
    applySnapshot(res.snapshot);
    try { board.editor.fitContent(); } catch(e){}
    updateDrawingLabel(); renderDrawings();
    showUndoToast('Desenho aberto');
  }).catch(function(e){ showToast(e.message || 'Falha ao abrir'); });
}

function openDrawing(id){
  if (currentDrawing && currentDrawing.id === id) return;
  if (!isDirty()) { doOpenDrawing(id); return; }
  var label = currentDrawing ? ('"' + currentDrawing.name + '"') : 'rascunho sem título';
  askTriple('Você tem alterações não salvas em ' + label + '. Salvar antes de trocar?').then(function(choice){
    if (choice === 'cancel' || choice === null || choice === undefined) return;
    if (choice === 'discard') { clearDraftLocal(); markClean(); doOpenDrawing(id); return; }
    // choice === 'save'
    if (!currentDrawing) {
      showToast('Dê um nome acima para salvar o rascunho antes de trocar');
      var input = document.getElementById('new-drawing-input');
      if (input) input.focus();
      return;
    }
    saveCurrentDrawing().then(function(){ doOpenDrawing(id); }).catch(function(){});
  });
}

function overwriteDrawing(id){
  var d = findDrawing(id);
  askConfirm('Sobrescrever "' + (d ? d.name : '') + '" com o board atual?', 'Salvar').then(function(ok){
    if (!ok) return;
    apiSend('POST', '/canvas/drawings/' + encodeURIComponent(id) + '/save', { snapshot: store.getSnapshot() }).then(function(){
      if (currentDrawing && currentDrawing.id === id) { markClean(); clearDraftLocal(); }
      refreshDrawings();
      showToast('Desenho atualizado');
    }).catch(function(e){ showToast(e.message || 'Falha ao salvar'); });
  });
}

function deleteDrawing(id){
  var d = findDrawing(id);
  askConfirm('Excluir "' + (d ? d.name : '') + '"?', 'Excluir').then(function(ok){
    if (!ok) return;
    apiSend('DELETE', '/canvas/drawings/' + encodeURIComponent(id)).then(function(){
      if (currentDrawing && currentDrawing.id === id) {
        currentDrawing = null;
        // Board continua na tela — vira rascunho não salvo.
        if (store.size > 0) { dirty = true; scheduleDraftSave(); }
        else { dirty = false; clearDraftLocal(); }
        updateDrawingLabel();
      }
      refreshDrawings(); refreshLibraryCounts();
      showToast('Desenho excluído');
    }).catch(function(){ showToast('Falha ao excluir'); });
  });
}

// ── Limpar com guarda (afeta todos — confirma sempre) ──
function doClearBoard(){
  takeBackup('limpeza');
  cancelAutoSave();
  fetch('/canvas/clear', { method: 'POST' }).then(function(){
    // Board limpo vira tela vazia sem vínculo — sem dirty fantasma.
    currentDrawing = null;
    dirty = false;
    clearDraftLocal();
    updateDrawingLabel();
    showUndoToast('Board limpo para todos');
  }).catch(function(){ showToast('Erro ao limpar'); });
}
function guardedClearBoard(){
  if (isDirty()) {
    var label = currentDrawing ? ('"' + currentDrawing.name + '"') : 'rascunho sem título';
    askTriple('Você tem alterações não salvas em ' + label + '. Salvar antes de limpar?').then(function(choice){
      if (choice === 'cancel' || choice === null || choice === undefined) return;
      if (choice === 'discard') { doClearBoard(); return; }
      if (!currentDrawing) {
        showToast('Dê um nome acima para salvar o rascunho antes de limpar');
        var input = document.getElementById('new-drawing-input');
        if (input) input.focus();
        return;
      }
      saveCurrentDrawing().then(function(){ doClearBoard(); }).catch(function(){});
    });
    return;
  }
  if (store.size === 0) { showToast('Board já está vazio'); return; }
  askConfirm('Limpar o board para todos?', 'Limpar').then(function(ok){
    if (ok) doClearBoard();
  });
}
window.clearBoard = guardedClearBoard;

// ── Ctrl+S salva no desenho atual ──
window.addEventListener('keydown', function(e){
  try {
    var isSave = (e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 's';
    if (!isSave) return;
    // Não rouba o Ctrl+S de inputs de texto (rename inline).
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    if (currentDrawing) saveCurrentDrawing().catch(function(){});
    else window.saveDrawing();
  } catch(err){}
});

// ── Sair sem salvar avisa (Fase 1: rascunho + aviso nativo) ──
window.addEventListener('beforeunload', function(e){
  try {
    if (isDirty()) {
      backupDraftNow();
      e.preventDefault();
      e.returnValue = '';
    }
  } catch(err){}
});

// ── Restaura rascunho após fechar sem salvar ──
function maybeRestoreDraft(){
  try {
    var hasOpen = false;
    try { hasOpen = !!new URLSearchParams(location.search).get('open'); } catch(e){}
    if (hasOpen) return;
    var draft = getDraftLocal();
    if (!draft) return;
    var count = draft.snapshot && draft.snapshot.document && draft.snapshot.document.store ? Object.keys(draft.snapshot.document.store).length : 0;
    if (count === 0) { clearDraftLocal(); return; }
    var when = draft.updatedAt ? fmtDate(draft.updatedAt) : '';
    var who = draft.drawingName ? ('"' + draft.drawingName + '"') : 'rascunho sem título';
    askConfirm('Restaurar ' + who + (when ? (' de ' + when) : '') + ' (' + count + ' shapes)?', 'Restaurar').then(function(ok){
      if (ok) {
        try {
          // Como 'user': gera diff, sincroniza via WS e marca dirty.
          store.loadSnapshot(draft.snapshot, 'user');
          if (draft.drawingId) currentDrawing = { id: draft.drawingId, name: draft.drawingName || 'Sem título' };
          dirty = true;
          updateDrawingLabel();
          try { board.editor.fitContent(); } catch(e){}
          showToast('Rascunho restaurado');
        } catch(e){ showToast('Falha ao restaurar rascunho'); }
      } else {
        clearDraftLocal();
      }
    });
  } catch(e){}
}

function refreshLibraryCounts(){
  apiGet('/canvas/collections').then(function(cols){
    collections = cols || [];
    renderCols();
  }).catch(function(){});
}

// Deep link #drawing/<id> → abre direto via ?open= (mesma origem).
try {
  var openId = new URLSearchParams(location.search).get('open');
  if (openId && /^[0-9a-f-]{36}$/i.test(openId)) {
    apiSend('POST', '/canvas/drawings/' + openId + '/open').then(function(res){
      currentDrawing = { id: res.drawing.id, name: res.drawing.name };
      markClean();
      clearDraftLocal();
      applySnapshot(res.snapshot);
      try { board.editor.fitContent(); } catch(e){}
      updateDrawingLabel();
    }).catch(function(){ showToast('Desenho não encontrado'); });
  }
} catch(e){}

loadTabletUrl();
connect();

// Sidebar aberta por padrão (padrão docmap: logo alterna).
refreshLibrary();
// Rascunho local volta após o sync inicial — sem brigar com o WS.
setTimeout(maybeRestoreDraft, 900);
// Propostas da IA pendentes (criadas com a página fechada).
setTimeout(function(){ try { showNextProposal(); } catch(e){} }, 1500);
<\/script>
</body>
</html>`;

export const serveCanvasPage = (): Promise<Response> =>
  Promise.resolve(html(PAGE));
