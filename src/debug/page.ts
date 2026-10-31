// ════ Página standalone do Debug Audit, servida em /debug ════
// Standalone (iframe): não herda o CSS do app. Fonte, tokens e componentes
// vêm de ui-shared.gen.ts (gerado por scripts/bundle-ui.ts).

import { html } from '../server/response.ts';
import {
  COMPONENTS_CSS,
  FONT_CSS,
  TOKENS_CSS,
} from '../server/handlers/ui-shared.gen.ts';
import { DEBUG_TTL_MS } from './store.ts';

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
#debug-copy-example{height:30px;padding:0 10px;color:var(--text-2)}
#debug-copy-example .ico{width:15px;height:15px}

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
#debug-filters.map-mode #debug-sheet-actions{display:none}
#debug-filters.map-mode .search,#debug-filters.map-mode #debug-kinds{display:none}
#debug-filters.map-mode #debug-view-switch{margin-left:auto}
#debug-view-switch{display:flex;align-items:center;gap:3px;padding:3px;border:1px solid var(--border-mid);border-radius:var(--r-md);background:var(--surface-2)}
.debug-view-btn{height:26px;padding:0 10px;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-3);font-size:var(--fs-xs);font-weight:650;cursor:pointer}
.debug-view-btn:hover{color:var(--text)}
.debug-view-btn.active{background:var(--surface-4);color:var(--text)}

