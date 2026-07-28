// AUTO-GENERATED — não edite. Rode: deno task bundle-ui
export const UI_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>docmap — atlas de documentação</title>
    <script>
    (function () {
      var t = localStorage.getItem('docmap-theme');
      if (t) document.documentElement.dataset.theme = t;
    })();
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Onest:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet">
    <script
      src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <script src="https://cdn.jsdelivr.net/npm/markmap-view"></script>
    <script
      src="https://cdn.jsdelivr.net/npm/markmap-lib/dist/browser/index.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/shell/shell.min.js"></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js"></script>
    <style>
:root {
  /* ── Surfaces (near-black, layered) ── */
  --bg: #0b0c0e;
  --surface: #101216;
  --surface-2: #16191f;
  --surface-3: #1e222a;
  --surface-4: #262b34;

  /* ── Borders ── */
  --border: #22262e;
  --border-soft: rgba(255,255,255,.05);
  --border-mid: rgba(255,255,255,.09);
  --border-hi: rgba(255,255,255,.16);

  /* ── Text ── */
  --text: #edeef1;
  --text-2: #9ca3af;
  --text-3: #626976;
  --text-4: #454b56;

  /* ── Accent (emerald) ── */
  --accent: #37d99a;
  --accent-2: #29c088;
  --accent-dim: rgba(55,217,154,.14);
  --accent-line: rgba(55,217,154,.35);
  --on-accent: #06120d;

  /* ── Graph categories ── */
  --cat-entry: #fbbf24;
  --cat-arch: #60a5fa;
  --cat-design: #f472b6;
  --cat-security: #fb7185;
  --cat-process: #94a3b8;
  --cat-default: #6b7280;

  /* ── Annotation / note types ── */
  --type-note: #94a3b8;
  --type-decision: #60a5fa;
  --type-question: #fbbf24;
  --type-todo: #37d99a;
  --type-warning: #fb7185;
  --type-reference: #a78bfa;
  --type-general: #94a3b8;

  /* ── Typography ── */
  --font-ui: 'Geist', 'Onest', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', monospace;

  /* ── Metrics ── */
  /* Breakpoints usados nas @media queries: 600px (mobile), 900px (tablet) */
  --rail-w: 60px;
  --r-xs: 5px;
  --r-sm: 7px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;

  /* ── Elevation ── */
  --sh-sm: 0 1px 2px rgba(0,0,0,.4);
  --sh-md: 0 8px 24px rgba(0,0,0,.45);
  --sh-lg: 0 20px 60px rgba(0,0,0,.6);
  --glow: 0 0 0 1px var(--accent-line), 0 4px 20px rgba(55,217,154,.18);

}

/* ════════ Light theme ════════ */
:root[data-theme='light'] {
  --bg: #f6f7f9;
  --surface: #ffffff;
  --surface-2: #eef0f4;
  --surface-3: #e3e6ec;
  --surface-4: #d6dae2;

  --border: #d4d8e0;
  --border-soft: rgba(0,0,0,.05);
  --border-mid: rgba(0,0,0,.10);
  --border-hi: rgba(0,0,0,.18);

  --text: #1a1d23;
  --text-2: #525a68;
  --text-3: #828b9a;
  --text-4: #aab2bf;

  --accent: #0e9f6e;
  --accent-2: #0b8a5e;
  --accent-dim: rgba(14,159,110,.12);
  --accent-line: rgba(14,159,110,.32);
  --on-accent: #ffffff;

  --sh-sm: 0 1px 2px rgba(0,0,0,.08);
  --sh-md: 0 8px 24px rgba(0,0,0,.10);
  --sh-lg: 0 20px 60px rgba(0,0,0,.14);
  --glow: 0 0 0 1px var(--accent-line), 0 4px 20px rgba(14,159,110,.14);
}

</style>
    <style>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

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
    radial-gradient(900px 500px at 12% -8%, rgba(55,217,154,.06), transparent
    60%),
    radial-gradient(700px 500px at 100% 0%, rgba(96,165,250,.045), transparent
    55%);
  pointer-events: none;
  z-index: 0;
}

/* ════════ Icons ════════ */
[data-icon] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.ico {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  display: block;
}
.rail-ico .ico {
  width: 21px;
  height: 21px;
}
#rail-logo .ico {
  width: 19px;
  height: 19px;
}
#search-icon .ico {
  width: 16px;
  height: 16px;
}
.fit-btn .ico {
  width: 19px;
  height: 19px;
}
#no-workspace-mark .ico {
  width: 30px;
  height: 30px;
}
#map-empty-mark .ico,
#notes-editor-empty-mark .ico {
  width: 28px;
  height: 28px;
}
.map-tab .ico {
  width: 16px;
  height: 16px;
}

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
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  font-size: 18px;
  color: var(--on-accent);
  background: var(--accent);
  border-radius: 9px;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(55,217,154,.3);
  cursor: pointer;
  transition: all .2s;
}
#rail-logo:hover {
  box-shadow: 0 4px 20px rgba(55,217,154,.45);
  transform: scale(1.06);
}
.rail-btn {
  width: 48px;
  height: 52px;
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
  transition: color .15s, background .15s, width .25s, height .25s;
  position: relative;
}
.rail-lbl {
  transition: opacity .2s;
}
.rail-btn:hover {
  background: var(--surface-2);
  color: var(--text-2);
}
.rail-btn.active {
  color: var(--accent);
  background: var(--accent-dim);
}
.rail-btn.active::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}
.rail-ico {
  font-size: 19px;
  line-height: 1;
}
.rail-lbl {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: .01em;
}
.rail-spacer {
  flex: 1;
}

/* ── Sidebar panel collapse (logo toggle) ── */
#notes-col, #macros-col, #skills-col, #diag-col, #mocks-col, #fav-sidebar, #pod-col {
  transition: width .25s cubic-bezier(.3,0,.2,1), opacity .2s, padding .25s, border-right-width .25s;
}
/* Compound selectors vencem especificidade de ID sem !important */
.col-collapsed#notes-col,
.col-collapsed#macros-col,
.col-collapsed#skills-col,
.col-collapsed#diag-col,
.col-collapsed#mocks-col,
.col-collapsed#fav-sidebar,
.col-collapsed#pod-col {
  width: 0;
  min-width: 0;
  flex-shrink: 1;
  overflow: hidden;
  padding-left: 0;
  padding-right: 0;
  border-right-width: 0;
  opacity: 0;
  pointer-events: none;
}

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
#update-banner.visible {
  display: flex;
}
#update-text {
  flex: 1;
}
#update-text strong {
  color: var(--accent);
}
#update-apply,
#update-dismiss {
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
#update-apply {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
#update-apply:hover {
  background: var(--accent-2);
}
#update-dismiss {
  border-color: transparent;
  background: transparent;
  color: var(--text-2);
}
#update-dismiss:hover {
  color: var(--text);
}

/* ════════ Modes (fill remaining height) ════════ */
.mode {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.mode:not(.active) {
  display: none;
}
.mode.active {
  display: flex;
}
#mode-map {
  flex-direction: column;
}
#mode-canvas {
  flex-direction: column;
}
#canvas-container {
  flex: 1;
  min-height: 0;
  position: relative;
}
#canvas-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

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
.map-tab:hover {
  color: var(--text);
  background: var(--surface-2);
}
.map-tab.active {
  color: var(--accent);
  background: var(--accent-dim);
  border-color: var(--accent-line);
}
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
#map-open-btn:hover {
  border-color: var(--border-hi);
  color: var(--text);
  background: var(--surface-2);
}
#map-open-btn .ico {
  width: 14px;
  height: 14px;
}

/* ════════ Map panes (fill) ════════ */
#map-panes {
  flex: 1;
  min-height: 0;
  position: relative;
}
.map-pane {
  position: absolute;
  inset: 0;
  display: none;
}
.map-pane.active {
  display: flex;
}

/* ════════ Confirm modal ════════ */
#modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6,7,9,.6);
  backdrop-filter: blur(2px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 800;
}
#modal-overlay.visible {
  display: flex;
}
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
#modal-msg {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  margin-bottom: 20px;
}
#modal-actions {
  display: flex;
  gap: 9px;
  justify-content: flex-end;
}
#modal-ok.danger {
  background: var(--cat-security);
  border-color: var(--cat-security);
  color: #fff;
}
#modal-ok.danger:hover {
  filter: brightness(1.1);
}

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
  bottom: 24px;
  left: 50%;
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
#toast.visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* ════════ Settings Modal ════════ */
#settings-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  z-index: 750;
  align-items: center;
  justify-content: center;
}
#settings-overlay.open {
  display: flex;
}
#settings-modal {
  width: 360px;
  background: var(--surface);
  border: 1px solid var(--border-hi);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-lg);
  overflow: hidden;
  animation: settingsIn .18s ease-out;
}
@keyframes settingsIn {
  from { opacity: 0; transform: scale(.94) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
#settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 700;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}
#settings-header [data-icon] {
  margin-right: 8px;
  color: var(--accent);
}
#settings-header [data-icon] .ico {
  width: 18px;
  height: 18px;
}
#settings-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  transition: all .12s;
}
#settings-close:hover {
  background: var(--surface-3);
  color: var(--text);
}
#settings-close .ico {
  width: 16px;
  height: 16px;
}
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  transition: background .1s;
  border-bottom: 1px solid var(--border-soft);
}
.settings-row:last-child {
  border-bottom: none;
}
.settings-row:hover {
  background: var(--surface-2);
}
.settings-row-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.settings-row-value {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}
.settings-row-hint {
  font-size: 11px;
  color: var(--text-3);
  font-family: var(--font-mono);
}

/* ════════ Scrollbars ════════ */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: var(--surface-4);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-4);
  background-clip: padding-box;
}

/* ════════ Responsivo: ≤ 900px (tablet / janela pequena) ════════ */
@media (max-width: 900px) {
  /* Sidebars: larguras reduzidas definidas nos arquivos de cada modo.
     Apenas regras globais (modais) ficam aqui. */

  /* Modais não estouram a tela */
  #settings-modal {
    max-width: calc(100vw - 32px);
    max-height: 90vh;
    overflow-y: auto;
  }
}

/* ════════ Responsivo: ≤ 600px (mobile / janela muito pequena) ════════ */
@media (max-width: 600px) {
  /* Body: empilhar verticalmente (cada painel interno tem seu proprio scroll) */
  body {
    flex-direction: column;
  }

  /* Rail lateral vira barra horizontal inferior */
  #rail {
    flex-direction: row;
    width: 100%;
    height: auto;
    padding: 6px 8px;
    gap: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  #rail-logo {
    margin-bottom: 0;
    margin-right: 6px;
    width: 28px;
    height: 28px;
    font-size: 14px;
    border-radius: 7px;
    flex-shrink: 0;
  }
  .rail-btn {
    width: 40px;
    height: 42px;
    gap: 2px;
    flex-shrink: 0;
  }
  .rail-btn.active::before {
    display: none; /* accent bar lateral não faz sentido em row */
  }
  .rail-lbl {
    font-size: 8px;
  }
  .rail-spacer {
    display: none;
  }

  /* Stage ocupa altura restante */
  #stage {
    flex: 1;
    min-height: 0;
  }

  /* Modais ocupam quase toda a tela */
  #settings-modal {
    width: calc(100vw - 24px);
    max-width: none;
    margin: 12px;
    border-radius: var(--r-md);
  }

  /* Toast não estoura a tela */
  #toast {
    max-width: calc(100vw - 32px);
    left: 50%;
    transform: translate(-50%, 14px);
    white-space: normal;
    text-align: center;
  }
  #toast.visible {
    transform: translate(-50%, 0);
  }
}

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
#markmap-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
#markmap-filename {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -.01em;
  line-height: 1.1;
}
#markmap-filepath {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#markmap-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

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
.pill-btn:hover {
  border-color: var(--border-hi);
  color: var(--text);
  background: var(--surface-3);
}
.pill-btn.active {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--accent-line);
}
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
.pill-btn.active .pill-count {
  background: var(--accent);
  color: var(--on-accent);
}

#markmap-container,
#note-markmap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
#markmap-container svg,
#note-markmap svg {
  width: 100% !important;
  height: 100% !important;
}

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
#note-markmap .markmap-foreign a {
  color: var(--accent) !important;
}
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
  bottom: 18px;
  right: 18px;
  display: none;
  flex-direction: column;
  gap: 7px;
  z-index: 15;
}
#markmap-tools.visible {
  display: flex;
}
.mm-tool {
  width: 34px;
  height: 34px;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  position: static;
}
.mm-tool .ico {
  width: 17px;
  height: 17px;
}
.mm-tool:hover {
  border-color: var(--accent-line);
  color: var(--accent);
  transform: translateY(-1px);
}

#markmap-hint {
  display: none;
  position: absolute;
  bottom: 18px;
  left: 50%;
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
#markmap-hint.visible {
  display: block;
}

/* ── Floating comment button ── */
#markmap-comment-btn {
  display: none;
  position: fixed;
  z-index: 100;
  transform: translateX(-50%);
  padding: 6px 14px;
  border: 1px solid var(--accent-line);
  border-radius: var(--r-xl);
  background: var(--accent);
  color: var(--on-accent);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--sh-md);
  pointer-events: auto;
  opacity: 0;
  transition: opacity .12s ease, transform .12s ease;
}
#markmap-comment-btn.visible {
  display: block;
  opacity: 1;
  animation: popIn .15s ease;
}
#markmap-comment-btn:hover {
  background: var(--accent-2);
  transform: translateX(-50%) translateY(-1px);
}
#markmap-comment-btn::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid var(--accent);
}

/* ── Empty state ── */
#map-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  pointer-events: none;
}
#map-empty-mark {
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  font-size: 30px;
  color: var(--text-4);
  border: 1px dashed var(--border-mid);
  border-radius: 18px;
  animation: float 4s ease-in-out infinite;
}
#map-empty-text {
  font-size: 13.5px;
  color: var(--text-3);
  max-width: 280px;
  text-align: center;
  line-height: 1.5;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

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
#annot-panel.visible {
  display: flex;
}

#annot-head {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#annot-head-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .01em;
  color: var(--text-2);
}
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
.ghost-btn:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}

#annot-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
#annot-empty {
  padding: 22px 18px;
  text-align: center;
  color: var(--text-3);
  font-size: 12px;
}

.annot-item {
  padding: 11px 18px;
  border-bottom: 1px solid var(--border-soft);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.annot-item:last-child {
  border-bottom: none;
}
.annot-type-bar {
  width: 3px;
  align-self: stretch;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
}
.annot-main {
  flex: 1;
  min-width: 0;
}
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
.annot-type-label {
  font-size: 10px;
  font-weight: 700;
  margin-left: 8px;
}
.annot-note {
  font-size: 12.5px;
  color: var(--text);
  line-height: 1.5;
}
.annot-actions {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
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
.annot-btn .ico {
  width: 13px;
  height: 13px;
}
.annot-btn:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}
.annot-btn.del:hover {
  border-color: var(--cat-security);
  color: var(--cat-security);
}

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
#annot-popover.visible {
  display: block;
  animation: popIn .15s ease;
}
@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

#pop-head {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 15px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
#pop-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--accent);
  flex-shrink: 0;
  padding-top: 2px;
}
#pop-quote {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.45;
  word-break: break-word;
}

#pop-types {
  display: flex;
  gap: 6px;
  padding: 12px 15px 0;
  flex-wrap: wrap;
}
.type-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
  margin-right: 5px;
  vertical-align: middle;
  transform: rotate(45deg);
}
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
.type-btn:hover {
  border-color: var(--border-hi);
  color: var(--text);
}
.type-btn.active {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

#pop-body {
  padding: 12px 15px 0;
}
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
#pop-textarea:focus {
  border-color: var(--accent-line);
}
#pop-textarea::placeholder {
  color: var(--text-3);
}

#pop-foot {
  display: flex;
  gap: 8px;
  padding: 12px 15px 14px;
  justify-content: flex-end;
}
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
.pop-btn:hover {
  border-color: var(--border-hi);
  color: var(--text);
}
.pop-btn.primary {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
.pop-btn.primary:hover {
  background: var(--accent-2);
}
#pop-delete {
  color: var(--cat-security);
}
#pop-delete:hover {
  border-color: var(--cat-security);
}

/* ════════ Responsivo ════════ */
@media (max-width: 600px) {
  #annot-popover {
    width: calc(100vw - 24px);
    max-width: none;
    left: 12px !important;
    right: 12px;
    border-radius: var(--r-md);
    z-index: 550; /* acima do agent panel overlay (z-index:500) */
  }
  #annot-panel {
    height: 180px;
  }
  #annot-head {
    padding: 8px 12px;
  }
  #annot-list {
    padding: 4px 0;
  }
  .annot-item {
    padding: 8px 12px;
    gap: 8px;
  }
  #pop-types {
    padding: 10px 12px 0;
    gap: 4px;
  }
  .type-btn {
    padding: 3px 8px;
    font-size: 10px;
  }
  #pop-body {
    padding: 10px 12px 0;
  }
  #pop-textarea {
    height: 70px;
    font-size: 12px;
  }
  #pop-foot {
    padding: 10px 12px 12px;
    gap: 6px;
  }
  .pop-btn {
    padding: 6px 12px;
    font-size: 11px;
  }
}

</style>
    <style>
/* ════════ Notes mode ════════ */
#mode-notes {
  background: var(--bg);
}

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
#notes-col-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--text);
  flex: 1;
}
#notes-new-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--on-accent);
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all .15s;
  box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#notes-new-btn:hover {
  background: var(--accent-2);
  transform: scale(1.08);
}

#notes-search-box {
  padding: 0 18px 10px;
  flex-shrink: 0;
}

#notes-filters {
  padding: 0 18px 12px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}
#notes-filter-cat,
#notes-filter-tag {
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
#notes-filter-cat:focus,
#notes-filter-tag:focus {
  border-color: var(--accent-line);
}
#notes-filter-cat option,
#notes-filter-tag option {
  background: var(--surface-3);
  color: var(--text);
}
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
#notes-search-input:focus {
  border-color: var(--accent-line);
}
#notes-search-input::placeholder {
  color: var(--text-3);
}

#notes-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.notes-empty {
  padding: 34px 22px;
  text-align: center;
  color: var(--text-3);
  font-size: 12.5px;
  line-height: 1.7;
}
.notes-empty strong {
  color: var(--accent);
}

.note-item {
  padding: 13px 18px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background .1s;
  border-left: 2px solid transparent;
}
.note-item:hover {
  background: var(--surface-2);
}
.note-item.active {
  background: var(--surface-2);
  border-left-color: var(--accent);
}
.note-item.active .note-item-title {
  color: var(--accent);
}
.note-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.note-cat-dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}
.note-item-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.note-item-preview {
  font-size: 11.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}
.note-item-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 7px;
}
.note-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 1px 7px;
  border-radius: var(--r-xl);
  background: var(--surface-3);
  color: var(--text-3);
  border: 1px solid var(--border);
}

/* ── Editor column ── */
#notes-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
#notes-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-3);
}
#notes-editor-empty.hidden {
  display: none;
}
#notes-editor-empty-mark {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  font-size: 28px;
  color: var(--text-4);
  border: 1px dashed var(--border-mid);
  border-radius: 18px;
}
#notes-editor-empty-text {
  font-size: 14px;
}

#notes-editor-form {
  display: none;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
#notes-editor-form.visible {
  display: flex;
}

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
#note-title-input::placeholder {
  color: var(--text-4);
}
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
#note-id-badge:hover {
  color: var(--accent);
  border-color: var(--accent-line);
}

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
.note-head-btn:hover {
  border-color: var(--accent-line);
  color: var(--accent);
}
.note-head-btn.active {
  color: var(--accent);
  border-color: var(--accent-line);
  background: var(--accent-dim);
}
.note-head-btn .ico {
  width: 14px;
  height: 14px;
}

