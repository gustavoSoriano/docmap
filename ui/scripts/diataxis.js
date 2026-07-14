// ════ Diátaxis — visões de estudo do workspace ════

let diataxisDocSets = [];
let currentDocSet = null;
let currentPromptInput = null;

const DIATAXIS_LABEL = {
  tutorial: 'Tutorial',
  'how-to': 'How-to',
  reference: 'Referência',
  explanation: 'Explicação',
};

const KIND_LABEL = {
  file: 'Arquivo',
  note: 'Nota',
  skill: 'Skill',
  macro: 'Macro',
  diagram: 'Diagrama',
  task: 'Task',
  mock: 'Mock',
  favorite: 'Favorito',
};

const KIND_ICON = {
  file: '📄',
  note: '📝',
  skill: '✨',
  macro: '🤖',
  diagram: '📊',
  task: '✅',
  mock: '🔌',
  favorite: '🔖',
};

const loadDiataxis = async () => {
  try {
    const res = await fetch('/docsets');
    diataxisDocSets = await res.json();
    renderDiataxisSidebar();
    if (currentDocSet) {
      const refreshed = diataxisDocSets.find((d) => d.id === currentDocSet.id);
      if (refreshed) await openDocSet(refreshed.id);
      else showDiataxisEmpty();
    } else if (diataxisDocSets.length > 0) {
      await openDocSet(diataxisDocSets[0].id);
    } else {
      showDiataxisEmpty();
    }
  } catch (err) {
    console.error('Erro ao carregar visões Diátaxis:', err);
    toast('Erro ao carregar visões Diátaxis');
  }
};

const renderDiataxisSidebar = () => {
  const list = $('diataxis-sets-list');
  if (!diataxisDocSets.length) {
    list.innerHTML = `<div class="diataxis-set-item" style="opacity:.6;cursor:default">
      <span class="diataxis-set-title">Nenhuma visão ainda</span>
      <span class="diataxis-set-purpose">Clique em + para criar.</span>
    </div>`;
    return;
  }
  list.innerHTML = diataxisDocSets.map((d) => `
    <div class="diataxis-set-item${currentDocSet?.id === d.id ? ' active' : ''}"
      onclick="openDocSet('${d.id}')">
      <span class="diataxis-set-title">${escHtml(d.title)}</span>
      <span class="diataxis-set-purpose">${escHtml(d.purpose)}</span>
      <span class="diataxis-set-meta">${escHtml(d.depth)} · ${new Date(d.updatedAt).toLocaleDateString('pt-BR')}</span>
    </div>
  `).join('');
};

const showDiataxisEmpty = () => {
  currentDocSet = null;
  $('diataxis-content').classList.remove('visible');
  $('diataxis-empty').style.display = 'flex';
  renderDiataxisSidebar();
};

const openDocSet = async (id) => {
  try {
    const res = await fetch('/docsets/' + id);
    if (!res.ok) {
      showDiataxisEmpty();
      return;
    }
    currentDocSet = await res.json();
    renderDiataxisSidebar();
    renderCurrentDocSet();
  } catch (err) {
    console.error('Erro ao abrir visão:', err);
    toast('Erro ao abrir visão Diátaxis');
  }
};

const renderCurrentDocSet = () => {
  if (!currentDocSet) return;

  $('diataxis-empty').style.display = 'none';
  $('diataxis-content').classList.add('visible');

  $('diataxis-title').textContent = currentDocSet.title;
  $('diataxis-purpose').textContent = currentDocSet.purpose;
  $('diataxis-audience').style.display = currentDocSet.audience ? 'inline-flex' : 'none';
  $('diataxis-audience').textContent = currentDocSet.audience
    ? 'Para: ' + currentDocSet.audience
    : '';
  $('diataxis-depth').textContent = 'Profundidade: ' + currentDocSet.depth;

  const byType = {
    tutorial: [],
    'how-to': [],
    reference: [],
    explanation: [],
  };
  for (const item of currentDocSet.items) {
    if (byType[item.type]) byType[item.type].push(item);
  }

  for (const type of Object.keys(byType)) {
    const col = document.querySelector(`.diataxis-col-cards[data-type="${type}"]`);
    const count = document.querySelector(`.diataxis-col-count[data-type="${type}"]`);
    if (!col || !count) continue;
    count.textContent = String(byType[type].length);
    col.innerHTML = byType[type].length
      ? byType[type].map(renderDiataxisCard).join('')
      : `<div class="diataxis-card" style="opacity:.5;cursor:default">
          <div class="diataxis-card-title">Nenhum item</div>
          <div class="diataxis-card-reason">Nada classificado como ${DIATAXIS_LABEL[type]} nesta visão.</div>
        </div>`;
  }
};

