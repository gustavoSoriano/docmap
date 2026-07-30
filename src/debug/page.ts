// ════ Página standalone do Debug Audit, servida em /debug ════

import { html } from '../server/response.ts';

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>docmap — debug</title>
<style>
:root{
  --bg:#0b0c0e;
  --surface:#101216;
  --surface-2:#16191f;
  --surface-3:#1e222a;
  --surface-4:#262b34;
  --border:#22262e;
  --border-soft:rgba(255,255,255,.05);
  --border-mid:rgba(255,255,255,.09);
  --border-hi:rgba(255,255,255,.16);
  --text:#edeef1;
  --text-2:#9ca3af;
  --text-3:#626976;
  --text-4:#454b56;
  --accent:#37d99a;
  --accent-2:#29c088;
  --accent-dim:rgba(55,217,154,.14);
  --accent-line:rgba(55,217,154,.35);
  --on-accent:#06120d;
  --cat-entry:#fbbf24;
  --cat-arch:#60a5fa;
  --cat-design:#f472b6;
  --cat-security:#fb7185;
  --cat-process:#94a3b8;
  --cat-default:#6b7280;
  --type-note:#94a3b8;
  --type-decision:#60a5fa;
  --type-question:#fbbf24;
  --type-todo:#37d99a;
  --type-warning:#fb7185;
  --type-reference:#a78bfa;
  --type-general:#94a3b8;
  --font-ui:'Geist','Onest',system-ui,sans-serif;
  --font-mono:'Geist Mono','JetBrains Mono',monospace;
  --font:var(--font-ui);
  --mono:var(--font-mono);
  --danger:var(--cat-security);
  --radius:7px;
  --rail-w:60px;
  --term-default-h:35vh;
  --r-xs:5px;
  --r-sm:7px;
  --r-md:10px;
  --r-lg:14px;
  --r-xl:20px;
  --sh-sm:0 1px 2px rgba(0,0,0,.4);
  --sh-md:0 8px 24px rgba(0,0,0,.45);
  --sh-lg:0 20px 60px rgba(0,0,0,.6);
  --glow:0 0 0 1px var(--accent-line),0 4px 20px rgba(55,217,154,.18);
}
:root[data-theme='light']{
  --bg:#f6f7f9;
  --surface:#ffffff;
  --surface-2:#eef0f4;
  --surface-3:#e3e6ec;
  --surface-4:#d6dae2;
  --border:#d4d8e0;
  --border-soft:rgba(0,0,0,.05);
  --border-mid:rgba(0,0,0,.10);
  --border-hi:rgba(0,0,0,.18);
  --text:#1a1d23;
  --text-2:#525a68;
  --text-3:#828b9a;
  --text-4:#aab2bf;
  --accent:#0e9f6e;
  --accent-2:#0b8a5e;
  --accent-dim:rgba(14,159,110,.12);
  --accent-line:rgba(14,159,110,.32);
  --on-accent:#ffffff;
  --sh-sm:0 1px 2px rgba(0,0,0,.08);
  --sh-md:0 8px 24px rgba(0,0,0,.10);
  --sh-lg:0 20px 60px rgba(0,0,0,.14);
  --glow:0 0 0 1px var(--accent-line),0 4px 20px rgba(14,159,110,.14);
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{
  background:var(--bg);
  color:var(--text);
  font-family:var(--font-ui);
  height:100vh;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  -webkit-font-smoothing:antialiased;
}
#debug-header{
  flex-shrink:0;
  padding:14px 18px;
  background:var(--surface);
  border-bottom:1px solid var(--border);
  display:flex;
  align-items:center;
  gap:18px;
}
#debug-title{
  display:flex;
  align-items:center;
  gap:10px;
  font-size:15px;
  font-weight:600;
}
#debug-title .ico{color:var(--accent)}
#debug-stats{
  display:flex;
  align-items:center;
  gap:14px;
  margin-left:auto;
}
.stat{
  display:flex;
  align-items:center;
  gap:6px;
  font-size:12px;
  color:var(--text-2);
  background:var(--surface-2);
  padding:5px 10px;
  border-radius:var(--radius);
  border:1px solid var(--border);
}
.stat strong{color:var(--text)}
#debug-update{
  font-size:11px;
  color:var(--text-3);
}
#debug-main{
  flex:1;
  min-height:0;
  display:flex;
  overflow:hidden;
}
#debug-sessions{
  width:300px;
  flex-shrink:0;
  background:var(--surface);
  border-right:1px solid var(--border);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