/* ── Linha do tempo ── */
#debug-entries{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;padding:8px}
#debug-entries-content{display:flex;flex:1;min-height:0;flex-direction:column}
.debug-log-view{flex:1;min-height:0;overflow:auto}
.debug-map-view{display:none;flex:1;min-height:0;flex-direction:column}
.debug-map-view.visible{display:flex}
.map-toolbar{flex-shrink:0;min-height:48px;padding:5px 10px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border);color:var(--text-2);font-size:var(--fs-xs)}
.map-summary{display:flex;align-items:baseline;gap:7px;margin-right:auto;color:var(--text)}
.map-summary strong{font-size:var(--fs-lg);font-variant-numeric:tabular-nums}
.map-legend{display:flex;align-items:center;gap:12px;color:var(--text-3)}
.map-hint{max-width:210px;overflow:hidden;color:var(--text-3);text-overflow:ellipsis;white-space:nowrap}
.map-legend-item{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.map-legend-line{display:inline-block}
.map-legend-line{width:22px;height:0;border-top:2px solid var(--info)}
.map-legend-line.inferred{border-top:2px dashed var(--accent)}
.map-actions{display:flex;gap:4px}
.map-action{min-width:32px;height:30px;padding:0 9px;border:1px solid var(--border-mid);border-radius:var(--r-sm);background:var(--surface-2);color:var(--text-2);font:600 var(--fs-sm) var(--font-ui);cursor:pointer}
.map-action:hover{background:var(--surface-3);color:var(--text)}
.map-action:focus-visible,.debug-view-btn:focus-visible{outline:2px solid var(--info);outline-offset:2px}
.map-viewport{position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;background-color:var(--bg);background-image:radial-gradient(var(--border-mid) .8px,transparent .8px);background-size:24px 24px;cursor:grab}
.map-viewport.panning{cursor:grabbing}
.map-world{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
.map-edge-layer{position:absolute;inset:0;overflow:visible;pointer-events:none}
.map-edge{fill:none;stroke:var(--info);stroke-width:2.5;vector-effect:non-scaling-stroke}
.map-edge.chronological{stroke:var(--accent);stroke-dasharray:6 6}
.map-lane-title{position:absolute;left:34px;color:var(--text-2);font-size:var(--fs-sm);font-weight:650;white-space:nowrap}
.map-lane-title small{margin-left:9px;color:var(--text-3);font:12px var(--font-mono)}
.map-node{position:absolute;width:300px;height:154px;padding:13px 15px;display:flex;flex-direction:column;gap:9px;border:1px solid var(--border-hi);border-radius:12px;background:var(--surface);color:var(--text);text-align:left;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}
.map-node:hover,.map-node.dragging{border-color:var(--info-line);background:var(--surface-3)}
.map-node:active{cursor:grabbing}
.map-node:focus-visible{outline:2px solid var(--info);outline-offset:3px}
.map-node.sequential{border-color:var(--accent-line)}
.map-node-head{display:flex;align-items:center;gap:8px;min-width:0;color:var(--text-3);font:12px var(--font-mono);font-variant-numeric:tabular-nums}
.map-node-seq{color:var(--text-2);font-weight:700}
.map-node-expiry{color:var(--text-3);font-size:10px;white-space:nowrap}
.map-node-expiry.urgent{color:var(--warn)}
.map-node-kind{margin-left:auto;padding:2px 6px;border-radius:4px;background:var(--surface-4);color:var(--text-2);font:600 12px var(--font-ui)}
.map-node-kind.danger{background:var(--danger-dim);color:var(--danger)}
.map-node-kind.warn{background:var(--warn-dim);color:var(--warn)}
.map-node-title{overflow:hidden;font-size:14px;font-weight:650;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}
.map-transition{display:grid;grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr);align-items:center;gap:7px;margin-top:auto;padding-top:9px;border-top:1px solid var(--border)}
.map-endpoint{min-width:0}
.map-endpoint-label{display:block;margin-bottom:4px;color:var(--text-3);font-size:12px;font-weight:650}
.map-endpoint-name{display:-webkit-box;overflow:hidden;color:var(--text);font:600 12px/1.25 var(--font-mono);text-overflow:ellipsis;white-space:normal;overflow-wrap:anywhere;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.map-transition-arrow{color:var(--info);font-size:17px;text-align:center}
.map-node.sequential .map-node-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.map-node-message{overflow:hidden;color:var(--text-2);font-size:12px;line-height:1.35;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.map-empty{position:absolute;left:36px;top:30px;color:var(--text-3);font-size:var(--fs-sm)}
.tl-empty-note{padding:36px 12px;text-align:center;color:var(--text-3);font-size:var(--fs-md)}
#debug-timeline{position:relative;display:flex;flex-direction:column;gap:16px;padding:8px 0}
#debug-timeline::before{content:'';position:absolute;left:99px;top:18px;bottom:18px;width:1px;background:var(--border-mid)}
.tl-item{position:relative;display:grid;grid-template-columns:100px minmax(0,1fr);gap:18px}
.tl-rail{position:relative;display:flex;flex-direction:column;align-items:flex-end;gap:6px;padding:4px 14px 0 0;text-align:right}
.tl-rail-marker{position:absolute;z-index:1;top:8px;right:-5px;width:10px;height:10px;border:2px solid var(--bg);border-radius:50%;background:var(--text-4)}
.tl-item[data-kind="error"] .tl-rail-marker{background:var(--danger)}
.tl-item[data-kind="warning"] .tl-rail-marker{background:var(--warn)}
.tl-item[data-kind="ok"] .tl-rail-marker,.tl-item[data-kind="done"] .tl-rail-marker{background:var(--ok)}
.tl-item[data-kind="info"] .tl-rail-marker,.tl-item[data-kind="decision"] .tl-rail-marker,.tl-item[data-kind="todo"] .tl-rail-marker{background:var(--info)}
.tl-seq{font-family:var(--font-mono);font-size:25px;line-height:1;font-weight:650;letter-spacing:-.07em;color:var(--text-2);font-variant-numeric:tabular-nums}
.tl-ts{font-family:var(--font-mono);font-size:11px;color:var(--text-3);font-variant-numeric:tabular-nums}
.tl-expiry{font-family:var(--font-mono);font-size:10px;color:var(--text-3);font-variant-numeric:tabular-nums;white-space:nowrap}
.tl-expiry.urgent{color:var(--warn)}
.tl-event{min-width:0;overflow:hidden;border:1px solid var(--border-mid);border-radius:14px;background:var(--surface);transition:border-color var(--dur)}
.tl-item:hover .tl-event,.tl-item.open .tl-event{border-color:var(--border-hi)}
.tl-row{display:grid;grid-template-columns:minmax(0,1fr) 40px;align-items:center}
.tl-head{width:100%;min-height:58px;padding:12px 16px;display:grid;grid-template-columns:auto minmax(0,1fr) 18px;align-items:center;gap:14px;border:0;background:transparent;text-align:left;cursor:pointer}
.tl-copy{width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:var(--r-sm);background:transparent;color:var(--text-3);cursor:pointer;transition:background var(--dur),color var(--dur)}
.tl-copy:hover{background:var(--surface-3);color:var(--text)}
.tl-copy:focus-visible{outline:2px solid var(--info);outline-offset:1px}
.tl-copy .ico{width:15px;height:15px}
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
.tl-title{min-width:0;font-size:15px;font-weight:650;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tl-chev{display:grid;place-items:center;color:var(--text-3);transition:transform .18s var(--ease)}
.tl-chev .ico{width:15px;height:15px}
.tl-item.open .tl-chev{transform:rotate(180deg)}
.tl-body{display:none;padding:0 16px 16px}
.tl-item.open .tl-body{display:block}
.tl-body pre{margin:0;padding:16px;max-height:420px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font-family:var(--font-mono);font-size:var(--fs-sm);line-height:1.75;color:var(--text-2);background:var(--surface-2);border-top:1px solid var(--border);border-radius:var(--r-sm)}
.tl-head:focus-visible{outline:2px solid var(--info);outline-offset:-3px;border-radius:10px}
.json-key{color:var(--info)}
.json-string{color:var(--ok)}
.json-number{color:var(--warn)}
.json-literal{color:var(--accent)}
.json-punct{color:var(--text-3)}

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

/* ── Payload aberto pelo duplo clique no mapa ── */
#debug-payload-dialog{position:fixed;inset:0;margin:auto;width:min(820px,calc(100vw - 32px));max-height:min(82vh,760px);padding:0;overflow:hidden;border:1px solid var(--border-hi);border-radius:16px;background:var(--surface);color:var(--text);box-shadow:var(--sh-lg)}
#debug-payload-dialog::backdrop{background:rgba(3,7,13,.78);backdrop-filter:blur(5px)}
.payload-dialog-head{min-height:76px;padding:14px 18px;display:flex;align-items:center;gap:18px;border-bottom:1px solid var(--border)}
.payload-dialog-heading{min-width:0;flex:1}
.payload-dialog-meta{display:flex;align-items:center;gap:10px;margin-bottom:4px;color:var(--text-3);font:12px var(--font-mono);font-variant-numeric:tabular-nums}
#debug-payload-seq{color:var(--info);font-weight:700}
#debug-payload-title{overflow:hidden;font-size:var(--fs-md);font-weight:650;text-overflow:ellipsis;white-space:nowrap}
#debug-payload-close{width:32px;height:32px;border:1px solid var(--border-mid);border-radius:8px;background:var(--surface-2);color:var(--text-2);font-size:22px;line-height:1;cursor:pointer}
#debug-payload-close:hover{background:var(--surface-3);color:var(--text)}
#debug-payload-json{margin:0;max-height:calc(82vh - 76px);padding:20px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--surface-2);font:13px/1.75 var(--font-mono);color:var(--text-2)}

@media (max-width:1180px){
  #debug-sheet-actions{order:2}
  .kinds{order:3;flex-basis:100%;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}
  .kind-chip{flex-shrink:0}
  #debug-view-switch{order:4;margin-left:auto}
  .map-hint{display:none}
}
@media (max-width:760px){
  #debug-sessions{width:var(--sidebar-w-tablet)}
  #debug-timeline{gap:12px}
  .tl-item{grid-template-columns:82px minmax(0,1fr);gap:14px}
  #debug-timeline::before{left:81px}
  .tl-seq{font-size:22px}
  #debug-search{width:170px}
  .map-legend{display:none}
  .map-hint{display:none}
}
@media (max-width:560px){
  #debug-main{flex-direction:column}
  #debug-sessions{width:auto;height:34%;flex-shrink:0}
  .tl-item{grid-template-columns:72px minmax(0,1fr);gap:12px}
  #debug-timeline::before{left:71px}
  .tl-rail{padding-right:10px}
  .tl-seq{font-size:19px}
  .tl-expiry{font-size:9px}
  .tl-head{grid-template-columns:auto minmax(0,1fr) 16px;gap:9px;padding:10px}
  .tl-title{font-size:13px}
  .tl-body{padding:0 10px 10px}
  .tl-body pre{padding:12px;font-size:11px}
  #debug-header{padding:0 14px}
  #debug-update{display:none}
  .map-toolbar{gap:6px;padding:4px 6px}
  .map-summary{font-size:11px;gap:4px}
  .map-actions{gap:2px}
  .map-action{min-width:28px;padding:0 6px}
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
  <button class="session-btn" id="debug-copy-example" title="Copiar exemplo curl para enviar um log" aria-label="Copiar exemplo curl">
    <span data-icon="copy"></span><span class="lbl">curl</span>
  </button>
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
      <span class="chip" title="Cada log é removido uma hora após ser recebido">Retenção 1 h</span>
      <div id="debug-detail-actions"></div>
    </div>
    <div id="debug-filters">
      <label class="search">
        <span data-icon="search"></span>
        <input id="debug-search" class="field" type="text"
          placeholder="Filtrar por texto" aria-label="Filtrar entradas por texto" autocomplete="off" />
      </label>
      <div class="kinds" id="debug-kinds"></div>
      <div id="debug-view-switch" role="group" aria-label="Modo de visualização">
        <button type="button" class="debug-view-btn active" data-debug-view="logs">Logs</button>
        <button type="button" class="debug-view-btn" data-debug-view="map">Mapa</button>
      </div>
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
<dialog id="debug-payload-dialog" aria-labelledby="debug-payload-title">
  <div class="payload-dialog-head">
    <div class="payload-dialog-heading">
      <div class="payload-dialog-meta"><span id="debug-payload-seq"></span><time id="debug-payload-ts"></time></div>
      <h2 id="debug-payload-title"></h2>
    </div>
    <button type="button" id="debug-payload-close" aria-label="Fechar payload" title="Fechar">×</button>
  </div>
  <pre id="debug-payload-json"></pre>
</dialog>
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
  var visibleEntriesBySeq = new Map();
  var allEntriesBySeq = new Map();
  var activeView = 'logs';
  var mapStates = new Map();
  var activeMapState = null;
  var mapRenderedSession = null;
  var mapRenderSignature = '';
  var mapDrag = null;
  var pendingMapEntries = null;
  var lastMapDragAt = 0;
  var mapClickTimer = null;
  var TTL_MS = ${DEBUG_TTL_MS};

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

  var entriesContainer = function(){ return activeView === 'logs' ? el('debug-log-view') : el('debug-entries'); };

  // Acompanhar novas entradas só quando o usuário já está perto do topo.
  function nearTop(){
    var box = entriesContainer();
    return !!box && box.scrollTop <= 80;
  }

  function maybeAutoScroll(lastSeq){
    if (lastSeq <= lastScrolledSeq) return;
    var shouldFollow = lastScrolledSeq === 0 || nearTop();
    lastScrolledSeq = lastSeq;
    if (!shouldFollow || activeView !== 'logs') return;
    var box = entriesContainer();
    var first = box && box.querySelector('.tl-item:first-child');
    if (first) first.scrollIntoView({ block: 'start', behavior: 'smooth' });
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
        text += ' ' + JSON.stringify(e.link || {}).toLowerCase();
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

  function highlightJson(value){
    var source = JSON.stringify(value, null, 2);
    if (source === undefined) source = 'null';
    var output = '';
    var i = 0;
    while (i < source.length) {
      var ch = source.charAt(i);
      if (ch === '"') {
        var start = i++;
        while (i < source.length) {
          if (source.charCodeAt(i) === 92) { i += 2; continue; }
          if (source.charAt(i++) === '"') break;
        }
        var token = source.slice(start, i);
        var next = i;
        while (next < source.length && source.charAt(next).trim() === '') next++;
        var isKey = source.charAt(next) === ':';
        output += '<span class="' + (isKey ? 'json-key' : 'json-string') + '">' +
          escHtml(token) + '</span>';
        continue;
      }
      if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ',' || ch === ':') {
        output += '<span class="json-punct">' + ch + '</span>';
        i++;
        continue;
      }
      if (ch === '-' || (ch >= '0' && ch <= '9')) {
        var numberStart = i++;
        while (i < source.length && /[0-9.eE+-]/.test(source.charAt(i))) i++;
        output += '<span class="json-number">' + source.slice(numberStart, i) + '</span>';
        continue;
      }
      if (/[a-z]/i.test(ch)) {
        var literalStart = i++;
        while (i < source.length && /[a-z]/i.test(source.charAt(i))) i++;
        output += '<span class="json-literal">' + source.slice(literalStart, i) + '</span>';
        continue;
      }
      output += ch;
      i++;
    }
    return output;
  }

  function formatExpiry(createdAt){
    var remaining = Math.max(0, TTL_MS - (Date.now() - Number(createdAt || 0)));
    var seconds = Math.ceil(remaining / 1000);
    var minutes = Math.floor(seconds / 60);
    var remainder = String(seconds % 60).padStart(2, '0');
    return {
      label: 'expira em ' + minutes + ':' + remainder,
      urgent: remaining <= 5 * 60 * 1000,
      remainingMinutes: Math.ceil(remaining / 60000),
    };
  }

  function showPayload(entry){
    var dialog = el('debug-payload-dialog');
    if (!dialog || !entry) return;
    var title = titleOf(entry.payload, 'Log #' + entry.seq);
    el('debug-payload-seq').textContent = 'LOG #' + entry.seq;
    el('debug-payload-ts').textContent = entry.ts || '';
    el('debug-payload-title').textContent = title;
    el('debug-payload-json').innerHTML = highlightJson(entry.payload);
    if (!dialog.open) dialog.showModal();
    el('debug-payload-close').focus();
  }

  function wirePayloadDialog(){
    var dialog = el('debug-payload-dialog');
    var close = el('debug-payload-close');
    if (!dialog || dialog.dataset.wired) return;
    dialog.dataset.wired = '1';
    close.addEventListener('click', function(){ dialog.close(); });
    dialog.addEventListener('click', function(ev){
      if (ev.target === dialog) dialog.close();
    });
  }

  function mapStateFor(sessionId){
    if (!mapStates.has(sessionId)) {
      mapStates.set(sessionId, {
        scale: 1,
        x: 36,
        y: 30,
        positions: new Map(),
        fitted: false,
        userNavigated: false,
      });
    }
    return mapStates.get(sessionId);
  }

  function linkOf(entry){
    var link = entry && entry.link;
    if (!link || typeof link !== 'object' || !link.traceId) return null;
    if (!link.from || !link.to || !link.from.id || !link.to.id) return null;
    return {
      traceId: String(link.traceId),
      from: { id: String(link.from.id), label: String(link.from.label || link.from.id) },
      to: { id: String(link.to.id), label: String(link.to.label || link.to.id) },
    };
  }

  function mapSignature(entries){
    return JSON.stringify(entries.map(function(entry){
      return [entry.seq, linkOf(entry), titleOf(entry.payload, ''), kindOf(entry.payload)];
    }));
  }

  function mapNodeKey(entry, link){
    return link
      ? 'trace:' + encodeURIComponent(link.traceId) + ':' + entry.seq
      : 'sequence:' + entry.seq;
  }

  function mapPosition(index, top){
    return { x: 42 + index * 360, y: top };
  }

  function mapEdgeGeometry(from, to){
    var width = 300;
    var height = 154;
    var dx = (to.x + width / 2) - (from.x + width / 2);
    var dy = (to.y + height / 2) - (from.y + height / 2);
    if (Math.abs(dx) >= Math.abs(dy)) {
      var startX = from.x + (dx >= 0 ? width : 0);
      var endX = to.x + (dx >= 0 ? 0 : width);
      var startY = from.y + height / 2;
      var endY = to.y + height / 2;
      var middleX = (startX + endX) / 2;
      return {
        path: 'M ' + startX + ' ' + startY + ' C ' + middleX + ' ' + startY + ', ' + middleX + ' ' + endY + ', ' + endX + ' ' + endY,
        labelX: middleX,
        labelY: (startY + endY) / 2 - 8,
      };
    }
    var startY = from.y + (dy >= 0 ? height : 0);
    var endY = to.y + (dy >= 0 ? 0 : height);
    var startX = from.x + width / 2;
    var endX = to.x + width / 2;
    var middleY = (startY + endY) / 2;
    return {
      path: 'M ' + startX + ' ' + startY + ' C ' + startX + ' ' + middleY + ', ' + endX + ' ' + middleY + ', ' + endX + ' ' + endY,
      labelX: (startX + endX) / 2,
      labelY: middleY - 8,
    };
  }

  function mapTraceTitle(group){
    var source = group.entries[0];
    var title = titleOf(source && source.payload, 'Trilha de execução');
    var match = title.match(/(?:^|\.)(create|update|delete|list|read)(?:\.|$)/i);
    if (match) {
      var names = { create: 'Criar nota', update: 'Editar nota', delete: 'Excluir nota', list: 'Listar notas', read: 'Abrir nota' };
      return names[match[1].toLowerCase()] || title;
    }
    return title.replace(/^notes\.(ui\.)?/, '').replace(/\.(requested|start|saved|rendered|response|complete)$/i, '');
  }

  function mapEventTitle(entry){
    var source = titleOf(entry.payload, 'Log #' + entry.seq);
    var match = source.match(/^notes\.(?:ui\.)?(create|update|delete|list|read)\.(requested|start|saved|deleted|rendered|response|error|missing|found|complete|validation|invalid)$/i);
    if (!match) return source;
    var operation = match[1].toLowerCase();
    var phase = match[2].toLowerCase();
    var labels = {
      'create.requested': 'Pedido para criar nota',
      'create.start': 'Criação iniciada',
      'create.saved': 'Nota persistida',
      'create.rendered': 'Nota exibida no editor',
      'create.response': 'Resposta recebida pelo editor',
      'create.error': 'Falha ao criar nota',
      'create.validation': 'Criação bloqueada: conteúdo obrigatório',
      'create.invalid': 'Criação rejeitada: campo obrigatório',
      'update.requested': 'Pedido para salvar alterações',
      'update.start': 'Salvando alterações',
      'update.saved': 'Alterações persistidas',
      'update.rendered': 'Nota atualizada no editor',
      'update.response': 'Resposta recebida pelo editor',
      'update.error': 'Falha ao salvar alterações',
      'delete.requested': 'Pedido para excluir nota',
      'delete.start': 'Exclusão iniciada',
      'delete.deleted': 'Nota removida',
      'delete.response': 'Exclusão confirmada',
      'delete.error': 'Falha ao excluir nota',
      'delete.missing': 'Nota não encontrada',
      'list.requested': 'Pedido para listar notas',
      'list.start': 'Leitura da lista iniciada',
      'list.complete': 'Lista de notas lida',
      'list.rendered': 'Lista exibida',
      'list.error': 'Falha ao listar notas',
      'read.requested': 'Pedido para abrir nota',
      'read.start': 'Leitura da nota iniciada',
      'read.found': 'Nota encontrada',
      'read.missing': 'Nota não encontrada',
      'read.rendered': 'Nota aberta no editor',
      'read.error': 'Falha ao abrir nota',
    };
    return labels[operation + '.' + phase] || source;
  }

  function mapNodeMarkup(entry, key, position, linked){
    var payload = entry.payload && typeof entry.payload === 'object' ? entry.payload : {};
    var title = mapEventTitle(entry);
    var kind = kindOf(entry.payload);
    var expiry = formatExpiry(entry.createdAt);
    var head = '<span class="map-node-head"><span class="map-node-seq">#' + entry.seq + '</span>' +
      '<time>' + escHtml(entry.ts) + '</time><span class="map-node-expiry' + (expiry.urgent ? ' urgent' : '') + '" title="' + escHtml(expiry.label) + '">TTL ' + expiry.remainingMinutes + 'm</span>' +
      '<span class="map-node-kind ' + kindClassOf(kind) + '">' + escHtml(kind) + '</span></span>';
    var body = '<span class="map-node-title" title="' + escHtml(title) + '">' + escHtml(title) + '</span>';
    if (linked) {
      var link = linkOf(entry);
      body += '<span class="map-transition">' +
        '<span class="map-endpoint"><span class="map-endpoint-label">Veio de</span><span class="map-endpoint-name" title="' + escHtml(link.from.label) + '">' + escHtml(link.from.label) + '</span></span>' +
        '<span class="map-transition-arrow" aria-hidden="true">→</span>' +
        '<span class="map-endpoint"><span class="map-endpoint-label">Foi para</span><span class="map-endpoint-name" title="' + escHtml(link.to.label) + '">' + escHtml(link.to.label) + '</span></span>' +
      '</span>';
    } else {
      var message = typeof payload.message === 'string' ? payload.message :
        (typeof payload.error === 'string' ? payload.error : '');
      if (message.length > 140) message = message.slice(0, 137) + '…';
      if (message) body += '<span class="map-node-message">' + escHtml(message) + '</span>';
    }
    return '<button type="button" class="map-node' + (linked ? '' : ' sequential') + '" data-map-node="' + escHtml(key) + '" data-seq="' + entry.seq + '" style="left:' + position.x + 'px;top:' + position.y + 'px" title="Arraste para reorganizar · clique abre o log · duplo clique mostra o payload #' + entry.seq + '">' + head + body + '</button>';
  }

  function renderMap(entries){
    var ordered = entries.slice().sort(function(a, b){ return a.seq - b.seq; });
    var groupsByTrace = new Map();
    var unlinked = [];
    ordered.forEach(function(entry){
      var link = linkOf(entry);
      if (!link) { unlinked.push(entry); return; }
      if (!groupsByTrace.has(link.traceId)) groupsByTrace.set(link.traceId, { traceId: link.traceId, entries: [] });
      groupsByTrace.get(link.traceId).entries.push(entry);
    });

    var groups = Array.from(groupsByTrace.values());
    var laneTop = 26;
    var worldWidth = 900;
    var nodeMarkup = '';
    var edgeMarkup = '';
    var laneMarkup = '';

    groups.forEach(function(group, groupIndex){
      var nodeTop = laneTop + 46;
      var laneHeight = 220;
      laneMarkup += '<div class="map-lane-title" style="top:' + laneTop + 'px" title="' + escHtml(group.traceId) + '">' +
        escHtml(mapTraceTitle(group)) + '<small>' + group.entries.length + ' etapas · ' + escHtml(group.traceId.slice(0, 8)) + '</small></div>';

      group.entries.forEach(function(entry, index){
        var link = linkOf(entry);
        var key = mapNodeKey(entry, link);
        var position = activeMapState.positions.get(key);
        if (!position) {
          position = mapPosition(index, nodeTop);
          activeMapState.positions.set(key, position);
        }
        nodeMarkup += mapNodeMarkup(entry, key, position, true);
        if (index > 0) {
          var previous = group.entries[index - 1];
          var previousKey = mapNodeKey(previous, linkOf(previous));
          var previousPosition = activeMapState.positions.get(previousKey);
          var geometry = mapEdgeGeometry(previousPosition, position);
          edgeMarkup += '<g class="map-edge-group" data-map-from="' + escHtml(previousKey) + '" data-map-to="' + escHtml(key) + '">' +
            '<path class="map-edge" d="' + geometry.path + '" marker-end="url(#map-arrow-linked)"/>' +
          '</g>';
        }
      });
      laneTop += laneHeight;
      worldWidth = Math.max(worldWidth, 42 + group.entries.length * 360);
    });

    if (unlinked.length) {
      laneMarkup += '<div class="map-lane-title" style="top:' + laneTop + 'px">Sequência cronológica<small>' + unlinked.length + ' logs sem vínculo explícito</small></div>';
      var nodeTop = laneTop + 46;
      unlinked.forEach(function(entry, index){
        var key = mapNodeKey(entry, null);
        var position = activeMapState.positions.get(key);
        if (!position) {
          position = mapPosition(index, nodeTop);
          activeMapState.positions.set(key, position);
        }
        nodeMarkup += mapNodeMarkup(entry, key, position, false);
        if (index > 0) {
          var previous = unlinked[index - 1];
          var previousKey = mapNodeKey(previous, null);
          var previousPosition = activeMapState.positions.get(previousKey);
          var geometry = mapEdgeGeometry(previousPosition, position);
          edgeMarkup += '<g class="map-edge-group" data-map-from="' + escHtml(previousKey) + '" data-map-to="' + escHtml(key) + '">' +
            '<path class="map-edge chronological" d="' + geometry.path + '" marker-end="url(#map-arrow-time)"/>' +
          '</g>';
        }
      });
      laneTop += 220;
      worldWidth = Math.max(worldWidth, 42 + unlinked.length * 360);
    }

    if (!groups.length && !unlinked.length) {
      laneMarkup = '<div class="map-empty">Esta sessão ainda não tem etapas para conectar.</div>';
    }

    var worldHeight = Math.max(210, laneTop + 24);
    var totalLogs = groups.reduce(function(total, group){ return total + group.entries.length; }, unlinked.length);
    var linkedLogs = groups.reduce(function(total, group){ return total + group.entries.length; }, 0);
    var summary = '<strong>' + totalLogs + '</strong> logs · <strong>' + groups.length + '</strong> trilhas · <strong>' + unlinked.length + '</strong> sem vínculo';
    return '<div id="debug-map-view" class="debug-map-view' + (activeView === 'map' ? ' visible' : '') + '">' +
      '<div class="map-toolbar"><span class="map-summary">' + summary + '</span>' +
        '<span class="map-legend"><span class="map-legend-item"><i class="map-legend-line"></i>trilha explícita</span><span class="map-legend-item"><i class="map-legend-line inferred"></i>ordem cronológica (sem vínculo)</span></span>' +
        '<span class="map-hint" title="Arraste cartões para reposicionar; arraste o fundo para navegar; duplo clique abre o payload">Arraste · duplo clique: payload</span>' +
        '<div class="map-actions"><button type="button" class="map-action" data-map-action="out" aria-label="Diminuir zoom" title="Diminuir zoom">−</button><button type="button" class="map-action" data-map-action="in" aria-label="Aumentar zoom" title="Aumentar zoom">+</button><button type="button" class="map-action" data-map-action="fit" title="Voltar ao início em escala legível">Visão inicial</button></div>' +
      '</div>' +
      '<div id="debug-map-viewport" class="map-viewport" tabindex="0" aria-label="Mapa navegável do caminho dos logs">' +
        '<div id="debug-map-world" class="map-world" data-width="' + worldWidth + '" data-height="' + worldHeight + '" style="width:' + worldWidth + 'px;height:' + worldHeight + 'px">' +
          '<svg class="map-edge-layer" width="' + worldWidth + '" height="' + worldHeight + '" viewBox="0 0 ' + worldWidth + ' ' + worldHeight + '">' +
            '<defs><marker id="map-arrow-linked" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--info)"/></marker><marker id="map-arrow-time" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>' + edgeMarkup +
          '</svg>' + laneMarkup + nodeMarkup +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function applyMapTransform(){
    var world = el('debug-map-world');
    if (!world || !activeMapState) return;
    world.style.transform = 'translate(' + activeMapState.x + 'px,' + activeMapState.y + 'px) scale(' + activeMapState.scale + ')';
  }

  function updateMapEdges(){
    var world = el('debug-map-world');
    if (!world || !activeMapState) return;
    var maxX = Number(world.dataset.width || 900);
    var maxY = Number(world.dataset.height || 210);
    world.querySelectorAll('.map-node').forEach(function(node){
      var position = activeMapState.positions.get(node.dataset.mapNode);
      if (!position) return;
      maxX = Math.max(maxX, position.x + 330);
      maxY = Math.max(maxY, position.y + 180);
    });
    world.style.width = maxX + 'px';
    world.style.height = maxY + 'px';
    var svg = world.querySelector('.map-edge-layer');
    if (svg) {
      svg.setAttribute('width', String(maxX));
      svg.setAttribute('height', String(maxY));
      svg.setAttribute('viewBox', '0 0 ' + maxX + ' ' + maxY);
    }
    world.querySelectorAll('.map-edge-group').forEach(function(group){
      var from = activeMapState.positions.get(group.dataset.mapFrom);
      var to = activeMapState.positions.get(group.dataset.mapTo);
      if (!from || !to) return;
      var geometry = mapEdgeGeometry(from, to);
      var path = group.querySelector('.map-edge');
      var label = group.querySelector('.map-edge-label');
      if (path) path.setAttribute('d', geometry.path);
      if (label) {
        label.setAttribute('x', String(geometry.labelX));
        label.setAttribute('y', String(geometry.labelY));
      }
    });
  }

  function updateMapExpiries(entries){
    var bySeq = new Map(entries.map(function(entry){ return [String(entry.seq), entry]; }));
    document.querySelectorAll('.map-node[data-seq] .map-node-expiry').forEach(function(badge){
      var node = badge.closest('.map-node');
      var entry = node && bySeq.get(node.dataset.seq);
      if (!entry) return;
      var expiry = formatExpiry(entry.createdAt);
      badge.textContent = 'TTL ' + expiry.remainingMinutes + 'm';
      badge.title = expiry.label;
      badge.classList.toggle('urgent', expiry.urgent);
    });
  }

  function fitMap(){
    var viewport = el('debug-map-viewport');
    var world = el('debug-map-world');
    if (!viewport || !world || !activeMapState) return;
    var maxY = 0;
    world.querySelectorAll('.map-node').forEach(function(node){
      var position = activeMapState.positions.get(node.dataset.mapNode);
      if (!position) return;
      maxY = Math.max(maxY, position.y + 154);
    });
    if (!maxY) maxY = Number(world.dataset.height || 210);
    // Preserva a leitura dos cartões. Ajustamos a altura das trilhas; a extensão
    // horizontal continua navegável por arraste para não reduzir dezenas de logs
    // a miniaturas ilegíveis.
    var scale = Math.min((viewport.clientHeight - 48) / maxY, 1);
    activeMapState.scale = Math.max(.62, scale);
    activeMapState.x = 24;
    activeMapState.y = Math.max(20, (viewport.clientHeight - maxY * activeMapState.scale) / 2);
    activeMapState.fitted = true;
    applyMapTransform();
  }

  function setDebugView(view){
    activeView = view === 'map' ? 'map' : 'logs';
    var logView = el('debug-log-view');
    var mapView = el('debug-map-view');
    var filters = el('debug-filters');
    if (logView) logView.style.display = activeView === 'logs' ? '' : 'none';
    if (mapView) mapView.classList.toggle('visible', activeView === 'map');
    if (filters) filters.classList.toggle('map-mode', activeView === 'map');
    document.querySelectorAll('.debug-view-btn').forEach(function(button){
      button.classList.toggle('active', button.dataset.debugView === activeView);
    });
    if (activeView === 'map') {
      applyMapTransform();
      if (activeMapState && !activeMapState.fitted) requestAnimationFrame(fitMap);
    }
  }

  function toggleHtml(e, open, title, kind){
    var json = highlightJson(e.payload);
    var expiry = formatExpiry(e.createdAt);
    return '<article class="tl-item' + (open ? ' open' : '') + (isErrKind(kind) ? ' ' + kind : '') +
      '" data-seq="' + e.seq + '" data-kind="' + escHtml(kind) + '">' +
      '<div class="tl-rail"><span class="tl-rail-marker"></span>' +
        '<span class="tl-seq">' + String(e.seq).padStart(2, '0') + '</span>' +
        '<span class="tl-ts">' + escHtml(e.ts) + '</span>' +
        '<span class="tl-expiry' + (expiry.urgent ? ' urgent' : '') + '" title="Retenção de uma hora">' + expiry.label + '</span>' +
      '</div><div class="tl-event"><div class="tl-row"><button type="button" class="tl-head" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        '<span class="tl-kind ' + kindClassOf(kind) + '"><span>' + escHtml(kind) + '</span></span>' +
        '<span class="tl-title" title="' + escHtml(title) + '">' + escHtml(title) + '</span>' +
        '<span class="tl-chev">' + icon('chevron-down') + '</span></button>' +
        '<button type="button" class="tl-copy" data-seq="' + e.seq + '" title="Copiar este log" aria-label="Copiar log #' + e.seq + '">' + icon('copy') + '</button></div>' +
      '<div class="tl-body"><pre>' + json + '</pre></div></div>' +
    '</article>';
  }

  function renderSetupFor(entries){
    var errCount = entries.filter(function(e){ return isErrKind(kindOf(e.payload)); }).length;
    var newestSeq = entries.reduce(function(max, e){ return Math.max(max, e.seq); }, 0);
    return { errCount: errCount, lastSeq: newestSeq };
  }

  function renderEntries(entries){
    var title = el('debug-detail-title');
    var count = el('debug-detail-count');
    var actions = el('debug-detail-actions');
    var filters = el('debug-filters');
    var wrap = el('debug-entries-content');
    var empty = el('debug-empty-state');
    var loading = el('debug-loading');
    visibleEntriesBySeq = new Map();
    allEntriesBySeq = new Map();

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
      mapRenderedSession = null;
      mapRenderSignature = '';
      mapDrag = null;
      pendingMapEntries = null;
      if (wrap) wrap.style.display = 'none';
      if (empty) {
        empty.style.display = '';
        setEmpty(empty, 'Nenhuma entrada nesta sessão', 'A sessão existe, mas ainda não recebeu logs. Novas entradas aparecem aqui sozinhas.');
      }
      return;
    }

    if (empty) empty.style.display = 'none';
    if (wrap) wrap.style.display = '';

    var allEntries = entries.slice().sort(function(a, b){ return a.seq - b.seq; });
    allEntriesBySeq = new Map(allEntries.map(function(entry){ return [entry.seq, entry]; }));
    var visible = filteredEntries(entries).sort(function(a, b){ return b.seq - a.seq; });
    visibleEntriesBySeq = new Map(visible.map(function(entry){ return [entry.seq, entry]; }));
    renderKindChips(entries);
    var setup = renderSetupFor(visible.length ? visible : entries);

    var items = visible.map(function(e){
      var kind = kindOf(e.payload);
      var title = titleOf(e.payload, '#' + e.seq);
      var open;
      if (collapsedSet.has(e.seq)) open = false;
      else if (expandedSet.has(e.seq)) open = true;
      else open = true;
      return toggleHtml(e, open, title, kind);
    }).join('');

    if (!wrap.querySelector('#debug-log-view')) {
      wrap.innerHTML = '<div id="debug-log-view" class="debug-log-view"></div>';
      mapRenderedSession = null;
      mapRenderSignature = '';
    }
    var logMarkup = visible.length
      ? '<div id="debug-timeline">' + items + '</div>'
      : '<div id="debug-timeline"><div class="tl-empty-note">Nenhuma entrada bate com o filtro.</div></div>';
    wrap.querySelector('#debug-log-view').innerHTML = logMarkup;

    var signature = mapSignature(allEntries);
    if (mapRenderedSession !== currentSessionId || signature !== mapRenderSignature) {
      if (mapDrag && mapRenderedSession === currentSessionId) {
        pendingMapEntries = allEntries;
      } else {
        mapDrag = null;
        pendingMapEntries = null;
        var oldMap = wrap.querySelector('#debug-map-view');
        if (oldMap) oldMap.outerHTML = renderMap(allEntries);
        else wrap.insertAdjacentHTML('beforeend', renderMap(allEntries));
        mapRenderedSession = currentSessionId;
        mapRenderSignature = signature;
        applyMapTransform();
        if (activeView === 'map' && activeMapState && !activeMapState.userNavigated) requestAnimationFrame(fitMap);
      }
    }
    setDebugView(activeView);
    updateMapExpiries(allEntries);

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
    // Copiar e expandir/recolher são ações independentes.
    wrap.addEventListener('click', function(ev){
      var target = ev.target;
      if (!(target instanceof Element)) return;
      var copyBtn = target.closest('.tl-copy');
      if (copyBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        var copySeq = Number(copyBtn.dataset.seq || 0);
        var entry = visibleEntriesBySeq.get(copySeq);
        if (!entry) return;
        var log = {
          seq: entry.seq,
          ts: entry.ts,
          sessionId: entry.sessionId,
          payload: entry.payload,
          ...(entry.link ? { link: entry.link } : {}),
        };
        navigator.clipboard.writeText(JSON.stringify(log, null, 2))
          .then(function(){ showToast('Log #' + copySeq + ' copiado'); })
          .catch(function(){ showToast('Falha ao copiar o log'); });
        return;
      }
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

  function wireMapEvents(){
    var wrap = el('debug-entries-content');
    var viewSwitch = el('debug-view-switch');
    if (viewSwitch && !viewSwitch.dataset.wired) {
      viewSwitch.dataset.wired = '1';
      viewSwitch.addEventListener('click', function(ev){
        var target = ev.target;
        if (!(target instanceof Element)) return;
        var button = target.closest('.debug-view-btn');
        if (button) setDebugView(button.dataset.debugView || 'logs');
      });
    }
    if (!wrap || wrap.dataset.mapWired) return;
    wrap.dataset.mapWired = '1';

    wrap.addEventListener('click', function(ev){
      var target = ev.target;
      if (!(target instanceof Element)) return;
      var actionButton = target.closest('[data-map-action]');
      if (actionButton && activeMapState) {
        var action = actionButton.dataset.mapAction;
        if (action === 'fit') {
          activeMapState.userNavigated = false;
          fitMap();
        } else {
          activeMapState.userNavigated = true;
          activeMapState.scale = action === 'in'
            ? Math.min(2.5, activeMapState.scale * 1.2)
            : Math.max(.12, activeMapState.scale / 1.2);
          applyMapTransform();
        }
        return;
      }
      var node = target.closest('.map-node[data-seq]');
      if (!node || Date.now() - lastMapDragAt < 300) return;
      var seq = Number(node.dataset.seq || 0);
      clearTimeout(mapClickTimer);
      mapClickTimer = setTimeout(function(){
        mapClickTimer = null;
        setDebugView('logs');
        var log = el('debug-log-view') && el('debug-log-view').querySelector('.tl-item[data-seq="' + seq + '"]');
        if (log) {
          collapsedSet.delete(seq);
          expandedSet.add(seq);
          setItemOpen(log, true);
          log.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      }, 500);
    });

    wrap.addEventListener('dblclick', function(ev){
      var target = ev.target;
      if (!(target instanceof Element)) return;
      var node = target.closest('.map-node[data-seq]');
      if (!node || Date.now() - lastMapDragAt < 300) return;
      ev.preventDefault();
      clearTimeout(mapClickTimer);
      mapClickTimer = null;
      var entry = allEntriesBySeq.get(Number(node.dataset.seq || 0));
      if (entry) showPayload(entry);
    });

    wrap.addEventListener('keydown', function(ev){
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var target = ev.target;
      if (!(target instanceof Element)) return;
      var node = target.closest('.map-node[data-seq]');
      if (!node) return;
      ev.preventDefault();
      node.click();
    });

    wrap.addEventListener('pointerdown', function(ev){
      var target = ev.target;
      if (!(target instanceof Element) || !activeMapState || activeView !== 'map') return;
      if (ev.button !== undefined && ev.button !== 0) return;
      if (target.closest('[data-map-action]')) return;
      var viewport = target.closest('.map-viewport');
      if (!viewport) return;
      activeMapState.userNavigated = true;
      var node = target.closest('.map-node');
      var captureTarget = viewport;
      if (node) {
        captureTarget = node;
        var key = node.dataset.mapNode;
        var position = activeMapState.positions.get(key);
        if (!position) return;
        mapDrag = {
          kind: 'node',
          key: key,
          node: node,
          viewport: viewport,
          pointerId: ev.pointerId,
          startX: ev.clientX,
          startY: ev.clientY,
          originX: position.x,
          originY: position.y,
          moved: false,
        };
        node.classList.add('dragging');
      } else {
        mapDrag = {
          kind: 'pan',
          viewport: viewport,
          pointerId: ev.pointerId,
          startX: ev.clientX,
          startY: ev.clientY,
          originX: activeMapState.x,
          originY: activeMapState.y,
          moved: false,
        };
        viewport.classList.add('panning');
      }
      if (Number.isFinite(ev.pointerId) && captureTarget.setPointerCapture) {
        try { captureTarget.setPointerCapture(ev.pointerId); } catch(e){}
      }
      ev.preventDefault();
    }, true);

    document.addEventListener('pointermove', function(ev){
      if (!mapDrag || !activeMapState) return;
      if (Number.isFinite(mapDrag.pointerId) && Number.isFinite(ev.pointerId) && ev.pointerId !== mapDrag.pointerId) return;
      var dx = ev.clientX - mapDrag.startX;
      var dy = ev.clientY - mapDrag.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) mapDrag.moved = true;
      if (mapDrag.kind === 'node') {
        var x = Math.max(20, mapDrag.originX + dx / activeMapState.scale);
        var y = Math.max(20, mapDrag.originY + dy / activeMapState.scale);
        activeMapState.positions.set(mapDrag.key, { x: x, y: y });
        mapDrag.node.style.left = x + 'px';
        mapDrag.node.style.top = y + 'px';
        updateMapEdges();
      } else {
        activeMapState.x = mapDrag.originX + dx;
        activeMapState.y = mapDrag.originY + dy;
        applyMapTransform();
      }
    }, true);

    var endDrag = function(ev){
      if (!mapDrag) return;
      if (ev && Number.isFinite(mapDrag.pointerId) && Number.isFinite(ev.pointerId) && ev.pointerId !== mapDrag.pointerId) return;
      if (mapDrag.kind === 'node' && mapDrag.moved) lastMapDragAt = Date.now();
      if (mapDrag.node) mapDrag.node.classList.remove('dragging');
      if (mapDrag.viewport) mapDrag.viewport.classList.remove('panning');
      mapDrag = null;
      if (pendingMapEntries && activeMapState) {
        var entries = pendingMapEntries;
        pendingMapEntries = null;
        var oldMap = el('debug-map-view');
        if (oldMap) oldMap.outerHTML = renderMap(entries);
        mapRenderedSession = currentSessionId;
        mapRenderSignature = mapSignature(entries);
        applyMapTransform();
        if (activeView === 'map' && !activeMapState.userNavigated) fitMap();
      }
    };
    document.addEventListener('pointerup', endDrag, true);
    document.addEventListener('pointercancel', endDrag, true);

    wrap.addEventListener('wheel', function(ev){
      var target = ev.target;
      if (!(target instanceof Element) || !target.closest('.map-viewport') || !activeMapState || activeView !== 'map') return;
      ev.preventDefault();
      var viewport = el('debug-map-viewport');
      if (!viewport) return;
      var rect = viewport.getBoundingClientRect();
      var anchorX = (ev.clientX - rect.left - activeMapState.x) / activeMapState.scale;
      var anchorY = (ev.clientY - rect.top - activeMapState.y) / activeMapState.scale;
      var scale = Math.max(.12, Math.min(2.5, activeMapState.scale * (ev.deltaY < 0 ? 1.08 : .92)));
      activeMapState.userNavigated = true;
      activeMapState.scale = scale;
      activeMapState.x = ev.clientX - rect.left - anchorX * scale;
      activeMapState.y = ev.clientY - rect.top - anchorY * scale;
      applyMapTransform();
    }, { passive: false });
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
        document.querySelectorAll('.tl-item').forEach(function(item){
          var seq = Number(item.dataset.seq || 0);
          expandedSet.add(seq);
          collapsedSet.delete(seq);
          setItemOpen(item, true);
        });
      });
    }
    if (collapseBtn && !collapseBtn.dataset.wired) {
      collapseBtn.dataset.wired = '1';
      collapseBtn.addEventListener('click', function(){
        document.querySelectorAll('.tl-item').forEach(function(item){
          var seq = Number(item.dataset.seq || 0);
          collapsedSet.add(seq);
          expandedSet.delete(seq);
          setItemOpen(item, false);
        });
      });
    }
  }

  function resetEntryUIState(){
    expandedSet = new Set();
    collapsedSet = new Set();
    lastScrolledSeq = 0;
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
    activeView = 'logs';
    activeMapState = mapStateFor(sessionId);
    mapRenderedSession = null;
    mapRenderSignature = '';
    mapDrag = null;
    pendingMapEntries = null;
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

  function copyCurlExample(){
    var body = JSON.stringify({
      sessionId: 'exemplo',
      payload: { type: 'info', title: 'Resposta da tela', message: 'A tela recebeu o retorno.' },
      link: {
        traceId: 'exemplo-123',
        from: { id: 'notes.http.POST /notes', label: 'POST /notes' },
        to: { id: 'notes.ui.editor', label: 'Editor da nota' },
      },
    });
    var cmd = 'curl -X POST http://127.0.0.1:3334/debug -H "Content-Type: application/json" --data-raw ' + "'" + body + "'";
    navigator.clipboard.writeText(cmd)
      .then(function(){ showToast('Exemplo curl copiado'); })
      .catch(function(){ showToast('Falha ao copiar'); });
  }

  function clearDetail(){
    currentSessionId = null;
    activeView = 'logs';
    activeMapState = null;
    mapRenderedSession = null;
    mapRenderSignature = '';
    mapDrag = null;
    pendingMapEntries = null;
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
    el('debug-copy-example').addEventListener('click', copyCurlExample);
    wirePayloadDialog();
    wireTimelineEvents();
    wireMapEvents();
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
