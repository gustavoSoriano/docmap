// AUTO-GENERATED — não edite. Rode: deno task bundle-ui
export const UI_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>docmap — atlas de documentação</title>
<script>(function(){var t=localStorage.getItem('docmap-theme');if(t)document.documentElement.dataset.theme=t;})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Onest:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-view"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-lib/dist/browser/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js"></script>
<style>
:root {
  /* ── Surfaces (near-black, layered) ── */
  --bg:        #0b0c0e;
  --surface:   #101216;
  --surface-2: #16191f;
  --surface-3: #1e222a;
  --surface-4: #262b34;

  /* ── Borders ── */
  --border:      #22262e;
  --border-soft: rgba(255,255,255,.05);
  --border-mid:  rgba(255,255,255,.09);
  --border-hi:   rgba(255,255,255,.16);

  /* ── Text ── */
  --text:   #edeef1;
  --text-2: #9ca3af;
  --text-3: #626976;
  --text-4: #454b56;

  /* ── Accent (emerald) ── */
  --accent:      #37d99a;
  --accent-2:    #29c088;
  --accent-dim:  rgba(55,217,154,.14);
  --accent-line: rgba(55,217,154,.35);
  --on-accent:   #06120d;

  /* ── Graph categories ── */
  --cat-entry:    #fbbf24;
  --cat-arch:     #60a5fa;
  --cat-design:   #f472b6;
  --cat-security: #fb7185;
  --cat-process:  #94a3b8;
  --cat-default:  #6b7280;

  /* ── Annotation / note types ── */
  --type-note:      #94a3b8;
  --type-decision:  #60a5fa;
  --type-question:  #fbbf24;
  --type-todo:      #37d99a;
  --type-warning:   #fb7185;
  --type-reference: #a78bfa;
  --type-general:   #94a3b8;

  /* ── Typography ── */
  --font-ui:   'Geist', 'Onest', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', monospace;

  /* ── Metrics ── */
  --rail-w:   60px;
  --topbar-h: 54px;
  --r-xs: 5px;
  --r-sm: 7px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;

  /* ── Elevation ── */
  --sh-sm: 0 1px 2px rgba(0,0,0,.4);
  --sh-md: 0 8px 24px rgba(0,0,0,.45);
  --sh-lg: 0 20px 60px rgba(0,0,0,.6);
  --glow:  0 0 0 1px var(--accent-line), 0 4px 20px rgba(55,217,154,.18);

  /* ── Topbar ── */
  --topbar-bg: rgba(16,18,22,.6);
}

/* ════════ Light theme ════════ */
:root[data-theme='light'] {
  --bg:        #f6f7f9;
  --surface:   #ffffff;
  --surface-2: #eef0f4;
  --surface-3: #e3e6ec;
  --surface-4: #d6dae2;

  --border:      #d4d8e0;
  --border-soft: rgba(0,0,0,.05);
  --border-mid:  rgba(0,0,0,.10);
  --border-hi:   rgba(0,0,0,.18);

  --text:   #1a1d23;
  --text-2: #525a68;
  --text-3: #828b9a;
  --text-4: #aab2bf;

  --accent:     #0e9f6e;
  --accent-2:   #0b8a5e;
  --accent-dim: rgba(14,159,110,.12);
  --accent-line: rgba(14,159,110,.32);
  --on-accent:  #ffffff;

  --sh-sm: 0 1px 2px rgba(0,0,0,.08);
  --sh-md: 0 8px 24px rgba(0,0,0,.10);
  --sh-lg: 0 20px 60px rgba(0,0,0,.14);
  --glow:  0 0 0 1px var(--accent-line), 0 4px 20px rgba(14,159,110,.14);

  --topbar-bg: rgba(255,255,255,.72);
}

</style>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html, body { height: 100%; }

body {
  background: var(--bg);
  font-family: var(--font-ui);
  color: var(--text);
  display: flex;
  height: 100vh;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ambient depth: subtle radial glow top-left + faint grid */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(900px 500px at 12% -8%, rgba(55,217,154,.06), transparent 60%),
    radial-gradient(700px 500px at 100% 0%, rgba(96,165,250,.045), transparent 55%);
  pointer-events: none;
  z-index: 0;
}

/* ════════ Icons ════════ */
[data-icon] { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
.ico { width: 15px; height: 15px; flex-shrink: 0; display: block; }
.rail-ico .ico { width: 21px; height: 21px; }
#rail-logo .ico { width: 19px; height: 19px; }
#search-icon .ico { width: 16px; height: 16px; }
.fit-btn .ico { width: 19px; height: 19px; }
#no-workspace-mark .ico { width: 30px; height: 30px; }
#map-empty-mark .ico, #notes-editor-empty-mark .ico { width: 28px; height: 28px; }
.map-tab .ico { width: 16px; height: 16px; }

/* ════════ Left rail ════════ */
#rail {
  width: var(--rail-w);
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0 12px;
  gap: 6px;
  z-index: 30;
}
#rail-logo {
  width: 34px; height: 34px;
  display: grid; place-items: center;
  font-size: 18px;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 9px;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(55,217,154,.3);
}
.rail-btn {
  width: 48px; height: 52px;
  border: none;
  background: transparent;
  border-radius: var(--r-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: var(--text-3);
  transition: color .15s, background .15s;
  position: relative;
}
.rail-btn:hover { background: var(--surface-2); color: var(--text-2); }
.rail-btn.active { color: var(--accent); background: var(--accent-dim); }
.rail-btn.active::before {
  content: '';
  position: absolute;
  left: -14px; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 22px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}
.rail-ico { font-size: 19px; line-height: 1; }
.rail-lbl { font-size: 9.5px; font-weight: 600; letter-spacing: .01em; }
.rail-spacer { flex: 1; }

/* ════════ Stage ════════ */
#stage {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* ════════ Update banner ════════ */
#update-banner {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: linear-gradient(90deg, var(--accent-dim), transparent);
  border-bottom: 1px solid var(--accent-line);
  color: var(--text);
  font-size: 13px;
  flex-shrink: 0;
}
#update-banner.visible { display: flex; }
#update-text { flex: 1; }
#update-text strong { color: var(--accent); }
#update-apply, #update-dismiss {
  border: 1px solid var(--border-hi);
  background: var(--surface-2);
  color: var(--text);
  padding: 6px 14px;
  border-radius: var(--r-sm);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .13s;
}
#update-apply { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
#update-apply:hover { background: var(--accent-2); }
#update-dismiss { border-color: transparent; background: transparent; color: var(--text-2); }
#update-dismiss:hover { color: var(--text); }

/* ════════ Topbar ════════ */
#topbar {
  height: var(--topbar-h);
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 18px;
  background: var(--topbar-bg);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 60;   /* acima do #mode-map para o dropdown de busca não ficar atrás do canvas */
}
#topbar-crumb { display: flex; align-items: center; gap: 10px; flex-shrink: 0; min-width: 0; }
#topbar-mode {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -.01em;
  color: var(--text);
}
#topbar-sep { color: var(--text-4); }
#topbar-path {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-3);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 3px 9px;
  border-radius: var(--r-sm);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }

/* ════════ Theme toggle ════════ */
#theme-toggle {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-2);
  color: var(--text-2);
  cursor: pointer;
  outline: none;
  transition: all .15s;
}
#theme-toggle:hover {
  background: var(--surface-3);
  color: var(--text);
  border-color: var(--border-hi);
}
#theme-toggle .ico { width: 17px; height: 17px; }

/* ════════ Modes (fill remaining height) ════════ */
.mode { flex: 1; min-height: 0; overflow: hidden; }
.mode:not(.active) { display: none; }
.mode.active { display: flex; }
#mode-map { flex-direction: column; }

/* ════════ Map tabs ════════ */
#map-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  height: 46px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}
.map-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-3);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .13s;
}
.map-tab:hover { color: var(--text); background: var(--surface-2); }
.map-tab.active { color: var(--accent); background: var(--accent-dim); border-color: var(--accent-line); }
#map-open-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-3);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all .13s;
}
#map-open-btn:hover { border-color: var(--border-hi); color: var(--text); background: var(--surface-2); }
#map-open-btn .ico { width: 14px; height: 14px; }

/* ════════ Map panes (fill) ════════ */
#map-panes { flex: 1; min-height: 0; position: relative; }
.map-pane { position: absolute; inset: 0; display: none; }
.map-pane.active { display: flex; }

/* ════════ Confirm modal ════════ */
#modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6,7,9,.6);
  backdrop-filter: blur(2px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 700;
}
#modal-overlay.visible { display: flex; }
#modal {
  width: 380px;
  max-width: calc(100vw - 40px);
  background: var(--surface-2);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);
  padding: 22px;
  animation: popIn .16s ease;
}
#modal-msg { font-size: 14px; line-height: 1.5; color: var(--text); margin-bottom: 20px; }
#modal-actions { display: flex; gap: 9px; justify-content: flex-end; }
#modal-ok.danger { background: var(--cat-security); border-color: var(--cat-security); color: #fff; }
#modal-ok.danger:hover { filter: brightness(1.1); }

/* ════════ Tooltip ════════ */
#tooltip {
  position: fixed;
  background: var(--surface-4);
  color: var(--text);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-sm);
  padding: 6px 10px;
  font-size: 11px;
  font-family: var(--font-mono);
  pointer-events: none;
  opacity: 0;
  transition: opacity .12s;
  z-index: 400;
  box-shadow: var(--sh-md);
}

/* ════════ Toast ════════ */
#toast {
  position: fixed;
  bottom: 24px; left: 50%;
  transform: translate(-50%, 14px);
  background: var(--surface-4);
  color: var(--text);
  border: 1px solid var(--border-hi);
  padding: 10px 18px;
  border-radius: var(--r-xl);
  font-size: 12.5px;
  font-weight: 500;
  box-shadow: var(--sh-lg);
  opacity: 0;
  pointer-events: none;
  transition: all .28s cubic-bezier(.2,.8,.2,1);
  z-index: 600;
}
#toast.visible { opacity: 1; transform: translate(-50%, 0); }

/* ════════ Scrollbars ════════ */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--surface-4); border-radius: 6px; border: 2px solid transparent; background-clip: padding-box; }
::-webkit-scrollbar-thumb:hover { background: var(--text-4); background-clip: padding-box; }

</style>
<style>
/* ════════ Graph pane ════════ */
#graph-pane {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(1200px 700px at 50% 45%, rgba(255,255,255,.015), transparent 70%),
    var(--bg);
}
/* faint dot grid */
#graph-pane::before {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
}

svg#graph { width: 100%; height: 100%; display: block; position: relative; }

/* ── Links ── */
.link { stroke: var(--border-hi); stroke-width: 1.3px; stroke-opacity: .6; }
.link.highlighted { stroke: var(--accent); stroke-width: 2px; stroke-opacity: 1; }

/* ── Nodes ── */
.node { cursor: pointer; }
.node circle { transition: transform .18s ease, filter .18s; }
.node .node-core {
  stroke-width: 2px;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.5));
}
.node:hover .node-core { transform: scale(1.16); }
.node.selected .node-core { stroke-width: 2.5px; }
.node.dimmed { opacity: .22; }

.node text {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  fill: var(--text-2);
  pointer-events: none;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-width: 3.5px;
  stroke-linejoin: round;
}
.node:hover text, .node.selected text { fill: var(--text); }

/* ── Legend ── */
.legend {
  position: absolute;
  bottom: 18px; left: 18px;
  background: rgba(16,18,22,.82);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 12px 14px;
  font-size: 11.5px;
  color: var(--text-2);
  box-shadow: var(--sh-md);
}
.legend-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 9px;
}
.legend-item { display: flex; align-items: center; gap: 9px; margin-bottom: 6px; line-height: 1; }
.legend-item:last-child { margin-bottom: 0; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 8px currentColor; }

/* ── Fit button ── */
.map-tool {
  position: absolute;
  border: 1px solid var(--border);
  background: rgba(16,18,22,.82);
  backdrop-filter: blur(12px);
  box-shadow: var(--sh-md);
  cursor: pointer;
  transition: all .15s;
  color: var(--text-2);
}
.fit-btn {
  bottom: 18px; right: 18px;
  width: 40px; height: 40px;
  border-radius: var(--r-md);
  display: grid; place-items: center;
  font-size: 18px;
}
.fit-btn:hover { border-color: var(--accent-line); color: var(--accent); transform: translateY(-2px); }

/* ── No workspace ── */
#no-workspace {
  position: absolute; inset: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 10;
}
#no-workspace.visible { display: flex; }
#no-workspace-mark {
  width: 72px; height: 72px;
  display: grid; place-items: center;
  font-size: 32px;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-line);
  border-radius: 20px;
  margin-bottom: 4px;
}
#no-workspace-title { font-size: 19px; font-weight: 700; color: var(--text); letter-spacing: -.01em; }
#no-workspace-hint { font-size: 13px; color: var(--text-3); }
#no-workspace-btn {
  margin-top: 10px;
  padding: 10px 22px;
  border: none;
  border-radius: var(--r-md);
  background: var(--accent);
  color: var(--on-accent);
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(55,217,154,.3);
  transition: all .15s;
}
#no-workspace-btn:hover { background: var(--accent-2); transform: translateY(-2px); }

/* ── Node metadata panel ── */
#node-meta {
  position: absolute;
  bottom: 18px; right: 70px;
  background: rgba(16,18,22,.92);
  backdrop-filter: blur(14px);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-md);
  padding: 14px 16px 12px;
  box-shadow: var(--sh-lg);
  min-width: 224px;
  max-width: 300px;
  display: none;
  flex-direction: column;
  gap: 11px;
  z-index: 20;
  animation: popIn .14s ease;
}
#node-meta.visible { display: flex; }
#node-meta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
#node-meta-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#node-meta-close {
  flex-shrink: 0;
  width: 20px; height: 20px;
  display: grid; place-items: center;
  border: none;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  transition: color .12s, background .12s;
}
#node-meta-close:hover { color: var(--text); background: var(--surface-3); }
#node-meta-close .ico { width: 12px; height: 12px; }
#node-meta-stats { display: flex; flex-direction: column; gap: 7px; }
.node-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.node-meta-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-3);
  flex-shrink: 0;
}
.node-meta-value {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-2);
  text-align: right;
}
/* ── Authors section ── */
#nm-authors-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
}
#nm-authors-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nm-author-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 3px 0;
  border-bottom: 1px solid var(--border);
}
.nm-author-row:last-child { border-bottom: none; }
.nm-author-name {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-2);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nm-author-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  flex-shrink: 0;
  background: var(--surface-3);
  padding: 1px 7px;
  border-radius: 10px;
}
.nm-placeholder {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-3);
}
#nm-open-markmap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--accent-line);
  border-radius: var(--r-sm);
  background: var(--accent-dim);
  color: var(--accent);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .13s;
}
#nm-open-markmap:hover { background: var(--accent); color: var(--on-accent); }
#nm-open-markmap .ico { width: 13px; height: 13px; }

</style>
<style>
/* ════════ Markmap pane ════════ */
#markmap-pane {
  width: 100%;
  height: 100%;
  flex-direction: column;
  min-width: 0;
  background: var(--surface);
  position: relative;
}

#markmap-header {
  height: 52px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 14px;
}
#markmap-titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
#markmap-filename { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -.01em; line-height: 1.1; }
#markmap-filepath {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#markmap-actions { margin-left: auto; display: flex; gap: 8px; flex-shrink: 0; }

#btn-back-graph {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-3);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all .13s;
}
#btn-back-graph:hover { border-color: var(--border-hi); color: var(--text); background: var(--surface-2); }
#btn-back-graph .ico { width: 13px; height: 13px; }

.pill-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text-2);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .13s;
  white-space: nowrap;
}
.pill-btn:hover { border-color: var(--border-hi); color: var(--text); background: var(--surface-3); }
.pill-btn.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent-line); }
.pill-count {
  background: var(--surface-4);
  color: var(--text-2);
  border-radius: 8px;
  padding: 1px 7px;
  font-size: 11px;
  font-family: var(--font-mono);
  min-width: 20px;
  text-align: center;
}
.pill-btn.active .pill-count { background: var(--accent); color: var(--on-accent); }

#markmap-container,
#note-markmap { flex: 1; min-height: 0; overflow: hidden; position: relative; }
#markmap-container svg,
#note-markmap svg { width: 100% !important; height: 100% !important; }

/* markmap tem tema claro por padrão — forçar legibilidade no dark */
#markmap-container .markmap-node > text,
#markmap-container .markmap-foreign,
#markmap-container .markmap-foreign div,
#note-markmap .markmap-node > text,
#note-markmap .markmap-foreign,
#note-markmap .markmap-foreign div {
  fill: var(--text) !important;
  color: var(--text) !important;
}
#markmap-container .markmap-foreign a,
#note-markmap .markmap-foreign a { color: var(--accent) !important; }
#markmap-container .markmap-foreign code,
#note-markmap .markmap-foreign code {
  font-family: var(--font-mono);
  background: var(--surface-3);
  color: var(--accent);
  padding: 1px 5px;
  border-radius: 4px;
}

/* ── Zoom / foco controls ── */
#markmap-tools {
  position: absolute;
  bottom: 18px; right: 18px;
  display: none;
  flex-direction: column;
  gap: 7px;
  z-index: 15;
}
#markmap-tools.visible { display: flex; }
.mm-tool {
  width: 34px; height: 34px;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  position: static;
}
.mm-tool .ico { width: 17px; height: 17px; }
.mm-tool:hover { border-color: var(--accent-line); color: var(--accent); transform: translateY(-1px); }

#markmap-hint {
  display: none;
  position: absolute;
  bottom: 18px; left: 50%;
  transform: translateX(-50%);
  background: var(--surface-4);
  color: var(--text);
  border: 1px solid var(--accent-line);
  border-radius: var(--r-xl);
  padding: 7px 16px;
  font-size: 11.5px;
  font-weight: 500;
  pointer-events: none;
  z-index: 20;
  white-space: nowrap;
  box-shadow: var(--sh-md);
}
#markmap-hint.visible { display: block; }

/* ── Empty state ── */
#map-empty {
  position: absolute; inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  pointer-events: none;
}
#map-empty-mark {
  width: 68px; height: 68px;
  display: grid; place-items: center;
  font-size: 30px;
  color: var(--text-4);
  border: 1px dashed var(--border-mid);
  border-radius: 18px;
  animation: float 4s ease-in-out infinite;
}
#map-empty-text { font-size: 13.5px; color: var(--text-3); max-width: 280px; text-align: center; line-height: 1.5; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

</style>
<style>
/* ════════ Search ════════ */
#search-wrap { position: relative; flex: 1; max-width: 460px; margin-left: auto; }
#search-input {
  width: 100%;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 0 14px 0 38px;
  font-size: 13px;
  font-family: var(--font-ui);
  background: var(--surface-2);
  color: var(--text);
  outline: none;
  transition: all .15s;
}
#search-input:focus {
  border-color: var(--accent-line);
  background: var(--surface-3);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
#search-input::placeholder { color: var(--text-3); }
#search-icon {
  position: absolute;
  left: 13px; top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  pointer-events: none;
  color: var(--text-3);
}

#search-results {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  left: 0; right: 0;
  background: var(--surface-2);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  box-shadow: var(--sh-lg);
  max-height: 460px;
  overflow-y: auto;
  z-index: 200;
}
#search-results.visible { display: block; }

.search-count {
  padding: 9px 15px;
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-3);
  font-weight: 700;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
}
.search-empty { padding: 24px; text-align: center; color: var(--text-3); font-size: 12.5px; }
.search-result { padding: 12px 15px; border-bottom: 1px solid var(--border-soft); cursor: pointer; transition: background .1s; }
.search-result:last-child { border-bottom: none; }
.search-result:hover { background: var(--surface-3); }
.search-result-file { font-size: 12.5px; font-weight: 700; color: var(--accent); margin-bottom: 3px; }
.search-result-heading { font-size: 10px; color: var(--text-3); margin-bottom: 6px; font-family: var(--font-mono); }
.search-result-snippet {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-2);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
}
.search-result-snippet mark { background: var(--accent-dim); color: var(--accent); border-radius: 2px; padding: 0 2px; }

</style>
<style>
/* ════════ Annotations (contextual ao documento) ════════ */
#annot-panel {
  display: none;
  flex-direction: column;
  height: 240px;
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
#annot-panel.visible { display: flex; }

#annot-head {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#annot-head-title { font-size: 12px; font-weight: 700; letter-spacing: .01em; color: var(--text-2); }
.ghost-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid var(--border-mid);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text-2);
  font-family: var(--font-ui);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all .13s;
}
.ghost-btn:hover { border-color: var(--accent-line); color: var(--accent); }

#annot-list { flex: 1; overflow-y: auto; padding: 6px 0; }
#annot-empty { padding: 22px 18px; text-align: center; color: var(--text-3); font-size: 12px; }

.annot-item {
  padding: 11px 18px;
  border-bottom: 1px solid var(--border-soft);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.annot-item:last-child { border-bottom: none; }
.annot-type-bar { width: 3px; align-self: stretch; border-radius: 3px; flex-shrink: 0; box-shadow: 0 0 8px currentColor; }
.annot-main { flex: 1; min-width: 0; }
.annot-quote {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2px 8px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.annot-type-label { font-size: 10px; font-weight: 700; margin-left: 8px; }
.annot-note { font-size: 12.5px; color: var(--text); line-height: 1.5; }
.annot-actions { display: flex; gap: 5px; flex-shrink: 0; }
.annot-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 4px 6px;
  cursor: pointer;
  color: var(--text-3);
  transition: all .12s;
  display: inline-flex;
  align-items: center;
}
.annot-btn .ico { width: 13px; height: 13px; }
.annot-btn:hover { border-color: var(--accent-line); color: var(--accent); }
.annot-btn.del:hover { border-color: var(--cat-security); color: var(--cat-security); }

/* ════════ Annotation popover ════════ */
#annot-popover {
  display: none;
  position: fixed;
  z-index: 500;
  width: 340px;
  background: var(--surface-2);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);
  overflow: hidden;
}
#annot-popover.visible { display: block; animation: popIn .15s ease; }
@keyframes popIn { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: none; } }

#pop-head {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 15px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
#pop-label { font-size: 10px; font-weight: 700; letter-spacing: .08em; color: var(--accent); flex-shrink: 0; padding-top: 2px; }
#pop-quote { font-family: var(--font-mono); font-size: 11px; color: var(--text-2); line-height: 1.45; word-break: break-word; }

#pop-types { display: flex; gap: 6px; padding: 12px 15px 0; flex-wrap: wrap; }
.type-swatch { width: 8px; height: 8px; border-radius: 2px; display: inline-block; margin-right: 5px; vertical-align: middle; transform: rotate(45deg); }
.type-btn {
  padding: 4px 11px;
  border-radius: var(--r-xl);
  border: 1px solid var(--border);
  background: var(--surface-3);
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  cursor: pointer;
  transition: all .12s;
}
.type-btn:hover { border-color: var(--border-hi); color: var(--text); }
.type-btn.active { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }

#pop-body { padding: 12px 15px 0; }
#pop-textarea {
  width: 100%;
  height: 88px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 10px 12px;
  font-size: 13px;
  font-family: var(--font-ui);
  resize: vertical;
  outline: none;
  color: var(--text);
  background: var(--surface);
  transition: border .15s;
}
#pop-textarea:focus { border-color: var(--accent-line); }
#pop-textarea::placeholder { color: var(--text-3); }

#pop-foot { display: flex; gap: 8px; padding: 12px 15px 14px; justify-content: flex-end; }
.pop-btn {
  padding: 7px 15px;
  border-radius: var(--r-sm);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--surface-3);
  color: var(--text-2);
  transition: all .12s;
}
.pop-btn:hover { border-color: var(--border-hi); color: var(--text); }
.pop-btn.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.pop-btn.primary:hover { background: var(--accent-2); }
#pop-delete { color: var(--cat-security); }
#pop-delete:hover { border-color: var(--cat-security); }

</style>
<style>
/* ════════ Notes mode ════════ */
#mode-notes { background: var(--bg); }

/* ── List column ── */
#notes-col {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--surface);
}
#notes-col-head {
  display: flex;
  align-items: center;
  padding: 18px 18px 12px;
  gap: 10px;
  flex-shrink: 0;
}
#notes-col-title { font-size: 18px; font-weight: 700; letter-spacing: -.02em; color: var(--text); flex: 1; }
#notes-new-btn {
  width: 30px; height: 30px;
  border: none;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--on-accent);
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  display: grid; place-items: center;
  flex-shrink: 0;
  transition: all .15s;
  box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#notes-new-btn:hover { background: var(--accent-2); transform: scale(1.08); }

#notes-search-box { padding: 0 18px 10px; flex-shrink: 0; }

#notes-filters {
  padding: 0 18px 12px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}
#notes-filter-cat, #notes-filter-tag {
  flex: 1;
  min-width: 0;
  width: 0; /* força flex a respeitar o espaço disponível */
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-2);
  padding: 0 6px;
  outline: none;
  cursor: pointer;
  transition: border .12s;
  appearance: auto;
  overflow: hidden;
  text-overflow: ellipsis;
}
#notes-filter-cat:focus, #notes-filter-tag:focus { border-color: var(--accent-line); }
#notes-filter-cat option, #notes-filter-tag option { background: var(--surface-3); color: var(--text); }
#notes-search-input {
  width: 100%;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 0 13px;
  font-size: 12.5px;
  font-family: var(--font-ui);
  background: var(--surface-2);
  color: var(--text);
  outline: none;
  transition: border .15s;
}
#notes-search-input:focus { border-color: var(--accent-line); }
#notes-search-input::placeholder { color: var(--text-3); }

#notes-list { flex: 1; overflow-y: auto; min-height: 0; }
.notes-empty { padding: 34px 22px; text-align: center; color: var(--text-3); font-size: 12.5px; line-height: 1.7; }
.notes-empty strong { color: var(--accent); }

.note-item {
  padding: 13px 18px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background .1s;
  border-left: 2px solid transparent;
}
.note-item:hover { background: var(--surface-2); }
.note-item.active { background: var(--surface-2); border-left-color: var(--accent); }
.note-item.active .note-item-title { color: var(--accent); }
.note-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.note-cat-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }
.note-item-title { font-size: 13.5px; font-weight: 600; color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.note-item-preview { font-size: 11.5px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.4; }
.note-item-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
.note-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 1px 7px;
  border-radius: var(--r-xl);
  background: var(--surface-3);
  color: var(--text-3);
  border: 1px solid var(--border);
}

/* ── Footer (AI badge + backup) ── */
#notes-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  padding: 12px 18px;
  background: var(--surface);
}

#notes-ai-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10.5px;
  color: var(--text-3);
  margin-bottom: 10px;
}
#notes-ai-badge code { font-family: var(--font-mono); color: var(--accent); font-size: 10px; }
.ai-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: pulse-dot 2.4s ease-in-out infinite;
}
@keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

/* ── Editor column ── */
#notes-editor { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
#notes-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-3);
}
#notes-editor-empty.hidden { display: none; }
#notes-editor-empty-mark {
  width: 66px; height: 66px;
  display: grid; place-items: center;
  font-size: 28px;
  color: var(--text-4);
  border: 1px dashed var(--border-mid);
  border-radius: 18px;
}
#notes-editor-empty-text { font-size: 14px; }

#notes-editor-form { display: none; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
#notes-editor-form.visible { display: flex; }

#note-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 12px;
  flex-shrink: 0;
}
#note-title-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 24px;
  letter-spacing: -.02em;
  color: var(--text);
}
#note-title-input::placeholder { color: var(--text-4); }
#note-id-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 4px 9px;
  border-radius: var(--r-sm);
  cursor: pointer;
  flex-shrink: 0;
  transition: all .12s;
}
#note-id-badge:hover { color: var(--accent); border-color: var(--accent-line); }

.note-head-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text-3);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .12s;
  flex-shrink: 0;
}
.note-head-btn:hover { border-color: var(--accent-line); color: var(--accent); }
.note-head-btn.active { color: var(--accent); border-color: var(--accent-line); background: var(--accent-dim); }
.note-head-btn .ico { width: 14px; height: 14px; }

#note-markmap {
  flex: 1;
  display: none;
  min-height: 0;
  overflow: hidden;
  background: var(--surface);
}
#note-markmap.visible { display: block; }

#note-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#note-cat-field {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  padding: 0 10px;
  transition: border .12s;
}
#note-cat-field:focus-within { border-color: var(--accent-line); }
#note-cat-field .note-cat-dot { width: 8px; height: 8px; border-radius: 2px; transform: rotate(45deg); box-shadow: 0 0 6px currentColor; }
#note-cat-input {
  width: 110px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text);
}
#note-cat-input::placeholder { color: var(--text-3); }

#note-tags-input {
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text);
  padding: 0 9px;
  outline: none;
  flex: 1;
}
#note-tags-input:focus { border-color: var(--accent-line); }
#note-tags-input::placeholder { color: var(--text-3); }

.tool-btn {
  height: 30px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  cursor: pointer;
  transition: all .12s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.tool-btn:hover { border-color: var(--border-hi); color: var(--text); }
.tool-btn.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.tool-btn.primary:hover { background: var(--accent-2); }
.tool-btn.danger:hover { border-color: var(--cat-security); color: var(--cat-security); }

#note-body { flex: 1; display: flex; min-height: 0; overflow: hidden; }
#note-content-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 24px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
  color: var(--text);
  background: var(--surface);
}
#note-content-textarea::placeholder { color: var(--text-3); }
#note-preview {
  flex: 1;
  display: none;
  padding: 24px 32px;
  overflow-y: auto;
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--text);
  background: var(--surface);
}
#note-preview.visible { display: block; }
#note-preview h1, #note-preview h2, #note-preview h3 { font-weight: 700; margin: 22px 0 10px; line-height: 1.2; letter-spacing: -.01em; }
#note-preview h1 { font-size: 25px; }
#note-preview h2 { font-size: 20px; }
#note-preview h3 { font-size: 16px; }
#note-preview p { margin: 10px 0; color: var(--text); }
#note-preview code { font-family: var(--font-mono); background: var(--surface-3); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: var(--accent); }
#note-preview pre { background: var(--surface-2); padding: 14px; border-radius: var(--r-sm); overflow-x: auto; margin: 14px 0; border: 1px solid var(--border); }
#note-preview pre code { background: none; padding: 0; color: var(--text); }
#note-preview blockquote { border-left: 3px solid var(--accent); padding-left: 15px; color: var(--text-2); margin: 12px 0; }
#note-preview ul, #note-preview ol { padding-left: 24px; margin: 10px 0; }
#note-preview li { margin: 4px 0; }
#note-preview a { color: var(--accent); }
#note-preview hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

</style>
<style>
/* ════ AI Chat FAB + Panel ════ */

#chat-fab {
  position: fixed;
  top: 50%; right: 24px;
  transform: translateY(-50%);
  width: 52px; height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  display: grid; place-items: center;
  box-shadow: 0 4px 20px rgba(55,217,154,.4);
  z-index: 800;
  transition: all .2s cubic-bezier(.2,.8,.2,1);
}
#chat-fab .ico { width: 24px; height: 24px; }
#chat-fab:hover { transform: translateY(-50%) scale(1.08); box-shadow: 0 6px 28px rgba(55,217,154,.55); }
#chat-fab.active { background: var(--surface-4); box-shadow: var(--sh-md); }
#chat-fab.active:hover { transform: translateY(-50%) scale(1.04); }

/* ── Panel ── */
#chat-panel {
  position: fixed;
  top: 50%; right: 88px;
  transform: translateY(-50%) translateX(16px) scale(.97);
  width: 420px;
  max-height: 600px;
  background: var(--surface-2);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);
  display: flex; flex-direction: column;
  z-index: 799;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity .22s cubic-bezier(.2,.8,.2,1), transform .22s cubic-bezier(.2,.8,.2,1);
}
#chat-panel.open { transform: translateY(-50%); opacity: 1; pointer-events: all; }