#debug-sessions-head{
  padding:12px 14px;
  border-bottom:1px solid var(--border);
  font-size:12px;
  font-weight:600;
  color:var(--text-2);
  text-transform:uppercase;
  letter-spacing:.03em;
}
#debug-session-list{
  flex:1;
  overflow-y:auto;
  padding:8px;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.session-card{
  background:var(--surface-2);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:10px 12px;
  cursor:pointer;
  transition:background .13s,border-color .13s;
}
.session-card:hover{
  background:var(--surface-3);
  border-color:var(--border-mid);
}
.session-card.active{
  border-color:var(--accent-line);
  background:var(--accent-dim);
}
.session-id{
  font-family:var(--mono);
  font-size:12px;
  color:var(--text);
  word-break:break-all;
  margin-bottom:6px;
}
.session-meta{
  display:flex;
  align-items:center;
  justify-content:space-between;
  font-size:11px;
  color:var(--text-3);
  margin-bottom:8px;
}
.session-actions{
  display:flex;
  gap:6px;
}
.session-btn{
  display:inline-flex;
  align-items:center;
  gap:4px;
  background:transparent;
  border:1px solid var(--border);
  color:var(--text-2);
  padding:4px 8px;
  border-radius:var(--radius);
  font-size:11px;
  cursor:pointer;
  transition:all .13s;
}
.session-btn:hover{
  background:var(--surface-3);
  color:var(--text);
  border-color:var(--border-mid);
}
.session-btn.danger:hover{
  background:rgba(244,67,54,.12);
  border-color:var(--danger);
  color:var(--danger);
}
.session-btn .ico{width:12px;height:12px}
#debug-empty-state{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  color:var(--text-3);
  gap:10px;
}
#debug-empty-state .ico{width:36px;height:36px;opacity:.25}
#debug-empty-state div{font-size:13px}
#debug-loading{
  flex:1;
  display:none;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:10px;
  color:var(--text-3);
  font-size:13px;
}
#debug-loading.visible{display:flex}
#debug-loading .spinner{
  width:22px;
  height:22px;
  border:2px solid var(--border);
  border-top-color:var(--accent);
  border-radius:50%;
  animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
#debug-detail{
  flex:1;
  min-width:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
#debug-detail-head{
  padding:12px 16px;
  border-bottom:1px solid var(--border);
  background:var(--surface);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
#debug-detail-title{
  font-size:13px;
  font-weight:600;
  color:var(--text);
  word-break:break-all;
}
#debug-detail-count{font-size:11px;color:var(--text-3)}
#debug-detail-actions{display:flex;gap:6px}
#debug-entries{
  flex:1;
  overflow-y:auto;
  padding:12px 16px;
}
#debug-entries table{
  width:100%;
  border-collapse:collapse;
  font-size:12px;
}
#debug-entries th,
#debug-entries td{
  padding:8px 10px;
  text-align:left;
  border-bottom:1px solid var(--border);
  vertical-align:top;
}
#debug-entries th{
  position:sticky;
  top:0;
  background:var(--bg);
  color:var(--text-2);
  font-weight:600;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.03em;
  z-index:1;
}
#debug-entries td.seq,
#debug-entries th.seq{
  width:60px;
  color:var(--accent);
  font-family:var(--mono);
}
#debug-entries td.ts,
#debug-entries th.ts{
  width:110px;
  font-family:var(--mono);
  color:var(--text-2);
}
#debug-entries td.payload{
  font-family:var(--mono);
}
#debug-entries pre{
  margin:0;
  white-space:pre-wrap;
  word-break:break-all;
  color:var(--text-2);
}
#debug-toast{
  position:fixed;
  bottom:18px;
  left:50%;
  transform:translate(-50%,10px);
  background:var(--surface-4);
  color:var(--text);
  border:1px solid var(--border-hi);
  padding:8px 16px;
  border-radius:var(--r-xl);
  font-size:12px;
  opacity:0;
  pointer-events:none;
  transition:all .25s;
  z-index:100;
}
#debug-toast.visible{opacity:1;transform:translate(-50%,0)}
</style>
</head>
<body>

