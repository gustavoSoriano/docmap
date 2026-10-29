// Vínculo forma → macro no canvas. Uma forma `geo` ganha o campo `macroId`
// (só o id: título e input vêm sempre da macro original) e passa a exibir um
// selo "executar" sobre o canvas. O campo vive no record da forma, então o
// sync por diffs, o board.json e o desfazer do Quickdraw o carregam de graça.
//
// Strings injetadas em page.ts (PAGE_BODY / PAGE_CSS / PAGE_MODULE); o JS roda
// no mesmo módulo da página e reaproveita `board`, `store` e `showToast`.

const SVG = (inner: string): string =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const ICON_PLAY = SVG('<polygon points="6 4 20 12 6 20 6 4"/>');
const ICON_LINK = SVG(
  '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
);
const ICON_X = SVG('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');

/** Botão do HUD: aparece com uma única forma `geo` selecionada. */
export const MACRO_LINKS_HUD = `
    <button id="link-btn" class="ghost-btn" type="button" hidden title="Vincular esta forma a uma macro">${ICON_LINK}<span id="link-btn-label">Vincular macro</span></button>`;

/** Camada dos selos + modais (seletor de macro e pedido de input). */
export const MACRO_LINKS_HTML = `
<div id="mlinks"></div>

<div id="mpick" class="app-modal-overlay" role="dialog" aria-modal="true">
  <div class="app-modal">
    <div class="app-modal-head"><span>Vincular macro</span><button type="button" id="mpick-close" title="Fechar">${ICON_X}</button></div>
    <div class="app-modal-body">
      <input id="mpick-search" type="text" placeholder="Buscar macro" autocomplete="off">
      <div id="mpick-list"></div>
    </div>
    <div class="app-modal-actions">
      <button type="button" id="mpick-unlink" class="tool-btn danger" hidden>Remover vínculo</button>
      <button type="button" id="mpick-cancel" class="tool-btn">Cancelar</button>
    </div>
  </div>
</div>

<div id="mout" class="app-modal-overlay" role="dialog" aria-modal="true">
  <div class="app-modal wide">
    <div class="app-modal-head"><span id="mout-title">Saída</span><button type="button" id="mout-close" title="Fechar">${ICON_X}</button></div>
    <div class="app-modal-body">
      <div><span id="mout-status" class="status"></span></div>
      <pre id="mout-pre"></pre>
    </div>
    <div class="app-modal-actions">
      <button type="button" id="mout-copy" class="tool-btn">Copiar saída</button>
      <button type="button" id="mout-done" class="tool-btn">Fechar</button>
    </div>
  </div>
</div>

<div id="minput" class="app-modal-overlay" role="dialog" aria-modal="true">
  <form class="app-modal" id="minput-form">
    <div class="app-modal-head"><span id="minput-title">Executar macro</span></div>
    <div class="app-modal-body">
      <label><span id="minput-label"></span><input id="minput-value" type="text" autocomplete="off"></label>
    </div>
    <div class="app-modal-actions">
      <button type="button" id="minput-cancel" class="tool-btn">Cancelar</button>
      <button type="submit" class="tool-btn primary">Executar</button>
    </div>
  </form>
</div>`;

export const MACRO_LINKS_CSS = `
/* ── Vínculo forma → macro ── */
#mlinks{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden}
.mlink-run{position:absolute;width:28px;height:28px;padding:0;border:1px solid var(--accent);border-radius:var(--r-sm);background:var(--accent);color:var(--on-accent);display:grid;place-items:center;cursor:pointer;pointer-events:auto;box-shadow:var(--sh-sm);transition:background var(--dur)}
.mlink-run:hover{background:var(--accent-2)}
.mlink-run .ico{width:14px;height:14px}
.mlink-run.missing{background:var(--surface-3);border-color:var(--border-hi);color:var(--text-3)}
.mlink-run.running{cursor:progress;opacity:.7}
.mlink-run.running .ico{animation:mlink-pulse 1s ease-in-out infinite}
@keyframes mlink-pulse{50%{opacity:.25}}
#mpick-list{display:flex;flex-direction:column;gap:4px;max-height:320px;overflow-y:auto}
.mpick-row{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;padding:9px 12px;border:1px solid transparent;border-radius:var(--r-md);background:transparent;color:var(--text);text-align:left;cursor:pointer;transition:background var(--dur)}
.mpick-row:hover{background:var(--surface-3)}
.mpick-row.on{border-color:var(--accent-line);background:var(--accent-dim)}
.mpick-row .t{font-size:var(--fs-md);font-weight:600}
.mpick-row .s{font-size:var(--fs-sm);color:var(--text-3)}
#mout-pre{max-height:380px;overflow:auto;margin:0;padding:12px;border:1px solid var(--border-mid);border-radius:var(--r-md);background:var(--surface-2);color:var(--text);font-family:var(--font-mono);font-size:var(--fs-sm);line-height:1.55;white-space:pre-wrap;word-break:break-word}
#mout-pre .err{color:var(--danger)}
#mout-pre .none{color:var(--text-3)}
.mpick-empty{padding:18px 4px;color:var(--text-3);font-size:var(--fs-sm)}
`;

