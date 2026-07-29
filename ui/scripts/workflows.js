// ════ Workflows de agentes externos ════

const WF_STATUS_LABEL = {
  draft: 'Rascunho',
  planning: 'Planejamento',
  running: 'Em execução',
  reviewing: 'Em revisão',
  blocked: 'Bloqueado',
  done: 'Concluído',
  cancelled: 'Cancelado',
};

const WF_NODE_STATUS_LABEL = {
  pending: 'Aguardando dependências',
  ready: 'Disponível',
  claimed: 'Reservado',
  in_progress: 'Em execução',
  waiting_input: 'Aguardando resposta',
  returned: 'Aguardando revisão',
  needs_rework: 'Retrabalho',
  done: 'Concluído',
  human_intervention: 'Intervenção humana',
  cancelled: 'Cancelado',
};

const WF_BOARD_COLUMNS = [
  'pending',
  'ready',
  'claimed',
  'in_progress',
  'waiting_input',
  'returned',
  'needs_rework',
  'done',
  'human_intervention',
  'cancelled',
];

let allWorkflows = [];
let currentWorkflowDetail = null;
let selectedWorkflowNodeId = null;
let selectedWorkflowNodeDetail = null;
let workflowEvents = null;
let workflowRefreshTimer = null;
let workflowBoardSuppressClick = false;

const workflowCsv = (value) =>
  value.split(',').map((item) => item.trim()).filter(Boolean);

const workflowLines = (value) =>
  value.split('\n').map((item) => item.trim()).filter(Boolean);

const workflowStatusLabel = (status) =>
  WF_STATUS_LABEL[status] || status;

const workflowNodeStatusLabel = (status) =>
  WF_NODE_STATUS_LABEL[status] || status;

const loadWorkflows = async () => {
  ensureWorkflowEvents();
  try {
    const res = await fetch('/workflows');
    allWorkflows = await res.json();
    renderWorkflowList();
    if (currentWorkflowDetail) {
      const stillExists = allWorkflows.some(
        (workflow) => workflow.id === currentWorkflowDetail.workflow.id,
      );
      if (!stillExists) clearCurrentWorkflow();
    }
  } catch (err) {
    console.error('Erro ao carregar workflows:', err);
    toast('Falha ao carregar workflows');
  }
};

const renderWorkflowList = () => {
  const list = $('wf-list');
  if (!list) return;
  const query = ($('wf-search')?.value || '').trim().toLowerCase();
  const status = $('wf-status-filter')?.value || '';
  const filtered = allWorkflows.filter((workflow) => {
    if (status && workflow.status !== status) return false;
    if (!query) return true;
    return `${workflow.title} ${workflow.objective} ${(workflow.tags || []).join(' ')}`
      .toLowerCase().includes(query);
  });
  $('wf-sidebar-count').textContent =
    `${allWorkflows.length} ${allWorkflows.length === 1 ? 'demanda' : 'demandas'}`;
  if (filtered.length === 0) {
    list.innerHTML = '<div class="wf-sidebar-empty">Nenhum workflow encontrado</div>';
    return;
  }
  list.innerHTML = filtered.map((workflow) => {
    const done = workflow.nodeCounts?.done || 0;
    const total = workflow.nodeCount || 0;
    const progress = total ? Math.round((done / total) * 100) : 0;
    const active = currentWorkflowDetail?.workflow.id === workflow.id;
    return `<button class="wf-list-item${active ? ' active' : ''}" data-workflow-id="${workflow.id}">
      <span class="wf-list-title">${escHtml(workflow.title)}</span>
      <span class="wf-list-objective">${escHtml(workflow.objective)}</span>
      <span class="wf-list-meta">
        <span class="wf-status-dot ${workflow.status}"></span>
        <span>${escHtml(workflowStatusLabel(workflow.status))}</span>
        <span class="wf-list-progress"><span style="width:${progress}%"></span></span>
        <span>${done}/${total}</span>
      </span>
    </button>`;
  }).join('');
  list.querySelectorAll('.wf-list-item').forEach((item) => {
    item.addEventListener('click', () => openWorkflow(item.dataset.workflowId));
  });
};

const openWorkflow = async (id) => {
  if (currentMode !== 'workflows') setMode('workflows');
  try {
    const res = await fetch(`/workflows/${id}`);
    if (!res.ok) throw new Error(await res.text());
    currentWorkflowDetail = await res.json();
    selectedWorkflowNodeId = null;
    selectedWorkflowNodeDetail = null;
    renderWorkflowList();
    renderCurrentWorkflow();
  } catch (err) {
    console.error('Erro ao abrir workflow:', err);
    toast('Falha ao abrir workflow');
  }
};