#note-markmap {
  flex: 1;
  display: none;
  min-height: 0;
  overflow: hidden;
  background: var(--surface);
}
#note-markmap.visible {
  display: block;
}

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
#note-cat-field:focus-within {
  border-color: var(--accent-line);
}
#note-cat-field .note-cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  transform: rotate(45deg);
  box-shadow: 0 0 6px currentColor;
}
#note-cat-input {
  width: 110px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text);
}
#note-cat-input::placeholder {
  color: var(--text-3);
}

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
#note-tags-input:focus {
  border-color: var(--accent-line);
}
#note-tags-input::placeholder {
  color: var(--text-3);
}

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
.tool-btn:hover {
  border-color: var(--border-hi);
  color: var(--text);
}
.tool-btn.primary {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
.tool-btn.primary:hover {
  background: var(--accent-2);
}
.tool-btn.danger:hover {
  border-color: var(--cat-security);
  color: var(--cat-security);
}

#note-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}
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
#note-content-textarea::placeholder {
  color: var(--text-3);
}
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
#note-preview.visible {
  display: block;
}
#note-preview h1,
#note-preview h2,
#note-preview h3 {
  font-weight: 700;
  margin: 22px 0 10px;
  line-height: 1.2;
  letter-spacing: -.01em;
}
#note-preview h1 {
  font-size: 25px;
}
#note-preview h2 {
  font-size: 20px;
}
#note-preview h3 {
  font-size: 16px;
}
#note-preview p {
  margin: 10px 0;
  color: var(--text);
}
#note-preview code {
  font-family: var(--font-mono);
  background: var(--surface-3);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--accent);
}
#note-preview pre {
  background: var(--surface-2);
  padding: 14px;
  border-radius: var(--r-sm);
  overflow-x: auto;
  margin: 14px 0;
  border: 1px solid var(--border);
}
#note-preview pre code {
  background: none;
  padding: 0;
  color: var(--text);
}
#note-preview blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 15px;
  color: var(--text-2);
  margin: 12px 0;
}
#note-preview ul,
#note-preview ol {
  padding-left: 24px;
  margin: 10px 0;
}
#note-preview li {
  margin: 4px 0;
}
#note-preview a {
  color: var(--accent);
}
#note-preview hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 20px 0;
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  #notes-col {
    width: 240px;
  }
  #note-toolbar {
    flex-wrap: wrap;
    gap: 6px;
  }
  #note-head {
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 16px 10px;
  }
  #note-title-input {
    font-size: 20px;
  }
}

@media (max-width: 600px) {
  #mode-notes {
    flex-direction: column;
    position: relative;
  }

  /* Sidebar escondida por padrão no mobile — clique no ◆ para abrir */
  #notes-col {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: none;
    transition: max-height 0.25s ease;
  }
  /* toggleSidebar() adiciona .col-collapsed → revela a lista */
  #notes-col.col-collapsed {
    max-height: 60vh;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
    opacity: 1;
    pointer-events: auto;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }

  #notes-col-head {
    padding: 8px 12px 6px;
  }
  #notes-col-title {
    font-size: 14px;
  }
  #notes-search-box {
    padding: 0 10px 6px;
  }
  #notes-filters {
    padding: 0 10px 8px;
    gap: 5px;
  }
  .note-item {
    padding: 8px 12px;
  }
  .note-item-title {
    font-size: 12px;
  }
  .note-item-preview {
    font-size: 10.5px;
  }
  /* Editor ocupa o resto */
  #notes-editor {
    flex: 1;
    min-height: 0;
  }
  #note-head {
    padding: 12px 14px 8px;
  }
  #note-title-input {
    font-size: 18px;
    min-width: 0;
  }
  #note-toolbar {
    padding: 0 14px 10px;
    gap: 5px;
  }
  #note-cat-input {
    width: 80px;
  }
  #note-content-textarea {
    padding: 16px;
    font-size: 12px;
  }
  #note-preview {
    padding: 16px 18px;
  }
}


</style>
    <style>
/* ════ AI Sidebar — dockada à direita, colapsável, persistente ════ */

:root {
  --agent-w: 384px;
  --agent-rail-w: 56px;
}

#agent-panel {
  flex-shrink: 0;
  position: relative;
  width: var(--agent-rail-w);
  border-left: 1px solid var(--border);
  background: var(--surface);
  overflow: hidden;
  z-index: 5;
  transition: width .3s cubic-bezier(.2,.8,.2,1);
}
#agent-panel.open {
  width: var(--agent-w);
}

/* ── Estado recolhido: rail fino vertical ── */
#agent-collapsed {
  position: absolute;
  inset: 0;
  width: var(--agent-rail-w);
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-2);
  transition: opacity .16s ease;
}
.agent-orb {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent-dim);
  color: var(--accent);
  box-shadow: var(--glow);
  transition: transform .22s cubic-bezier(.2,.8,.2,1), box-shadow .22s,
    background .2s;
}
.agent-orb .ico {
  width: 20px;
  height: 20px;
}
#agent-collapsed:hover .agent-orb {
  transform: scale(1.09);
  background: rgba(55,217,154,.22);
  box-shadow: 0 0 0 1px var(--accent-line), 0 6px 26px rgba(55,217,154,.32);
}
.agent-collapsed-label {
  writing-mode: vertical-rl;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--text-3);
}
#agent-panel.open #agent-collapsed {
  opacity: 0;
  pointer-events: none;
}

/* ── Estado expandido: corpo da sidebar ── */
.agent-body {
  width: var(--agent-w);
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity .16s ease;
}
#agent-panel.open .agent-body {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity .22s ease .1s;
}

/* ── Header ── */
#chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}
.agent-chip {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--accent-dim);
  color: var(--accent);
  flex-shrink: 0;
}
.agent-chip .ico {
  width: 15px;
  height: 15px;
}
.agent-presence {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
  flex-shrink: 0;
}
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
  max-width: 130px;
  min-width: 0;
  margin-left: 2px;
}
#chat-provider:hover {
  background: var(--surface-3);
}
#chat-provider:focus-visible {
  border-color: var(--accent-line);
}
#chat-provider option {
  background: var(--surface-2);
  color: var(--text);
}
#chat-provider:disabled {
  opacity: .5;
  cursor: not-allowed;
}
#chat-header-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
#chat-header-actions .ghost-btn {
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}
#chat-header-actions .ico {
  width: 14px;
  height: 14px;
}

/* ── Feed ── */
#chat-feed {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-bubble {
  max-width: 88%;
  padding: 10px 14px;
  border-radius: var(--r-md);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
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
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent-2);
  border-radius: var(--r-sm);
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  max-width: 92%;
  word-break: break-all;
}
.tool-summary-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tool-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-3);
  font-size: 10px;
  padding: 0 2px;
  line-height: 1;
  opacity: 0.6;
  flex-shrink: 0;
}
.tool-toggle:hover {
  opacity: 1;
}
.tool-name {
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 4px;
  font-size: 10px;
  background: rgba(55,217,154,.12);
  color: var(--accent);
}
.tool-summary {
  color: var(--text-2);
}
.tool-details {
  display: none;
  margin-top: 6px;
  border-top: 1px solid var(--border-soft);
  padding-top: 5px;
}
.tool-details.open {
  display: block;
}
.tool-body {
  color: var(--text-3);
  margin-bottom: 4px;
  white-space: pre-wrap;
}
.tool-result {
  color: var(--text-3);
  white-space: pre-wrap;
}

/* ── Composer ── */
#chat-composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
#chat-stop {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-3);
  color: var(--text-2);
  font-family: var(--font-ui);
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all .12s;
}
#chat-stop:hover {
  border-color: var(--cat-security);
  color: var(--cat-security);
}
#chat-stop .ico {
  width: 13px;
  height: 13px;
}

#chat-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  resize: none;
  line-height: 1.5;
  max-height: 140px;
  overflow-y: hidden;
  box-sizing: border-box;
  transition: border .12s;
}
#chat-input:focus {
  border-color: var(--accent-line);
}
#chat-input::placeholder {
  color: var(--text-3);
}

#chat-send {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all .13s;
  box-shadow: 0 2px 8px rgba(55,217,154,.25);
}
#chat-send .ico {
  width: 16px;
  height: 16px;
}
#chat-send:hover {
  background: var(--accent-2);
}
#chat-send:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  :root {
    --agent-w: 340px;
  }
}

@media (max-width: 600px) {
  :root {
    --agent-w: 100vw;
    --agent-rail-w: auto;
  }

  /* Estado colapsado: floating action button no canto inferior direito */
  #agent-panel:not(.open) {
    position: fixed;
    bottom: 20px;
    right: 16px;
    width: auto;
    height: auto;
    border-left: none;
    background: transparent;
    z-index: 450;
  }
  #agent-panel:not(.open) #agent-collapsed {
    position: static;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--on-accent);
    box-shadow: 0 4px 20px rgba(55,217,154,.4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
  }
  #agent-panel:not(.open) .agent-orb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: transparent;
    box-shadow: none;
    display: grid;
    place-items: center;
    color: var(--on-accent);
  }
  #agent-panel:not(.open) .agent-orb .ico {
    width: 18px;
    height: 18px;
  }
  #agent-panel:not(.open) .agent-collapsed-label {
    display: none; /* só o ícone no floating button */
  }
  #agent-panel:not(.open) .agent-body {
    display: none;
  }

  /* Estado expandido: overlay full-screen */
  #agent-panel.open {
    position: fixed;
    inset: 0;
    z-index: 500;
    width: 100vw;
    border-left: none;
    border-radius: 0;
  }
  #agent-panel.open .agent-body {
    width: 100vw;
  }

  /* Header compacto */
  #chat-header {
    padding: 10px 12px;
    gap: 6px;
  }
  #chat-provider {
    max-width: 100px;
    font-size: 12px;
  }
  /* Feed e composer */
  #chat-feed {
    padding: 10px 12px;
    gap: 8px;
  }
  #chat-composer {
    padding: 8px 10px;
    gap: 6px;
  }
  #chat-input {
    font-size: 12px;
    padding: 6px 10px;
  }
  #chat-send {
    width: 32px;
    height: 32px;
  }
  .chat-bubble {
    font-size: 12px;
    padding: 8px 12px;
  }
}

</style>
    <style>
/* ════ Macros mode ════ */
#mode-macros {
  background: var(--bg);
}

/* ── List column ── */
#macros-col {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
#macros-col-head {
  display: flex;
  align-items: center;
  padding: 18px 18px 14px;
  gap: 10px;
  flex-shrink: 0;
}
#macros-col-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--text);
  flex: 1;
}
#macros-new-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--on-accent);
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all .15s;
  box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#macros-new-btn:hover {
  background: var(--accent-2);
  transform: scale(1.08);
}

#macros-list {
  flex: 1;
  overflow-y: auto;
}
.macros-empty {
  padding: 34px 22px;
  text-align: center;
  color: var(--text-3);
  font-size: 12.5px;
  line-height: 1.7;
}

.macro-item {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background .1s;
  border-left: 2px solid transparent;
}
.macro-item:hover {
  background: var(--surface-2);
}
.macro-item.active {
  background: var(--surface-2);
  border-left-color: var(--accent);
}
.macro-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.macro-interp-dot {
  font-size: 13px;
  flex-shrink: 0;
}
.macro-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.macro-item.active .macro-item-title {
  color: var(--accent);
}
.macro-item-desc {
  font-size: 11.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Editor column ── */
#macros-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
#macros-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-3);
}
#macros-editor-empty-mark {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  color: var(--text-4);
  border: 1px dashed var(--border-mid);
  border-radius: 18px;
}
#macros-editor-empty-mark .ico {
  width: 28px;
  height: 28px;
}
#macros-editor-empty-text {
  font-size: 14px;
}

#macros-editor-form {
  display: none;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
#macros-editor-form.visible {
  display: flex;
}

#macro-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 10px;
  flex-shrink: 0;
}
#macro-title-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -.02em;
  color: var(--text);
}
#macro-title-input::placeholder {
  color: var(--text-4);
}

.macro-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--r-sm);
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.macro-badge.bash {
  background: rgba(251,191,36,.12);
  color: #fbbf24;
  border: 1px solid rgba(251,191,36,.3);
}
.macro-badge.deno {
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-line);
}

#macro-head-actions {
  display: flex;
  gap: 7px;
  flex-shrink: 0;
}
.macro-run-btn {
  background: var(--accent) !important;
  color: var(--on-accent) !important;
  border-color: var(--accent) !important;
  box-shadow: 0 2px 10px rgba(55,217,154,.25);
}
.macro-run-btn:hover {
  background: var(--accent-2) !important;
}
.macro-run-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

#macro-desc-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 20px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#macro-desc-input {
  flex: 1;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text-2);
  padding: 0 10px;
  outline: none;
}
#macro-desc-input:focus {
  border-color: var(--accent-line);
}
#macro-desc-input::placeholder {
  color: var(--text-3);
}

#macro-path-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 15px 20px 0;
  padding: 8px 12px;
  background: rgba(96,165,250,.08);
  border: 1px solid rgba(96,165,250,.2);
  border-radius: var(--r-sm);
  font-size: 11.5px;
  color: var(--cat-arch);
  line-height: 1.5;
  flex-shrink: 0;
}
#macro-path-hint .ico {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--text-3);
}

#macro-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
#macro-script {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 18px 20px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--text);
  background: var(--surface);
  tab-size: 2;
  min-height: 120px;
}
#macro-script::placeholder {
  color: var(--text-3);
}

/* CodeMirror — substitui o textarea quando inicializado.
   \`color\` sem !important: garante texto legível se o tema CDN não carregar,
   mas perde para seletores mais específicos quando o tema está presente. */
#macro-body .CodeMirror {
  flex: 1;
  min-height: 120px;
  font-family: var(--font-mono) !important;
  font-size: 12.5px;
  line-height: 1.75;
  background: var(--surface) !important;
  color: var(--text);
  border: none;
  height: auto;
}
#macro-body .CodeMirror-focused {
  /* sem borda extra, o editor já preenche o container */
}
#macro-body .CodeMirror-scroll {
  min-height: 120px;
}
#macro-body .CodeMirror-gutters {
  background: var(--surface-2) !important;
  border-right: 1px solid var(--border) !important;
  padding-right: 4px;
}
#macro-body .CodeMirror-linenumber {
  color: var(--text-4) !important;
  font-size: 0.68rem;
}
#macro-body .CodeMirror-cursor {
  border-left-color: var(--accent) !important;
}
#macro-body .CodeMirror-selectedtext,
#macro-body .CodeMirror-selected {
  background: rgba(55,217,154,.15) !important;
}

/* ── Output panel ── */
#macro-output-panel {
  flex-shrink: 0;
  max-height: 45%;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: #080a0d;
}
#macro-output-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#macro-output-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--text-3);
}
.macro-status {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--r-xl);
}
.macro-status.running {
  background: rgba(55,217,154,.15);
  color: var(--accent);
  border: 1px solid var(--accent-line);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

#macro-output {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 14px 20px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.out-out {
  color: #d4d4d4;
}
.out-info {
  color: #626976;
}
.out-error {
  color: var(--cat-security);
}
.out-success {
  color: var(--accent);
}

/* spinner */
.run-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(6,18,13,.4);
  border-top-color: var(--on-accent);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  vertical-align: middle;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ghost-btn.danger:hover {
  color: var(--cat-security);
  border-color: var(--cat-security);
}

/* ── Tags ── */
.macro-item-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 5px;
}

#macro-tags-input {
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
#macro-tags-input:focus {
  border-color: var(--accent-line);
}
#macro-tags-input::placeholder {
  color: var(--text-3);
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  #macros-col {
    width: 200px;
  }
  #macro-head {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 14px 8px;
  }
  #macro-title-input {
    font-size: 18px;
  }
  #macro-desc-row {
    flex-wrap: wrap;
    padding: 0 14px 10px;
  }
  #macro-path-hint {
    margin: 10px 14px 0;
  }
}

@media (max-width: 600px) {
  #mode-macros {
    flex-direction: column;
  }
  /* Sidebar escondida por padrão — clique no ◆ para abrir */
  #macros-col {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: none;
    transition: max-height 0.25s ease;
  }
  #macros-col.col-collapsed {
    max-height: 60vh;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
    opacity: 1;
    pointer-events: auto;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }
  #macros-col-head {
    padding: 8px 12px 6px;
  }
  #macros-col-title {
    font-size: 14px;
  }
  .macro-item {
    padding: 7px 12px;
  }
  .macro-item-title {
    font-size: 11.5px;
  }
  .macro-item-desc {
    font-size: 10.5px;
  }
  #macros-editor {
    flex: 1;
    min-height: 0;
  }
  #macro-head {
    padding: 10px 12px 6px;
  }
  #macro-title-input {
    font-size: 16px;
  }
  #macro-desc-row {
    padding: 0 12px 8px;
  }
  #macro-head-actions {
    gap: 4px;
  }
  #macro-head-actions .tool-btn {
    padding: 0 8px;
    font-size: 11px;
    height: 28px;
  }
  #macro-script {
    padding: 12px 14px;
    font-size: 11.5px;
  }
  #macro-output-panel {
    max-height: 35%;
  }
  #macro-output {
    padding: 10px 14px;
    font-size: 11px;
  }
}

</style>
    <style>
/* ════ Skills mode ════ */
#mode-skills {
  background: var(--bg);
}

/* ── List column ── */
#skills-col {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
#skills-col-head {
  display: flex;
  align-items: center;
  padding: 18px 18px 12px;
  gap: 10px;
  flex-shrink: 0;
}
#skills-col-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--text);
  flex: 1;
}
#skills-new-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--on-accent);
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all .15s;
  box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#skills-new-btn:hover {
  background: var(--accent-2);
  transform: scale(1.08);
}

#skills-search-box {
  padding: 0 18px 12px;
  flex-shrink: 0;
}
#skills-search-input {
  width: 100%;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12.5px;
  color: var(--text);
  padding: 0 13px;
  outline: none;
  transition: border .12s;
}
#skills-search-input:focus {
  border-color: var(--accent-line);
}
#skills-search-input::placeholder {
  color: var(--text-3);
}

#skills-list {
  flex: 1;
  overflow-y: auto;
}
.skills-empty {
  padding: 34px 22px;
  text-align: center;
  color: var(--text-3);
  font-size: 12.5px;
  line-height: 1.7;
}
.skills-empty strong {
  color: var(--accent);
}

.skill-item {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background .1s;
  border-left: 2px solid transparent;
}
.skill-item:hover {
  background: var(--surface-2);
}
.skill-item.active {
  background: var(--surface-2);
  border-left-color: var(--accent);
}
.skill-item-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.skill-item-name {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  flex-shrink: 0;
}
.skill-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.skill-item.active .skill-item-title {
  color: var(--accent);
}
.skill-item-desc {
  font-size: 11.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 5px;
}
.skill-item-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

/* ── Editor column ── */
#skills-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
#skills-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-3);
}
#skills-editor-empty-mark {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  color: var(--text-4);
  border: 1px dashed var(--border-mid);
  border-radius: 18px;
}
#skills-editor-empty-mark .ico {
  width: 28px;
  height: 28px;
}
#skills-editor-empty-text {
  font-size: 14px;
}

#skills-editor-form {
  display: none;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
#skills-editor-form.visible {
  display: flex;
}

#skill-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 10px;
  flex-shrink: 0;
}
#skill-title-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -.02em;
  color: var(--text);
}
#skill-title-input::placeholder {
  color: var(--text-4);
}
#skill-name-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--accent-line);
  padding: 3px 9px;
  border-radius: var(--r-sm);
  flex-shrink: 0;
}

#skill-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px 10px;
  flex-shrink: 0;
}
#skill-name-field {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  padding: 0 10px;
  transition: border .12s;
}
#skill-name-field:focus-within {
  border-color: var(--accent-line);
}
#skill-name-prefix {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
}
#skill-name-input {
  width: 150px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
}
#skill-name-input::placeholder {
  color: var(--text-3);
}

#skill-tags-input {
  flex: 1;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text);
  padding: 0 9px;
  outline: none;
}
#skill-tags-input:focus {
  border-color: var(--accent-line);
}
#skill-tags-input::placeholder {
  color: var(--text-3);
}

#skill-desc-row {
  padding: 0 20px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#skill-desc-input {
  width: 100%;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text-2);
  padding: 0 10px;
  outline: none;
}
#skill-desc-input:focus {
  border-color: var(--accent-line);
}
#skill-desc-input::placeholder {
  color: var(--text-3);
}

#skill-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}
#skill-content-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 20px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.8;
  color: var(--text);
  background: var(--surface);
  tab-size: 2;
}
#skill-content-textarea::placeholder {
  color: var(--text-3);
}

#skill-preview {
  flex: 1;
  display: none;
  padding: 20px 28px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text);
  background: var(--surface);
}
#skill-preview.visible {
  display: block;
}
#skill-preview h1,
#skill-preview h2,
#skill-preview h3 {
  font-weight: 700;
  margin: 20px 0 8px;
}
#skill-preview code {
  font-family: var(--font-mono);
  background: var(--surface-3);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--accent);
}
#skill-preview pre {
  background: var(--surface-2);
  padding: 14px;
  border-radius: var(--r-sm);
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid var(--border);
}
#skill-preview pre code {
  background: none;
  padding: 0;
  color: var(--text);
}
#skill-preview blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 15px;
  color: var(--text-2);
  margin: 10px 0;
}
#skill-preview ul,
#skill-preview ol {
  padding-left: 22px;
  margin: 8px 0;
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  #skills-col {
    width: 220px;
  }
  #skill-toolbar {
    flex-wrap: wrap;
    gap: 6px;
  }
  #skill-head {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 14px 8px;
  }
  #skill-title-input {
    font-size: 18px;
  }
  #skill-name-input {
    width: 110px;
  }
}