export const MACRO_LINKS_JS = `
// ── Vínculo forma → macro ──
var mlayer = document.getElementById('mlinks');
var linkBtn = document.getElementById('link-btn');
var linkBtnLabel = document.getElementById('link-btn-label');
var pickEl = document.getElementById('mpick');
var pickList = document.getElementById('mpick-list');
var pickSearch = document.getElementById('mpick-search');
var pickUnlink = document.getElementById('mpick-unlink');
var inputEl = document.getElementById('minput');
var macros = [];
var collections = {};
var badges = {};
var running = {};
var pickShapeId = null;
var syncQueued = false;
var BADGE = 28;
var OUT_CAP = 200000;
var lastRun = null;
var MIN_SHAPE_W = 72;
var PLAY_ICON = ${JSON.stringify(ICON_PLAY)};

function macroById(id){
  for (var i = 0; i < macros.length; i++) if (macros[i].id === id) return macros[i];
  return null;
}

function loadMacros(){
  return Promise.all([
    fetch('/macros').then(function(r){ return r.json(); }),
    fetch('/macros/collections').then(function(r){ return r.json(); }).catch(function(){ return []; }),
  ]).then(function(res){
    macros = Array.isArray(res[0]) ? res[0] : [];
    collections = {};
    (res[1] || []).forEach(function(c){ collections[c.id] = c.name; });
    syncLinks();
  }).catch(function(){ /* sem macros: selos aparecem como "não encontrada" */ });
}

function linkedShapes(){
  return store.shapes().filter(function(s){
    return s.type === 'geo' && typeof s.macroId === 'string' && s.macroId;
  });
}

function selectedGeo(){
  var sel = board.editor.selection;
  if (!sel || sel.size !== 1) return null;
  var s = store.get(Array.from(sel)[0]);
  return s && s.type === 'geo' ? s : null;
}

function badgeTitle(shape){
  var m = macroById(shape.macroId);
  if (!m) return 'Macro não encontrada. Selecione a forma e vincule outra';
  return running[shape.id] ? 'Executando ' + m.title : 'Executar ' + m.title;
}

function ensureBadge(shape){
  var el = badges[shape.id];
  if (el) return el;
  el = document.createElement('button');
  el.type = 'button';
  el.className = 'mlink-run';
  el.innerHTML = PLAY_ICON;
  el.onclick = function(){ runLink(store.get(shape.id) || shape); };
  mlayer.appendChild(el);
  badges[shape.id] = el;
  return el;
}

function syncLinks(){
  var linked = linkedShapes();
  var alive = {};
  linked.forEach(function(s){
    alive[s.id] = true;
    var el = ensureBadge(s);
    var b = pageBounds(s);
    var tl = board.editor.pageToScreen(b.x + b.w, b.y);
    var wScreen = b.w * board.editor.camera.z;
    el.hidden = wScreen < MIN_SHAPE_W;
    el.style.left = (tl.x - BADGE - 6) + 'px';
    el.style.top = (tl.y + 6) + 'px';
    el.title = badgeTitle(s);
    el.classList.toggle('missing', !macroById(s.macroId));
    el.classList.toggle('running', !!running[s.id]);
  });
  Object.keys(badges).forEach(function(id){
    if (alive[id]) return;
    badges[id].remove();
    delete badges[id];
  });
  var g = selectedGeo();
  linkBtn.hidden = !g;
  if (g) {
    var m = g.macroId ? macroById(g.macroId) : null;
    linkBtnLabel.textContent = g.macroId ? (m ? 'Macro: ' + m.title : 'Macro não encontrada') : 'Vincular macro';
  }
}

function queueSync(){
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(function(){ syncQueued = false; syncLinks(); });
}

// ── Seletor ──
function renderPick(){
  var shape = pickShapeId && store.get(pickShapeId);
  var q = pickSearch.value.trim().toLowerCase();
  var rows = macros.filter(function(m){
    return !q || (m.title + ' ' + m.name + ' ' + (m.description || '')).toLowerCase().indexOf(q) >= 0;
  });
  pickList.innerHTML = '';
  if (!rows.length) {
    var empty = document.createElement('div');
    empty.className = 'mpick-empty';
    empty.textContent = macros.length ? 'Nenhuma macro encontrada' : 'Nenhuma macro criada ainda';
    pickList.appendChild(empty);
  }
  rows.forEach(function(m){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mpick-row' + (shape && shape.macroId === m.id ? ' on' : '');
    var t = document.createElement('span');
    t.className = 't';
    t.textContent = m.title;
    var s = document.createElement('span');
    s.className = 's';
    s.textContent = (collections[m.collectionId] || 'Sem coleção') + ' · ' + m.name;
    b.appendChild(t);
    b.appendChild(s);
    b.onclick = function(){ linkMacro(m); };
    pickList.appendChild(b);
  });
}

function openPick(){
  var g = selectedGeo();
  if (!g) return;
  pickShapeId = g.id;
  pickSearch.value = '';
  pickUnlink.hidden = !g.macroId;
  pickEl.classList.add('visible');
  renderPick();
  loadMacros().then(renderPick);
  setTimeout(function(){ pickSearch.focus(); }, 30);
}

function closePick(){
  pickEl.classList.remove('visible');
  pickShapeId = null;
}

// Vincular/desvincular são edições locais ('user'): vão pelo WS, persistem e
// entram no histórico (Cmd+Z desfaz).
function linkMacro(m){
  var shape = pickShapeId && store.get(pickShapeId);
  closePick();
  if (!shape) return;
  var patch = { macroId: m.id };
  var label = shape.props && shape.props.label;
  if (!label) patch.props = { label: m.title };
  store.update(shape.id, patch);
  showToast('Forma vinculada a ' + m.title);
}

function unlinkMacro(){
  var shape = pickShapeId && store.get(pickShapeId);
  closePick();
  if (!shape) return;
  var next = Object.assign({}, shape);
  delete next.macroId;
  store.put(next);
  showToast('Vínculo removido');
}

// ── Execução ──
function askInput(m, done){
  document.getElementById('minput-title').textContent = m.title;
  document.getElementById('minput-label').textContent = m.inputLabel;
  var field = document.getElementById('minput-value');
  field.value = '';
  inputEl.classList.add('visible');
  setTimeout(function(){ field.focus(); }, 30);
  inputEl._done = done;
}

function closeInput(){
  inputEl.classList.remove('visible');
  inputEl._done = null;
}

// O stream é SSE: "event: stdout|stderr|exit" + "data: <string JSON>".
function readRun(res){
  var reader = res.body.getReader();
  var dec = new TextDecoder();
  var buf = '', evt = '', last = '', code = null, size = 0, cut = false;
  var lines_out = [];
  function eat(line){
    if (line.indexOf('event: ') === 0) { evt = line.slice(7); return; }
    if (line.indexOf('data: ') !== 0) return;
    var v;
    try { v = JSON.parse(line.slice(6)); } catch (e) { return; }
    if (evt === 'exit') { code = parseInt(v, 10); return; }
    var t = String(v).trim();
    if (t) last = t.split('\\n').pop();
    if (size > OUT_CAP) { cut = true; return; }
    size += String(v).length + 1;
    lines_out.push({ err: evt === 'stderr', text: String(v) });
  }
  function pump(){
    return reader.read().then(function(r){
      if (r.done) return { code: code, last: last, lines: lines_out, cut: cut };
      buf += dec.decode(r.value, { stream: true });
      var lines = buf.split('\\n');
      buf = lines.pop();
      lines.forEach(eat);
      return pump();
    });
  }
  return pump();
}

function doRun(shape, m, input){
  running[shape.id] = true;
  syncLinks();
  var opts = input === undefined
    ? { method: 'POST' }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: input }) };
  fetch('/macros/' + encodeURIComponent(m.id) + '/run', opts).then(function(res){
    if (res.status === 403) {
      return res.json().then(function(d){ throw new Error('Bloqueada: ' + (d.reason || 'sem motivo')); });
    }
    if (!res.ok) throw new Error('Falha ao executar (' + res.status + ')');
    return readRun(res);
  }).then(function(r){
    lastRun = { title: m.title, code: r.code, lines: r.lines, cut: r.cut };
    if (r.code === 0) {
      var tail = r.last ? ' — ' + r.last.slice(0, 80) : '';
      showToastUndo(m.title + ': concluída' + tail, 'Ver saída', openOut, 12000);
    } else {
      openOut();
    }
  }).catch(function(err){
    showToast(m.title + ': ' + err.message);
  }).then(function(){
    delete running[shape.id];
    syncLinks();
  });
}

// ── Painel de saída ──
var outEl = document.getElementById('mout');
var outPre = document.getElementById('mout-pre');

function openOut(){
  if (!lastRun) return;
  var ok = lastRun.code === 0;
  document.getElementById('mout-title').textContent = lastRun.title;
  var st = document.getElementById('mout-status');
  st.className = 'status ' + (ok ? 'ok' : 'danger');
  st.textContent = ok ? 'Concluída' : 'Saiu com código ' + (lastRun.code === null ? '?' : lastRun.code);
  outPre.innerHTML = '';
  if (!lastRun.lines.length) {
    var none = document.createElement('span');
    none.className = 'none';
    none.textContent = 'A macro não imprimiu nada';
    outPre.appendChild(none);
  }
  lastRun.lines.forEach(function(l){
    var row = document.createElement('div');
    if (l.err) row.className = 'err';
    row.textContent = l.text;
    outPre.appendChild(row);
  });
  if (lastRun.cut) {
    var cutEl = document.createElement('div');
    cutEl.className = 'none';
    cutEl.textContent = '… saída truncada';
    outPre.appendChild(cutEl);
  }
  outEl.classList.add('visible');
  outPre.scrollTop = outPre.scrollHeight;
}

function closeOut(){ outEl.classList.remove('visible'); }

function copyOut(){
  if (!lastRun) return;
  var text = lastRun.lines.map(function(l){ return l.text; }).join('\\n');
  if (!navigator.clipboard) { showToast('Não foi possível copiar'); return; }
  navigator.clipboard.writeText(text).then(function(){ showToast('Saída copiada'); });
}

document.getElementById('mout-close').onclick = closeOut;
document.getElementById('mout-done').onclick = closeOut;
document.getElementById('mout-copy').onclick = copyOut;
outEl.addEventListener('pointerdown', function(e){ if (e.target === outEl) closeOut(); });

function runLink(shape){
  var m = macroById(shape.macroId);
  if (!m) { showToast('Macro não encontrada. Selecione a forma e vincule outra'); return; }
  if (running[shape.id]) return;
  if (m.inputLabel) askInput(m, function(v){ doRun(shape, m, v); });
  else doRun(shape, m);
}

linkBtn.onclick = openPick;
document.getElementById('mpick-close').onclick = closePick;
document.getElementById('mpick-cancel').onclick = closePick;
pickUnlink.onclick = unlinkMacro;
pickSearch.oninput = renderPick;
pickEl.addEventListener('pointerdown', function(e){ if (e.target === pickEl) closePick(); });
document.getElementById('minput-cancel').onclick = closeInput;
document.getElementById('minput-form').onsubmit = function(e){
  e.preventDefault();
  var done = inputEl._done;
  var v = document.getElementById('minput-value').value;
  closeInput();
  if (done) done(v);
};
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  if (outEl.classList.contains('visible')) closeOut();
  else if (pickEl.classList.contains('visible')) closePick();
  else if (inputEl.classList.contains('visible')) closeInput();
});

board.editor.on('camera', queueSync);
board.editor.on('selection', queueSync);
store.listen(queueSync);
loadMacros();
`;