const refreshCurrentWorkflow = async () => {
  if (!currentWorkflowDetail) return;
  const workflowId = currentWorkflowDetail.workflow.id;
  try {
    const res = await fetch(`/workflows/${workflowId}`);
    if (!res.ok) throw new Error(await res.text());
    currentWorkflowDetail = await res.json();
    const currentNodeStillExists = currentWorkflowDetail.nodes.some(
      (node) => node.id === selectedWorkflowNodeId,
    );
    if (!currentNodeStillExists) {
      selectedWorkflowNodeId = null;
      selectedWorkflowNodeDetail = null;
    }
    renderCurrentWorkflow();
    await loadWorkflows();
    if (selectedWorkflowNodeId) {
      await loadSelectedWorkflowNodeDetail(selectedWorkflowNodeId);
    }
  } catch (err) {
    console.error('Erro ao atualizar workflow:', err);
  }
};

const clearCurrentWorkflow = () => {
  currentWorkflowDetail = null;
  selectedWorkflowNodeId = null;
  selectedWorkflowNodeDetail = null;
  $('wf-empty')?.style.removeProperty('display');
  $('wf-active')?.classList.remove('visible');
  renderWorkflowList();
};

const renderCurrentWorkflow = () => {
  if (!currentWorkflowDetail) {
    clearCurrentWorkflow();
    return;
  }
  const { workflow, nodes, canComplete } = currentWorkflowDetail;
  $('wf-empty').style.display = 'none';
  $('wf-active').classList.add('visible');
  $('wf-toolbar-title').textContent = workflow.title;
  $('wf-toolbar-meta').innerHTML = `
    <span class="wf-status-dot ${workflow.status}"></span>
    <span>${escHtml(workflowStatusLabel(workflow.status))}</span>
    <span>${nodes.length} ${nodes.length === 1 ? 'nó' : 'nós'}</span>
    <span>${workflow.conflictPolicy === 'block' ? 'conflitos bloqueiam' : 'conflitos avisam'}</span>`;
  $('wf-start-btn').disabled =
    workflow.status === 'running' || workflow.status === 'reviewing' ||
    workflow.status === 'done';
  $('wf-complete-btn').disabled = !canComplete || workflow.status === 'done';
  renderWorkflowAgents();
  renderWorkflowTimeline();
  renderWorkflowInspector();
  hydrateIcons($('wf-active'));
};

const renderWorkflowAgents = () => {
  const strip = $('wf-agent-strip');
  const detail = currentWorkflowDetail;
  if (!detail) return;
  const workflowId = detail.workflow.id;
  const workflowAgentIds = new Set();
  if (detail.workflow.orchestrationSessionId) {
    workflowAgentIds.add(detail.workflow.orchestrationSessionId);
  }
  detail.nodes.forEach((node) => {
    if (node.claimedBySessionId) workflowAgentIds.add(node.claimedBySessionId);
  });
  detail.runs.forEach((run) => workflowAgentIds.add(run.agentSessionId));
  const agents = (currentWorkflowDetail?.agents || [])
    .filter((agent) => agent.presence !== 'offline')
    .filter((agent) =>
      agent.currentWorkflowId === workflowId || workflowAgentIds.has(agent.id)
    )
    .sort((a, b) => {
      const aOwn = a.currentWorkflowId === workflowId ? 0 : 1;
      const bOwn = b.currentWorkflowId === workflowId ? 0 : 1;
      return aOwn - bOwn;
    });
  strip.innerHTML = agents.map((agent) => `
    <div class="wf-agent" title="${escHtml(agent.tool)} · ${escHtml(agent.provider)} · ${escHtml(agent.model)}">
      <span class="wf-agent-avatar">${ICON(agent.role === 'orchestrator' ? 'workflow' : 'bot')}</span>
      <span class="wf-agent-info">
        <span class="wf-agent-name">${escHtml(agent.name)}</span>
        <span class="wf-agent-model">${escHtml(agent.provider)} · ${escHtml(agent.model)}</span>
      </span>
      <span class="wf-agent-presence ${agent.presence}" title="${escHtml(agent.presence)}"></span>
    </div>
  `).join('');
};

const workflowNodeRelations = (nodes, edges) => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const dependencyMap = new Map(nodes.map((node) => [node.id, []]));
  const blockingMap = new Map(nodes.map((node) => [node.id, []]));
  edges.filter((edge) => edge.kind === 'blocks').forEach((edge) => {
    const from = nodeById.get(edge.fromNodeId);
    const to = nodeById.get(edge.toNodeId);
    if (!from || !to) return;
    dependencyMap.get(to.id)?.push(from);
    blockingMap.get(from.id)?.push(to);
  });
  return { dependencyMap, blockingMap };
};