@media (max-width: 600px) {
  #mode-skills {
    flex-direction: column;
  }
  /* Sidebar escondida por padrão — clique no ◆ para abrir */
  #skills-col {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: none;
    transition: max-height 0.25s ease;
  }
  #skills-col.col-collapsed {
    max-height: 60vh;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
    opacity: 1;
    pointer-events: auto;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }
  #skills-col-head {
    padding: 8px 12px 6px;
  }
  #skills-col-title {
    font-size: 14px;
  }
  .skill-item {
    padding: 7px 12px;
  }
  .skill-item-title {
    font-size: 11.5px;
  }
  .skill-item-desc {
    font-size: 10.5px;
  }
  #skills-editor {
    flex: 1;
    min-height: 0;
  }
  #skill-head {
    padding: 10px 12px 6px;
  }
  #skill-title-input {
    font-size: 16px;
  }
  #skill-toolbar {
    padding: 0 12px 8px;
    gap: 4px;
  }
  #skill-name-input {
    width: 90px;
  }
  #skill-desc-row {
    padding: 0 12px 8px;
  }
  #skill-content-textarea {
    padding: 14px;
    font-size: 12px;
  }
  #skill-preview {
    padding: 14px 16px;
  }
}

</style>
    <style>
/* ════ Diagrams mode ════ */
#mode-diagrams {
  background: var(--bg);
}

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
#diag-col-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--text);
  flex: 1;
}
#diag-new-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--r-sm);
  background: var(--accent);
  color: var(--on-accent);
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all .15s;
  box-shadow: 0 2px 10px rgba(55,217,154,.28);
}
#diag-new-btn:hover {
  background: var(--accent-2);
  transform: scale(1.08);
}

#diag-list {
  flex: 1;
  overflow-y: auto;
}
.diag-empty {
  padding: 34px 22px;
  text-align: center;
  color: var(--text-3);
  font-size: 12.5px;
  line-height: 1.7;
}
.diag-empty strong {
  color: var(--accent);
}

.diag-item {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background .1s;
  border-left: 2px solid transparent;
}
.diag-item:hover {
  background: var(--surface-2);
}
.diag-item.active {
  background: var(--surface-2);
  border-left-color: var(--accent);
}
.diag-item.active .diag-item-title {
  color: var(--accent);
}
.diag-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.diag-item-preview {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Editor column ── */
#diag-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

#diag-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-3);
}
#diag-editor-empty-mark {
  width: 66px;
  height: 66px;
  display: grid;
  place-items: center;
  font-size: 28px;
  color: var(--text-4);
  border: 1px dashed var(--border-mid);
  border-radius: 18px;
}
#diag-editor-empty-text {
  font-size: 14px;
}

#diag-editor-form {
  display: none;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
#diag-editor-form.visible {
  display: flex;
}

#diag-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
#diag-title-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -.02em;
  color: var(--text);
}
#diag-title-input::placeholder {
  color: var(--text-4);
}
#diag-id-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 3px 8px;
  border-radius: var(--r-sm);
  flex-shrink: 0;
}
#diag-head-actions {
  display: flex;
  gap: 7px;
  flex-shrink: 0;
}

#diag-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* ── Preview — tela cheia por padrão ── */
#diag-preview-col {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--surface-2);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 28px;
}
#diag-preview {
  width: 100%;
}
#diag-preview svg {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

/* ── Source — colapsável, fechado por padrão ── */
#diag-source-col {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  max-height: 38px; /* header only when collapsed */
  overflow: hidden;
  transition: max-height .25s ease;
}
#diag-source-col.open {
  max-height: 260px;
}

#diag-source-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .04em;
  color: var(--text-3);
  flex-shrink: 0;
  user-select: none;
}
#diag-source-header:hover {
  color: var(--text-2);
  background: var(--surface-3);
}
#diag-source-toggle {
  font-size: 10px;
  transition: transform .2s;
}
#diag-source-col.open #diag-source-toggle {
  transform: rotate(90deg);
}
#diag-docs-link {
  margin-left: auto;
  color: var(--accent-2);
  text-decoration: none;
  font-size: 11px;
}
#diag-docs-link:hover {
  text-decoration: underline;
}

#diag-source {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 14px 18px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--text);
  background: var(--surface);
  tab-size: 2;
}
#diag-source::placeholder {
  color: var(--text-3);
}

.diag-error {
  padding: 16px;
  background: rgba(251,113,133,.08);
  border: 1px solid rgba(251,113,133,.25);
  border-radius: var(--r-sm);
  color: var(--cat-security);
  font-size: 12px;
  line-height: 1.6;
}
.diag-error code {
  font-family: var(--font-mono);
  font-size: 11px;
}

/* ── Zoom bar ── */
#diag-preview-col {
  position: relative;
}

#diag-zoom-bar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 4px 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
}
#diag-zoom-label {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-3);
  min-width: 36px;
  text-align: center;
}
.diag-zoom-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 13px;
  transition: background .1s, color .1s;
}
.diag-zoom-btn:hover {
  background: var(--surface-2);
  color: var(--text);
}

/* ── Tags ── */
.diag-item-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 5px;
}

#diag-tags-input {
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
  max-width: 260px;
}
#diag-tags-input:focus {
  border-color: var(--accent-line);
}
#diag-tags-input::placeholder {
  color: var(--text-3);
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  #diag-col {
    width: 200px;
  }
  #diag-head {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 14px 10px;
  }
  #diag-title-input {
    font-size: 18px;
  }
  #diag-tags-input {
    max-width: 180px;
  }
}

@media (max-width: 600px) {
  #mode-diagrams {
    flex-direction: column;
  }
  /* Sidebar escondida por padrão — clique no ◆ para abrir */
  #diag-col {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: none;
    transition: max-height 0.25s ease;
  }
  #diag-col.col-collapsed {
    max-height: 60vh;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
    opacity: 1;
    pointer-events: auto;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }
  #diag-col-head {
    padding: 8px 12px 6px;
  }
  #diag-col-title {
    font-size: 14px;
  }
  .diag-item {
    padding: 7px 12px;
  }
  .diag-item-title {
    font-size: 11.5px;
  }
  .diag-item-preview {
    font-size: 10px;
  }
  #diag-editor {
    flex: 1;
    min-height: 0;
  }
  #diag-head {
    padding: 10px 12px 8px;
    gap: 6px;
  }
  #diag-title-input {
    font-size: 16px;
    min-width: 0;
  }
  #diag-tags-input {
    max-width: 140px;
  }
  #diag-head-actions {
    gap: 4px;
  }
  #diag-head-actions .tool-btn {
    padding: 0 8px;
    font-size: 11px;
    height: 28px;
  }
  #diag-preview-col {
    padding: 16px;
  }
  #diag-zoom-bar {
    top: 6px;
    right: 6px;
  }
}

</style>
    <style>
/* ════ Kanban ════ */

#mode-tasks {
  flex-direction: column;
}

/* ── Project toolbar ── */

#kanban-project-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}

#kanban-project-select {
  font-size: 0.8125rem;
  background: var(--surface-3);
  border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: var(--r-sm);
  padding: 5px 10px;
  cursor: pointer;
  outline: none;
  font-family: var(--font-ui);
  min-width: 180px;
  transition: border-color 0.12s;
}

#kanban-project-select:focus {
  border-color: var(--accent-line);
}

#kanban-project-add-btn {
  width: 28px;
  height: 28px;
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

#kanban-project-add-btn:hover {
  background: var(--accent);
  color: var(--on-accent);
}

#kanban-project-del-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--surface-3);
  color: var(--text-3);
  border-radius: var(--r-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}

#kanban-project-del-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

#kanban-project-del-btn:not(:disabled):hover {
  background: var(--type-warning);
  color: #fff;
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
.kanban-col-dot[data-col="todo"] {
  background: var(--text-3);
}
.kanban-col-dot[data-col="in-progress"] {
  background: var(--cat-entry);
}
.kanban-col-dot[data-col="done"] {
  background: var(--accent);
}

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
#task-title-input::placeholder {
  color: var(--text-4);
}

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

#task-project-select {
  font-size: 0.78rem;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--r-sm);
  padding: 5px 8px;
  cursor: pointer;
  outline: none;
  font-family: var(--font-ui);
  width: 100%;
  transition: border-color 0.12s;
}

#task-project-select:focus {
  border-color: var(--accent-line);
}

#task-modal-close {
  padding: 4px;
  color: var(--text-3);
  border-radius: var(--r-xs);
  transition: color 0.12s;
}
#task-modal-close:hover {
  color: var(--text);
}

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
#task-desc-textarea:focus {
  border-color: var(--accent-line);
}

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
#task-due-input:focus {
  border-color: var(--accent-line);
}

#task-note-wrap {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  transition: border-color 0.12s;
  overflow: hidden;
}
#task-note-wrap:focus-within {
  border-color: var(--accent-line);
}

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
#task-note-input::placeholder {
  color: var(--text-4);
}
#task-note-input.has-link {
  color: var(--accent);
}

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
#task-note-clear:hover {
  color: var(--text);
}

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
#task-note-dropdown.open {
  display: block;
}

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

.task-footer-spacer {
  flex: 1;
}

/* ── Project Modal ── */

#project-modal-overlay {
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

#project-modal-overlay.visible {
  opacity: 1;
  pointer-events: all;
}

#project-modal {
  background: var(--surface-2);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-xl);
  width: min(380px, 90vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--sh-lg);
}

#project-modal-head {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  gap: 10px;
}

#project-name-input {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: var(--font-ui);
}

#project-name-input::placeholder {
  color: var(--text-4);
}

#project-modal-footer {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 8px;
}

/* ── Empty state coluna ── */
.kanban-col-empty {
  font-size: 0.78rem;
  color: var(--text-4);
  text-align: center;
  padding: 20px 12px;
  line-height: 1.5;
}

/* ── Tags nos cards ── */
.kanban-card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 6px;
}

#task-tags-input {
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text);
  padding: 0 9px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
#task-tags-input:focus {
  border-color: var(--accent-line);
}
#task-tags-input::placeholder {
  color: var(--text-3);
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  .kanban-col {
    min-width: 230px;
  }
  #task-modal-body {
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }
  .task-meta-row {
    flex-basis: auto;
    flex-shrink: 0;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
    overflow-y: visible;
  }
  .task-meta-row .task-field {
    flex: 1;
    min-width: 140px;
  }
}

@media (max-width: 600px) {
  #kanban-project-bar {
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 10px;
  }
  #kanban-project-select {
    min-width: 0;
    flex: 1;
  }
  #kanban-board {
    padding: 10px;
    gap: 10px;
  }
  .kanban-col {
    min-width: 220px;
    max-width: none;
    flex-shrink: 0;
  }
  #task-modal {
    width: calc(100vw - 16px);
    height: calc(100vh - 32px);
    border-radius: var(--r-md);
  }
  #task-modal-body {
    padding: 12px;
  }
  #task-modal-head {
    padding: 10px 12px;
    gap: 6px;
  }
  #task-modal-footer {
    padding: 10px 12px;
    gap: 6px;
    flex-wrap: wrap;
  }
  .task-meta-row {
    flex-direction: column;
    gap: 8px;
  }
  .task-meta-row .task-field {
    min-width: 0;
  }
  #project-modal {
    width: calc(100vw - 32px);
    max-width: none;
  }
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
.mocks-col-item:hover {
  background: var(--surface-3);
}
.mocks-col-item.active {
  background: var(--accent-dim);
}

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
.mocks-col-item.active .mocks-col-name {
  color: var(--accent);
}

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
.mocks-col-item:hover .mocks-col-actions {
  display: flex;
}

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
.mocks-col-action-btn:hover {
  color: var(--text-2);
  background: var(--surface-4);
}
.mocks-col-action-btn.warn:hover {
  color: #f59e0b;
}
.mocks-col-action-btn.danger:hover {
  color: #fb7185;
}

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
.mocks-col-new-input::placeholder {
  color: var(--text-4);
}

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
.mocks-col-new-ok:hover {
  background: var(--accent-2);
}

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
.mocks-list-empty .ico {
  width: 22px;
  height: 22px;
  opacity: 0.35;
}

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
  background: linear-gradient(to right, transparent, var(--border) 30%,
    var(--border) 70%, transparent);
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
.mocks-item:hover {
  background: var(--surface-2);
}
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

.method-get {
  color: var(--accent);
  background: var(--accent-dim);
}
.method-post {
  color: #60a5fa;
  background: rgba(96,165,250,.13);
}
.method-put {
  color: #f59e0b;
  background: rgba(245,158,11,.12);
}
.method-patch {
  color: #a78bfa;
  background: rgba(167,139,250,.13);
}
.method-delete {
  color: #fb7185;
  background: rgba(251,113,133,.13);
}
.method-gray {
  color: var(--text-3);
  background: var(--surface-3);
}

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
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(55,217,154,.5);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(55,217,154,0);
  }
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
#mock-id-badge[data-method="GET"] {
  color: var(--accent);
  background: var(--accent-dim);
}
#mock-id-badge[data-method="POST"] {
  color: #60a5fa;
  background: rgba(96,165,250,.12);
}
#mock-id-badge[data-method="PUT"] {
  color: #f59e0b;
  background: rgba(245,158,11,.12);
}
#mock-id-badge[data-method="PATCH"] {
  color: #a78bfa;
  background: rgba(167,139,250,.12);
}
#mock-id-badge[data-method="DELETE"] {
  color: #fb7185;
  background: rgba(251,113,133,.12);
}

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
.mock-select:focus {
  border-color: var(--accent-line);
}
.mock-input::placeholder {
  color: var(--text-4);
}

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
#mock-method-select[data-method="GET"] {
  color: var(--accent);
}
#mock-method-select[data-method="POST"] {
  color: #60a5fa;
}
#mock-method-select[data-method="PUT"] {
  color: #f59e0b;
}
#mock-method-select[data-method="PATCH"] {
  color: #a78bfa;
}
#mock-method-select[data-method="DELETE"] {
  color: #fb7185;
}

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
.mock-field-script .cm-keyword {
  color: #c678dd;
}
.mock-field-script .cm-operator {
  color: #c678dd;
}
.mock-field-script .cm-string {
  color: #98c379;
}
.mock-field-script .cm-string-2 {
  color: #98c379;
}
.mock-field-script .cm-number {
  color: #d19a66;
}
.mock-field-script .cm-atom {
  color: #d19a66;
}
.mock-field-script .cm-comment {
  color: #5c6370;
  font-style: italic;
}
.mock-field-script .cm-def {
  color: #61afef;
}
.mock-field-script .cm-variable {
  color: #e06c75;
}
.mock-field-script .cm-variable-2 {
  color: #abb2bf;
}
.mock-field-script .cm-property {
  color: #e5c07b;
}
.mock-field-script .cm-qualifier {
  color: #e5c07b;
}
.mock-field-script .cm-builtin {
  color: #56b6c2;
}
.mock-field-script .cm-tag {
  color: #e06c75;
}
.mock-field-script .cm-bracket {
  color: #abb2bf;
}
.mock-field-script .cm-punctuation {
  color: #abb2bf;
}
.mock-field-script .cm-meta {
  color: #abb2bf;
}

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
#mock-script-textarea:focus {
  border-color: var(--accent-line);
}
/* CodeMirror esconde o textarea original — não quebramos o layout */
#mock-script-textarea + .CodeMirror {
  flex: 1;
}

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
#mock-test-panel:focus-within {
  border-color: var(--border-mid);
}

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
.test-param-input:focus {
  border-color: var(--accent-line);
}

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
.test-status-ok {
  color: var(--accent);
  background: var(--accent-dim);
}
.test-status-err {
  color: #fb7185;
  background: rgba(251,113,133,.13);
}

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

/* ── Tags ── */
.mock-item-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 4px;
}

#mock-tags-input {
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text);
  padding: 0 9px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
#mock-tags-input:focus {
  border-color: var(--accent-line);
}
#mock-tags-input::placeholder {
  color: var(--text-3);
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  #mocks-col {
    width: 200px;
    min-width: 180px;
  }
  #mock-meta-row-2 {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

@media (max-width: 600px) {
  #mode-mocks {
    flex-direction: column;
  }
  /* Sidebar escondida por padrão — clique no ◆ para abrir */
  #mocks-col {
    width: 100%;
    min-width: 0;
    max-height: 0;
    overflow: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: none;
    transition: max-height 0.25s ease;
  }
  #mocks-col.col-collapsed {
    max-height: 60vh;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
    opacity: 1;
    pointer-events: auto;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }
  #mocks-col-list {
    max-height: 120px;
  }
  #mocks-col-head, #mocks-list-head {
    padding: 6px 8px;
  }
  .mocks-section-label {
    font-size: 0.6rem;
  }
  .mocks-col-item-inner {
    padding: 5px 6px;
  }
  .mocks-col-name {
    font-size: 0.75rem;
  }
  #mocks-list {
    padding: 2px 4px;
  }
  .mocks-item {
    padding: 4px 6px;
  }
  #mocks-editor {
    flex: 1;
    min-height: 0;
  }
  #mocks-editor-form {
    padding: 12px 14px;
    gap: 10px;
  }
  #mock-meta-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  #mock-meta-row-2 {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  #mock-head {
    flex-wrap: wrap;
    gap: 6px;
  }
  #mock-head-actions {
    flex-wrap: wrap;
    gap: 4px;
  }
  #mock-head-actions .tool-btn {
    padding: 0 8px;
    font-size: 11px;
    height: 28px;
  }
  .mock-field-script .CodeMirror {
    min-height: 120px;
  }
  .mock-field-script .CodeMirror-scroll {
    min-height: 120px;
  }
  #mock-script-textarea {
    min-height: 120px;
  }
}

</style>
    <style>
/* ════ Favorites / Bookmarks Manager ════ */

:root {
  --fav-site: #60a5fa;
  --fav-slack: #c084fc;
  --fav-grid: #34d399;
  --fav-dash: #fb923c;
  --fav-github: #e2e8f0;
  --fav-site-bg: rgba(96,165,250,.1);
  --fav-slack-bg: rgba(192,132,252,.1);
  --fav-grid-bg: rgba(52,211,153,.1);
  --fav-dash-bg: rgba(251,146,60,.1);
  --fav-github-bg: rgba(226,232,240,.08);
}

/* ── Layout ── */
#mode-favorites {
  flex-direction: row;
}

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

.fav-sidebar-section {
  padding: 0 10px;
}

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

.fav-cat-item:hover {
  background: var(--surface-2);
  color: var(--text);
}

.fav-cat-item.active {
  color: var(--accent);
  background: var(--accent-dim);
  border-color: var(--accent-line);
}

.fav-cat-left {
  display: flex;
  align-items: center;
  gap: 7px;
}
.fav-cat-icon {
  font-size: 12px;
  opacity: .8;
  line-height: 1;
}

.fav-cat-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-4);
}

.fav-cat-item.active .fav-cat-count {
  color: var(--accent);
  opacity: .7;
}

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

.fav-tag:hover,
.fav-tag.active {
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

#fav-search::placeholder {
  color: var(--text-4);
}

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

#fav-search-clear:hover {
  color: var(--text);
}
#fav-search-clear.visible {
  display: flex;
}

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

#fav-add-btn:hover {
  background: var(--accent-2);
  transform: translateY(-1px);
}

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

.fav-type-tab:hover {
  background: var(--surface-2);
  color: var(--text-2);
}

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
#fav-most-visited {
  margin-bottom: 22px;
}

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
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.fav-featured-card[data-type="site"]::before {
  background: var(--fav-site);
}
.fav-featured-card[data-type="slack"]::before {
  background: var(--fav-slack);
}
.fav-featured-card[data-type="grid"]::before {
  background: var(--fav-grid);
}
.fav-featured-card[data-type="dash"]::before {
  background: var(--fav-dash);
}
.fav-featured-card[data-type="github"]::before {
  background: var(--fav-github);
}

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
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fav-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 1.5px 0 0 1.5px;
}

.fav-card[data-type="site"]::before {
  background: var(--fav-site);
}
.fav-card[data-type="slack"]::before {
  background: var(--fav-slack);
}
.fav-card[data-type="grid"]::before {
  background: var(--fav-grid);
}
.fav-card[data-type="dash"]::before {
  background: var(--fav-dash);
}
.fav-card[data-type="github"]::before {
  background: var(--fav-github);
}

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

.fav-card[data-type="site"] .fav-type-badge {
  background: var(--fav-site-bg);
  color: var(--fav-site);
}
.fav-card[data-type="slack"] .fav-type-badge {
  background: var(--fav-slack-bg);
  color: var(--fav-slack);
}
.fav-card[data-type="grid"] .fav-type-badge {
  background: var(--fav-grid-bg);
  color: var(--fav-grid);
}
.fav-card[data-type="dash"] .fav-type-badge {
  background: var(--fav-dash-bg);
  color: var(--fav-dash);
}
.fav-card[data-type="github"] .fav-type-badge {
  background: var(--fav-github-bg);
  color: var(--fav-github);
}

