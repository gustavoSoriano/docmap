// Vínculo forma → link no canvas. Uma forma `geo` ganha o campo `url` (http/s)
// e exibe um selo "abrir" sobre o canvas; o clique abre o link no navegador
// do sistema via POST /system/open-url (o webview não suporta window.open e o
// iframe não tem allow-popups). Como o `macroId`, o campo vive no record da
// forma: sync por diffs, board.json e desfazer o carregam sem código extra.
//
// Strings injetadas em page.ts; o JS roda no mesmo módulo da página e
// reaproveita `board`, `store`, `showToast` e `selectedGeo` (macro-links.ts).

const SVG = (inner: string): string =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const ICON_OPEN = SVG(
  '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
);
const ICON_GLOBE = SVG(
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
);
const ICON_X = SVG('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');

/** Botão do HUD: aparece com uma única forma `geo` selecionada. */
export const URL_LINKS_HUD = `
    <button id="url-btn" class="ghost-btn" type="button" hidden title="Vincular esta forma a um link">${ICON_GLOBE}<span id="url-btn-label">Vincular link</span></button>`;

/** Modal de edição do link. */
export const URL_LINKS_HTML = `
<div id="upick" class="app-modal-overlay" role="dialog" aria-modal="true">
  <form class="app-modal" id="upick-form">
    <div class="app-modal-head"><span>Vincular link</span><button type="button" id="upick-close" title="Fechar">${ICON_X}</button></div>
    <div class="app-modal-body">
      <label><span>Endereço (abre no navegador ao clicar)</span><input id="upick-value" type="text" placeholder="https://exemplo.com" autocomplete="off" spellcheck="false"></label>
    </div>
    <div class="app-modal-actions">
      <button type="button" id="upick-unlink" class="tool-btn danger" hidden>Remover link</button>
      <button type="button" id="upick-cancel" class="tool-btn">Cancelar</button>
      <button type="submit" class="tool-btn primary">Salvar</button>
    </div>
  </form>
</div>`;

export const URL_LINKS_CSS = `
/* ── Vínculo forma → link ── */
.mlink-open{position:absolute;width:28px;height:28px;padding:0;border:1px solid var(--border-hi);border-radius:var(--r-sm);background:var(--surface-3);color:var(--info);display:grid;place-items:center;cursor:pointer;pointer-events:auto;box-shadow:var(--sh-sm);transition:background var(--dur)}
.mlink-open:hover{background:var(--surface-4)}
.mlink-open .ico{width:14px;height:14px}
#url-btn[hidden],#upick-unlink[hidden],.mlink-open[hidden]{display:none}
`;

export const URL_LINKS_JS = `
// ── Vínculo forma → link ──
var urlBtn = document.getElementById('url-btn');
var urlBtnLabel = document.getElementById('url-btn-label');
var upickEl = document.getElementById('upick');
var upickField = document.getElementById('upick-value');
var upickUnlink = document.getElementById('upick-unlink');
var urlBadges = {};
var urlShapeId = null;
var urlSyncQueued = false;
var OPEN_ICON = ${JSON.stringify(ICON_OPEN)};

// Aceita "exemplo.com" (assume https) e rejeita o que não for http(s).
function normalizeUrl(raw){
  var t = String(raw || '').trim();
  if (!t) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = 'https://' + t;
  if (/\\s/.test(t) || t.length > 2000) return null;
  try {
    var u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:' ? t : null;
  } catch (e) { return null; }
}

function urlHost(url){
  try { return new URL(url).host; } catch (e) { return url; }
}

function urlShapes(){
  return store.shapes().filter(function(s){
    return s.type === 'geo' && typeof s.url === 'string' && s.url;
  });
}

function ensureUrlBadge(shape){
  var el = urlBadges[shape.id];
  if (el) return el;
  el = document.createElement('button');
  el.type = 'button';
  el.className = 'mlink-open';
  el.innerHTML = OPEN_ICON;
  el.onclick = function(){ openLinkUrl((store.get(shape.id) || shape).url); };
  mlayer.appendChild(el);
  urlBadges[shape.id] = el;
  return el;
}

// Fica à esquerda do selo da macro (se houver), no mesmo canto da forma.
function syncUrlLinks(){
  var alive = {};
  urlShapes().forEach(function(s){
    alive[s.id] = true;
    var el = ensureUrlBadge(s);
    var b = pageBounds(s);
    var tr = board.editor.pageToScreen(b.x + b.w, b.y);
    var slots = s.macroId ? 2 : 1;
    el.hidden = b.w * board.editor.camera.z < MIN_SHAPE_W;
    el.style.left = (tr.x - slots * (BADGE + 4) - 2) + 'px';
    el.style.top = (tr.y + 6) + 'px';
    el.title = 'Abrir ' + urlHost(s.url);
  });
  Object.keys(urlBadges).forEach(function(id){
    if (alive[id]) return;
    urlBadges[id].remove();
    delete urlBadges[id];
  });
  var g = selectedGeo();
  urlBtn.hidden = !g;
  if (g) urlBtnLabel.textContent = g.url ? 'Link: ' + urlHost(g.url) : 'Vincular link';
}

function queueUrlSync(){
  if (urlSyncQueued) return;
  urlSyncQueued = true;
  requestAnimationFrame(function(){ urlSyncQueued = false; syncUrlLinks(); });
}

function openLinkUrl(url){
  fetch('/system/open-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url }),
  }).then(function(res){
    if (!res.ok) throw new Error('status ' + res.status);
  }).catch(function(){ showToast('Não foi possível abrir o link'); });
}

function openUrlPick(){
  var g = selectedGeo();
  if (!g) return;
  urlShapeId = g.id;
  upickField.value = g.url || '';
  upickUnlink.hidden = !g.url;
  upickEl.classList.add('visible');
  setTimeout(function(){ upickField.focus(); upickField.select(); }, 30);
}

function closeUrlPick(){
  upickEl.classList.remove('visible');
  urlShapeId = null;
}

// Edições locais ('user'): vão pelo WS, persistem e entram no histórico.
function saveUrl(){
  var shape = urlShapeId && store.get(urlShapeId);
  var url = normalizeUrl(upickField.value);
  if (url === null) { showToast('Link inválido: use um endereço http ou https'); return; }
  closeUrlPick();
  if (!shape) return;
  if (!url) { removeUrl(shape); return; }
  store.update(shape.id, { url: url });
  showToast('Forma vinculada a ' + urlHost(url));
}

function removeUrl(shape){
  var next = Object.assign({}, shape);
  delete next.url;
  store.put(next);
  showToast('Link removido');
}

urlBtn.onclick = openUrlPick;
document.getElementById('upick-close').onclick = closeUrlPick;
document.getElementById('upick-cancel').onclick = closeUrlPick;
upickUnlink.onclick = function(){
  var shape = urlShapeId && store.get(urlShapeId);
  closeUrlPick();
  if (shape) removeUrl(shape);
};
document.getElementById('upick-form').onsubmit = function(e){
  e.preventDefault();
  saveUrl();
};
upickEl.addEventListener('pointerdown', function(e){ if (e.target === upickEl) closeUrlPick(); });
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && upickEl.classList.contains('visible')) closeUrlPick();
});

board.editor.on('camera', queueUrlSync);
board.editor.on('selection', queueUrlSync);
store.listen(queueUrlSync);
syncUrlLinks();
`;
