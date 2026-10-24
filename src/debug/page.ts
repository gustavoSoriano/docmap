// ════ Página standalone do Debug Audit, servida em /debug ════
// Standalone (iframe): não herda o CSS do app. Fonte, tokens e componentes
// vêm de ui-shared.gen.ts (gerado por scripts/bundle-ui.ts).

import { html } from '../server/response.ts';
import {
  COMPONENTS_CSS,
  FONT_CSS,
  TOKENS_CSS,
} from '../server/handlers/ui-shared.gen.ts';

const PAGE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{display:flex;flex-direction:column;height:100vh;overflow:hidden;background:var(--bg);color:var(--text);font-family:var(--font-ui);font-size:var(--fs-md);line-height:1.5;-webkit-font-smoothing:antialiased}
button,input{font-family:inherit}
button{color:inherit}
.ico{width:16px;height:16px;flex-shrink:0}
.mono{font-family:var(--font-mono)}

/* ── Cabeçalho: título, contadores e hora de atualização ── */
#debug-header{flex-shrink:0;height:var(--head-h);padding:0 22px;display:flex;align-items:center;gap:14px}
#debug-title{display:flex;align-items:center;gap:10px;font-size:var(--fs-xl);font-weight:650;font-stretch:var(--stretch-display);letter-spacing:-.015em}
#debug-title .ico{width:22px;height:22px;color:var(--text-2)}
#debug-stats{display:flex;align-items:center;gap:6px}
.stat{height:24px;padding:0 9px;gap:6px}
.stat strong{font-weight:650;color:var(--text);font-variant-numeric:tabular-nums}
#debug-update{margin-left:auto;font-size:var(--fs-xs);color:var(--text-3);font-variant-numeric:tabular-nums}

/* ── Ilhas: sessões à esquerda, detalhe à direita ── */
#debug-main{flex:1;min-height:0;display:flex;gap:var(--gap);padding:0 var(--gap) var(--gap)}
#debug-sessions,#debug-detail{min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-island)}
#debug-sessions{width:var(--sidebar-w);flex-shrink:0}
#debug-detail{flex:1}
.pane-head{flex-shrink:0;height:52px;padding:0 14px 0 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)}
.pane-title{font-size:var(--fs-md);font-weight:650;color:var(--text)}

/* ── Lista de sessões ── */
#debug-session-list{flex:1;min-height:0;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:2px}
.session-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px 8px;padding:10px 10px 8px 14px;border-radius:var(--r-md);cursor:pointer;transition:background var(--dur)}
.session-card:hover{background:var(--surface-3)}
.session-card.active{background:var(--surface-3);box-shadow:inset 3px 0 0 var(--accent)}
.session-id{grid-column:1 / -1;font-family:var(--font-mono);font-size:var(--fs-sm);font-weight:560;color:var(--text);overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.45}
.session-meta{display:flex;align-items:center;gap:8px;min-width:0;font-size:var(--fs-xs);color:var(--text-3)}
.session-meta .chip{background:var(--surface-4);color:var(--text-2);font-variant-numeric:tabular-nums}
.session-ts{font-family:var(--font-mono);font-variant-numeric:tabular-nums}
.session-actions{display:flex;align-items:center;gap:2px}
.session-btn{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 8px;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-3);font-size:var(--fs-xs);font-weight:600;cursor:pointer;transition:background var(--dur),color var(--dur)}
.session-btn:hover{background:var(--surface-4);color:var(--text)}
.session-btn.danger:hover{background:var(--danger-dim);color:var(--danger)}
.session-btn .ico{width:14px;height:14px}
.session-btn.busy{opacity:.5;pointer-events:none}
.session-card .session-btn{width:28px;padding:0;justify-content:center}
.session-card .session-btn .lbl{display:none}
#debug-detail-actions .session-btn{height:30px;padding:0 10px;color:var(--text-2)}
#debug-detail-actions .session-btn .ico{width:15px;height:15px}

