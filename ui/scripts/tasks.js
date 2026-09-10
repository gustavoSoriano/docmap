// ════ Kanban — tasks globais ════

let allTasks      = [];
let allProjects   = [];
let taskNotesList = [];  // cache da lista de notas p/ o seletor (nome distinto de allNotes em notes.js)
let currentTaskId = null;

// ── Estado local da modal ──
let taskDescMode   = 'preview'; // 'preview' (padrão) | 'edit'
let draftChecklist = [];        // [{ id, text, done }] — editado na modal, salvo no Save
let taskSnapshot   = null;      // snapshot p/ detectar alterações (guarda contra perda)

// ── Drag state ──
let draggedId     = null;
let dropTargetId  = null;
let dropPosition  = 'after'; // 'before' | 'after'

// ══════════════════════════════════════════
// Carregamento
// ══════════════════════════════════════════

const loadTasks = async () => {
  try {
    const res = await fetch('/tasks');
    allTasks = await res.json();
    renderBoard();
  } catch (err) {
    console.error('Erro ao carregar tasks:', err);
  }
};

const loadProjects = async () => {
  try {
    const res = await fetch('/projects');
    allProjects = await res.json();
    populateProjectSelects();
  } catch (err) {
    console.error('Erro ao carregar projetos:', err);
  }
};

const populateProjectSelects = () => {
  const options = allProjects.map((p) =>
    `<option value="${p.id}">${escHtml(p.name ?? '')}</option>`
  ).join('');

  // Toolbar select — preserva opção "Todos"
  const toolbarSelect = $('kanban-project-select');
  if (toolbarSelect) {
    const currentVal = toolbarSelect.value;
    toolbarSelect.innerHTML = '<option value="">Sem projeto</option>' + options;
    toolbarSelect.value = currentVal;
    updateProjectDeleteBtn();
  }

  // Task modal select — preserva opção "Nenhum"
  const taskSelect = $('task-project-select');
  if (taskSelect) {
    const currentVal = taskSelect.value;
    taskSelect.innerHTML = '<option value="">Nenhum</option>' + options;
    taskSelect.value = currentVal;
  }
};

const loadNotesForSelect = async () => {
  if (taskNotesList.length) return;
  try {
    const res = await fetch('/notes');
    taskNotesList = await res.json();
  } catch { /* silencioso */ }
};

// ── Combobox de nota ──

const positionNoteDropdown = () => {
  const wrap = $('task-note-wrap');
  const dd   = $('task-note-dropdown');
  if (!wrap || !dd) return;
  const rect = wrap.getBoundingClientRect();
  dd.style.top   = `${rect.bottom + 3}px`;
  dd.style.left  = `${rect.left}px`;
  dd.style.width = `${rect.width}px`;
};

const filterNoteSearch = () => {
  const q   = $('task-note-input').value.trim().toLowerCase();
  const dd  = $('task-note-dropdown');

  // Se já foi selecionada e o usuário não editou o texto, não reabre
  if ($('task-note-input').dataset.resolved === 'true') {
    $('task-note-input').dataset.resolved = '';
    return;
  }

  const matches = q
    ? taskNotesList.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 12)
    : taskNotesList.slice(0, 12);

  if (!matches.length) {
    dd.innerHTML = `<div class="note-search-empty">Nenhuma nota encontrada</div>`;
  } else {
    dd.innerHTML = matches.map((n) =>
      `<div class="note-search-item" data-id="${n.id}" data-title="${escHtml(n.title)}">
        ${escHtml(n.title)}
      </div>`
    ).join('');
    dd.querySelectorAll('.note-search-item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault(); // evita blur no input antes do clique completar
        selectNoteLink(el.dataset.id, el.dataset.title);
      });
    });
  }

  positionNoteDropdown();
  dd.classList.add('open');
};

