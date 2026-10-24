// ════ Trilhas — sinais: bloqueio, aviso, pergunta, pendência ════
// Humano e agente usam o mesmo canal. Bloqueio aberto trava o bloco;
// resolver o último libera de volta.

let trSignalKind = 'warning';
const TR_HUMAN = 'Você';

const trilhaSignalForm = () => {
  const node = trilhaNodeById(selectedTrilhaNodeId);
  const options = ['warning', 'blocker', 'question', 'pending'].map((k) =>
    `<option value="${k}"${trSignalKind === k ? ' selected' : ''}>${TR_SIGNAL_LABEL[k]}</option>`
  ).join('');
  return `<form class="tr-sig-form" onsubmit="submitTrilhaSignal(event)">
    <div class="tr-sig-row">
      <select id="trilha-sig-kind" class="sel" aria-label="Tipo do sinal" onchange="trSignalKind=this.value">${options}</select>
      <input id="trilha-sig-text" class="field" maxlength="500" autocomplete="off"
        placeholder="O que travou ou precisa de decisão?" aria-label="Texto do sinal">
      <button class="icon-btn" type="submit" title="Registrar sinal">${ICON('send')}</button>
    </div>
    <div class="tr-sig-target">${node ? `Em: ${escHtml(node.title)}` : 'Na trilha inteira'}</div>
  </form>`;
};

const trilhaSignalRow = (signal) => `
  <div class="tr-sig-item k-${signal.kind}">
    <span class="tr-att-ico">${ICON(TR_SIGNAL_ICON[signal.kind])}</span>
    <div class="tr-att-main">
      <div class="tr-att-text">${escHtml(signal.text)}</div>
      <div class="tr-att-meta"><span>${TR_SIGNAL_LABEL[signal.kind]}</span>${signal.by ? `<i></i><span>${escHtml(signal.by)}</span>` : ''}<i></i><span>${trilhaAgo(signal.createdAt)}</span></div>
    </div>
    <button type="button" class="icon-btn" onclick="resolveTrilhaSignal('${signal.id}','${signal.kind}')" title="Resolver">${ICON('check')}</button>
  </div>`;

const submitTrilhaSignal = async (e) => {
  e.preventDefault();
  if (!currentTrilhaDetail) return;
  const text = $('trilha-sig-text').value.trim();
  if (!text) {
    toast('Escreva o sinal');
    return;
  }
  const body = { kind: trSignalKind, text, by: TR_HUMAN };
  if (selectedTrilhaNodeId) body.nodeId = selectedTrilhaNodeId;
  try {
    const res = await fetch(`/trilhas/${currentTrilhaDetail.trilha.id}/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    await refreshCurrentTrilha();
  } catch (err) {
    toast(err.message || 'Falha ao registrar sinal');
  }
};

const resolveTrilhaSignal = async (signalId, kind) => {
  if (!currentTrilhaDetail) return;
  let resolution = '';
  if (kind === 'question' || kind === 'pending') {
    const answer = await promptDialog(
      kind === 'question' ? 'Sua resposta (opcional)' : 'Como foi resolvido? (opcional)',
      { okLabel: 'Resolver', placeholder: 'Ex: pode seguir com a v2' },
    );
    if (answer === null) return;
    resolution = answer.trim();
  }
  try {
    const res = await fetch(
      `/trilhas/${currentTrilhaDetail.trilha.id}/signals/${signalId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(resolution ? { resolution } : {}), by: TR_HUMAN }),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    await refreshCurrentTrilha();
    toast('Sinal resolvido');
  } catch (err) {
    toast(err.message || 'Falha ao resolver');
  }
};