/* ── Cabeçalho do detalhe ── */
#debug-detail-title{min-width:0;font-size:var(--fs-md);font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#debug-detail-title.is-id{font-family:var(--font-mono);font-size:var(--fs-sm);font-weight:560}
#debug-detail-count{flex-shrink:0}
#debug-detail-count:empty{display:none}
#debug-detail-actions{margin-left:auto;display:flex;align-items:center;gap:2px}

/* ── Filtros ── */
#debug-filters{flex-shrink:0;padding:10px 14px;border-bottom:1px solid var(--border);display:none;align-items:center;gap:10px;flex-wrap:wrap}
#debug-filters.visible{display:flex}
.search{position:relative;display:flex;align-items:center}
.search .ico{position:absolute;left:11px;top:50%;margin-top:-7.5px;width:15px;height:15px;color:var(--text-3);pointer-events:none}
#debug-search{width:220px;height:32px;padding:0 12px 0 33px;font-size:var(--fs-sm);background:var(--surface-2);border-radius:var(--r-sm)}
.kinds{display:flex;gap:6px;flex-wrap:wrap}
.kind-chip{display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border:1px solid var(--border-mid);border-radius:var(--r-sm);background:transparent;color:var(--text-2);font-size:var(--fs-xs);font-weight:600;cursor:pointer;transition:background var(--dur),color var(--dur),border-color var(--dur)}
.kind-chip:hover{background:var(--surface-3);color:var(--text)}
.kind-chip.on{background:var(--surface-4);border-color:var(--border-hi);color:var(--text)}
.kind-chip .n{color:var(--text-3);font-weight:560;font-variant-numeric:tabular-nums}
.kind-dot{width:7px;height:7px;border-radius:50%;background:var(--text-4);flex-shrink:0}
.kind-dot.danger{background:var(--danger)}
.kind-dot.warn{background:var(--warn)}
.kind-dot.ok{background:var(--ok)}
.kind-dot.info{background:var(--info)}
#debug-sheet-actions{margin-left:auto;display:flex;gap:2px}
#debug-sheet-actions .session-btn{height:28px;color:var(--text-2)}

/* ── Linha do tempo ── */
#debug-entries{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;padding:8px}
#debug-entries-content{display:block}
.tl-empty-note{padding:36px 12px;text-align:center;color:var(--text-3);font-size:var(--fs-md)}
#debug-timeline{--c-time:96px;--c-kind:92px;--c-gap:12px;display:flex;flex-direction:column;gap:2px}
.tl-item{border-radius:var(--r-md);transition:background var(--dur)}
.tl-item:hover,.tl-item.open{background:var(--surface-3)}
.tl-head{width:100%;min-height:40px;padding:6px 12px;display:grid;grid-template-columns:var(--c-time) var(--c-kind) minmax(0,1fr) auto 16px;align-items:center;column-gap:var(--c-gap);border:0;background:transparent;text-align:left;cursor:pointer;border-radius:var(--r-md)}
.tl-ts{font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--text-3);font-variant-numeric:tabular-nums}
.tl-kind{justify-self:start;display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 8px;border-radius:var(--r-xs);background:var(--surface-4);color:var(--text-2);font-size:var(--fs-xs);font-weight:600;max-width:100%}
.tl-kind::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--text-4);flex-shrink:0}
.tl-kind span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tl-kind.danger{background:var(--danger-dim);color:var(--danger)}
.tl-kind.danger::before{background:var(--danger)}
.tl-kind.warn{background:var(--warn-dim);color:var(--warn)}
.tl-kind.warn::before{background:var(--warn)}
.tl-kind.ok{background:var(--ok-dim);color:var(--ok)}
.tl-kind.ok::before{background:var(--ok)}
.tl-kind.info{background:var(--info-dim);color:var(--info)}
.tl-kind.info::before{background:var(--info)}
.tl-title{min-width:0;font-size:13px;font-weight:560;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tl-seq{font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--text-3);font-variant-numeric:tabular-nums}
.tl-chev{display:grid;place-items:center;color:var(--text-3);transition:transform .18s var(--ease)}
.tl-chev .ico{width:15px;height:15px}
.tl-item.open .tl-chev{transform:rotate(180deg)}
.tl-body{display:none;padding:0 12px 12px calc(12px + var(--c-time) + var(--c-kind) + var(--c-gap) * 2)}
.tl-item.open .tl-body{display:block}
.tl-body pre{margin:0;padding:12px 14px;max-height:340px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font-family:var(--font-mono);font-size:var(--fs-xs);line-height:1.6;color:var(--text-2);background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm)}