const selectNoteLink = (id, title) => {
  $('task-note-id').value         = id;
  $('task-note-input').value      = title;
  $('task-note-input').dataset.resolved = 'true';
  $('task-note-input').classList.add('has-link');
  $('task-note-clear').style.display = 'inline-flex';
  $('task-note-dropdown').classList.remove('open');
};

const clearNoteLink = () => {
  $('task-note-id').value               = '';
  $('task-note-input').value            = '';
  $('task-note-input').dataset.resolved = '';
  $('task-note-input').classList.remove('has-link');
  $('task-note-clear').style.display    = 'none';
  $('task-note-input').focus();
};

const closeNoteDropdown = (e) => {
  if (!$('task-note-wrap')?.contains(e.target) && !$('task-note-dropdown')?.contains(e.target)) {
    $('task-note-dropdown')?.classList.remove('open');
    // Se o usuário saiu sem selecionar e há uma nota vinculada, restaura o título
    const id = $('task-note-id')?.value;
    if (id) {
      const note = taskNotesList.find((n) => n.id === id);
      if (note) $('task-note-input').value = note.title;
    } else {
      if (!$('task-note-input')?.dataset.resolved) {
        $('task-note-input').value = '';
      }
    }
  }
};

// ══════════════════════════════════════════
// Renderização do board
// ══════════════════════════════════════════

const COLUMNS = [
  { status: 'todo',        label: 'A Fazer'      },
  { status: 'in-progress', label: 'Em Andamento' },
  { status: 'review',      label: 'Revisão'      },
  { status: 'done',        label: 'Concluído'    },
];

const renderBoard = () => {
  updateProjectDeleteBtn();
  const selectedProjectId = $('kanban-project-select')?.value ?? '';
  // "" = "Sem projeto" — filtra tasks sem vínculo
  const filteredTasks = selectedProjectId
    ? allTasks.filter((t) => t.projectId === selectedProjectId)
    : allTasks.filter((t) => !t.projectId);

  for (const col of COLUMNS) {
    const colTasks = filteredTasks
      .filter((t) => t.status === col.status)
      .sort((a, b) => a.order - b.order);

    $(`kanban-count-${col.status}`).textContent = String(colTasks.length);

    const container = $(`kanban-cards-${col.status}`);
    if (!colTasks.length) {
      container.innerHTML = `<div class="kanban-col-empty">Nenhuma task</div>`;
    } else {
      container.innerHTML = colTasks.map((t) => renderCard(t)).join('');
      hydrateIcons(container);
    }

    // Re-registra drag events nas cards
    container.querySelectorAll('.kanban-card').forEach(bindCardDrag);
  }
};

const formatDue = (dueDate, status) => {
  if (!dueDate) return '';
  const today   = new Date().toISOString().slice(0, 10);
  const due     = dueDate;
  const diff    = Math.ceil((new Date(due) - new Date(today)) / 86400000);
  let cls = 'kanban-card-due';
  let label;

  // Task concluída nunca aparece como atrasada — mostra a data em verde.
  if (status === 'done') {
    cls += ' is-done';
    label = `✓ ${due.split('-').reverse().join('/')}`;
  }
  else if (diff < 0)       { cls += ' overdue';   label = `Atrasada ${Math.abs(diff)}d`; }
  else if (diff === 0)     { cls += ' due-today'; label = 'Hoje'; }
  else if (diff === 1)     { label = 'Amanhã'; }
  else                     { label = due.split('-').reverse().join('/'); }

  return `<span class="${cls}">📅 ${escHtml(label)}</span>`;
};

const formatChecklistBadge = (task) => {
  const list = Array.isArray(task.checklist) ? task.checklist : [];
  if (!list.length) return '';
  const done = list.filter((i) => i.done).length;
  const cls = done === list.length ? 'kanban-card-checklist all-done' : 'kanban-card-checklist';
  return `<span class="${cls}">☑ ${done}/${list.length}</span>`;
};

