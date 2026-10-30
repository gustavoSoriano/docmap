// Copiar/colar por teclado no canvas. O webview não expõe menu de edição e o
// `edit-shortcuts.ts` só injeta no frame principal (webview.init), então o
// iframe do canvas fica sem Cmd/Ctrl + A/C/X/V/Z. Aqui duas frentes:
//
//  1. Campos de texto (textarea de edição do Quickdraw e inputs dos modais):
//     os atalhos rodam via execCommand / Clipboard API, como no app principal.
//  2. Lousa (nada em edição): copiar formas põe o TEXTO delas no clipboard do
//     sistema (as formas inteiras ficam num clipboard interno), e colar texto
//     de fora cria uma forma de texto na posição do cursor.
//
// String injetada em page.ts; roda no mesmo módulo e usa `board`, `store`,
// `showToast` e `newId` (importado do vendor).

export const CLIPBOARD_JS = `
// ── Copiar e colar por teclado ──
var CLIP_KEY = 'docmap-canvas-clip';
var CLIP_MAX_TEXT = 10000;
var clipEditor = board.editor;
var lastPointer = null;

function clipReadText(){
  if (!navigator.clipboard) return Promise.resolve('');
  if (navigator.clipboard.readText) {
    return navigator.clipboard.readText().catch(function(){ return ''; });
  }
  return Promise.resolve('');
}

function clipWriteText(text){
  if (!navigator.clipboard || !navigator.clipboard.writeText) return Promise.reject(new Error('sem clipboard'));
  return navigator.clipboard.writeText(text);
}

// ── Campos de texto ──
function isTextField(el){
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName !== 'INPUT') return false;
  return /^(text|search|url|)$/i.test(el.type || '');
}

// execCommand mantém o desfazer nativo e dispara 'input' (o Quickdraw sincroniza
// o texto da forma nesse evento). Sem suporte, troca o trecho e dispara à mão.
function replaceSelection(el, text){
  if (document.activeElement !== el) el.focus();
  var ok = false;
  try { ok = text === '' ? document.execCommand('delete') : document.execCommand('insertText', false, text); } catch (e) {}
  if (ok) return;
  var s = el.selectionStart, e2 = el.selectionEnd;
  el.setRangeText(text, s, e2, 'end');
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function selectedText(el){
  return el.value.slice(el.selectionStart, el.selectionEnd);
}

function fieldCopy(el, andCut){
  var text = selectedText(el);
  if (!text) return;
  var done = false;
  try { done = document.execCommand(andCut ? 'cut' : 'copy'); } catch (e) {}
  if (done) return;
  clipWriteText(text).then(function(){
    if (andCut) replaceSelection(el, '');
  }).catch(function(){ showToast('Não foi possível copiar'); });
}

function fieldPaste(el){
  clipReadText().then(function(text){
    if (text) replaceSelection(el, text);
    else showToast('Clipboard sem texto');
  });
}

function onFieldShortcut(e){
  if (e.altKey) return;
  var mac = /mac/i.test(navigator.platform || '') || /mac/i.test(navigator.userAgent || '');
  var mod = mac ? (e.metaKey && !e.ctrlKey) : (e.ctrlKey && !e.metaKey);
  if (!mod || !isTextField(e.target)) return;
  var el = e.target;
  var k = String(e.key || '').toLowerCase();
  if (k === 'a' && !e.shiftKey) { e.preventDefault(); el.select(); }
  else if (k === 'c' && !e.shiftKey) { e.preventDefault(); fieldCopy(el, false); }
  else if (k === 'x' && !e.shiftKey) { e.preventDefault(); fieldCopy(el, true); }
  else if (k === 'v' && !e.shiftKey) { e.preventDefault(); fieldPaste(el); }
  else if (k === 'z') {
    e.preventDefault();
    try { document.execCommand(e.shiftKey ? 'redo' : 'undo'); } catch (err) {}
  }
}
// Captura: o textarea do Quickdraw faz stopPropagation do keydown.
document.addEventListener('keydown', onFieldShortcut, true);

// ── Lousa: copiar ──
function shapeText(s){
  if (s.type === 'text' || s.type === 'note') return (s.props && s.props.text) || '';
  if (s.type === 'geo') return (s.props && s.props.label) || '';
  return '';
}

function readInternalClip(){
  try { return JSON.parse(localStorage.getItem(CLIP_KEY) || 'null'); } catch (e) { return null; }
}

// Sem texto nas formas, o sistema recebe o payload JSON (como o vendor faz).
clipEditor.copySelection = function(){
  var shapes = [], assets = {};
  clipEditor.selection.forEach(function(id){
    var s = store.get(id);
    if (!s) return;
    shapes.push(s);
    if (s.type === 'image' && s.props.assetId) {
      var a = store.asset(s.props.assetId);
      if (a) assets[a.id] = a;
    }
  });
  if (!shapes.length) return Promise.resolve();
  var payload = JSON.stringify({ quickdraw: 1, shapes: shapes, assets: assets });
  var text = shapes.map(shapeText).filter(Boolean).join('\\n');
  try { localStorage.setItem(CLIP_KEY, JSON.stringify({ text: text, payload: payload })); } catch (e) {}
  return clipWriteText(text || payload).catch(function(){ showToast('Não foi possível copiar'); });
};

// ── Lousa: colar ──
function pasteTextShape(text){
  var at = lastPointer;
  if (!at) {
    var vp = clipEditor.viewportPageBounds();
    at = { x: vp.x + vp.w / 2 - 80, y: vp.y + vp.h / 2 - 20 };
  }
  var st = clipEditor.styles || {};
  var id = newId();
  store.put({
    id: id, typeName: 'shape', type: 'text', x: at.x, y: at.y, rot: 0, z: store.maxZ() + 1,
    props: { text: text.slice(0, CLIP_MAX_TEXT), color: st.color || 'black', size: st.size || 'm', font: st.font || 'draw', autosize: true, scale: 1 },
  });
  if (clipEditor.tool !== 'select') clipEditor.setTool('select');
  clipEditor.setSelection([id]);
  showToast('Texto colado');
}

function pasteText(text){
  if (!text) { showToast('Clipboard sem texto'); return; }
  var own = readInternalClip();
  var data = null;
  try { data = JSON.parse(own && own.text === text ? own.payload : text); } catch (e) {}
  if (data && data.quickdraw && Array.isArray(data.shapes)) clipEditor._pasteShapes(data);
  else pasteTextShape(text);
}

// Uma leitura só (cada read() pode pedir permissão ao webview): imagem vai
// pro importador do Quickdraw, texto cai em pasteText.
clipEditor.pasteFromClipboard = function(){
  var read = navigator.clipboard && navigator.clipboard.read ? navigator.clipboard.read() : Promise.reject(new Error('sem read'));
  function fromItems(items){
    for (var i = 0; i < items.length; i++) {
      var img = items[i].types.filter(function(t){ return t.indexOf('image/') === 0; })[0];
      if (img) return items[i].getType(img).then(function(b){ clipEditor.importImageBlobs([b]); });
    }
    var withText = items.filter(function(it){ return it.types.indexOf('text/plain') >= 0; })[0];
    if (withText) return withText.getType('text/plain').then(function(b){ return b.text(); }).then(pasteText);
    return clipReadText().then(pasteText);
  }
  // Só a leitura que falha cai no fallback: erro ao colar não cola duas vezes.
  return read.then(fromItems, function(){ return clipReadText().then(pasteText); });
};

// Posição do cursor sobre a lousa (coordenadas de página) para colar ali.
boardEl.addEventListener('pointermove', function(e){
  var r = boardEl.getBoundingClientRect();
  lastPointer = clipEditor.screenToPage(e.clientX - r.left, e.clientY - r.top);
});
boardEl.addEventListener('pointerleave', function(){ lastPointer = null; });
`;
