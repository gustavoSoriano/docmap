// ════ Terminal Integrated — xterm.js + WebSocket ════
// Depende de: Terminal (CDN xterm.js), FitAddon (CDN xterm-addon-fit), dom.js ($)

(function () {
  'use strict';

  // ── Estado ──
  let termInstance = null;
  let fitAddon = null;
  let termSocket = null;
  let termOpen = false;
  var TERM_HEIGHT_KEY = 'docmap-term-height';

  // ── Fit via FitAddon oficial (substitui manualFit) ──
  // NOTA: fitAddon.fit() resize o canvas internamente mas retorna undefined.
  // Para saber se houve resize, usamos proposeDimensions() antes de fit().
  const doFit = function () {
    if (!termInstance || !fitAddon || !termOpen) return false;
    try {
      var dims = fitAddon.proposeDimensions();
      if (!dims) return false;
      // Só resize se colunas/linhas realmente mudaram
      if (dims.cols === termInstance.cols && dims.rows === termInstance.rows) return false;
      fitAddon.fit();
      return true;
    } catch (e) {
      console.warn('[terminal] FitAddon.fit() failed:', e);
      return false;
    }
  };

  // ── Tema (sync com tokens CSS) ──
  const DARK_THEME = {
    background: '#0b0c0e',
    foreground: '#edeef1',
    cursor: '#37d99a',
    cursorAccent: '#06120d',
    selectionBackground: 'rgba(55,217,154,0.25)',
    black: '#1e222a',
    red: '#fb7185',
    green: '#37d99a',
    yellow: '#fbbf24',
    blue: '#60a5fa',
    magenta: '#f472b6',
    cyan: '#22d3ee',
    white: '#edeef1',
    brightBlack: '#454b56',
    brightRed: '#fb7185',
    brightGreen: '#37d99a',
    brightYellow: '#fbbf24',
    brightBlue: '#60a5fa',
    brightMagenta: '#f472b6',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff',
  };

  const LIGHT_THEME = {
    background: '#ffffff',
    foreground: '#1a1d23',
    cursor: '#0e9f6e',
    cursorAccent: '#ffffff',
    selectionBackground: 'rgba(14,159,110,0.20)',
    black: '#e3e6ec',
    red: '#e11d48',
    green: '#0e9f6e',
    yellow: '#b45309',
    blue: '#2563eb',
    magenta: '#c026d3',
    cyan: '#0891b2',
    white: '#1a1d23',
    brightBlack: '#aab2bf',
    brightRed: '#e11d48',
    brightGreen: '#0e9f6e',
    brightYellow: '#b45309',
    brightBlue: '#2563eb',
    brightMagenta: '#c026d3',
    brightCyan: '#0891b2',
    brightWhite: '#000000',
  };

  const getTheme = function () {
    return document.documentElement.dataset.theme === 'light'
      ? LIGHT_THEME
      : DARK_THEME;
  };

  // ── Inicialização do xterm ──
  const initTerminal = function () {
    if (termInstance) return;

    if (typeof Terminal === 'undefined') {
      console.warn('xterm.js não carregou — terminal indisponível');
      return;
    }
    if (typeof FitAddon === 'undefined') {
      console.warn('xterm-addon-fit não carregou — terminal indisponível');
      return;
    }

    termInstance = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
      fontSize: window.innerWidth <= 600 ? 12 : 13,
      theme: getTheme(),
      scrollback: 10000,
      allowProposedApi: true,
    });

    fitAddon = new FitAddon();
    termInstance.loadAddon(fitAddon);

    var container = document.getElementById('terminal-container');
    if (!container) return;

    termInstance.open(container);

    // Fit inicial: espera o browser completar o layout antes de medir.
    // O FitAddon usa as dimensões internas do xterm (mais preciso que
    // span de medição), e já subtrai a scrollbar automaticamente.
    var fitRetries = 0;
    var MAX_FIT_RETRIES = 10;
    var tryInitialFit = function () {
      if (!termOpen || !termInstance) return;
      var ok = doFit();
      if (!ok && fitRetries < MAX_FIT_RETRIES) {
        fitRetries++;
        requestAnimationFrame(function () {
          setTimeout(tryInitialFit, 50);
        });
      }
    };
    requestAnimationFrame(function () {
      setTimeout(tryInitialFit, 20);
    });

    // ── Input: envia dados para o servidor via WebSocket ──
    termInstance.onData(function (data) {
      if (termSocket && termSocket.readyState === WebSocket.OPEN) {
        termSocket.send(JSON.stringify({ type: 'input', data: data }));
      }
    });

    // ── ResizeObserver: detecta mudanças de tamanho do container ──
    var resizeTimer = null;
    if (window.ResizeObserver) {
      var observer = new ResizeObserver(function () {
        if (!termOpen || !termInstance) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          try {
            var didResize = doFit();
            // Só notifica o servidor se o resize REALMENTE mudou cols/rows
            if (didResize && termSocket && termSocket.readyState === WebSocket.OPEN) {
              termSocket.send(JSON.stringify({
                type: 'resize',
                cols: termInstance.cols,
                rows: termInstance.rows,
              }));
            }
          } catch (_) { /* resize pode falhar se container invisível */ }
        }, 150);
      });
      observer.observe(container);
    }

    // ── MutationObserver: sync de tema ──
    if (window.MutationObserver) {
      var themeObserver = new MutationObserver(function () {
        if (termInstance && termInstance.element && typeof termInstance.setOption === 'function') {
          termInstance.setOption('theme', getTheme());
        }
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }
  };

  // ── Conexão WebSocket ──
  const connectTerminal = function () {
    if (termSocket && (termSocket.readyState === WebSocket.OPEN || termSocket.readyState === WebSocket.CONNECTING)) return;

    if (termSocket) {
      try { termSocket.close(); } catch (_) { /* noop */ }
      termSocket = null;
    }

    var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var wsUrl = protocol + '//' + location.host + '/terminal/ws';

    try {
      termSocket = new WebSocket(wsUrl);
    } catch (_) {
      if (termInstance) {
        termInstance.write('\r\n\x1b[31m[erro ao criar conexão]\x1b[0m\r\n');
      }
      return;
    }

    termSocket.addEventListener('open', function () {
      var status = document.getElementById('term-status');
      if (status) status.classList.add('connected');
      if (termInstance) {
        requestAnimationFrame(function () {
          var did = doFit();
          if (did && termSocket && termSocket.readyState === WebSocket.OPEN) {
            termSocket.send(JSON.stringify({
              type: 'resize',
              cols: termInstance.cols,
              rows: termInstance.rows,
            }));
          }
        });
      }
    });

    termSocket.addEventListener('message', function (event) {
      if (termInstance && typeof event.data === 'string') {
        termInstance.write(event.data);
      }
    });

    termSocket.addEventListener('close', function () {
      var status = document.getElementById('term-status');
      if (status) status.classList.remove('connected');
      if (termInstance) {
        termInstance.write('\r\n\x1b[31m[desconectado]\x1b[0m\r\n');
      }
      termSocket = null;
    });

    termSocket.addEventListener('error', function () {
      if (termInstance) {
        termInstance.write('\r\n\x1b[31m[erro de conexão]\x1b[0m\r\n');
      }
    });
  };

  // ── Toggle painel ──
  window.toggleTerminal = function () {
    if (termOpen) {
      closeTerminal();
    } else {
      openTerminal();
    }
  };

  const openTerminal = function () {
    var panel = document.getElementById('terminal-panel');
    if (!panel) return;

    // Restaura altura salva
    var saved = localStorage.getItem(TERM_HEIGHT_KEY);
    if (saved && window.innerWidth > 600) {
      panel.style.height = saved;
    } else if (window.innerWidth <= 600) {
      panel.style.height = ''; // CSS cuida (100vh overlay)
    }

    panel.classList.add('visible');
    termOpen = true;

    var btn = document.getElementById('rail-terminal');
    if (btn) btn.classList.add('active');

    // Lazy init
    initTerminal();
    if (termInstance) connectTerminal();

    // Fit após o painel ficar visível e layout completo
    requestAnimationFrame(function () {
      setTimeout(function () { doFit(); }, 50);
    });
  };

  const closeTerminal = function () {
    var panel = document.getElementById('terminal-panel');
    if (panel) panel.classList.remove('visible');
    termOpen = false;

    var btn = document.getElementById('rail-terminal');
    if (btn) btn.classList.remove('active');
  };

  // ── Drag handle (desktop apenas) ──
  const setupDragHandle = function () {
    var handle = document.getElementById('terminal-handle');
    var panel = document.getElementById('terminal-panel');
    if (!handle || !panel) return;

    var dragging = false;
    var startY = 0;
    var startHeight = 0;

    const onStart = function (e) {
      if (window.innerWidth <= 600) return;
      if (e.touches) e.preventDefault();
      dragging = true;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      startHeight = panel.offsetHeight;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    };

    const onMove = function (e) {
      if (!dragging) return;
      if (e.touches) e.preventDefault();
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      var deltaY = startY - clientY;
      var newHeight = startHeight + deltaY;

      var vh = window.innerHeight / 100;
      var minH = 15 * vh;
      var maxH = 60 * vh;
      newHeight = Math.max(minH, Math.min(maxH, newHeight));

      panel.style.height = newHeight + 'px';
    };

    const onEnd = function () {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      try { localStorage.setItem(TERM_HEIGHT_KEY, panel.style.height); } catch (_) { /* quota ou private browsing */ }

      // Re-fit do xterm após drag
      requestAnimationFrame(function () {
        var did = doFit();
        if (did && termSocket && termSocket.readyState === WebSocket.OPEN) {
          termSocket.send(JSON.stringify({
            type: 'resize',
            cols: termInstance.cols,
            rows: termInstance.rows,
          }));
        }
      });
    };

    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  };

  // ── Init no load ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDragHandle);
  } else {
    setupDragHandle();
  }
})();