const renderCard = (task) => {
  const due  = formatDue(task.dueDate, task.status);
  const note = task.noteId
    ? `<span class="kanban-card-note-link">nota</span>`
    : '';
  const checklist = formatChecklistBadge(task);
  const desc = task.description
    ? `<div class="kanban-card-desc">${escHtml(task.description.slice(0, 120))}</div>`
    : '';
  const tags = (task.tags || []).length
    ? `<div class="kanban-card-tags">${task.tags.map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('')}</div>`
    : '';
  const meta = (due || note || checklist)
    ? `<div class="kanban-card-meta">${due}${checklist}${note}</div>`
    : '';
  return `<div class="kanban-card"
    data-id="${task.id}"
    draggable="true"
    onclick="openTaskModal('${task.id}')">
    <div class="kanban-card-title">${escHtml(task.title)}</div>
    ${desc}
    ${meta}
    ${tags}
  </div>`;
};

// ══════════════════════════════════════════
// Drag & Drop
// ══════════════════════════════════════════

const bindCardDrag = (el) => {
  el.addEventListener('dragstart', (e) => {
    draggedId = el.dataset.id;
    setTimeout(() => el.classList.add('is-dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('is-dragging');
    clearDropIndicators();
    draggedId    = null;
    dropTargetId = null;
  });

  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (el.dataset.id === draggedId) return;
    const rect = el.getBoundingClientRect();
    const mid  = rect.top + rect.height / 2;
    clearDropIndicators();
    dropTargetId = el.dataset.id;
    if (e.clientY < mid) {
      dropPosition = 'before';
      el.classList.add('drop-before');
    } else {
      dropPosition = 'after';
      el.classList.add('drop-after');
    }
  });
};

const clearDropIndicators = () => {
  document.querySelectorAll('.kanban-card').forEach((c) => {
    c.classList.remove('drop-before', 'drop-after');
  });
  document.querySelectorAll('.kanban-col').forEach((c) => {
    c.classList.remove('drag-over-col');
  });
};

// Bind events nas colunas (drop zone)
const bindColumnDrop = (colEl) => {
  const status = colEl.dataset.status;

  colEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    colEl.classList.add('drag-over-col');
  });

  colEl.addEventListener('dragleave', (e) => {
    if (!colEl.contains(e.relatedTarget)) {
      colEl.classList.remove('drag-over-col');
    }
  });

  colEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    colEl.classList.remove('drag-over-col');
    if (!draggedId) return;
    await applyDrop(status);
  });
};

const applyDrop = async (targetStatus) => {
  const draggedTask = allTasks.find((t) => t.id === draggedId);
  if (!draggedTask) return;

  const sourceStatus = draggedTask.status;

  // IDs da coluna destino na ordem atual (sem a task arrastada)
  let destIds = allTasks
    .filter((t) => t.status === targetStatus && t.id !== draggedId)
    .sort((a, b) => a.order - b.order)
    .map((t) => t.id);

  // Insere na posição certa
  if (dropTargetId && destIds.includes(dropTargetId)) {
    const idx = destIds.indexOf(dropTargetId);
    if (dropPosition === 'before') destIds.splice(idx, 0, draggedId);
    else destIds.splice(idx + 1, 0, draggedId);
  } else {
    // Drop na área vazia da coluna → vai pro final
    destIds.push(draggedId);
  }

  const reorder = (status, ids) =>
    fetch('/tasks/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ids }),
    });

  if (sourceStatus === targetStatus) {
    await reorder(targetStatus, destIds);
  } else {
    const sourceIds = allTasks
      .filter((t) => t.status === sourceStatus && t.id !== draggedId)
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);
    await Promise.all([
      reorder(sourceStatus, sourceIds),
      reorder(targetStatus, destIds),
    ]);
  }

  dropTargetId = null;
  await loadTasks();
};

// ══════════════════════════════════════════
// Modal — criar / editar task
// ══════════════════════════════════════════