const sortWorkflowNodes = (nodes) =>
  [...nodes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const renderWorkflowTimeline = () => {
  const { nodes, edges, agents } = currentWorkflowDetail;
  const empty = $('wf-timeline-empty');
  const list = $('wf-timeline-list');
  empty.classList.toggle('visible', nodes.length === 0);
  if (!nodes.length) {
    list.innerHTML = '';
    return;
  }
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const { dependencyMap, blockingMap } = workflowNodeRelations(nodes, edges);
  list.innerHTML = `<div class="wf-board">
    ${WF_BOARD_COLUMNS.map((status) => {
      const columnNodes = sortWorkflowNodes(
        nodes.filter((node) => node.status === status),
      );
      return `<section class="wf-board-column" data-status="${status}">
        <div class="wf-board-column-head">
          <span>${escHtml(workflowNodeStatusLabel(status))}</span>
          <span>${columnNodes.length}</span>
        </div>
        <div class="wf-board-column-body">
          ${columnNodes.length
            ? columnNodes.map((node) =>
              renderWorkflowTimelineNode(
                node,
                agentById,
                dependencyMap.get(node.id) || [],
                blockingMap.get(node.id) || [],
              )
            ).join('')
            : '<div class="wf-board-empty">Sem cards</div>'}
        </div>
      </section>`;
    }).join('')}
  </div>`;
  bindWorkflowNodes();
};

const renderWorkflowTimelineNode = (node, agentById, dependencies, blocking) => {
  const agent = node.claimedBySessionId
    ? agentById.get(node.claimedBySessionId)
    : null;
  const recommended = node.recommendedAgent || {};
  const agentName = agent?.name || recommended.tool || recommended.provider || '';
  const agentModel = agent
    ? `${agent.provider} · ${agent.model}`
    : [recommended.provider, recommended.model].filter(Boolean).join(' · ');
  const selected = node.id === selectedWorkflowNodeId;
  const canHumanReturn = ['ready', 'needs_rework'].includes(node.status);
  const dependencyText = dependencies.map((item) => item.title).join(', ');
  return `<article class="wf-node${selected ? ' selected' : ''}"
    data-node-id="${node.id}" data-status="${node.status}">
    <div class="wf-node-head">
      <span class="wf-node-state">
        <span class="wf-status-dot ${node.status}"></span>
        <span>${escHtml(workflowNodeStatusLabel(node.status))}</span>
      </span>
      <span class="wf-node-complexity">${node.complexity.toUpperCase()}</span>
      ${canHumanReturn
        ? `<button class="wf-node-copy wf-node-human" data-human-return-node="${node.id}" title="Registrar feito por mim">${ICON('check')}</button>`
        : ''}
      <button class="wf-node-copy" data-copy-node="${node.id}" title="Copiar prompt">${ICON('copy')}</button>
    </div>
    <div class="wf-node-title">${escHtml(node.title)}</div>
    <div class="wf-node-description">${escHtml(node.description || '')}</div>
    <div class="wf-node-meta">
      <span class="wf-node-kind">${escHtml(node.kind)}</span>
      <span>${node.attemptCount}/${node.maxAttempts} tent.</span>
      <span>${dependencies.length} dep.</span>
      <span>libera ${blocking.length}</span>
    </div>
    ${dependencyText
      ? `<div class="wf-node-dependencies" title="${escHtml(dependencyText)}">
          Depende de ${escHtml(dependencyText)}
        </div>`
      : ''}
    <div class="wf-node-agent">
      ${agentName
        ? `<span class="wf-node-agent-avatar">${ICON(agent ? 'bot' : 'sparkles')}</span>
           <span class="wf-node-agent-text">
             <div class="wf-node-agent-name">${escHtml(agentName)}</div>
             <div class="wf-node-agent-model">${escHtml(agentModel || 'modelo não definido')}</div>
           </span>`
        : '<span class="wf-node-unassigned">Sem agente recomendado ou conectado</span>'}
    </div>
  </article>`;
};

const bindWorkflowNodes = () => {
  $('wf-timeline-list').querySelectorAll('.wf-node').forEach((element) => {
    element.addEventListener('click', (event) => {
      if (workflowBoardSuppressClick) return;
      if (event.target.closest('button')) return;
      event.stopPropagation();
      selectWorkflowNode(element.dataset.nodeId);
    });
  });
  $('wf-timeline-list').querySelectorAll('[data-copy-node]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      copyWorkflowNodePrompt(button.dataset.copyNode);
    });
  });
  $('wf-timeline-list').querySelectorAll('[data-human-return-node]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openWorkflowHumanReturn(button.dataset.humanReturnNode);
    });
  });
};

const selectWorkflowNode = async (nodeId) => {
  selectedWorkflowNodeId = nodeId;
  selectedWorkflowNodeDetail = null;
  renderWorkflowTimeline();
  renderWorkflowInspector();
  await loadSelectedWorkflowNodeDetail(nodeId);
};