/* featured card type badge */
.fav-featured-card[data-type="site"] .fav-type-badge {
  background: var(--fav-site-bg);
  color: var(--fav-site);
}
.fav-featured-card[data-type="slack"] .fav-type-badge {
  background: var(--fav-slack-bg);
  color: var(--fav-slack);
}
.fav-featured-card[data-type="grid"] .fav-type-badge {
  background: var(--fav-grid-bg);
  color: var(--fav-grid);
}
.fav-featured-card[data-type="dash"] .fav-type-badge {
  background: var(--fav-dash-bg);
  color: var(--fav-dash);
}
.fav-featured-card[data-type="github"] .fav-type-badge {
  background: var(--fav-github-bg);
  color: var(--fav-github);
}

.fav-card-actions {
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity .12s;
  flex-shrink: 0;
}

.fav-card:hover .fav-card-actions {
  opacity: 1;
}

.fav-action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-xs);
  background: var(--surface-3);
  border: 1px solid var(--border);
  color: var(--text-3);
  cursor: pointer;
  transition: all .12s;
  flex-shrink: 0;
}

.fav-action-btn:hover {
  color: var(--text);
  border-color: var(--border-hi);
}
.fav-action-btn.danger:hover {
  color: #f87171;
  border-color: rgba(248,113,113,.3);
  background: rgba(248,113,113,.08);
}

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

.fav-card-tag:hover {
  color: var(--accent);
  border-color: var(--accent-line);
}

.fav-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.fav-card-cat {
  font-size: 10.5px;
  color: var(--text-4);
}
.fav-card-date {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-4);
}

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

.fav-empty-icon {
  color: var(--text-4);
  margin-bottom: 4px;
}
.fav-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-2);
}
.fav-empty-hint {
  font-size: 12.5px;
  color: var(--text-3);
  max-width: 280px;
  line-height: 1.6;
}

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

#fav-modal-overlay.open {
  display: flex;
}

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
  from {
    opacity: 0;
    transform: translateY(-14px) scale(.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* URL field border transitions to detected type color */
#fav-modal[data-detected="site"] #fav-modal-url {
  border-color: var(--fav-site);
}
#fav-modal[data-detected="slack"] #fav-modal-url {
  border-color: var(--fav-slack);
}
#fav-modal[data-detected="grid"] #fav-modal-url {
  border-color: var(--fav-grid);
}
#fav-modal[data-detected="dash"] #fav-modal-url {
  border-color: var(--fav-dash);
}

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
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: all .12s;
  line-height: 0;
}

.fav-modal-close:hover {
  background: var(--surface-3);
  border-color: var(--border);
  color: var(--text);
}

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

.fav-field-input::placeholder {
  color: var(--text-4);
}
.fav-field-input:focus {
  border-color: var(--border-hi);
  background: var(--surface-2);
}

.fav-url-wrap {
  position: relative;
}

#fav-modal-url {
  padding-right: 76px;
  transition: border-color .25s;
}

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

.fav-url-detected.visible {
  opacity: 1;
}
.fav-url-detected.visible.site {
  background: var(--fav-site-bg);
  color: var(--fav-site);
}
.fav-url-detected.visible.slack {
  background: var(--fav-slack-bg);
  color: var(--fav-slack);
}
.fav-url-detected.visible.grid {
  background: var(--fav-grid-bg);
  color: var(--fav-grid);
}
.fav-url-detected.visible.dash {
  background: var(--fav-dash-bg);
  color: var(--fav-dash);
}

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

.fav-type-btn:hover {
  color: var(--text-2);
  border-color: var(--border-mid);
}

.fav-type-btn.active[data-t="site"] {
  background: var(--fav-site-bg);
  border-color: var(--fav-site);
  color: var(--fav-site);
}
.fav-type-btn.active[data-t="slack"] {
  background: var(--fav-slack-bg);
  border-color: var(--fav-slack);
  color: var(--fav-slack);
}
.fav-type-btn.active[data-t="grid"] {
  background: var(--fav-grid-bg);
  border-color: var(--fav-grid);
  color: var(--fav-grid);
}
.fav-type-btn.active[data-t="dash"] {
  background: var(--fav-dash-bg);
  border-color: var(--fav-dash);
  color: var(--fav-dash);
}
.fav-type-btn.active[data-t="github"] {
  background: var(--fav-github-bg);
  border-color: var(--fav-github);
  color: var(--fav-github);
}

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

.fav-cat-sel-btn:hover {
  color: var(--text-2);
  border-color: var(--border-mid);
}

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

.fav-tags-wrap:focus-within {
  border-color: var(--border-hi);
}

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

.fav-tag-chip-rm:hover {
  color: var(--text);
}

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

.fav-tags-input::placeholder {
  color: var(--text-4);
}

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

.fav-modal-btns {
  display: flex;
  gap: 7px;
}

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

.fav-btn-cancel:hover {
  background: var(--surface-2);
  color: var(--text);
}

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

.fav-btn-save:hover {
  background: var(--accent-2);
  transform: translateY(-1px);
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  #fav-sidebar {
    width: 170px;
  }
  #fav-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  .fav-featured-row {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  #fav-type-tabs {
    flex-wrap: wrap;
    gap: 3px;
    padding: 7px 12px;
  }
  .fav-type-tab {
    padding: 4px 8px;
    font-size: 11px;
  }
  #fav-toolbar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 9px 14px;
  }
}

@media (max-width: 600px) {
  #mode-favorites {
    flex-direction: column;
  }
  /* Sidebar escondida por padrão — clique no ◆ para abrir */
  #fav-sidebar {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: none;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0 8px;
    gap: 4px;
    align-items: flex-start;
    transition: max-height 0.25s ease;
  }
  #fav-sidebar.col-collapsed {
    max-height: 50vh;
    overflow-y: auto;
    padding: 6px 8px;
    border-bottom: 1px solid var(--border);
    opacity: 1;
    pointer-events: auto;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }
  .fav-sidebar-section {
    padding: 0;
    flex: 1;
    min-width: 100px;
  }
  .fav-sidebar-label {
    font-size: 8px;
  }
  .fav-cat-item {
    padding: 3px 6px;
    font-size: 11px;
  }
  .fav-sidebar-divider {
    display: none;
  }
  #fav-main {
    flex: 1;
    min-height: 0;
  }
  #fav-toolbar {
    padding: 8px 10px;
    gap: 6px;
  }
  #fav-add-btn {
    padding: 6px 10px;
    font-size: 11px;
  }
  #fav-type-tabs {
    padding: 6px 10px;
    gap: 2px;
  }
  .fav-type-tab {
    padding: 3px 7px;
    font-size: 10px;
    gap: 4px;
  }
  #fav-scroll {
    padding: 12px 10px 24px;
  }
  #fav-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .fav-featured-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  /* Cards compactos em mobile */
  .fav-card {
    padding: 10px 12px;
  }
  #fav-modal {
    width: calc(100vw - 24px);
    max-width: none;
    margin: 8px;
  }
  #fav-modal-overlay {
    padding-top: 24px;
  }
  .fav-modal-body {
    padding: 12px 14px;
    gap: 10px;
  }
  .fav-type-selector {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .fav-type-btn {
    padding: 5px 4px;
    font-size: 10px;
  }
  .fav-kbd-hint {
    display: none;
  }
}

</style>
    <style>
/* ════ Podcasts mode ════ */
#mode-podcasts {
  background: var(--bg);
}

/* ── List column ── */
#pod-col {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
#pod-col-head {
  display: flex;
  align-items: center;
  padding: 18px 18px 10px;
  gap: 10px;
  flex-shrink: 0;
}
#pod-col-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--text);
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
#pod-col-title .ico { width: 18px; height: 18px; color: var(--accent); }

/* ── Health badge ── */
#pod-health {
  width: auto;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--surface-2);
  color: var(--text-3);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-family: var(--font-ui);
  transition: all .12s;
}
#pod-health .ico { width: 12px; height: 12px; }
#pod-health:hover { background: var(--surface-3); }
.pod-health-checking { color: var(--text-4); }
.pod-health-ok { color: var(--accent); border-color: var(--accent-line); background: var(--accent-dim); }
.pod-health-bad { color: #fbbf24; border-color: rgba(251,191,36,.35); background: rgba(251,191,36,.1); }

.pod-health-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height .2s ease;
  flex-shrink: 0;
}
.pod-health-panel.open { max-height: 240px; padding: 0 18px 12px; overflow-y: auto; }
.pod-health-row {
  font-size: 12px;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pod-health-row.ok { color: var(--accent); }
.pod-health-row.bad { color: #fbbf24; }
.pod-health-row .ico { width: 13px; height: 13px; }
.pod-health-row code { font-family: var(--font-mono); font-size: 11px; color: var(--text-2); }
.pod-health-cmd {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 10px;
  margin: 6px 0;
  background: var(--surface-3);
  border-radius: var(--r-sm);
}
.pod-health-dep { font-size: 11px; font-weight: 700; color: var(--accent); }
.pod-health-cmd code {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text);
  cursor: pointer;
}
.pod-health-note {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.6;
  padding-top: 8px;
}
.pod-health-note code { font-family: var(--font-mono); color: var(--accent); background: var(--surface-2); padding: 1px 4px; border-radius: 3px; }

#pod-filters {
  padding: 0 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
#pod-search {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 11px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 12.5px;
  font-family: var(--font-ui);
}
#pod-search:focus { outline: none; border-color: var(--accent-line); }
#pod-folder-filter {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 11px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 12.5px;
  font-family: var(--font-ui);
  cursor: pointer;
}

#pod-list {
  flex: 1;
  overflow-y: auto;
}
.pod-empty {
  padding: 34px 22px;
  text-align: center;
  color: var(--text-3);
  font-size: 12.5px;
  line-height: 1.7;
}
.pod-empty code {
  background: var(--surface-3);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent);
}

.pod-item {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background .1s;
  border-left: 2px solid transparent;
}
.pod-item:hover { background: var(--surface-2); }
.pod-item.active {
  background: var(--surface-2);
  border-left-color: var(--accent);
}
.pod-item.active .pod-item-title { color: var(--accent); }
.pod-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.pod-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.pod-item-title .ico { width: 14px; height: 14px; flex-shrink: 0; }
.pod-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-3);
  overflow: hidden;
  white-space: nowrap;
}
.pod-folder {
  color: var(--accent);
  font-weight: 500;
}
.pod-dot { color: var(--text-4); }

.pod-status {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.pod-status.gen {
  background: rgba(96, 165, 250, .14);
  color: #60a5fa;
}
.pod-status.gen .ico { width: 11px; height: 11px; animation: pod-spin 1s linear infinite; }
@keyframes pod-spin { to { transform: rotate(360deg); } }
.pod-status.err {
  background: rgba(251, 113, 133, .14);
  color: #fb7185;
}

/* ── Player column ── */
#pod-player {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}
#pod-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-3);
  font-size: 13px;
}
#pod-empty-mark {
  width: 48px;
  height: 48px;
  border-radius: var(--r-lg);
  background: var(--surface-2);
  display: grid;
  place-items: center;
}
#pod-empty-mark .ico { width: 22px; height: 22px; color: var(--text-4); }

#pod-detail {
  flex: 1;
  display: none;
  flex-direction: column;
  min-height: 0;
}

#pod-head {
  padding: 18px 24px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-soft);
}
#pod-title-input {
  flex: 1;
  min-width: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--text);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  padding: 6px 9px;
  font-family: var(--font-ui);
}
#pod-title-input:hover { border-color: var(--border); }
#pod-title-input:focus { outline: none; border-color: var(--accent-line); background: var(--surface); }

#pod-folder-input {
  width: 150px;
  font-size: 12.5px;
  color: var(--accent);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 6px 10px;
  font-family: var(--font-ui);
}
#pod-folder-input:focus { outline: none; border-color: var(--accent-line); }

#pod-id-badge {
  font-size: 11px;
  color: var(--text-4);
  font-family: var(--font-mono);
  padding: 4px 8px;
  background: var(--surface-2);
  border-radius: var(--r-xs);
}

#pod-head-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: all .12s;
}
.tool-btn:hover { background: var(--surface-3); color: var(--text); }
.tool-btn.danger:hover { background: rgba(251, 113, 133, .14); color: #fb7185; border-color: rgba(251, 113, 133, .35); }
.tool-btn .ico { width: 14px; height: 14px; }

#pod-audio-wrap {
  padding: 16px 24px;
  flex-shrink: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border-soft);
}
#pod-audio {
  width: 100%;
  height: 38px;
  border-radius: var(--r-md);
}

#pod-meta {
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--text-3);
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-soft);
  flex-wrap: wrap;
}
#pod-meta .ico { width: 13px; height: 13px; vertical-align: -2px; margin-right: 3px; }
#pod-meta span { display: inline-flex; align-items: center; }

/* ── Script (roteiro) ── */
#pod-script {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pod-script-pending {
  color: var(--text-3);
  font-size: 13px;
  font-style: italic;
}
.pod-line {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.pod-line-name {
  flex-shrink: 0;
  width: 90px;
  font-size: 12.5px;
  font-weight: 700;
  padding-top: 1px;
}
.pod-line-text {
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--text);
}

/* ── Slides stage ── */
#pod-slides-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #000;
  position: relative;
}
#pod-slides-host {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
#pod-slides-host:fullscreen { width: 100vw; height: 100vh; }
#pod-slides-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, .9);
  color: #fff;
  font-size: 12px;
  border-top: 1px solid rgba(255, 255, 255, .08);
}
#pod-slide-counter {
  font-family: var(--font-mono);
  color: rgba(255, 255, 255, .6);
  flex-shrink: 0;
}
#pod-slide-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, .85);
  font-weight: 500;
}
#pod-slides-bar .tool-btn {
  background: rgba(255, 255, 255, .06);
  border-color: rgba(255, 255, 255, .12);
  color: rgba(255, 255, 255, .7);
  padding: 4px 8px;
}
#pod-slides-bar .tool-btn:hover {
  background: rgba(255, 255, 255, .14);
  color: #fff;
}

/* ── Tags ── */
.pod-item-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 4px;
}

#pod-tags-input {
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
  max-width: 220px;
}
#pod-tags-input:focus {
  border-color: var(--accent-line);
}
#pod-tags-input::placeholder {
  color: var(--text-3);
}

/* ════════ Responsivo ════════ */
@media (max-width: 900px) {
  #pod-col {
    width: 220px;
  }
  #pod-head {
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 16px 10px;
  }
  #pod-folder-input {
    width: 120px;
  }
  #pod-tags-input {
    max-width: 160px;
  }
}

@media (max-width: 600px) {
  #mode-podcasts {
    flex-direction: column;
  }
  /* Sidebar escondida por padrão — clique no ◆ para abrir */
  #pod-col {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    flex-shrink: 0;
    border-right: none;
    border-bottom: none;
    transition: max-height 0.25s ease;
  }
  #pod-col.col-collapsed {
    max-height: 60vh;
    overflow-y: auto;
    border-bottom: 1px solid var(--border);
    opacity: 1;
    pointer-events: auto;
    width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }
  #pod-col-head {
    padding: 8px 12px 6px;
  }
  #pod-col-title {
    font-size: 14px;
  }
  .pod-item {
    padding: 7px 12px;
  }
  .pod-item-title {
    font-size: 11.5px;
  }
  .pod-item-meta {
    font-size: 10px;
  }
  #pod-player {
    flex: 1;
    min-height: 0;
  }
  #pod-head {
    padding: 10px 12px 8px;
    gap: 6px;
  }
  #pod-title-input {
    font-size: 15px;
    min-width: 0;
  }
  #pod-folder-input {
    width: 100px;
    flex: 1;
  }
  #pod-tags-input {
    max-width: none;
    flex: 1;
  }
  #pod-head-actions {
    gap: 4px;
  }
  #pod-head-actions .tool-btn {
    padding: 0 8px;
    font-size: 11px;
    height: 28px;
  }
  #pod-audio-wrap {
    padding: 10px 14px;
  }
  #pod-meta {
    padding: 8px 14px;
    gap: 10px;
  }
  #pod-script {
    padding: 14px 16px;
    gap: 10px;
  }
  .pod-line-name {
    width: 60px;
    font-size: 11px;
  }
  .pod-line-text {
    font-size: 12px;
  }
}

</style>
    <style>
/* ════ Grafo de conhecimento ════ */
#mode-graph {
  flex-direction: column;
  position: relative;
  /* cor por tipo de nó — lidas pelo graph.js via getComputedStyle */
  --kg-note: #6ea8fe;
  --kg-task: #f6a06a;
  --kg-diagram: #a78bfa;
  --kg-macro: #4ade80;
  --kg-podcast: #f472b6;
  --kg-favorite: #fbbf24;
  --kg-skill: #22d3ee;
  --kg-tag: var(--text-3);
}

#kg-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-wrap: wrap;
}
.kg-title {
  font-weight: 600;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.kg-title .ico { width: 15px; height: 15px; }
#kg-count {
  color: var(--text-3);
  font-size: 12px;
  font-family: var(--font-mono);
}
.kg-tool-btn {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
  border-radius: 7px;
  padding: 5px 11px;
  font-size: 12px;
  font-family: var(--font-ui);
  cursor: pointer;
}
.kg-tool-btn:hover {
  color: var(--text);
  border-color: var(--border-hi);
}

#kg-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-left: auto;
}
.kg-leg {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-3);
  cursor: pointer;
  user-select: none;
  transition: opacity .12s, color .12s;
}
.kg-leg:hover { color: var(--text); }
.kg-leg.off { opacity: .38; text-decoration: line-through; }
.kg-leg i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.kg-leg-note i { background: var(--kg-note); }
.kg-leg-task i { background: var(--kg-task); }
.kg-leg-diagram i { background: var(--kg-diagram); }
.kg-leg-macro i { background: var(--kg-macro); }
.kg-leg-podcast i { background: var(--kg-podcast); }
.kg-leg-favorite i { background: var(--kg-favorite); }
.kg-leg-skill i { background: var(--kg-skill); }
.kg-leg-tag i { background: var(--kg-tag); }

#kg-canvas {
  flex: 1;
  min-height: 0;
  position: relative;
  background:
    radial-gradient(1200px 700px at 50% 45%, rgba(255, 255, 255, .015),
    transparent 70%), var(--bg);
}
svg#kg-svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}
svg#kg-svg:active { cursor: grabbing; }

.kg-link { stroke: var(--border-hi); stroke-width: 1.2; stroke-opacity: .6; }
.kg-link-reference { stroke: var(--kg-task); stroke-width: 2; stroke-opacity: .85; }
.kg-link.kg-hi { stroke: var(--accent); stroke-width: 2.4; stroke-opacity: 1; }
.kg-link.kg-dim { opacity: .06; }

.kg-node { cursor: pointer; }
.kg-halo { pointer-events: none; }
.kg-core {
  stroke: var(--bg);
  stroke-width: 2;
  transition: transform .16s ease;
}
.kg-node:hover .kg-core { transform: scale(1.15); }
.kg-label {
  font-family: var(--font-ui);
  font-size: 11px;
  fill: var(--text-2);
  pointer-events: none;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-width: 3.5px;
  stroke-linejoin: round;
}
.kg-node-tag .kg-label { fill: var(--text-3); font-style: italic; }
.kg-node.kg-selected .kg-core { stroke: var(--text); stroke-width: 3; }
.kg-node.kg-selected .kg-label { fill: var(--text); font-weight: 600; }
.kg-node.kg-dim { opacity: .15; }
.kg-node.kg-dim .kg-label { opacity: 0; }

#kg-empty {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-3);
  text-align: center;
  padding: 40px;
}
#kg-empty[data-show="1"] { display: flex; }
.kg-empty-mark { width: 44px; height: 44px; opacity: .4; }
.kg-empty-hint { font-size: 13px; max-width: 340px; line-height: 1.55; }

/* ════════ Responsivo ════════ */
@media (max-width: 600px) {
  #kg-toolbar {
    padding: 8px 10px;
    gap: 8px;
  }
  .kg-title {
    font-size: 14px;
  }
  .kg-tool-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  #kg-legend {
    gap: 8px;
    margin-left: 0;
  }
  .kg-leg {
    font-size: 10px;
    gap: 3px;
  }
  .kg-empty-hint {
    font-size: 12px;
    max-width: 260px;
  }
}