const openNewTask = async (status) => {
  currentTaskId = null;
  await loadNotesForSelect();
  populateNoteSelect(null);

  $('task-title-input').value  = '';
  $('task-status-select').value = status;
  $('task-desc-textarea').value = '';
  $('task-due-input').value     = '';
  $('task-tags-input').value    = '';
  // Herda projeto selecionado na toolbar do kanban
  $('task-project-select').value = $('kanban-project-select')?.value ?? '';
  $('task-delete-btn').style.display = 'none';

  draftChecklist = [];
  renderChecklist();
  setTaskDescMode('preview');
  updateDueHint();
  showTaskModal();
  taskSnapshot = captureTaskSnapshot();
  $('task-title-input').focus();
};

const openTaskModal = async (id) => {
  const task = allTasks.find((t) => t.id === id);
  if (!task) return;
  currentTaskId = id;

  await loadNotesForSelect();
  populateNoteSelect(task.noteId ?? null);

  $('task-title-input').value   = task.title;
  $('task-status-select').value = task.status;
  $('task-desc-textarea').value = task.description ?? '';
  $('task-due-input').value     = task.dueDate ?? '';
  $('task-tags-input').value    = (task.tags || []).join(', ');
  $('task-project-select').value = task.projectId ?? '';
  $('task-delete-btn').style.display = 'inline-flex';

  draftChecklist = Array.isArray(task.checklist)
    ? task.checklist.map((i) => ({ id: i.id, text: i.text, done: i.done === true }))
    : [];
  renderChecklist();
  // Preview é o padrão; edição só se necessário.
  setTaskDescMode('preview');
  updateDueHint();
  showTaskModal();
  taskSnapshot = captureTaskSnapshot();
  $('task-title-input').focus();
};

const populateNoteSelect = (selectedId) => {
  if (selectedId) {
    const note = taskNotesList.find((n) => n.id === selectedId);
    if (note) {
      selectNoteLink(selectedId, note.title);
      return;
    }
  }
  // Sem nota vinculada — limpa
  clearNoteLink();
};

const showTaskModal = () => {
  $('task-modal-overlay').classList.add('visible');
};

const closeTaskModal = () => {
  $('task-modal-overlay').classList.remove('visible');
  currentTaskId = null;
  taskSnapshot = null;
};

// Compat: a modal NÃO fecha mais ao clicar fora (só no X/Cancelar).
// Mantida para não quebrar referências antigas — agora é no-op.
const closeTaskModalOnOverlay = (_e) => {};

// Fecha pelo X/Cancelar com guarda contra perda de alterações.
const requestCloseTaskModal = async () => {
  if (isTaskDirty()) {
    const ok = await confirmDialog(
      'Fechar sem salvar? As alterações serão perdidas.',
      { okLabel: 'Fechar sem salvar' },
    );
    if (!ok) return;
  }
  closeTaskModal();
};

const captureTaskSnapshot = () => JSON.stringify({
  title:       $('task-title-input').value,
  description: $('task-desc-textarea').value,
  status:      $('task-status-select').value,
  dueDate:     $('task-due-input').value,
  tags:        $('task-tags-input').value,
  noteId:      $('task-note-id').value,
  projectId:   $('task-project-select').value,
  checklist:   draftChecklist,
});

const isTaskDirty = () => {
  if (!taskSnapshot) return false;
  try {
    return captureTaskSnapshot() !== taskSnapshot;
  } catch { return false; }
};

// ── Descrição: preview markdown (padrão) / edição ──

const renderTaskDescPreview = () => {
  const ta = $('task-desc-textarea');
  const pv = $('task-desc-preview');
  if (!ta || !pv) return;
  const raw = ta.value;
  pv.innerHTML = window.marked
    ? marked.parse(raw)
    : `<pre>${escHtml(raw)}</pre>`;
};

