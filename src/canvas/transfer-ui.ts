// Exportar/importar na página do canvas. Exportar grava o pacote (desenho +
// macros vinculadas; links já vão nas formas) em ~/Downloads; importar abre
// o diálogo nativo e substitui a lousa para todos, com Desfazer.
//
// Strings injetadas em page.ts; o JS roda no mesmo módulo da página e
// reaproveita `askConfirm`, `store`, `showToast`, `showToastUndo`, `showUndoToast`,
// `takeBackup`, `applySnapshot`, `fittedOnce`, `lastBackup` e `loadMacros`.

const SVG = (inner: string): string =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const ICON_DOWNLOAD = SVG(
  '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
);
const ICON_UPLOAD = SVG(
  '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>',
);

/** Botões do HUD (antes do Limpar). */
export const TRANSFER_HUD = `
    <button id="export-btn" class="ghost-btn" type="button" title="Salvar desenho, macros e links num arquivo em Downloads">${ICON_DOWNLOAD}<span>Exportar</span></button>
    <button id="import-btn" class="ghost-btn" type="button" title="Abrir um canvas exportado (substitui a lousa para todos)">${ICON_UPLOAD}<span>Importar</span></button>`;

export const TRANSFER_JS = `
// ── Exportar / importar ──
var expectingImportEcho = false;

function plural(n, one, many){ return n + ' ' + (n === 1 ? one : many); }

function copyPath(path){
  var done = function(){ showToast('Caminho copiado'); };
  if (!navigator.clipboard || !navigator.clipboard.writeText) { showToast(path); return; }
  navigator.clipboard.writeText(path).then(done, function(){ showToast(path); });
}

function exportBoard(){
  if (store.size === 0) { showToast('A lousa está vazia'); return; }
  fetch('/canvas/export', { method: 'POST' }).then(function(r){ return r.json(); }).then(function(d){
    if (!d || !d.ok) throw new Error('export');
    var extra = d.macros ? ' com ' + plural(d.macros, 'macro', 'macros') : '';
    showToastUndo('Salvo em Downloads' + extra, 'Copiar caminho', function(){ copyPath(d.path); }, 9000);
  }).catch(function(){ showToast('Falha ao exportar'); });
}

function importSummary(d){
  var parts = ['Canvas importado: ' + plural(d.shapes, 'forma', 'formas')];
  if (d.macrosCreated) parts.push(plural(d.macrosCreated, 'macro criada', 'macros criadas'));
  if (d.macrosReused) parts.push(plural(d.macrosReused, 'macro já existia', 'macros já existiam'));
  return parts.join(', ');
}

function importBoard(){
  var lines = ['Importar substitui a lousa para todos.' + (store.size > 0 ? ' Logo depois dá para desfazer.' : '')];
  lines.push('Macros do arquivo são criadas aqui: revise o script antes de executar.');
  askConfirm(lines, 'Escolher arquivo').then(function(ok){ if (ok) pickAndImport(); });
}

function pickAndImport(){
  lastBackup = null;
  takeBackup('importação');
  expectingImportEcho = true;
  fetch('/canvas/import-pick', { method: 'POST' }).then(function(r){ return r.json(); }).then(function(d){
    if (d && d.cancelled) { expectingImportEcho = false; return; }
    if (!d || !d.ok) {
      expectingImportEcho = false;
      showToast((d && d.message) || 'Arquivo inválido');
      return;
    }
    loadMacros();
    showUndoToast(importSummary(d));
  }).catch(function(){ expectingImportEcho = false; showToast('Falha ao importar'); });
}

// Snapshot com reason 'import' (WS): própria importação ou de outra pessoa.
function onImportSnapshot(snapshot){
  var mine = expectingImportEcho;
  expectingImportEcho = false;
  if (!mine) { lastBackup = null; takeBackup('importação remota'); }
  fittedOnce = false;
  applySnapshot(snapshot);
  loadMacros();
  if (!mine) showUndoToast('Outra pessoa importou um canvas');
}

document.getElementById('export-btn').addEventListener('click', exportBoard);
document.getElementById('import-btn').addEventListener('click', importBoard);
`;