const renderDiataxisCard = (item) => {
  const kind = item.ref.kind;
  const title = item.title ?? `${KIND_LABEL[kind]} · ${item.ref.id.slice(0, 22)}`;
  const missingClass = item.exists === false ? ' missing' : '';
  const originBadge = item.origin === 'generated'
    ? `<span class="diataxis-card-badge generated">gerado por IA</span>`
    : `<span class="diataxis-card-badge">existente</span>`;
  return `
    <div class="diataxis-card${missingClass}" data-kind="${kind}"
      onclick="openDiataxisItem('${kind}', '${item.ref.id}')">
      <div class="diataxis-card-top">
        <span class="diataxis-card-icon">${KIND_ICON[kind]}</span>
        <span class="diataxis-card-title">${escHtml(title)}</span>
      </div>
      <div class="diataxis-card-badges">
        <span class="diataxis-card-badge">${KIND_LABEL[kind]}</span>
        ${originBadge}
      </div>
      <div class="diataxis-card-reason">${escHtml(item.reason)}</div>
      <div class="diataxis-card-question">${escHtml(item.userQuestion)}</div>
    </div>
  `;
};

const setDiataxisReturnState = () => {
  if (!currentDocSet) return;
  window.diataxisReturnState = {
    docSetId: currentDocSet.id,
    title: currentDocSet.title,
  };
};

const openDiataxisItem = async (kind, id) => {
  setDiataxisReturnState();
  switch (kind) {
    case 'file':
      setMapTab('markmap');
      await loadFile(id);
      break;
    case 'note':
      await openNote(id);
      break;
    case 'skill':
      await openSkill(id);
      break;
    case 'macro':
      await openMacro(id);
      break;
    case 'diagram':
      await openDiagram(id);
      break;
    case 'task':
      await openTaskModal(id);
      break;
    case 'mock':
      openMockEditor(id);
      break;
    case 'favorite':
      await openFavLink(id);
      break;
  }
  renderDiataxisReturnButton();
};

// ── Wizard ──
const openDiataxisWizard = () => {
  $('diataxis-wizard-overlay').classList.add('visible');
  $('diataxis-wizard-title-input').value = '';
  $('diataxis-wizard-purpose-input').value = '';
  $('diataxis-wizard-audience-input').value = '';
  $('diataxis-wizard-depth-input').value = 'complete';
  $('diataxis-wizard-purpose-input').focus();
};

const closeDiataxisWizard = () => {
  $('diataxis-wizard-overlay').classList.remove('visible');
};

const getWizardInput = () => ({
  title: $('diataxis-wizard-title-input').value.trim(),
  purpose: $('diataxis-wizard-purpose-input').value.trim(),
  audience: $('diataxis-wizard-audience-input').value.trim() || undefined,
  depth: $('diataxis-wizard-depth-input').value,
});

const createAndCopyDiataxisPrompt = () => {
  const input = getWizardInput();
  if (!input.purpose) {
    toast('Defina o propósito da visão.');
    return;
  }
  currentPromptInput = input;
  const prompt = buildDiataxisPrompt(input);
  navigator.clipboard.writeText(prompt).then(() => {
    closeDiataxisWizard();
    openDiataxisApplyModal();
    toast('Prompt copiado! Cole a resposta da IA.');
  });
};