/* ── Carregando ── */
#debug-loading{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-3);font-size:var(--fs-md)}
#debug-loading.visible{display:flex}
#debug-loading .spinner{width:22px;height:22px;border:2px solid var(--border-hi);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── Estados vazios (padrão .empty-state de components.css) ── */
#debug-empty-state{padding:24px}
#debug-session-list .empty-state{padding:32px 16px}
#debug-session-list .empty-mark{width:52px;height:52px;border-radius:16px}
#debug-session-list .empty-mark .ico{width:24px;height:24px}
#debug-session-list .empty-title{font-size:var(--fs-lg)}
#debug-session-list .empty-hint{font-size:var(--fs-sm)}
#debug-empty-state .empty-mark,#debug-session-list .empty-mark{background:var(--surface-3)}

/* ── Aviso (toast) ── */
#debug-toast{position:fixed;bottom:22px;left:50%;transform:translate(-50%,8px);padding:9px 16px;border:1px solid var(--border-hi);border-radius:var(--r-lg);background:var(--surface-4);color:var(--text);font-size:var(--fs-sm);font-weight:560;box-shadow:var(--sh-md);opacity:0;pointer-events:none;transition:opacity .22s var(--ease),transform .22s var(--ease);z-index:100}
#debug-toast.visible{opacity:1;transform:translate(-50%,0)}

@media (max-width:1180px){
  #debug-sheet-actions{order:2}
  .kinds{order:3;flex-basis:100%;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}
  .kind-chip{flex-shrink:0}
}
@media (max-width:760px){
  #debug-sessions{width:var(--sidebar-w-tablet)}
  #debug-timeline{--c-time:84px;--c-kind:84px;--c-gap:10px}
  .tl-seq{display:none}
  .tl-head{grid-template-columns:var(--c-time) var(--c-kind) minmax(0,1fr) 16px}
  #debug-search{width:170px}
}
@media (max-width:560px){
  #debug-main{flex-direction:column}
  #debug-sessions{width:auto;height:34%;flex-shrink:0}
  #debug-timeline{--c-time:0px;--c-kind:78px}
  .tl-ts{display:none}
  .tl-head{grid-template-columns:var(--c-kind) minmax(0,1fr) 16px}
  .tl-body{padding-left:12px}
  #debug-header{padding:0 14px}
  #debug-update{display:none}
}
`;

const PAGE_BODY = `
<header id="debug-header">
  <h1 id="debug-title"><span data-icon="bug"></span>Debug</h1>
  <div id="debug-stats">
    <span class="chip stat">Sessões <strong id="stat-sessions">0</strong></span>
    <span class="chip stat">Entradas <strong id="stat-entries">0</strong></span>
  </div>
  <span id="debug-update">Atualizado às --:--:--</span>
</header>

<main id="debug-main">
  <aside id="debug-sessions">
    <div class="pane-head"><span class="pane-title" id="debug-sessions-head">Sessões</span></div>
    <div id="debug-session-list"></div>
  </aside>
  <section id="debug-detail">
    <div class="pane-head" id="debug-detail-head">
      <span id="debug-detail-title">Selecione uma sessão</span>
      <span class="chip" id="debug-detail-count"></span>
      <div id="debug-detail-actions"></div>
    </div>
    <div id="debug-filters">
      <label class="search">
        <span data-icon="search"></span>
        <input id="debug-search" class="field" type="text"
          placeholder="Filtrar por texto" aria-label="Filtrar entradas por texto" autocomplete="off" />
      </label>
      <div class="kinds" id="debug-kinds"></div>
      <div id="debug-sheet-actions">
        <button class="session-btn" id="tl-expand-all" title="Abrir todas as entradas">Expandir</button>
        <button class="session-btn" id="tl-collapse-all" title="Fechar todas as entradas">Recolher</button>
      </div>
    </div>
    <div id="debug-entries">
      <div id="debug-empty-state" class="empty-state">
        <div class="empty-mark" data-icon="bug"></div>
        <div class="empty-title">Nenhuma sessão aberta</div>
        <div class="empty-hint">Escolha uma sessão na lista para acompanhar as entradas em tempo real.</div>
      </div>
      <div id="debug-loading"><div class="spinner"></div><div>Carregando entradas</div></div>
      <div id="debug-entries-content"></div>
    </div>
  </section>
