import { html } from '../server/response.ts';
import {
  COMPONENTS_CSS,
  FONT_CSS,
  TOKENS_CSS,
} from '../server/handlers/ui-shared.gen.ts';
import {
  MACRO_LINKS_CSS,
  MACRO_LINKS_HTML,
  MACRO_LINKS_HUD,
  MACRO_LINKS_JS,
} from './macro-links.ts';
import {
  URL_LINKS_CSS,
  URL_LINKS_HTML,
  URL_LINKS_HUD,
  URL_LINKS_JS,
} from './url-links.ts';
import { CLIPBOARD_JS } from './clipboard.ts';
import { TRANSFER_HUD, TRANSFER_JS } from './transfer-ui.ts';
import { CONFIRM_CSS, CONFIRM_HTML, CONFIRM_JS } from './confirm-ui.ts';

// Lousa única: sem collections, sem desenhos salvos, sem propostas. Tudo que
// a IA (POST /canvas/shapes) ou qualquer cliente (WS diffs) desenha cai no
// mesmo board, e o servidor persiste automaticamente no disco a cada mudança.
//
// A página é standalone (iframe): não herda o CSS do app. Fonte, tokens e
// componentes vêm de ui-shared.gen.ts (gerado por scripts/bundle-ui.ts).

const PAGE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
body{position:fixed;inset:0;background:var(--surface);color:var(--text);font-family:var(--font-ui);font-size:var(--fs-md);-webkit-font-smoothing:antialiased}
button{font-family:inherit}
.ico{width:16px;height:16px;flex-shrink:0}

/* ── Lousa ── */
#board{position:absolute;inset:0;touch-action:none}
#board .qd-watermark{display:none}
/* Sem upload por botão (o picker não abre no webview): esconde o ícone da
   toolbar e dos grids de overflow. Colar/arrastar imagens continua ok. */
#board .qd-tool[data-name="image"]{display:none!important}

/* ── Faixa superior flutuante (translúcida, sem barra sólida) ── */
#hud{position:absolute;top:12px;left:12px;right:12px;z-index:50;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;pointer-events:none}
.hud-group{pointer-events:auto;display:flex;align-items:center;gap:10px;min-width:0;height:44px;padding:0 8px 0 16px;border:1px solid var(--border-mid);border-radius:var(--r-lg);background:var(--surface-2);background:color-mix(in srgb,var(--surface-2) 80%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);box-shadow:var(--sh-sm)}
#hud-right{padding-left:14px;flex-shrink:0}
.hud-title{display:flex;align-items:center;gap:9px;font-size:var(--fs-lg);font-weight:650;font-stretch:var(--stretch-display);letter-spacing:-.015em;white-space:nowrap}
.hud-title .ico{width:17px;height:17px;color:var(--text-3)}
.hud-sep{width:1px;height:18px;background:var(--border-mid);flex-shrink:0}
#canvas-status{flex-shrink:0;color:var(--text-2)}
#peers{flex-shrink:0}
#peers[hidden]{display:none}
#peers .ico{width:13px;height:13px}
#status{white-space:nowrap}
#hud .ghost-btn{margin-left:2px}

/* ── Aviso (toast) ── */
#toast{position:fixed;top:68px;left:50%;transform:translate(-50%,-6px);display:flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:12px;max-width:min(440px,calc(100vw - 24px));padding:9px 14px;border:1px solid var(--border-hi);border-radius:var(--r-lg);background:var(--surface-3);color:var(--text);font-size:var(--fs-sm);font-weight:560;box-shadow:var(--sh-md);opacity:0;pointer-events:none;transition:opacity .22s var(--ease),transform .22s var(--ease);z-index:100}
#toast.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
#toast button{height:26px;padding:0 10px;border:0;border-radius:var(--r-sm);background:var(--surface-4);color:var(--accent-text);font-size:var(--fs-xs);font-weight:650;cursor:pointer;white-space:nowrap;transition:background var(--dur)}
#toast button:hover{background:var(--border-hi)}

/* ── Lousa vazia ── */
#board-empty{position:absolute;inset:0;z-index:10;pointer-events:none;padding:0 24px 80px}
#board-empty[hidden]{display:none}
#board-empty::before{display:none}
#board-empty .empty-mark{background:var(--surface-2)}