const buildDiataxisPrompt = (input) => {
  return `Você é um organizador de documentação especialista no framework Diátaxis, operando dentro do DocMap.

Sua tarefa é criar uma visão Diátaxis no DocMap para o workspace atual.

## Dados da visão

- Propósito: ${input.purpose}
- Público-alvo: ${input.audience || 'não especificado'}
- Profundidade desejada: ${input.depth}

## Ferramentas disponíveis

Você tem acesso às seguintes ferramentas. USE-AS para coletar contexto do workspace:

- list_files(pattern?) — lista arquivos do workspace. Ex: list_files({"pattern": "\\.md$"})
- read_file(file) — lê um arquivo. Ex: read_file({"file": "README.md"})
- http_request(method, path, body?) — chama a API do DocMap.
  - GET /notes, GET /skills, GET /macros, GET /diagrams, GET /tasks, GET /mocks, GET /favorites
  - GET /workspace/files — lista arquivos do workspace

## Framework Diátaxis

Classifique cada recurso em um dos 4 quadrantes:

- tutorial: leva alguém do zero até a primeira experiência prática guiada.
- how-to: guia para resolver uma tarefa real específica.
- reference: material de consulta factual (env vars, comandos, endpoints, etc.).
- explanation: aprofunda o entendimento do porquê, contexto e decisões.

## Instruções

1. Use list_files e read_file para ler os arquivos .md relevantes do workspace.
2. Use http_request GET para listar notas, skills, macros, diagramas, tasks, mocks e favoritos.
3. Para cada recurso útil ao propósito, classifique-o em um quadrante com action "reference" e o ID exato.
4. Se faltar conteúdo para cobrir o propósito, crie novos itens com action "create".
5. Tipos criáveis: note, skill, macro, diagram, task.
6. Cada item deve ter: type, action, reason e userQuestion.
7. Notas do tipo tutorial devem usar HTML no campo content.

## Como criar a visão no DocMap

Após montar a visão, você DEVE criá-la no DocMap chamando:

POST /docsets/apply

Com o body sendo exatamente este JSON:

{
  "title": "string",
  "purpose": "string",
  "audience": "string",
  "depth": "quick | complete | deep",
  "items": [
    {
      "type": "tutorial | how-to | reference | explanation",
      "action": "reference | create",
      "ref": { "kind": "file|note|skill|macro|diagram|task|mock|favorite", "id": "string" },
      "entityKind": "note|skill|macro|diagram|task",
      "proposedTitle": "string",
      "proposedContent": { },
      "reason": "string",
      "userQuestion": "string"
    }
  ]
}

Regras do JSON:
- Se action for "reference", "ref" é obrigatório e deve usar IDs reais do workspace.
- Se action for "create", "entityKind" e "proposedContent" são obrigatórios.
- proposedContent deve seguir o formato de criação da entidade no DocMap:
  - note: { title, content, category?, tags? }
  - skill: { name, title, description, content, tags? }
  - macro: { name, title, description?, script }
  - diagram: { title, source }
  - task: { title, description?, status? }
- Notas do tipo tutorial devem ser escritas em HTML.

NÃO responda apenas com o JSON. Execute as ferramentas, gere a visão e chame POST /docsets/apply para criá-la. Depois informe o usuário que a visão foi criada.`;
};

// ── Review ──
const showDiataxisReview = () => {
  if (!currentSuggestion) return;
  $('diataxis-review-overlay').classList.add('visible');

  const toCreate = currentSuggestion.items.filter((i) => i.action === 'create');
  const toReference = currentSuggestion.items.filter((i) => i.action === 'reference');

  $('diataxis-review-summary').innerHTML = `
    <strong>${escHtml(currentSuggestion.title)}</strong><br>
    Propósito: ${escHtml(currentSuggestion.purpose)}<br>
    ${currentSuggestion.audience ? `Público: ${escHtml(currentSuggestion.audience)}<br>` : ''}
    Itens sugeridos: ${currentSuggestion.items.length} (${toCreate.length} novos, ${toReference.length} existentes)
  `;

  const sections = [];
  if (toCreate.length) {
    sections.push(renderReviewSection('Serão criados', toCreate));
  }
  if (toReference.length) {
    sections.push(renderReviewSection('Serão referenciados', toReference));
  }
  $('diataxis-review-lists').innerHTML = sections.join('');
};