</style>
  </head>
  <body>
    <!-- ════ Left rail — mode switcher ════ -->
    <nav id="rail">
      <div id="rail-logo" title="Recolher sidebar" onclick="toggleSidebar()">◆</div>
      <button class="rail-btn active" id="rail-graph" onclick="setMode('graph')"
        title="Grafo de conhecimento">
    <span class="rail-ico" data-icon="waypoints"></span><span class="rail-lbl">Grafo</span>
  </button>
      <button class="rail-btn" id="rail-notes" onclick="setMode('notes')"
        title="Notas">
    <span class="rail-ico" data-icon="notebook"></span><span class="rail-lbl">Notas</span>
  </button>
      <button class="rail-btn" id="rail-macros" onclick="setMode('macros')"
        title="Macros">
    <span class="rail-ico" data-icon="bot"></span><span class="rail-lbl">Macros</span>
  </button>
      <button class="rail-btn" id="rail-skills" onclick="setMode('skills')"
        title="Skills">
    <span class="rail-ico" data-icon="sparkles"></span><span class="rail-lbl">Skills</span>
  </button>
      <button class="rail-btn" id="rail-diagrams" onclick="setMode('diagrams')"
        title="Diagramas">
    <span class="rail-ico" data-icon="git-branch"></span><span class="rail-lbl">Diag</span>
  </button>
      <button class="rail-btn" id="rail-tasks" onclick="setMode('tasks')"
        title="Kanban">
    <span class="rail-ico" data-icon="kanban"></span><span class="rail-lbl">Tasks</span>
  </button>
      <button class="rail-btn" id="rail-mocks" onclick="setMode('mocks')"
        title="Mocks HTTP">
    <span class="rail-ico" data-icon="share"></span><span class="rail-lbl">Mocks</span>
  </button>
      <button class="rail-btn" id="rail-favorites"
        onclick="setMode('favorites')" title="Favoritos">
    <span class="rail-ico" data-icon="bookmark"></span><span class="rail-lbl">Favs</span>
  </button>
      <button class="rail-btn" id="rail-podcasts"
        onclick="setMode('podcasts')" title="Podcasts">
    <span class="rail-ico" data-icon="mic"></span><span class="rail-lbl">Pods</span>
  </button>
      <button class="rail-btn" id="rail-canvas" onclick="setMode('canvas')"
        title="Canvas Realtime">
    <span class="rail-ico" data-icon="paintbrush"></span><span class="rail-lbl">Canva</span>
  </button>
      <div class="rail-spacer"></div>
      <button class="rail-btn" id="rail-settings" onclick="openSettings()"
        title="Configurações">
    <span class="rail-ico" data-icon="settings"></span><span class="rail-lbl">Ajustes</span>
  </button>
    </nav>

    <!-- ════ Content ════ -->
    <div id="stage">
      <!-- Update banner -->
      <div id="update-banner">
        <span id="update-text"></span>
        <button id="update-apply"
          onclick="applyUpdate()">Atualizar agora</button>
        <button id="update-dismiss" onclick="dismissUpdate()">Depois</button>
      </div>

      <!-- ═══ MODE: NOTES ═══ -->
      <main id="mode-notes" class="mode">
        <section id="notes-col">
          <div id="notes-col-head">
            <div id="notes-col-title">Notas</div>
            <button id="notes-new-btn" title="Nova nota" onclick="newNote()"
              data-icon="plus"></button>
          </div>
          <div id="notes-search-box">
            <input id="notes-search-input" type="text"
              placeholder="Buscar notas…" autocomplete="off"
              spellcheck="false" />
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
        </section>

        <section id="notes-editor">
          <div id="notes-editor-empty">
            <div id="notes-editor-empty-mark" data-icon="pencil"></div>
            <div id="notes-editor-empty-text">Selecione ou crie uma nota</div>
          </div>

          <div id="notes-editor-form">
            <div id="note-head">
              <input id="note-title-input" type="text"
                placeholder="Título da nota…" />
              <span id="note-id-badge" style="display:none"
                onclick="copyNoteId()"
                title="Clique para copiar o ID (use numa IA)"></span>
              <button class="note-head-btn" id="btn-note-markmap"
                style="display:none" onclick="toggleNoteMarkmap()"
                title="Ver como mapa mental"><span data-icon="tree"></span></button>
              <button class="note-head-btn" id="btn-annot"
                style="display:none;width:auto;padding:0 9px;gap:5px;" onclick="toggleAnnotations()"
                title="Anotações do mapa mental"><span data-icon="highlighter"></span><span id="annot-count" style="font-size:10px">0</span></button>
            </div>
            <div id="note-toolbar">
              <div id="note-cat-field">
                <span id="note-cat-dot" class="note-cat-dot"></span>
                <input id="note-cat-input" list="note-cat-list"
                  placeholder="categoria" autocomplete="off" />
                <datalist id="note-cat-list"></datalist>
              </div>
              <input id="note-tags-input" type="text"
                placeholder="tags, separadas, por vírgula" />
              <button class="tool-btn" id="btn-preview"
                onclick="toggleNotePreview()"><span data-icon="eye"></span> Preview</button>
              <button class="tool-btn" id="btn-copy-note" style="display:none"
                onclick="copyNoteId()"><span data-icon="hash"></span> ID</button>
              <button class="tool-btn danger" id="btn-delete-note"
                style="display:none"
                onclick="deleteCurrentNote()"><span data-icon="trash"></span></button>
              <button class="tool-btn primary"
                onclick="saveCurrentNote()">Salvar</button>
            </div>
            <div id="note-body">
              <textarea id="note-content-textarea"
                placeholder="Escreva em markdown…"></textarea>
              <div id="note-preview"></div>
              <div id="note-markmap"></div>
            </div>

            <!-- Annotation panel (contextual ao markmap da nota) -->
            <aside id="annot-panel">
              <div id="annot-head">
                <span id="annot-head-title">Anotações da nota</span>
                <button class="ghost-btn" id="annot-copy-all"
                  onclick="copyAnnotationsForAI()"
                  title="Copiar todas para colar numa IA">
              <span data-icon="sparkles"></span> Copiar p/ IA
            </button>
              </div>
              <div id="annot-list">
                <div id="annot-empty">Selecione um trecho do mapa e clique em <strong>Comentar</strong> para anotar.</div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <!-- ═══ MODE: MACROS ═══ -->
      <main id="mode-macros" class="mode">
        <section id="macros-col">
          <div id="macros-col-head">
            <div id="macros-col-title">Macros</div>
            <button id="macros-new-btn" title="Nova macro" onclick="newMacro()"
              data-icon="plus"></button>
          </div>
          <div id="macros-list"></div>
        </section>

        <section id="macros-editor">
          <div id="macros-editor-empty">
            <div id="macros-editor-empty-mark" data-icon="bot"></div>
            <div id="macros-editor-empty-text">Selecione ou crie uma macro</div>
          </div>

          <div id="macro-path-hint">
            <span data-icon="info"></span>
            Apps GUI não herdam o PATH do terminal. Prefira caminhos absolutos ou source seu perfil no script.
          </div>

          <div id="macros-editor-form">
            <div id="macro-head">
              <input id="macro-title-input" type="text"
                placeholder="Nome da macro…" />
              <span id="macro-interp-badge"
                title="Interpretador detectado pelo shebang"></span>
              <div id="macro-head-actions">
                <button class="tool-btn" id="btn-macro-delete"
                  style="display:none"
                  onclick="deleteCurrentMacro()"><span data-icon="trash"></span></button>
                <button class="tool-btn primary" id="btn-macro-save"
                  onclick="saveCurrentMacro()">Salvar</button>
                <button class="tool-btn macro-run-btn" id="btn-macro-run"
                  onclick="runCurrentMacro()">
              <span data-icon="sparkles"></span> Executar
            </button>
              </div>
            </div>

            <div id="macro-desc-row">
              <input id="macro-desc-input" type="text"
                placeholder="Descrição curta…" />
              <input id="macro-tags-input" type="text"
                placeholder="tags, separadas, por vírgula" />
            </div>

            <div id="macro-body">
              <textarea id="macro-script" spellcheck="false"
                placeholder="#!/bin/bash&#10;# Seu script aqui&#10;# Variáveis disponíveis:&#10;#   $DOCMAP_API       → http://127.0.0.1:3334&#10;#   $DOCMAP_WORKSPACE → pasta aberta&#10;&#10;echo &quot;Olá do docmap!&quot;"></textarea>
            </div>

            <div id="macro-output-panel">
              <div id="macro-output-header">
                <span id="macro-output-title">Output</span>
                <span id="macro-status-badge"></span>
                <button class="ghost-btn" id="btn-macro-clear"
                  onclick="clearOutput()" style="display:none">limpar</button>
                <button class="ghost-btn danger" id="btn-macro-stop"
                  onclick="stopMacro()" style="display:none">⬛ Parar</button>
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
            <button id="skills-new-btn" title="Nova skill" onclick="newSkill()"
              data-icon="plus"></button>
          </div>
          <div id="skills-search-box">
            <input id="skills-search-input" type="text"
              placeholder="Buscar skills…" autocomplete="off"
              spellcheck="false" />
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
              <input id="skill-title-input" type="text"
                placeholder="Título da skill…" />
              <span id="skill-name-badge"
                title="Nome/slug (use numa IA: GET /skills/nome)"></span>
            </div>
            <div id="skill-toolbar">
              <div id="skill-name-field">
                <span id="skill-name-prefix">@</span>
                <input id="skill-name-input" type="text"
                  placeholder="nome-da-skill" autocomplete="off"
                  spellcheck="false" />
              </div>
              <input id="skill-tags-input" type="text"
                placeholder="tags, separadas, por vírgula" />
              <button class="tool-btn" id="btn-skill-preview"
                onclick="toggleSkillPreview()"><span data-icon="eye"></span> Preview</button>
              <button class="tool-btn" id="btn-skill-copy" style="display:none"
                onclick="copySkillRef()"><span data-icon="copy"></span> Ref</button>
              <button class="tool-btn danger" id="btn-skill-delete"
                style="display:none"
                onclick="deleteCurrentSkill()"><span data-icon="trash"></span></button>
              <button class="tool-btn primary"
                onclick="saveCurrentSkill()">Salvar</button>
            </div>
            <div id="skill-desc-row">
              <input id="skill-desc-input" type="text"
                placeholder="Descrição curta (aparece na listagem da IA)…" />
            </div>
            <div id="skill-body">
              <textarea id="skill-content-textarea"
                placeholder="# Instruções&#10;&#10;Escreva em markdown. Use blocos de código para scripts:&#10;&#10;\`\`\`bash&#10;#!/bin/bash&#10;echo &quot;faça algo&quot;&#10;\`\`\`"></textarea>
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
            <button id="diag-new-btn" title="Novo diagrama"
              onclick="newDiagram()" data-icon="plus"></button>
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
              <input id="diag-title-input" type="text"
                placeholder="Título do diagrama…" />
              <input id="diag-tags-input" type="text"
                placeholder="tags, separadas, por vírgula" />
              <span id="diag-id-badge" style="display:none"
                title="Clique para copiar o deep link"></span>
              <div id="diag-head-actions">
                <button class="tool-btn" id="btn-diag-copy-link"
                  style="display:none"
                  onclick="copyDiagramLink()"><span data-icon="copy"></span> Link</button>
                <button class="tool-btn danger" id="btn-diag-delete"
                  style="display:none"
                  onclick="deleteCurrentDiagram()"><span data-icon="trash"></span></button>
                <button class="tool-btn primary"
                  onclick="saveCurrentDiagram()">Salvar</button>
              </div>
            </div>

            <div id="diag-body">
              <div id="diag-preview-col">
                <div id="diag-zoom-bar">
                  <button class="diag-zoom-btn" onclick="diagZoomOut()"
                    title="Afastar" data-icon="zoom-out"></button>
                  <span id="diag-zoom-label">100%</span>
                  <button class="diag-zoom-btn" onclick="diagZoomIn()"
                    title="Aproximar" data-icon="zoom-in"></button>
                  <button class="diag-zoom-btn" onclick="diagZoomReset()"
                    title="Resetar zoom" data-icon="maximize-2"></button>
                </div>
                <div id="diag-preview"></div>
              </div>
              <div id="diag-source-col">
                <div id="diag-source-header" onclick="toggleDiagSource()">
                  <span>⌨ Código Mermaid</span>
                  <span id="diag-source-toggle">▸</span>
                  <a href="https://mermaid.js.org/syntax/flowchart.html"
                    target="_blank" id="diag-docs-link"
                    onclick="event.stopPropagation()">docs ↗</a>
                </div>
                <textarea id="diag-source"
                  placeholder="flowchart LR&#10;  A[Início] --> B{Decisão}&#10;  B -->|Sim| C[Resultado]&#10;  B -->|Não| D[Outro]"
                  spellcheck="false"></textarea>
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
            <button class="mocks-hd-btn" onclick="newCollection()"
              title="Nova collection" data-icon="plus"></button>
          </div>
          <div id="mocks-col-list"></div>

          <div id="mocks-list-head">
            <span id="mocks-list-heading">Todos os mocks</span>
            <button class="mocks-hd-btn" onclick="newMock()" title="Novo mock"
              data-icon="plus"></button>
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
                <button class="tool-btn danger" id="btn-mock-delete"
                  style="display:none" onclick="deleteCurrentMock()">
                  <span data-icon="trash"></span>
                </button>
                <button class="tool-btn" id="btn-mock-curl" onclick="copyCurl()"
                  title="Copiar curl">
              <span data-icon="copy"></span> curl
            </button>
                <button class="tool-btn" id="btn-mock-test"
                  onclick="showTestPanel()">
              <span data-icon="scan-line"></span> Testar
            </button>
                <button class="tool-btn primary"
                  onclick="saveMock()">Salvar</button>
              </div>
            </div>

            <div id="mock-meta-row">
              <div class="mock-field">
                <label class="mock-label">Collection</label>
                <select id="mock-collection-select"
                  class="mock-select"></select>
              </div>
              <div class="mock-field">
                <label class="mock-label">Método</label>
                <select id="mock-method-select" class="mock-select"
                  data-method="GET" onchange="onMethodChange(this)">
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
              <input id="mock-path-input" type="text" class="mock-input"
                placeholder="/users/:id" spellcheck="false"
                autocomplete="off" />
            </div>

            <div id="mock-meta-row-2">
              <div class="mock-field">
                <label class="mock-label">Nome</label>
                <input id="mock-name-input" type="text" class="mock-input"
                  placeholder="Get user by ID" autocomplete="off" />
              </div>
              <div class="mock-field">
                <label class="mock-label">Grupo</label>
                <input id="mock-group-input" type="text" class="mock-input"
                  placeholder="Authentication" autocomplete="off"
                  list="mock-groups-list" />
                <datalist id="mock-groups-list"></datalist>
              </div>
              <div class="mock-field">
                <label class="mock-label">Tags</label>
                <input id="mock-tags-input" type="text" class="mock-input"
                  placeholder="tags, separadas, por vírgula" autocomplete="off" />
              </div>
            </div>

            <div class="mock-field mock-field-script">
              <div id="mock-script-label-row">
                <label class="mock-label">Script JS</label>
                <span
                  id="mock-script-hint">ctx · db · retorna <code>{ status?, headers?, body? }</code></span>
                <button class="ghost-btn" id="btn-format-script"
                  onclick="formatScript()" title="Formatar código">
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
                <button class="ghost-btn"
                  onclick="hideTestPanel()"><span data-icon="x"></span></button>
              </div>
              <div id="mock-test-params"></div>
              <button class="tool-btn" id="btn-test-run"
                onclick="runTest()">Executar</button>
              <div id="mock-test-result" style="display:none"></div>
            </div>
          </div>
        </section>
      </main>

      <!-- ═══ MODE: TASKS / KANBAN ═══ -->
      <main id="mode-tasks" class="mode">
        <div id="kanban-project-bar">
          <select id="kanban-project-select" onchange="renderBoard()">
            <option value="">Sem projeto</option>
          </select>
          <button id="kanban-project-add-btn" onclick="openNewProject()"
            title="Novo projeto">
            <span data-icon="plus"></span>
          </button>
          <button id="kanban-project-del-btn" onclick="deleteSelectedProject()"
            title="Remover projeto" disabled>
            <span data-icon="trash"></span>
          </button>
        </div>
        <div id="kanban-board">
          <div class="kanban-col" id="kanban-col-todo" data-status="todo">
            <div class="kanban-col-head">
              <span class="kanban-col-dot" data-col="todo"></span>
              <span class="kanban-col-title">A Fazer</span>
              <span class="kanban-col-count" id="kanban-count-todo">0</span>
              <button class="kanban-col-add" onclick="openNewTask('todo')"
                title="Adicionar task">
                <span data-icon="plus"></span>
              </button>
            </div>
            <div class="kanban-cards" id="kanban-cards-todo"></div>
          </div>

          <div class="kanban-col" id="kanban-col-in-progress"
            data-status="in-progress">
            <div class="kanban-col-head">
              <span class="kanban-col-dot" data-col="in-progress"></span>
              <span class="kanban-col-title">Em Andamento</span>
              <span class="kanban-col-count"
                id="kanban-count-in-progress">0</span>
              <button class="kanban-col-add"
                onclick="openNewTask('in-progress')" title="Adicionar task">
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
              <button class="kanban-col-add" onclick="openNewTask('done')"
                title="Adicionar task">
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
              <input id="fav-search" type="text"
                placeholder="Buscar por título, tag, categoria, URL…"
                autocomplete="off" spellcheck="false">
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
            <div class="fav-type-tab active"
              data-type="all">Todos <span class="fav-tab-count" id="fav-count-all">0</span></div>
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
              <span class="fav-section-count"
                id="fav-result-count">0 links</span>
            </div>

            <!-- Grid -->
            <div id="fav-grid"></div>

            <!-- Pagination -->
            <div id="fav-pagination"></div>

            <!-- Empty -->
            <div id="fav-empty" style="display:none">
              <span class="fav-empty-icon" data-icon="bookmark"></span>
              <div class="fav-empty-title">Nenhum favorito encontrado</div>
              <div
                class="fav-empty-hint">Tente buscar por outro termo ou adicione um novo link com ⌘K</div>
            </div>
          </div>
        </div>
      </main>

      <!-- ═══ MODE: PODCASTS ═══ -->
      <main id="mode-podcasts" class="mode">
        <section id="pod-col">
          <div id="pod-col-head">
            <div id="pod-col-title"><span data-icon="mic"></span>Podcasts</div>
            <button id="pod-health" class="pod-health-checking" title="Verificando dependências…"
              onclick="togglePodHealth()"></button>
          </div>
          <div id="pod-health-panel" class="pod-health-panel"></div>
          <div id="pod-filters">
            <input id="pod-search" type="text" placeholder="Buscar podcasts…" />
            <select id="pod-folder-filter">
              <option value="">Todas as pastas</option>
            </select>
          </div>
          <div id="pod-list"></div>
        </section>

        <section id="pod-player">
          <div id="pod-empty">
            <div id="pod-empty-mark" data-icon="mic"></div>
            <div id="pod-empty-text">Selecione um podcast para ouvir</div>
          </div>

          <div id="pod-detail" style="display:none">
            <div id="pod-head">
              <input id="pod-title-input" type="text" placeholder="Título do podcast…" />
              <input id="pod-folder-input" type="text" placeholder="pasta" list="pod-folder-list" />
              <input id="pod-tags-input" type="text"
                placeholder="tags, separadas, por vírgula" />
              <datalist id="pod-folder-list"></datalist>
              <span id="pod-id-badge" title="ID do podcast"></span>
              <div id="pod-head-actions">
                <button class="tool-btn" id="btn-pod-copy" style="display:none"
                  onclick="copyPodcastLink()"><span data-icon="copy"></span> Link</button>
                <button class="tool-btn danger" id="btn-pod-delete" style="display:none"
                  onclick="deleteCurrentPodcast()"><span data-icon="trash"></span></button>
              </div>
            </div>

            <div id="pod-audio-wrap" style="display:none">
              <audio id="pod-audio" controls preload="metadata"></audio>
            </div>
            <div id="pod-meta"></div>

            <div id="pod-slides-stage" style="display:none">
              <div id="pod-slides-host"></div>
              <div id="pod-slides-bar">
                <span id="pod-slide-counter"></span>
                <span id="pod-slide-title"></span>
                <button class="tool-btn" id="btn-slide-prev" type="button" title="Slide anterior"><span data-icon="chevron-left"></span></button>
                <button class="tool-btn" id="btn-slide-next" type="button" title="Próximo slide"><span data-icon="chevron-right"></span></button>
                <button class="tool-btn" id="btn-slide-full" type="button" title="Tela cheia"><span data-icon="maximize"></span></button>
              </div>
            </div>

            <div id="pod-script"></div>
          </div>
        </section>
      </main>

      <!-- ═══ MODE: CANVAS (realtime AI canvas) ═══ -->
      <main id="mode-canvas" class="mode">
        <div id="canvas-container">
          <iframe id="canvas-iframe" src="/canvas" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
      </main>

      <!-- ═══ MODE: GRAPH (grafo de conhecimento) ═══ -->
      <main id="mode-graph" class="mode active">
        <div id="kg-toolbar">
          <span class="kg-title"><span data-icon="waypoints"></span> Grafo de conhecimento</span>
          <span id="kg-count"></span>
          <button class="kg-tool-btn" onclick="loadGraph()">↻ Recarregar</button>
          <button class="kg-tool-btn" onclick="fitKg()">⤢ Ajustar</button>
          <button class="kg-tool-btn" onclick="clearKgSelection()">Limpar seleção</button>
          <div id="kg-legend"></div>
        </div>
        <div id="kg-canvas">
          <svg id="kg-svg"></svg>
          <div id="kg-empty">
            <span class="kg-empty-mark" data-icon="waypoints"></span>
            <div class="kg-empty-hint">Nenhuma entidade ainda. Crie notas, tasks, diagramas… e adicione <strong>tags</strong> — elas viram os nós que conectam tudo por tema.</div>
          </div>
        </div>
      </main>
    </div>

    <!-- Quick-Add / Edit Modal -->
    <div id="fav-modal-overlay">
      <div id="fav-modal">
        <div class="fav-modal-header">
          <span
            class="fav-modal-title"><span id="fav-modal-title-text">⚡ Novo Favorito</span></span>
          <button class="fav-modal-close" id="fav-modal-close"
            data-icon="x"></button>
        </div>
        <div class="fav-modal-body">
          <div>
            <div class="fav-field-label">URL</div>
            <div class="fav-url-wrap">
              <input class="fav-field-input" id="fav-modal-url"
                placeholder="cole ou digite a URL…" autocomplete="off"
                spellcheck="false">
              <span class="fav-url-detected" id="fav-url-detected"></span>
            </div>
          </div>
          <div>
            <div class="fav-field-label">Título</div>
            <input class="fav-field-input" id="fav-modal-title"
              placeholder="Nome do link…">
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
            <div
              class="fav-field-label">Tags — <span style="font-style:italic;text-transform:none;letter-spacing:0;font-family:var(--font-ui)">Enter para adicionar</span></div>
            <div class="fav-tags-wrap" id="fav-modal-tags-wrap">
              <input class="fav-tags-input" id="fav-modal-tags-input"
                placeholder="#api, #design…">
            </div>
          </div>
          <div>
            <div class="fav-field-label">Nota (opcional)</div>
            <input class="fav-field-input" id="fav-modal-note"
              placeholder="Para que serve esse link…">
          </div>
        </div>
        <div class="fav-modal-footer">
          <div class="fav-kbd-hint">
        <kbd class="fav-kbd">Enter</kbd> salva · <kbd class="fav-kbd">Esc</kbd> fecha
      </div>
          <div class="fav-modal-btns">
            <button class="fav-btn-cancel"
              id="fav-modal-cancel">Cancelar</button>
            <button class="fav-btn-save" id="fav-modal-save">Salvar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════ Task Modal ════ -->
    <div id="task-modal-overlay" onclick="closeTaskModalOnOverlay(event)">
      <div id="task-modal">
        <div id="task-modal-head">
          <input id="task-title-input" type="text" placeholder="Título da task…"
            autocomplete="off" />
          <select id="task-status-select">
            <option value="todo">A Fazer</option>
            <option value="in-progress">Em Andamento</option>
            <option value="done">Concluído</option>
          </select>
          <button class="kanban-modal-close" id="task-modal-close"
            onclick="closeTaskModal()" title="Fechar">
            <span data-icon="x"></span>
          </button>
        </div>
        <div id="task-modal-body">
          <div class="task-field">
            <label class="task-label">Descrição (markdown)</label>
            <textarea id="task-desc-textarea"
              placeholder="Detalhes, contexto, links…" rows="5"></textarea>
          </div>
          <div class="task-meta-row">
            <div class="task-field">
              <label class="task-label">Projeto</label>
              <select id="task-project-select">
                <option value="">Nenhum</option>
              </select>
            </div>
            <div class="task-field">
              <label class="task-label">Data limite</label>
              <input id="task-due-input" type="date" />
            </div>
            <div class="task-field">
              <label class="task-label">Tags</label>
              <input id="task-tags-input" type="text"
                placeholder="tags, separadas, por vírgula" />
            </div>
            <div class="task-field" style="position:relative">
              <label class="task-label">Nota vinculada</label>
              <div id="task-note-wrap">
                <input id="task-note-input" type="text"
                  placeholder="Buscar nota…" autocomplete="off"
                  oninput="filterNoteSearch()" onfocus="filterNoteSearch()" />
                <button id="task-note-clear" onclick="clearNoteLink()"
                  title="Remover nota" style="display:none">
                  <span data-icon="x"></span>
                </button>
              </div>
              <div id="task-note-dropdown"></div>
              <input type="hidden" id="task-note-id" />
            </div>
          </div>
        </div>
        <div id="task-modal-footer">
          <button class="tool-btn danger" id="task-delete-btn"
            style="display:none" onclick="deleteCurrentTask()">
            <span data-icon="trash"></span>
          </button>
          <div class="task-footer-spacer"></div>
          <button class="tool-btn" onclick="closeTaskModal()">Cancelar</button>
          <button class="tool-btn primary"
            onclick="saveCurrentTask()">Salvar</button>
        </div>
      </div>
    </div>

    <!-- ════ Project Modal ════ -->
    <div id="project-modal-overlay" onclick="closeProjectModalOnOverlay(event)">
      <div id="project-modal">
        <div id="project-modal-head">
          <input id="project-name-input" type="text"
            placeholder="Nome do projeto…" autocomplete="off" />
          <button class="kanban-modal-close" onclick="closeProjectModal()"
            title="Fechar">
            <span data-icon="x"></span>
          </button>
        </div>
        <div id="project-modal-footer">
          <div class="task-footer-spacer"></div>
          <button class="tool-btn" onclick="closeProjectModal()">Cancelar</button>
          <button class="tool-btn primary"
            onclick="saveProject()">Criar Projeto</button>
        </div>
      </div>
    </div>

    <!-- Floating comment button (shown on text selection in note markmap) -->
    <button id="markmap-comment-btn" type="button">Comentar</button>

    <!-- Annotation popover -->
    <div id="annot-popover">
      <div id="pop-head">
        <span id="pop-label">TRECHO</span>
        <span id="pop-quote"></span>
      </div>
      <div id="pop-types">
        <button class="type-btn active" data-type="note"
          onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-note)"></i> Nota</button>
        <button class="type-btn" data-type="decision"
          onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-decision)"></i> Decisão</button>
        <button class="type-btn" data-type="question"
          onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-question)"></i> Dúvida</button>
        <button class="type-btn" data-type="todo"
          onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-todo)"></i> TODO</button>
        <button class="type-btn" data-type="warning"
          onclick="selectAnnotType(this)"><i class="type-swatch" style="background:var(--type-warning)"></i> Atenção</button>
      </div>
      <div id="pop-body">
        <textarea id="pop-textarea"
          placeholder="Escreva a anotação…"></textarea>
      </div>
      <div id="pop-foot">
        <button class="pop-btn" id="pop-delete"
          onclick="deleteAnnotation()">Excluir</button>
        <button class="pop-btn" id="pop-cancel"
          onclick="closeAnnotPopover()">Cancelar</button>
        <button class="pop-btn primary" id="pop-save"
          onclick="saveAnnotation()">Salvar</button>
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

    <!-- ════ Settings Modal ════ -->
    <div id="settings-overlay" onclick="closeSettings(event)">
      <div id="settings-modal">
        <div id="settings-header">
          <span><span data-icon="settings"></span> Configurações</span>
          <button id="settings-close" onclick="closeSettings()" data-icon="x"></button>
        </div>
        <div id="settings-body">
          <div class="settings-row" id="settings-ip-row" onclick="copyNetworkIp()" title="Clique para copiar">
            <span class="settings-row-label">IP da rede</span>
            <span class="settings-row-value" id="settings-ip-value"></span>
          </div>
          <div class="settings-row" id="settings-theme-row" onclick="toggleTheme()">
            <span class="settings-row-label">Tema</span>
            <span class="settings-row-value" id="settings-theme-label"></span>
          </div>
          <div class="settings-row" onclick="copySkill()">
            <span class="settings-row-label">Copiar skill para IA</span>
            <span class="settings-row-hint">Markdown com endpoints</span>
          </div>
          <div class="settings-row" onclick="downloadBackup()">
            <span class="settings-row-label">Fazer backup</span>
            <span class="settings-row-hint">JSON com todos os dados</span>
          </div>
          <div class="settings-row" onclick="triggerRestore()">
            <span class="settings-row-label">Restaurar backup</span>
            <span class="settings-row-hint">Mescla com dados atuais</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ════ AI Sidebar — dockada à direita, colapsável, persistente ════ -->
    <aside id="agent-panel">
      <!-- Estado recolhido: rail fino vertical -->
      <button id="agent-collapsed" onclick="toggleAgent()" title="Abrir assistente">
        <span class="agent-orb"><span data-icon="bot"></span></span>
        <span class="agent-collapsed-label">Assistente</span>
      </button>

      <!-- Estado expandido: sidebar completa -->
      <div class="agent-body">
        <header id="chat-header">
          <span id="chat-title">
            <span class="agent-chip"><span data-icon="bot"></span></span>
            Assistente<span class="agent-presence" title="Disponível"></span>
          </span>
          <select id="chat-provider" title="Provedor de IA">
            <option value="ollama">Ollama (local)</option>
            <option value="deepseek">DeepSeek</option>
          </select>
          <div id="chat-header-actions">
            <button class="ghost-btn" onclick="clearChat()" title="Limpar conversa">limpar</button>
            <button class="ghost-btn" id="agent-collapse"
              onclick="toggleAgent()" title="Recolher">
              <span data-icon="panel-right"></span>
            </button>
          </div>
        </header>
        <div id="chat-feed"></div>
        <div id="chat-composer">
          <button id="chat-stop" onclick="stopChat()"
            style="display:none"><span data-icon="x"></span> Parar</button>
          <textarea id="chat-input" placeholder="Pergunte qualquer coisa… "
            rows="1"></textarea>
          <button id="chat-send" onclick="sendChatMessage()"
            data-icon="sparkles"></button>
        </div>
      </div>
    </aside>

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
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-7.48 3.74-3.74 7.48 7.48-3.74z"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h5"/>',
  'panel-right': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  rewind: '<polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/>',
  'fast-forward': '<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'audio-lines': '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  paintbrush: '<path d="M2 21C14 21 18 17 20 14c2-3 0-7-2-9-2-2-6-4-9-2C7 5 3 9 3 21h-1z"/><path d="M17 13c-3 1-5 3-6 6"/>',
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

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') delete root.dataset.theme;
  else root.dataset.theme = theme;
  // Atualiza label no modal de settings se aberto
  const label = $('settings-theme-label');
  if (label) label.textContent = theme === 'dark' ? 'Escuro' : 'Claro';
};