/* posicionamento livre via JS drag */
#chat-panel.dragged {
  top: auto; right: auto;
  transform: none;
  transition: none;
}

/* painel minimizado: só o header fica visível */
#chat-panel.minimized {
  height: auto !important;
  max-height: none;
}
#chat-panel.minimized #chat-feed,
#chat-panel.minimized #chat-composer { display: none; }

#chat-header {
  display: flex; align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0; gap: 10px;
  cursor: grab;
  user-select: none;
}
#chat-header:active { cursor: grabbing; }
#chat-header #chat-provider,
#chat-header .ghost-btn { cursor: pointer; }
#chat-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: var(--text); flex: 1;
}
#chat-title .ico { width: 16px; height: 16px; color: var(--accent); }
#chat-provider {
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  padding: 3px 6px;
  border-radius: var(--r-sm);
  transition: background .12s, border .12s;
  max-width: 200px;
}
#chat-provider:hover { background: var(--surface-3); }
#chat-provider:focus-visible { border-color: var(--accent-line); }
#chat-provider option { background: var(--surface-2); color: var(--text); }
#chat-provider:disabled { opacity: .5; cursor: not-allowed; }
#chat-header-actions { display: flex; gap: 4px; }
#chat-header-actions .ghost-btn { padding: 4px 8px; font-size: 11px; }
#chat-header-actions .ico { width: 14px; height: 14px; }

/* ── Feed ── */
#chat-feed {
  flex: 1; overflow-y: auto; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 10px;
  min-height: 200px;
}

.chat-bubble {
  max-width: 88%; padding: 10px 14px;
  border-radius: var(--r-md);
  font-size: 13px; line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}
.chat-user {
  align-self: flex-end;
  background: var(--accent-dim);
  border: 1px solid var(--accent-line);
  color: var(--text);
}
.chat-assistant {
  align-self: flex-start;
  background: var(--surface-3);
  color: var(--text);
}
.chat-error {
  align-self: flex-start;
  background: rgba(251,113,133,.1);
  border: 1px solid rgba(251,113,133,.25);
  color: var(--cat-security);
}

/* ── Tool call badge ── */
.chat-tool-call {
  align-self: flex-start;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent-2);
  border-radius: var(--r-sm);
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  max-width: 92%;
  word-break: break-all;
}
.tool-summary-row { display: flex; align-items: center; gap: 6px; }
.tool-toggle {
  background: none; border: none; cursor: pointer;
  color: var(--text-3); font-size: 10px; padding: 0 2px;
  line-height: 1; opacity: 0.6; flex-shrink: 0;
}
.tool-toggle:hover { opacity: 1; }
.tool-name {
  font-weight: 700; padding: 1px 7px;
  border-radius: 4px; font-size: 10px;
  background: rgba(55,217,154,.12); color: var(--accent);
}
.tool-summary { color: var(--text-2); }
.tool-details { display: none; margin-top: 6px; border-top: 1px solid var(--border-soft); padding-top: 5px; }
.tool-details.open { display: block; }
.tool-body { color: var(--text-3); margin-bottom: 4px; white-space: pre-wrap; }
.tool-result { color: var(--text-3); white-space: pre-wrap; }

/* ── Composer ── */
#chat-composer {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
#chat-stop {
  display: flex; align-items: center; gap: 5px;
  height: 36px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface-3); color: var(--text-2);
  font-family: var(--font-ui); font-size: 12px;
  cursor: pointer; flex-shrink: 0;
  transition: all .12s;
}
#chat-stop:hover { border-color: var(--cat-security); color: var(--cat-security); }
#chat-stop .ico { width: 13px; height: 13px; }

#chat-input {
  flex: 1; border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface); color: var(--text);
  font-family: var(--font-ui); font-size: 13px;
  padding: 8px 12px; outline: none; resize: none;
  line-height: 1.5; max-height: 140px;
  overflow-y: hidden; box-sizing: border-box;
  transition: border .12s;
}
#chat-input:focus { border-color: var(--accent-line); }
#chat-input::placeholder { color: var(--text-3); }

#chat-send {
  width: 36px; height: 36px; flex-shrink: 0;
  border: none; border-radius: var(--r-sm);
  background: var(--accent); color: var(--on-accent);
  cursor: pointer; display: grid; place-items: center;
  transition: all .13s; box-shadow: 0 2px 8px rgba(55,217,154,.25);
}
#chat-send .ico { width: 16px; height: 16px; }
#chat-send:hover { background: var(--accent-2); }
#chat-send:disabled { opacity: .5; cursor: not-allowed; }

</style>
<style>
/* ════ Macros mode ════ */
#mode-macros { background: var(--bg); }

/* ── List column ── */
#macros-col {
  width: 260px; flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  background: var(--surface);
}
#macros-col-head {
  display: flex; align-items: center;
  padding: 18px 18px 14px; gap: 10px; flex-shrink: 0;
}
#macros-col-title { font-size: 18px; font-weight: 700; letter-spacing: -.02em; color: var(--text); flex: 1; }
#macros-new-btn {
  width: 30px; height: 30px; border: none; border-radius: var(--r-sm);
  background: var(--accent); color: var(--on-accent);
  font-size: 19px; line-height: 1; cursor: pointer;
  display: grid; place-items: center; flex-shrink: 0;
  transition: all .15s; box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#macros-new-btn:hover { background: var(--accent-2); transform: scale(1.08); }

#macros-list { flex: 1; overflow-y: auto; }
.macros-empty { padding: 34px 22px; text-align: center; color: var(--text-3); font-size: 12.5px; line-height: 1.7; }

.macro-item {
  padding: 12px 18px; border-bottom: 1px solid var(--border-soft);
  cursor: pointer; transition: background .1s; border-left: 2px solid transparent;
}
.macro-item:hover { background: var(--surface-2); }
.macro-item.active { background: var(--surface-2); border-left-color: var(--accent); }
.macro-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.macro-interp-dot { font-size: 13px; flex-shrink: 0; }
.macro-item-title { font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.macro-item.active .macro-item-title { color: var(--accent); }
.macro-item-desc { font-size: 11.5px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Editor column ── */
#macros-editor { flex: 1; display: flex; flex-direction: column; min-width: 0; }
#macros-editor-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px; color: var(--text-3);
}
#macros-editor-empty-mark { width: 66px; height: 66px; display: grid; place-items: center; color: var(--text-4); border: 1px dashed var(--border-mid); border-radius: 18px; }
#macros-editor-empty-mark .ico { width: 28px; height: 28px; }
#macros-editor-empty-text { font-size: 14px; }

#macros-editor-form { display: none; flex-direction: column; flex: 1; overflow: hidden; }
#macros-editor-form.visible { display: flex; }

#macro-head {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px 10px; flex-shrink: 0;
}
#macro-title-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-family: var(--font-ui); font-weight: 700; font-size: 20px;
  letter-spacing: -.02em; color: var(--text);
}
#macro-title-input::placeholder { color: var(--text-4); }

.macro-badge {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  padding: 3px 9px; border-radius: var(--r-sm); flex-shrink: 0;
  text-transform: uppercase; letter-spacing: .06em;
}
.macro-badge.bash { background: rgba(251,191,36,.12); color: #fbbf24; border: 1px solid rgba(251,191,36,.3); }
.macro-badge.deno { background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent-line); }

#macro-head-actions { display: flex; gap: 7px; flex-shrink: 0; }
.macro-run-btn {
  background: var(--accent) !important;
  color: var(--on-accent) !important;
  border-color: var(--accent) !important;
  box-shadow: 0 2px 10px rgba(55,217,154,.25);
}
.macro-run-btn:hover { background: var(--accent-2) !important; }
.macro-run-btn:disabled { opacity: .6; cursor: not-allowed; }

#macro-desc-row {
  padding: 0 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
#macro-desc-input {
  width: 100%; height: 30px; border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface-2); font-family: var(--font-ui); font-size: 12px;
  color: var(--text-2); padding: 0 10px; outline: none;
}
#macro-desc-input:focus { border-color: var(--accent-line); }
#macro-desc-input::placeholder { color: var(--text-3); }

#macro-body {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
}
#macro-script {
  flex: 1; border: none; outline: none; resize: none;
  padding: 18px 20px;
  font-family: var(--font-mono); font-size: 12.5px;
  line-height: 1.75; color: var(--text);
  background: var(--surface); tab-size: 2;
  min-height: 120px;
}
#macro-script::placeholder { color: var(--text-3); }

/* ── Output panel ── */
#macro-output-panel {
  flex-shrink: 0;
  max-height: 45%;
  display: flex; flex-direction: column;
  border-top: 1px solid var(--border);
  background: #080a0d;
}
#macro-output-header {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px; border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#macro-output-title {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--text-3);
}
.macro-status {
  font-family: var(--font-mono); font-size: 10px;
  padding: 2px 8px; border-radius: var(--r-xl);
}
.macro-status.running {
  background: rgba(55,217,154,.15); color: var(--accent);
  border: 1px solid var(--accent-line);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

#macro-output {
  flex: 1; overflow-y: auto; overflow-x: auto;
  padding: 14px 20px;
  font-family: var(--font-mono); font-size: 12px;
  line-height: 1.6; margin: 0;
  white-space: pre-wrap; word-break: break-word;
}
.out-out     { color: #d4d4d4; }
.out-info    { color: #626976; }
.out-error   { color: var(--cat-security); }
.out-success { color: var(--accent); }

/* spinner */
.run-spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid rgba(6,18,13,.4);
  border-top-color: var(--on-accent);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ghost-btn.danger:hover { color: var(--cat-security); border-color: var(--cat-security); }

</style>
<style>
/* ════ Skills mode ════ */
#mode-skills { background: var(--bg); }

/* ── List column ── */
#skills-col {
  width: 300px; flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  background: var(--surface);
}
#skills-col-head {
  display: flex; align-items: center;
  padding: 18px 18px 12px; gap: 10px; flex-shrink: 0;
}
#skills-col-title { font-size: 18px; font-weight: 700; letter-spacing: -.02em; color: var(--text); flex: 1; }
#skills-new-btn {
  width: 30px; height: 30px; border: none; border-radius: var(--r-sm);
  background: var(--accent); color: var(--on-accent);
  font-size: 19px; line-height: 1; cursor: pointer;
  display: grid; place-items: center; flex-shrink: 0;
  transition: all .15s; box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#skills-new-btn:hover { background: var(--accent-2); transform: scale(1.08); }

#skills-search-box { padding: 0 18px 12px; flex-shrink: 0; }
#skills-search-input {
  width: 100%; height: 34px; border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface-2); font-family: var(--font-ui); font-size: 12.5px;
  color: var(--text); padding: 0 13px; outline: none; transition: border .12s;
}
#skills-search-input:focus { border-color: var(--accent-line); }
#skills-search-input::placeholder { color: var(--text-3); }

#skills-list { flex: 1; overflow-y: auto; }
.skills-empty { padding: 34px 22px; text-align: center; color: var(--text-3); font-size: 12.5px; line-height: 1.7; }
.skills-empty strong { color: var(--accent); }

.skill-item {
  padding: 12px 18px; border-bottom: 1px solid var(--border-soft);
  cursor: pointer; transition: background .1s; border-left: 2px solid transparent;
}
.skill-item:hover { background: var(--surface-2); }
.skill-item.active { background: var(--surface-2); border-left-color: var(--accent); }
.skill-item-top { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.skill-item-name {
  font-family: var(--font-mono); font-size: 11px; font-weight: 600;
  color: var(--accent); flex-shrink: 0;
}
.skill-item-title { font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.skill-item.active .skill-item-title { color: var(--accent); }
.skill-item-desc { font-size: 11.5px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 5px; }
.skill-item-tags { display: flex; gap: 5px; flex-wrap: wrap; }

/* ── Editor column ── */
#skills-editor { flex: 1; display: flex; flex-direction: column; min-width: 0; }
#skills-editor-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px; color: var(--text-3);
}
#skills-editor-empty-mark {
  width: 66px; height: 66px; display: grid; place-items: center;
  color: var(--text-4); border: 1px dashed var(--border-mid); border-radius: 18px;
}
#skills-editor-empty-mark .ico { width: 28px; height: 28px; }
#skills-editor-empty-text { font-size: 14px; }

#skills-editor-form { display: none; flex-direction: column; flex: 1; overflow: hidden; }
#skills-editor-form.visible { display: flex; }

#skill-head {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px 10px; flex-shrink: 0;
}
#skill-title-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-family: var(--font-ui); font-weight: 700; font-size: 22px;
  letter-spacing: -.02em; color: var(--text);
}
#skill-title-input::placeholder { color: var(--text-4); }
#skill-name-badge {
  font-family: var(--font-mono); font-size: 11px; font-weight: 600;
  color: var(--accent); background: var(--accent-dim);
  border: 1px solid var(--accent-line); padding: 3px 9px;
  border-radius: var(--r-sm); flex-shrink: 0;
}

#skill-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 0 20px 10px; flex-shrink: 0;
}
#skill-name-field {
  display: flex; align-items: center; gap: 5px;
  height: 30px; border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface-2); padding: 0 10px; transition: border .12s;
}
#skill-name-field:focus-within { border-color: var(--accent-line); }
#skill-name-prefix { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--accent); }
#skill-name-input {
  width: 150px; border: none; outline: none; background: transparent;
  font-family: var(--font-mono); font-size: 12px; color: var(--text);
}
#skill-name-input::placeholder { color: var(--text-3); }

#skill-tags-input {
  flex: 1; height: 30px; border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface-2); font-family: var(--font-ui); font-size: 12px;
  color: var(--text); padding: 0 9px; outline: none;
}
#skill-tags-input:focus { border-color: var(--accent-line); }
#skill-tags-input::placeholder { color: var(--text-3); }

#skill-desc-row {
  padding: 0 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
#skill-desc-input {
  width: 100%; height: 30px; border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface-2); font-family: var(--font-ui); font-size: 12px;
  color: var(--text-2); padding: 0 10px; outline: none;
}
#skill-desc-input:focus { border-color: var(--accent-line); }
#skill-desc-input::placeholder { color: var(--text-3); }

#skill-body { flex: 1; display: flex; min-height: 0; overflow: hidden; }
#skill-content-textarea {
  flex: 1; border: none; outline: none; resize: none;
  padding: 20px; font-family: var(--font-mono); font-size: 13px;
  line-height: 1.8; color: var(--text); background: var(--surface); tab-size: 2;
}
#skill-content-textarea::placeholder { color: var(--text-3); }

#skill-preview {
  flex: 1; display: none; padding: 20px 28px; overflow-y: auto;
  font-size: 14px; line-height: 1.75; color: var(--text); background: var(--surface);
}
#skill-preview.visible { display: block; }
#skill-preview h1, #skill-preview h2, #skill-preview h3 { font-weight: 700; margin: 20px 0 8px; }
#skill-preview code { font-family: var(--font-mono); background: var(--surface-3); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: var(--accent); }
#skill-preview pre { background: var(--surface-2); padding: 14px; border-radius: var(--r-sm); overflow-x: auto; margin: 12px 0; border: 1px solid var(--border); }
#skill-preview pre code { background: none; padding: 0; color: var(--text); }
#skill-preview blockquote { border-left: 3px solid var(--accent); padding-left: 15px; color: var(--text-2); margin: 10px 0; }
#skill-preview ul, #skill-preview ol { padding-left: 22px; margin: 8px 0; }

</style>
<style>
/* ════ Diagrams mode ════ */
#mode-diagrams { background: var(--bg); }

/* ── List column ── */
#diag-col {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
#diag-col-head {
  display: flex;
  align-items: center;
  padding: 18px 18px 14px;
  gap: 10px;
  flex-shrink: 0;
}
#diag-col-title { font-size: 18px; font-weight: 700; letter-spacing: -.02em; color: var(--text); flex: 1; }
#diag-new-btn {
  width: 30px; height: 30px;
  border: none; border-radius: var(--r-sm);
  background: var(--accent); color: var(--on-accent);
  font-size: 19px; line-height: 1;
  cursor: pointer; display: grid; place-items: center;
  flex-shrink: 0;
  transition: all .15s; box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#diag-new-btn:hover { background: var(--accent-2); transform: scale(1.08); }

#diag-list { flex: 1; overflow-y: auto; }
.diag-empty { padding: 34px 22px; text-align: center; color: var(--text-3); font-size: 12.5px; line-height: 1.7; }
.diag-empty strong { color: var(--accent); }

.diag-item {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background .1s;
  border-left: 2px solid transparent;
}
.diag-item:hover { background: var(--surface-2); }
.diag-item.active { background: var(--surface-2); border-left-color: var(--accent); }
.diag-item.active .diag-item-title { color: var(--accent); }
.diag-item-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.diag-item-preview { font-size: 11px; font-family: var(--font-mono); color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Editor column ── */
#diag-editor { flex: 1; display: flex; flex-direction: column; min-width: 0; }

#diag-editor-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px; color: var(--text-3);
}
#diag-editor-empty-mark {
  width: 66px; height: 66px; display: grid; place-items: center; font-size: 28px;
  color: var(--text-4); border: 1px dashed var(--border-mid); border-radius: 18px;
}
#diag-editor-empty-text { font-size: 14px; }

#diag-editor-form { display: none; flex-direction: column; flex: 1; overflow: hidden; }
#diag-editor-form.visible { display: flex; }

#diag-head {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
#diag-title-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-family: var(--font-ui); font-weight: 700; font-size: 20px;
  letter-spacing: -.02em; color: var(--text);
}
#diag-title-input::placeholder { color: var(--text-4); }
#diag-id-badge {
  font-family: var(--font-mono); font-size: 10px; color: var(--text-3);
  background: var(--surface-2); border: 1px solid var(--border);
  padding: 3px 8px; border-radius: var(--r-sm); flex-shrink: 0;
}
#diag-head-actions { display: flex; gap: 7px; flex-shrink: 0; }

#diag-body {
  flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;
}

/* ── Preview — tela cheia por padrão ── */
#diag-preview-col {
  flex: 1; min-height: 0; overflow: auto;
  background: var(--surface-2);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 28px;
}
#diag-preview { width: 100%; }
#diag-preview svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }

/* ── Source — colapsável, fechado por padrão ── */
#diag-source-col {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  display: flex; flex-direction: column;
  max-height: 38px; /* header only when collapsed */
  overflow: hidden;
  transition: max-height .25s ease;
}
#diag-source-col.open { max-height: 260px; }

#diag-source-header {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px; cursor: pointer;
  font-size: 11px; font-weight: 600; letter-spacing: .04em;
  color: var(--text-3); flex-shrink: 0; user-select: none;
}
#diag-source-header:hover { color: var(--text-2); background: var(--surface-3); }
#diag-source-toggle { font-size: 10px; transition: transform .2s; }
#diag-source-col.open #diag-source-toggle { transform: rotate(90deg); }
#diag-docs-link {
  margin-left: auto; color: var(--accent-2);
  text-decoration: none; font-size: 11px;
}
#diag-docs-link:hover { text-decoration: underline; }

#diag-source {
  flex: 1; border: none; outline: none; resize: none;
  padding: 14px 18px;
  font-family: var(--font-mono); font-size: 12px;
  line-height: 1.7; color: var(--text); background: var(--surface);
  tab-size: 2;
}
#diag-source::placeholder { color: var(--text-3); }

.diag-error {
  padding: 16px; background: rgba(251,113,133,.08);
  border: 1px solid rgba(251,113,133,.25); border-radius: var(--r-sm);
  color: var(--cat-security); font-size: 12px; line-height: 1.6;
}
.diag-error code { font-family: var(--font-mono); font-size: 11px; }

/* ── Zoom bar ── */
#diag-preview-col { position: relative; }

#diag-zoom-bar {
  position: absolute; top: 12px; right: 12px; z-index: 10;
  display: flex; align-items: center; gap: 4px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 4px 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
}
#diag-zoom-label {
  font-size: 11px; font-family: var(--font-mono);
  color: var(--text-3); min-width: 36px; text-align: center;
}
.diag-zoom-btn {
  width: 24px; height: 24px; border: none; border-radius: 4px;
  background: transparent; color: var(--text-2);
  cursor: pointer; display: grid; place-items: center; font-size: 13px;
  transition: background .1s, color .1s;
}
.diag-zoom-btn:hover { background: var(--surface-2); color: var(--text); }

</style>
<style>
/* ════ Kanban ════ */

#mode-tasks {
  flex-direction: column;
}

#kanban-board {
  display: flex;
  gap: 14px;
  flex: 1;
  padding: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: flex-start;
}

/* ── Coluna ── */

.kanban-col {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 260px;
  max-width: 400px;
  max-height: 100%;
  background: var(--surface-2);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  overflow: hidden;
  transition: background 0.15s, border-color 0.15s;
}

.kanban-col.drag-over-col {
  background: var(--surface-3);
  border-color: var(--accent-line);
}

.kanban-col-head {
  display: flex;
  align-items: center;
  padding: 10px 12px 10px 14px;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.kanban-col-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kanban-col-dot[data-col="todo"]        { background: var(--text-3); }
.kanban-col-dot[data-col="in-progress"] { background: var(--cat-entry); }
.kanban-col-dot[data-col="done"]        { background: var(--accent); }

.kanban-col-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-2);
  flex: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.kanban-col-count {
  font-size: 0.72rem;
  color: var(--text-3);
  background: var(--surface-3);
  border-radius: 10px;
  padding: 1px 7px;
  font-variant-numeric: tabular-nums;
}

.kanban-col-add {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--surface-3);
  color: var(--text-2);
  border-radius: var(--r-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.kanban-col-add:hover {
  background: var(--accent);
  color: var(--on-accent);
}

.kanban-modal-close {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--text-3);
  border-radius: var(--r-xs);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.12s, background 0.12s;
}
.kanban-modal-close:hover {
  color: var(--text);
  background: var(--surface-3);
}

/* ── Cards ── */

.kanban-cards {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 48px;
}

.kanban-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.12s, box-shadow 0.12s, opacity 0.12s;
  position: relative;
}

.kanban-card:hover {
  border-color: var(--border-mid);
  box-shadow: var(--sh-sm);
}

.kanban-card.is-dragging {
  opacity: 0.35;
}

.kanban-card.drop-before::before {
  content: '';
  display: block;
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
  margin-bottom: 6px;
  margin-top: -2px;
}

.kanban-card.drop-after::after {
  content: '';
  display: block;
  height: 2px;
  background: var(--accent);
  border-radius: 2px;
  margin-top: 6px;
  margin-bottom: -2px;
}

.kanban-card-title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.45;
  color: var(--text);
  word-break: break-word;
}

.kanban-card-desc {
  font-size: 0.78rem;
  color: var(--text-3);
  margin-top: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kanban-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.kanban-card-due {
  font-size: 0.72rem;
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 3px;
}

.kanban-card-due.overdue {
  color: var(--type-warning);
}

.kanban-card-due.due-today {
  color: var(--cat-entry);
}

.kanban-card-note-link {
  font-size: 0.7rem;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}

/* ── Modal ── */

#task-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}

#task-modal-overlay.visible {
  opacity: 1;
  pointer-events: all;
}

#task-modal {
  background: var(--surface-2);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-xl);
  width: min(860px, 92vw);
  height: min(600px, 88vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--sh-lg);
}

#task-modal-head {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  gap: 10px;
}

#task-title-input {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 600;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: var(--font-ui);
}
#task-title-input::placeholder { color: var(--text-4); }

#task-status-select {
  font-size: 0.78rem;
  background: var(--surface-3);
  border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: var(--r-sm);
  padding: 4px 8px;
  cursor: pointer;
  outline: none;
  font-family: var(--font-ui);
}

#task-modal-close {
  padding: 4px;
  color: var(--text-3);
  border-radius: var(--r-xs);
  transition: color 0.12s;
}
#task-modal-close:hover { color: var(--text); }

#task-modal-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: row;
  gap: 16px;
  overflow: hidden;
}

/* descrição ocupa tudo à esquerda */
#task-modal-body > .task-field:first-child {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.task-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.task-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

#task-desc-textarea {
  flex: 1;
  resize: none;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--r-md);
  padding: 8px 10px;
  outline: none;
  line-height: 1.55;
  transition: border-color 0.12s;
}
#task-desc-textarea:focus { border-color: var(--accent-line); }

/* metadados: coluna vertical à direita */
.task-meta-row {
  flex-basis: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding-top: 2px;
}

#task-due-input {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--r-sm);
  padding: 6px 10px;
  font-size: 0.82rem;
  font-family: var(--font-ui);
  outline: none;
  transition: border-color 0.12s;
  width: 100%;
}
#task-due-input:focus { border-color: var(--accent-line); }

#task-note-wrap {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  transition: border-color 0.12s;
  overflow: hidden;
}
#task-note-wrap:focus-within { border-color: var(--accent-line); }

#task-note-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.82rem;
  font-family: var(--font-ui);
  padding: 6px 10px;
}
#task-note-input::placeholder { color: var(--text-4); }
#task-note-input.has-link { color: var(--accent); }

#task-note-clear {
  border: none;
  background: transparent;
  color: var(--text-3);
  padding: 0 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: color 0.12s;
}
#task-note-clear:hover { color: var(--text); }

#task-note-dropdown {
  position: fixed;
  background: var(--surface-3);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  box-shadow: var(--sh-md);
  z-index: 400;
  max-height: 180px;
  overflow-y: auto;
  display: none;
}
#task-note-dropdown.open { display: block; }

.note-search-item {
  padding: 7px 12px;
  font-size: 0.82rem;
  color: var(--text-2);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.1s, color 0.1s;
}
.note-search-item:hover,
.note-search-item.focused {
  background: var(--accent-dim);
  color: var(--accent);
}
.note-search-empty {
  padding: 10px 12px;
  font-size: 0.78rem;
  color: var(--text-4);
  text-align: center;
}

#task-modal-footer {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  gap: 8px;
}

.task-footer-spacer { flex: 1; }

/* ── Empty state coluna ── */
.kanban-col-empty {
  font-size: 0.78rem;
  color: var(--text-4);
  text-align: center;
  padding: 20px 12px;
  line-height: 1.5;
}

</style>
<style>
/* ════ Mocks ════ */

#mode-mocks {
  flex-direction: row;
  overflow: hidden;
}

/* ────────────────────────────
   Coluna esquerda
──────────────────────────── */

#mocks-col {
  width: 256px;
  min-width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  overflow: hidden;
  background: var(--surface);
}

/* ── Cabeçalhos de seção ── */

#mocks-col-head,
#mocks-list-head {
  display: flex;
  align-items: center;
  padding: 9px 10px 9px 14px;
  gap: 6px;
  flex-shrink: 0;
}

#mocks-col-head {
  border-bottom: 1px solid var(--border);
}

#mocks-list-head {
  border-top: 1px solid var(--border);
  padding-top: 8px;
}

.mocks-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-4);
  flex: 1;
}

#mocks-list-heading {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-3);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mocks-hd-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-4);
  border-radius: var(--r-xs);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.mocks-hd-btn:hover {
  background: var(--accent);
  color: var(--on-accent);
}

/* ── Lista de collections ── */

#mocks-col-list {
  padding: 5px;
  flex-shrink: 0;
  max-height: 210px;
  overflow-y: auto;
}

.mocks-col-empty {
  font-size: 0.75rem;
  color: var(--text-4);
  text-align: center;
  padding: 18px 10px;
  line-height: 1.6;
}

.mocks-col-item {
  display: flex;
  align-items: center;
  border-radius: var(--r-sm);
  transition: background 0.1s;
}
.mocks-col-item:hover { background: var(--surface-3); }
.mocks-col-item.active { background: var(--accent-dim); }

.mocks-col-item-inner {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 7px 8px;
  cursor: pointer;
  gap: 8px;
  min-width: 0;
}

.mocks-col-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-4);
  flex-shrink: 0;
  transition: background 0.12s, box-shadow 0.12s;
}
.mocks-col-item.active .mocks-col-dot {
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.mocks-col-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-2);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.12s;
}
.mocks-col-item.active .mocks-col-name { color: var(--accent); }

.mocks-col-count {
  font-size: 0.65rem;
  color: var(--text-4);
  background: var(--surface-4);
  border-radius: 10px;
  padding: 1px 6px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.mocks-col-actions {
  display: none;
  align-items: center;
  gap: 2px;
  padding-right: 5px;
}
.mocks-col-item:hover .mocks-col-actions { display: flex; }

.mocks-col-action-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-4);
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.12s, background 0.12s;
}
.mocks-col-action-btn:hover        { color: var(--text-2); background: var(--surface-4); }
.mocks-col-action-btn.warn:hover   { color: #f59e0b; }
.mocks-col-action-btn.danger:hover { color: #fb7185; }

/* ── Inline new/rename inputs ── */

.mocks-col-new-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 6px;
  border-radius: var(--r-sm);
  background: var(--surface-3);
  margin-bottom: 4px;
}

.mocks-col-new-input,
.mocks-col-rename-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.8125rem;
  font-family: var(--font-ui);
  padding: 2px 4px;
  min-width: 0;
}
.mocks-col-new-input::placeholder { color: var(--text-4); }

.mocks-col-rename-input {
  flex: 1;
  border-bottom: 1px solid var(--accent-line);
}

.mocks-col-new-ok {
  width: 22px;
  height: 22px;
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  border-radius: var(--r-xs);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s;
}
.mocks-col-new-ok:hover { background: var(--accent-2); }

/* ── Lista de mocks ── */

#mocks-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 5px;
}

.mocks-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-4);
  font-size: 0.75rem;
  padding: 28px 14px;
  text-align: center;
  line-height: 1.55;
}
.mocks-list-empty .ico { width: 22px; height: 22px; opacity: 0.35; }

/* ── Separadores de grupo ── */

.mocks-group-sep {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 6px 4px;
  user-select: none;
}

.mocks-group-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border) 30%, var(--border) 70%, transparent);
}

.mocks-group-label {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-4);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Item de mock ── */

.mocks-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background 0.1s, box-shadow 0.1s;
  min-width: 0;
}
.mocks-item:hover { background: var(--surface-2); }
.mocks-item.active {
  background: var(--surface-2);
  box-shadow: inset 2px 0 0 var(--accent);
}

/* ── Badges HTTP ── */

.mock-method-badge {
  font-family: var(--font-mono);
  font-size: 0.595rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 2px 5px;
  border-radius: 4px;
  flex-shrink: 0;
  line-height: 1;
  text-transform: uppercase;
  min-width: 38px;
  text-align: center;
}

.method-get    { color: var(--accent); background: var(--accent-dim); }
.method-post   { color: #60a5fa;       background: rgba(96,165,250,.13); }
.method-put    { color: #f59e0b;       background: rgba(245,158,11,.12); }
.method-patch  { color: #a78bfa;       background: rgba(167,139,250,.13); }
.method-delete { color: #fb7185;       background: rgba(251,113,133,.13); }
.method-gray   { color: var(--text-3); background: var(--surface-3); }

.mock-item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.mock-item-path {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-item-name {
  font-size: 0.65rem;
  color: var(--text-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-item-col {
  font-size: 0.6rem;
  color: var(--text-4);
  background: var(--surface-3);
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Rodapé da coluna ── */

#mocks-col-footer {
  border-top: 1px solid var(--border);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  background: var(--surface);
}

#mocks-server-badge {
  display: flex;
  align-items: center;
  gap: 7px;
}

.mocks-server-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 var(--accent-dim);
  animation: pulse-dot 2.4s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(55,217,154,.5); }
  50%       { box-shadow: 0 0 0 5px rgba(55,217,154,0); }
}

.mocks-server-url {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-3);
  flex: 1;
}

#mocks-server-count {
  font-size: 0.65rem;
  color: var(--text-4);
}
#mocks-server-count::before {
  content: attr(data-count) ' mock(s)';
}

#mocks-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 500;
  color: #fb7185;
  background: rgba(251,113,133,.07);
  border: 1px solid rgba(251,113,133,.18);
  border-radius: var(--r-sm);
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  width: 100%;
  font-family: var(--font-ui);
}
#mocks-clear-btn:hover {
  background: rgba(251,113,133,.15);
  border-color: rgba(251,113,133,.38);
}