const setTaskDescMode = (mode) => {
  taskDescMode = mode === 'edit' ? 'edit' : 'preview';
  const ta = $('task-desc-textarea');
  const pv = $('task-desc-preview');
  if (!ta || !pv) return;
  if (taskDescMode === 'preview') {
    renderTaskDescPreview();
    ta.style.display = 'none';
    pv.classList.add('visible');
  } else {
    pv.classList.remove('visible');
    ta.style.display = '';
    ta.focus();
  }
  $('task-desc-tab-preview')?.classList.toggle('active', taskDescMode === 'preview');
  $('task-desc-tab-edit')?.classList.toggle('active', taskDescMode === 'edit');
};

const onTaskDescInput = () => {
  if (taskDescMode === 'preview') renderTaskDescPreview();
};

// ── Hint da data limite ──
// Concluída (done) nunca mostra "atrasada": exibe confirmação neutra.

const updateDueHint = () => {
  const hint = $('task-due-hint');
  if (!hint) return;
  const due    = $('task-due-input').value;
  const status = $('task-status-select').value;
  hint.className = '';

  if (!due) { hint.textContent = ''; return; }
  const pretty = due.split('-').reverse().join('/');

  if (status === 'done') {
    hint.textContent = `✓ Concluída • prazo ${pretty}`;
    hint.className = 'is-done';
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const diff  = Math.ceil((new Date(due) - new Date(today)) / 86400000);
  if (diff < 0) {
    hint.textContent = `⚠ Atrasada ${Math.abs(diff)}d`;
    hint.className = 'overdue';
  } else if (diff === 0) {
    hint.textContent = 'Vence hoje';
    hint.className = 'due-today';
  } else if (diff === 1) {
    hint.textContent = 'Vence amanhã';
  } else {
    hint.textContent = `Vence em ${pretty}`;
  }
};

const onTaskStatusOrDueChange = () => updateDueHint();

// ── Checklist ──

const newChecklistId = () =>
  (window.crypto?.randomUUID)
    ? window.crypto.randomUUID()
    : `c_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;

const renderChecklist = () => {
  const box = $('task-checklist');
  if (!box) return;
  if (!draftChecklist.length) {
    box.innerHTML = `<div class="task-checklist-empty">Nenhum item — adicione abaixo.</div>`;
  } else {
    box.innerHTML = draftChecklist.map((item) => `
      <div class="task-checklist-item${item.done ? ' done' : ''}" data-id="${escHtml(item.id)}">
        <input type="checkbox" class="task-checklist-check"
          ${item.done ? 'checked' : ''}
          onchange="toggleChecklistItem('${escHtml(item.id)}')"
          title="Marcar/desmarcar" />
        <span class="task-checklist-text"
          onclick="toggleChecklistItem('${escHtml(item.id)}')">${escHtml(item.text)}</span>
        <button type="button" class="task-checklist-del"
          onclick="removeChecklistItem('${escHtml(item.id)}')"
          title="Remover item">×</button>
      </div>`).join('');
  }
  updateChecklistProgress();
};

const updateChecklistProgress = () => {
  const total = draftChecklist.length;
  const done  = draftChecklist.filter((i) => i.done).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const bar = $('task-checklist-bar');
  if (bar) bar.style.width = `${pct}%`;
  const count = $('task-checklist-count');
  if (count) count.textContent = total ? `${done}/${total}` : '';
};

const addChecklistItem = () => {
  const input = $('task-checklist-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  draftChecklist = [...draftChecklist, { id: newChecklistId(), text, done: false }];
  input.value = '';
  input.focus();
  renderChecklist();
};

const onChecklistInputKey = (e) => {
  if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); }
};

const toggleChecklistItem = (id) => {
  draftChecklist = draftChecklist.map((i) =>
    i.id === id ? { ...i, done: !i.done } : i
  );
  renderChecklist();
};

const removeChecklistItem = (id) => {
  draftChecklist = draftChecklist.filter((i) => i.id !== id);
  renderChecklist();
};

const saveCurrentTask = async () => {
  const title  = $('task-title-input').value.trim();
  if (!title) { $('task-title-input').focus(); return; }

  const body = {
    title,
    description: $('task-desc-textarea').value,
    status:      $('task-status-select').value,
    dueDate:     $('task-due-input').value || null,
    noteId:      $('task-note-id').value   || null,
    projectId:   $('task-project-select').value || null,
    tags:        $('task-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean),
    checklist:   draftChecklist.map((i) => ({ id: i.id, text: i.text, done: i.done })),
  };

  try {
    if (currentTaskId) {
      await fetch(`/tasks/${currentTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    closeTaskModal();
    await loadTasks();
  } catch { toast('Erro ao salvar task'); }
};

