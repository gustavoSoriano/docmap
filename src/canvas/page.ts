import { html } from '../server/response.ts';

// Lousa única: sem collections, sem desenhos salvos, sem propostas. Tudo que
// a IA (POST /canvas/shapes) ou qualquer cliente (WS diffs) desenha cai no
// mesmo board, e o servidor persiste automaticamente no disco a cada mudança.

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
#conn-count:not(:empty)::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#4caf50;margin-right:5px;vertical-align:1px}
#actions{display:flex;gap:4px}
#actions .btn{display:inline-flex;align-items:center;gap:5px}
#actions .btn svg.ico{width:13px;height:13px;flex-shrink:0}
.btn{background:none;border:1px solid var(--border);color:var(--text);padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn:hover{background:var(--hover)}
.btn-danger:hover{background:rgba(244,67,54,.15);border-color:#f44336}
#board{flex:1;position:relative;touch-action:none}
#board .qd-watermark{display:none}
/* Sem upload por botão (o picker não abre no webview): esconde o ícone da
   toolbar e dos grids de overflow. Colar/arrastar imagens continua ok. */
#board .qd-tool[data-name="image"]{display:none!important}
#canvas-status{font-size:11px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
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
  <span id="canvas-status" title="lousa única — tudo é salvo automaticamente no servidor"></span>
  <div id="status">
    <span id="status-dot" class="connecting"></span>
    <span id="status-text">conectando...</span>
    <span id="conn-count" title="pessoas no board"></span>
  </div>
  <div id="actions">
    <button class="btn btn-danger" onclick="clearBoard()" title="Apagar tudo (para todos)"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>Limpar</button>
  </div>
</div>

<div id="board"></div>
<div id="toast"></div>

<script>
// Script clássico (não-módulo): roda mesmo se o módulo do board falhar.
// Compat: a logo do rail principal alterna a antiga sidebar via postMessage;
// sem drawer, é no-op.
window.toggleDrawer = function(){};
window.addEventListener('message', function(e){
  if (e.origin !== location.origin) return;
  if (e.data && e.data.type === 'docmap-canvas-toggle-drawer') window.toggleDrawer();
});
</script>

<script type="module">
import { createQuickdraw } from '/canvas/vendor/quickdraw/index.js';

var boardEl = document.getElementById('board');
var dot = document.getElementById('status-dot');
var stxt = document.getElementById('status-text');
var cnt = document.getElementById('conn-count');
var urlEl = document.getElementById('tablet-url');
var toastEl = document.getElementById('toast');
var saveEl = document.getElementById('canvas-status');
var reconnectAttempts = 0;
var MAX_RECONNECT = 20;
var ws = null;
var fittedOnce = false;

// Traço reto por padrão (dash 'solid'); o ondulado à mão continua
// disponível no menu de estilo (anel colorido → fileira de traços).
var board = createQuickdraw({
  container: boardEl,
  theme: docmapTheme(),
  grid: 'dots',
  watermark: false,
  styles: { dash: 'solid' },
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

// Toast com ação (Desfazer após limpar ou shapes da IA).
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
// abaixo não re-emitem (filtro do listen) — sem loop de eco. O servidor
// persiste cada mudança no disco automaticamente.
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

function setPeers(n){
  if (!cnt) return;
  cnt.textContent = n > 0 ? String(n) : '';
}

// Rótulo da lousa única: contagem + salvamento automático (servidor persiste).
function updateSaveLabel(){
  if (!saveEl) return;
  var n = store.size;
  saveEl.textContent = (n === 0 ? 'vazio' : n + (n === 1 ? ' shape' : ' shapes')) + ' • salvamento automático';
}

// Qualquer mudança (local ou remota) atualiza o rótulo e agenda um frame.
store.listen(function(){
  updateSaveLabel();
  scheduleFrameUpload();
});

function applySnapshot(snapshot){
  store.loadSnapshot(snapshot, 'remote');
  if (!fittedOnce) {
    fittedOnce = true;
    try {
      var recs = (snapshot && snapshot.document && snapshot.document.store) || {};
      if (Object.keys(recs).length > 0) board.editor.fitContent();
    } catch (e) { /* board vazio — ignora */ }
  }
  updateSaveLabel();
  // Viewer recém-chegado com conteúdo garante um frame fresco pra IA.
  scheduleFrameUpload();
}

// Eco do próprio Limpar (o POST /canvas/clear difunde p/ todos, inclusive
// quem pediu). Ignora o backup duplicado nesse caso.
var expectingClearEcho = false;

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
        // Snapshot remoto: limpeza (própria ou de outro usuário).
        // Guarda backup para Desfazer antes de aplicar.
        var hadWork = false;
        try { hadWork = store.size > 0; } catch(err0){}
        var mine = expectingClearEcho;
        expectingClearEcho = false;
        if (hadWork && !mine) takeBackup('limpeza remota');
        applySnapshot(msg.snapshot);
        // Eco próprio: doClearBoard já mostrou o toast com Desfazer.
        if (mine) return;
        try {
          if (hadWork) showUndoToast('Board limpo por outro — Desfazer disponível');
          else showToast('Board limpo para todos');
        } catch(err1){}
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

// ── Backup p/ Desfazer (limpeza) ──
var lastBackup = null;

function takeBackup(reason){
  try {
    if (store.size === 0) return;
    lastBackup = {
      snapshot: store.getSnapshot(),
      reason: reason || 'alteração',
      at: new Date().toISOString()
    };
  } catch(e){}
}
function restoreBackup(){
  if (!lastBackup) { showToast('Nada a desfazer'); return; }
  try {
    // Como 'user': volta a sincronizar via WS e o servidor persiste.
    store.loadSnapshot(lastBackup.snapshot, 'user');
    try { board.editor.fitContent(); } catch(e){}
    lastBackup = null;
    updateSaveLabel();
    showToast('Desfeito');
  } catch(e){ showToast('Falha ao desfazer'); }
}
function showUndoToast(msg){
  try {
    if (!lastBackup) { showToast(msg); return; }
    showToastUndo(msg, 'Desfazer', restoreBackup, 9000);
  } catch(e){ showToast(msg); }
}

// Rede de segurança: IA no modo direto (POST /canvas/shapes).
// Detecta records shape:ai-* vindos da rede e oferece Desfazer preciso.
var recentAppliedAi = {};
function detectAiDiff(diff){
  var added = (diff && diff.added) || {};
  var ids = Object.keys(added).filter(function(k){
    return k.indexOf('shape:ai-') === 0;
  });
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

// ── Limpar com guarda (afeta todos — confirma sempre) ──
function doClearBoard(){
  takeBackup('limpeza');
  expectingClearEcho = true;
  fetch('/canvas/clear', { method: 'POST' }).then(function(){
    showUndoToast('Board limpo para todos');
  }).catch(function(){ expectingClearEcho = false; showToast('Erro ao limpar'); });
}
function guardedClearBoard(){
  if (store.size === 0) { showToast('Board já está vazio'); return; }
  if (window.confirm('Limpar o board para todos?')) doClearBoard();
}
window.clearBoard = guardedClearBoard;

updateSaveLabel();
loadTabletUrl();
connect();
<\/script>
</body>
</html>`;

export const serveCanvasPage = (): Promise<Response> =>
  Promise.resolve(html(PAGE));