/* ── Quickdraw com a pele do design system ── */
#board .qd-root,#board .qd-root[data-qd-theme]{background:var(--surface);font-family:var(--font-ui)}
#board .qd-dock,#board .qd-actions{background:var(--surface-2);background:color-mix(in srgb,var(--surface-2) 82%,transparent);border:1px solid var(--border-mid);box-shadow:var(--sh-sm);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2)}
#board .qd-dock{bottom:18px;border-radius:999px}
#board .qd-actions{--qd-actions-left:14px;border-radius:999px;border-color:var(--border-soft);background:color-mix(in srgb,var(--surface-2) 62%,transparent);box-shadow:none}
#board .qd-actions:hover{border-color:var(--border-mid);background:color-mix(in srgb,var(--surface-2) 82%,transparent)}
#board .qd-tool,#board .qd-dock button{position:relative;color:var(--text-2);border-radius:var(--r-md);transition:background var(--dur),color var(--dur)}
#board .qd-dock button svg,#board .qd-actions button svg,#board .qd-popover .qd-tool svg{stroke-width:1.75}
#board .qd-dock button svg{width:18px;height:18px}
#board .qd-actions button svg{width:16px;height:16px}
#board .qd-dock button:hover,#board .qd-actions button:hover,#board .qd-popover .qd-tool:hover{background:var(--surface-3);color:var(--text)}
#board .qd-dock button.on,#board .qd-dock button.on:hover,#board .qd-grid-pop .qd-tool.on,#board .qd-popover .qd-tool.on{background:var(--surface-4);color:var(--text)}
/* ferramenta ativa: ponto âmbar pequeno sob o ícone (1 por região) */
#board .qd-dock button.on:not(.qd-style-btn):not([data-name='menu']):not([data-name='more'])::before{content:'';position:absolute;left:50%;bottom:2px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--accent)}
#board .qd-geo-btn::after{right:4px;bottom:5px;opacity:.55}
#board .qd-actions .qd-tool:disabled,#board .qd-dock button:disabled{opacity:.4}
#board .qd-div{background:var(--border-mid)}
#board .qd-style-dot{width:15px;height:15px;border:2px solid var(--text);box-shadow:none}
#board .qd-style-btn.on .qd-style-dot{border-color:var(--text)}

#board .qd-popover,#board .qd-submenu{background:var(--surface-2);background:color-mix(in srgb,var(--surface-2) 94%,transparent);border:1px solid var(--border-mid);border-radius:var(--r-lg);box-shadow:var(--sh-md);-webkit-backdrop-filter:blur(16px) saturate(1.2);backdrop-filter:blur(16px) saturate(1.2)}
#board .qd-popover{bottom:76px;padding:8px}
#board .qd-geo-pop .qd-tool,#board .qd-grid-pop .qd-tool{color:var(--text-2)}
#board .qd-row + .qd-row{border-top-color:var(--border)}
#board .qd-dot::before{box-shadow:0 0 0 1px var(--border-hi)}
#board .qd-dot:hover{background:var(--surface-3)}
#board .qd-dot.on{background:var(--surface-4)}
#board .qd-opt{color:var(--text-2);border-radius:var(--r-sm)}
#board .qd-opt:hover{background:var(--surface-3);color:var(--text)}
#board .qd-opt.on{background:var(--surface-4);color:var(--text)}
#board .qd-menu-item,#board .qd-menu-row{font:560 var(--fs-md)/1.3 var(--font-ui);color:var(--text)}
#board .qd-menu-item{padding:8px 10px;border-radius:var(--r-sm)}
#board .qd-menu-item:hover,#board .qd-has-sub.sub-open{background:var(--surface-3)}
#board .qd-mi-ico,#board .qd-mi-chev{color:var(--text-3)}
#board .qd-mi-check{color:var(--text)}
#board .qd-menu-item:hover .qd-mi-ico{color:var(--text)}
#board .qd-mi-key,#board .qd-mi-value{color:var(--text-3);font-size:var(--fs-xs);letter-spacing:0}
#board .qd-menu-div{background:var(--border)}
#board .qd-seg{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm)}
#board .qd-seg-btn{color:var(--text-3);border-radius:var(--r-xs)}
#board .qd-seg-btn:hover{background:var(--surface-3);color:var(--text)}
#board .qd-seg-btn.on{background:var(--surface-4);color:var(--text)}
#board .qd-text-edit{outline-color:var(--info-line)}

