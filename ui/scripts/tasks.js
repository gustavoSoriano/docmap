// ════ Kanban — tasks globais ════

let allTasks      = [];
let taskNotesList = [];  // cache da lista de notas p/ o seletor (nome distinto de allNotes em notes.js)
let currentTaskId = null;

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
  { status: 'done',        label: 'Concluído'    },
];

const renderBoard = () => {
  for (const col of COLUMNS) {
    const colTasks = allTasks
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

  if (status === 'done')   { label = due.split('-').reverse().join('/'); }
  else if (diff < 0)       { cls += ' overdue';   label = `Atrasada ${Math.abs(diff)}d`; }
  else if (diff === 0)     { cls += ' due-today'; label = 'Hoje'; }
  else if (diff === 1)     { label = 'Amanhã'; }
  else                     { label = due.split('-').reverse().join('/'); }

  return `<span class="${cls}">📅 ${escHtml(label)}</span>`;
};

const renderCard = (task) => {
  const due  = formatDue(task.dueDate, task.status);
  const note = task.noteId
    ? `<span class="kanban-card-note-link">nota</span>`
    : '';
  const desc = task.description
    ? `<div class="kanban-card-desc">${escHtml(task.description.slice(0, 120))}</div>`
    : '';
  const meta = (due || note)
    ? `<div class="kanban-card-meta">${due}${note}</div>`
    : '';
  return `<div class="kanban-card"
    data-id="${task.id}"
    draggable="true"
    onclick="openTaskModal('${task.id}')">
    <div class="kanban-card-title">${escHtml(task.title)}</div>
    ${desc}
    ${meta}
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
  $('task-delete-btn').style.display = 'none';

  showTaskModal();
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
  $('task-delete-btn').style.display = 'inline-flex';

  showTaskModal();
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
};

const closeTaskModalOnOverlay = (e) => {
  if (e.target === $('task-modal-overlay')) closeTaskModal();
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
  };

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
};

const deleteCurrentTask = async () => {
  if (!currentTaskId) return;
  await fetch(`/tasks/${currentTaskId}`, { method: 'DELETE' });
  closeTaskModal();
  await loadTasks();
};

// ══════════════════════════════════════════
// Boot — bind único no carregamento da página
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.kanban-col').forEach(bindColumnDrop);
  document.addEventListener('click', closeNoteDropdown);
});
