// Confirmação no canvas. O webview não implementa window.confirm (devolve
// false sem mostrar nada — ver ui/scripts/dom.js), então a página usa este
// modal do design system. `askConfirm(msg, okLabel, danger)` → Promise<bool>.
//
// Strings injetadas em page.ts; o JS roda no mesmo módulo da página.

export const CONFIRM_CSS = `
#cconfirm-msg{display:flex;flex-direction:column;gap:8px;color:var(--text-2);line-height:1.45}
`;

export const CONFIRM_HTML = `
<div id="cconfirm" class="app-modal-overlay" role="dialog" aria-modal="true">
  <form class="app-modal" id="cconfirm-form">
    <div class="app-modal-head"><span id="cconfirm-title">Confirmar</span></div>
    <div class="app-modal-body"><div id="cconfirm-msg"></div></div>
    <div class="app-modal-actions">
      <button type="button" id="cconfirm-cancel" class="tool-btn">Cancelar</button>
      <button type="submit" id="cconfirm-ok" class="tool-btn primary">Confirmar</button>
    </div>
  </form>
</div>`;

export const CONFIRM_JS = `
// ── Confirmação (window.confirm não existe no webview) ──
var confirmEl = document.getElementById('cconfirm');
var confirmDone = null;

function closeConfirm(answer){
  confirmEl.classList.remove('visible');
  var done = confirmDone;
  confirmDone = null;
  if (done) done(answer);
}

function askConfirm(lines, okLabel, danger){
  if (confirmDone) closeConfirm(false);
  var msgEl = document.getElementById('cconfirm-msg');
  msgEl.innerHTML = '';
  [].concat(lines).forEach(function(line){
    var p = document.createElement('p');
    p.textContent = line;
    msgEl.appendChild(p);
  });
  var ok = document.getElementById('cconfirm-ok');
  ok.textContent = okLabel || 'Confirmar';
  ok.className = 'tool-btn ' + (danger ? 'danger' : 'primary');
  confirmEl.classList.add('visible');
  ok.focus();
  return new Promise(function(resolve){ confirmDone = resolve; });
}

document.getElementById('cconfirm-form').onsubmit = function(e){
  e.preventDefault();
  closeConfirm(true);
};
document.getElementById('cconfirm-cancel').onclick = function(){ closeConfirm(false); };
confirmEl.addEventListener('click', function(e){ if (e.target === confirmEl) closeConfirm(false); });
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && confirmEl.classList.contains('visible')) closeConfirm(false);
});
`;