<header id="debug-header">
  <div id="debug-title"><span data-icon="bug"></span> Debug Audit</div>
  <div id="debug-stats">
    <span class="stat">Sessions <strong id="stat-sessions">0</strong></span>
    <span class="stat">Entries <strong id="stat-entries">0</strong></span>
  </div>
  <span id="debug-update">Updated —</span>
</header>

<main id="debug-main">
  <aside id="debug-sessions">
    <div id="debug-sessions-head">Sessions</div>
    <div id="debug-session-list"></div>
  </aside>
  <section id="debug-detail">
    <div id="debug-detail-head">
      <div>
        <div id="debug-detail-title">Select a session</div>
        <div id="debug-detail-count"></div>
      </div>
      <div id="debug-detail-actions"></div>
    </div>
    <div id="debug-entries">
      <div id="debug-empty-state">
        <span data-icon="bug"></span>
        <div>No debug session selected</div>
      </div>
      <div id="debug-loading"><div class="spinner"></div><div>Loading entries...</div></div>
      <div id="debug-entries-content"></div>
    </div>
  </section>
</main>

<div id="debug-toast"></div>

<script>
(function(){
  var ICONS = {
    bug:'<path d="m8 6 4-4 4 4"/><path d="M12 2v10"/><path d="m8 18 4 4 4-4"/><path d="M12 12v10"/><path d="m19 8 2 1-2 1"/><path d="m5 8-2 1 2 1"/><path d="M20 10H4"/><path d="M20 14H4"/>',
    copy:'<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    trash:'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };
  var icon = function(name){ return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>'; };
  var el = function(id){ return document.getElementById(id); };
  var toastEl = el('debug-toast');
  var toastTimer = null;
  var currentSessionId = null;
  var sessions = [];
  var refreshTimer = null;

  function setTheme(){
    var root = document.documentElement;
    try {
      var parentTheme = window.parent && window.parent.document && window.parent.document.documentElement && window.parent.document.documentElement.dataset.theme;
      if (parentTheme) { root.dataset.theme = parentTheme; return; }
    } catch(e){ /* cross-origin parent */ }
    var stored = null;
    try { stored = localStorage.getItem('docmap-theme'); } catch(e){}
    if (stored) root.dataset.theme = stored;
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

  function updateHeader(){
    var total = sessions.reduce(function(s, x){ return s + x.count; }, 0);
    el('stat-sessions').textContent = sessions.length;
    el('stat-entries').textContent = total;
    el('debug-update').textContent = 'Updated ' + formatTime(new Date());
  }

  function renderSessions(){
    var list = el('debug-session-list');
    if (!sessions.length) {
      list.innerHTML = '<div id="debug-empty-state" style="flex:1;justify-content:flex-start;padding-top:40px"><span data-icon="bug"></span><div>No sessions yet</div></div>';
      hydrateIcons();
      return;
    }
    list.innerHTML = sessions.map(function(s){
      return '<div class="session-card' + (s.sessionId === currentSessionId ? ' active' : '') + '" data-session="' + encodeURIComponent(s.sessionId) + '">' +
        '<div class="session-id">' + escHtml(s.sessionId) + '</div>' +
        '<div class="session-meta"><span>' + s.count + ' entries</span><span>' + (s.lastTs || '—') + '</span></div>' +
        '<div class="session-actions">' +
          '<button class="session-btn copy-session" data-session="' + encodeURIComponent(s.sessionId) + '" title="Copy GET command">' + icon('copy') + ' GET</button>' +
          '<button class="session-btn danger delete-session" data-session="' + encodeURIComponent(s.sessionId) + '" title="Delete session">' + icon('trash') + '</button>' +
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

  function renderEntries(entries){
    var title = el('debug-detail-title');
    var count = el('debug-detail-count');
    var actions = el('debug-detail-actions');
    var wrap = el('debug-entries-content');
    var empty = el('debug-empty-state');
    var loading = el('debug-loading');

    title.textContent = currentSessionId || 'Select a session';
    count.textContent = entries.length ? entries.length + ' entries' : '';
    actions.innerHTML = currentSessionId ?
      '<button class="session-btn" id="detail-copy">' + icon('copy') + ' GET</button>' +
      '<button class="session-btn danger" id="detail-delete">' + icon('trash') + '</button>' : '';

    if (loading) loading.classList.remove('visible');

    if (!entries.length) {
      if (wrap) wrap.innerHTML = '';
      if (wrap) wrap.style.display = 'none';
      if (empty) { empty.style.display = ''; empty.querySelector('div').textContent = 'No entries in this session'; }
      return;
    }

    if (empty) empty.style.display = 'none';
    if (wrap) wrap.style.display = '';

    var rows = entries.map(function(e){
      return '<tr><td class="seq">' + e.seq + '</td><td class="ts">' + escHtml(e.ts) + '</td><td class="payload"><pre>' + escHtml(JSON.stringify(e.payload, null, 2)) + '</pre></td></tr>';
    }).join('');
    wrap.innerHTML = '<table><thead><tr><th class="seq">Seq</th><th class="ts">Time</th><th>Payload</th></tr></thead><tbody>' + rows + '</tbody></table>';
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
    setLoading(true);
    loadEntries(sessionId);
  }

  function loadEntries(sessionId){
    fetch('/debug/api/' + encodeURIComponent(sessionId))
      .then(function(r){ return r.json(); })
      .then(function(entries){ renderEntries(entries); })
      .catch(function(err){ console.error(err); setLoading(false); showToast('Failed to load entries'); });
  }

  function copySession(sessionId){
    if (!sessionId) return;
    var cmd = 'curl http://127.0.0.1:3334/debug/' + sessionId;
    navigator.clipboard.writeText(cmd)
      .then(function(){ showToast('GET command copied'); })
      .catch(function(){ showToast('Copy failed'); });
  }

  function clearDetail(){
    currentSessionId = null;
    var title = el('debug-detail-title');
    var count = el('debug-detail-count');
    var actions = el('debug-detail-actions');
    var wrap = el('debug-entries-content');
    var empty = el('debug-empty-state');
    var loading = el('debug-loading');
    if (title) title.textContent = 'Select a session';
    if (count) count.textContent = '';
    if (actions) actions.innerHTML = '';
    if (wrap) { wrap.innerHTML = ''; wrap.style.display = 'none'; }
    if (loading) loading.classList.remove('visible');
    if (empty) { empty.style.display = ''; empty.querySelector('div').textContent = 'No debug session selected'; }
  }

  function deleteSession(sessionId){
    if (!sessionId) return;
    var list = el('debug-session-list');
    var btn = list ? list.querySelector('.delete-session[data-session="' + encodeURIComponent(sessionId) + '"]') : null;
    if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    fetch('/debug/api/' + encodeURIComponent(sessionId), { method: 'DELETE' })
      .then(function(r){ return r.json(); })
      .then(function(){
        showToast('Session deleted');
        if (currentSessionId === sessionId) clearDetail();
        refresh();
      })
      .catch(function(){ showToast('Delete failed'); if (btn) { btn.disabled = false; btn.style.opacity = ''; } });
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
    attachSessionListEvents();
    attachDetailEvents();
    refresh();
    refreshTimer = setInterval(refresh, 2000);
    // re-check theme periodically in case parent toggles
    setInterval(setTheme, 2000);
  }

  document.addEventListener('DOMContentLoaded', start);
})();
<\/script>
</body>
</html>`;

export const serveDebugPage = (): Promise<Response> => Promise.resolve(html(PAGE));