/* ────────────────────────────
   Editor
──────────────────────────── */

#mocks-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface-2);
}

#mocks-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

#mocks-editor-empty-mark .ico {
  width: 38px;
  height: 38px;
  color: var(--text-4);
  opacity: 0.28;
}

#mocks-editor-empty-text {
  font-size: 0.875rem;
  color: var(--text-4);
}

#mocks-editor-form {
  display: none;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  gap: 14px;
}

/* ── Cabeçalho do mock ── */

#mock-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

#mock-id-badge {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-3);
  background: var(--surface-3);
  border-radius: var(--r-sm);
  padding: 4px 10px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  display: inline-flex;
}

/* Cor do badge de método no cabeçalho */
#mock-id-badge[data-method="GET"]     { color: var(--accent); background: var(--accent-dim); }
#mock-id-badge[data-method="POST"]    { color: #60a5fa;       background: rgba(96,165,250,.12); }
#mock-id-badge[data-method="PUT"]     { color: #f59e0b;       background: rgba(245,158,11,.12); }
#mock-id-badge[data-method="PATCH"]   { color: #a78bfa;       background: rgba(167,139,250,.12); }
#mock-id-badge[data-method="DELETE"]  { color: #fb7185;       background: rgba(251,113,133,.12); }

#mock-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Campos do form ── */

.mock-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mock-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mock-input,
.mock-select {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--r-sm);
  padding: 7px 10px;
  font-size: 0.845rem;
  font-family: var(--font-ui);
  outline: none;
  transition: border-color 0.15s;
}
.mock-input:focus,
.mock-select:focus { border-color: var(--accent-line); }
.mock-input::placeholder { color: var(--text-4); }

#mock-path-input {
  font-family: var(--font-mono);
  font-size: 0.845rem;
  letter-spacing: 0.01em;
}

#mock-meta-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
}

#mock-meta-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* Method select colorido */
#mock-method-select {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 7px 8px;
  cursor: pointer;
  min-width: 90px;
}
#mock-method-select[data-method="GET"]    { color: var(--accent); }
#mock-method-select[data-method="POST"]   { color: #60a5fa; }
#mock-method-select[data-method="PUT"]    { color: #f59e0b; }
#mock-method-select[data-method="PATCH"]  { color: #a78bfa; }
#mock-method-select[data-method="DELETE"] { color: #fb7185; }

/* ── Script editor (CodeMirror) ── */