const loadSelectedWorkflowNodeDetail = async (nodeId) => {
  try {
    const res = await fetch(`/workflows/nodes/${nodeId}`);
    if (!res.ok) return;
    const detail = await res.json();
    if (selectedWorkflowNodeId !== nodeId) return;
    selectedWorkflowNodeDetail = detail;
    renderWorkflowInspector();
  } catch (err) {
    console.error('Erro ao carregar nó:', err);
  }
};

const workflowChips = (items) => {
  if (!items?.length) return '<span class="wf-inspector-text">Nenhum</span>';
  return `<div class="wf-chip-row">${items.map((item) =>
    `<span class="wf-chip" title="${escHtml(item)}">${escHtml(item)}</span>`
  ).join('')}</div>`;
};

const closeWorkflowInspector = () => {
  selectedWorkflowNodeId = null;
  selectedWorkflowNodeDetail = null;
  if (currentWorkflowDetail) renderWorkflowTimeline();
  renderWorkflowInspector();
};

const renderWorkflowInspector = () => {
  const content = $('wf-inspector-content');
  const empty = $('wf-inspector-empty');
  const inspector = $('wf-inspector');
  if (!currentWorkflowDetail) {
    inspector.classList.remove('visible');
    content.classList.remove('visible');
    content.innerHTML = '';
    return;
  }
  if (!selectedWorkflowNodeId) {
    inspector.classList.remove('visible');
    content.classList.remove('visible');
    content.innerHTML = '';
    return;
  }
  const node = currentWorkflowDetail.nodes.find(
    (item) => item.id === selectedWorkflowNodeId,
  );
  if (!node) return;
  inspector.classList.add('visible');
  empty.style.display = 'none';
  content.classList.add('visible');
  const detail = selectedWorkflowNodeDetail;
  const agent = detail?.agent || currentWorkflowDetail.agents.find(
    (item) => item.id === node.claimedBySessionId,
  );
  const runs = detail?.runs ||
    currentWorkflowDetail.runs.filter((run) => run.nodeId === node.id);
  const questions = detail?.questions ||
    currentWorkflowDetail.questions.filter((question) => question.nodeId === node.id);
  const dependencies = detail?.dependencies || [];
  const conflicts = detail?.conflicts || [];
  const recommendation = node.recommendedAgent || {};
  const isActive = ['claimed', 'in_progress', 'waiting_input'].includes(node.status);
  const isReturned = node.status === 'returned';
  const canHumanReturn = ['ready', 'needs_rework'].includes(node.status);

  content.innerHTML = `
    <div class="wf-inspector-head">
      <button class="wf-inspector-close" onclick="closeWorkflowInspector()" title="Fechar">
        ${ICON('x')}
      </button>
      <div class="wf-inspector-kicker">
        <span class="wf-status-dot ${node.status}"></span>
        <span>${escHtml(workflowNodeStatusLabel(node.status))}</span>
        <span>${node.complexity.toUpperCase()}</span>
      </div>
      <div class="wf-inspector-title">${escHtml(node.title)}</div>
      <div class="wf-inspector-sub">${escHtml(node.kind)} · tentativa ${node.attemptCount}/${node.maxAttempts}</div>
    </div>
    <div class="wf-inspector-actions">
      <button class="wf-action-btn" onclick="copyWorkflowNodePrompt('${node.id}')">
        ${ICON('copy')} Prompt
      </button>
      ${canHumanReturn
        ? `<button class="wf-action-btn approve" onclick="focusWorkflowHumanReturn()">
             ${ICON('check')} Fiz, revisar
           </button>`
        : ''}
      ${isActive
        ? `<button class="wf-action-btn rework" onclick="releaseSelectedWorkflowNode()">
             ${ICON('rotate-ccw')} Liberar
           </button>`
        : ''}
      ${isReturned
        ? `<button class="wf-action-btn approve" onclick="reviewSelectedWorkflowNode('approve')">
             ${ICON('check')} Aprovar
           </button>
           <button class="wf-action-btn rework" onclick="reviewSelectedWorkflowNode('rework')">
             ${ICON('rotate-ccw')} Retrabalho
           </button>
           <button class="wf-action-btn danger" onclick="reviewSelectedWorkflowNode('human_intervention')">
             ${ICON('alert-triangle')} Humano
           </button>`
        : ''}
      ${!isActive
        ? `<button class="wf-action-btn danger" onclick="deleteSelectedWorkflowNode()">
             ${ICON('trash')} Excluir
           </button>`
        : ''}
    </div>
    ${isReturned
      ? `<div class="wf-inspector-section">
           <div class="wf-inspector-label">Feedback da revisão</div>
           <textarea id="wf-review-feedback" class="wf-inspector-textarea"
             placeholder="Motivo da decisão ou instruções de retrabalho"></textarea>
         </div>`
      : ''}
    ${canHumanReturn
      ? `<div class="wf-inspector-section wf-human-return-panel">
           <div class="wf-inspector-label">Retorno humano</div>
           <textarea id="wf-human-return-summary" class="wf-inspector-textarea"
             placeholder="Resumo do que foi feito"></textarea>
           <input id="wf-human-return-files" class="wf-inspector-input"
             placeholder="Arquivos alterados, separados por vírgula" />
           <button class="wf-action-btn approve" onclick="humanReturnSelectedWorkflowNode()">
             ${ICON('check')} Enviar para revisão
           </button>
         </div>`
      : ''}
    <div class="wf-inspector-section">
      <div class="wf-inspector-label">Descrição</div>
      <div class="wf-inspector-text">${escHtml(node.description)}</div>
    </div>
    <div class="wf-inspector-section">
      <div class="wf-inspector-label">Critérios de aceite</div>
      <ol class="wf-criteria">${node.acceptanceCriteria.map((item) =>
        `<li>${escHtml(item)}</li>`
      ).join('')}</ol>
    </div>
    <div class="wf-inspector-section">
      <div class="wf-inspector-label">Agente</div>
      <div class="wf-inspector-text">
        ${agent
          ? `<strong>${escHtml(agent.name)}</strong><br>${escHtml(agent.tool)} · ${escHtml(agent.provider)} · ${escHtml(agent.model)}`
          : [recommendation.tool, recommendation.provider, recommendation.model].filter(Boolean).length
          ? `Recomendado: ${escHtml([recommendation.tool, recommendation.provider, recommendation.model].filter(Boolean).join(' · '))}`
          : 'Sem recomendação'}
      </div>
    </div>
    <div class="wf-inspector-section">
      <div class="wf-inspector-label">Capacidades</div>
      ${workflowChips(node.requiredCapabilities)}
    </div>
    <div class="wf-inspector-section">
      <div class="wf-inspector-label">Escrita · ${escHtml(node.isolation)}</div>
      ${workflowChips(node.writeScopes)}
    </div>
    ${conflicts.length
      ? `<div class="wf-inspector-section">
           <div class="wf-inspector-label">Conflitos ativos</div>
           ${conflicts.map((item) =>
             `<div class="wf-conflict">${escHtml(item.title)}<br>${escHtml(item.writeScopes.join(', '))}</div>`
           ).join('')}
         </div>`
      : ''}
    <div class="wf-inspector-section">
      <div class="wf-inspector-label">Dependências concluídas</div>
      ${dependencies.length
        ? dependencies.map((item) =>
          `<div class="wf-run">
             <div class="wf-run-head"><span>${escHtml(item.title)}</span><span>${item.changedFiles.length} arquivos</span></div>
             <div class="wf-run-summary">${escHtml(item.summary || 'Sem resumo')}</div>
           </div>`
        ).join('')
        : '<div class="wf-inspector-text">Nenhuma</div>'}
    </div>
    ${node.contextRefs?.length
      ? `<div class="wf-inspector-section">
           <div class="wf-inspector-label">Contexto</div>
           ${node.contextRefs.map((item) =>
             `<div class="wf-run">
               <div class="wf-run-head"><span>${escHtml(item.label || item.ref)}</span><span>${escHtml(item.kind)}</span></div>
               ${item.excerpt ? `<div class="wf-run-summary">${escHtml(item.excerpt)}</div>` : ''}
             </div>`
           ).join('')}
         </div>`
      : ''}
    ${questions.length
      ? `<div class="wf-inspector-section">
           <div class="wf-inspector-label">Perguntas</div>
           ${questions.map((question) => `
             <div class="wf-question">
               <div class="wf-inspector-text">${escHtml(question.question)}</div>
               ${question.status === 'open'
                 ? `<textarea id="wf-question-answer-${question.id}" placeholder="Resposta do orquestrador"></textarea>
                    <button class="wf-action-btn approve" style="margin-top:6px"
                      onclick="answerSelectedWorkflowQuestion('${question.id}')">${ICON('message-square')} Responder</button>`
                 : `<div class="wf-run-summary">Resposta: ${escHtml(question.answer || '')}</div>`}
             </div>`
           ).join('')}
         </div>`
      : ''}
    <div class="wf-inspector-section">
      <div class="wf-inspector-label">Execuções</div>
      ${runs.length
        ? [...runs].reverse().map((run) => `
          <div class="wf-run">
            <div class="wf-run-head">
              <span>Tentativa ${run.attempt}</span>
              <span>${escHtml(run.status)}</span>
            </div>
            <div class="wf-run-summary">${escHtml(run.output?.summary || 'Sem retorno')}</div>
            ${run.output
              ? `<details>
                   <summary>Ver evidências</summary>
                   <pre>${escHtml([
                     run.output.result || '',
                     run.output.changedFiles?.length
                       ? `Arquivos alterados:\n${run.output.changedFiles.join('\n')}`
                       : '',
                     run.output.diff ? `Diff:\n${run.output.diff}` : '',
                     ...(run.output.logs || []),
                     ...(run.output.tests || []).map((test) =>
                       `${test.status}: ${test.command}${test.output ? `\n${test.output}` : ''}`
                     ),
                     ...(run.output.artifacts || []).map((artifact) =>
                       `artifact: ${artifact.kind} · ${artifact.label}${artifact.ref ? ` · ${artifact.ref}` : ''}`
                     ),
                   ].filter(Boolean).join('\n\n'))}</pre>
                 </details>`
              : ''}
          </div>`
        ).join('')
        : '<div class="wf-inspector-text">Nenhuma execução</div>'}
    </div>`;
  hydrateIcons(content);
};