@media (max-width:760px){
  #canvas-status,#hud-left .hud-sep{display:none}
}
@media (max-width:560px){
  #hud{top:8px;left:8px;right:8px}
  .hud-title span,#hud .ghost-btn span{display:none}
  .hud-group{padding-left:12px}
}
${MACRO_LINKS_CSS}
${URL_LINKS_CSS}
${CONFIRM_CSS}
#link-btn[hidden],#mpick-unlink[hidden],.mlink-run[hidden]{display:none}
`;

const ICON = (inner: string): string =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

// Mesmos traços de ui/scripts/icons.js (grade 24, traço 1.75).
const ICON_CANVAS = ICON(
  '<path d="M12.5 20H20"/><path d="M4 20l.9-3.6a2 2 0 0 1 .5-.9L15.8 5.1a2.1 2.1 0 0 1 3 3L8.4 18.6a2 2 0 0 1-.9.5z"/><path d="m14.5 6.5 3 3"/>',
);
const ICON_USERS = ICON(
  '<circle cx="9" cy="8" r="3.5"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.5A5 5 0 0 1 21.5 19v1"/>',
);
const ICON_TRASH = ICON(
  '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
);
const ICON_MARK = ICON(
  '<path d="M12.5 20H20"/><path d="M4 20l.9-3.6a2 2 0 0 1 .5-.9L15.8 5.1a2.1 2.1 0 0 1 3 3L8.4 18.6a2 2 0 0 1-.9.5z"/><path d="m14.5 6.5 3 3"/>',
);

const PAGE_BODY = `
<div id="hud">
  <div class="hud-group" id="hud-left">
    <h1 class="hud-title">${ICON_CANVAS}<span>Canvas</span></h1>
    <span class="hud-sep"></span>
    <span id="canvas-status" class="chip" title="Lousa única: tudo é salvo automaticamente no servidor"></span>
  </div>
  <div class="hud-group" id="hud-right">
    ${MACRO_LINKS_HUD}
    ${URL_LINKS_HUD}
    <span id="peers" class="chip" hidden title="Pessoas na lousa">${ICON_USERS}<span id="conn-count"></span></span>
    <span id="status" class="status warn"><span id="status-text">Conectando</span></span>
    ${TRANSFER_HUD}
    <button class="ghost-btn danger" type="button" onclick="clearBoard()" title="Apagar tudo (para todos)">${ICON_TRASH}<span>Limpar</span></button>
  </div>
</div>

<div id="board"></div>

<div id="board-empty" class="empty-state" hidden>
  <div class="empty-mark">${ICON_MARK}</div>
  <div class="empty-title">Lousa vazia</div>
  <div class="empty-hint">Desenhe com as ferramentas abaixo ou peça para a IA desenhar. Tudo aparece aqui em tempo real e é salvo sozinho.</div>
</div>

${MACRO_LINKS_HTML}
${URL_LINKS_HTML}
${CONFIRM_HTML}
<div id="toast"></div>
`;

const PAGE_SCRIPT = `
// Script clássico (não-módulo): roda mesmo se o módulo do board falhar.
// Compat: a logo do rail principal alterna a antiga sidebar via postMessage;
// sem drawer, é no-op.
window.toggleDrawer = function(){};
window.addEventListener('message', function(e){
  if (e.origin !== location.origin) return;
  if (e.data && e.data.type === 'docmap-canvas-toggle-drawer') window.toggleDrawer();
});
`;

const PAGE_MODULE = `
import { createQuickdraw, newId, pageBounds } from '/canvas/vendor/quickdraw/index.js';

var boardEl = document.getElementById('board');
var statusEl = document.getElementById('status');
var stxt = document.getElementById('status-text');
var cnt = document.getElementById('conn-count');
var peersEl = document.getElementById('peers');
var toastEl = document.getElementById('toast');
var saveEl = document.getElementById('canvas-status');
var emptyEl = document.getElementById('board-empty');
var reconnectAttempts = 0;
var MAX_RECONNECT = 20;
var ws = null;
var fittedOnce = false;
var loaded = false;

// Traço reto por padrão (dash 'solid'); o ondulado à mão continua
// disponível no menu de estilo (anel colorido, fileira de traços).
var board = createQuickdraw({
  container: boardEl,
  theme: docmapTheme(),
  grid: 'lines',
  watermark: false,
  styles: { dash: 'solid' },
});
var store = board.editor.store;

// ── Tema casado com o docmap ──
// O app guarda localStorage['docmap-theme'] ('dark' | 'light', mesma origem).
// Dark = sem atributo (como no index.html); light = data-theme='light'.
function docmapTheme(){
  try {
    return localStorage.getItem('docmap-theme') === 'light' ? 'light' : 'dark';
  } catch (e) { return 'dark'; }
}

function applyDocTheme(id){
  var root = document.documentElement;
  if (id === 'light') root.dataset.theme = 'light';
  else delete root.dataset.theme;
}