const renderReviewSection = (title, items) => {
  return `
    <div class="diataxis-review-section">
      <div class="diataxis-review-section-title">
        ${escHtml(title)}
        <span class="diataxis-review-section-count">${items.length}</span>
      </div>
      ${items.map((i) => `
        <div class="diataxis-review-item">
          <span class="diataxis-review-kind">${KIND_ICON[i.entityKind || i.ref?.kind] || '•'}</span>
          <div class="diataxis-review-info">
            <div class="diataxis-review-title">${escHtml(i.proposedTitle || i.ref?.id || 'Sem título')}</div>
            <div class="diataxis-review-meta">${escHtml(i.reason)}</div>
          </div>
          <span class="diataxis-review-type ${i.type}">${DIATAXIS_LABEL[i.type]}</span>
        </div>
      `).join('')}
    </div>
  `;
};

const closeDiataxisReview = () => {
  $('diataxis-review-overlay').classList.remove('visible');
  currentSuggestion = null;
};

const applyDiataxisSuggestion = async () => {
  if (!currentSuggestion) return;
  setLoading('btn-diataxis-apply', true);
  try {
    const res = await fetch('/docsets/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentSuggestion),
    });
    const docSet = await res.json();
    if (docSet.error) throw new Error(docSet.error);
    currentDocSet = docSet;
    closeDiataxisReview();
    await loadDiataxis();
    toast('Visão Diátaxis salva!');
  } catch (err) {
    console.error('Erro ao aplicar visão:', err);
    toast('Erro ao salvar visão Diátaxis');
  } finally {
    setLoading('btn-diataxis-apply', false);
  }
};

// ── Actions ──
const deleteCurrentDocSet = () => {
  if (!currentDocSet) return;
  confirmDialog(
    `Excluir a visão "${currentDocSet.title}"? As notas, skills e outras entidades criadas por ela não serão apagadas.`,
    { danger: true },
  ).then(async (confirmed) => {
    if (!confirmed) return;
    try {
      const res = await fetch('/docsets/' + currentDocSet.id, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('delete_failed');
      currentDocSet = null;
      await loadDiataxis();
      toast('Visão excluída');
    } catch (err) {
      console.error('Erro ao excluir visão:', err);
      toast('Erro ao excluir visão');
    }
  });
};

const regenerateCurrentDocSet = async () => {
  if (!currentDocSet) return;
  setLoading('btn-diataxis-regenerate', true);
  try {
    const res = await fetch('/docsets/' + currentDocSet.id + '/regenerate', {
      method: 'POST',
    });
    const docSet = await res.json();
    if (docSet.error) throw new Error(docSet.error);
    currentDocSet = docSet;
    renderCurrentDocSet();
    toast('Visão regenerada');
  } catch (err) {
    console.error('Erro ao regenerar visão:', err);
    toast('Erro ao regenerar visão');
  } finally {
    setLoading('btn-diataxis-regenerate', false);
  }
};

const copyDiataxisPrompt = () => {
  if (!currentDocSet) return;
  const input = {
    purpose: currentDocSet.purpose,
    audience: currentDocSet.audience,
    depth: currentDocSet.depth,
    allowCreation: true,
  };
  const prompt = buildDiataxisPrompt(input);
  navigator.clipboard.writeText(prompt).then(() => toast('Prompt copiado!'));
};

const setLoading = (id, loading) => {
  const btn = $(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '.6' : '1';
};

// ── Botão de retorno para Diátaxis ──
const renderDiataxisReturnButton = () => {
  if (typeof updateTopbarCrumb === 'function') updateTopbarCrumb();
};

const clearDiataxisReturnState = () => {
  window.diataxisReturnState = null;
  if (typeof updateTopbarCrumb === 'function') updateTopbarCrumb();
};

const returnToDiataxis = async () => {
  if (!window.diataxisReturnState) return;
  const { docSetId } = window.diataxisReturnState;
  clearDiataxisReturnState();
  setMode('map');
  setMapTab('diataxis');
  await openDocSet(docSetId);
};

window.returnToDiataxis = returnToDiataxis;


