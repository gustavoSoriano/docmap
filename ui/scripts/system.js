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
  $('update-text').textContent = `Nova versão ${upd.latest} disponível (você tem ${upd.current}).`;
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
        `Backup salvo com <strong>${data.entries} itens</strong>.<br><br>` +
        `<code id="backup-path-text" style="word-break:break-all;font-size:12px;">${escHtml(data.path)}</code>`;
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
  const ok = await confirmDialog('Selecionar um arquivo de backup para restaurar?\nOs dados atuais serão mesclados.', { okLabel: 'Escolher arquivo' });
  if (!ok) return;
  try {
    const res  = await fetch('/system/restore-pick', { method: 'POST' });
    const data = await res.json();
    if (data.cancelled) return;
    if (data.ok) {
      toast(`${data.imported} itens restaurados`);
      loadNotesList();
    } else {
      toast('Falha ao restaurar');
    }
  } catch { toast('Erro ao restaurar'); }
};

document.addEventListener('DOMContentLoaded', initSystem);