</main>

<div id="debug-toast"></div>
`;

const PAGE_SCRIPT = `
(function(){
  // Mesmos traços de ui/scripts/icons.js (grade 24, traço 1.75).
  var ICONS = {
    bug:'<path d="M9 8.5V8a3 3 0 0 1 6 0v.5"/><path d="M7 12a5 5 0 0 1 10 0v2.5a5 5 0 0 1-10 0z"/><path d="M12 11v9M7 13.5H3.5M17 13.5h3.5M7.5 18 4.5 19.5M16.5 18l3 1.5M8 5 6.5 3.5M16 5l1.5-1.5"/>',
    copy:'<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    trash:'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'chevron-down':'<path d="m6 9 6 6 6-6"/>'
  };
  var icon = function(name){ return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>'; };
  var el = function(id){ return document.getElementById(id); };
  var toastEl = el('debug-toast');
  var toastTimer = null;
  var currentSessionId = null;
  var sessions = [];
  var refreshTimer = null;

  // ── Tema: o app guarda localStorage['docmap-theme'] ('dark' | 'light').
  // Dark = sem atributo (como no index.html); reage ao evento 'storage'.
  function setTheme(){
    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem('docmap-theme'); } catch(e){}
    if (stored === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
  }

  function showToast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('visible'); }, 2000);
  }

  function formatTime(d){
    var hh = String(d.getHours()).padStart(2,'0');
    var mm = String(d.getMinutes()).padStart(2,'0');
    var ss = String(d.getSeconds()).padStart(2,'0');
    return hh + ':' + mm + ':' + ss;
  }

  function plural(n, one, many){ return n + ' ' + (n === 1 ? one : many); }

  function updateHeader(){
    var total = sessions.reduce(function(s, x){ return s + x.count; }, 0);
    el('stat-sessions').textContent = sessions.length;
    el('stat-entries').textContent = total;
    el('debug-update').textContent = 'Atualizado às ' + formatTime(new Date());
  }

  // Estado vazio no padrão .empty-state: título + dica.
  function setEmpty(box, title, hint){
    if (!box) return;
    var t = box.querySelector('.empty-title');
    var h = box.querySelector('.empty-hint');
    if (t) t.textContent = title;
    if (h) h.textContent = hint || '';
  }

  function renderSessions(){
    var list = el('debug-session-list');
    if (!sessions.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-mark" data-icon="bug"></div>' +
        '<div class="empty-title">Nenhuma sessão ainda</div>' +
        '<div class="empty-hint">Quando um agente enviar logs de depuração, a sessão aparece aqui sozinha.</div></div>';
      hydrateIcons();
      return;
    }
    list.innerHTML = sessions.map(function(s){
      var sid = encodeURIComponent(s.sessionId);
      return '<div class="session-card' + (s.sessionId === currentSessionId ? ' active' : '') + '" data-session="' + sid + '" role="button" tabindex="0" title="' + escHtml(s.sessionId) + '">' +
        '<div class="session-id">' + escHtml(s.sessionId) + '</div>' +
        '<div class="session-meta"><span class="chip">' + plural(s.count, 'entrada', 'entradas') + '</span><span class="session-ts">' + (s.lastTs || '') + '</span></div>' +
        '<div class="session-actions">' +
          '<button class="session-btn copy-session" data-session="' + sid + '" title="Copiar comando GET">' + icon('copy') + '<span class="lbl">GET</span></button>' +
          '<button class="session-btn danger delete-session" data-session="' + sid + '" title="Excluir sessão" aria-label="Excluir sessão">' + icon('trash') + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
    hydrateIcons();
  }

  function attachSessionListEvents(){
    var list = el('debug-session-list');
    if (!list) return;
    list.addEventListener('click', function(e){
      var target = e.target;
      if (!(target instanceof Element)) return;
      var btn = target.closest('.session-btn');
      if (btn) {
        var sessionId = decodeURIComponent(btn.dataset.session || '');
        if (!sessionId) return;
        if (btn.classList.contains('delete-session')) {
          e.stopPropagation();
          deleteSession(sessionId);
        } else if (btn.classList.contains('copy-session')) {
          e.stopPropagation();
          copySession(sessionId);
        }
        return;
      }
      var card = target.closest('.session-card');
      if (card) {
        selectSession(decodeURIComponent(card.dataset.session || ''));
      }
    });
    // Teclado: Enter/Espaço no cartão focado abre a sessão.
    list.addEventListener('keydown', function(e){
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var target = e.target;
      if (!(target instanceof Element) || !target.classList.contains('session-card')) return;
      e.preventDefault();
      selectSession(decodeURIComponent(target.dataset.session || ''));
    });
  }

  function attachDetailEvents(){
    var actions = el('debug-detail-actions');
    if (!actions) return;
    actions.addEventListener('click', function(e){
      var target = e.target;
      if (!(target instanceof Element)) return;
      var btn = target.closest('.session-btn');
      if (!btn) return;
      if (btn.id === 'detail-delete') {
        if (currentSessionId) deleteSession(currentSessionId);
      } else if (btn.id === 'detail-copy') {
        if (currentSessionId) copySession(currentSessionId);
      }
    });
  }

  function escHtml(str){
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Timeline de entradas ──
  var expandedSet = new Set();   // aberturas manuais (por seq)
  var collapsedSet = new Set();  // fechamentos manuais (por seq)
  var currentKind = '';
  var searchText = '';
  var lastScrolledSeq = 0;

  var entriesContainer = function(){ return el('debug-entries'); };

  // Auto-scroll só quando o usuário já está perto do fim do feed.
  function nearBottom(){
    var box = entriesContainer();
    if (!box) return false;
    return box.scrollTop + box.clientHeight >= box.scrollHeight - 80;
  }

  function maybeAutoScroll(lastSeq){
    if (lastSeq <= lastScrolledSeq) return;
    var shouldFollow = lastScrolledSeq === 0 || nearBottom();
    lastScrolledSeq = lastSeq;
    if (!shouldFollow) return;
    var box = entriesContainer();
    var last = box && box.querySelector('.tl-item:last-child');
    if (last) last.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }

  // Tipo da entrada -> cor semântica do chip (danger / warn / ok / info / neutro).
  var KIND_CLASS = {
    error:'danger', fail:'danger',
    warning:'warn', warn:'warn',
    ok:'ok', done:'ok',
    decision:'info', todo:'info', question:'info', reference:'info'
  };

  function kindOf(p){
    var raw = (p && typeof p === 'object')
      ? (p.type || p.kind || p.level || p.severity || '')
      : '';
    raw = String(raw || '').toLowerCase().split(/[^a-z]/)[0] || 'log';
    if (raw === 'warn') raw = 'warning';
    if (raw === 'fail') raw = 'error';
    return raw === 'log' && (p && (p.error || p.err)) ? 'error' : (raw || 'log');
  }

  function titleOf(p, fallback){
    if (p && typeof p === 'object') {
      var keys = ['title','message','msg','summary','step','label','action','event'];
      for (var i = 0; i < keys.length; i++) {
        var v = p[keys[i]];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      if (typeof p.error === 'string' && p.error.trim()) return p.error.trim();
    }
    return fallback;
  }

  function kindClassOf(kind){
    return Object.prototype.hasOwnProperty.call(KIND_CLASS, kind) ? KIND_CLASS[kind] : '';
  }

  function isErrKind(kind){ return kind === 'error' || kind === 'warning'; }

  function filteredEntries(entries){
    var t = searchText.trim().toLowerCase();
    return entries.filter(function(e){
      if (currentKind && kindOf(e.payload) !== currentKind) return false;
      if (t) {
        var text = JSON.stringify(e.payload || {}).toLowerCase();
        var head = titleOf(e.payload, '').toLowerCase();
        if (text.indexOf(t) < 0 && head.indexOf(t) < 0) return false;
      }
      return true;
    });
  }

  function renderKindChips(entries){
    var all = {};
    entries.forEach(function(e){ var k = kindOf(e.payload); all[k] = (all[k] || 0) + 1; });
    var kinds = Object.keys(all).sort(function(a, b){ return all[b] - all[a]; });
    var box = el('debug-kinds');
    if (!box) return;
    var chips = ['<button class="kind-chip' + (currentKind ? '' : ' on') + '" data-kind="">Todos <span class="n">' + entries.length + '</span></button>']
      .concat(kinds.map(function(k){
        return '<button class="kind-chip' + (currentKind === k ? ' on' : '') + '" data-kind="' + escHtml(k) + '"><span class="kind-dot ' + kindClassOf(k) + '"></span>' + escHtml(k) + ' <span class="n">' + all[k] + '</span></button>';
      }));
    box.innerHTML = chips.join('');
  }

  function toggleHtml(e, open, title, kind){
    return '<article class="tl-item' + (open ? ' open' : '') + (isErrKind(kind) ? ' ' + kind : '') +
      '" data-seq="' + e.seq + '" data-kind="' + escHtml(kind) + '">' +
      '<button type="button" class="tl-head" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        '<span class="tl-ts">' + escHtml(e.ts) + '</span>' +
        '<span class="tl-kind ' + kindClassOf(kind) + '"><span>' + escHtml(kind) + '</span></span>' +
        '<span class="tl-title" title="' + escHtml(title) + '">' + escHtml(title) + '</span>' +
        '<span class="tl-seq">#' + e.seq + '</span>' +
        '<span class="tl-chev">' + icon('chevron-down') + '</span></button>' +
      '<div class="tl-body"><pre>' + escHtml(JSON.stringify(e.payload, null, 2)) + '</pre></div>' +
    '</article>';
  }

  function renderSetupFor(entries){
    var errCount = entries.filter(function(e){ return isErrKind(kindOf(e.payload)); }).length;
    var lastSeq = entries.length ? entries[entries.length - 1].seq : 0;
    return { errCount: errCount, lastSeq: lastSeq };
  }

  function renderEntries(entries){
    var title = el('debug-detail-title');
    var count = el('debug-detail-count');
    var actions = el('debug-detail-actions');
    var filters = el('debug-filters');
    var wrap = el('debug-entries-content');
    var empty = el('debug-empty-state');
    var loading = el('debug-loading');

    title.textContent = currentSessionId || 'Selecione uma sessão';
    title.classList.toggle('is-id', !!currentSessionId);
    count.textContent = entries.length ? plural(entries.length, 'entrada', 'entradas') : '';
    actions.innerHTML = currentSessionId ?
      '<button class="session-btn" id="detail-copy" title="Copiar comando GET">' + icon('copy') + '<span class="lbl">GET</span></button>' +
      '<button class="session-btn danger" id="detail-delete" title="Excluir sessão" aria-label="Excluir sessão">' + icon('trash') + '</button>' : '';
    if (filters) filters.classList.toggle('visible', entries.length > 0);

    if (loading) loading.classList.remove('visible');

    if (!entries.length) {
      if (wrap) wrap.innerHTML = '';
      if (wrap) wrap.style.display = 'none';
      if (empty) {
        empty.style.display = '';
        setEmpty(empty, 'Nenhuma entrada nesta sessão', 'A sessão existe, mas ainda não recebeu logs. Novas entradas aparecem aqui sozinhas.');
      }
      return;
    }

    if (empty) empty.style.display = 'none';
    if (wrap) wrap.style.display = '';

    var visible = filteredEntries(entries);
    renderKindChips(entries);
    var setup = renderSetupFor(visible.length ? visible : entries);

    var items = visible.map(function(e){
      var kind = kindOf(e.payload);
      var title = titleOf(e.payload, '#' + e.seq);
      var open;
      if (collapsedSet.has(e.seq)) open = false;
      else if (expandedSet.has(e.seq)) open = true;
      else open = e.seq === setup.lastSeq || isErrKind(kind) || visible.length <= 3;
      return toggleHtml(e, open, title, kind);
    }).join('');

    wrap.innerHTML = visible.length
      ? '<div id="debug-timeline">' + items + '</div>'
      : '<div id="debug-timeline"><div class="tl-empty-note">Nenhuma entrada bate com o filtro.</div></div>';

    if (setup.lastSeq) maybeAutoScroll(setup.lastSeq);
  }

  function setItemOpen(item, open){
    item.classList.toggle('open', open);
    var head = item.querySelector('.tl-head');
    if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function wireTimelineEvents(){
    var wrap = el('debug-entries-content');
    if (!wrap || wrap.dataset.wired) return;
    wrap.dataset.wired = '1';
    // Só o cabeçalho da linha alterna: clicar/selecionar o JSON não recolhe.
    wrap.addEventListener('click', function(ev){
      var target = ev.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('.tl-head')) return;
      var item = target.closest('.tl-item');
      if (!item) return;
      var seq = Number(item.dataset.seq || 0);
      var open = item.classList.contains('open');
      ev.preventDefault();
      if (open) { collapsedSet.add(seq); expandedSet.delete(seq); setItemOpen(item, false); }
      else { expandedSet.add(seq); collapsedSet.delete(seq); setItemOpen(item, true); }
    });
  }

  function wireFilters(events){
    var search = el('debug-search');
    var kindsBox = el('debug-kinds');
    if (search && !search.dataset.wired) {
      search.dataset.wired = '1';
      var msTimer = null;
      search.addEventListener('input', function(){
        clearTimeout(msTimer);
        msTimer = setTimeout(function(){
          searchText = search.value || '';
          if (typeof events === 'object' && events.reload) events.reload();
        }, 220);
      });
    }
    if (kindsBox && !kindsBox.dataset.wired) {
      kindsBox.dataset.wired = '1';
      kindsBox.addEventListener('click', function(ev){
        var target = ev.target;
        if (!(target instanceof Element)) return;
        var chip = target.closest('.kind-chip');
        if (!chip) return;
        currentKind = chip.dataset.kind || '';
        if (typeof events === 'object' && events.reload) events.reload();
      });
    }
    var expandBtn = el('tl-expand-all');
    var collapseBtn = el('tl-collapse-all');
    if (expandBtn && !expandBtn.dataset.wired) {
      expandBtn.dataset.wired = '1';
      expandBtn.addEventListener('click', function(){
        document.querySelectorAll('.tl-item').forEach(function(item){ setItemOpen(item, true); });
      });
    }
    if (collapseBtn && !collapseBtn.dataset.wired) {
      collapseBtn.dataset.wired = '1';
      collapseBtn.addEventListener('click', function(){
        document.querySelectorAll('.tl-item').forEach(function(item){ setItemOpen(item, false); });
      });
    }
  }

  function resetEntryUIState(){
    expandedSet = new Set();
    collapsedSet = new Set();
    currentKind = '';
    searchText = '';
    var search = el('debug-search');
    if (search) search.value = '';
  }

  function setLoading(show){
    var loading = el('debug-loading');
    var empty = el('debug-empty-state');
    var content = el('debug-entries-content');
    if (loading) loading.classList.toggle('visible', show);
    if (empty) empty.style.display = show ? 'none' : '';
    if (content) content.style.display = show ? 'none' : '';
  }

  function selectSession(sessionId){
    currentSessionId = sessionId;
    renderSessions();
    resetEntryUIState();
    setLoading(true);
    loadEntries(sessionId);
  }

  function loadEntries(sessionId){
    fetch('/debug/api/' + encodeURIComponent(sessionId))
      .then(function(r){ return r.json(); })
      .then(function(entries){ renderEntries(entries); wireFilters({ reload: function(){ loadEntries(sessionId); } }); })
      .catch(function(err){ console.error(err); setLoading(false); showToast('Falha ao carregar as entradas'); });
  }

  function copySession(sessionId){
    if (!sessionId) return;
    var cmd = 'curl http://127.0.0.1:3334/debug/' + sessionId;
    navigator.clipboard.writeText(cmd)
      .then(function(){ showToast('Comando GET copiado'); })
      .catch(function(){ showToast('Falha ao copiar'); });
  }

  function clearDetail(){
    currentSessionId = null;
    resetEntryUIState();
    var title = el('debug-detail-title');
    var count = el('debug-detail-count');
    var actions = el('debug-detail-actions');
    var filters = el('debug-filters');
    var wrap = el('debug-entries-content');
    var empty = el('debug-empty-state');
    var loading = el('debug-loading');
    if (title) { title.textContent = 'Selecione uma sessão'; title.classList.remove('is-id'); }
    if (count) count.textContent = '';
    if (actions) actions.innerHTML = '';
    if (filters) filters.classList.remove('visible');
    if (wrap) { wrap.innerHTML = ''; wrap.style.display = 'none'; }
    if (loading) loading.classList.remove('visible');
    if (empty) {
      empty.style.display = '';
      setEmpty(empty, 'Nenhuma sessão aberta', 'Escolha uma sessão na lista para acompanhar as entradas em tempo real.');
    }
  }

  function deleteSession(sessionId){
    if (!sessionId) return;
    var list = el('debug-session-list');
    var btn = list ? list.querySelector('.delete-session[data-session="' + encodeURIComponent(sessionId) + '"]') : null;
    if (btn) { btn.disabled = true; btn.classList.add('busy'); }
    fetch('/debug/api/' + encodeURIComponent(sessionId), { method: 'DELETE' })
      .then(function(r){ return r.json(); })
      .then(function(){
        showToast('Sessão excluída');
        if (currentSessionId === sessionId) clearDetail();
        refresh();
      })
      .catch(function(){ showToast('Falha ao excluir'); if (btn) { btn.disabled = false; btn.classList.remove('busy'); } });
  }

  function loadSessions(){
    return fetch('/debug/api/sessions')
      .then(function(r){ return r.json(); })
      .then(function(data){ sessions = data || []; });
  }

  function refresh(){
    loadSessions()
      .then(function(){
        updateHeader();
        renderSessions();
        if (currentSessionId) loadEntries(currentSessionId);
      })
      .catch(function(err){ console.error(err); });
  }

  function hydrateIcons(){
    document.querySelectorAll('[data-icon]').forEach(function(el){
      if (el.dataset.hydrated) return;
      el.innerHTML = icon(el.dataset.icon);
      el.dataset.hydrated = '1';
    });
  }

  function start(){
    setTheme();
    hydrateIcons();
    attachSessionListEvents();
    attachDetailEvents();
    wireTimelineEvents();
    wireFilters({ reload: function(){ if (currentSessionId) loadEntries(currentSessionId); } });
    refresh();
    refreshTimer = setInterval(refresh, 2000);
  }

  // Troca de tema no app (mesma origem): o evento 'storage' chega aqui.
  window.addEventListener('storage', function(e){
    if (e.key === null || e.key === 'docmap-theme') setTheme();
  });

  document.addEventListener('DOMContentLoaded', start);
})();
`;

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>docmap · debug</title>
<script>
// Tema antes da primeira pintura (sem flash). Dark = sem atributo.
try{if(localStorage.getItem('docmap-theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}
</script>
<style>
${FONT_CSS}
${TOKENS_CSS}
${COMPONENTS_CSS}
${PAGE_CSS}
</style>
</head>
<body>
${PAGE_BODY}
<script>${PAGE_SCRIPT}<\/script>
</body>
</html>`;

export const serveDebugPage = (): Promise<Response> =>
  Promise.resolve(html(PAGE));
