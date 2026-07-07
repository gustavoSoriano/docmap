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
  return `hsl(${h} 62% 62%)`;
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