function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// A lib só traz light/dark fixos e pinta num canvas 2D (sem CSS vars).
// Aqui o papel, a grade e a seleção são lidos dos tokens do design system
// (ui/styles/tokens.css). O theme é objeto mutável compartilhado, então o
// patch vale até trocar de tema; reaplicamos no evento 'theme'.
function patchTheme(t){
  if (!t) return;
  applyDocTheme(t.id);
  t.background = cssVar('--surface');
  t.grid = {
    line: { minor: cssVar('--border-soft'), major: cssVar('--border-mid') },
    dot: { minor: cssVar('--border-mid'), major: cssVar('--border-hi') },
  };
  t.selection = cssVar('--info');
  t.selectionFill = cssVar('--info-dim');
  t.handleFill = cssVar('--surface-3');
  if (board.editor.requestRender) board.editor.requestRender();
}

patchTheme(board.editor.theme);
board.editor.on('theme', function(){ patchTheme(board.editor.theme); });

// Troca de tema no app (mesma origem): o evento 'storage' chega aqui.
window.addEventListener('storage', function(e){
  if (e.key !== null && e.key !== 'docmap-theme') return;
  var id = docmapTheme();
  if (board.editor.theme.id !== id) board.editor.setTheme(id);
});

// ── Textos da lib em português ──
// Os rótulos do menu e as dicas vêm em inglês do vendor (não editável):
// traduzimos no DOM, só apresentação.
var PT = {
  'Select':'Selecionar','Hand':'Mover','Draw':'Desenhar','Highlight':'Marca-texto',
  'Eraser':'Borracha','Laser':'Laser','Line':'Linha','Arrow':'Seta','Shape':'Forma',
  'Text':'Texto','Sticky note':'Nota adesiva','Insert image':'Inserir imagem',
  'Undo':'Desfazer','Redo':'Refazer','Board menu':'Menu da lousa',
  'More tools':'Mais ferramentas','Tools':'Ferramentas','Duplicate':'Duplicar',
  'Delete':'Excluir','Color & style':'Cor e estilo',
  'Export as PNG':'Exportar como PNG','Export — transparent':'Exportar com fundo transparente',
  'Export selection':'Exportar seleção','Copy as image':'Copiar como imagem',
  'Copy selection as image':'Copiar seleção como imagem','Delete selection':'Excluir seleção',
  'Zoom to fit':'Ajustar ao conteúdo','Clear board':'Limpar lousa',
  'Grid':'Grade','Theme':'Tema','None':'Nenhuma','Lines':'Linhas','Ruled':'Pautado',
  'Dots':'Pontos','Crosses':'Cruzes','Isometric':'Isométrica',
  'No grid':'Sem grade','Grid lines':'Grade de linhas','Ruled paper':'Papel pautado',
  'Grid dots':'Grade de pontos','Light theme':'Tema claro','Dark theme':'Tema escuro',
  'rectangle':'Retângulo','ellipse':'Elipse','triangle':'Triângulo','diamond':'Losango',
  'hexagon':'Hexágono','star':'Estrela','hand-drawn':'À mão livre','solid':'Sólido',
  'dashed':'Tracejado','dotted':'Pontilhado',
  'fill: none':'Sem preenchimento','fill: semi':'Preenchimento translúcido',
  'fill: solid':'Preenchimento sólido','fill: pattern':'Preenchimento hachurado',
  'Size S':'Tamanho P','Size M':'Tamanho M','Size L':'Tamanho G','Size XL':'Tamanho GG',
  'black':'Preto','grey':'Cinza','light-violet':'Violeta claro','violet':'Violeta',
  'blue':'Azul','light-blue':'Azul claro','yellow':'Amarelo','orange':'Laranja',
  'green':'Verde','light-green':'Verde claro','light-red':'Vermelho claro','red':'Vermelho'
};
function ptOf(s){
  if (!s) return null;
  if (Object.prototype.hasOwnProperty.call(PT, s)) return PT[s];
  var i = s.indexOf(' — ');
  if (i > 0) {
    var head = s.slice(0, i);
    if (Object.prototype.hasOwnProperty.call(PT, head)) return PT[head] + ' (' + s.slice(i + 3) + ')';
  }
  return null;
}
function localize(root){
  if (!root || root.nodeType !== 1) return;
  var list = [root].concat([].slice.call(root.querySelectorAll('[title],.qd-mi-label,.qd-mi-value')));
  list.forEach(function(n){
    var t = ptOf(n.getAttribute('title'));
    if (t) { n.setAttribute('title', t); n.setAttribute('aria-label', t); }
    if (n.classList.contains('qd-mi-label') || n.classList.contains('qd-mi-value')) {
      var x = ptOf(n.textContent);
      if (x && x !== n.textContent) n.textContent = x;
    }
  });
}
localize(boardEl);
new MutationObserver(function(recs){
  recs.forEach(function(r){
    localize(r.target.nodeType === 1 ? r.target : r.target.parentElement);
  });
}).observe(boardEl, { childList: true, subtree: true });

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