const deleteCurrentTask = async () => {
  if (!currentTaskId) return;
  const title = $('task-title-input')?.value?.trim() || 'esta task';
  const ok = await confirmDialog(
    `Excluir "${title}"? Esta ação não pode ser desfeita.`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;
  await fetch(`/tasks/${currentTaskId}`, { method: 'DELETE' });
  closeTaskModal();
  await loadTasks();
};

const copyTaskRef = () => {
  if (!currentTaskId) return;
  const task = allTasks.find((t) => t.id === currentTaskId);
  if (!task) return;
  const ref = `#${task.id}`;
  navigator.clipboard.writeText(ref).then(() => {
    toast(`Referência copiada: ${ref}`);
  }).catch(() => {
    toast('Erro ao copiar referência');
  });
};

// ══════════════════════════════════════════
// Toolbar — deletar projeto selecionado
// ══════════════════════════════════════════

const updateProjectDeleteBtn = () => {
  const select = $('kanban-project-select');
  const delBtn = $('kanban-project-del-btn');
  if (!select || !delBtn) return;
  delBtn.disabled = !select.value;
};

const deleteSelectedProject = async () => {
  const select = $('kanban-project-select');
  if (!select || !select.value) return;
  const projectId = select.value;
  const project = allProjects.find((p) => p.id === projectId);
  if (!project) return;

  const ok = await confirmDialog(
    `Excluir o projeto "${project.name}"?\nAs tasks vinculadas ficarão sem projeto.`,
    { danger: true, okLabel: 'Excluir' },
  );
  if (!ok) return;

  try {
    const res = await fetch(`/projects/${projectId}`, { method: 'DELETE' });
    if (!res.ok) return;
    select.value = '';
    updateProjectDeleteBtn();
    await loadProjects();
    renderBoard();
  } catch (err) {
    console.error('Erro ao remover projeto:', err);
  }
};

// ══════════════════════════════════════════
// Modal — criar projeto
// ══════════════════════════════════════════

const openNewProject = () => {
  const input = $('project-name-input');
  if (!input) return;
  input.value = '';
  $('project-modal-overlay')?.classList.add('visible');
  input.focus();
};

const closeProjectModal = () => {
  $('project-modal-overlay')?.classList.remove('visible');
};

const closeProjectModalOnOverlay = (e) => {
  if (e.target === $('project-modal-overlay')) closeProjectModal();
};

const saveProject = async () => {
  const nameInput = $('project-name-input');
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }

  try {
    const res = await fetch('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Erro ao criar projeto:', err);
      return;
    }
    const created = await res.json();
    closeProjectModal();
    await loadProjects();
    if (created?.id) {
      const select = $('kanban-project-select');
      if (select) select.value = created.id;
    }
    renderBoard();
  } catch (err) {
    console.error('Erro ao criar projeto:', err);
  }
};

// ══════════════════════════════════════════
// Boot — bind único no carregamento da página
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.kanban-col').forEach(bindColumnDrop);
  document.addEventListener('click', closeNoteDropdown);

  // Atalho de save com a modal aberta (a modal só fecha no X/Cancelar).
  document.addEventListener('keydown', (e) => {
    const open = $('task-modal-overlay')?.classList.contains('visible');
    if (!open) return;
    // Não rouba Enter/Escape do confirm dialog de "fechar sem salvar".
    if ($('modal-overlay')?.classList.contains('visible')) return;
    const saveKey = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter');
    if (saveKey) { e.preventDefault(); saveCurrentTask(); }
  });
});