const bindWorkflowInspectorModal = () => {
  const inspector = $('wf-inspector');
  if (!inspector || inspector.dataset.bound) return;
  inspector.dataset.bound = '1';
  inspector.addEventListener('click', (event) => {
    if (event.target === inspector) closeWorkflowInspector();
  });
};

const copyWorkflowPrompt = async (role) => {
  if (!currentWorkflowDetail) return;
  try {
    const res = await fetch(
      `/workflows/${currentWorkflowDetail.workflow.id}/prompt?role=${role}`,
    );
    const text = await res.text();
    copyToClipboard(
      text,
      role === 'orchestrator'
        ? 'Prompt do orquestrador copiado'
        : 'Prompt de executor copiado',
    );
  } catch {
    toast('Falha ao copiar prompt');
  }
};

const copyWorkflowNodePrompt = async (nodeId = selectedWorkflowNodeId) => {
  if (!nodeId) return;
  try {
    const res = await fetch(`/workflows/nodes/${nodeId}/prompt`);
    const text = await res.text();
    copyToClipboard(text, 'Prompt do nó copiado');
  } catch {
    toast('Falha ao copiar prompt');
  }
};

const focusWorkflowHumanReturn = () => {
  const field = $('wf-human-return-summary');
  if (!field) return;
  field.focus();
  field.scrollIntoView({ block: 'nearest' });
};

