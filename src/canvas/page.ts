import { html } from '../server/response.ts';

const PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>docmap — canvas</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0f0f;--surface:#1a1a2e;--border:#2a2a3e;--text:#e0e0e0;--text-dim:#888;--accent:#6c5ce7;--hover:rgba(255,255,255,0.08)}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column;overflow:hidden}
#header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:#0f1217;border-bottom:1px solid var(--border);flex-shrink:0;min-height:40px}
#header h1{font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px}
#header h1::before{content:"\\25C6";color:var(--accent)}
#status{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim)}
#status-dot{width:7px;height:7px;border-radius:50%;background:#f44336;transition:background .3s}
#status-dot.connected{background:#4caf50}
#status-dot.connecting{background:#ff9800;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
#conn-count{font-size:10px;background:rgba(255,255,255,.06);padding:1px 7px;border-radius:8px}
#actions{display:flex;gap:4px}
.btn{background:none;border:1px solid var(--border);color:var(--text);padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .15s}
.btn:hover{background:var(--hover)}
.btn-danger:hover{background:rgba(244,67,54,.15);border-color:#f44336}
.btn-inspect{display:none;align-items:center;gap:4px;background:none;border:1px solid var(--border);color:var(--text);padding:3px 10px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .15s}
.btn-inspect.visible{display:inline-flex}
.btn-inspect:hover{background:var(--hover)}
.btn-inspect.active{background:rgba(108,92,231,.2);border-color:var(--accent);color:var(--accent)}
.btn-inspect svg{width:13px;height:13px;flex-shrink:0}
#render-area{flex:1;position:relative;overflow:hidden}
#render-frame{width:100%;height:100%;border:none;background:#fff;display:block}
#empty-state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-dim);font-size:13px;pointer-events:none;transition:opacity .4s;z-index:1}
#empty-state.hidden{opacity:0}
#empty-state .ico{font-size:40px;margin-bottom:10px;opacity:.25}
#empty-state .hint{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:8px}
#empty-state code{background:rgba(255,255,255,.06);padding:3px 8px;border-radius:4px;font-size:12px;color:var(--accent);font-family:ui-monospace,monospace}
#toast{position:fixed;bottom:16px;right:16px;background:var(--surface);border:1px solid var(--border);padding:6px 14px;border-radius:6px;font-size:12px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:100}
#toast.show{opacity:1}
#modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:none;align-items:center;justify-content:center}
#modal-overlay.open{display:flex}
#modal{background:#101216;border:1px solid #333;border-radius:10px;width:520px;max-width:90vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.8)}
#modal-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #333}
#modal-header h2{font-size:14px;font-weight:600;color:#e0e0e0}
#modal-close{background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:0 4px}
#modal-close:hover{color:#e0e0e0}
#modal-body{padding:14px 16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px}
#modal-body .el-summary{font-size:11px;color:#888;background:rgba(255,255,255,.06);padding:6px 10px;border-radius:5px;font-family:ui-monospace,monospace;word-break:break-all}
#modal-body label{font-size:11px;color:#888;margin-bottom:-4px}
#modal-body textarea{background:#0a0a0a;border:1px solid #333;color:#e0e0e0;padding:8px 10px;border-radius:5px;font-size:12px;font-family:ui-monospace,monospace;resize:vertical;min-height:80px;width:100%;outline:none}
#modal-body textarea:focus{border-color:var(--accent)}
#modal-footer{display:flex;gap:6px;padding:10px 16px;border-top:1px solid #333;justify-content:flex-end}
.modal-btn{background:none;border:1px solid #333;color:#e0e0e0;padding:5px 14px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .15s}
.modal-btn:hover{background:rgba(255,255,255,.08)}
.modal-btn-primary{background:var(--accent);border:1px solid var(--accent);color:#fff}
.modal-btn-primary:hover{opacity:.85}
</style>
</head>
<body>

<div id="header">
  <h1>Canvas</h1>
  <div id="status">
    <span id="status-dot" class="connecting"></span>
    <span id="status-text">conectando...</span>
    <span id="conn-count"></span>
  </div>
  <div id="actions">
    <button id="btn-inspect" class="btn-inspect" onclick="toggleInspect()" title="Inspecionar elemento"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Inspecionar</button>
    <button class="btn btn-danger" onclick="clearCanvas()" title="Limpar canvas">✕ Limpar</button>
  </div>
</div>

<div id="render-area">
  <iframe id="render-frame" sandbox="allow-scripts"></iframe>
  <div id="empty-state">
    <div class="ico">🎨</div>
    <div>Canvas vazio</div>
    <div class="hint">
      <span>Envie HTML via API:</span>
      <code>POST /canvas/push { "html": "&lt;h1&gt;Ol&amp;aacute;&lt;/h1&gt;", "type": "replace" }</code>
    </div>
  </div>
</div>

<div id="modal-overlay">
  <div id="modal">
    <div id="modal-header">
      <h2>O que deseja fazer com este elemento?</h2>
      <button id="modal-close" onclick="closeInspectorModal()">&times;</button>
    </div>
    <div id="modal-body">
      <div id="modal-el-summary" class="el-summary"></div>
      <label for="modal-user-text">Descreva o que deseja fazer:</label>
      <textarea id="modal-user-text" placeholder="Ex: mudar a cor de fundo para azul, aumentar o padding..."></textarea>
    </div>
    <div id="modal-footer">
      <button class="modal-btn" onclick="closeInspectorModal()">Fechar</button>
      <button id="modal-copy-btn" class="modal-btn modal-btn-primary" onclick="copyPrompt()">Copiar prompt</button>
    </div>
  </div>
</div>

<div id="toast"></div>

<script>
(function(){
  var frame = document.getElementById('render-frame');
  var empty = document.getElementById('empty-state');
  var dot = document.getElementById('status-dot');
  var stxt = document.getElementById('status-text');
  var cnt  = document.getElementById('conn-count');
  var toastEl = document.getElementById('toast');
  var btnInsp = document.getElementById('btn-inspect');
  var reconnectAttempts = 0;
  var MAX_RECONNECT = 20;
  var inspectMode = false;
  var inspectData = null;
  var _cleanHtml = '';

  var CLOSE_SCRIPT = '<' + '/script>';
  var INJECT_SCRIPT = '<script>' +
    '(function(){' +
    'var hovered=null;' +
    'function highlight(el){' +
    'if(el){el.style.outline="2px solid #6c5ce7";el.style.outlineOffset="-1px";}' +
    '}' +
    'function unhighlight(el){' +
    'if(el){el.style.outline="";el.style.outlineOffset="";}' +
    '}' +
    'document.addEventListener("mouseover",function(e){' +
    'var el=e.target;' +
    'if(el===hovered)return;' +
    'unhighlight(hovered);' +
    'hovered=el;' +
    'highlight(el);' +
    '},true);' +
    'document.addEventListener("click",function(e){' +
    'e.preventDefault();' +
    'e.stopPropagation();' +
    'var el=e.target;' +
    'unhighlight(hovered);' +
    'hovered=null;' +
    'var tag=el.tagName.toLowerCase();' +
    'var attrs={};' +
    'for(var i=0;i<el.attributes.length;i++){' +
    'attrs[el.attributes[i].name]=el.attributes[i].value;' +
    '}' +
    'var rect=el.getBoundingClientRect();' +
    'parent.postMessage({' +
    'type:"inspect-element",' +
    'data:{' +
    'tag:tag,' +
    'id:el.id||null,' +
    'classes:Array.from(el.classList),' +
    'attributes:attrs,' +
    'textContent:(el.textContent||"").trim().slice(0,200),' +
    'boundingRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}' +
    '}' +
    '},"*");' +
    '},true);' +
    'document.documentElement.style.cursor="crosshair";' +
    '})();' +
    CLOSE_SCRIPT;

  function setFrame(html){
    if (!frame || !empty) return;
    _cleanHtml = html;
    var finalHtml = html;
    if (inspectMode) {
      finalHtml = html.replace('</body>', INJECT_SCRIPT + '</body>');
    }
    frame.srcdoc = finalHtml;
    empty.classList.toggle('hidden', html.length > 0);
    var hasContent = html.length > 0 && html !== '<!DOCTYPE html><html><head></head><body></body></html>';
    if (btnInsp) btnInsp.classList.toggle('visible', hasContent);
  }

  function showToast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._hide);
    toastEl._hide = setTimeout(function(){ toastEl.classList.remove('show'); }, 2500);
  }

  window.clearCanvas = function(){
    showToast('Limpando...');
    inspectMode = false;
    _cleanHtml = '';
    if (btnInsp) { btnInsp.classList.remove('active'); btnInsp.classList.remove('visible'); }
    fetch('/canvas/clear', { method:'POST' })
      .then(function(){ showToast('Canvas limpo'); })
      .catch(function(){ showToast('Erro ao limpar'); });
  };

  window.toggleInspect = function(){
    inspectMode = !inspectMode;
    if (btnInsp) btnInsp.classList.toggle('active', inspectMode);
    if (inspectMode) {
      showToast('Modo inspecao ativado. Passe o mouse sobre os elementos.');
      if (_cleanHtml) setFrame(_cleanHtml);
    } else {
      showToast('Modo inspecao desativado');
      if (_cleanHtml) setFrame(_cleanHtml);
    }
  };

  function handleInspectMessage(data){
    inspectData = data;
    if (inspectMode) {
      inspectMode = false;
      if (btnInsp) btnInsp.classList.remove('active');
      if (_cleanHtml) setFrame(_cleanHtml);
    }
    openInspectorModal(data);
  }

  function openInspectorModal(data){
    if (!data || typeof data !== 'object' || typeof data.tag !== 'string') return;
    var sum = document.getElementById('modal-el-summary');
    if (sum) {
      var desc = '<' + data.tag;
      if (data.id) desc += ' #' + data.id;
      if (data.classes && data.classes.length) desc += ' .' + data.classes.join('.');
      desc += '>';
      sum.textContent = desc;
    }
    var ta = document.getElementById('modal-user-text');
    if (ta) ta.value = '';
    var overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('open');
  }

  window.closeInspectorModal = function(){
    var overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('open');
    if (inspectMode) {
      inspectMode = false;
      if (btnInsp) btnInsp.classList.remove('active');
      if (_cleanHtml) setFrame(_cleanHtml);
    }
  };

  window.copyPrompt = function(){
    var ta = document.getElementById('modal-user-text');
    var userText = ta ? ta.value.trim() : '';
    var data = inspectData;
    if (!data) {
      showToast('Nenhum elemento selecionado');
      return;
    }
    var btn = document.getElementById('modal-copy-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Gerando...'; }
    fetch('/canvas/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ element: data, userText: userText || 'Descrever o elemento' })
    }).then(function(r){ return r.json(); }).then(function(resp){
      var prompt = resp.prompt || JSON.stringify(resp);
      return navigator.clipboard.writeText(prompt);
    }).then(function(){
      showToast('Prompt copiado!');
      closeInspectorModal();
    }).catch(function(){
      showToast('Erro ao gerar prompt');
    }).finally(function(){
      if (btn) { btn.disabled = false; btn.textContent = 'Copiar prompt'; }
    });
  };

  window.addEventListener('message', function(e){
    if (e.origin !== 'null') return;
    if (!inspectMode) return;
    if (e.data && e.data.type === 'inspect-element') {
      handleInspectMessage(e.data.data);
    }
  });

  function connect(){
    if (reconnectAttempts >= MAX_RECONNECT) {
      if (stxt) stxt.textContent = 'falha na conexao';
      if (dot) dot.className = '';
      return;
    }
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var ws = new WebSocket(proto + '//' + location.host + '/canvas/ws');

    ws.onopen = function(){
      reconnectAttempts = 0;
      if (dot) dot.className = 'connected';
      if (stxt) stxt.textContent = 'conectado';
    };

    ws.onmessage = function(e){
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'replace') setFrame(typeof msg.html === 'string' ? msg.html : '');
      } catch(err){
        console.warn('canvas WS: invalid message', err, e.data);
      }
    };

    ws.onclose = function(){
      reconnectAttempts++;
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

  setFrame('<!DOCTYPE html><html><head></head><body></body></html>');
  connect();
})();
<\/script>
</body>
</html>`;

export const serveCanvasPage = (): Promise<Response> =>
  Promise.resolve(html(PAGE));