const toggleTheme = () => {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* quota */ }
  applyTheme(next);
};

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getStoredTheme());
});

</script>
    <script>
// ════ App shell — alternância de modos e atalhos globais ════

let currentMode = 'graph';

const MODE_LABEL = { notes: 'Notas', macros: 'Macros', skills: 'Skills', diagrams: 'Diagramas', tasks: 'Kanban', mocks: 'Mocks', favorites: 'Favoritos', podcasts: 'Podcasts', canvas: 'Canvas', graph: 'Grafo' };

// ── Sidebar panel collapse (notes-col, macros-col, etc.) ──
// depends on: dom.js ($)
const PANEL_BY_MODE = {
  notes:     'notes-col',
  macros:    'macros-col',
  skills:    'skills-col',
  diagrams:  'diag-col',
  mocks:     'mocks-col',
  favorites: 'fav-sidebar',
  podcasts:  'pod-col',
};

const toggleSidebar = () => {
  const panelId = PANEL_BY_MODE[currentMode];
  if (!panelId) return;
  const panel = $(panelId);
  if (!panel) return;
  panel.classList.toggle('col-collapsed');
};

const setMode = (mode) => {
  currentMode = mode;

  document.querySelectorAll('.mode').forEach((m) => m.classList.remove('active'));
  $('mode-' + mode)?.classList.add('active');

  document.querySelectorAll('.rail-btn').forEach((b) => b.classList.remove('active'));
  $('rail-' + mode)?.classList.add('active');

  if (mode === 'macros')         loadMacrosList();
  else if (mode === 'notes')     loadNotesList();
  else if (mode === 'skills')    loadSkillsList();
  else if (mode === 'diagrams')  loadDiagramsList();
  else if (mode === 'tasks')     { loadProjects(); loadTasks(); }
  else if (mode === 'mocks')     loadMocksData();
  else if (mode === 'favorites') loadFavoritesData();
  else if (mode === 'podcasts')  loadPodcastsList();
  else if (mode === 'canvas')    loadCanvas();
  else if (mode === 'graph')     loadGraph();
};

// ── Settings modal ──
// depends on: theme.js (getStoredTheme, toggleTheme), system.js (copySkill, downloadBackup, triggerRestore)
const openSettings = () => {
  const label = $('settings-theme-label');
  if (label && typeof getStoredTheme === 'function') {
    label.textContent = getStoredTheme() === 'dark' ? 'Escuro' : 'Claro';
  }
  loadNetworkIp();
  $('settings-overlay')?.classList.add('open');
};

const closeSettings = (e) => {
  if (e && e.target !== $('settings-overlay')) return;
  $('settings-overlay')?.classList.remove('open');
};

// ── Global keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $('annot-popover')?.classList.remove('visible');
    // Só fecha settings se o confirm dialog não estiver visível
    if (!$('modal-overlay')?.classList.contains('visible')) {
      $('settings-overlay')?.classList.remove('open');
    }
  }
  if (e.ctrlKey && e.key === 'Enter' && $('annot-popover')?.classList.contains('visible')) {
    saveAnnotation();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); setMode('notes'); }
  if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); setMode('macros'); }
});

// ── Canvas mode ──
// O canvas carrega via iframe apontando para /canvas.
// loadCanvas apenas garante que o iframe está apontando pra URL correta.
const loadCanvas = () => {
  const iframe = document.getElementById('canvas-iframe');
  if (iframe && iframe.getAttribute('src') !== '/canvas') {
    iframe.setAttribute('src', '/canvas');
  }
};

</script>
    <script>
// ════ Deep links — abre diagram/podcast/task direto pela URL ════

const handleDeepLink = () => {
  const hash = window.location.hash;
  const diag = hash.match(/^#diagram\\/([a-f0-9-]{36})$/);
  if (diag) {
    setMode('diagrams');
    openDiagram(diag[1]);
    history.replaceState(null, '', '/');
    return;
  }
  const pod = hash.match(/^#podcast\\/([a-f0-9-]{36})$/);
  if (pod) {
    setMode('podcasts');
    openPodcast(pod[1]);
    history.replaceState(null, '', '/');
    return;
  }
  const task = hash.match(/^#task\\/([a-f0-9-]{36})$/);
  if (task) {
    setMode('tasks');
    history.replaceState(null, '', '/');
    return;
  }
  // Sem deep link → abre no grafo por padrão.
  setMode('graph');
};

document.addEventListener('DOMContentLoaded', handleDeepLink);

</script>
    <script>
// ════ Anotações do markmap (contextuais ao documento/nota) ════
// Persistidas via /comments no backend. Separado da base de Notas.

let annotations = [];
let popQuote = null;
let popType  = 'note';
let currentAnnotationContext = null; // 'note:<id>' ou caminho de arquivo
let currentAnnotationLabel   = '';   // título legível para o cabeçalho ao copiar

const setAnnotationContext = (ctx, label) => {
  currentAnnotationContext = ctx;
  currentAnnotationLabel   = label || '';
};

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
    list.innerHTML = '<div id="annot-empty">Selecione um trecho do mapa e clique em <strong>Comentar</strong> para anotar.</div>';
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
  if (typeof hideCommentButton === 'function') hideCommentButton();
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
  if (!popQuote || !currentAnnotationContext) return;
  const note = $('pop-textarea').value.trim();
  if (!note) return deleteAnnotation();

  await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: currentAnnotationContext, quote: popQuote, note, type: popType }),
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
  if (!popQuote || !currentAnnotationContext) return;
  await postDeleteAnnotation(popQuote);
  closeAnnotPopover();
};

const postDeleteAnnotation = async (quote) => {
  await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: currentAnnotationContext, quote, note: '' }),
  });
  annotations = annotations.filter((a) => a.quote !== quote);
  renderAnnotations();
  updateAnnotBadge();
};

const editAnnotation = (quote) => {
  const anchor = $('note-markmap') || document.body;
  const rect = anchor.getBoundingClientRect();
  openAnnotPopover(quote, rect.left + rect.width / 2 - 165, rect.top + 70);
};

const removeAnnotation = (quote) => postDeleteAnnotation(quote);