// Estado da conexão: ok (conectado), warn (conectando) ou danger (erro).
function setConn(kind, text){
  if (statusEl) statusEl.className = 'status ' + kind;
  if (stxt) stxt.textContent = text;
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
  if (peersEl) peersEl.hidden = !(n > 0);
}

// Rótulo da lousa única: contagem de formas (o servidor persiste sozinho).
function updateSaveLabel(){
  var n = store.size;
  if (saveEl) saveEl.textContent = n === 0 ? 'Vazia' : n + (n === 1 ? ' forma' : ' formas');
  if (emptyEl) emptyEl.hidden = !(loaded && n === 0);
}

// Qualquer mudança (local ou remota) atualiza o rótulo e agenda um frame.
store.listen(function(){
  updateSaveLabel();
  scheduleFrameUpload();
});

function applySnapshot(snapshot){
  loaded = true;
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
    setConn('danger', 'Falha na conexão');
    return;
  }
  var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(proto + '//' + location.host + '/canvas/ws');

  ws.onopen = function(){
    reconnectAttempts = 0;
    setConn('ok', 'Conectado');
  };

  ws.onmessage = function(e){
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'diff' && msg.diff) {
        store.applyDiff(msg.diff, 'remote');
        try { detectAiDiff(msg.diff); } catch(errAi){}
      }
      else if (msg.type === 'snapshot' && msg.snapshot && msg.reason === 'import') {
        onImportSnapshot(msg.snapshot);
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
          if (hadWork) showUndoToast('Lousa limpa por outra pessoa');
          else showToast('Lousa limpa para todos');
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
    setConn('warn', 'Reconectando');
    var delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts - 1), 30000);
    delay += Math.random() * 1000;
    setTimeout(connect, delay);
  };

  ws.onerror = function(){
    setConn('danger', 'Erro');
  };
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
  showToastUndo('IA adicionou ' + fresh.length + (fresh.length === 1 ? ' forma' : ' formas') + ' na lousa', 'Desfazer', function(){ undoAiShapes(fresh); }, 12000);
}

function undoAiShapes(ids){
  try {
    var existing = [];
    for (var i = 0; i < ids.length; i++) {
      if (store.records && store.records.has ? store.records.has(ids[i]) : store.getSnapshot().document.store[ids[i]]) existing.push(ids[i]);
    }
    if (!existing.length) { showToast('Nada a desfazer'); return; }
    store.remove(existing, 'user');
    showToast('Formas da IA removidas');
  } catch(e){ showToast('Falha ao desfazer'); }
}

// ── Limpar com guarda (afeta todos — confirma sempre) ──
function doClearBoard(){
  takeBackup('limpeza');
  expectingClearEcho = true;
  fetch('/canvas/clear', { method: 'POST' }).then(function(){
    showUndoToast('Lousa limpa para todos');
  }).catch(function(){ expectingClearEcho = false; showToast('Erro ao limpar'); });
}
function guardedClearBoard(){
  if (store.size === 0) { showToast('A lousa já está vazia'); return; }
  askConfirm('Apaga o desenho para todos. Logo depois dá para desfazer.', 'Limpar', true)
    .then(function(ok){ if (ok) doClearBoard(); });
}
window.clearBoard = guardedClearBoard;

${CONFIRM_JS}
${MACRO_LINKS_JS}
${URL_LINKS_JS}
${CLIPBOARD_JS}
${TRANSFER_JS}
updateSaveLabel();
connect();
`;

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>docmap · canvas</title>
<script>
// Tema antes da primeira pintura (sem flash). Dark = sem atributo.
try{if(localStorage.getItem('docmap-theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}
</script>
<link rel="stylesheet" href="/canvas/vendor/quickdraw/quickdraw.css">
<style>
${FONT_CSS}
${TOKENS_CSS}
${COMPONENTS_CSS}
${PAGE_CSS}
</style>
</head>
<body>
${PAGE_BODY}
<script>${PAGE_SCRIPT}</script>
<script type="module">${PAGE_MODULE}</script>
</body>
</html>`;

export const serveCanvasPage = (): Promise<Response> =>
  Promise.resolve(html(PAGE));