const openWorkflowHumanReturn = async (nodeId) => {
  if (!nodeId) return;
  if (selectedWorkflowNodeId !== nodeId) {
    await selectWorkflowNode(nodeId);
  }
  setTimeout(focusWorkflowHumanReturn, 80);
};

const humanReturnSelectedWorkflowNode = async () => {
  if (!selectedWorkflowNodeId) return;
  const summary = $('wf-human-return-summary')?.value.trim() || '';
  if (!summary) {
    toast('Descreva o que foi feito');
    focusWorkflowHumanReturn();
    return;
  }
  const changedFiles = workflowCsv($('wf-human-return-files')?.value || '');
  try {
    const res = await fetch(
      `/workflows/nodes/${selectedWorkflowNodeId}/human-return`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: 'success',
          summary,
          result: summary,
          logs: ['Retorno manual registrado na UI do Docmap'],
          changedFiles,
          tests: [],
          artifacts: [],
        }),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    toast('Enviado para revisão');
    await refreshCurrentWorkflow();
  } catch (err) {
    toast(err.message || 'Falha ao enviar para revisão');
  }
};

const startCurrentWorkflow = async () => {
  if (!currentWorkflowDetail) return;
  try {
    const res = await fetch(
      `/workflows/${currentWorkflowDetail.workflow.id}/start`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      },
    );
    if (!res.ok) throw new Error(await res.text());
    toast('Workflow iniciado');
    await refreshCurrentWorkflow();
  } catch (err) {
    toast(err.message || 'Falha ao iniciar');
  }
};