// ── Copiar para IA ──
const copyAnnotationsForAI = () => {
  if (!annotations.length) return toast('Nenhuma anotação para copiar');
  const label = currentAnnotationLabel || currentAnnotationContext || 'nota';
  const lines = [\`# Anotações — \${label}\`, ''];
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

// ── Seleção para comentário no markmap da nota ──
let noteSelectionBound        = false;
let noteSelectionBtnTimer     = null;
let noteMarkmapTimer          = null;
let currentNoteSelectionQuote = null;
let lastAnnotationCtx         = null;     // evita recarregar ao salvar a mesma nota

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
  $('btn-annot').style.display = 'none';
  $('btn-copy-note').style.display = 'none';
  $('btn-delete-note').style.display = 'none';
  showEditor();
  setPreviewMode(false);
  setNoteMarkmapVisible(false);
  setAnnotationContext(null, '');
  lastAnnotationCtx = null;
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
    $('btn-annot').style.display = 'inline-flex';
    renderNoteMarkmap();
  } else {
    ta.style.display = '';
    mm.classList.remove('visible');
    btn?.classList.remove('active');
    $('btn-annot').style.display = 'none';
    $('annot-panel').classList.remove('visible');
    hideCommentButton();
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
  clearTimeout(noteMarkmapTimer);
  noteMarkmapTimer = setTimeout(() => {
    window._noteMarkmap?.fit?.();
    const ctx = 'note:' + currentNote.id;
    setAnnotationContext(ctx, currentNote.title);
    if (ctx !== lastAnnotationCtx) {
      lastAnnotationCtx = ctx;
      loadAnnotations(ctx);
    }
    bindNoteSelectionButton();
  }, 100);
};

const toggleNoteMarkmap = () => setNoteMarkmapVisible(!noteMarkmapVisible);

// ── Detecção de seleção de texto no markmap da nota ──
let _commentBtn;  // cached once; element is static HTML present at script load time

const bindNoteSelectionButton = () => {
  if (noteSelectionBound) return;
  noteSelectionBound = true;
  _commentBtn = $('markmap-comment-btn');
  if (!_commentBtn) return;

  document.addEventListener('selectionchange', () => {
    clearTimeout(noteSelectionBtnTimer);
    noteSelectionBtnTimer = setTimeout(updateNoteCommentButton, 80);
  });

  document.addEventListener('mousedown', (e) => {
    if (!_commentBtn.classList.contains('visible')) return;
    if (e.target === _commentBtn || _commentBtn.contains(e.target)) return;
    hideCommentButton();
  });

  _commentBtn.addEventListener('click', onNoteCommentButtonClick);
};

const updateNoteCommentButton = () => {
  if (!noteMarkmapVisible) return;
  const btn = _commentBtn;
  if (!btn) return;
  const sel = window.getSelection();
  const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
  if (!range || range.collapsed) { hideCommentButton(); return; }

  const container = $('note-markmap');
  const text = sel.toString().trim();
  if (!text || !container.contains(range.commonAncestorContainer)) { hideCommentButton(); return; }

  currentNoteSelectionQuote = text;
  const rect = range.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) { hideCommentButton(); return; }

  btn.style.left = \`\${rect.left + rect.width / 2}px\`;
  btn.style.top  = \`\${rect.bottom + 8}px\`;
  btn.classList.add('visible');
};

const hideCommentButton = () => {
  currentNoteSelectionQuote = null;
  _commentBtn?.classList.remove('visible');
};

const onNoteCommentButtonClick = () => {
  const quote = currentNoteSelectionQuote;
  if (!quote) return;
  if (!_commentBtn) return;
  const rect = _commentBtn.getBoundingClientRect();
  hideCommentButton();
  openAnnotPopover(quote, rect.left + rect.width / 2, rect.bottom + 6);
};

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
let macroEditor  = null; // instância CodeMirror (lazy init)

// ── CodeMirror helpers ──
const initMacroEditor = () => {
  if (macroEditor || typeof CodeMirror === 'undefined') return;
  const ta = $('macro-script');
  if (!ta) return;

  macroEditor = CodeMirror.fromTextArea(ta, {
    mode:           'shell',
    theme:          'default',
    lineNumbers:    true,
    tabSize:        2,
    indentWithTabs: false,
    lineWrapping:   true,
    viewportMargin: Infinity,
    extraKeys: {
      Tab: (cm) => cm.replaceSelection('  '),
    },
  });

  // auto-detecta interpretador ao editar e troca o mode
  macroEditor.on('change', () => {
    const first = macroEditor.getLine(0) ?? '';
    const interp = first.includes('deno') ? 'deno' : 'bash';
    $('macro-interp-badge').textContent = interp;
    $('macro-interp-badge').className   = \`macro-badge \${interp}\`;
    setMacroMode(interp);
  });
};

const macroGet = () =>
  macroEditor ? macroEditor.getValue() : ($('macro-script')?.value ?? '');

const macroSet = (value) => {
  if (macroEditor) {
    macroEditor.setValue(value);
  } else {
    const ta = $('macro-script');
    if (ta) ta.value = value;
  }
};

const setMacroMode = (interp) => {
  if (!macroEditor) return;
  const mode = interp === 'deno' ? 'javascript' : 'shell';
  macroEditor.setOption('mode', mode);
};

const macroFocus = () => {
  if (macroEditor) macroEditor.focus();
  else $('macro-script')?.focus();
};

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
      \${(m.tags||[]).length ? \`<div class="macro-item-tags">\${m.tags.map((t) => \`<span class="note-tag">\${escHtml(t)}</span>\`).join('')}</div>\` : ''}
    </div>\`
  ).join('');
};

// ── Seed macro padrão ──
const seedDefaultMacros = async () => {
  const defaults = [
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
  $('macro-tags-input').value  = '';
  macroSet('#!/bin/bash\\n# Seu script aqui\\n# $DOCMAP_API       → http://127.0.0.1:3334\\n# $DOCMAP_WORKSPACE → pasta aberta\\n\\necho "Olá do docmap!"');
  $('macro-interp-badge').textContent = 'bash';
  $('macro-interp-badge').className   = 'macro-badge bash';
  setMacroMode('bash');
  $('btn-macro-delete').style.display = 'none';
  clearOutput();
  showMacroEditor();
  $('macro-title-input').focus();
};

const fillMacroEditor = (m) => {
  $('macro-title-input').value       = m.title;
  $('macro-desc-input').value        = m.description || '';
  $('macro-tags-input').value        = (m.tags || []).join(', ');
  macroSet(m.script);
  $('macro-interp-badge').textContent = m.interpreter;
  $('macro-interp-badge').className   = \`macro-badge \${m.interpreter}\`;
  setMacroMode(m.interpreter);
  $('btn-macro-delete').style.display = 'inline-flex';
  clearOutput();
  showMacroEditor();
};

const showMacroEditor = () => {
  $('macros-editor-empty').style.display = 'none';
  $('macros-editor-form').classList.add('visible');
  initMacroEditor();
};

// auto-detect é feita no evento 'change' do CodeMirror dentro de initMacroEditor

// ── Salvar / Excluir ──
const saveCurrentMacro = async () => {
  const title  = $('macro-title-input').value.trim();
  const desc   = $('macro-desc-input').value.trim();
  const script = macroGet().trim();
  if (!title)  { $('macro-title-input').focus(); return toast('Dê um nome à macro'); }
  if (!script) { macroFocus();                   return toast('Script vazio'); }

  const tags   = $('macro-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  const url    = currentMacro ? '/macros/' + currentMacro.id : '/macros';
  const method = currentMacro ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name: title, description: desc, script, tags }),
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
      \${(d.tags||[]).length ? \`<div class="diag-item-tags">\${d.tags.map((t) => \`<span class="note-tag">\${escHtml(t)}</span>\`).join('')}</div>\` : ''}
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
  $('diag-tags-input').value = '';
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
  $('diag-tags-input').value = (d.tags || []).join(', ');
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
    const tags = $('diag-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, source, tags }),
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
      ? { ...d, ...diagram, preview: (diagram.source ?? '').slice(0, 120) }
      : d);
    renderDiagramsList();
    if (currentDiagram?.id === diagram.id) {
      currentDiagram = diagram;
      // Só sobrescreve o editor se o usuário não estiver digitando nele
      if (document.activeElement !== $('diag-source')) {
        $('diag-title-input').value = diagram.title;
        $('diag-source').value      = diagram.source;
      }
      if (document.activeElement !== $('diag-tags-input')) {
        $('diag-tags-input').value = (diagram.tags || []).join(', ');
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
let allProjects   = [];
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

const loadProjects = async () => {
  try {
    const res = await fetch('/projects');
    allProjects = await res.json();
    populateProjectSelects();
  } catch (err) {
    console.error('Erro ao carregar projetos:', err);
  }
};

const populateProjectSelects = () => {
  const options = allProjects.map((p) =>
    \`<option value="\${p.id}">\${escHtml(p.name ?? '')}</option>\`
  ).join('');

  // Toolbar select — preserva opção "Todos"
  const toolbarSelect = $('kanban-project-select');
  if (toolbarSelect) {
    const currentVal = toolbarSelect.value;
    toolbarSelect.innerHTML = '<option value="">Sem projeto</option>' + options;
    toolbarSelect.value = currentVal;
    updateProjectDeleteBtn();
  }

  // Task modal select — preserva opção "Nenhum"
  const taskSelect = $('task-project-select');
  if (taskSelect) {
    const currentVal = taskSelect.value;
    taskSelect.innerHTML = '<option value="">Nenhum</option>' + options;
    taskSelect.value = currentVal;
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
  updateProjectDeleteBtn();
  const selectedProjectId = $('kanban-project-select')?.value ?? '';
  // "" = "Sem projeto" — filtra tasks sem vínculo
  const filteredTasks = selectedProjectId
    ? allTasks.filter((t) => t.projectId === selectedProjectId)
    : allTasks.filter((t) => !t.projectId);

  for (const col of COLUMNS) {
    const colTasks = filteredTasks
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
  const tags = (task.tags || []).length
    ? \`<div class="kanban-card-tags">\${task.tags.map((t) => \`<span class="note-tag">\${escHtml(t)}</span>\`).join('')}</div>\`
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
    \${tags}
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
  $('task-tags-input').value    = '';
  $('task-project-select').value = '';
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
  $('task-tags-input').value    = (task.tags || []).join(', ');
  $('task-project-select').value = task.projectId ?? '';
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
    projectId:   $('task-project-select').value || null,
    tags:        $('task-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean),
  };

  try {
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
  } catch { toast('Erro ao salvar task'); }
};

const deleteCurrentTask = async () => {
  if (!currentTaskId) return;
  await fetch(\`/tasks/\${currentTaskId}\`, { method: 'DELETE' });
  closeTaskModal();
  await loadTasks();
};

// ══════════════════════════════════════════
// Toolbar — deletar projeto selecionado
// ══════════════════════════════════════════

const updateProjectDeleteBtn = () => {
  const select = $('kanban-project-select');
  const delBtn = $('kanban-project-del-btn');
  if (!select || !delBtn) return;
  delBtn.disabled = !select.value;
};

const deleteSelectedProject = async () => {
  const select = $('kanban-project-select');
  if (!select || !select.value) return;
  const projectId = select.value;
  const project = allProjects.find((p) => p.id === projectId);
  if (!project) return;

  const ok = await confirmDialog(
    \`Excluir o projeto "\${project.name}"?\\nAs tasks vinculadas ficarão sem projeto.\`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;

  try {
    const res = await fetch(\`/projects/\${projectId}\`, { method: 'DELETE' });
    if (!res.ok) return;
    select.value = '';
    updateProjectDeleteBtn();
    await loadProjects();
    renderBoard();
  } catch (err) {
    console.error('Erro ao remover projeto:', err);
  }
};

// ══════════════════════════════════════════
// Modal — criar projeto
// ══════════════════════════════════════════

const openNewProject = () => {
  const input = $('project-name-input');
  if (!input) return;
  input.value = '';
  $('project-modal-overlay')?.classList.add('visible');
  input.focus();
};

const closeProjectModal = () => {
  $('project-modal-overlay')?.classList.remove('visible');
};

const closeProjectModalOnOverlay = (e) => {
  if (e.target === $('project-modal-overlay')) closeProjectModal();
};

const saveProject = async () => {
  const nameInput = $('project-name-input');
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }

  try {
    const res = await fetch('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Erro ao criar projeto:', err);
      return;
    }
    const created = await res.json();
    closeProjectModal();
    await loadProjects();
    if (created?.id) {
      const select = $('kanban-project-select');
      if (select) select.value = created.id;
    }
    renderBoard();
  } catch (err) {
    console.error('Erro ao criar projeto:', err);
  }
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
          \${(m.tags||[]).length ? \`<div class="mock-item-tags">\${m.tags.map((t) => \`<span class="note-tag">\${escHtml(t)}</span>\`).join('')}</div>\` : ''}
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
  $('mock-tags-input').value    = (mock.tags || []).join(', ');

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

  const tags = $('mock-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  const body = { collectionId: colId, method, path, name, group, script, tags };

  try {
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
  } catch { toast('Erro ao salvar mock'); }
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
// ════ Podcasts — ouvir, buscar, organizar em pastas, apagar ════
// A geração acontece só via IA (integrada/externa) batendo na API. Aqui na UI
// não há botão "gerar": só consumo do que já existe.

let allPodcasts = [];
let allFolders = [];
let currentPodcast = null;
let podSearchTimer = null;
let podHealth = null;

// ── Health check das dependências externas ──
const loadPodHealth = async () => {
  const btn = $('pod-health');
  if (!btn) return;
  try {
    const res = await fetch('/podcasts/health');
    podHealth = await res.json();
  } catch {
    podHealth = null;
  }
  renderPodHealth();
};

const renderPodHealth = () => {
  const btn = $('pod-health');
  if (!btn || !podHealth) return;
  btn.classList.remove('pod-health-checking');
  if (podHealth.ready) {
    btn.classList.add('pod-health-ok');
    btn.classList.remove('pod-health-bad');
    btn.innerHTML = \`\${ICON('mic')}<span>deps OK</span>\`;
    btn.title = 'edge-tts, ffmpeg e ffprobe disponíveis';
  } else {
    btn.classList.add('pod-health-bad');
    btn.classList.remove('pod-health-ok');
    btn.innerHTML = \`\${ICON('audio-lines')}<span>faltam deps</span>\`;
    const missing = [
      !podHealth.edgeTts && 'edge-tts',
      !podHealth.ffmpeg && 'ffmpeg',
    ].filter(Boolean).join(', ');
    btn.title = \`Faltando: \${missing}. Clique para ver como instalar.\`;
  }
};

const togglePodHealth = () => {
  const panel = $('pod-health-panel');
  if (!panel || !podHealth) return;
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    return;
  }
  panel.classList.add('open');
  if (podHealth.ready) {
    panel.innerHTML = \`<div class="pod-health-row ok">
      <span>\${ICON('mic')} Todas as dependências de áudio estão instaladas:</span>
      <code>edge-tts ✓ · ffmpeg ✓ · ffprobe ✓</code>
    </div>\`;
    return;
  }
  panel.innerHTML = '<div class="pod-health-row bad"><span>Dependências faltando para gerar podcasts:</span></div>' +
    podHealth.instructions.map((i) =>
      \`<div class="pod-health-cmd"><span class="pod-health-dep">\${escHtml(i.dep)}</span><code onclick="copyToClipboard(this.textContent,'Comando copiado')">\${escHtml(i.cmd)}</code></div>\`
    ).join('') +
    '<div class="pod-health-note">Após instalar, reinicie o docmap. Se o binário não estiver no PATH, defina <code>DOCMAP_EDGE_TTS</code> no arquivo <code>.env</code> da pasta de dados do app.</div>';
};

// ── Lista ──
const loadPodcastsList = async () => {
  loadPodHealth();
  try {
    const [listRes, foldersRes] = await Promise.all([
      fetch('/podcasts'), fetch('/podcasts/folders'),
    ]);
    allPodcasts = await listRes.json();
    allFolders = await foldersRes.json();
    renderPodcastsList();
    renderFolderFilter();
  } catch (err) { console.error('Erro ao carregar podcasts:', err); }
};

const activeFolderFilter = () => $('pod-folder-filter')?.value || '';
const activeSearch = () => $('pod-search')?.value?.trim().toLowerCase() || '';

const renderFolderFilter = () => {
  const sel = $('pod-folder-filter');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todas as pastas</option>' +
    allFolders.map((f) => \`<option value="\${escHtml(f)}"\${f === cur ? ' selected' : ''}>\${escHtml(f)}</option>\`).join('');
  const dl = $('pod-folder-list');
  if (dl) dl.innerHTML = allFolders.map((f) => \`<option value="\${escHtml(f)}">\`).join('');
};

const renderPodcastsList = () => {
  const list = $('pod-list');
  const q = activeSearch();
  const folder = activeFolderFilter();

  let items = allPodcasts;
  if (folder) items = items.filter((p) => p.folder === folder);
  if (q) items = items.filter((p) => p.title.toLowerCase().includes(q));

  if (!items.length) {
    list.innerHTML = allPodcasts.length
      ? \`<div class="pod-empty">Nenhum podcast para este filtro.</div>\`
      : \`<div class="pod-empty">Nenhum podcast ainda.<br>Peça à IA integrada ou externa para gerar um via <code>POST /podcasts</code>.</div>\`;
    return;
  }

  list.innerHTML = items.map((p) => {
    const status = p.status === 'generating'
      ? '<span class="pod-status gen">gerando…</span>'
      : p.status === 'error'
      ? '<span class="pod-status err">erro</span>'
      : '';
    const dur = p.durationMs ? formatDuration(p.durationMs) : '';
    const tags = (p.tags || []).length
      ? \`<div class="pod-item-tags">\${p.tags.map((t) => \`<span class="note-tag">\${escHtml(t)}</span>\`).join('')}</div>\`
      : '';
    return \`<div class="pod-item\${currentPodcast?.id === p.id ? ' active' : ''}" onclick="openPodcast('\${p.id}')">
      <div class="pod-item-top">
        <span class="pod-item-title">\${ICON('mic')} \${escHtml(p.title)}</span>
        \${status}
      </div>
      <div class="pod-item-meta">
        <span class="pod-folder">\${escHtml(p.folder)}</span>
        <span class="pod-dot">·</span>
        <span>\${p.voices?.length || 0} vozes</span>
        \${dur ? \`<span class="pod-dot">·</span><span>\${dur}</span>\` : ''}
      </div>
      \${tags}
    </div>\`;
  }).join('');
};

// ── Abrir ──
const openPodcast = async (id) => {
  if (currentMode !== 'podcasts') setMode('podcasts');
  try {
    const res = await fetch('/podcasts/' + id);
    currentPodcast = await res.json();
    fillPodcastPlayer(currentPodcast);
    renderPodcastsList();
  } catch (err) { console.error('Erro ao abrir podcast:', err); }
};

const fillPodcastPlayer = (p) => {
  $('pod-empty').style.display = 'none';
  $('pod-detail').style.display = 'flex';

  const titleInput = $('pod-title-input');
  const folderInput = $('pod-folder-input');
  const tagsInput  = $('pod-tags-input');
  if (document.activeElement !== titleInput) titleInput.value = p.title;
  if (document.activeElement !== tagsInput) tagsInput.value = (p.tags || []).join(', ');
  if (document.activeElement !== folderInput) folderInput.value = p.folder;

  $('pod-id-badge').textContent = p.id.slice(0, 8);
  $('btn-pod-delete').style.display = 'inline-flex';
  $('btn-pod-copy').style.display = 'inline-flex';

  renderPodStatus(p);
  renderPodScript(p);
  // Dispara setup (ou teardown) de slides conforme o caso.
  void setupSlides(p);
};

const renderPodStatus = (p) => {
  const audio = $('pod-audio');
  const wrap = $('pod-audio-wrap');
  const meta = $('pod-meta');

  if (p.status === 'generating') {
    wrap.style.display = 'none';
    meta.innerHTML = \`<span class="pod-status gen">\${ICON('refresh-cw')} gerando áudio…</span>\`;
  } else if (p.status === 'error') {
    wrap.style.display = 'none';
    meta.innerHTML = \`<span class="pod-status err">erro: \${escHtml(p.error || 'desconhecido')}</span>\`;
  } else {
    wrap.style.display = 'block';
    audio.src = '/podcasts/' + p.id + '/audio';
    audio.load();
    const voices = (p.voices || []).map((v) => escHtml(v.name)).join(' · ');
    meta.innerHTML = [
      p.durationMs ? \`<span>\${ICON('clock')} \${formatDuration(p.durationMs)}</span>\` : '',
      voices ? \`<span>\${ICON('audio-lines')} \${voices}</span>\` : '',
      \`<span>\${ICON('folder')} \${escHtml(p.folder)}</span>\`,
      \`<span>\${new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>\`,
    ].join('');
  }
};

const renderPodScript = (p) => {
  const box = $('pod-script');
  if (!p.script || p.status !== 'ready') {
    box.innerHTML = p.status === 'generating'
      ? '<div class="pod-script-pending">Roteiro será exibido quando o áudio estiver pronto.</div>'
      : '';
    return;
  }
  // Quebra o script em falas por persona, com cor por índice.
  const voiceNames = (p.voices || []).map((v) => v.name);
  const colorOf = (name) => {
    const idx = voiceNames.indexOf(name);
    return idx < 0 ? 'var(--text-2)' : \`hsl(\${(idx * 137) % 360} 55% 62%)\`;
  };
  const re = /<([A-Za-z][A-Za-z0-9_-]*)>([\\s\\S]*?)<\\/\\1>/g;
  let html = '';
  let m;
  while ((m = re.exec(p.script)) !== null) {
    const name = m[1];
    const text = m[2].trim();
    if (!text) continue;
    html += \`<div class="pod-line">
      <span class="pod-line-name" style="color:\${colorOf(name)}">\${escHtml(name)}</span>
      <span class="pod-line-text">\${escHtml(text)}</span>
    </div>\`;
  }
  box.innerHTML = html || \`<div class="pod-script-pending">Roteiro sem falas parseáveis.</div>\`;
};

// ── Editar metadados (title/folder/tags) ──
const savePodcastMeta = async () => {
  if (!currentPodcast) return;
  const title = $('pod-title-input').value.trim();
  const folder = $('pod-folder-input').value.trim() || 'geral';
  const tags  = $('pod-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  if (!title) { $('pod-title-input').focus(); return toast('Título obrigatório'); }
  try {
    const res = await fetch('/podcasts/' + currentPodcast.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, folder, tags }),
    });
    if (res.ok) {
      currentPodcast = { ...currentPodcast, title, folder, tags };
      renderPodcastsList();
      toast('Podcast atualizado');
    } else {
      // Restaura valores anteriores no DOM
      $('pod-title-input').value = currentPodcast.title;
      $('pod-folder-input').value = currentPodcast.folder;
      $('pod-tags-input').value = (currentPodcast.tags || []).join(', ');
      toast('Erro ao atualizar');
    }
  } catch { toast('Erro ao atualizar'); }
};

const deleteCurrentPodcast = async () => {
  if (!currentPodcast) return;
  const ok = await confirmDialog(\`Excluir o podcast "\${currentPodcast.title}"?\`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/podcasts/' + currentPodcast.id, { method: 'DELETE' });
  currentPodcast = null;
  $('pod-detail').style.display = 'none';
  $('pod-empty').style.display = 'flex';
  loadPodcastsList();
  toast('Podcast excluído');
};

const copyPodcastLink = () => {
  if (!currentPodcast) return;
  copyToClipboard(
    \`http://127.0.0.1:3333/#podcast/\${currentPodcast.id}\`,
    'Link copiado',
  );
};

const formatDuration = (ms) => {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return \`\${m}:\${String(r).padStart(2, '0')}\`;
};

// ── Filtros ──
$('pod-search')?.addEventListener('input', () => {
  clearTimeout(podSearchTimer);
  podSearchTimer = setTimeout(renderPodcastsList, 150);
});
$('pod-folder-filter')?.addEventListener('change', renderPodcastsList);

// Salvar título/pasta ao perder foco
$('pod-title-input')?.addEventListener('blur', savePodcastMeta);
$('pod-folder-input')?.addEventListener('blur', savePodcastMeta);
$('pod-tags-input')?.addEventListener('blur', savePodcastMeta);

// ── SSE: atualiza status de geração em tempo real ──
const connectPodcastEvents = () => {
  const es = new EventSource('/podcasts/events');

  es.addEventListener('created', (e) => {
    const { podcast } = JSON.parse(e.data);
    if (!allPodcasts.find((p) => p.id === podcast.id)) {
      allPodcasts = [podcast, ...allPodcasts];
      renderPodcastsList();
    }
  });

  es.addEventListener('progress', (e) => {
    const { id, stage, detail } = JSON.parse(e.data);
    const item = allPodcasts.find((p) => p.id === id);
    if (!item) return;
    item.status = 'generating';
    renderPodcastsList();
    if (currentPodcast?.id === id) {
      const label = stage === 'script' ? 'escrevendo roteiro…'
        : stage === 'slides' ? \`compondo slides \${detail || ''}\`
        : stage === 'tts' ? \`sintetizando vozes \${detail || ''}\`
        : stage === 'concat' ? 'montando áudio…' : 'processando…';
      $('pod-meta').innerHTML = \`<span class="pod-status gen">\${ICON('refresh-cw')} \${label}</span>\`;
    }
  });

  es.addEventListener('ready', (e) => {
    const { podcast } = JSON.parse(e.data);
    allPodcasts = allPodcasts.map((p) => p.id === podcast.id
      ? { ...p, status: 'ready', durationMs: podcast.durationMs }
      : p);
    renderPodcastsList();
    if (currentPodcast?.id === podcast.id) {
      currentPodcast = { ...currentPodcast, status: 'ready', durationMs: podcast.durationMs };
      renderPodStatus(currentPodcast);
      // Recarrega o roteiro agora que está disponível.
      openPodcast(podcast.id);
    }
  });

  es.addEventListener('error', (e) => {
    try {
      const { id, error } = JSON.parse(e.data);
      allPodcasts = allPodcasts.map((p) => p.id === id ? { ...p, status: 'error' } : p);
      renderPodcastsList();
      if (currentPodcast?.id === id) {
        currentPodcast = { ...currentPodcast, status: 'error', error };
        renderPodStatus(currentPodcast);
      }
    } catch { /* reconexão automática do EventSource */ }
  });

  es.addEventListener('deleted', (e) => {
    const { id } = JSON.parse(e.data);
    allPodcasts = allPodcasts.filter((p) => p.id !== id);
    if (currentPodcast?.id === id) {
      currentPodcast = null;
      $('pod-detail').style.display = 'none';
      $('pod-empty').style.display = 'flex';
    }
    renderPodcastsList();
  });

  es.addEventListener('updated', (e) => {
    const { podcast } = JSON.parse(e.data);
    allPodcasts = allPodcasts.map((p) => p.id === podcast.id
      ? { ...p, ...podcast }
      : p);
    renderPodcastsList();
    if (currentPodcast?.id === podcast.id) {
      currentPodcast = { ...currentPodcast, ...podcast };
      fillPodcastPlayer(currentPodcast);
    }
  });
};

// ── Slides (sync via requestAnimationFrame) ──
// Shadow DOM isola o CSS dos slides da UI do docmap. O rAF lê
// audio.currentTime e troca o slide ativo aplicando [data-state] nos
// <section>. Funciona com pause, seek, playbackRate — tudo reage ao
// "tempo de mídia" (currentTime), não ao tempo de parede.

let slidesShadow = null;
let slidesRaf = null;
let slidesMap = [];
let slidesActiveIdx = -1;
let slidesLeaveTimer = null;

const SLIDE_LEAVE_MS = 700;

const teardownSlides = () => {
  if (slidesRaf) cancelAnimationFrame(slidesRaf);
  slidesRaf = null;
  if (slidesLeaveTimer) clearTimeout(slidesLeaveTimer);
  slidesLeaveTimer = null;
  if (slidesShadow) slidesShadow.innerHTML = '';
  slidesMap = [];
  slidesActiveIdx = -1;
  $('pod-slides-stage').style.display = 'none';
  $('pod-script').style.display = '';
};

const setSlideState = (index, state) => {
  if (!slidesShadow || index < 0 || index >= slidesMap.length) return;
  const el = slidesShadow.querySelector(
    \`section[data-slide="\${slidesMap[index].index}"]\`,
  );
  if (el) el.setAttribute('data-state', state);
};

const applySlideTransition = (newIdx) => {
  if (newIdx === slidesActiveIdx) return;
  const prevIdx = slidesActiveIdx;
  slidesActiveIdx = newIdx;

  // Slide anterior: marca leaving e esconde após a animação de saída.
  if (prevIdx >= 0) {
    setSlideState(prevIdx, 'leaving');
    const prevEl = slidesMap[prevIdx];
    if (slidesLeaveTimer) clearTimeout(slidesLeaveTimer);
    slidesLeaveTimer = setTimeout(() => {
      // Só esconde se ainda estiver leaving (não foi reativado).
      const el = slidesShadow?.querySelector(
        \`section[data-slide="\${prevEl.index}"]\`,
      );
      if (el && el.getAttribute('data-state') === 'leaving') {
        el.setAttribute('data-state', 'hidden');
      }
    }, SLIDE_LEAVE_MS);
  }

  // Novo slide: entering → active no próximo frame.
  if (newIdx >= 0) {
    setSlideState(newIdx, 'entering');
    requestAnimationFrame(() => setSlideState(newIdx, 'active'));
    updateSlidesBar(newIdx);
  }
};

const updateSlidesBar = (idx) => {
  if (idx < 0 || idx >= slidesMap.length) return;
  const s = slidesMap[idx];
  $('pod-slide-counter').textContent = \`\${idx + 1} / \${slidesMap.length}\`;
  $('pod-slide-title').textContent = s.title || '';
};

const findSlideAt = (tMs) => {
  // Busca linear — slideMap é pequeno (dezenas). Pode trocar por binária.
  let idx = -1;
  for (let i = 0; i < slidesMap.length; i++) {
    if (slidesMap[i].enterMs <= tMs) idx = i;
    else break;
  }
  return idx;
};

const startSlidesSync = () => {
  if (slidesRaf) cancelAnimationFrame(slidesRaf);
  const audio = $('pod-audio');
  if (!audio) return;

  const tick = () => {
    slidesRaf = requestAnimationFrame(tick);
    if (!slidesShadow || !audio.duration) return;
    const tMs = audio.currentTime * 1000;
    const idx = findSlideAt(tMs);
    if (idx !== slidesActiveIdx) applySlideTransition(idx);
  };
  slidesRaf = requestAnimationFrame(tick);
};

const setupSlides = async (p) => {
  // Sem slides → comportamento legado (só roteiro).
  if (!p.withSlides || !p.slideMap || p.slideMap.length === 0 || p.status !== 'ready') {
    teardownSlides();
    return;
  }
  try {
    const res = await fetch(\`/podcasts/\${p.id}/slides\`);
    if (!res.ok) { teardownSlides(); return; }
    const doc = await res.text();

    if (!slidesShadow) {
      slidesShadow = $('pod-slides-host').attachShadow({ mode: 'open' });
    }
    slidesShadow.innerHTML = doc;

    // Ordena por enterMs e zera estados.
    slidesMap = [...p.slideMap].sort((a, b) => a.enterMs - b.enterMs);
    slidesActiveIdx = -1;
    const sections = slidesShadow.querySelectorAll('section[data-slide]');
    sections.forEach((s) => s.setAttribute('data-state', 'hidden'));

    $('pod-slides-stage').style.display = 'flex';
    $('pod-script').style.display = 'none';

    // Estado inicial: mostra o primeiro slide antes do áudio tocar.
    applySlideTransition(0);
    startSlidesSync();
  } catch (err) {
    console.error('Erro ao carregar slides:', err);
    teardownSlides();
  }
};

// ── Controles da barra de slides ──
const seekToSlide = (idx) => {
  if (idx < 0 || idx >= slidesMap.length) return;
  const audio = $('pod-audio');
  if (!audio) return;
  audio.currentTime = slidesMap[idx].enterMs / 1000;
};

const slidesNext = () => {
  if (slidesActiveIdx < 0) return;
  const next = Math.min(slidesActiveIdx + 1, slidesMap.length - 1);
  seekToSlide(next);
};

const slidesPrev = () => {
  if (slidesActiveIdx < 0) return;
  const prev = Math.max(slidesActiveIdx - 1, 0);
  seekToSlide(prev);
};

const slidesFullscreen = async () => {
  const host = $('pod-slides-host');
  if (!host) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
  } else {
    await host.requestFullscreen?.().catch(() => {});
  }
};

$('btn-slide-prev')?.addEventListener('click', slidesPrev);
$('btn-slide-next')?.addEventListener('click', slidesNext);
$('btn-slide-full')?.addEventListener('click', slidesFullscreen);

// Atalhos de teclado quando o stage está visível.
document.addEventListener('keydown', (e) => {
  if ($('pod-slides-stage').style.display !== 'flex') return;
  if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') { slidesNext(); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { slidesPrev(); e.preventDefault(); }
  if (e.key === 'f' || e.key === 'F') { slidesFullscreen(); }
});

connectPodcastEvents();

</script>
    <script>
// ════ Grafo de conhecimento (D3 force) ════
// Nós = entidades. Arestas: 'shared' (compartilham tag) e 'reference' (task→nota).
// Clique destaca vizinhos; duplo-clique abre a entidade; a legenda filtra por tipo.

let kgSim = null;
let kgZoom = null;
let kgG = null;
let kgLinkSel = null;
let kgNodeSel = null;
let kgLinks = [];
let kgRaw = null; // {nodes, links} cru do fetch (fonte pro filtro por tipo)
const kgHidden = new Set(); // tipos de nó ocultados pelo usuário

const KG_KINDS = ['note', 'task', 'diagram', 'macro', 'podcast', 'favorite', 'skill', 'mock', 'tag'];
const KG_LABELS = {
  note: 'Notas', task: 'Tasks', diagram: 'Diagramas', macro: 'Macros',
  podcast: 'Podcasts', favorite: 'Favoritos', skill: 'Skills', mock: 'Mocks', tag: 'Tags',
};
const KG_COLOR = {};

const kgCss = (name) => {
  const host = $('mode-graph');
  return (host && getComputedStyle(host).getPropertyValue(name).trim()) || '#888';
};

// Duplo-clique numa entidade → abre no modo dela.
const OPEN_BY_KIND = {
  note: (id) => openNote(id),
  diagram: (id) => openDiagram(id),
  macro: (id) => openMacro(id),
  podcast: (id) => openPodcast(id),
  skill: (id) => openSkill(id),
  task: (id) => { setMode('tasks'); openTaskModal(id); },
  mock: (id) => { setMode('mocks'); if (typeof openMockEditor === 'function') openMockEditor(id); },
  // Favorito é um link salvo → abre a URL no browser (registra acesso).
  favorite: async (id) => {
    try {
      const fav = await (await fetch('/favorites/' + id)).json();
      if (fav && fav.url) { openFavLink(fav.id, fav.url); return; }
    } catch { /* cai no fallback */ }
    setMode('favorites');
  },
};

const openGraphNode = (nodeId) => {
  const i = nodeId.indexOf(':');
  const kind = nodeId.slice(0, i);
  const uuid = nodeId.slice(i + 1);
  OPEN_BY_KIND[kind]?.(uuid);
};

const loadGraph = async () => {
  try {
    const res = await fetch('/graph');
    kgRaw = await res.json();
    drawKgGraph();
  } catch (err) {
    console.error('Erro ao carregar grafo:', err);
    toast('Erro ao carregar grafo');
  }
};

// Aplica o filtro por tipo e (re)desenha. Não refaz o fetch.
const drawKgGraph = () => {
  if (!kgRaw) return;
  const nodes = kgRaw.nodes.filter((n) => !kgHidden.has(n.kind));
  const keep = new Set(nodes.map((n) => n.id));
  const links = kgRaw.links.filter((l) =>
    keep.has(l.source.id || l.source) && keep.has(l.target.id || l.target));
  renderKnowledgeGraph({ nodes, links });
};

const toggleKgKind = (kind) => {
  if (kgHidden.has(kind)) kgHidden.delete(kind);
  else kgHidden.add(kind);
  drawKgGraph();
};

// Legenda = filtro. Cada item liga/desliga o tipo (classe .off quando oculto).
const buildKgLegend = () => {
  const el = $('kg-legend');
  if (!el) return;
  el.innerHTML = KG_KINDS.map((k) =>
    \`<span class="kg-leg kg-leg-\${k}\${kgHidden.has(k) ? ' off' : ''}" onclick="toggleKgKind('\${k}')" title="mostrar/ocultar \${KG_LABELS[k]}"><i></i>\${KG_LABELS[k]}</span>\`
  ).join('');
};

const renderKnowledgeGraph = (data) => {
  KG_KINDS.forEach((k) => { KG_COLOR[k] = kgCss('--kg-' + k); });
  buildKgLegend();

  const countEl = $('kg-count');
  if (countEl) {
    countEl.textContent = \`\${data.nodes.length} entidades · \${data.links.length} conexões\`;
  }

  const svg = d3.select('#kg-svg');
  svg.selectAll('*').remove();

  const host = $('kg-canvas');
  const W = host.offsetWidth || 800;
  const H = host.offsetHeight || 600;

  const empty = $('kg-empty');
  if (!data.nodes.length) {
    if (empty) empty.dataset.show = '1';
    return;
  }
  if (empty) empty.dataset.show = '0';

  kgG = svg.append('g');
  kgZoom = d3.zoom().scaleExtent([0.1, 5]).on('zoom', (e) => kgG.attr('transform', e.transform));
  svg.call(kgZoom);
  svg.on('dblclick.zoom', null);
  svg.on('click', clearKgSelection);

  kgLinks = data.links.map((l) => ({ ...l }));

  kgSim = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(kgLinks).id((d) => d.id)
      .distance((l) => (l.kind === 'reference' ? 66 : 92)).strength(0.5))
    .force('charge', d3.forceManyBody()
      .strength((d) => (d.kind === 'tag' ? -600 : -280)).distanceMax(620))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('x', d3.forceX(W / 2).strength(0.04))
    .force('y', d3.forceY(H / 2).strength(0.04))
    .force('collision', d3.forceCollide((d) => (d.kind === 'tag' ? 30 : 24)));

  kgLinkSel = kgG.append('g').selectAll('line')
    .data(kgLinks).join('line')
    .attr('class', (l) => 'kg-link kg-link-' + l.kind);

  kgNodeSel = kgG.append('g').selectAll('g')
    .data(data.nodes).join('g')
    .attr('class', (d) => 'kg-node kg-node-' + d.kind)
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) kgSim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) kgSim.alphaTarget(0); d.fx = null; d.fy = null; }))
    .on('click', (e, d) => { e.stopPropagation(); selectKgNode(d.id); })
    .on('dblclick', (e, d) => { e.stopPropagation(); if (d.kind !== 'tag') openGraphNode(d.id); })
    .on('mouseover', (e, d) => showKgTip(e, d))
    .on('mousemove', (e) => moveKgTip(e))
    .on('mouseout', hideKgTip);

  kgNodeSel.append('circle').attr('class', 'kg-halo')
    .attr('r', (d) => (d.kind === 'tag' ? 9 : 12) + 6)
    .attr('fill', (d) => (KG_COLOR[d.kind] || '#888') + '22');
  kgNodeSel.append('circle').attr('class', 'kg-core')
    .attr('r', (d) => (d.kind === 'tag' ? 9 : 12))
    .attr('fill', (d) => KG_COLOR[d.kind] || '#888')
    .style('transform-origin', 'center')
    .style('transform-box', 'fill-box');
  kgNodeSel.append('text').attr('class', 'kg-label')
    .attr('dy', (d) => (d.kind === 'tag' ? 9 : 12) + 15)
    .attr('text-anchor', 'middle')
    .text((d) => (d.label.length > 26 ? d.label.slice(0, 25) + '…' : d.label));

  let kgTicks = 0;
  let kgFitted = false;
  kgSim.on('tick', () => {
    kgLinkSel
      .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
    kgNodeSel.attr('transform', (d) => \`translate(\${d.x},\${d.y})\`);
    if (!kgFitted && ++kgTicks >= 50) { kgFitted = true; fitKg(); }
  });
};

// ── Seleção + destaque de vizinhos (grafo-local) ──
const selectKgNode = (id) => {
  const neighbors = new Set([id]);
  kgLinks.forEach((l) => {
    const s = l.source.id || l.source;
    const t = l.target.id || l.target;
    if (s === id) neighbors.add(t);
    if (t === id) neighbors.add(s);
  });
  kgNodeSel?.classed('kg-selected', (d) => d.id === id)
    .classed('kg-dim', (d) => !neighbors.has(d.id));
  kgLinkSel?.classed('kg-hi', (l) => (l.source.id || l.source) === id || (l.target.id || l.target) === id)
    .classed('kg-dim', (l) => (l.source.id || l.source) !== id && (l.target.id || l.target) !== id);
};

const clearKgSelection = () => {
  kgNodeSel?.classed('kg-selected', false).classed('kg-dim', false);
  kgLinkSel?.classed('kg-hi', false).classed('kg-dim', false);
};

// Busca da topbar no modo grafo → destaca nós cujo label casa com o termo.
const filterGraph = (q) => {
  const term = (q || '').trim().toLowerCase();
  if (!kgNodeSel) return;
  if (!term) { clearKgSelection(); return; }
  const match = new Set();
  kgNodeSel.each((d) => { if (d.label.toLowerCase().includes(term)) match.add(d.id); });
  kgNodeSel.classed('kg-selected', (d) => match.has(d.id))
    .classed('kg-dim', (d) => !match.has(d.id));
  kgLinkSel.classed('kg-hi', false)
    .classed('kg-dim', (l) =>
      !(match.has(l.source.id || l.source) && match.has(l.target.id || l.target)));
};

const fitKg = () => {
  if (!kgG || !kgZoom) return;
  const host = $('kg-canvas');
  const b = kgG.node().getBBox();
  if (!b.width || !b.height) return;
  const W = host.offsetWidth, H = host.offsetHeight;
  const scale = Math.min(W / b.width, H / b.height) * 0.82;
  const tx = (W - b.width * scale) / 2 - b.x * scale;
  const ty = (H - b.height * scale) / 2 - b.y * scale;
  d3.select('#kg-svg').transition().duration(450)
    .call(kgZoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
};

// ── Tooltip ──
const showKgTip = (e, d) => {
  const deg = kgLinks.filter((l) =>
    (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id).length;
  const kindLbl = d.kind === 'tag' ? 'tag' : (KG_LABELS[d.kind]?.replace(/s$/, '') || d.kind);
  const hint = d.kind === 'tag' ? ' · clique isola o grupo' : ' · duplo-clique abre';
  const el = $('tooltip');
  el.innerHTML = \`\${escHtml(d.label)} · <span style="opacity:.6">\${kindLbl} · \${deg} conexões\${hint}</span>\`;
  el.style.opacity = '1';
  moveKgTip(e);
};
const moveKgTip = (e) => {
  const el = $('tooltip');
  el.style.left = (e.clientX + 14) + 'px';
  el.style.top = (e.clientY - 8) + 'px';
};
const hideKgTip = () => { $('tooltip').style.opacity = '0'; };

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
      const onEsc = (e) => { if (e.key === 'Escape') { close(); } };
      const close = () => {
        $('modal-overlay').classList.remove('visible');
        document.removeEventListener('keydown', onEsc, true);
      };
      document.addEventListener('keydown', onEsc, true);
      $('modal-ok').onclick = () => {
        copyToClipboard(data.path, 'Caminho copiado');
        close();
      };
      $('modal-cancel').onclick = () => close();
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

// ── IP de rede ──
let networkIps = [];

const loadNetworkIp = async () => {
  const el = $('settings-ip-value');
  if (!el) return;
  el.textContent = '…';
  try {
    const res = await fetch('/system/network');
    const data = await res.json();
    networkIps = data.ips ?? [];
    if (networkIps.length === 0) {
      el.textContent = 'Sem rede';
    } else {
      el.textContent = networkIps[0].address;
    }
  } catch {
    el.textContent = 'erro';
  }
};

const copyNetworkIp = () => {
  if (networkIps.length === 0) return;
  const ips = networkIps.map((i) => \`\${i.address}\`).join(', ');
  copyToClipboard(ips, 'IP copiado');
};

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
      description: 'Faz uma requisição HTTP para a API do docmap. Use para ler e criar notas, diagramas, skills, macros, podcasts (POST /podcasts), e desenhar no canvas (POST /canvas/push).',
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
let chatStreaming = false;
let chatAbort     = null;
let chatProvider  = 'ollama';  // default; sobrescrito no boot por /ai/config
let agentOpen     = false;

const AGENT_OPEN_KEY = 'docmap-agent-open';

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

// ── Sidebar: abrir / recolher (persiste no localStorage) ──
const setAgentOpen = (open, persist = true) => {
  agentOpen = open;
  const panel = $('agent-panel');
  if (!panel) return;
  panel.classList.toggle('open', open);
  if (persist) saveAgentState();
  if (open) {
    if (!chatMessages.length) {
      appendChatBubble('assistant', 'Olá! Posso acessar suas notas, diagramas, skills e macros. Como posso ajudar?');
    }
    setTimeout(() => $('chat-input')?.focus(), 180);
  }
};

const toggleAgent = () => setAgentOpen(!agentOpen);

const loadAgentState = () => {
  let open = false;
  try { open = localStorage.getItem(AGENT_OPEN_KEY) === '1'; } catch { /* ignora */ }
  setAgentOpen(open, false);
};

const saveAgentState = () => {
  try { localStorage.setItem(AGENT_OPEN_KEY, agentOpen ? '1' : '0'); } catch { /* ignora quota */ }
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
  loadAgentState();

  const sel = $('chat-provider');
  if (sel) sel.addEventListener('change', (e) => changeProvider(e.target.value));

  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  $('chat-input').addEventListener('input', function() {
    this.style.height = '';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && agentOpen) toggleAgent();
  });
});

</script>
  </body>
</html>
`;