.mock-field-script {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Encaixa CodeMirror no tema dark do app.
   \`color\` sem !important: garante texto legível se o tema CDN não carregar,
   mas perde para o seletor mais específico \`.cm-s-one-dark.CodeMirror\`
   quando o tema estiver presente — os tokens de sintaxe usam color nos
   próprios spans e ganham de qualquer jeito. */
.mock-field-script .CodeMirror {
  background: var(--surface) !important;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-family: var(--font-mono) !important;
  font-size: 0.8rem;
  line-height: 1.65;
  height: auto;
  min-height: 160px;
  flex: 1;
  transition: border-color 0.15s;
}
.mock-field-script .CodeMirror-focused {
  border-color: var(--accent-line);
}
.mock-field-script .CodeMirror-scroll {
  min-height: 160px;
}
.mock-field-script .CodeMirror-gutters {
  background: var(--surface-2) !important;
  border-right: 1px solid var(--border) !important;
}
.mock-field-script .CodeMirror-linenumber {
  color: var(--text-4) !important;
  font-size: 0.72rem;
}
.mock-field-script .CodeMirror-cursor {
  border-left-color: var(--accent) !important;
}
.mock-field-script .CodeMirror-selectedtext,
.mock-field-script .CodeMirror-selected {
  background: rgba(55,217,154,.15) !important;
}

/* ── Sintaxe JS embutida (paleta one-dark, sem CDN) ── */
.mock-field-script .cm-keyword               { color: #c678dd; }
.mock-field-script .cm-operator              { color: #c678dd; }
.mock-field-script .cm-string               { color: #98c379; }
.mock-field-script .cm-string-2             { color: #98c379; }
.mock-field-script .cm-number               { color: #d19a66; }
.mock-field-script .cm-atom                 { color: #d19a66; }
.mock-field-script .cm-comment              { color: #5c6370; font-style: italic; }
.mock-field-script .cm-def                  { color: #61afef; }
.mock-field-script .cm-variable             { color: #e06c75; }
.mock-field-script .cm-variable-2           { color: #abb2bf; }
.mock-field-script .cm-property             { color: #e5c07b; }
.mock-field-script .cm-qualifier            { color: #e5c07b; }
.mock-field-script .cm-builtin              { color: #56b6c2; }
.mock-field-script .cm-tag                  { color: #e06c75; }
.mock-field-script .cm-bracket              { color: #abb2bf; }
.mock-field-script .cm-punctuation          { color: #abb2bf; }
.mock-field-script .cm-meta                 { color: #abb2bf; }

#mock-script-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

#mock-script-hint {
  font-size: 0.63rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-4);
  flex: 1;
}

#btn-format-script {
  font-size: 0.7rem;
  color: var(--text-4);
  gap: 4px;
  padding: 2px 6px;
  border-radius: var(--r-xs);
  transition: color 0.12s, background 0.12s;
}
#btn-format-script:hover {
  color: var(--accent);
  background: var(--accent-dim);
}

/* Textarea fica escondido após CodeMirror assumir; estilos de fallback caso CDN falhe */
#mock-script-textarea {
  flex: 1;
  min-height: 160px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.65;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--r-md);
  padding: 12px 14px;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
  tab-size: 2;
  caret-color: var(--accent);
}
#mock-script-textarea:focus { border-color: var(--accent-line); }
/* CodeMirror esconde o textarea original — não quebramos o layout */
#mock-script-textarea + .CodeMirror { flex: 1; }

/* ────────────────────────────
   Painel de teste
──────────────────────────── */

#mock-test-panel {
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  flex-shrink: 0;
  transition: border-color 0.12s;
}
#mock-test-panel:focus-within { border-color: var(--border-mid); }

.test-panel-head {
  display: flex;
  align-items: center;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  gap: 8px;
  background: var(--surface-2);
}

.test-panel-title {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-4);
  flex: 1;
}

#mock-test-params {
  padding: 10px 12px 4px;
}

.test-params-label {
  font-size: 0.63rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-4);
  margin-bottom: 8px;
}

.test-param-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.test-param-name {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent);
  width: 80px;
  flex-shrink: 0;
}

.test-param-input {
  flex: 1;
  max-width: 180px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--r-xs);
  padding: 4px 8px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  outline: none;
  transition: border-color 0.12s;
}
.test-param-input:focus { border-color: var(--accent-line); }

#btn-test-run {
  margin: 8px 12px 10px;
  align-self: flex-start;
}

#mock-test-result {
  flex-direction: column;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  gap: 8px;
}

.test-result-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.test-status-badge {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.test-status-ok  { color: var(--accent); background: var(--accent-dim); }
.test-status-err { color: #fb7185;       background: rgba(251,113,133,.13); }

.test-ms {
  font-size: 0.7rem;
  color: var(--text-4);
  font-family: var(--font-mono);
}

.test-body {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--text-2);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 190px;
  overflow-y: auto;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 8px 10px;
}

</style>
<style>
/* ════ Favorites / Bookmarks Manager ════ */

:root {
  --fav-site:      #60a5fa;
  --fav-slack:     #c084fc;
  --fav-grid:      #34d399;
  --fav-dash:      #fb923c;
  --fav-github:    #e2e8f0;
  --fav-site-bg:   rgba(96,165,250,.1);
  --fav-slack-bg:  rgba(192,132,252,.1);
  --fav-grid-bg:   rgba(52,211,153,.1);
  --fav-dash-bg:   rgba(251,146,60,.1);
  --fav-github-bg: rgba(226,232,240,.08);
}

/* ── Layout ── */
#mode-favorites { flex-direction: row; }

/* ── Sidebar ── */
#fav-sidebar {
  width: 210px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 14px 0;
  gap: 4px;
}

.fav-sidebar-section { padding: 0 10px; }

.fav-sidebar-label {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--text-4);
  padding: 0 7px;
  margin-bottom: 4px;
}

.fav-cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: var(--r-sm);
  cursor: pointer;
  color: var(--text-2);
  font-size: 12.5px;
  transition: color .12s, background .12s;
  border: 1px solid transparent;
}

.fav-cat-item:hover { background: var(--surface-2); color: var(--text); }

.fav-cat-item.active {
  color: var(--accent);
  background: var(--accent-dim);
  border-color: var(--accent-line);
}

.fav-cat-left    { display: flex; align-items: center; gap: 7px; }
.fav-cat-icon    { font-size: 12px; opacity: .8; line-height: 1; }

.fav-cat-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-4);
}

.fav-cat-item.active .fav-cat-count { color: var(--accent); opacity: .7; }

.fav-sidebar-divider {
  height: 1px;
  background: var(--border);
  margin: 10px 10px;
}

/* Tag cloud */
.fav-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 10px;
}

.fav-tag {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--text-3);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-xs);
  padding: 2px 6px;
  cursor: pointer;
  transition: all .12s;
}

.fav-tag:hover, .fav-tag.active {
  color: var(--accent);
  border-color: var(--accent-line);
  background: var(--accent-dim);
}

/* ── Main area ── */
#fav-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Toolbar ── */
#fav-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}

#fav-search-wrap {
  position: relative;
  flex: 1;
}

#fav-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
  display: flex;
}

#fav-search {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 8px 34px 8px 34px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  outline: none;
  transition: border-color .15s, background .15s;
}

#fav-search::placeholder { color: var(--text-4); }

#fav-search:focus {
  border-color: var(--border-hi);
  background: var(--surface-3);
}

#fav-search-clear {
  position: absolute;
  right: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  cursor: pointer;
  display: none;
  padding: 2px;
  border-radius: 3px;
  transition: color .12s;
  line-height: 0;
}

#fav-search-clear:hover { color: var(--text); }
#fav-search-clear.visible { display: flex; }

#fav-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--accent);
  color: var(--on-accent);
  border: none;
  border-radius: var(--r-sm);
  padding: 8px 14px;
  font-family: var(--font-ui);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all .13s;
  white-space: nowrap;
}

#fav-add-btn:hover { background: var(--accent-2); transform: translateY(-1px); }

.fav-add-kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: .65;
  font-weight: 400;
}

/* ── Type tabs ── */
#fav-type-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 9px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.fav-type-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 20px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  transition: all .13s;
}

.fav-type-tab:hover { background: var(--surface-2); color: var(--text-2); }

.fav-type-tab.active {
  background: var(--surface-2);
  border-color: var(--border-hi);
  color: var(--text);
}

.fav-tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fav-tab-count {
  font-family: var(--font-mono);
  font-size: 10px;
  opacity: .55;
}

/* ── Scrollable content ── */
#fav-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 18px 18px 32px;
}

/* ── Most visited section ── */
#fav-most-visited { margin-bottom: 22px; }

.fav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.fav-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 600;
  font-family: var(--font-mono);
  letter-spacing: .07em;
  text-transform: uppercase;
  color: var(--text-3);
}

.fav-section-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-4);
}

.fav-featured-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 8px;
}

/* Featured card */
.fav-featured-card {
  position: relative;
  background: var(--surface-2);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  padding: 11px 13px 11px 16px;
  cursor: pointer;
  transition: all .18s;
  overflow: hidden;
}

.fav-featured-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
}

.fav-featured-card[data-type="site"]::before   { background: var(--fav-site); }
.fav-featured-card[data-type="slack"]::before  { background: var(--fav-slack); }
.fav-featured-card[data-type="grid"]::before   { background: var(--fav-grid); }
.fav-featured-card[data-type="dash"]::before   { background: var(--fav-dash); }
.fav-featured-card[data-type="github"]::before { background: var(--fav-github); }

.fav-featured-card:hover {
  border-color: var(--border-hi);
  transform: translateY(-2px);
  box-shadow: var(--sh-md);
}

.fav-featured-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-featured-url {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--text-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.fav-featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fav-access-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-4);
}

/* ── Main grid ── */
#fav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 9px;
  margin-top: 2px;
}

/* ── Bookmark card ── */
.fav-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 13px 14px 13px 17px;
  cursor: pointer;
  transition: all .18s;
  overflow: hidden;
  animation: favCardIn .22s ease both;
}

@keyframes favCardIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fav-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 1.5px 0 0 1.5px;
}

.fav-card[data-type="site"]::before   { background: var(--fav-site); }
.fav-card[data-type="slack"]::before  { background: var(--fav-slack); }
.fav-card[data-type="grid"]::before   { background: var(--fav-grid); }
.fav-card[data-type="dash"]::before   { background: var(--fav-dash); }
.fav-card[data-type="github"]::before { background: var(--fav-github); }

.fav-card:hover {
  border-color: var(--border-hi);
  background: var(--surface-2);
  transform: translateY(-2px);
  box-shadow: var(--sh-md);
}

.fav-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 7px;
}

.fav-type-badge {
  font-family: var(--font-mono);
  font-size: 8.5px;
  font-weight: 500;
  letter-spacing: .07em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: var(--r-xs);
  flex-shrink: 0;
}

.fav-card[data-type="site"]   .fav-type-badge { background: var(--fav-site-bg);   color: var(--fav-site);   }
.fav-card[data-type="slack"]  .fav-type-badge { background: var(--fav-slack-bg);  color: var(--fav-slack);  }
.fav-card[data-type="grid"]   .fav-type-badge { background: var(--fav-grid-bg);   color: var(--fav-grid);   }
.fav-card[data-type="dash"]   .fav-type-badge { background: var(--fav-dash-bg);   color: var(--fav-dash);   }
.fav-card[data-type="github"] .fav-type-badge { background: var(--fav-github-bg); color: var(--fav-github); }

/* featured card type badge */
.fav-featured-card[data-type="site"]   .fav-type-badge { background: var(--fav-site-bg);   color: var(--fav-site);   }
.fav-featured-card[data-type="slack"]  .fav-type-badge { background: var(--fav-slack-bg);  color: var(--fav-slack);  }
.fav-featured-card[data-type="grid"]   .fav-type-badge { background: var(--fav-grid-bg);   color: var(--fav-grid);   }
.fav-featured-card[data-type="dash"]   .fav-type-badge { background: var(--fav-dash-bg);   color: var(--fav-dash);   }
.fav-featured-card[data-type="github"] .fav-type-badge { background: var(--fav-github-bg); color: var(--fav-github); }

.fav-card-actions {
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity .12s;
  flex-shrink: 0;
}

.fav-card:hover .fav-card-actions { opacity: 1; }

.fav-action-btn {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--r-xs);
  background: var(--surface-3);
  border: 1px solid var(--border);
  color: var(--text-3);
  cursor: pointer;
  transition: all .12s;
  flex-shrink: 0;
}

.fav-action-btn:hover         { color: var(--text); border-color: var(--border-hi); }
.fav-action-btn.danger:hover  { color: #f87171; border-color: rgba(248,113,113,.3); background: rgba(248,113,113,.08); }

.fav-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
  margin-bottom: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fav-card-url {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--text-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.fav-card-note {
  font-size: 11.5px;
  color: var(--text-2);
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fav-card-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.fav-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  flex: 1;
}

.fav-card-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-4);
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 5px;
  cursor: pointer;
  transition: all .12s;
}

.fav-card-tag:hover { color: var(--accent); border-color: var(--accent-line); }

.fav-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.fav-card-cat  { font-size: 10.5px; color: var(--text-4); }
.fav-card-date { font-family: var(--font-mono); font-size: 9px; color: var(--text-4); }

/* ── Search highlight ── */
mark.fav-hl {
  background: rgba(55,217,154,.18);
  color: var(--accent);
  border-radius: 2px;
  padding: 0 1px;
}

/* ── Pagination ── */
#fav-pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 0 8px;
}

.fav-page-info {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-4);
  letter-spacing: .04em;
}

.fav-page-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fav-page-btn {
  min-width: 30px;
  height: 28px;
  padding: 0 8px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: all .12s;
}

.fav-page-btn:hover:not([disabled]) {
  background: var(--surface-3);
  color: var(--text);
  border-color: var(--border-hi);
}

.fav-page-btn.active {
  background: var(--accent-dim);
  border-color: var(--accent-line);
  color: var(--accent);
  font-weight: 600;
}

.fav-page-btn[disabled] {
  opacity: .3;
  cursor: default;
}

.fav-page-gap {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-4);
  padding: 0 2px;
}

/* ── Empty state ── */
#fav-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  gap: 10px;
  text-align: center;
}

.fav-empty-icon    { color: var(--text-4); margin-bottom: 4px; }
.fav-empty-title   { font-size: 15px; font-weight: 600; color: var(--text-2); }
.fav-empty-hint    { font-size: 12.5px; color: var(--text-3); max-width: 280px; line-height: 1.6; }

/* ════ Quick-Add Modal ════ */
#fav-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6,7,9,.78);
  backdrop-filter: blur(3px);
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding-top: 68px;
  z-index: 800;
}

#fav-modal-overlay.open { display: flex; }

#fav-modal {
  width: 510px;
  max-width: calc(100vw - 32px);
  background: var(--surface-2);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);
  animation: favModalIn .2s cubic-bezier(.34,1.56,.64,1);
  overflow: hidden;
}

@keyframes favModalIn {
  from { opacity: 0; transform: translateY(-14px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* URL field border transitions to detected type color */
#fav-modal[data-detected="site"]  #fav-modal-url { border-color: var(--fav-site);  }
#fav-modal[data-detected="slack"] #fav-modal-url { border-color: var(--fav-slack); }
#fav-modal[data-detected="grid"]  #fav-modal-url { border-color: var(--fav-grid);  }
#fav-modal[data-detected="dash"]  #fav-modal-url { border-color: var(--fav-dash);  }

.fav-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 17px 13px;
  border-bottom: 1px solid var(--border);
}

.fav-modal-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.fav-modal-close {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--r-sm);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: all .12s;
  line-height: 0;
}

.fav-modal-close:hover { background: var(--surface-3); border-color: var(--border); color: var(--text); }

.fav-modal-body {
  padding: 15px 17px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fav-field-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 5px;
}

.fav-field-input {
  width: 100%;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 8px 11px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  outline: none;
  transition: border-color .2s, background .15s;
}

.fav-field-input::placeholder { color: var(--text-4); }
.fav-field-input:focus { border-color: var(--border-hi); background: var(--surface-2); }

.fav-url-wrap { position: relative; }

#fav-modal-url { padding-right: 76px; transition: border-color .25s; }

.fav-url-detected {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--r-xs);
  opacity: 0;
  transition: opacity .2s;
  pointer-events: none;
}

.fav-url-detected.visible          { opacity: 1; }
.fav-url-detected.visible.site     { background: var(--fav-site-bg);  color: var(--fav-site);  }
.fav-url-detected.visible.slack    { background: var(--fav-slack-bg); color: var(--fav-slack); }
.fav-url-detected.visible.grid     { background: var(--fav-grid-bg);  color: var(--fav-grid);  }
.fav-url-detected.visible.dash     { background: var(--fav-dash-bg);  color: var(--fav-dash);  }

/* Type selector */
.fav-type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.fav-type-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 6px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--surface-3);
  color: var(--text-3);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all .13s;
}

.fav-type-btn:hover { color: var(--text-2); border-color: var(--border-mid); }

.fav-type-btn.active[data-t="site"]   { background: var(--fav-site-bg);   border-color: var(--fav-site);   color: var(--fav-site);   }
.fav-type-btn.active[data-t="slack"]  { background: var(--fav-slack-bg);  border-color: var(--fav-slack);  color: var(--fav-slack);  }
.fav-type-btn.active[data-t="grid"]   { background: var(--fav-grid-bg);   border-color: var(--fav-grid);   color: var(--fav-grid);   }
.fav-type-btn.active[data-t="dash"]   { background: var(--fav-dash-bg);   border-color: var(--fav-dash);   color: var(--fav-dash);   }
.fav-type-btn.active[data-t="github"] { background: var(--fav-github-bg); border-color: var(--fav-github); color: var(--fav-github); }

/* Category selector */
.fav-cat-sel {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.fav-cat-sel-btn {
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--surface-3);
  color: var(--text-3);
  font-family: var(--font-ui);
  font-size: 11.5px;
  cursor: pointer;
  transition: all .12s;
}

.fav-cat-sel-btn:hover { color: var(--text-2); border-color: var(--border-mid); }

.fav-cat-sel-btn.active {
  background: var(--accent-dim);
  border-color: var(--accent-line);
  color: var(--accent);
}

/* Tags input */
.fav-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 6px 9px;
  min-height: 36px;
  align-items: center;
  cursor: text;
  transition: border-color .15s;
}

.fav-tags-wrap:focus-within { border-color: var(--border-hi); }

.fav-tag-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--surface-4);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-xs);
  padding: 1px 6px;
  color: var(--text-2);
}

.fav-tag-chip-rm {
  cursor: pointer;
  color: var(--text-3);
  font-size: 11px;
  line-height: 1;
  transition: color .1s;
}

.fav-tag-chip-rm:hover { color: var(--text); }

.fav-tags-input {
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  min-width: 80px;
  flex: 1;
}

.fav-tags-input::placeholder { color: var(--text-4); }

.fav-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 17px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.fav-kbd-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-4);
}

.fav-kbd {
  background: var(--surface-3);
  border: 1px solid var(--border-hi);
  border-radius: 4px;
  padding: 1px 5px;
}

.fav-modal-btns { display: flex; gap: 7px; }

.fav-btn-cancel {
  padding: 7px 14px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-2);
  font-family: var(--font-ui);
  font-size: 12.5px;
  cursor: pointer;
  transition: all .13s;
}

.fav-btn-cancel:hover { background: var(--surface-2); color: var(--text); }

.fav-btn-save {
  padding: 7px 18px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  font-family: var(--font-ui);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all .13s;
}

.fav-btn-save:hover { background: var(--accent-2); transform: translateY(-1px); }

</style>
</head>
<body>

<!-- ════ Left rail — mode switcher ════ -->
<nav id="rail">
  <div id="rail-logo" title="docmap">◆</div>
  <button class="rail-btn active" id="rail-map" onclick="setMode('map')" title="Mapa">
    <span class="rail-ico" data-icon="map"></span><span class="rail-lbl">Mapa</span>
  </button>
  <button class="rail-btn" id="rail-notes" onclick="setMode('notes')" title="Notas">
    <span class="rail-ico" data-icon="notebook"></span><span class="rail-lbl">Notas</span>
  </button>
  <button class="rail-btn" id="rail-macros" onclick="setMode('macros')" title="Macros">
    <span class="rail-ico" data-icon="bot"></span><span class="rail-lbl">Macros</span>
  </button>
  <button class="rail-btn" id="rail-skills" onclick="setMode('skills')" title="Skills">
    <span class="rail-ico" data-icon="sparkles"></span><span class="rail-lbl">Skills</span>
  </button>
  <button class="rail-btn" id="rail-diagrams" onclick="setMode('diagrams')" title="Diagramas">
    <span class="rail-ico" data-icon="git-branch"></span><span class="rail-lbl">Diag</span>
  </button>
  <button class="rail-btn" id="rail-tasks" onclick="setMode('tasks')" title="Kanban">
    <span class="rail-ico" data-icon="kanban"></span><span class="rail-lbl">Tasks</span>
  </button>
  <button class="rail-btn" id="rail-mocks" onclick="setMode('mocks')" title="Mocks HTTP">
    <span class="rail-ico" data-icon="share"></span><span class="rail-lbl">Mocks</span>
  </button>
  <button class="rail-btn" id="rail-favorites" onclick="setMode('favorites')" title="Favoritos">
    <span class="rail-ico" data-icon="bookmark"></span><span class="rail-lbl">Favs</span>
  </button>
  <div class="rail-spacer"></div>
  <button class="rail-btn" id="rail-skill" onclick="copySkill()" title="Copiar skill da API para colar numa IA">
    <span class="rail-ico" data-icon="sparkles"></span><span class="rail-lbl">Skill</span>
  </button>
  <button class="rail-btn" id="rail-backup" onclick="downloadBackup()" title="Backup completo (notas, skills, diagramas, anotações)">
    <span class="rail-ico" data-icon="download"></span><span class="rail-lbl">Backup</span>
  </button>
  <button class="rail-btn" id="rail-restore" onclick="triggerRestore()" title="Restaurar de um backup">
    <span class="rail-ico" data-icon="upload"></span><span class="rail-lbl">Restore</span>
  </button>
</nav>

<!-- ════ Content ════ -->
<div id="stage">

  <!-- Update banner -->
  <div id="update-banner">
    <span id="update-text"></span>
    <button id="update-apply" onclick="applyUpdate()">Atualizar agora</button>
    <button id="update-dismiss" onclick="dismissUpdate()">Depois</button>
  </div>

  <!-- Topbar -->
  <header id="topbar">
    <div id="topbar-crumb">
      <span id="topbar-mode">Mapa</span>
      <span id="topbar-sep">/</span>
      <span id="topbar-path">nenhuma pasta</span>
    </div>
    <div id="topbar-actions">
    </div>
    <div id="search-wrap">
      <span id="search-icon" data-icon="search"></span>
      <input id="search-input" type="text" placeholder="Buscar nos documentos…" autocomplete="off" spellcheck="false"/>
      <div id="search-results"></div>
    </div>
    <button id="theme-toggle" title="Alternar tema"></button>
  </header>

  <!-- ═══ MODE: MAP ═══ -->
  <main id="mode-map" class="mode active">

    <!-- Tabs -->
    <div id="map-tabs">
      <button class="map-tab active" id="tab-graph" onclick="setMapTab('graph')"><span data-icon="share"></span> Documentos</button>
      <button id="map-open-btn" onclick="pickWorkspace()" title="Abrir pasta">
        <span data-icon="folder"></span> Pasta
      </button>
    </div>

    <div id="map-panes">

      <!-- Graph pane -->
      <section id="graph-pane" class="map-pane active">
        <div id="no-workspace">
          <div id="no-workspace-mark" data-icon="share"></div>
          <div id="no-workspace-title">Nenhum território carregado</div>
          <div id="no-workspace-hint">Selecione uma pasta para mapear seus documentos</div>
          <button id="no-workspace-btn" onclick="pickWorkspace()"><span data-icon="folder"></span> Abrir pasta</button>
        </div>
        <svg id="graph"></svg>
        <button class="map-tool fit-btn" title="Centralizar" onclick="fitGraph()" data-icon="fit"></button>

        <!-- Node metadata panel -->
        <div id="node-meta">
          <div id="node-meta-header">
            <span id="node-meta-name"></span>
            <button id="node-meta-close" onclick="clearNodeMeta()" title="Fechar" data-icon="x"></button>
          </div>
          <div id="node-meta-stats">
            <div class="node-meta-row">
              <span class="node-meta-label">Commits</span>
              <span class="node-meta-value" id="nm-commits">—</span>
            </div>
            <div class="node-meta-row">
              <span class="node-meta-label">Atualizado</span>
              <span class="node-meta-value" id="nm-date">—</span>
            </div>
          </div>
          <div id="nm-authors-section">
            <span class="node-meta-label">Autores</span>
            <div id="nm-authors-list"><span class="nm-placeholder">—</span></div>
          </div>
          <button id="nm-open-markmap" onclick="openMarkmap()">
            <span data-icon="tree"></span> Mapa Mental
          </button>
        </div>

        <div class="legend">
          <div class="legend-title">Legenda</div>
          <div class="legend-item"><i class="legend-dot" style="background:var(--cat-entry)"></i>Entrada</div>
          <div class="legend-item"><i class="legend-dot" style="background:var(--cat-arch)"></i>Arquitetura</div>
          <div class="legend-item"><i class="legend-dot" style="background:var(--cat-design)"></i>Design</div>
          <div class="legend-item"><i class="legend-dot" style="background:var(--cat-security)"></i>Segurança</div>
          <div class="legend-item"><i class="legend-dot" style="background:var(--cat-process)"></i>Processo</div>
        </div>
      </section>

      <!-- Markmap pane -->
      <section id="markmap-pane" class="map-pane">
        <div id="markmap-header">
          <button id="btn-back-graph" onclick="setMapTab('graph')"><span data-icon="arrow-left"></span> Documentos</button>
          <div id="markmap-titles">
            <span id="markmap-filename">Nenhum documento</span>
            <span id="markmap-filepath"></span>
          </div>
          <div id="markmap-actions">
            <button class="pill-btn" id="btn-annot" style="display:none" onclick="toggleAnnotations()">
              <span data-icon="highlighter"></span> Anotações <span class="pill-count" id="annot-count">0</span>
            </button>
            <button class="pill-btn" id="btn-copy-path" style="display:none" onclick="copyFilePath()"><span data-icon="copy"></span> Copiar caminho</button>
          </div>
        </div>

        <div id="markmap-container">
          <div id="map-empty">
            <div id="map-empty-mark" data-icon="tree"></div>
            <div id="map-empty-text">Clique duas vezes num nó do grafo para abrir seu mapa mental</div>
          </div>
          <div id="markmap-hint"></div>
          <div id="markmap-tools">
            <button class="map-tool mm-tool" data-icon="zoom-in" title="Aproximar" onclick="markmapZoom(1.25)"></button>
            <button class="map-tool mm-tool" data-icon="zoom-out" title="Afastar" onclick="markmapZoom(0.8)"></button>
            <button class="map-tool mm-tool" data-icon="fit" title="Centralizar / ajustar" onclick="markmapFit()"></button>
          </div>
        </div>

        <!-- Annotations drawer (contextual to current doc) -->
        <aside id="annot-panel">
          <div id="annot-head">
            <span id="annot-head-title">Anotações do documento</span>
            <button class="ghost-btn" id="annot-copy-all" onclick="copyAnnotationsForAI()" title="Copiar todas para colar numa IA">
              <span data-icon="sparkles"></span> Copiar p/ IA
            </button>
          </div>
          <div id="annot-list">
            <div id="annot-empty">Selecione um trecho do mapa e clique com o botão direito para anotar.</div>
          </div>
        </aside>
      </section>

    </div>

  </main>

  <!-- ═══ MODE: NOTES ═══ -->
  <main id="mode-notes" class="mode">
    <section id="notes-col">
      <div id="notes-col-head">
        <div id="notes-col-title">Notas</div>
        <button id="notes-new-btn" title="Nova nota" onclick="newNote()" data-icon="plus"></button>
      </div>
      <div id="notes-search-box">
        <input id="notes-search-input" type="text" placeholder="Buscar notas…" autocomplete="off" spellcheck="false"/>
      </div>
      <div id="notes-filters">
        <select id="notes-filter-cat" onchange="applyFilters()">
          <option value="">Todas as categorias</option>
        </select>
        <select id="notes-filter-tag" onchange="applyFilters()">
          <option value="">Todas as tags</option>
        </select>
      </div>
      <div id="notes-list"></div>
      <footer id="notes-footer">
        <div id="notes-ai-badge" title="Qualquer IA pode ler/criar notas neste endereço">
          <span class="ai-dot"></span> API da IA · <code>127.0.0.1:3334</code>
        </div>
      </footer>
      <input type="file" id="restore-file" accept="application/json" style="display:none" onchange="restoreBackup(event)"/>
    </section>

    <section id="notes-editor">
      <div id="notes-editor-empty">
        <div id="notes-editor-empty-mark" data-icon="pencil"></div>
        <div id="notes-editor-empty-text">Selecione ou crie uma nota</div>
      </div>

      <div id="notes-editor-form">
        <div id="note-head">
          <input id="note-title-input" type="text" placeholder="Título da nota…"/>
          <span id="note-id-badge" style="display:none" onclick="copyNoteId()" title="Clique para copiar o ID (use numa IA)"></span>
          <button class="note-head-btn" id="btn-note-markmap" style="display:none" onclick="toggleNoteMarkmap()" title="Ver como mapa mental"><span data-icon="tree"></span></button>
        </div>
        <div id="note-toolbar">
          <div id="note-cat-field">
            <span id="note-cat-dot" class="note-cat-dot"></span>
            <input id="note-cat-input" list="note-cat-list" placeholder="categoria" autocomplete="off"/>
            <datalist id="note-cat-list"></datalist>
          </div>
          <input id="note-tags-input" type="text" placeholder="tags, separadas, por vírgula"/>
          <button class="tool-btn" id="btn-preview" onclick="toggleNotePreview()"><span data-icon="eye"></span> Preview</button>
          <button class="tool-btn" id="btn-copy-note" style="display:none" onclick="copyNoteId()"><span data-icon="hash"></span> ID</button>
          <button class="tool-btn danger" id="btn-delete-note" style="display:none" onclick="deleteCurrentNote()"><span data-icon="trash"></span></button>
          <button class="tool-btn primary" onclick="saveCurrentNote()">Salvar</button>
        </div>
        <div id="note-body">
          <textarea id="note-content-textarea" placeholder="Escreva em markdown…"></textarea>
          <div id="note-preview"></div>
          <div id="note-markmap"></div>
        </div>
      </div>
    </section>
  </main>

  <!-- ═══ MODE: MACROS ═══ -->
  <main id="mode-macros" class="mode">

    <section id="macros-col">
      <div id="macros-col-head">
        <div id="macros-col-title">Macros</div>
        <button id="macros-new-btn" title="Nova macro" onclick="newMacro()" data-icon="plus"></button>
      </div>
      <div id="macros-list"></div>
    </section>

    <section id="macros-editor">
      <div id="macros-editor-empty">
        <div id="macros-editor-empty-mark" data-icon="bot"></div>
        <div id="macros-editor-empty-text">Selecione ou crie uma macro</div>
      </div>

      <div id="macros-editor-form">

        <div id="macro-head">
          <input id="macro-title-input" type="text" placeholder="Nome da macro…"/>
          <span id="macro-interp-badge" title="Interpretador detectado pelo shebang"></span>
          <div id="macro-head-actions">
            <button class="tool-btn" id="btn-macro-delete" style="display:none" onclick="deleteCurrentMacro()"><span data-icon="trash"></span></button>
            <button class="tool-btn primary" id="btn-macro-save" onclick="saveCurrentMacro()">Salvar</button>
            <button class="tool-btn macro-run-btn" id="btn-macro-run" onclick="runCurrentMacro()">
              <span data-icon="sparkles"></span> Executar
            </button>
          </div>
        </div>

        <div id="macro-desc-row">
          <input id="macro-desc-input" type="text" placeholder="Descrição curta…"/>
        </div>

        <div id="macro-body">
          <textarea id="macro-script" spellcheck="false" placeholder="#!/bin/bash&#10;# Seu script aqui&#10;# Variáveis disponíveis:&#10;#   $DOCMAP_API       → http://127.0.0.1:3334&#10;#   $DOCMAP_WORKSPACE → pasta aberta&#10;&#10;echo &quot;Olá do docmap!&quot;"></textarea>
        </div>

        <div id="macro-output-panel">
          <div id="macro-output-header">
            <span id="macro-output-title">Output</span>
            <span id="macro-status-badge"></span>
            <button class="ghost-btn" id="btn-macro-clear" onclick="clearOutput()" style="display:none">limpar</button>
            <button class="ghost-btn danger" id="btn-macro-stop" onclick="stopMacro()" style="display:none">⬛ Parar</button>
          </div>
          <pre id="macro-output"></pre>
        </div>

      </div>
    </section>

  </main>

  <!-- ═══ MODE: SKILLS ═══ -->
  <main id="mode-skills" class="mode">

    <section id="skills-col">
      <div id="skills-col-head">
        <div id="skills-col-title">Skills</div>
        <button id="skills-new-btn" title="Nova skill" onclick="newSkill()" data-icon="plus"></button>
      </div>
      <div id="skills-search-box">
        <input id="skills-search-input" type="text" placeholder="Buscar skills…" autocomplete="off" spellcheck="false"/>
      </div>
      <div id="skills-list"></div>
    </section>

    <section id="skills-editor">
      <div id="skills-editor-empty">
        <div id="skills-editor-empty-mark" data-icon="sparkles"></div>
        <div id="skills-editor-empty-text">Selecione ou crie uma skill</div>
      </div>

      <div id="skills-editor-form">
        <div id="skill-head">
          <input id="skill-title-input" type="text" placeholder="Título da skill…"/>
          <span id="skill-name-badge" title="Nome/slug (use numa IA: GET /skills/nome)"></span>
        </div>
        <div id="skill-toolbar">
          <div id="skill-name-field">
            <span id="skill-name-prefix">@</span>
            <input id="skill-name-input" type="text" placeholder="nome-da-skill" autocomplete="off" spellcheck="false"/>
          </div>
          <input id="skill-tags-input" type="text" placeholder="tags, separadas, por vírgula"/>
          <button class="tool-btn" id="btn-skill-preview" onclick="toggleSkillPreview()"><span data-icon="eye"></span> Preview</button>
          <button class="tool-btn" id="btn-skill-copy" style="display:none" onclick="copySkillRef()"><span data-icon="copy"></span> Ref</button>
          <button class="tool-btn danger" id="btn-skill-delete" style="display:none" onclick="deleteCurrentSkill()"><span data-icon="trash"></span></button>
          <button class="tool-btn primary" onclick="saveCurrentSkill()">Salvar</button>
        </div>
        <div id="skill-desc-row">
          <input id="skill-desc-input" type="text" placeholder="Descrição curta (aparece na listagem da IA)…"/>
        </div>
        <div id="skill-body">
          <textarea id="skill-content-textarea" placeholder="# Instruções&#10;&#10;Escreva em markdown. Use blocos de código para scripts:&#10;&#10;\`\`\`bash&#10;#!/bin/bash&#10;echo &quot;faça algo&quot;&#10;\`\`\`"></textarea>
          <div id="skill-preview"></div>
        </div>
      </div>
    </section>

  </main>

  <!-- ═══ MODE: DIAGRAMS ═══ -->
  <main id="mode-diagrams" class="mode">

    <section id="diag-col">
      <div id="diag-col-head">
        <div id="diag-col-title">Diagramas</div>
        <button id="diag-new-btn" title="Novo diagrama" onclick="newDiagram()" data-icon="plus"></button>
      </div>
      <div id="diag-list"></div>
    </section>

    <section id="diag-editor">
      <div id="diag-editor-empty">
        <div id="diag-editor-empty-mark" data-icon="waypoints"></div>
        <div id="diag-editor-empty-text">Selecione ou crie um diagrama</div>
      </div>

      <div id="diag-editor-form">
        <div id="diag-head">
          <input id="diag-title-input" type="text" placeholder="Título do diagrama…"/>
          <span id="diag-id-badge" style="display:none" title="Clique para copiar o deep link"></span>
          <div id="diag-head-actions">
            <button class="tool-btn" id="btn-diag-copy-link" style="display:none" onclick="copyDiagramLink()"><span data-icon="copy"></span> Link</button>
            <button class="tool-btn danger" id="btn-diag-delete" style="display:none" onclick="deleteCurrentDiagram()"><span data-icon="trash"></span></button>
            <button class="tool-btn primary" onclick="saveCurrentDiagram()">Salvar</button>
          </div>
        </div>

        <div id="diag-body">
          <div id="diag-preview-col">
            <div id="diag-zoom-bar">
              <button class="diag-zoom-btn" onclick="diagZoomOut()" title="Afastar" data-icon="zoom-out"></button>
              <span id="diag-zoom-label">100%</span>
              <button class="diag-zoom-btn" onclick="diagZoomIn()" title="Aproximar" data-icon="zoom-in"></button>
              <button class="diag-zoom-btn" onclick="diagZoomReset()" title="Resetar zoom" data-icon="maximize-2"></button>
            </div>
            <div id="diag-preview"></div>
          </div>
          <div id="diag-source-col">
            <div id="diag-source-header" onclick="toggleDiagSource()">
              <span>⌨ Código Mermaid</span>
              <span id="diag-source-toggle">▸</span>
              <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" id="diag-docs-link" onclick="event.stopPropagation()">docs ↗</a>
            </div>
            <textarea id="diag-source" placeholder="flowchart LR&#10;  A[Início] --> B{Decisão}&#10;  B -->|Sim| C[Resultado]&#10;  B -->|Não| D[Outro]" spellcheck="false"></textarea>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- ═══ MODE: MOCKS ═══ -->
  <main id="mode-mocks" class="mode">

    <section id="mocks-col">

      <div id="mocks-col-head">
        <span class="mocks-section-label">Collections</span>
        <button class="mocks-hd-btn" onclick="newCollection()" title="Nova collection" data-icon="plus"></button>
      </div>
      <div id="mocks-col-list"></div>

      <div id="mocks-list-head">
        <span id="mocks-list-heading">Todos os mocks</span>
        <button class="mocks-hd-btn" onclick="newMock()" title="Novo mock" data-icon="plus"></button>
      </div>
      <div id="mocks-list"></div>

      <footer id="mocks-col-footer">
        <div id="mocks-server-badge">
          <span class="mocks-server-pulse"></span>
          <span class="mocks-server-url">127.0.0.1:3335</span>
          <span id="mocks-server-count" data-count="0"></span>
        </div>
        <button id="mocks-clear-btn" onclick="clearMockDatabase()">
          <span data-icon="trash"></span>
          <span class="mocks-clear-label">Zerar tudo</span>
        </button>
      </footer>

    </section>

    <section id="mocks-editor">

      <div id="mocks-editor-empty">
        <div id="mocks-editor-empty-mark" data-icon="share"></div>
        <div id="mocks-editor-empty-text">Selecione ou crie um mock</div>
      </div>

      <div id="mocks-editor-form">

        <div id="mock-head">
          <span id="mock-id-badge" data-method="GET">— novo mock —</span>
          <div id="mock-head-actions">
            <button class="tool-btn danger" id="btn-mock-delete" style="display:none" onclick="deleteCurrentMock()">
              <span data-icon="trash"></span>
            </button>
            <button class="tool-btn" id="btn-mock-curl" onclick="copyCurl()" title="Copiar curl">
              <span data-icon="copy"></span> curl
            </button>
            <button class="tool-btn" id="btn-mock-test" onclick="showTestPanel()">
              <span data-icon="scan-line"></span> Testar
            </button>
            <button class="tool-btn primary" onclick="saveMock()">Salvar</button>
          </div>
        </div>

        <div id="mock-meta-row">
          <div class="mock-field">
            <label class="mock-label">Collection</label>
            <select id="mock-collection-select" class="mock-select"></select>
          </div>
          <div class="mock-field">
            <label class="mock-label">Método</label>
            <select id="mock-method-select" class="mock-select" data-method="GET" onchange="onMethodChange(this)">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
              <option>HEAD</option>
              <option>OPTIONS</option>
            </select>
          </div>
        </div>

        <div class="mock-field">
          <label class="mock-label">Path</label>
          <input id="mock-path-input" type="text" class="mock-input" placeholder="/users/:id" spellcheck="false" autocomplete="off"/>
        </div>

        <div id="mock-meta-row-2">
          <div class="mock-field">
            <label class="mock-label">Nome</label>
            <input id="mock-name-input" type="text" class="mock-input" placeholder="Get user by ID" autocomplete="off"/>
          </div>
          <div class="mock-field">
            <label class="mock-label">Grupo</label>
            <input id="mock-group-input" type="text" class="mock-input" placeholder="Authentication" autocomplete="off" list="mock-groups-list"/>
            <datalist id="mock-groups-list"></datalist>
          </div>
        </div>

        <div class="mock-field mock-field-script">
          <div id="mock-script-label-row">
            <label class="mock-label">Script JS</label>
            <span id="mock-script-hint">ctx · db · retorna <code>{ status?, headers?, body? }</code></span>
            <button class="ghost-btn" id="btn-format-script" onclick="formatScript()" title="Formatar código">
              <span data-icon="sparkles"></span> formatar
            </button>
          </div>
          <textarea id="mock-script-textarea" spellcheck="false"
            placeholder="// ctx: { method, path, params, query, headers, body }&#10;return {&#10;  status: 200,&#10;  body: { message: &quot;ok&quot; }&#10;};"></textarea>
        </div>

        <!-- Painel de teste -->
        <div id="mock-test-panel" style="display:none">
          <div class="test-panel-head">
            <span class="test-panel-title">Testar mock</span>
            <button class="ghost-btn" onclick="hideTestPanel()"><span data-icon="x"></span></button>
          </div>
          <div id="mock-test-params"></div>
          <button class="tool-btn" id="btn-test-run" onclick="runTest()">Executar</button>
          <div id="mock-test-result" style="display:none"></div>
        </div>

      </div>
    </section>

  </main>

  <!-- ═══ MODE: TASKS / KANBAN ═══ -->
  <main id="mode-tasks" class="mode">
    <div id="kanban-board">

      <div class="kanban-col" id="kanban-col-todo" data-status="todo">
        <div class="kanban-col-head">
          <span class="kanban-col-dot" data-col="todo"></span>
          <span class="kanban-col-title">A Fazer</span>
          <span class="kanban-col-count" id="kanban-count-todo">0</span>
          <button class="kanban-col-add" onclick="openNewTask('todo')" title="Adicionar task">
            <span data-icon="plus"></span>
          </button>
        </div>
        <div class="kanban-cards" id="kanban-cards-todo"></div>
      </div>

      <div class="kanban-col" id="kanban-col-in-progress" data-status="in-progress">
        <div class="kanban-col-head">
          <span class="kanban-col-dot" data-col="in-progress"></span>
          <span class="kanban-col-title">Em Andamento</span>
          <span class="kanban-col-count" id="kanban-count-in-progress">0</span>
          <button class="kanban-col-add" onclick="openNewTask('in-progress')" title="Adicionar task">
            <span data-icon="plus"></span>
          </button>
        </div>
        <div class="kanban-cards" id="kanban-cards-in-progress"></div>
      </div>

      <div class="kanban-col" id="kanban-col-done" data-status="done">
        <div class="kanban-col-head">
          <span class="kanban-col-dot" data-col="done"></span>
          <span class="kanban-col-title">Concluído</span>
          <span class="kanban-col-count" id="kanban-count-done">0</span>
          <button class="kanban-col-add" onclick="openNewTask('done')" title="Adicionar task">
            <span data-icon="plus"></span>
          </button>
        </div>
        <div class="kanban-cards" id="kanban-cards-done"></div>
      </div>

    </div>
  </main>

  <!-- ═══ MODE: FAVORITES ═══ -->
  <main id="mode-favorites" class="mode">

    <!-- Sidebar -->
    <aside id="fav-sidebar">
      <div class="fav-sidebar-section">
        <div class="fav-sidebar-label">Categorias</div>
        <div id="fav-cat-list"></div>
      </div>
      <div class="fav-sidebar-divider"></div>
      <div class="fav-sidebar-section">
        <div class="fav-sidebar-label">Tags</div>
        <div class="fav-tag-cloud" id="fav-tag-cloud"></div>
      </div>
    </aside>

    <!-- Main -->
    <div id="fav-main">

      <!-- Toolbar -->
      <div id="fav-toolbar">
        <div id="fav-search-wrap">
          <span id="fav-search-icon" data-icon="search"></span>
          <input id="fav-search" type="text" placeholder="Buscar por título, tag, categoria, URL…" autocomplete="off" spellcheck="false">
          <span id="fav-search-clear" data-icon="x"></span>
        </div>
        <button id="fav-add-btn">
          <span data-icon="plus"></span>
          Adicionar
          <span class="fav-add-kbd">⌘K</span>
        </button>
      </div>

      <!-- Type tabs -->
      <div id="fav-type-tabs">
        <div class="fav-type-tab active" data-type="all">Todos <span class="fav-tab-count" id="fav-count-all">0</span></div>
        <div class="fav-type-tab" data-type="site">
          <span class="fav-tab-dot" style="background:var(--fav-site)"></span>
          Sites <span class="fav-tab-count" id="fav-count-site">0</span>
        </div>
        <div class="fav-type-tab" data-type="slack">
          <span class="fav-tab-dot" style="background:var(--fav-slack)"></span>
          Slack <span class="fav-tab-count" id="fav-count-slack">0</span>
        </div>
        <div class="fav-type-tab" data-type="grid">
          <span class="fav-tab-dot" style="background:var(--fav-grid)"></span>
          Grid <span class="fav-tab-count" id="fav-count-grid">0</span>
        </div>
        <div class="fav-type-tab" data-type="dash">
          <span class="fav-tab-dot" style="background:var(--fav-dash)"></span>
          Dashboards <span class="fav-tab-count" id="fav-count-dash">0</span>
        </div>
        <div class="fav-type-tab" data-type="github">
          <span class="fav-tab-dot" style="background:var(--fav-github)"></span>
          GitHub <span class="fav-tab-count" id="fav-count-github">0</span>
        </div>
      </div>

      <!-- Scrollable content -->
      <div id="fav-scroll">

        <!-- Most visited -->
        <div id="fav-most-visited" style="display:none">
          <div class="fav-section-header">
            <span class="fav-section-title">⚡ Mais visitados</span>
          </div>
          <div class="fav-featured-row" id="fav-featured-row"></div>
        </div>

        <!-- Grid header -->
        <div class="fav-section-header">
          <span class="fav-section-title">◈ Links</span>
          <span class="fav-section-count" id="fav-result-count">0 links</span>
        </div>

        <!-- Grid -->
        <div id="fav-grid"></div>

        <!-- Pagination -->
        <div id="fav-pagination"></div>

        <!-- Empty -->
        <div id="fav-empty" style="display:none">
          <span class="fav-empty-icon" data-icon="bookmark"></span>
          <div class="fav-empty-title">Nenhum favorito encontrado</div>
          <div class="fav-empty-hint">Tente buscar por outro termo ou adicione um novo link com ⌘K</div>
        </div>

      </div>
    </div>
  </main>

</div>

<!-- Quick-Add / Edit Modal -->
<div id="fav-modal-overlay">
  <div id="fav-modal">
    <div class="fav-modal-header">
      <span class="fav-modal-title"><span id="fav-modal-title-text">⚡ Novo Favorito</span></span>
      <button class="fav-modal-close" id="fav-modal-close" data-icon="x"></button>
    </div>
    <div class="fav-modal-body">
      <div>
        <div class="fav-field-label">URL</div>
        <div class="fav-url-wrap">
          <input class="fav-field-input" id="fav-modal-url" placeholder="cole ou digite a URL…" autocomplete="off" spellcheck="false">
          <span class="fav-url-detected" id="fav-url-detected"></span>
        </div>
      </div>
      <div>
        <div class="fav-field-label">Título</div>
        <input class="fav-field-input" id="fav-modal-title" placeholder="Nome do link…">
      </div>
      <div>
        <div class="fav-field-label">Tipo</div>
        <div class="fav-type-selector">
          <button class="fav-type-btn active" data-t="site">🌐 Site</button>
          <button class="fav-type-btn" data-t="slack">💬 Slack</button>
          <button class="fav-type-btn" data-t="grid">📁 Grid</button>
          <button class="fav-type-btn" data-t="dash">📊 Dash</button>
          <button class="fav-type-btn" data-t="github">🐙 GitHub</button>
        </div>
      </div>
      <div>
        <div class="fav-field-label">Categoria</div>
        <div class="fav-cat-sel" id="fav-cat-sel"></div>
      </div>
      <div>
        <div class="fav-field-label">Tags — <span style="font-style:italic;text-transform:none;letter-spacing:0;font-family:var(--font-ui)">Enter para adicionar</span></div>
        <div class="fav-tags-wrap" id="fav-modal-tags-wrap">
          <input class="fav-tags-input" id="fav-modal-tags-input" placeholder="#api, #design…">
        </div>
      </div>
      <div>
        <div class="fav-field-label">Nota (opcional)</div>
        <input class="fav-field-input" id="fav-modal-note" placeholder="Para que serve esse link…">
      </div>
    </div>
    <div class="fav-modal-footer">
      <div class="fav-kbd-hint">
        <kbd class="fav-kbd">Enter</kbd> salva · <kbd class="fav-kbd">Esc</kbd> fecha
      </div>
      <div class="fav-modal-btns">
        <button class="fav-btn-cancel" id="fav-modal-cancel">Cancelar</button>
        <button class="fav-btn-save" id="fav-modal-save">Salvar</button>
      </div>
    </div>
  </div>
</div>

<!-- ════ Task Modal ════ -->
<div id="task-modal-overlay" onclick="closeTaskModalOnOverlay(event)">
  <div id="task-modal">
    <div id="task-modal-head">
      <input id="task-title-input" type="text" placeholder="Título da task…" autocomplete="off"/>
      <select id="task-status-select">
        <option value="todo">A Fazer</option>
        <option value="in-progress">Em Andamento</option>
        <option value="done">Concluído</option>
      </select>
      <button class="kanban-modal-close" id="task-modal-close" onclick="closeTaskModal()" title="Fechar">
        <span data-icon="x"></span>
      </button>
    </div>
    <div id="task-modal-body">
      <div class="task-field">
        <label class="task-label">Descrição (markdown)</label>
        <textarea id="task-desc-textarea" placeholder="Detalhes, contexto, links…" rows="5"></textarea>
      </div>
      <div class="task-meta-row">
        <div class="task-field">
          <label class="task-label">Data limite</label>
          <input id="task-due-input" type="date"/>
        </div>
        <div class="task-field" style="position:relative">
          <label class="task-label">Nota vinculada</label>
          <div id="task-note-wrap">
            <input id="task-note-input" type="text" placeholder="Buscar nota…" autocomplete="off" oninput="filterNoteSearch()" onfocus="filterNoteSearch()"/>
            <button id="task-note-clear" onclick="clearNoteLink()" title="Remover nota" style="display:none">
              <span data-icon="x"></span>
            </button>
          </div>
          <div id="task-note-dropdown"></div>
          <input type="hidden" id="task-note-id"/>
        </div>
      </div>
    </div>
    <div id="task-modal-footer">
      <button class="tool-btn danger" id="task-delete-btn" style="display:none" onclick="deleteCurrentTask()">
        <span data-icon="trash"></span>
      </button>
      <div class="task-footer-spacer"></div>
      <button class="tool-btn" onclick="closeTaskModal()">Cancelar</button>
      <button class="tool-btn primary" onclick="saveCurrentTask()">Salvar</button>
    </div>
  </div>
</div>

<!-- Annotation popover -->
<div id="annot-popover">
  <div id="pop-head">
    <span id="pop-label">TRECHO</span>
    <span id="pop-quote"></span>
  </div>
  <div id="pop-types">
    <button class="type-btn active" data-type="note"     onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-note)"></i> Nota</button>
    <button class="type-btn"        data-type="decision" onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-decision)"></i> Decisão</button>
    <button class="type-btn"        data-type="question" onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-question)"></i> Dúvida</button>
    <button class="type-btn"        data-type="todo"     onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-todo)"></i> TODO</button>
    <button class="type-btn"        data-type="warning"  onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-warning)"></i> Atenção</button>
  </div>
  <div id="pop-body"><textarea id="pop-textarea" placeholder="Escreva a anotação…"></textarea></div>
  <div id="pop-foot">
    <button class="pop-btn" id="pop-delete" onclick="deleteAnnotation()">Excluir</button>
    <button class="pop-btn" id="pop-cancel" onclick="closeAnnotPopover()">Cancelar</button>
    <button class="pop-btn primary" id="pop-save" onclick="saveAnnotation()">Salvar</button>
  </div>
</div>

<!-- Confirm modal (webview não suporta window.confirm) -->
<div id="modal-overlay">
  <div id="modal">
    <div id="modal-msg"></div>
    <div id="modal-actions">
      <button id="modal-cancel" class="pop-btn">Cancelar</button>
      <button id="modal-ok" class="pop-btn primary">Confirmar</button>
    </div>
  </div>
</div>

<!-- ════ AI Chat FAB ════ -->
<button id="chat-fab" onclick="toggleChat()" title="Chat com IA">
  <span data-icon="bot"></span>
</button>

<div id="chat-panel">
  <div id="chat-header">
    <span id="chat-title">
      <span data-icon="bot"></span>
      <select id="chat-provider" title="Provedor de IA">
        <option value="ollama">Ollama (local)</option>
        <option value="deepseek">DeepSeek</option>
      </select>
    </span>
    <div id="chat-header-actions">
      <button class="ghost-btn" id="chat-minimize" onclick="toggleMinimizeChat()" title="Minimizar">
        <span data-icon="minus" id="chat-minimize-icon"></span>
      </button>
      <button class="ghost-btn" onclick="clearChat()">limpar</button>
      <button class="ghost-btn" onclick="toggleChat()"><span data-icon="x"></span></button>
    </div>
  </div>
  <div id="chat-feed"></div>
  <div id="chat-composer">
    <button id="chat-stop" onclick="stopChat()" style="display:none"><span data-icon="x"></span> Parar</button>
    <textarea id="chat-input" placeholder="Pergunte qualquer coisa… " rows="1"></textarea>
    <button id="chat-send" onclick="sendChatMessage()" data-icon="sparkles"></button>
  </div>
</div>

<div id="tooltip"></div>
<div id="toast"></div>

<script>
// ════ Ícones SVG (estilo Lucide, stroke currentColor) ════
// Uso estático: <span data-icon="map"></span>  → hidratado no load.
// Uso dinâmico: ICON('map')  → retorna o markup SVG.

const ICON_PATHS = {
  waypoints: '<circle cx="12" cy="4.5" r="2.5"/><path d="m10.2 6.3-3.9 3.9"/><circle cx="4.5" cy="12" r="2.5"/><path d="M7 12h10"/><circle cx="19.5" cy="12" r="2.5"/><path d="m13.8 17.7 3.9-3.9"/><circle cx="12" cy="19.5" r="2.5"/>',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  notebook: '<path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/>',
  folder: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  tree: '<path d="M21 12h-8"/><path d="M21 6H8"/><path d="M21 18h-8"/><path d="M3 6v4c0 1.1.9 2 2 2h3"/><path d="M3 10v6c0 1.1.9 2 2 2h3"/>',
  highlighter: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  'zoom-in': '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',
  'zoom-out': '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>',
  'git-branch': '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  robot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  kanban: '<rect width="5" height="6" x="3" y="15" rx="1"/><rect width="5" height="9" x="9" y="12" rx="1"/><rect width="5" height="14" x="15" y="7" rx="1"/><path d="M3 4h5"/><path d="M9 4h5"/><path d="M15 4h5"/>',
  minus: '<path d="M5 12h14"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  'scan-line': '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="4" x2="20" y1="12" y2="12"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
};

const ICON = (name, cls = '') =>
  \`<svg class="ico \${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\${ICON_PATHS[name] || ''}</svg>\`;

const hydrateIcons = (root = document) => {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (el.dataset.hydrated) return;
    el.innerHTML = ICON(el.dataset.icon);
    el.dataset.hydrated = '1';
  });
};

document.addEventListener('DOMContentLoaded', () => hydrateIcons());

</script>
<script>
// ════ DOM helpers (puros) ════

const $ = (id) => document.getElementById(id);

const escHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const highlightQuery = (text, q) => {
  if (!q) return escHtml(text);
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return escHtml(text);
  return escHtml(text.slice(0, idx)) +
    '<mark>' + escHtml(text.slice(idx, idx + q.length)) + '</mark>' +
    escHtml(text.slice(idx + q.length));
};

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

// Cores fixas dos TIPOS de anotação do markmap (conjunto fechado).
const CAT_COLOR = {
  note:     'var(--type-note)',
  decision: 'var(--type-decision)',
  question: 'var(--type-question)',
  todo:     'var(--type-todo)',
  warning:  'var(--type-warning)',
};

// Cor determinística para CATEGORIAS de nota (texto livre): mesma string → mesma cor.
const catColor = (name) => {
  const s = (name || 'general').toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return \`hsl(\${h} 62% 62%)\`;
};

// ── Toast ──
let toastTimer = null;
const toast = (msg) => {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
};

const copyToClipboard = (text, okMsg) =>
  navigator.clipboard.writeText(text).then(() => toast(okMsg || 'Copiado')).catch(() => toast('Falha ao copiar'));

// ── Confirmação (substitui window.confirm, que o webview não implementa) ──
const confirmDialog = (message, opts = {}) =>
  new Promise((resolve) => {
    const overlay = $('modal-overlay');
    const ok = $('modal-ok');
    const cancel = $('modal-cancel');
    $('modal-msg').textContent = message;
    ok.textContent = opts.okLabel || 'Confirmar';
    ok.classList.toggle('danger', !!opts.danger);
    overlay.classList.add('visible');

    const onKey = (e) => {
      if (e.key === 'Escape') finish(false);
      if (e.key === 'Enter') finish(true);
    };
    const finish = (val) => {
      overlay.classList.remove('visible');
      ok.onclick = cancel.onclick = overlay.onclick = null;
      document.removeEventListener('keydown', onKey, true);
      resolve(val);
    };
    ok.onclick = () => finish(true);
    cancel.onclick = () => finish(false);
    overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
    document.addEventListener('keydown', onKey, true);
  });

</script>
<script>
// ════ Theme toggle (dark/light) — persiste em localStorage ════

const THEME_KEY = 'docmap-theme';
const THEMES = ['dark', 'light'];

const getStoredTheme = () => {
  const t = localStorage.getItem(THEME_KEY);
  return THEMES.includes(t) ? t : 'dark';
};

const iconFor = (theme) => (theme === 'dark' ? 'moon' : 'sun');

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') delete root.dataset.theme;
  else root.dataset.theme = theme;
  const btn = $('theme-toggle');
  if (btn) {
    btn.innerHTML = ICON(iconFor(theme));
    btn.title = theme === 'dark' ? 'Mudar para claro' : 'Mudar para escuro';
  }
};

const toggleTheme = () => {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* quota */ }
  applyTheme(next);
};

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getStoredTheme());
  const btn = $('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});

</script>
<script>
// ════ App shell — alternância de modos e atalhos globais ════

let currentMode = 'map';

const MODE_LABEL = { map: 'Mapa', notes: 'Notas', macros: 'Macros', skills: 'Skills', diagrams: 'Diagramas', tasks: 'Kanban', mocks: 'Mocks', favorites: 'Favoritos' };

const setMode = (mode) => {
  currentMode = mode;

  document.querySelectorAll('.mode').forEach((m) => m.classList.remove('active'));
  $('mode-' + mode).classList.add('active');

  document.querySelectorAll('.rail-btn').forEach((b) => b.classList.remove('active'));
  $('rail-' + mode)?.classList.add('active');

  $('topbar-mode').textContent = MODE_LABEL[mode];

  // Search placeholder muda conforme o modo
  const search = $('search-input');
  if (mode === 'notes') {
    search.placeholder = 'Buscar notas…';
  } else {
    search.placeholder = 'Buscar nos documentos…';
  }

  if (mode === 'macros')        loadMacrosList();
  else if (mode === 'notes')    loadNotesList();
  else if (mode === 'skills')   loadSkillsList();
  else if (mode === 'diagrams') loadDiagramsList();
  else if (mode === 'tasks')    loadTasks();
  else if (mode === 'mocks')     loadMocksData();
  else if (mode === 'favorites') loadFavoritesData();
  else if (sim) requestAnimationFrame(fitGraph);
};

// ── Tabs dentro do modo Mapa ──
let currentMapTab = 'graph';

const setMapTab = (tab) => {
  currentMapTab = tab;
  document.querySelectorAll('.map-pane').forEach((p) => p.classList.remove('active'));
  $(tab === 'graph' ? 'graph-pane' : 'markmap-pane').classList.add('active');

  // O grafo precisa recentralizar quando sua aba fica visível (offsetWidth muda).
  if (tab === 'graph' && sim) requestAnimationFrame(fitGraph);
};

// ── Global keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $('annot-popover')?.classList.remove('visible');
    $('search-results')?.classList.remove('visible');
    $('search-input')?.blur();
  }
  if (e.ctrlKey && e.key === 'Enter' && $('annot-popover')?.classList.contains('visible')) {
    saveAnnotation();
  }
  // Alternar modos: Cmd/Ctrl + 1 / 2
  if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); setMode('map'); }
  if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); setMode('notes'); }
});

</script>
<script>
// ════ Workspace — seleção de pasta ════

let currentWorkspace = null;

const setNoWorkspace = (on) => {
  $('no-workspace').classList.toggle('visible', on);
  $('graph').style.opacity = on ? '0' : '1';
  $('topbar-path').textContent = on ? 'nenhuma pasta' : (currentWorkspace?.name + '/');
};

const applyWorkspace = (data) => {
  currentWorkspace = data;
  setNoWorkspace(false);
  loadGraph();
  if (currentMode === 'notes') loadNotesList();
};

const pickWorkspace = async () => {
  try {
    const res = await fetch('/workspace/pick', { method: 'POST' });
    const data = await res.json();
    if (data.cancelled) return;
    applyWorkspace(data);
    toast('Pasta carregada: ' + data.name);
  } catch (err) {
    console.error('Erro ao selecionar pasta:', err);
    toast('Erro ao abrir pasta');
  }
};

const initWorkspace = async () => {
  try {
    const res = await fetch('/workspace');
    const data = await res.json();
    if (data.root) applyWorkspace(data);
    else setNoWorkspace(true);
  } catch {
    setNoWorkspace(true);
  }
};

// ── Deep link: #diagram/:id ──
const handleDeepLink = () => {
  const hash = window.location.hash;
  const match = hash.match(/^#diagram\\/([a-f0-9-]{36})$/);
  if (match) {
    setMode('diagrams');
    openDiagram(match[1]);
    history.replaceState(null, '', '/'); // limpa o hash depois de navegar
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initWorkspace();
  handleDeepLink();
});

</script>
<script>
// ════ Force graph (D3) ════

let sim = null;
let zoomBehavior = null;
let graphG = null;
let graphLinkSel = null;
let graphNodeSel = null;
let graphLinks = [];
let _selectedNodeId = null;
let _userHasInteracted = false;

const NODE_COLOR = {
  entry:    getCss('--cat-entry'),
  arch:     getCss('--cat-arch'),
  design:   getCss('--cat-design'),
  security: getCss('--cat-security'),
  process:  getCss('--cat-process'),
  default:  getCss('--cat-default'),
};

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#999';
}

const loadGraph = async () => {
  try {
    const res  = await fetch('/graph');
    const data = await res.json();
    renderGraph(data);
  } catch (err) {
    console.error('Erro ao carregar grafo:', err);
    toast('Erro ao carregar grafo');
  }
};

const renderGraph = (data) => {
  const svg = d3.select('#graph');
  svg.selectAll('*').remove();

  const panel = $('graph-pane');
  const W = panel.offsetWidth;
  const H = panel.offsetHeight;

  graphG = svg.append('g');
  zoomBehavior = d3.zoom().scaleExtent([0.15, 5]).on('zoom', (e) => graphG.attr('transform', e.transform));
  svg.call(zoomBehavior);
  svg.on('dblclick.zoom', null); // libera o duplo-clique para abrir o nó

  // clone links so d3 mutation doesn't corrupt the source data
  graphLinks = data.links.map((l) => ({ ...l }));
  _userHasInteracted = false;

  sim = d3.forceSimulation(data.nodes)
    .force('link',      d3.forceLink(graphLinks).id((d) => d.id).distance(130))
    .force('charge',    d3.forceManyBody().strength(-400))
    .force('center',    d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(46));

  graphLinkSel = graphG.append('g').attr('class', 'links')
    .selectAll('line')
    .data(graphLinks)
    .join('line')
    .attr('class', 'link');

  graphNodeSel = graphG.append('g').attr('class', 'nodes')
    .selectAll('g')
    .data(data.nodes)
    .join('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', (e, d) => { _userHasInteracted = true; if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
    .on('click',     (e, d) => selectNode(d.id))
    .on('dblclick',  (e, d) => { e.stopPropagation(); selectNode(d.id); loadFile(d.id); })
    .on('mouseover', (e, d) => showNodeTooltip(e, d))
    .on('mousemove', (e)    => moveTooltip(e))
    .on('mouseout',  ()     => hideTooltip());

  // halo
  graphNodeSel.append('circle')
    .attr('r', (d) => (d.group === 'entry' ? 17 : 11) + 7)
    .attr('fill', (d) => (NODE_COLOR[d.group] || NODE_COLOR.default) + '22')
    .attr('stroke', 'none');

  // core
  graphNodeSel.append('circle')
    .attr('class', 'node-core')
    .attr('r', (d) => d.group === 'entry' ? 17 : 11)
    .attr('fill', (d) => NODE_COLOR[d.group] || NODE_COLOR.default)
    .attr('stroke', (d) => NODE_COLOR[d.group] || NODE_COLOR.default)
    .attr('stroke-opacity', .35)
    .style('transform-origin', 'center')
    .style('transform-box', 'fill-box');

  graphNodeSel.append('text')
    .attr('dy', (d) => (d.group === 'entry' ? 17 : 11) + 15)
    .attr('text-anchor', 'middle')
    .text((d) => d.label);

  sim.on('tick', () => {
    graphLinkSel
      .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
    graphNodeSel.attr('transform', (d) => \`translate(\${d.x},\${d.y})\`);
  });

  // Only auto-fit on initial layout — after user drags a node, respect their viewport
  sim.on('end', () => { if (!_userHasInteracted) requestAnimationFrame(fitGraph); });
};

// ── Selection + neighbor highlight ──
const selectNode = (id) => {
  const neighbors = new Set([id]);
  graphLinks.forEach((l) => {
    const s = l.source.id || l.source;
    const t = l.target.id || l.target;
    if (s === id) neighbors.add(t);
    if (t === id) neighbors.add(s);
  });

  graphNodeSel?.classed('selected', (d) => d.id === id)
    .classed('dimmed', (d) => !neighbors.has(d.id));

  graphLinkSel?.classed('highlighted', (l) =>
    (l.source.id || l.source) === id || (l.target.id || l.target) === id);

  showNodeMeta(id);
};

const showNodeMeta = async (id) => {
  _selectedNodeId = id;
  const label = id.split('/').pop().replace('.md', '');
  $('node-meta-name').textContent = label;
  $('nm-commits').textContent = '…';
  $('nm-date').textContent = '…';
  $('nm-authors-list').innerHTML = '<span class="nm-placeholder">…</span>';
  $('node-meta').classList.add('visible');

  try {
    const res = await fetch('/git/filemeta?file=' + encodeURIComponent(id));
    const data = await res.json();
    $('nm-commits').textContent = data.commitCount > 0 ? String(data.commitCount) : '—';
    $('nm-date').textContent = data.lastDate
      ? new Date(data.lastDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    if (data.authors && data.authors.length > 0) {
      $('nm-authors-list').innerHTML = data.authors.map((a) =>
        \`<div class="nm-author-row"><span class="nm-author-name">\${escHtml(a.name)}</span><span class="nm-author-count">\${a.commits}</span></div>\`
      ).join('');
    } else {
      $('nm-authors-list').innerHTML = '<span class="nm-placeholder">—</span>';
    }
  } catch {
    $('nm-commits').textContent = '—';
    $('nm-date').textContent = '—';
    $('nm-authors-list').innerHTML = '<span class="nm-placeholder">—</span>';
  }
};

const clearNodeMeta = () => {
  _selectedNodeId = null;
  $('node-meta').classList.remove('visible');
  graphNodeSel?.classed('selected', false).classed('dimmed', false);
  graphLinkSel?.classed('highlighted', false);
};

const openMarkmap = () => {
  if (_selectedNodeId) loadFile(_selectedNodeId);
};

const fitGraph = () => {
  if (!graphG || !zoomBehavior) return;
  const panel = $('graph-pane');
  const bounds = graphG.node().getBBox();
  if (!bounds.width || !bounds.height) return;
  const W = panel.offsetWidth, H = panel.offsetHeight;
  const scale = Math.min(W / bounds.width, H / bounds.height) * 0.82;
  const tx = (W - bounds.width * scale) / 2 - bounds.x * scale;
  const ty = (H - bounds.height * scale) / 2 - bounds.y * scale;
  d3.select('#graph').transition().duration(450)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
};

// ── Tooltip ──
const showNodeTooltip = (e, d) => {
  const inc = graphLinks.filter((l) => (l.target.id || l.target) === d.id).length;
  const out = graphLinks.filter((l) => (l.source.id || l.source) === d.id).length;
  const el = $('tooltip');
  el.innerHTML = \`\${escHtml(d.label)} · ←\${inc} →\${out} · <span style="opacity:.6">duplo-clique p/ abrir</span>\`;
  el.style.opacity = '1';
  moveTooltip(e);
};
const moveTooltip = (e) => {
  const el = $('tooltip');
  el.style.left = (e.clientX + 14) + 'px';
  el.style.top  = (e.clientY - 8)  + 'px';
};
const hideTooltip = () => { $('tooltip').style.opacity = '0'; };

</script>
<script>
// ════ Markmap — renderiza o documento selecionado ════

let currentFile = null;
let contextMenuBound = false;

const loadFile = async (fileId) => {
  currentFile = fileId;

  const label = fileId.split('/').pop().replace('.md', '');
  $('markmap-filename').textContent = label;
  $('markmap-filepath').textContent = fileId;
  $('btn-copy-path').style.display = 'flex';
  $('btn-annot').style.display = 'flex';
  $('markmap-tools').classList.add('visible');
  $('map-empty')?.remove();

  // Abre a aba do mapa mental automaticamente
  setMapTab('markmap');

  try {
    const res  = await fetch('/content?file=' + encodeURIComponent(fileId));
    const data = await res.json();
    renderMarkmap(data.raw);
    loadAnnotations(fileId);
  } catch (err) {
    console.error('Erro ao carregar arquivo:', err);
    toast('Erro ao carregar documento');
  }
};

const renderMarkmap = (markdown, tries = 0) => {
  const mk = window.markmap;
  // Espera markmap-view (Markmap) e markmap-lib (Transformer) carregarem.
  if (!mk?.Markmap || !mk?.Transformer) {
    if (tries < 40) return void setTimeout(() => renderMarkmap(markdown, tries + 1), 150);
    return toast('markmap não carregou (sem internet?)');
  }

  const container = $('markmap-container');
  container.querySelectorAll('svg.markmap-svg').forEach((el) => el.remove());

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('markmap-svg');
  svg.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(svg);

  const { root } = new mk.Transformer().transform(markdown);
  if (window._markmap) { try { window._markmap.destroy(); } catch { /* noop */ } }
  // autoFit: false — evita zoom automático ao colapsar/expandir nós
  window._markmap = mk.Markmap.create(svg, { autoFit: false }, root);

  setTimeout(() => {
    bindContextMenu();
    showMarkmapHint();
    window._markmap?.fit?.();
  }, 300);
};

// Bind uma única vez no container; a seleção de texto é lida no momento do clique.
const bindContextMenu = () => {
  if (contextMenuBound) return;
  contextMenuBound = true;
  $('markmap-container').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const sel = window.getSelection()?.toString().trim();
    if (!sel) { showMarkmapHint('Selecione um trecho do mapa primeiro'); return; }
    openAnnotPopover(sel, e.clientX, e.clientY);
  });
};

let hintTimer = null;
const showMarkmapHint = (msg) => {
  const hint = $('markmap-hint');
  hint.textContent = msg || 'Selecione um trecho e clique com o botão direito para anotar';
  hint.classList.add('visible');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.classList.remove('visible'), 3000);
};

// ── Controles de zoom / foco do markmap ──
// Usa a API do markmap-view; cai no d3-zoom da instância se rescale faltar.
const markmapZoom = (factor) => {
  const mm = window._markmap;
  if (!mm) return;
  if (typeof mm.rescale === 'function') mm.rescale(factor);
  else if (mm.svg && mm.zoom) mm.svg.transition().duration(200).call(mm.zoom.scaleBy, factor);
};

const markmapFit = () => { window._markmap?.fit?.(); };

// Copia o caminho ABSOLUTO no disco (a IA usa isso para abrir o arquivo).
const copyFilePath = () => {
  const root = currentWorkspace?.root;
  const abs = root ? \`\${root}/\${currentFile}\` : currentFile;
  copyToClipboard(abs, 'Caminho absoluto copiado');
};

</script>
<script>
// ════ Busca (topbar) — docs no modo Mapa, notas no modo Notas ════

const searchInput   = $('search-input');
const searchResults = $('search-results');
let lastQuery = '';

const doSearch = debounce(async (q) => {
  lastQuery = q;
  if (!q) { searchResults.classList.remove('visible'); return; }
  if (currentMode === 'notes') return searchNotesTopbar(q);
  return searchDocsTopbar(q);
}, 260);

const searchDocsTopbar = async (q) => {
  try {
    const res = await fetch('/search?q=' + encodeURIComponent(q));
    renderSearchResults(await res.json(), q);
  } catch (err) { console.error('Erro na busca:', err); }
};

const renderSearchResults = (results, q) => {
  if (!results.length) {
    searchResults.innerHTML = \`<div class="search-empty">Nenhum resultado para <strong>\${escHtml(q)}</strong></div>\`;
    searchResults.classList.add('visible');
    return;
  }
  const header = \`<div class="search-count">\${results.length} resultado\${results.length !== 1 ? 's' : ''}</div>\`;
  const items = results.map((r) => {
    const snippet = highlightQuery(r.snippet, q);
    const heading = r.heading ? \` · \${escHtml(r.heading)}\` : '';
    const fileShort = r.file.split('/').pop().replace('.md', '');
    const fileAttr = JSON.stringify(r.file).replace(/"/g, '&quot;');
    return \`<div class="search-result" onclick="openDocFromSearch(\${fileAttr})">
      <div class="search-result-file">\${escHtml(fileShort)}<span style="font-weight:400;color:var(--ink-3)">\${heading}</span></div>
      <div class="search-result-heading">\${escHtml(r.file)}:\${r.line}</div>
      <div class="search-result-snippet">\${snippet}</div>
    </div>\`;
  }).join('');
  searchResults.innerHTML = header + items;
  searchResults.classList.add('visible');
};

const openDocFromSearch = (file) => {
  searchResults.classList.remove('visible');
  if (currentMode !== 'map') setMode('map');
  selectNode(file);
  loadFile(file);
};

// Busca de notas na topbar → filtra a lista e mostra dropdown simples
const searchNotesTopbar = (q) => {
  const filtered = filterNotes(q);
  if (!filtered.length) {
    searchResults.innerHTML = \`<div class="search-empty">Nenhuma nota para <strong>\${escHtml(q)}</strong></div>\`;
  } else {
    const header = \`<div class="search-count">\${filtered.length} nota\${filtered.length !== 1 ? 's' : ''}</div>\`;
    searchResults.innerHTML = header + filtered.map((n) =>
      \`<div class="search-result" onclick="openNote('\${n.id}'); searchResults.classList.remove('visible')">
        <div class="search-result-file">\${escHtml(n.title)}</div>
        <div class="search-result-snippet">\${escHtml(n.preview || '')}</div>
      </div>\`).join('');
  }
  searchResults.classList.add('visible');
};

searchInput.addEventListener('input', (e) => doSearch(e.target.value.trim()));
searchInput.addEventListener('focus', () => { if (lastQuery) searchResults.classList.add('visible'); });
document.addEventListener('mousedown', (e) => {
  if (!$('search-wrap').contains(e.target)) searchResults.classList.remove('visible');
});

</script>
<script>
// ════ Anotações do markmap (contextuais ao documento) ════
// Persistidas via /comments no backend. Separado da base de Notas.

let annotations = [];
let popQuote = null;
let popType  = 'note';

const TYPE_LABEL = {
  note:     'Nota',
  decision: 'Decisão',
  question: 'Dúvida',
  todo:     'TODO',
  warning:  'Atenção',
};

const loadAnnotations = async (fileId) => {
  try {
    const res = await fetch('/comments?file=' + encodeURIComponent(fileId));
    annotations = await res.json();
    renderAnnotations();
    updateAnnotBadge();
  } catch (err) { console.error('Erro ao carregar anotações:', err); }
};

const updateAnnotBadge = () => {
  $('annot-count').textContent = annotations.length;
  if (!annotations.length) $('annot-panel').classList.remove('visible');
};

const toggleAnnotations = () => {
  const open = $('annot-panel').classList.toggle('visible');
  $('btn-annot').classList.toggle('active', open);
};

const renderAnnotations = () => {
  const list = $('annot-list');
  if (!annotations.length) {
    list.innerHTML = '<div id="annot-empty">Selecione um trecho do mapa e clique com o botão direito para anotar.</div>';
    return;
  }
  list.innerHTML = annotations.map((a) => {
    const qAttr = JSON.stringify(a.quote).replace(/"/g, '&quot;');
    const color = CAT_COLOR[a.type] || CAT_COLOR.note;
    return \`<div class="annot-item">
      <div class="annot-type-bar" style="background:\${color}"></div>
      <div class="annot-main">
        <span class="annot-quote" title="\${escHtml(a.quote)}">\${escHtml(a.quote)}</span>
        <span class="annot-type-label" style="color:\${color}">\${TYPE_LABEL[a.type] || '◦ Nota'}</span>
        <div class="annot-note">\${escHtml(a.note)}</div>
      </div>
      <div class="annot-actions">
        <button class="annot-btn" onclick="editAnnotation(\${qAttr})" title="Editar">\${ICON('pencil')}</button>
        <button class="annot-btn del" onclick="removeAnnotation(\${qAttr})" title="Excluir">\${ICON('x')}</button>
      </div>
    </div>\`;
  }).join('');
};

// ── Popover ──
const selectAnnotType = (btn) => {
  document.querySelectorAll('#pop-types .type-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  popType = btn.dataset.type;
};

const openAnnotPopover = (quote, x, y) => {
  popQuote = quote;
  const existing = annotations.find((a) => a.quote === quote);
  $('pop-quote').textContent = quote;
  $('pop-textarea').value = existing?.note || '';
  $('pop-delete').style.display = existing ? 'block' : 'none';

  popType = existing?.type || 'note';
  document.querySelectorAll('#pop-types .type-btn').forEach((b) => b.classList.toggle('active', b.dataset.type === popType));

  const pop = $('annot-popover');
  let px = x + 12, py = y + 8;
  if (px + 330 > window.innerWidth)  px = x - 342;
  if (py + 260 > window.innerHeight) py = y - 272;
  pop.style.left = Math.max(8, px) + 'px';
  pop.style.top  = Math.max(8, py) + 'px';
  pop.classList.add('visible');
  setTimeout(() => $('pop-textarea').focus(), 40);
};

const closeAnnotPopover = () => { $('annot-popover').classList.remove('visible'); popQuote = null; };

const saveAnnotation = async () => {
  if (!popQuote || !currentFile) return;
  const note = $('pop-textarea').value.trim();
  if (!note) return deleteAnnotation();

  await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: currentFile, quote: popQuote, note, type: popType }),
  });
  const idx = annotations.findIndex((a) => a.quote === popQuote);
  const entry = { quote: popQuote, note, type: popType, updatedAt: new Date().toISOString() };
  if (idx >= 0) annotations[idx] = entry; else annotations.push(entry);
  closeAnnotPopover();
  renderAnnotations();
  updateAnnotBadge();
  $('annot-panel').classList.add('visible');
  $('btn-annot').classList.add('active');
};

const deleteAnnotation = async () => {
  if (!popQuote || !currentFile) return;
  await postDeleteAnnotation(popQuote);
  closeAnnotPopover();
};

const postDeleteAnnotation = async (quote) => {
  await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: currentFile, quote, note: '' }),
  });
  annotations = annotations.filter((a) => a.quote !== quote);
  renderAnnotations();
  updateAnnotBadge();
};

const editAnnotation = (quote) => {
  const rect = $('markmap-pane').getBoundingClientRect();
  openAnnotPopover(quote, rect.left + rect.width / 2 - 165, rect.top + 70);
};

const removeAnnotation = (quote) => postDeleteAnnotation(quote);

// ── Copiar para IA ──
const copyAnnotationsForAI = () => {
  if (!annotations.length) return toast('Nenhuma anotação para copiar');
  const lines = [\`# Anotações — \${currentFile}\`, ''];
  for (const a of annotations) {
    lines.push(\`## \${TYPE_LABEL[a.type] || '◦ Nota'}\`);
    lines.push(\`> Trecho: "\${a.quote}"\`);
    lines.push('');
    lines.push(a.note);
    lines.push('');
  }
  copyToClipboard(lines.join('\\n'), \`\${annotations.length} anotação(ões) copiada(s) para IA\`);
};

// Fecha popover ao clicar fora
document.addEventListener('mousedown', (e) => {
  const pop = $('annot-popover');
  if (pop.classList.contains('visible') && !pop.contains(e.target)) closeAnnotPopover();
});

</script>
<script>
// ════ Notas — base de conhecimento (CRUD, exposta à IA via API) ════

let allNotes           = [];
let currentNote        = null;
let previewMode        = false;
let noteMarkmapVisible = false;

// ── Lista ──
const loadNotesList = async () => {
  try {
    const res = await fetch('/notes');
    allNotes  = await res.json();
    refreshCategoryOptions();
    renderFilters();
    applyFilters();
  } catch (err) { console.error('Erro ao carregar notas:', err); }
};

// Preenche o datalist com as categorias já usadas (sugestões, não obrigatórias).
const refreshCategoryOptions = () => {
  const cats = [...new Set(allNotes.map((n) => n.category).filter(Boolean))].sort();
  $('note-cat-list').innerHTML = cats.map((c) => \`<option value="\${escHtml(c)}">\`).join('');
};

const renderNotesList = (notes) => {
  const list = $('notes-list');
  if (!notes.length) {
    list.innerHTML = \`<div class="notes-empty">Nenhuma nota ainda.<br>Clique em <strong>+</strong> para criar.</div>\`;
    return;
  }
  list.innerHTML = notes.map((n) => {
    const color = catColor(n.category);
    const tags = (n.tags || []).map((t) => \`<span class="note-tag">\${escHtml(t)}</span>\`).join('');
    return \`<div class="note-item\${currentNote?.id === n.id ? ' active' : ''}" onclick="openNote('\${n.id}')">
      <div class="note-item-top">
        <span class="note-cat-dot" style="background:\${color}"></span>
        <span class="note-item-title">\${escHtml(n.title)}</span>
      </div>
      <div class="note-item-preview">\${escHtml(n.preview || '')}</div>
      \${tags ? \`<div class="note-item-tags">\${tags}</div>\` : ''}
    </div>\`;
  }).join('');
};

// ── Filtros ──

const renderFilters = () => {
  const selCat = $('notes-filter-cat');
  const selTag = $('notes-filter-tag');
  const curCat = selCat.value;
  const curTag = selTag.value;

  const cats = [...new Set(allNotes.map((n) => n.category).filter(Boolean))].sort();
  selCat.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map((c) => \`<option value="\${escHtml(c)}"\${c === curCat ? ' selected' : ''}>\${escHtml(c)}</option>\`).join('');

  const tags = [...new Set(allNotes.flatMap((n) => n.tags || []))].sort();
  selTag.innerHTML = '<option value="">Todas as tags</option>' +
    tags.map((t) => \`<option value="\${escHtml(t)}"\${t === curTag ? ' selected' : ''}>\${escHtml(t)}</option>\`).join('');
};

const applyFilters = () => {
  const q   = $('notes-search-input').value.trim().toLowerCase();
  const cat = $('notes-filter-cat').value;
  const tag = $('notes-filter-tag').value;

  let filtered = allNotes;
  if (cat) filtered = filtered.filter((n) => n.category === cat);
  if (tag) filtered = filtered.filter((n) => (n.tags || []).includes(tag));
  if (q)   filtered = filtered.filter((n) =>
    n.title.toLowerCase().includes(q) ||
    (n.preview || '').toLowerCase().includes(q) ||
    (n.tags || []).some((t) => t.toLowerCase().includes(q)));

  renderNotesList(filtered);
};

const filterNotes = (q) => {
  const ql = q.toLowerCase();
  return allNotes.filter((n) =>
    n.title.toLowerCase().includes(ql) ||
    (n.preview || '').toLowerCase().includes(ql) ||
    (n.tags || []).some((t) => t.toLowerCase().includes(ql)));
};

// ── Abrir / novo ──
const showEditor = () => {
  $('notes-editor-empty').classList.add('hidden');
  $('notes-editor-form').classList.add('visible');
};

const openNote = async (id) => {
  if (currentMode !== 'notes') setMode('notes');
  try {
    const res = await fetch('/notes/' + id);
    currentNote = await res.json();
    fillEditor(currentNote);
    applyFilters(); // preserva filtros ativos ao atualizar item ativo na lista
  } catch (err) { console.error('Erro ao abrir nota:', err); }
};

const updateCatDot = () => {
  $('note-cat-dot').style.background = catColor($('note-cat-input').value.trim() || 'general');
};

const newNote = () => {
  currentNote = null;
  $('note-title-input').value = '';
  $('note-content-textarea').value = '';
  $('note-tags-input').value = '';
  $('note-cat-input').value = '';
  updateCatDot();
  $('note-id-badge').style.display = 'none';
  $('btn-note-markmap').style.display = 'none';
  $('btn-copy-note').style.display = 'none';
  $('btn-delete-note').style.display = 'none';
  showEditor();
  setPreviewMode(false);
  setNoteMarkmapVisible(false);
  $('note-title-input').focus();
};

const fillEditor = (note) => {
  $('note-title-input').value = note.title;
  $('note-content-textarea').value = note.content;
  $('note-tags-input').value = (note.tags || []).join(', ');
  $('note-cat-input').value = note.category || '';
  updateCatDot();
  const badge = $('note-id-badge');
  badge.textContent = note.id.slice(0, 8);
  badge.style.display = 'inline-block';
  $('btn-note-markmap').style.display = 'inline-flex';
  $('btn-copy-note').style.display = 'inline-flex';
  $('btn-delete-note').style.display = 'inline-flex';
  showEditor();
  setPreviewMode(true); // abre em preview; usuário clica "Editar" se quiser modificar
  if (noteMarkmapVisible) renderNoteMarkmap();
};

// ── Salvar / excluir ──
const saveCurrentNote = async () => {
  const title = $('note-title-input').value.trim();
  const content = $('note-content-textarea').value.trim();
  const tags = $('note-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  const category = $('note-cat-input').value.trim() || 'general';
  if (!title) { $('note-title-input').focus(); return toast('Dê um título à nota'); }

  try {
    const url = currentNote ? '/notes/' + currentNote.id : '/notes';
    const method = currentNote ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, tags, category }),
    });
    currentNote = await res.json();
    fillEditor(currentNote);
    if (noteMarkmapVisible) renderNoteMarkmap();
    const listRes = await fetch('/notes');
    allNotes = await listRes.json();
    refreshCategoryOptions();
    renderFilters();
    applyFilters(); // re-aplica filtros ativos após salvar
    toast('Nota salva');
  } catch (err) { console.error('Erro ao salvar nota:', err); toast('Erro ao salvar'); }
};

const deleteCurrentNote = async () => {
  if (!currentNote) return;
  const ok = await confirmDialog(\`Excluir a nota "\${currentNote.title}"?\`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/notes/' + currentNote.id, { method: 'DELETE' });
  currentNote = null;
  $('notes-editor-form').classList.remove('visible');
  $('notes-editor-empty').classList.remove('hidden');
  await loadNotesList();
  toast('Nota excluída');
};

const copyNoteId = () => currentNote && copyToClipboard(currentNote.id, 'ID copiado — cole numa IA');

// ── Preview ──
const setPreviewMode = (on) => {
  previewMode = on;
  const ta = $('note-content-textarea');
  const pv = $('note-preview');
  const btn = $('btn-preview');
  if (on) {
    setNoteMarkmapVisible(false);
    pv.innerHTML = window.marked ? marked.parse(ta.value) : \`<pre>\${escHtml(ta.value)}</pre>\`;
    ta.style.display = 'none';
    pv.classList.add('visible');
    btn.innerHTML = \`\${ICON('pencil')} Editar\`;
  } else {
    pv.classList.remove('visible');
    ta.style.display = '';
    btn.innerHTML = \`\${ICON('eye')} Preview\`;
  }
};
const toggleNotePreview = () => setPreviewMode(!previewMode);

// ── Mapa mental da nota (renderiza o markdown da nota ali mesmo) ──
const setNoteMarkmapVisible = (on) => {
  noteMarkmapVisible = on;
  const mm  = $('note-markmap');
  const ta  = $('note-content-textarea');
  const pv  = $('note-preview');
  const btn = $('btn-note-markmap');
  if (on) {
    pv.classList.remove('visible');
    ta.style.display = 'none';
    mm.classList.add('visible');
    btn?.classList.add('active');
    renderNoteMarkmap();
  } else {
    ta.style.display = '';
    mm.classList.remove('visible');
    btn?.classList.remove('active');
    if (previewMode) pv.classList.add('visible');
  }
};

const renderNoteMarkmap = () => {
  const mk = window.markmap;
  if (!mk?.Markmap || !mk?.Transformer) return toast('markmap não carregou (sem internet?)');
  if (!currentNote) return;
  const container = $('note-markmap');
  container.querySelectorAll('svg.markmap-svg').forEach((el) => el.remove());
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('markmap-svg');
  svg.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(svg);
  const { root } = new mk.Transformer().transform(currentNote.content || '# ' + (currentNote.title || 'Nota'));
  if (window._noteMarkmap) { try { window._noteMarkmap.destroy(); } catch { /* noop */ } }
  window._noteMarkmap = mk.Markmap.create(svg, { autoFit: false }, root);
  setTimeout(() => window._noteMarkmap?.fit?.(), 100);
};

const toggleNoteMarkmap = () => setNoteMarkmapVisible(!noteMarkmapVisible);

// ── Atualiza o pontinho de cor ao digitar a categoria ──
$('note-cat-input').addEventListener('input', updateCatDot);

// ── Busca + filtros combinados ──
$('notes-search-input').addEventListener('input', debounce(() => applyFilters(), 200));

// ── Atalho: Ctrl/Cmd+S salva ──
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'notes') {
    e.preventDefault();
    saveCurrentNote();
  }
});

</script>
<script>
// ════ Macros — runner de scripts bash/deno com output em tempo real ════

let allMacros    = [];
let currentMacro = null;
let runReader    = null; // leitor SSE ativo

// ── Lista ──
const loadMacrosList = async () => {
  try {
    const res = await fetch('/macros');
    allMacros  = await res.json();
    if (!allMacros.length) await seedDefaultMacros();
    else renderMacrosList(allMacros);
  } catch (err) { console.error('Erro ao carregar macros:', err); }
};

const renderMacrosList = (macros) => {
  const list = $('macros-list');
  if (!macros.length) {
    list.innerHTML = \`<div class="macros-empty">Nenhuma macro ainda.<br>Clique em <strong>+</strong> para criar.</div>\`;
    return;
  }
  list.innerHTML = macros.map((m) =>
    \`<div class="macro-item\${currentMacro?.id === m.id ? ' active' : ''}" onclick="openMacro('\${m.id}')">
      <div class="macro-item-top">
        <span class="macro-interp-dot \${m.interpreter}">\${m.interpreter === 'deno' ? '🦕' : '⬡'}</span>
        <span class="macro-item-title">\${escHtml(m.title)}</span>
      </div>
      <div class="macro-item-desc">\${escHtml(m.description || '')}</div>
    </div>\`
  ).join('');
};

// ── Seed macro padrão: transcribe_all.sh ──
const seedDefaultMacros = async () => {
  const defaults = [
    {
      title: 'Transcrições',
      name: 'transcricoes',
      description: 'Transcreve vídeos novos em ~/Movies e salva no docmap',
      script: \`#!/bin/bash\\n/Users/gustavohenriquesoriano/Movies/transcribe_all.sh\`,
    },
    {
      title: 'Briefing do workspace',
      name: 'briefing',
      description: 'Lista notas recentes e skills — contexto pra colar numa IA',
      script: \`#!/usr/bin/env -S deno run --allow-net\\nconst api = Deno.env.get('DOCMAP_API')\\n\\nconst notes = await fetch(\\\`\\\${api}/notes\\\`).then(r=>r.json())\\nconst skills = await fetch(\\\`\\\${api}/skills\\\`).then(r=>r.json())\\n\\nconsole.log('# Briefing docmap\\\\n')\\nconsole.log(\\\`## Notas recentes (\\\\\${notes.length} total)\\\\n\\\`)\\nnotes.slice(0,8).forEach(n => console.log(\\\`- **\\\\\${n.title}** (\\\\\${n.category}) — \\\\\${n.preview?.slice(0,80)}...\\\`))\\nconsole.log(\\\`\\\\n## Skills disponíveis\\\\n\\\`)\\nskills.forEach(s => console.log(\\\`- @\\\\\${s.name} — \\\\\${s.description}\\\`))\\nconsole.log('\\\\n---\\\\nCole este briefing no início de qualquer sessão com IA.')\`,
    },
  ];

  for (const d of defaults) {
    await fetch('/macros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
  }
  const res = await fetch('/macros');
  allMacros = await res.json();
  renderMacrosList(allMacros);
};

// ── Abrir / Novo ──
const openMacro = async (id) => {
  if (currentMode !== 'macros') setMode('macros');
  try {
    const res = await fetch('/macros/' + id);
    currentMacro = await res.json();
    fillMacroEditor(currentMacro);
    renderMacrosList(allMacros);
  } catch (err) { console.error('Erro ao abrir macro:', err); }
};

const newMacro = () => {
  currentMacro = null;
  $('macro-title-input').value = '';
  $('macro-desc-input').value  = '';
  $('macro-script').value      = '#!/bin/bash\\n# Seu script aqui\\n# $DOCMAP_API       → http://127.0.0.1:3334\\n# $DOCMAP_WORKSPACE → pasta aberta\\n\\necho "Olá do docmap!"';
  $('macro-interp-badge').textContent = 'bash';
  $('macro-interp-badge').className   = 'macro-badge bash';
  $('btn-macro-delete').style.display = 'none';
  clearOutput();
  showMacroEditor();
  $('macro-title-input').focus();
};

const fillMacroEditor = (m) => {
  $('macro-title-input').value       = m.title;
  $('macro-desc-input').value        = m.description || '';
  $('macro-script').value            = m.script;
  $('macro-interp-badge').textContent = m.interpreter;
  $('macro-interp-badge').className   = \`macro-badge \${m.interpreter}\`;
  $('btn-macro-delete').style.display = 'inline-flex';
  clearOutput();
  showMacroEditor();
};

const showMacroEditor = () => {
  $('macros-editor-empty').style.display = 'none';
  $('macros-editor-form').classList.add('visible');
};

// auto-detecta interpretador ao editar o script
$('macro-script').addEventListener('input', () => {
  const first = $('macro-script').value.split('\\n')[0] ?? '';
  const interp = first.includes('deno') ? 'deno' : 'bash';
  $('macro-interp-badge').textContent = interp;
  $('macro-interp-badge').className   = \`macro-badge \${interp}\`;
});

// ── Salvar / Excluir ──
const saveCurrentMacro = async () => {
  const title  = $('macro-title-input').value.trim();
  const desc   = $('macro-desc-input').value.trim();
  const script = $('macro-script').value.trim();
  if (!title)  { $('macro-title-input').focus(); return toast('Dê um nome à macro'); }
  if (!script) { $('macro-script').focus();      return toast('Script vazio'); }

  const url    = currentMacro ? '/macros/' + currentMacro.id : '/macros';
  const method = currentMacro ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name: title, description: desc, script }),
    });
    currentMacro = await res.json();
    fillMacroEditor(currentMacro);
    const listRes = await fetch('/macros');
    allMacros = await listRes.json();
    renderMacrosList(allMacros);
    toast('Macro salva');
  } catch { toast('Erro ao salvar'); }
};

const deleteCurrentMacro = async () => {
  if (!currentMacro) return;
  const ok = await confirmDialog(\`Excluir a macro "\${currentMacro.title}"?\`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/macros/' + currentMacro.id, { method: 'DELETE' });
  currentMacro = null;
  $('macros-editor-form').classList.remove('visible');
  $('macros-editor-empty').style.display = 'flex';
  clearOutput();
  const listRes = await fetch('/macros');
  allMacros = await listRes.json();
  renderMacrosList(allMacros);
  toast('Macro excluída');
};

// ── Executar ──
const runCurrentMacro = async () => {
  if (!currentMacro) return;

  // salva antes de rodar pra garantir que executa a versão atual
  await saveCurrentMacro();

  setRunning(true);
  clearOutput();
  appendOutput(\`▶ Executando: \${currentMacro.title}\\n\`, 'info');
  appendOutput(\`─────────────────────────────────────\\n\`, 'info');

  try {
    const res = await fetch(\`/macros/\${currentMacro.id}/run\`, { method: 'POST' });

    if (res.status === 403) {
      const data = await res.json();
      appendOutput(\`🚫 Bloqueado: \${data.reason}\\n\`, 'error');
      setRunning(false);
      return;
    }

    const reader = res.body.getReader();
    runReader = reader;
    const dec = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event: stdout')) continue;
        if (line.startsWith('event: stderr')) continue;
        if (line.startsWith('event: exit')) continue;
        if (line.startsWith('data: ')) {
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw);
            const isExit = /^\\d+$/.test(parsed);
            if (isExit) {
              const code = parseInt(parsed);
              appendOutput(\`\\n─────────────────────────────────────\\n\`, 'info');
              appendOutput(code === 0 ? '✓ Concluído com sucesso\\n' : \`✗ Saiu com código \${code}\\n\`, code === 0 ? 'success' : 'error');
            } else {
              appendOutput(parsed + '\\n', 'out');
            }
          } catch { /* linha incompleta */ }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      appendOutput(\`\\n✗ Erro: \${err.message}\\n\`, 'error');
    }
  } finally {
    runReader = null;
    setRunning(false);
  }
};

const stopMacro = async () => {
  if (runReader) {
    try { runReader.cancel(); } catch { /* noop */ }
    runReader = null;
  }
  appendOutput('\\n⬛ Interrompido pelo usuário\\n', 'info');
  setRunning(false);
};

// ── Output ──
const clearOutput = () => {
  $('macro-output').innerHTML = '';
  $('btn-macro-clear').style.display = 'none';
  $('macro-status-badge').textContent = '';
  $('macro-status-badge').className   = 'macro-status';
};

const appendOutput = (text, type = 'out') => {
  const out = $('macro-output');
  const span = document.createElement('span');
  span.className = \`out-\${type}\`;
  span.textContent = text;
  out.appendChild(span);
  out.scrollTop = out.scrollHeight;
  $('btn-macro-clear').style.display = 'inline-flex';
};

const setRunning = (running) => {
  const runBtn  = $('btn-macro-run');
  const stopBtn = $('btn-macro-stop');
  const badge   = $('macro-status-badge');

  runBtn.disabled = running;
  runBtn.innerHTML = running
    ? \`<span class="run-spinner"></span> Executando…\`
    : \`\${ICON('sparkles')} Executar\`;
  stopBtn.style.display  = running ? 'inline-flex' : 'none';
  badge.textContent      = running ? 'rodando' : '';
  badge.className        = running ? 'macro-status running' : 'macro-status';
};

// Ctrl+Enter executa
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && currentMode === 'macros') {
    e.preventDefault();
    runCurrentMacro();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'macros') {
    e.preventDefault();
    saveCurrentMacro();
  }
});

</script>
<script>
// ════ Skills — gerenciamento local, leitura pela IA ════

let allSkills    = [];
let currentSkill = null;
let skillPreview = false;

// ── Lista ──
const loadSkillsList = async () => {
  try {
    const res = await fetch('/skills');
    allSkills  = await res.json();
    renderSkillsList(allSkills);
  } catch (err) { console.error('Erro ao carregar skills:', err); }
};

const renderSkillsList = (skills) => {
  const list = $('skills-list');
  if (!skills.length) {
    list.innerHTML = \`<div class="skills-empty">Nenhuma skill ainda.<br>Clique em <strong>+</strong> para criar.</div>\`;
    return;
  }
  list.innerHTML = skills.map((s) =>
    \`<div class="skill-item\${currentSkill?.id === s.id ? ' active' : ''}" onclick="openSkill('\${s.id}')">
      <div class="skill-item-top">
        <span class="skill-item-name">@\${escHtml(s.name)}</span>
        <span class="skill-item-title">\${escHtml(s.title)}</span>
      </div>
      <div class="skill-item-desc">\${escHtml(s.description || '')}</div>
      \${(s.tags||[]).length ? \`<div class="skill-item-tags">\${(s.tags||[]).map(t=>\`<span class="note-tag">\${escHtml(t)}</span>\`).join('')}</div>\` : ''}
    </div>\`
  ).join('');
};

// ── Filtro de busca ──
$('skills-search-input').addEventListener('input', debounce((e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) { renderSkillsList(allSkills); return; }
  renderSkillsList(allSkills.filter((s) =>
    s.name.includes(q) || s.title.toLowerCase().includes(q) ||
    (s.description||'').toLowerCase().includes(q) ||
    (s.tags||[]).some((t) => t.toLowerCase().includes(q))
  ));
}, 200));

// ── Abrir / Novo ──
const openSkill = async (id) => {
  if (currentMode !== 'skills') setMode('skills');
  try {
    const res = await fetch('/skills/' + id);
    currentSkill = await res.json();
    fillSkillEditor(currentSkill);
    renderSkillsList(allSkills);
  } catch (err) { console.error('Erro ao abrir skill:', err); }
};

const newSkill = () => {
  currentSkill = null;
  $('skill-title-input').value   = '';
  $('skill-name-input').value    = '';
  $('skill-desc-input').value    = '';
  $('skill-tags-input').value    = '';
  $('skill-content-textarea').value = '';
  $('skill-name-badge').textContent = '';
  $('btn-skill-copy').style.display   = 'none';
  $('btn-skill-delete').style.display = 'none';
  showSkillEditor();
  setSkillPreview(false);
  $('skill-title-input').focus();
};

const fillSkillEditor = (s) => {
  $('skill-title-input').value      = s.title;
  $('skill-name-input').value       = s.name;
  $('skill-desc-input').value       = s.description || '';
  $('skill-tags-input').value       = (s.tags||[]).join(', ');
  $('skill-content-textarea').value = s.content;
  $('skill-name-badge').textContent = '@' + s.name;
  $('btn-skill-copy').style.display   = 'inline-flex';
  $('btn-skill-delete').style.display = 'inline-flex';
  showSkillEditor();
  setSkillPreview(false);
};

const showSkillEditor = () => {
  $('skills-editor-empty').style.display = 'none';
  $('skills-editor-form').classList.add('visible');
};

// ── Auto-slug ao digitar título ──
$('skill-title-input').addEventListener('input', () => {
  if (!currentSkill && !$('skill-name-input').value) {
    const slug = $('skill-title-input').value
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    $('skill-name-input').value = slug;
  }
});

// ── Salvar / Excluir ──
const saveCurrentSkill = async () => {
  const title   = $('skill-title-input').value.trim();
  const name    = $('skill-name-input').value.trim();
  const desc    = $('skill-desc-input').value.trim();
  const content = $('skill-content-textarea').value.trim();
  const tags    = $('skill-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);

  if (!title)   { $('skill-title-input').focus(); return toast('Dê um título à skill'); }
  if (!content) { $('skill-content-textarea').focus(); return toast('Conteúdo vazio'); }

  const url    = currentSkill ? '/skills/' + currentSkill.id : '/skills';
  const method = currentSkill ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name: name || title, description: desc, content, tags }),
    });
    currentSkill = await res.json();
    const listRes = await fetch('/skills');
    allSkills = await listRes.json();
    fillSkillEditor(currentSkill);
    renderSkillsList(allSkills);
    toast('Skill salva');
  } catch { toast('Erro ao salvar'); }
};

const deleteCurrentSkill = async () => {
  if (!currentSkill) return;
  const ok = await confirmDialog(\`Excluir a skill "@\${currentSkill.name}"?\`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/skills/' + currentSkill.id, { method: 'DELETE' });
  currentSkill = null;
  $('skills-editor-form').classList.remove('visible');
  $('skills-editor-empty').style.display = 'flex';
  const listRes = await fetch('/skills');
  allSkills = await listRes.json();
  renderSkillsList(allSkills);
  toast('Skill excluída');
};

// Copia a referência que você cola num prompt de IA
const copySkillRef = () => {
  if (!currentSkill) return;
  const ref = \`Skill disponível em: GET http://127.0.0.1:3334/skills/\${currentSkill.name}\\n(ou pelo ID: \${currentSkill.id})\`;
  copyToClipboard(ref, 'Referência copiada — cole no prompt da IA');
};

// ── Preview markdown ──
const setSkillPreview = (on) => {
  skillPreview = on;
  const ta  = $('skill-content-textarea');
  const pv  = $('skill-preview');
  const btn = $('btn-skill-preview');
  if (on) {
    pv.innerHTML = window.marked ? marked.parse(ta.value) : \`<pre>\${escHtml(ta.value)}</pre>\`;
    ta.style.display = 'none';
    pv.classList.add('visible');
    btn.innerHTML = \`\${ICON('pencil')} Editar\`;
  } else {
    pv.classList.remove('visible');
    ta.style.display = '';
    btn.innerHTML = \`\${ICON('eye')} Preview\`;
  }
};
const toggleSkillPreview = () => setSkillPreview(!skillPreview);

// Ctrl+S salva
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'skills') {
    e.preventDefault();
    saveCurrentSkill();
  }
});

</script>
<script>
// ════ Diagramas Mermaid ════

let allDiagrams     = [];
let currentDiagram  = null;
let renderTimer     = null;
let mermaidReady    = false;

// ── Inicializa Mermaid com tema dark ──
const initMermaid = () => {
  if (!window.mermaid || mermaidReady) return;
  window.mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: 'dark',
    themeVariables: {
      background:       '#101216',
      primaryColor:     '#1e222a',
      primaryTextColor: '#edeef1',
      primaryBorderColor: '#22262e',
      lineColor:        '#626976',
      secondaryColor:   '#16191f',
      tertiaryColor:    '#262b34',
    },
  });
  mermaidReady = true;
};

// ── Lista ──
const loadDiagramsList = async () => {
  try {
    const res = await fetch('/diagrams');
    allDiagrams = await res.json();
    renderDiagramsList();
  } catch (err) { console.error('Erro ao carregar diagramas:', err); }
};

const renderDiagramsList = () => {
  const list = $('diag-list');
  if (!allDiagrams.length) {
    list.innerHTML = \`<div class="diag-empty">Nenhum diagrama ainda.<br>Clique em <strong>+</strong> para criar.</div>\`;
    return;
  }
  list.innerHTML = allDiagrams.map((d) =>
    \`<div class="diag-item\${currentDiagram?.id === d.id ? ' active' : ''}" onclick="openDiagram('\${d.id}')">
      <div class="diag-item-title">\${escHtml(d.title)}</div>
      <div class="diag-item-preview">\${escHtml(d.preview || '')}</div>
    </div>\`
  ).join('');
};

// ── Abrir / Novo ──
const openDiagram = async (id) => {
  if (currentMode !== 'diagrams') setMode('diagrams');
  try {
    const res = await fetch('/diagrams/' + id);
    currentDiagram = await res.json();
    fillDiagramEditor(currentDiagram);
    renderDiagramsList();
  } catch (err) { console.error('Erro ao abrir diagrama:', err); }
};

const newDiagram = () => {
  currentDiagram = null;
  diagZoomLevel = 1;
  $('diag-title-input').value = '';
  $('diag-source').value = '';
  $('diag-id-badge').style.display = 'none';
  $('btn-diag-copy-link').style.display = 'none';
  $('btn-diag-delete').style.display = 'none';
  $('diag-preview').innerHTML = '';
  $('diag-zoom-label').textContent = '100%';
  showDiagramEditor();
  $('diag-title-input').focus();
};

const fillDiagramEditor = (d) => {
  $('diag-title-input').value = d.title;
  $('diag-source').value      = d.source;
  const badge = $('diag-id-badge');
  badge.textContent            = d.id.slice(0, 8);
  badge.style.display          = 'inline-block';
  $('btn-diag-copy-link').style.display = 'inline-flex';
  $('btn-diag-delete').style.display    = 'inline-flex';
  showDiagramEditor();
  renderPreview(d.source);
};

const showDiagramEditor = () => {
  $('diag-editor-empty').style.display = 'none';
  $('diag-editor-form').classList.add('visible');
};

// ── Salvar / Excluir ──
const saveCurrentDiagram = async () => {
  const title  = $('diag-title-input').value.trim();
  const source = $('diag-source').value.trim();
  if (!title)  { $('diag-title-input').focus(); return toast('Dê um título ao diagrama'); }
  if (!source) { $('diag-source').focus();      return toast('Escreva o código Mermaid'); }

  const url    = currentDiagram ? '/diagrams/' + currentDiagram.id : '/diagrams';
  const method = currentDiagram ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, source }),
    });
    currentDiagram = await res.json();
    fillDiagramEditor(currentDiagram);
    const listRes = await fetch('/diagrams');
    allDiagrams = await listRes.json();
    renderDiagramsList();
    toast('Diagrama salvo');
  } catch { toast('Erro ao salvar'); }
};

const deleteCurrentDiagram = async () => {
  if (!currentDiagram) return;
  const ok = await confirmDialog(\`Excluir "\${currentDiagram.title}"?\`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/diagrams/' + currentDiagram.id, { method: 'DELETE' });
  currentDiagram = null;
  $('diag-editor-form').classList.remove('visible');
  $('diag-editor-empty').style.display = 'flex';
  $('diag-preview').innerHTML = '';
  const listRes = await fetch('/diagrams');
  allDiagrams = await listRes.json();
  renderDiagramsList();
  toast('Diagrama excluído');
};

// ── Deep link / copiar ──
const copyDiagramLink = () => {
  if (!currentDiagram) return;
  const link = \`http://127.0.0.1:3333/#diagram/\${currentDiagram.id}\`;
  copyToClipboard(link, 'Link copiado — cole numa IA ou no navegador');
};

// ── Zoom ──
let diagZoomLevel = 1;

const diagApplyZoom = () => {
  const svgEl = $('diag-preview')?.querySelector('svg');
  if (!svgEl) return;
  const pct = Math.round(diagZoomLevel * 100);
  svgEl.style.width  = pct + '%';
  svgEl.style.height = 'auto';
  $('diag-zoom-label').textContent = pct + '%';
};

const diagZoomIn    = () => { diagZoomLevel = Math.min(diagZoomLevel + 0.25, 4);   diagApplyZoom(); };
const diagZoomOut   = () => { diagZoomLevel = Math.max(diagZoomLevel - 0.25, 0.25); diagApplyZoom(); };
const diagZoomReset = () => { diagZoomLevel = 1; diagApplyZoom(); };

// ── Preview Mermaid ──
const renderPreview = async (source) => {
  if (!source.trim()) { $('diag-preview').innerHTML = ''; return; }
  initMermaid();
  if (!window.mermaid) return;
  try {
    const id  = 'mmd-' + Date.now();
    const { svg } = await window.mermaid.render(id, source);
    const el = $('diag-preview');
    el.innerHTML = svg;
    const svgEl = el.querySelector('svg');
    if (svgEl) { svgEl.style.maxWidth = 'none'; }
    diagApplyZoom();
  } catch (err) {
    $('diag-preview').innerHTML =
      \`<div class="diag-error">Erro no diagrama:<br><code>\${escHtml(String(err).slice(0, 200))}</code></div>\`;
  }
};

// ── Toggle código Mermaid ──
const toggleDiagSource = () => {
  $('diag-source-col').classList.toggle('open');
};

// ── Live preview ao digitar (debounced) ──
$('diag-source').addEventListener('input', debounce(() => {
  renderPreview($('diag-source').value);
}, 600));

// ── Atalho: Ctrl/Cmd+S salva ──
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'diagrams') {
    e.preventDefault();
    saveCurrentDiagram();
  }
});

// ── SSE: atualiza preview em tempo real quando um agente modifica o diagrama ──
const connectDiagramEvents = () => {
  const es = new EventSource('/diagrams/events');

  es.addEventListener('updated', (e) => {
    const { diagram } = JSON.parse(e.data);
    allDiagrams = allDiagrams.map((d) => d.id === diagram.id
      ? { ...d, title: diagram.title, preview: (diagram.source ?? '').slice(0, 120) }
      : d);
    renderDiagramsList();
    if (currentDiagram?.id === diagram.id) {
      currentDiagram = diagram;
      // Só sobrescreve o editor se o usuário não estiver digitando nele
      if (document.activeElement !== $('diag-source')) {
        $('diag-title-input').value = diagram.title;
        $('diag-source').value      = diagram.source;
      }
      renderPreview(diagram.source);
    }
  });

  es.addEventListener('created', (e) => {
    const { diagram } = JSON.parse(e.data);
    if (!allDiagrams.find((d) => d.id === diagram.id)) {
      allDiagrams = [diagram, ...allDiagrams];
      renderDiagramsList();
    }
  });

  es.addEventListener('deleted', (e) => {
    const { id } = JSON.parse(e.data);
    allDiagrams = allDiagrams.filter((d) => d.id !== id);
    if (currentDiagram?.id === id) {
      currentDiagram = null;
      $('diag-editor-form').classList.remove('visible');
      $('diag-editor-empty').style.display = 'flex';
      $('diag-preview').innerHTML = '';
    }
    renderDiagramsList();
  });
};

connectDiagramEvents();

</script>
<script>
// ════ Kanban — tasks globais ════

let allTasks      = [];
let taskNotesList = [];  // cache da lista de notas p/ o seletor (nome distinto de allNotes em notes.js)
let currentTaskId = null;

// ── Drag state ──
let draggedId     = null;
let dropTargetId  = null;
let dropPosition  = 'after'; // 'before' | 'after'

// ══════════════════════════════════════════
// Carregamento
// ══════════════════════════════════════════

const loadTasks = async () => {
  try {
    const res = await fetch('/tasks');
    allTasks = await res.json();
    renderBoard();
  } catch (err) {
    console.error('Erro ao carregar tasks:', err);
  }
};

const loadNotesForSelect = async () => {
  if (taskNotesList.length) return;
  try {
    const res = await fetch('/notes');
    taskNotesList = await res.json();
  } catch { /* silencioso */ }
};

// ── Combobox de nota ──

const positionNoteDropdown = () => {
  const wrap = $('task-note-wrap');
  const dd   = $('task-note-dropdown');
  if (!wrap || !dd) return;
  const rect = wrap.getBoundingClientRect();
  dd.style.top   = \`\${rect.bottom + 3}px\`;
  dd.style.left  = \`\${rect.left}px\`;
  dd.style.width = \`\${rect.width}px\`;
};

const filterNoteSearch = () => {
  const q   = $('task-note-input').value.trim().toLowerCase();
  const dd  = $('task-note-dropdown');

  // Se já foi selecionada e o usuário não editou o texto, não reabre
  if ($('task-note-input').dataset.resolved === 'true') {
    $('task-note-input').dataset.resolved = '';
    return;
  }

  const matches = q
    ? taskNotesList.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 12)
    : taskNotesList.slice(0, 12);

  if (!matches.length) {
    dd.innerHTML = \`<div class="note-search-empty">Nenhuma nota encontrada</div>\`;
  } else {
    dd.innerHTML = matches.map((n) =>
      \`<div class="note-search-item" data-id="\${n.id}" data-title="\${escHtml(n.title)}">
        \${escHtml(n.title)}
      </div>\`
    ).join('');
    dd.querySelectorAll('.note-search-item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault(); // evita blur no input antes do clique completar
        selectNoteLink(el.dataset.id, el.dataset.title);
      });
    });
  }

  positionNoteDropdown();
  dd.classList.add('open');
};

const selectNoteLink = (id, title) => {
  $('task-note-id').value         = id;
  $('task-note-input').value      = title;
  $('task-note-input').dataset.resolved = 'true';
  $('task-note-input').classList.add('has-link');
  $('task-note-clear').style.display = 'inline-flex';
  $('task-note-dropdown').classList.remove('open');
};

const clearNoteLink = () => {
  $('task-note-id').value               = '';
  $('task-note-input').value            = '';
  $('task-note-input').dataset.resolved = '';
  $('task-note-input').classList.remove('has-link');
  $('task-note-clear').style.display    = 'none';
  $('task-note-input').focus();
};

const closeNoteDropdown = (e) => {
  if (!$('task-note-wrap')?.contains(e.target) && !$('task-note-dropdown')?.contains(e.target)) {
    $('task-note-dropdown')?.classList.remove('open');
    // Se o usuário saiu sem selecionar e há uma nota vinculada, restaura o título
    const id = $('task-note-id')?.value;
    if (id) {
      const note = taskNotesList.find((n) => n.id === id);
      if (note) $('task-note-input').value = note.title;
    } else {
      if (!$('task-note-input')?.dataset.resolved) {
        $('task-note-input').value = '';
      }
    }
  }
};

// ══════════════════════════════════════════
// Renderização do board
// ══════════════════════════════════════════

const COLUMNS = [
  { status: 'todo',        label: 'A Fazer'      },
  { status: 'in-progress', label: 'Em Andamento' },
  { status: 'done',        label: 'Concluído'    },
];

const renderBoard = () => {
  for (const col of COLUMNS) {
    const colTasks = allTasks
      .filter((t) => t.status === col.status)
      .sort((a, b) => a.order - b.order);

    $(\`kanban-count-\${col.status}\`).textContent = String(colTasks.length);

    const container = $(\`kanban-cards-\${col.status}\`);
    if (!colTasks.length) {
      container.innerHTML = \`<div class="kanban-col-empty">Nenhuma task</div>\`;
    } else {
      container.innerHTML = colTasks.map((t) => renderCard(t)).join('');
      hydrateIcons(container);
    }

    // Re-registra drag events nas cards
    container.querySelectorAll('.kanban-card').forEach(bindCardDrag);
  }
};

const formatDue = (dueDate, status) => {
  if (!dueDate) return '';
  const today   = new Date().toISOString().slice(0, 10);
  const due     = dueDate;
  const diff    = Math.ceil((new Date(due) - new Date(today)) / 86400000);
  let cls = 'kanban-card-due';
  let label;

  if (status === 'done')   { label = due.split('-').reverse().join('/'); }
  else if (diff < 0)       { cls += ' overdue';   label = \`Atrasada \${Math.abs(diff)}d\`; }
  else if (diff === 0)     { cls += ' due-today'; label = 'Hoje'; }
  else if (diff === 1)     { label = 'Amanhã'; }
  else                     { label = due.split('-').reverse().join('/'); }

  return \`<span class="\${cls}">📅 \${escHtml(label)}</span>\`;
};

const renderCard = (task) => {
  const due  = formatDue(task.dueDate, task.status);
  const note = task.noteId
    ? \`<span class="kanban-card-note-link">nota</span>\`
    : '';
  const desc = task.description
    ? \`<div class="kanban-card-desc">\${escHtml(task.description.slice(0, 120))}</div>\`
    : '';
  const meta = (due || note)
    ? \`<div class="kanban-card-meta">\${due}\${note}</div>\`
    : '';
  return \`<div class="kanban-card"
    data-id="\${task.id}"
    draggable="true"
    onclick="openTaskModal('\${task.id}')">
    <div class="kanban-card-title">\${escHtml(task.title)}</div>
    \${desc}
    \${meta}
  </div>\`;
};

// ══════════════════════════════════════════
// Drag & Drop
// ══════════════════════════════════════════

const bindCardDrag = (el) => {
  el.addEventListener('dragstart', (e) => {
    draggedId = el.dataset.id;
    setTimeout(() => el.classList.add('is-dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('is-dragging');
    clearDropIndicators();
    draggedId    = null;
    dropTargetId = null;
  });

  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (el.dataset.id === draggedId) return;
    const rect = el.getBoundingClientRect();
    const mid  = rect.top + rect.height / 2;
    clearDropIndicators();
    dropTargetId = el.dataset.id;
    if (e.clientY < mid) {
      dropPosition = 'before';
      el.classList.add('drop-before');
    } else {
      dropPosition = 'after';
      el.classList.add('drop-after');
    }
  });
};

const clearDropIndicators = () => {
  document.querySelectorAll('.kanban-card').forEach((c) => {
    c.classList.remove('drop-before', 'drop-after');
  });
  document.querySelectorAll('.kanban-col').forEach((c) => {
    c.classList.remove('drag-over-col');
  });
};

// Bind events nas colunas (drop zone)
const bindColumnDrop = (colEl) => {
  const status = colEl.dataset.status;

  colEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    colEl.classList.add('drag-over-col');
  });

  colEl.addEventListener('dragleave', (e) => {
    if (!colEl.contains(e.relatedTarget)) {
      colEl.classList.remove('drag-over-col');
    }
  });

  colEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    colEl.classList.remove('drag-over-col');
    if (!draggedId) return;
    await applyDrop(status);
  });
};

const applyDrop = async (targetStatus) => {
  const draggedTask = allTasks.find((t) => t.id === draggedId);
  if (!draggedTask) return;

  const sourceStatus = draggedTask.status;

  // IDs da coluna destino na ordem atual (sem a task arrastada)
  let destIds = allTasks
    .filter((t) => t.status === targetStatus && t.id !== draggedId)
    .sort((a, b) => a.order - b.order)
    .map((t) => t.id);

  // Insere na posição certa
  if (dropTargetId && destIds.includes(dropTargetId)) {
    const idx = destIds.indexOf(dropTargetId);
    if (dropPosition === 'before') destIds.splice(idx, 0, draggedId);
    else destIds.splice(idx + 1, 0, draggedId);
  } else {
    // Drop na área vazia da coluna → vai pro final
    destIds.push(draggedId);
  }

  const reorder = (status, ids) =>
    fetch('/tasks/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ids }),
    });

  if (sourceStatus === targetStatus) {
    await reorder(targetStatus, destIds);
  } else {
    const sourceIds = allTasks
      .filter((t) => t.status === sourceStatus && t.id !== draggedId)
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);
    await Promise.all([
      reorder(sourceStatus, sourceIds),
      reorder(targetStatus, destIds),
    ]);
  }

  dropTargetId = null;
  await loadTasks();
};

// ══════════════════════════════════════════
// Modal — criar / editar task
// ══════════════════════════════════════════

const openNewTask = async (status) => {
  currentTaskId = null;
  await loadNotesForSelect();
  populateNoteSelect(null);

  $('task-title-input').value  = '';
  $('task-status-select').value = status;
  $('task-desc-textarea').value = '';
  $('task-due-input').value     = '';
  $('task-delete-btn').style.display = 'none';

  showTaskModal();
  $('task-title-input').focus();
};

const openTaskModal = async (id) => {
  const task = allTasks.find((t) => t.id === id);
  if (!task) return;
  currentTaskId = id;

  await loadNotesForSelect();
  populateNoteSelect(task.noteId ?? null);

  $('task-title-input').value   = task.title;
  $('task-status-select').value = task.status;
  $('task-desc-textarea').value = task.description ?? '';
  $('task-due-input').value     = task.dueDate ?? '';
  $('task-delete-btn').style.display = 'inline-flex';

  showTaskModal();
  $('task-title-input').focus();
};

const populateNoteSelect = (selectedId) => {
  if (selectedId) {
    const note = taskNotesList.find((n) => n.id === selectedId);
    if (note) {
      selectNoteLink(selectedId, note.title);
      return;
    }
  }
  // Sem nota vinculada — limpa
  clearNoteLink();
};

const showTaskModal = () => {
  $('task-modal-overlay').classList.add('visible');
};

const closeTaskModal = () => {
  $('task-modal-overlay').classList.remove('visible');
  currentTaskId = null;
};

const closeTaskModalOnOverlay = (e) => {
  if (e.target === $('task-modal-overlay')) closeTaskModal();
};

const saveCurrentTask = async () => {
  const title  = $('task-title-input').value.trim();
  if (!title) { $('task-title-input').focus(); return; }

  const body = {
    title,
    description: $('task-desc-textarea').value,
    status:      $('task-status-select').value,
    dueDate:     $('task-due-input').value || null,
    noteId:      $('task-note-id').value   || null,
  };

  if (currentTaskId) {
    await fetch(\`/tasks/\${currentTaskId}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } else {
    await fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  closeTaskModal();
  await loadTasks();
};

const deleteCurrentTask = async () => {
  if (!currentTaskId) return;
  await fetch(\`/tasks/\${currentTaskId}\`, { method: 'DELETE' });
  closeTaskModal();
  await loadTasks();
};

// ══════════════════════════════════════════
// Boot — bind único no carregamento da página
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.kanban-col').forEach(bindColumnDrop);
  document.addEventListener('click', closeNoteDropdown);
});

</script>
<script>
// ════ Mocks — HTTP Mock Server Manager ════

const MOCK_SERVER = 'http://127.0.0.1:3335';

let allCollections = [];
let allMocks       = [];
let activeColId    = null;   // null = show all
let currentMockId  = null;
let scriptEditor   = null;   // instância CodeMirror (lazy init)

// Inicializa o editor de script uma única vez, quando o form fica visível.
const initScriptEditor = () => {
  if (scriptEditor || typeof CodeMirror === 'undefined') return;
  const ta = $('mock-script-textarea');
  if (!ta) return;

  scriptEditor = CodeMirror.fromTextArea(ta, {
    mode:           'javascript',
    theme:          'default',
    lineNumbers:    true,
    tabSize:        2,
    indentWithTabs: false,
    lineWrapping:   true,
    viewportMargin: Infinity,   // altura automática, sem scroll interno
    extraKeys: {
      Tab: (cm) => cm.replaceSelection('  '),
    },
  });
};

const editorGet = () =>
  scriptEditor ? scriptEditor.getValue() : ($('mock-script-textarea')?.value ?? '');

const editorSet = (value) => {
  if (scriptEditor) {
    scriptEditor.setValue(value);
    requestAnimationFrame(() => scriptEditor.refresh());
  } else if ($('mock-script-textarea')) {
    $('mock-script-textarea').value = value;
  }
};

const editorFocus = () =>
  scriptEditor ? scriptEditor.focus() : $('mock-script-textarea')?.focus();

// ══════════════════════════════════════════
// Data
// ══════════════════════════════════════════

const loadMocksData = async () => {
  try {
    const [colsRes, mocksRes] = await Promise.all([
      fetch('/mocks/collections'),
      fetch('/mocks'),
    ]);
    allCollections = await colsRes.json();
    allMocks       = await mocksRes.json();
    renderCollections();
    renderMocksList();
    updateServerBadge();
    updateGroupsDatalist();
    updateClearBtn();
  } catch (err) {
    console.error('Erro ao carregar mocks:', err);
  }
};

// ══════════════════════════════════════════
// Collections
// ══════════════════════════════════════════

const renderCollections = () => {
  const list = $('mocks-col-list');
  if (!list) return;

  if (!allCollections.length) {
    list.innerHTML = \`<div class="mocks-col-empty">Nenhuma collection ainda.<br>Crie a primeira.</div>\`;
    return;
  }

  list.innerHTML = allCollections.map((col) => {
    const count  = allMocks.filter((m) => m.collectionId === col.id).length;
    const active = col.id === activeColId ? ' active' : '';
    return \`<div class="mocks-col-item\${active}" data-id="\${col.id}">
      <div class="mocks-col-item-inner" onclick="selectCollection('\${col.id}')">
        <span class="mocks-col-dot"></span>
        <span class="mocks-col-name">\${escHtml(col.name)}</span>
        <span class="mocks-col-count">\${count}</span>
      </div>
      <div class="mocks-col-actions">
        <button class="mocks-col-action-btn" onclick="renameCollection('\${col.id}')" title="Renomear">
          <span data-icon="pencil"></span>
        </button>
        <button class="mocks-col-action-btn warn" onclick="clearCollectionMocks('\${col.id}')" title="Limpar mocks (mantém collection)">
          <span data-icon="minus"></span>
        </button>
        <button class="mocks-col-action-btn danger" onclick="removeCollection('\${col.id}')" title="Deletar collection">
          <span data-icon="trash"></span>
        </button>
      </div>
    </div>\`;
  }).join('');
  hydrateIcons(list);
};

const selectCollection = (id) => {
  activeColId = activeColId === id ? null : id;
  renderCollections();
  renderMocksList();
  updateClearBtn();
};

const newCollection = () => {
  if ($('new-col-input-row')) return;  // já aberto

  const list = $('mocks-col-list');
  if (!list) return;

  const row = document.createElement('div');
  row.id = 'new-col-input-row';
  row.className = 'mocks-col-new-row';
  row.innerHTML = \`
    <input id="new-col-input" class="mocks-col-new-input"
      placeholder="Nome da collection…" autocomplete="off" spellcheck="false"/>
    <button class="mocks-col-new-ok" onclick="confirmNewCollection()" title="Criar">
      <span data-icon="plus"></span>
    </button>
  \`;
  list.prepend(row);
  hydrateIcons(row);

  const input = $('new-col-input');
  input.focus();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmNewCollection(); }
    if (e.key === 'Escape') cancelNewCollection();
  });
};

const confirmNewCollection = async () => {
  const input = $('new-col-input');
  if (!input) return;
  const name = input.value.trim();
  cancelNewCollection();
  if (!name) return;
  await fetch('/mocks/collections', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name }),
  });
  await loadMocksData();
};

const cancelNewCollection = () => $('new-col-input-row')?.remove();

const renameCollection = (id) => {
  const col = allCollections.find((c) => c.id === id);
  if (!col) return;

  const nameEl = document.querySelector(\`[data-id="\${id}"] .mocks-col-name\`);
  if (!nameEl) return;

  const original = col.name;
  const input = document.createElement('input');
  input.className = 'mocks-col-rename-input';
  input.value = original;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  let done = false;
  const commit = async () => {
    if (done) return;
    done = true;
    const name = input.value.trim();
    if (name && name !== original) {
      await fetch(\`/mocks/collections/\${id}\`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      });
    }
    await loadMocksData();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { done = true; loadMocksData(); }
  });
  input.addEventListener('blur', commit);
};

const removeCollection = async (id) => {
  const col   = allCollections.find((c) => c.id === id);
  if (!col) return;
  const count = allMocks.filter((m) => m.collectionId === id).length;
  const msg   = count
    ? \`Remover "\${col.name}" e seus \${count} mock(s)?\`
    : \`Remover collection "\${col.name}"?\`;
  const ok = await confirmDialog(msg, { okLabel: 'Remover', danger: true });
  if (!ok) return;
  await fetch(\`/mocks/collections/\${id}\`, { method: 'DELETE' });
  if (activeColId === id) activeColId = null;
  if (currentMockId && allMocks.find((m) => m.id === currentMockId)?.collectionId === id) {
    currentMockId = null;
    hideEditorPanel();
  }
  await loadMocksData();
};

// ══════════════════════════════════════════
// Mocks list
// ══════════════════════════════════════════

const METHOD_CLS = {
  GET: 'method-get', POST: 'method-post', PUT: 'method-put',
  PATCH: 'method-patch', DELETE: 'method-delete',
  HEAD: 'method-gray', OPTIONS: 'method-gray',
};

const renderMocksList = () => {
  const list    = $('mocks-list');
  const heading = $('mocks-list-heading');
  if (!list) return;

  const filtered = activeColId
    ? allMocks.filter((m) => m.collectionId === activeColId)
    : allMocks;

  if (heading) {
    const col     = allCollections.find((c) => c.id === activeColId);
    heading.textContent = col ? col.name : 'Todos os mocks';
  }

  if (!filtered.length) {
    list.innerHTML = \`<div class="mocks-list-empty">
      <span data-icon="share"></span>
      <span>Nenhum mock aqui.<br>Crie o primeiro.</span>
    </div>\`;
    hydrateIcons(list);
    return;
  }

  // Agrupa por group (string vazia = sem grupo)
  const groups = new Map();
  for (const mock of filtered) {
    const g = mock.group || '';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(mock);
  }

  // Ungrouped primeiro, depois grupos nomeados em ordem
  const sortedGroups = [
    ...(groups.has('') ? [['', groups.get('')]] : []),
    ...[...groups.entries()].filter(([g]) => g !== '').sort(([a], [b]) => a.localeCompare(b)),
  ];

  let html = '';
  for (const [group, mocks] of sortedGroups) {
    if (group) {
      html += \`<div class="mocks-group-sep">
        <span class="mocks-group-line"></span>
        <span class="mocks-group-label">\${escHtml(group)}</span>
        <span class="mocks-group-line"></span>
      </div>\`;
    }
    html += mocks.map((m) => {
      const active  = m.id === currentMockId ? ' active' : '';
      const mCls    = METHOD_CLS[m.method] ?? 'method-gray';
      const colName = !activeColId
        ? allCollections.find((c) => c.id === m.collectionId)?.name ?? ''
        : '';
      return \`<div class="mocks-item\${active}" data-id="\${m.id}" onclick="openMockEditor('\${m.id}')">
        <span class="mock-method-badge \${mCls}">\${escHtml(m.method)}</span>
        <div class="mock-item-info">
          <span class="mock-item-path">\${escHtml(m.path)}</span>
          \${m.name ? \`<span class="mock-item-name">\${escHtml(m.name)}</span>\` : ''}
        </div>
        \${colName ? \`<span class="mock-item-col">\${escHtml(colName)}</span>\` : ''}
      </div>\`;
    }).join('');
  }

  list.innerHTML = html;
};

// ══════════════════════════════════════════
// Editor
// ══════════════════════════════════════════

const DEFAULT_SCRIPT = \`// ctx: { method, path, params, query, headers, body }
// db:  { get, set, delete, has, list, keys, clear, size }
return {
  status: 200,
  body: {
    message: "ok",
    params: ctx.params,
    query:  ctx.query,
  }
};\`;

const openMockEditor = (id) => {
  const mock = allMocks.find((m) => m.id === id);
  if (!mock) return;
  currentMockId = id;
  renderMocksList();
  showEditorForm(mock);
};

const newMock = () => {
  if (!allCollections.length) {
    toast('Crie uma collection primeiro');
    return;
  }
  currentMockId = null;
  const col = allCollections.find((c) => c.id === activeColId) ?? allCollections[0];
  renderMocksList();
  showEditorForm({
    collectionId: col?.id ?? '',
    method: 'GET',
    path: '',
    name: '',
    group: '',
    script: DEFAULT_SCRIPT,
  });
  setTimeout(() => $('mock-path-input')?.focus(), 50);
};

const showEditorForm = (mock) => {
  const empty = $('mocks-editor-empty');
  const form  = $('mocks-editor-form');
  if (empty) empty.style.display = 'none';
  if (form)  form.style.display  = 'flex';

  populateCollectionSelect(mock.collectionId);
  updateMethodSelectColor(mock.method);

  $('mock-method-select').value = mock.method ?? 'GET';
  $('mock-path-input').value    = mock.path   ?? '';
  $('mock-name-input').value    = mock.name   ?? '';
  $('mock-group-input').value   = mock.group  ?? '';

  initScriptEditor();
  editorSet(mock.script ?? DEFAULT_SCRIPT);

  const badge   = $('mock-id-badge');
  const delBtn  = $('btn-mock-delete');
  const isNew   = !mock.id;

  if (badge) {
    badge.textContent   = isNew ? '— novo mock —' : \`\${mock.method}  \${mock.path}\`;
    badge.dataset.method = mock.method ?? 'GET';
  }
  if (delBtn) delBtn.style.display = isNew ? 'none' : 'inline-flex';

  hideTestPanel();
};

const hideEditorPanel = () => {
  const empty = $('mocks-editor-empty');
  const form  = $('mocks-editor-form');
  if (empty) empty.style.display = 'flex';
  if (form)  form.style.display  = 'none';
};

const populateCollectionSelect = (selectedId) => {
  const sel = $('mock-collection-select');
  if (!sel) return;
  sel.innerHTML = allCollections.length
    ? allCollections.map((c) =>
        \`<option value="\${c.id}"\${c.id === selectedId ? ' selected' : ''}>\${escHtml(c.name)}</option>\`
      ).join('')
    : \`<option value="">— sem collections —</option>\`;
};

const updateMethodSelectColor = (method) => {
  const sel = $('mock-method-select');
  if (!sel) return;
  sel.dataset.method = method ?? 'GET';
};

const saveMock = async () => {
  const colId  = $('mock-collection-select').value;
  const method = $('mock-method-select').value;
  const path   = $('mock-path-input').value.trim();
  const name   = $('mock-name-input').value.trim();
  const group  = $('mock-group-input').value.trim();
  const script = editorGet();

  if (!colId)         { toast('Selecione uma collection'); return; }
  if (!path)          { $('mock-path-input').focus();      return; }
  if (!script.trim()) { editorFocus();                     return; }

  const body = { collectionId: colId, method, path, name, group, script };

  if (currentMockId) {
    await fetch(\`/mocks/\${currentMockId}\`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } else {
    const res     = await fetch('/mocks', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const created = await res.json();
    currentMockId = created.id;
  }

  await loadMocksData();
  toast('Mock salvo');

  // Atualiza badge
  const badge = $('mock-id-badge');
  if (badge) {
    badge.textContent    = \`\${method}  \${path}\`;
    badge.dataset.method = method;
  }
  $('btn-mock-delete') && ($('btn-mock-delete').style.display = 'inline-flex');
};

const deleteCurrentMock = async () => {
  if (!currentMockId) return;
  const mock = allMocks.find((m) => m.id === currentMockId);
  const ok   = await confirmDialog(
    \`Remover mock "\${mock?.method ?? ''} \${mock?.path ?? ''}"?\`,
    { okLabel: 'Remover', danger: true },
  );
  if (!ok) return;
  await fetch(\`/mocks/\${currentMockId}\`, { method: 'DELETE' });
  currentMockId = null;
  hideEditorPanel();
  await loadMocksData();
};

// ── Method select color sync ──
const onMethodChange = (sel) => updateMethodSelectColor(sel.value);

// ══════════════════════════════════════════
// Test panel
// ══════════════════════════════════════════

const extractPathParams = (path) =>
  [...(path.matchAll(/:(\\w+)/g))].map((m) => m[1]);

const showTestPanel = () => {
  const path  = $('mock-path-input').value.trim();
  const panel = $('mock-test-panel');
  if (!panel || !path) return;

  panel.style.display = 'flex';

  const params    = extractPathParams(path);
  const paramsEl  = $('mock-test-params');
  if (paramsEl) {
    if (params.length) {
      paramsEl.style.display = 'block';
      paramsEl.innerHTML     = \`<div class="test-params-label">Path params</div>\` +
        params.map((p) =>
          \`<div class="test-param-row">
            <span class="test-param-name">:\${escHtml(p)}</span>
            <input class="test-param-input" id="test-param-\${escHtml(p)}" value="1" spellcheck="false"/>
          </div>\`
        ).join('');
    } else {
      paramsEl.innerHTML     = '';
      paramsEl.style.display = 'none';
    }
  }

  $('mock-test-result') && ($('mock-test-result').style.display = 'none');
};

const hideTestPanel = () => {
  const panel = $('mock-test-panel');
  if (panel) panel.style.display = 'none';
};

const runTest = async () => {
  const path   = $('mock-path-input').value.trim();
  const method = $('mock-method-select').value;
  if (!path) return;

  const params = extractPathParams(path);
  let resolved = path;
  for (const p of params) {
    const val = $(\`test-param-\${p}\`)?.value || '1';
    resolved  = resolved.replace(\`:\${p}\`, encodeURIComponent(val));
  }

  const btn = $('btn-test-run');
  if (btn) { btn.disabled = true; btn.textContent = 'Chamando…'; }

  try {
    const t0   = performance.now();
    const res  = await fetch(\`\${MOCK_SERVER}\${resolved}\`, { method });
    const ms   = Math.round(performance.now() - t0);
    const text = await res.text();

    let bodyDisplay;
    try {
      bodyDisplay = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      bodyDisplay = text;
    }

    renderTestResult({ status: res.status, ms, body: bodyDisplay, ok: res.ok });
  } catch (err) {
    renderTestResult({ status: 0, ms: 0, body: String(err), ok: false });
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Executar'; }
  }
};

const renderTestResult = ({ status, ms, body, ok }) => {
  const el = $('mock-test-result');
  if (!el) return;
  el.style.display = 'flex';

  const sCls   = ok ? 'test-status-ok' : 'test-status-err';
  const sLabel = status ? String(status) : 'ERR';

  el.innerHTML = \`
    <div class="test-result-meta">
      <span class="test-status-badge \${sCls}">\${escHtml(sLabel)}</span>
      \${ms ? \`<span class="test-ms">\${ms}ms</span>\` : ''}
    </div>
    <pre class="test-body">\${escHtml(body)}</pre>
  \`;
};

// ══════════════════════════════════════════
// Clear
// ══════════════════════════════════════════

// Zera os mocks de uma collection sem deletá-la.
// Chamado pelo botão do footer (contextual) e pelo botão − do hover.
const clearCollectionMocks = async (id) => {
  const col   = allCollections.find((c) => c.id === id);
  if (!col) return;
  const count = allMocks.filter((m) => m.collectionId === id).length;
  if (!count) { toast(\`"\${col.name}" já está vazia\`); return; }

  const ok = await confirmDialog(
    \`Zerar banco de "\${col.name}"?\\n\${count} mock(s) serão removidos. A collection será mantida.\`,
    { okLabel: 'Zerar banco', danger: true },
  );
  if (!ok) return;

  await fetch(\`/mocks/collections/\${id}/clear\`, { method: 'DELETE' });
  if (currentMockId && allMocks.find((m) => m.id === currentMockId)?.collectionId === id) {
    currentMockId = null;
    hideEditorPanel();
  }
  await loadMocksData();
  toast(\`Banco de "\${col.name}" zerado\`);
};

// Botão do rodapé: contextual à collection selecionada.
// Se nenhuma collection ativa, zera tudo (collections + mocks).
const clearMockDatabase = async () => {
  if (activeColId) {
    await clearCollectionMocks(activeColId);
    return;
  }

  // Nenhuma collection selecionada → zerar tudo
  const total = allMocks.length;
  const cols  = allCollections.length;
  if (!total && !cols) { toast('Banco já está vazio'); return; }

  const ok = await confirmDialog(
    \`Zerar tudo?\\n\${cols} collection(s) e \${total} mock(s) serão removidos permanentemente.\`,
    { okLabel: 'Zerar tudo', danger: true },
  );
  if (!ok) return;

  await fetch('/mocks/clear', { method: 'DELETE' });
  activeColId   = null;
  currentMockId = null;
  hideEditorPanel();
  await loadMocksData();
  toast('Banco de mocks zerado');
};

// ══════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════

const formatScript = () => {
  if (typeof js_beautify === 'undefined') {
    toast('Formatter não carregado ainda');
    return;
  }
  const code = editorGet();
  if (!code.trim()) return;

  const formatted = js_beautify(code, {
    indent_size:                2,
    indent_char:                ' ',
    max_preserve_newlines:      2,
    preserve_newlines:          true,
    keep_array_indentation:     false,
    break_chained_methods:      false,
    brace_style:                'collapse',
    space_before_conditional:   true,
    unescape_strings:           false,
    jslint_happy:               false,
    end_with_newline:           false,
    wrap_line_length:           0,
    comma_first:                false,
    e4x:                        false,
    indent_empty_lines:         false,
  });

  editorSet(formatted);
};

const copyCurl = () => {
  const method = $('mock-method-select').value;
  const path   = $('mock-path-input').value.trim();
  if (!path) { toast('Defina o path primeiro'); return; }

  // Substitui :param por valor de exemplo
  const resolved = path.replace(/:(\\w+)/g, '1');
  const url      = \`\${MOCK_SERVER}\${resolved}\`;

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const parts   = [\`curl -X \${method}\`];
  if (hasBody) parts.push(\`-H 'Content-Type: application/json'\`, \`-d '{}'\`);
  parts.push(\`'\${url}'\`);

  copyToClipboard(parts.join(' \\\\\\n  '), 'curl copiado');
};

const updateServerBadge = () => {
  const el = $('mocks-server-count');
  if (el) el.dataset.count = String(allMocks.length);
};

const updateClearBtn = () => {
  const btn = $('mocks-clear-btn');
  const lbl = btn?.querySelector('.mocks-clear-label');
  if (!lbl) return;
  if (activeColId) {
    const col  = allCollections.find((c) => c.id === activeColId);
    lbl.textContent = col ? \`Zerar "\${col.name}"\` : 'Zerar banco';
  } else {
    lbl.textContent = 'Zerar tudo';
  }
};

const updateGroupsDatalist = () => {
  const dl = $('mock-groups-list');
  if (!dl) return;
  const groups = [...new Set(allMocks.map((m) => m.group).filter(Boolean))].sort();
  dl.innerHTML = groups.map((g) => \`<option value="\${escHtml(g)}"></option>\`).join('');
};

</script>
<script>
// ════ Favorites / Bookmarks Manager ════

const FAV_TYPES = {
  site:   { label: 'SITE'   },
  slack:  { label: 'SLACK'  },
  grid:   { label: 'GRID'   },
  dash:   { label: 'DASH'   },
  github: { label: 'GITHUB' },
};

const FAV_CATEGORIES = [
  { id: 'all',        label: 'Todos',       icon: '◈' },
  { id: 'produto',    label: 'Produto',     icon: '◆' },
  { id: 'design',     label: 'Design',      icon: '✦' },
  { id: 'metricas',   label: 'Métricas',    icon: '◉' },
  { id: 'docs',       label: 'Docs',        icon: '◎' },
  { id: 'referencia', label: 'Referência',  icon: '◇' },
  { id: 'devops',     label: 'DevOps',      icon: '⬡' },
  { id: 'arquitetura',label: 'Arquitetura', icon: '⬢' },
  { id: 'incidentes', label: 'Incidentes',  icon: '▲' },
];

const FAV_PAGE_SIZE = 30;

let favAll       = [];
let favPage      = 1;
let favState     = { search: '', category: 'all', type: 'all', tag: null };
let favModalTags = [];
let favModalType = 'site';
let favModalCat  = '';
let favEditing   = null;

// ─────────────────────────────────────
//  API
// ─────────────────────────────────────

const loadFavoritesData = async () => {
  try {
    const res = await fetch('/favorites');
    favAll = await res.json();
    renderFavSidebar();
    renderFavorites();
  } catch (err) {
    console.error('Erro ao carregar favoritos:', err);
  }
};

// ─────────────────────────────────────
//  Filtering
// ─────────────────────────────────────

const getFiltered = () => {
  let items = favAll;

  if (favState.category !== 'all') {
    const catLabel = FAV_CATEGORIES.find(c => c.id === favState.category)?.label ?? '';
    items = items.filter(b => b.category.toLowerCase() === catLabel.toLowerCase());
  }

  if (favState.type !== 'all') {
    items = items.filter(b => b.type === favState.type);
  }

  if (favState.tag) {
    items = items.filter(b => b.tags.includes(favState.tag));
  }

  if (favState.search) {
    const q = favState.search.toLowerCase();
    items = items.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q)) ||
      b.note.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  return items;
};

// counts ignoring the type filter (for tab counts)
const getBaseFiltered = () => {
  let items = favAll;
  if (favState.category !== 'all') {
    const catLabel = FAV_CATEGORIES.find(c => c.id === favState.category)?.label ?? '';
    items = items.filter(b => b.category.toLowerCase() === catLabel.toLowerCase());
  }
  if (favState.tag) items = items.filter(b => b.tags.includes(favState.tag));
  if (favState.search) {
    const q = favState.search.toLowerCase();
    items = items.filter(b =>
      b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) ||
      b.tags.some(t => t.includes(q)) || b.note.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }
  return items;
};

// ─────────────────────────────────────
//  Highlight
// ─────────────────────────────────────

const favHl = (text) => {
  if (!favState.search) return escHtml(text);
  const safe = favState.search.replace(/[.*+?^\${}()|[\\]\\\\]/g, (c) => '\\\\' + c);
  return escHtml(text).replace(
    new RegExp(safe, 'gi'),
    (m) => '<mark class="fav-hl">' + m + '</mark>',
  );
};

// ─────────────────────────────────────
//  Sidebar
// ─────────────────────────────────────

const renderFavSidebar = () => {
  const catList = document.getElementById('fav-cat-list');
  const tagCloud = document.getElementById('fav-tag-cloud');
  if (!catList || !tagCloud) return;

  const counts = {};
  favAll.forEach(b => {
    const k = b.category.toLowerCase();
    counts[k] = (counts[k] || 0) + 1;
  });

  catList.innerHTML = FAV_CATEGORIES.map(cat => {
    const count = cat.id === 'all'
      ? favAll.length
      : (counts[cat.label.toLowerCase()] || 0);
    return \`
      <div class="fav-cat-item \${favState.category === cat.id ? 'active' : ''}" data-cat="\${cat.id}">
        <span class="fav-cat-left">
          <span class="fav-cat-icon">\${cat.icon}</span>
          \${escHtml(cat.label)}
        </span>
        <span class="fav-cat-count">\${count}</span>
      </div>
    \`;
  }).join('');

  catList.querySelectorAll('.fav-cat-item').forEach(el => {
    el.addEventListener('click', () => {
      favState.category = el.dataset.cat;
      favState.type = 'all';
      favPage = 1;
      updateFavTypeTabs();
      renderFavSidebar();
      renderFavorites();
    });
  });

  const tagCounts = {};
  favAll.forEach(b => b.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 22);

  tagCloud.innerHTML = topTags.map(([tag]) =>
    \`<span class="fav-tag \${favState.tag === tag ? 'active' : ''}" data-tag="\${escHtml(tag)}">#\${escHtml(tag)}</span>\`
  ).join('');

  tagCloud.querySelectorAll('.fav-tag').forEach(el => {
    el.addEventListener('click', () => {
      favState.tag = favState.tag === el.dataset.tag ? null : el.dataset.tag;
      favPage = 1;
      renderFavSidebar();
      renderFavorites();
    });
  });
};

// ─────────────────────────────────────
//  Type tabs
// ─────────────────────────────────────

const updateFavTypeTabs = () => {
  const base = getBaseFiltered();
  const g    = { site: 0, slack: 0, grid: 0, dash: 0, github: 0 };
  base.forEach(b => { if (g[b.type] !== undefined) g[b.type]++; });

  const s = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
  s('fav-count-all',    base.length);
  s('fav-count-site',   g.site);
  s('fav-count-slack',  g.slack);
  s('fav-count-grid',   g.grid);
  s('fav-count-dash',   g.dash);
  s('fav-count-github', g.github);

  document.querySelectorAll('.fav-type-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === favState.type);
  });
};

// ─────────────────────────────────────
//  Main render
// ─────────────────────────────────────

const renderFavorites = () => {
  const filtered = getFiltered();
  const grid     = document.getElementById('fav-grid');
  const empty    = document.getElementById('fav-empty');
  const mvSection = document.getElementById('fav-most-visited');
  if (!grid || !empty) return;

  updateFavTypeTabs();

  // Most visited — only when no active filter/search
  const noFilter = !favState.search && favState.category === 'all' &&
                   favState.type === 'all' && !favState.tag;
  const topVisited = favAll.filter(b => b.accessCount > 0).slice(0, 5);

  if (mvSection) {
    if (noFilter && topVisited.length > 0) {
      mvSection.style.display = 'block';
      renderFeaturedCards(topVisited);
    } else {
      mvSection.style.display = 'none';
    }
  }

  // Grid
  const countEl = document.getElementById('fav-result-count');
  if (countEl) countEl.textContent = \`\${filtered.length} link\${filtered.length !== 1 ? 's' : ''}\`;

  if (filtered.length === 0) {
    grid.style.display  = 'none';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.style.display  = 'grid';

  const totalPages = Math.max(1, Math.ceil(filtered.length / FAV_PAGE_SIZE));
  if (favPage > totalPages) favPage = totalPages;

  const start     = (favPage - 1) * FAV_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + FAV_PAGE_SIZE);

  grid.innerHTML = '';
  pageItems.forEach((b, i) => grid.appendChild(buildFavCard(b, i)));

  renderFavPagination(filtered.length, totalPages);
};

// ─────────────────────────────────────
//  Featured cards (most visited)
// ─────────────────────────────────────

const renderFeaturedCards = (items) => {
  const row = document.getElementById('fav-featured-row');
  if (!row) return;

  row.innerHTML = items.map(b => \`
    <div class="fav-featured-card" data-type="\${b.type}" data-id="\${b.id}" data-url="\${escHtml(b.url)}">
      <div class="fav-featured-title">\${escHtml(b.title)}</div>
      <div class="fav-featured-url">\${escHtml(b.url)}</div>
      <div class="fav-featured-footer">
        <span class="fav-type-badge">\${FAV_TYPES[b.type]?.label ?? b.type}</span>
        <span class="fav-access-badge">\${b.accessCount} visita\${b.accessCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  \`).join('');

  row.querySelectorAll('.fav-featured-card').forEach(card => {
    card.addEventListener('click', () => openFavLink(card.dataset.id, card.dataset.url));
  });
};

// ─────────────────────────────────────
//  Pagination
// ─────────────────────────────────────

const renderFavPagination = (total, totalPages) => {
  const el = document.getElementById('fav-pagination');
  if (!el) return;

  if (totalPages <= 1) { el.innerHTML = ''; return; }

  const pages = [];
  // Always show first, last, current ±2
  const range = new Set([1, totalPages]);
  for (let p = Math.max(1, favPage - 2); p <= Math.min(totalPages, favPage + 2); p++) range.add(p);
  const sorted = [...range].sort((a, b) => a - b);

  let html = \`<div class="fav-page-info">\${total} links · página \${favPage} de \${totalPages}</div><div class="fav-page-btns">\`;

  html += \`<button class="fav-page-btn" data-p="\${favPage - 1}" \${favPage === 1 ? 'disabled' : ''}>←</button>\`;

  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) html += \`<span class="fav-page-gap">…</span>\`;
    html += \`<button class="fav-page-btn \${p === favPage ? 'active' : ''}" data-p="\${p}">\${p}</button>\`;
    prev = p;
  }

  html += \`<button class="fav-page-btn" data-p="\${favPage + 1}" \${favPage === totalPages ? 'disabled' : ''}>→</button>\`;
  html += '</div>';

  el.innerHTML = html;

  el.querySelectorAll('.fav-page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      favPage = Number(btn.dataset.p);
      const grid = document.getElementById('fav-grid');
      const scroll = document.getElementById('fav-scroll');
      renderFavorites();
      // Sobe para o topo do scroll ao trocar de página
      if (scroll) scroll.scrollTop = 0;
    });
  });
};

// ─────────────────────────────────────
//  Build card
// ─────────────────────────────────────

const buildFavCard = (b, index) => {
  const el = document.createElement('div');
  el.className = 'fav-card';
  el.dataset.type = b.type;
  el.dataset.id   = b.id;
  el.style.animationDelay = \`\${index * 22}ms\`;

  const dateStr   = new Date(b.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const typeLabel = FAV_TYPES[b.type]?.label ?? b.type.toUpperCase();

  el.innerHTML = \`
    <div class="fav-card-top">
      <span class="fav-type-badge">\${typeLabel}</span>
      <div class="fav-card-actions">
        <button class="fav-action-btn" title="Abrir" data-action="open">\${ICON('external-link')}</button>
        <button class="fav-action-btn" title="Editar" data-action="edit">\${ICON('pencil')}</button>
        <button class="fav-action-btn danger" title="Remover" data-action="delete">\${ICON('trash')}</button>
      </div>
    </div>
    <div class="fav-card-title">\${favHl(b.title)}</div>
    <div class="fav-card-url">\${favHl(b.url)}</div>
    \${b.note ? \`<div class="fav-card-note">\${favHl(b.note)}</div>\` : ''}
    <div class="fav-card-footer">
      <div class="fav-card-tags">
        \${b.tags.map(t => \`<span class="fav-card-tag" data-tag="\${escHtml(t)}">#\${escHtml(t)}</span>\`).join('')}
      </div>
      <div class="fav-card-meta">
        <span class="fav-card-cat">\${escHtml(b.category)}</span>
        <span class="fav-card-date">\${dateStr}</span>
      </div>
    </div>
  \`;

  el.querySelector('[data-action="open"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openFavLink(b.id, b.url);
  });
  el.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openFavEditModal(b);
  });
  el.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteFav(b.id);
  });
  el.querySelectorAll('.fav-card-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      favState.tag = favState.tag === tag.dataset.tag ? null : tag.dataset.tag;
      renderFavSidebar();
      renderFavorites();
    });
  });
  el.addEventListener('dblclick', () => openFavLink(b.id, b.url));

  return el;
};

// ─────────────────────────────────────
//  Open link + record access
// ─────────────────────────────────────

const openFavLink = async (id, url) => {
  // Webview não suporta window.open — usa endpoint do servidor para abrir no browser padrão
  fetch('/system/open-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(() => {});

  try {
    const res     = await fetch(\`/favorites/\${id}/access\`, { method: 'PUT' });
    const updated = await res.json();
    const idx     = favAll.findIndex(b => b.id === id);
    if (idx !== -1) {
      favAll[idx] = updated;
      favAll.sort((a, b) => {
        if (b.accessCount !== a.accessCount) return b.accessCount - a.accessCount;
        return b.createdAt.localeCompare(a.createdAt);
      });
    }
  } catch { /* silencioso */ }
};

// ─────────────────────────────────────
//  Delete
// ─────────────────────────────────────

const deleteFav = async (id) => {
  try {
    await fetch(\`/favorites/\${id}\`, { method: 'DELETE' });
    favAll = favAll.filter(b => b.id !== id);
    renderFavSidebar();
    renderFavorites();
    toast('Favorito removido');
  } catch {
    toast('Erro ao remover');
  }
};

// ─────────────────────────────────────
//  Modal helpers
// ─────────────────────────────────────

const favDetectType = (url) => {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('slack.com'))                                                     return 'slack';
  if (u.includes('grid.adminml') || u.includes('grid.melioffice'))                 return 'grid';
  if (u.includes('datadog') || u.includes('grafana') || u.includes('amplitude') ||
      u.includes('kibana')  || u.includes('dashboard'))                            return 'dash';
  if (u.includes('github.com') || u.includes('github.dev') ||
      u.includes('githubusercontent'))                                              return 'github';
  return 'site';
};

const favSuggestTitle = (url) => {
  try {
    const u     = new URL(url.startsWith('http') ? url : \`https://\${url}\`);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length) {
      return parts[parts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\\.\\w+$/, '')
        .replace(/\\b\\w/g, c => c.toUpperCase());
    }
    return u.hostname.replace(/^www\\./, '');
  } catch { return ''; }
};

const selectFavModalType = (type) => {
  favModalType = type;
  document.querySelectorAll('.fav-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.t === type);
  });
  const modal = document.getElementById('fav-modal');
  if (modal) modal.dataset.detected = type;
};

const renderFavModalTags = () => {
  const wrap  = document.getElementById('fav-modal-tags-wrap');
  const input = document.getElementById('fav-modal-tags-input');
  if (!wrap || !input) return;

  wrap.querySelectorAll('.fav-tag-chip').forEach(c => c.remove());
  favModalTags.forEach((tag, i) => {
    const chip = document.createElement('span');
    chip.className = 'fav-tag-chip';
    chip.innerHTML = \`#\${escHtml(tag)} <span class="fav-tag-chip-rm" data-i="\${i}">×</span>\`;
    chip.querySelector('.fav-tag-chip-rm').addEventListener('click', () => {
      favModalTags.splice(i, 1);
      renderFavModalTags();
    });
    wrap.insertBefore(chip, input);
  });
};

const renderFavModalCats = () => {
  const sel = document.getElementById('fav-cat-sel');
  if (!sel) return;
  sel.innerHTML = FAV_CATEGORIES.filter(c => c.id !== 'all').map(cat =>
    \`<button class="fav-cat-sel-btn \${favModalCat === cat.label ? 'active' : ''}" data-cat="\${escHtml(cat.label)}">\${escHtml(cat.label)}</button>\`
  ).join('');
  sel.querySelectorAll('.fav-cat-sel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      favModalCat = favModalCat === btn.dataset.cat ? '' : btn.dataset.cat;
      renderFavModalCats();
    });
  });
};

// ─────────────────────────────────────
//  Open modal (add)
// ─────────────────────────────────────

const openFavAddModal = () => {
  favEditing   = null;
  favModalTags = [];
  favModalType = 'site';
  favModalCat  = '';

  const titleText = document.getElementById('fav-modal-title-text');
  if (titleText) titleText.textContent = '⚡ Novo Favorito';

  const urlEl   = document.getElementById('fav-modal-url');
  const titleEl = document.getElementById('fav-modal-title');
  const noteEl  = document.getElementById('fav-modal-note');
  const detEl   = document.getElementById('fav-url-detected');

  if (urlEl)   { urlEl.value = '';   urlEl.dataset.auto = '0'; }
  if (titleEl) { titleEl.value = ''; titleEl.dataset.auto = '0'; }
  if (noteEl)  noteEl.value = '';
  if (detEl)   detEl.className = 'fav-url-detected';

  const modal = document.getElementById('fav-modal');
  if (modal) modal.dataset.detected = '';

  selectFavModalType('site');
  renderFavModalTags();
  renderFavModalCats();

  document.getElementById('fav-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('fav-modal-url')?.focus(), 80);
};

// ─────────────────────────────────────
//  Open modal (edit)
// ─────────────────────────────────────

const openFavEditModal = (b) => {
  favEditing   = b;
  favModalTags = [...b.tags];
  favModalType = b.type;
  favModalCat  = b.category;

  const titleText = document.getElementById('fav-modal-title-text');
  if (titleText) titleText.textContent = '✏️ Editar Favorito';

  const urlEl   = document.getElementById('fav-modal-url');
  const titleEl = document.getElementById('fav-modal-title');
  const noteEl  = document.getElementById('fav-modal-note');

  if (urlEl)   urlEl.value   = b.url;
  if (titleEl) titleEl.value = b.title;
  if (noteEl)  noteEl.value  = b.note;

  selectFavModalType(b.type);
  renderFavModalTags();
  renderFavModalCats();

  document.getElementById('fav-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('fav-modal-title')?.focus(), 80);
};

const closeFavModal = () => {
  document.getElementById('fav-modal-overlay')?.classList.remove('open');
};

// ─────────────────────────────────────
//  Save
// ─────────────────────────────────────

const saveFavorite = async () => {
  const url   = document.getElementById('fav-modal-url')?.value.trim() ?? '';
  const title = document.getElementById('fav-modal-title')?.value.trim() ?? '';

  if (!url || !title) { toast('Preencha a URL e o título'); return; }

  const payload = {
    type:     favModalType,
    title,
    url,
    category: favModalCat || 'Produto',
    tags:     [...favModalTags],
    note:     document.getElementById('fav-modal-note')?.value.trim() ?? '',
  };

  try {
    if (favEditing) {
      const res     = await fetch(\`/favorites/\${favEditing.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      const idx     = favAll.findIndex(b => b.id === favEditing.id);
      if (idx !== -1) favAll[idx] = updated;
      toast('Favorito atualizado');
    } else {
      const res     = await fetch('/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      favAll.unshift(created);
      toast('Favorito salvo');
    }

    closeFavModal();
    renderFavSidebar();
    renderFavorites();
  } catch {
    toast('Erro ao salvar favorito');
  }
};

// ─────────────────────────────────────
//  Init — wires all events once on load
// ─────────────────────────────────────

const initFavorites = () => {
  // URL auto-detect + auto-title
  document.getElementById('fav-modal-url')?.addEventListener('input', (e) => {
    const url  = e.target.value.trim();
    const type = favDetectType(url);
    const det  = document.getElementById('fav-url-detected');

    if (type && url.length > 5) {
      det.className = \`fav-url-detected visible \${type}\`;
      det.textContent = FAV_TYPES[type].label;
      selectFavModalType(type);
    } else if (det) {
      det.className = 'fav-url-detected';
    }

    const titleEl = document.getElementById('fav-modal-title');
    if (titleEl && (!titleEl.value || titleEl.dataset.auto === '1')) {
      const suggested = favSuggestTitle(url);
      if (suggested) { titleEl.value = suggested; titleEl.dataset.auto = '1'; }
    }
  });

  document.getElementById('fav-modal-title')?.addEventListener('input', (e) => {
    e.target.dataset.auto = '0';
  });

  // Tags input
  document.getElementById('fav-modal-tags-input')?.addEventListener('keydown', (e) => {
    const val = e.target.value.trim().replace(/^#/, '');
    if ((e.key === 'Enter' || e.key === ',') && val) {
      e.preventDefault();
      if (!favModalTags.includes(val)) { favModalTags.push(val); renderFavModalTags(); }
      e.target.value = '';
    } else if (e.key === 'Backspace' && !e.target.value && favModalTags.length) {
      favModalTags.pop();
      renderFavModalTags();
    }
  });

  document.getElementById('fav-modal-tags-wrap')?.addEventListener('click', () => {
    document.getElementById('fav-modal-tags-input')?.focus();
  });

  // Type buttons
  document.querySelectorAll('.fav-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selectFavModalType(btn.dataset.t));
  });

  // Modal open/close
  document.getElementById('fav-add-btn')?.addEventListener('click', openFavAddModal);
  document.getElementById('fav-modal-close')?.addEventListener('click', closeFavModal);
  document.getElementById('fav-modal-cancel')?.addEventListener('click', closeFavModal);
  document.getElementById('fav-modal-save')?.addEventListener('click', saveFavorite);

  document.getElementById('fav-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'fav-modal-overlay') closeFavModal();
  });

  // Search
  const searchEl = document.getElementById('fav-search');
  const clearEl  = document.getElementById('fav-search-clear');

  searchEl?.addEventListener('input', (e) => {
    favState.search = e.target.value;
    favPage = 1;
    clearEl?.classList.toggle('visible', !!e.target.value);
    renderFavorites();
  });

  clearEl?.addEventListener('click', () => {
    if (searchEl) searchEl.value = '';
    favState.search = '';
    favPage = 1;
    clearEl.classList.remove('visible');
    searchEl?.focus();
    renderFavorites();
  });

  // Type tabs
  document.querySelectorAll('.fav-type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      favState.type = tab.dataset.type;
      favPage = 1;
      renderFavorites();
    });
  });

  // Keyboard shortcuts (only active in favorites mode)
  document.addEventListener('keydown', (e) => {
    if (currentMode !== 'favorites') return;

    const modalOpen = document.getElementById('fav-modal-overlay')?.classList.contains('open');

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (!modalOpen) openFavAddModal();
    }

    if (e.key === 'Escape' && modalOpen) closeFavModal();

    if (e.key === 'Enter' && modalOpen) {
      const inTags = document.activeElement?.closest('#fav-modal-tags-wrap');
      if (!inTags) { e.preventDefault(); saveFavorite(); }
    }

    // / to focus search when not in an input
    if (!modalOpen && e.key === '/' && !document.activeElement?.closest('input, textarea')) {
      e.preventDefault();
      searchEl?.focus();
    }
  });
};

document.addEventListener('DOMContentLoaded', initFavorites);

</script>
<script>
// ════ Sistema — update, backup, restore ════

let updateInfo = null;

const initSystem = async () => {
  try {
    const res = await fetch('/system');
    const data = await res.json();
    updateInfo = data.update;
    if (updateInfo?.available) showUpdateBanner(updateInfo);
  } catch { /* offline — ignora */ }
};

const showUpdateBanner = (upd) => {
  $('update-text').textContent = \`Nova versão \${upd.latest} disponível (você tem \${upd.current}).\`;
  $('update-apply').style.display = upd.assetUrl ? 'inline-block' : 'none';
  $('update-banner').classList.add('visible');
};

const dismissUpdate = () => $('update-banner').classList.remove('visible');

const applyUpdate = async () => {
  const ok = await confirmDialog('Baixar e instalar a nova versão? O app precisará ser reiniciado.', { okLabel: 'Atualizar' });
  if (!ok) return;
  toast('Baixando atualização…');
  try {
    const res = await fetch('/system/update', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      dismissUpdate();
      await confirmDialog('Atualização instalada. Feche e abra o app novamente.', { okLabel: 'Ok' });
    } else {
      toast(data.message || 'Falha ao atualizar');
    }
  } catch { toast('Falha ao atualizar'); }
};

// ── Backup ──
const downloadBackup = async () => {
  try {
    const res  = await fetch('/system/backup', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      // modal com caminho copiável — toast some rápido demais
      $('modal-msg').innerHTML =
        \`Backup salvo com <strong>\${data.entries} itens</strong>.<br><br>\` +
        \`<code id="backup-path-text" style="word-break:break-all;font-size:12px;">\${escHtml(data.path)}</code>\`;
      $('modal-ok').textContent   = '⧉ Copiar caminho';
      $('modal-cancel').textContent = 'Fechar';
      $('modal-ok').classList.remove('danger');
      $('modal-overlay').classList.add('visible');
      $('modal-ok').onclick = () => {
        copyToClipboard(data.path, 'Caminho copiado');
        $('modal-overlay').classList.remove('visible');
      };
      $('modal-cancel').onclick = () => $('modal-overlay').classList.remove('visible');
    } else {
      toast('Falha no backup');
    }
  } catch { toast('Falha no backup'); }
};

// ── Copiar skill para IA ──
const copySkill = async () => {
  try {
    const res = await fetch('/system/skill');
    const md = await res.text();
    copyToClipboard(md, 'Skill copiada — cole numa IA');
  } catch { toast('Falha ao copiar skill'); }
};

const triggerRestore = async () => {
  const ok = await confirmDialog('Selecionar um arquivo de backup para restaurar?\\nOs dados atuais serão mesclados.', { okLabel: 'Escolher arquivo' });
  if (!ok) return;
  try {
    const res  = await fetch('/system/restore-pick', { method: 'POST' });
    const data = await res.json();
    if (data.cancelled) return;
    if (data.ok) {
      toast(\`\${data.imported} itens restaurados\`);
      loadNotesList();
    } else {
      toast('Falha ao restaurar');
    }
  } catch { toast('Erro ao restaurar'); }
};

document.addEventListener('DOMContentLoaded', initSystem);

</script>
<script>
// ════ AI Chat — provider-agnostic via proxy /ai/chat ════
// Backend escolhe adapter (ollama | deepseek) e devolve NDJSON normalizado.
// A chave da DeepSeek nunca chega ao webview.

const DOCMAP_API = 'http://127.0.0.1:3333';

// DELETE bloqueado em http_request — proteção contra ações destrutivas acidentais
const BLOCKED_METHODS = ['DELETE'];

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'http_request',
      description: 'Faz uma requisição HTTP para a API do docmap. Use para ler e criar notas, diagramas, skills e macros.',
      parameters: {
        type: 'object',
        required: ['method', 'path'],
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT'], description: 'Método HTTP. DELETE não é permitido.' },
          path:   { type: 'string', description: 'Caminho da API. Ex: /notes, /diagrams, /skills/nome' },
          body:   { type: 'object', description: 'Body JSON para POST e PUT (opcional)', properties: {}, additionalProperties: true },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lê o conteúdo bruto de um arquivo no workspace atual.',
      parameters: {
        type: 'object',
        required: ['file'],
        properties: {
          file: { type: 'string', description: 'Caminho relativo do arquivo no workspace. Ex: src/main.ts' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'Lista todos os arquivos do workspace atual, opcionalmente filtrados por padrão.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex opcional para filtrar caminhos. Ex: \\\\.md$, src/.*\\\\.ts' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_code',
      description: 'Busca texto em qualquer arquivo do workspace (não só markdown).',
      parameters: {
        type: 'object',
        required: ['q'],
        properties: {
          q:     { type: 'string', description: 'Termo de busca' },
          glob:  { type: 'string', description: 'Filtro de caminho estilo glob. Ex: src/**/*.ts' },
          regex: { type: 'boolean', description: 'Se true, trata q como regex' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_status',
      description: 'Retorna git status --porcelain do workspace.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_diff',
      description: 'Retorna git diff do workspace (alterações não commitadas).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'git_log',
      description: 'Retorna git log --oneline recente.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Quantidade de commits (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Executa um comando no terminal dentro do workspace. SEMPRE peça aprovação do usuário antes de usar. Use apenas para linters ou comandos de análise (ex: deno lint, eslint).',
      parameters: {
        type: 'object',
        required: ['command'],
        properties: {
          command: { type: 'string', description: 'Comando principal. Ex: deno' },
          args:    { type: 'array', items: { type: 'string' }, description: 'Argumentos. Ex: ["lint", "src/"]' },
        },
      },
    },
  },
];

// system prompt normal vem do endpoint /system/skill
let systemPrompt = null;
const getSystemPrompt = async () => {
  if (systemPrompt) return systemPrompt;
  try {
    const res = await fetch('/system/skill');
    systemPrompt = await res.text();
  } catch {
    systemPrompt = 'Você é um assistente do docmap. Use as ferramentas disponíveis para interagir com o workspace, notas e diagramas.';
  }
  return systemPrompt;
};

// ── Estado ──
let chatMessages  = [];
let chatOpen      = false;
let chatStreaming = false;
let chatAbort     = null;
let chatProvider  = 'ollama';  // default; sobrescrito no boot por /ai/config
let chatMinimized = false;
let chatDragged   = false;
let chatDrag      = { active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

const CHAT_LAYOUT_KEY = 'docmap-chat-layout';

// ── Provider config (persiste no KV) ──
const loadProvider = async () => {
  try {
    const res = await fetch('/ai/config');
    if (!res.ok) return;
    const cfg = await res.json();
    chatProvider = cfg.provider ?? 'ollama';
    const sel = $('chat-provider');
    if (sel) sel.value = chatProvider;
    if (cfg.deepseekKey === false) {
      const opt = sel?.querySelector('option[value="deepseek"]');
      if (opt) opt.disabled = true;
    }
  } catch { /* ignora — fica no default */ }
};

const changeProvider = async (provider) => {
  if (provider === chatProvider) return;
  if (chatStreaming) return;
  try {
    const res = await fetch('/ai/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    if (!res.ok) {
      const sel = $('chat-provider');
      if (sel) sel.value = chatProvider;
      return;
    }
    chatProvider = provider;
    chatMessages = [];
    $('chat-feed').innerHTML = '';
    appendChatBubble('assistant', \`Provider trocado para \${provider}. Histórico limpo. Como posso ajudar?\`);
  } catch { /* ignora */ }
};

// ── Executar tool ──
const executeTool = async (toolCall) => {
  const args = toolCall.function.arguments;
  const params = typeof args === 'string' ? JSON.parse(args) : args;
  const name = toolCall.function.name;

  if (name === 'http_request') {
    const method = (params.method || 'GET').toUpperCase();
    const path   = params.path || '/';
    const body   = params.body;

    if (BLOCKED_METHODS.includes(method)) {
      return { error: \`Método \${method} bloqueado por segurança.\` };
    }

    try {
      const res = await fetch(\`\${DOCMAP_API}\${path}\`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      try { return JSON.parse(text); } catch { return { response: text }; }
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'read_file') {
    const file = params.file;
    if (!file) return { error: 'file é obrigatório' };
    try {
      const res = await fetch(\`\${DOCMAP_API}/content?file=\${encodeURIComponent(file)}\`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'list_files') {
    const qs = params.pattern ? \`?pattern=\${encodeURIComponent(params.pattern)}\` : '';
    try {
      const res = await fetch(\`\${DOCMAP_API}/workspace/files\${qs}\`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'search_code') {
    const q = params.q;
    if (!q) return { error: 'q é obrigatório' };
    const qp = new URLSearchParams({ q });
    if (params.glob) qp.set('glob', params.glob);
    if (params.regex) qp.set('regex', 'true');
    try {
      const res = await fetch(\`\${DOCMAP_API}/code/search?\${qp.toString()}\`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'git_status') {
    try {
      const res = await fetch(\`\${DOCMAP_API}/git/status\`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'git_diff') {
    try {
      const res = await fetch(\`\${DOCMAP_API}/git/diff\`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'git_log') {
    const limit = params.limit ?? 20;
    try {
      const res = await fetch(\`\${DOCMAP_API}/git/log?limit=\${limit}\`);
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === 'run_command') {
    const command = params.command;
    const args    = params.args || [];
    if (!command) return { error: 'command é obrigatório' };

    const fullCmd = [command, ...args].join(' ');
    const ok = await confirmDialog(\`Permitir execução do comando?\\n\\n\${fullCmd}\`, { okLabel: 'Executar' });
    if (!ok) return { blocked: true, reason: 'Usuário cancelou a execução.' };

    try {
      const res = await fetch(\`\${DOCMAP_API}/run\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, args }),
      });
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  return { error: \`Tool desconhecida: \${name}\` };
};

// ── Chamar o proxy /ai/chat (provider-agnostic, stream NDJSON) ──
const callProvider = async (messages) => {
  const controller = new AbortController();
  chatAbort = controller;

  // timeout de 5 minutos — evita travamento com modelos pesados
  let timedOut = false;
  const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, 300000);

  const res = await fetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      messages,
      tools: TOOLS,
      provider: chatProvider,
    }),
  });

  if (!res.ok) throw new Error(\`proxy /ai/chat \${res.status}: \${await res.text()}\`);

  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let buf = '';
  let fullContent = '';
  let toolCalls = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        if (chunk.error) throw new Error(chunk.error);
        if (chunk.content) {
          fullContent += chunk.content;
          streamToChat(chunk.content);
        }
        if (chunk.toolCalls?.length) {
          toolCalls = toolCalls.concat(chunk.toolCalls);
        }
      } catch (err) {
        if (err.message && err.message !== 'Unexpected end of JSON input') throw err;
      }
    }
  }

  clearTimeout(timeoutId);
  if (timedOut) throw new Error('Timeout: o modelo demorou mais de 5 minutos para responder.');
  return { content: fullContent, toolCalls };
};

// ── Enviar mensagem (com tool loop) ──
const sendChatMessage = async () => {
  if (chatStreaming) return;
  const input = $('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = '';

  const prompt = await getSystemPrompt();
  if (!chatMessages.length) {
    chatMessages.push({ role: 'system', content: prompt });
  }

  chatMessages.push({ role: 'user', content: text });
  appendChatBubble('user', text);

  setChatStreaming(true);
  const assistantEl = appendChatBubble('assistant', '');

  try {
    let messages = [...chatMessages];

    while (true) {
      const { content, toolCalls } = await callProvider(messages);

      if (!toolCalls.length) {
        chatMessages.push({ role: 'assistant', content });
        break;
      }

      messages.push({ role: 'assistant', content, tool_calls: toolCalls });
      chatMessages.push({ role: 'assistant', content, tool_calls: toolCalls });

      for (const tc of toolCalls) {
        const result = await executeTool(tc);
        appendToolCall(tc.function.name, tc.function.arguments, result);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        chatMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }

      // reseta o stream element para o próximo ciclo criar um novo bubble
      currentStreamEl = appendChatBubble('assistant', '');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      appendChatBubble('error', \`Erro: \${err.message}\`);
    }
  } finally {
    chatAbort = null;
    setChatStreaming(false);
  }
};

// ── UI helpers ──
let currentStreamEl = null;

const appendChatBubble = (role, text) => {
  const feed = $('chat-feed');
  const div  = document.createElement('div');
  div.className = \`chat-bubble chat-\${role}\`;
  if (text) div.textContent = text;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  currentStreamEl = role === 'assistant' ? div : null;
  return div;
};

const streamToChat = (chunk) => {
  if (!currentStreamEl) return;
  currentStreamEl.textContent += chunk;
  $('chat-feed').scrollTop = $('chat-feed').scrollHeight;
};

const appendToolCall = (name, args, result) => {
  const feed = $('chat-feed');
  const div = document.createElement('div');
  div.className = 'chat-tool-call';
  const argsObj = typeof args === 'string' ? JSON.parse(args) : args;
  const summary = toolCallSummary(name, argsObj);
  const resultStr = JSON.stringify(result);
  const bodyStr = argsObj.body ? JSON.stringify(argsObj.body, null, 2) : null;

  div.innerHTML =
    \`<div class="tool-summary-row">\` +
      \`<button class="tool-toggle" title="Ver detalhes">▶</button>\` +
      \`<span class="tool-name">\${escHtml(name)}</span> \` +
      \`<span class="tool-summary">\${escHtml(summary)}</span>\` +
    \`</div>\` +
    \`<div class="tool-details">\` +
      (bodyStr ? \`<div class="tool-body">\${escHtml(bodyStr)}</div>\` : '') +
      \`<div class="tool-result">\${escHtml(resultStr.slice(0, 500))}\${resultStr.length > 500 ? '…' : ''}</div>\` +
    \`</div>\`;

  div.querySelector('.tool-toggle').addEventListener('click', (e) => {
    const open = div.querySelector('.tool-details').classList.toggle('open');
    e.currentTarget.textContent = open ? '▼' : '▶';
  });

  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
};

const toolCallSummary = (name, args) => {
  if (name === 'http_request') return \`\${args.method || 'GET'} \${args.path || '/'}\`;
  if (name === 'read_file')    return args.file;
  if (name === 'list_files')   return args.pattern || 'todos';
  if (name === 'search_code')  return \`\${args.q}\${args.glob ? \` glob:\${args.glob}\` : ''}\`;
  if (name === 'git_status')   return 'git status';
  if (name === 'git_diff')     return 'git diff';
  if (name === 'git_log')      return \`git log -n\${args.limit || 20}\`;
  if (name === 'run_command')  return \`\${args.command} \${(args.args || []).join(' ')}\`;
  return JSON.stringify(args);
};

const setChatStreaming = (on) => {
  chatStreaming = on;
  const btn  = $('chat-send');
  const stop = $('chat-stop');
  btn.disabled    = on;
  stop.style.display = on ? 'flex' : 'none';
};

// ── Layout: posição e minimização ──
const loadChatLayout = () => {
  try {
    const raw = localStorage.getItem(CHAT_LAYOUT_KEY);
    if (!raw) return;
    const layout = JSON.parse(raw);
    if (typeof layout.minimized === 'boolean') chatMinimized = layout.minimized;
    if (layout.left != null && layout.top != null) {
      const panel = $('chat-panel');
      panel.classList.add('dragged');
      panel.style.left = \`\${layout.left}px\`;
      panel.style.top = \`\${layout.top}px\`;
      chatDragged = true;
    }
    applyMinimizeState();
  } catch { /* ignora layout corrompido */ }
};

const saveChatLayout = () => {
  try {
    const panel = $('chat-panel');
    const layout = { minimized: chatMinimized };
    if (chatDragged) {
      layout.left = parseInt(panel.style.left || '0', 10);
      layout.top = parseInt(panel.style.top || '0', 10);
    }
    localStorage.setItem(CHAT_LAYOUT_KEY, JSON.stringify(layout));
  } catch { /* ignora quota excedida */ }
};

const applyMinimizeState = () => {
  const panel = $('chat-panel');
  const icon = $('chat-minimize-icon');
  panel.classList.toggle('minimized', chatMinimized);
  if (icon) {
    icon.dataset.icon = chatMinimized ? 'maximize' : 'minus';
    icon.dataset.hydrated = '';
    icon.innerHTML = ICON(chatMinimized ? 'maximize' : 'minus');
    icon.dataset.hydrated = '1';
  }
  const btn = $('chat-minimize');
  if (btn) btn.title = chatMinimized ? 'Expandir' : 'Minimizar';
};

const toggleMinimizeChat = () => {
  chatMinimized = !chatMinimized;
  applyMinimizeState();
  saveChatLayout();
};

const clampChatPosition = (left, top) => {
  const panel = $('chat-panel');
  const rect = panel.getBoundingClientRect();
  const minVisible = 48;
  const maxLeft = window.innerWidth - minVisible;
  const maxTop = window.innerHeight - minVisible;
  return {
    left: Math.max(minVisible - rect.width, Math.min(left, maxLeft)),
    top: Math.max(minVisible - rect.height, Math.min(top, maxTop)),
  };
};

const startChatDrag = (e) => {
  if (e.button !== 0) return;
  if (e.target.closest('#chat-provider, .ghost-btn')) return;

  const panel = $('chat-panel');
  const rect = panel.getBoundingClientRect();
  chatDrag.active = true;
  chatDrag.startX = e.clientX;
  chatDrag.startY = e.clientY;
  chatDrag.startLeft = rect.left;
  chatDrag.startTop = rect.top;

  panel.classList.add('dragged');
  panel.style.left = \`\${rect.left}px\`;
  panel.style.top = \`\${rect.top}px\`;
  panel.style.right = 'auto';
  panel.style.transform = 'none';

  window.addEventListener('mousemove', onChatDrag);
  window.addEventListener('mouseup', stopChatDrag);
  e.preventDefault();
};

const onChatDrag = (e) => {
  if (!chatDrag.active) return;
  const dx = e.clientX - chatDrag.startX;
  const dy = e.clientY - chatDrag.startY;
  const { left, top } = clampChatPosition(chatDrag.startLeft + dx, chatDrag.startTop + dy);
  const panel = $('chat-panel');
  panel.style.left = \`\${left}px\`;
  panel.style.top = \`\${top}px\`;
};

const stopChatDrag = () => {
  if (!chatDrag.active) return;
  chatDrag.active = false;
  chatDragged = true;
  window.removeEventListener('mousemove', onChatDrag);
  window.removeEventListener('mouseup', stopChatDrag);
  saveChatLayout();
};

// ── Abrir / fechar FAB ──
const toggleChat = () => {
  chatOpen = !chatOpen;
  const panel = $('chat-panel');
  panel.classList.toggle('open', chatOpen);
  $('chat-fab').classList.toggle('active', chatOpen);
  if (chatOpen) {
    if (chatDragged) {
      panel.style.transform = 'none';
      panel.style.right = 'auto';
    }
    if (!chatMessages.length) {
      appendChatBubble('assistant', 'Olá! Posso acessar suas notas, diagramas, skills e macros. Como posso ajudar?');
    }
    setTimeout(() => $('chat-input').focus(), 150);
  }
};

const stopChat = () => {
  chatAbort?.abort();
  chatAbort = null;
  setChatStreaming(false);
};

const clearChat = async () => {
  const ok = await confirmDialog('Limpar o histórico da conversa?', { okLabel: 'Limpar' });
  if (!ok) return;
  chatMessages = [];
  $('chat-feed').innerHTML = '';
  appendChatBubble('assistant', 'Histórico limpo. Como posso ajudar?');
};

// ── Event listeners ──
document.addEventListener('DOMContentLoaded', () => {
  loadProvider();
  loadChatLayout();

  const sel = $('chat-provider');
  if (sel) sel.addEventListener('change', (e) => changeProvider(e.target.value));

  $('chat-header').addEventListener('mousedown', startChatDrag);

  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  $('chat-input').addEventListener('input', function() {
    this.style.height = '';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOpen) toggleChat();
  });
});

</script>
</body>
</html>
`;