const completeCurrentWorkflow = async () => {
  if (!currentWorkflowDetail?.canComplete) return;
  const ok = await confirmDialog(
    'Concluir este workflow? O orquestrador ainda poderá consultar todo o histórico.',
    { okLabel: 'Concluir' },
  );
  if (!ok) return;
  const workflow = currentWorkflowDetail.workflow;
  try {
    const res = await fetch(`/workflows/${workflow.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `Objetivo concluído: ${workflow.objective}`,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    toast('Workflow concluído');
    await refreshCurrentWorkflow();
  } catch (err) {
    toast(err.message || 'Falha ao concluir');
  }
};

const deleteCurrentWorkflow = async () => {
  if (!currentWorkflowDetail) return;
  const workflow = currentWorkflowDetail.workflow;
  const ok = await confirmDialog(
    `Excluir o workflow "${workflow.title}" e todo o histórico?`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;
  const res = await fetch(`/workflows/${workflow.id}`, { method: 'DELETE' });
  if (!res.ok) {
    toast('Falha ao excluir workflow');
    return;
  }
  clearCurrentWorkflow();
  await loadWorkflows();
  toast('Workflow excluído');
};

const reviewSelectedWorkflowNode = async (decision) => {
  if (!selectedWorkflowNodeId) return;
  const feedback = $('wf-review-feedback')?.value.trim() || '';
  if (decision === 'rework' && !feedback) {
    toast('Descreva o retrabalho no campo de feedback');
    return;
  }
  try {
    const res = await fetch(
      `/workflows/nodes/${selectedWorkflowNodeId}/decision`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, feedback }),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    toast(decision === 'approve' ? 'Nó aprovado' : 'Decisão registrada');
    await refreshCurrentWorkflow();
  } catch (err) {
    toast(err.message || 'Falha ao revisar');
  }
};

const releaseSelectedWorkflowNode = async () => {
  if (!selectedWorkflowNodeId) return;
  const ok = await confirmDialog(
    'Liberar esta execução? A tentativa atual será marcada como abandonada.',
    { okLabel: 'Liberar' },
  );
  if (!ok) return;
  const res = await fetch(
    `/workflows/nodes/${selectedWorkflowNodeId}/release`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    },
  );
  if (!res.ok) {
    toast(await res.text());
    return;
  }
  await refreshCurrentWorkflow();
  toast('Execução liberada');
};

const deleteSelectedWorkflowNode = async () => {
  if (!selectedWorkflowNodeId) return;
  const node = currentWorkflowDetail.nodes.find(
    (item) => item.id === selectedWorkflowNodeId,
  );
  const ok = await confirmDialog(
    `Excluir o nó "${node?.title || ''}"?`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;
  const res = await fetch(`/workflows/nodes/${selectedWorkflowNodeId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    toast(await res.text());
    return;
  }
  selectedWorkflowNodeId = null;
  selectedWorkflowNodeDetail = null;
  await refreshCurrentWorkflow();
  toast('Nó excluído');
};

const answerSelectedWorkflowQuestion = async (questionId) => {
  const answer = $(`wf-question-answer-${questionId}`)?.value.trim();
  if (!answer) {
    toast('Escreva uma resposta');
    return;
  }
  const res = await fetch(`/workflows/questions/${questionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) {
    toast(await res.text());
    return;
  }
  toast('Resposta registrada');
  await refreshCurrentWorkflow();
};

const openWorkflowModal = () => {
  $('wf-modal-form').reset();
  $('wf-modal-attempts').value = '3';
  $('wf-modal-overlay').classList.add('visible');
  $('wf-modal-title').focus();
};

const closeWorkflowModal = (event) => {
  if (event && event.target !== $('wf-modal-overlay')) return;
  $('wf-modal-overlay').classList.remove('visible');
};

const createWorkflowFromModal = async (event) => {
  event.preventDefault();
  const body = {
    title: $('wf-modal-title').value.trim(),
    objective: $('wf-modal-objective').value.trim(),
    description: $('wf-modal-description').value.trim(),
    conflictPolicy: $('wf-modal-conflict').value,
    defaultMaxAttempts: Number($('wf-modal-attempts').value || 3),
    tags: workflowCsv($('wf-modal-tags').value),
  };
  try {
    const res = await fetch('/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const workflow = await res.json();
    closeWorkflowModal();
    await loadWorkflows();
    await openWorkflow(workflow.id);
    toast('Workflow criado');
  } catch (err) {
    toast(err.message || 'Falha ao criar workflow');
  }
};

const openNodeModal = () => {
  if (!currentWorkflowDetail) return;
  $('wf-node-modal-form').reset();
  $('wf-node-kind').value = 'code';
  $('wf-node-complexity').value = 'm';
  $('wf-node-isolation').value = 'shared';
  $('wf-node-dependencies').innerHTML =
    currentWorkflowDetail.nodes.map((node) =>
      `<option value="${node.id}">${escHtml(node.title)} · ${escHtml(workflowNodeStatusLabel(node.status))}</option>`
    ).join('');
  $('wf-node-modal-overlay').classList.add('visible');
  $('wf-node-title').focus();
};

const closeNodeModal = (event) => {
  if (event && event.target !== $('wf-node-modal-overlay')) return;
  $('wf-node-modal-overlay').classList.remove('visible');
};

const createNodeFromModal = async (event) => {
  event.preventDefault();
  if (!currentWorkflowDetail) return;
  const dependencySelect = $('wf-node-dependencies');
  const dependsOn = [...dependencySelect.selectedOptions].map((option) => option.value);
  const recommendation = {
    tool: $('wf-node-tool').value.trim(),
    provider: $('wf-node-provider').value.trim(),
    model: $('wf-node-model').value.trim(),
  };
  Object.keys(recommendation).forEach((key) => {
    if (!recommendation[key]) delete recommendation[key];
  });
  const body = {
    title: $('wf-node-title').value.trim(),
    description: $('wf-node-description').value.trim(),
    acceptanceCriteria: workflowLines($('wf-node-criteria').value),
    complexity: $('wf-node-complexity').value,
    kind: $('wf-node-kind').value.trim() || 'general',
    isolation: $('wf-node-isolation').value,
    requiredCapabilities: workflowCsv($('wf-node-capabilities').value),
    readScopes: workflowCsv($('wf-node-read-scopes').value),
    writeScopes: workflowCsv($('wf-node-write-scopes').value),
    dependsOn,
    ...(Object.keys(recommendation).length
      ? { recommendedAgent: recommendation }
      : {}),
  };
  try {
    const res = await fetch(
      `/workflows/${currentWorkflowDetail.workflow.id}/nodes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    const node = await res.json();
    closeNodeModal();
    await refreshCurrentWorkflow();
    await selectWorkflowNode(node.id);
    toast('Nó criado');
  } catch (err) {
    toast(err.message || 'Falha ao criar nó');
  }
};

const ensureWorkflowEvents = () => {
  if (workflowEvents) return;
  workflowEvents = new EventSource('/workflows/events');
  const eventNames = [
    'workflow.created',
    'workflow.updated',
    'workflow.started',
    'workflow.completed',
    'workflow.deleted',
    'workflow.orchestrator_claimed',
    'workflow.orchestrator_released',
    'node.created',
    'node.updated',
    'node.deleted',
    'node.pending',
    'node.ready',
    'node.claimed',
    'node.started',
    'node.returned',
    'node.done',
    'node.needs_rework',
    'node.human_intervention',
    'node.cancelled',
    'node.released',
    'edge.created',
    'edge.deleted',
    'question.opened',
    'question.answered',
    'agent.connected',
    'agent.heartbeat',
    'agent.disconnected',
  ];
  eventNames.forEach((name) => {
    workflowEvents.addEventListener(name, () => scheduleWorkflowRefresh());
  });
  workflowEvents.onerror = () => {
    // EventSource reconecta sozinho.
  };
};

const scheduleWorkflowRefresh = () => {
  clearTimeout(workflowRefreshTimer);
  workflowRefreshTimer = setTimeout(async () => {
    if (currentMode !== 'workflows') return;
    if (currentWorkflowDetail) await refreshCurrentWorkflow();
    else await loadWorkflows();
  }, 180);
};

const bindWorkflowTimeline = () => {
  const timeline = $('wf-timeline');
  if (!timeline || timeline.dataset.bound) return;
  timeline.dataset.bound = '1';
  let dragState = null;

  const isInteractiveTarget = (target) =>
    target.closest('button, input, textarea, select, a, details, summary');

  timeline.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || isInteractiveTarget(event.target)) return;
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: timeline.scrollLeft,
      dragging: false,
    };
  });

  timeline.addEventListener('pointermove', (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (
      !dragState.dragging &&
      (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy))
    ) return;
    dragState.dragging = true;
    workflowBoardSuppressClick = true;
    timeline.classList.add('dragging');
    if (!timeline.hasPointerCapture(event.pointerId)) {
      timeline.setPointerCapture(event.pointerId);
    }
    timeline.scrollLeft = dragState.scrollLeft - dx;
    event.preventDefault();
  });

  const finishDrag = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const dragged = dragState.dragging;
    dragState = null;
    timeline.classList.remove('dragging');
    if (timeline.hasPointerCapture(event.pointerId)) {
      timeline.releasePointerCapture(event.pointerId);
    }
    if (dragged) {
      setTimeout(() => {
        workflowBoardSuppressClick = false;
      }, 120);
    }
  };

  timeline.addEventListener('pointerup', finishDrag);
  timeline.addEventListener('pointercancel', finishDrag);
  timeline.addEventListener('pointerleave', (event) => {
    if (dragState?.dragging) finishDrag(event);
  });

  timeline.addEventListener('click', (event) => {
    if (workflowBoardSuppressClick) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button')) return;
    const node = target?.closest('.wf-node');
    if (node) {
      selectWorkflowNode(node.dataset.nodeId);
      return;
    }
    if (!selectedWorkflowNodeId) return;
    selectedWorkflowNodeId = null;
    selectedWorkflowNodeDetail = null;
    renderWorkflowTimeline();
    renderWorkflowInspector();
  });
};

document.addEventListener('DOMContentLoaded', () => {
  $('wf-search')?.addEventListener('input', debounce(renderWorkflowList, 120));
  bindWorkflowTimeline();
  bindWorkflowInspectorModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  closeWorkflowInspector();
  closeWorkflowModal();
  closeNodeModal();
});
