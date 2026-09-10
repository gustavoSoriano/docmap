// ════ Skills — gerenciamento local, leitura pela IA ════

let allSkills    = [];
let skillCollections = [];
let activeSkillCollectionId = null;
let currentSkill = null;
let skillPreview = false;

// ── Lista ──
const loadSkillsList = async () => {
  try {
    const [res, collectionsRes] = await Promise.all([
      fetch('/skills'),
      fetch('/skills/collections'),
    ]);
    allSkills = await res.json();
    skillCollections = await collectionsRes.json();
    if (
      activeSkillCollectionId &&
      !skillCollections.some((c) => c.id === activeSkillCollectionId)
    ) {
      activeSkillCollectionId = null;
    }
    renderSkillCollections();
    applySkillFilters();
    updateSkillsClearBtn();
  } catch (err) { console.error('Erro ao carregar skills:', err); }
};

const visibleSkills = () => {
  const q = ($('skills-search-input')?.value ?? '').trim().toLowerCase();
  let skills = activeSkillCollectionId
    ? allSkills.filter((s) => s.collectionId === activeSkillCollectionId)
    : allSkills.filter((s) => !s.collectionId);
  if (q) {
    skills = skills.filter((s) =>
      s.name.includes(q) || s.title.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }
  return skills;
};

const applySkillFilters = () => {
  const skills = visibleSkills();
  const collection = skillCollections.find((c) =>
    c.id === activeSkillCollectionId
  );
  $('skills-list-heading').textContent = collection?.name ?? 'Sem collection';
  renderSkillsList(skills);
};

const renderSkillsList = (skills) => {
  const list = $('skills-list');
  if (!skills.length) {
    const emptyLabel = activeSkillCollectionId
      ? 'Nenhuma skill nesta collection ainda.'
      : 'Nenhuma skill sem collection ainda.';
    list.innerHTML =
      `<div class="skills-empty">${emptyLabel}<br>Clique em <strong>+</strong> para criar.</div>`;
    return;
  }
  list.innerHTML = skills.map((s) =>
    `<div class="skill-item${currentSkill?.id === s.id ? ' active' : ''}" onclick="openSkill('${s.id}')">
      <div class="skill-item-top">
        <span class="skill-item-name">@${escHtml(s.name)}</span>
        <span class="skill-item-title">${escHtml(s.title)}</span>
      </div>
      <div class="skill-item-desc">${escHtml(s.description || '')}</div>
      ${(s.tags||[]).length ? `<div class="skill-item-tags">${(s.tags||[]).map(t=>`<span class="note-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
    </div>`
  ).join('');
};

// ── Collections (padrão macros/mocks) ──
const renderSkillCollections = () => {
  const list = $('skills-collections-list');
  if (!list) return;
  if (!skillCollections.length) {
    list.innerHTML =
      `<div class="skills-col-empty">Nenhuma collection ainda.<br>Crie a primeira.</div>`;
    return;
  }
  list.innerHTML = skillCollections.map((collection) => {
    const count = allSkills.filter((s) =>
      s.collectionId === collection.id
    ).length;
    const active = activeSkillCollectionId === collection.id ? ' active' : '';
    return `<div class="skills-col-item${active}" data-skill-collection-id="${collection.id}">
      <div class="skills-col-item-inner" onclick="selectSkillCollection('${collection.id}')">
        <span class="skills-col-dot"></span>
        <span class="skills-col-name">${escHtml(collection.name)}</span>
        <span class="skills-col-count">${count}</span>
      </div>
      <div class="skills-col-actions">
        <button class="skills-col-action-btn" onclick="renameSkillCollection('${collection.id}')" title="Renomear">
          <span data-icon="pencil"></span>
        </button>
        <button class="skills-col-action-btn warn" onclick="clearSkillCollectionMocks('${collection.id}')" title="Limpar skills (mantém collection)">
          <span data-icon="minus"></span>
        </button>
        <button class="skills-col-action-btn danger" onclick="removeSkillCollection('${collection.id}')" title="Remover collection">
          <span data-icon="trash"></span>
        </button>
      </div>
    </div>`;
  }).join('');
  hydrateIcons(list);
};

const selectSkillCollection = (id) => {
  activeSkillCollectionId = activeSkillCollectionId === id ? null : id;
  renderSkillCollections();
  applySkillFilters();
  updateSkillsClearBtn();
};

const newSkillCollection = () => {
  if ($('new-skill-col-row')) return;
  const list = $('skills-collections-list');
  if (!list) return;
  const row = document.createElement('div');
  row.id = 'new-skill-col-row';
  row.className = 'skills-col-new-row';
  row.innerHTML = `<input id="new-skill-col-input" class="skills-col-new-input"
    placeholder="Nome da collection…" autocomplete="off" spellcheck="false" />
    <button class="skills-col-new-ok" onclick="confirmNewSkillCollection()" title="Criar">
      <span data-icon="plus"></span>
    </button>`;
  list.prepend(row);
  hydrateIcons(row);
  const input = $('new-skill-col-input');
  input.focus();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmNewSkillCollection();
    }
    if (event.key === 'Escape') row.remove();
  });
};

const confirmNewSkillCollection = async () => {
  const input = $('new-skill-col-input');
  const name = input?.value.trim();
  $('new-skill-col-row')?.remove();
  if (!name) return;
  const res = await fetch('/skills/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) return toast(await res.text() || 'Erro ao criar collection');
  const collection = await res.json();
  activeSkillCollectionId = collection.id;
  await loadSkillsList();
};

const renameSkillCollection = (id) => {
  const collection = skillCollections.find((item) => item.id === id);
  const nameEl = document.querySelector(
    `[data-skill-collection-id="${id}"] .skills-col-name`,
  );
  if (!collection || !nameEl) return;
  const input = document.createElement('input');
  input.className = 'skills-col-rename-input';
  input.value = collection.name;
  nameEl.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const commit = async () => {
    if (done) return;
    done = true;
    const name = input.value.trim();
    if (name && name !== collection.name) {
      await fetch(`/skills/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    }
    await loadSkillsList();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); commit(); }
    if (event.key === 'Escape') { done = true; loadSkillsList(); }
  });
  input.addEventListener('blur', commit);
};

const removeSkillCollection = async (id) => {
  const collection = skillCollections.find((item) => item.id === id);
  if (!collection) return;
  const count = allSkills.filter((s) => s.collectionId === id).length;
  const suffix = count
    ? ` As ${count} skill(s) serão preservadas sem collection.`
    : '';
  const ok = await confirmDialog(
    `Remover collection "${collection.name}"?${suffix}`,
    { okLabel: 'Remover', danger: true },
  );
  if (!ok) return;
  const res = await fetch(`/skills/collections/${id}`, { method: 'DELETE' });
  if (!res.ok) return toast('Erro ao remover collection');
  if (activeSkillCollectionId === id) activeSkillCollectionId = null;
  if (currentSkill?.collectionId === id) {
    currentSkill = { ...currentSkill, collectionId: undefined };
  }
  await loadSkillsList();
  if (currentSkill) fillSkillEditor(currentSkill);
};

const clearSkillCollectionMocks = async (id) => {
  const collection = skillCollections.find((item) => item.id === id);
  if (!collection) return;
  const count = allSkills.filter((s) => s.collectionId === id).length;
  if (!count) { toast(`"${collection.name}" já está vazia`); return; }
  const ok = await confirmDialog(
    `Zerar "${collection.name}"?\n${count} skill(s) serão removidas. A collection será mantida.`,
    { okLabel: 'Zerar', danger: true },
  );
  if (!ok) return;
  await fetch(`/skills/collections/${id}/clear`, { method: 'DELETE' });
  if (currentSkill?.collectionId === id) {
    currentSkill = null;
    $('skills-editor-form').classList.remove('visible');
    $('skills-editor-empty').style.display = 'flex';
  }
  await loadSkillsList();
  toast(`"${collection.name}" zerada`);
};

const updateSkillsCount = () => {
  const el = $('skills-count-text');
  if (el) {
    const n = allSkills.length;
    el.textContent = `${n} skill${n === 1 ? '' : 's'}`;
  }
};

const updateSkillsClearBtn = () => {
  updateSkillsCount();
  const lbl = document.querySelector('#skills-clear-btn .skills-clear-label');
  if (!lbl) return;
  if (activeSkillCollectionId) {
    const col = skillCollections.find((c) => c.id === activeSkillCollectionId);
    lbl.textContent = col ? `Zerar "${col.name}"` : 'Zerar tudo';
  } else {
    lbl.textContent = 'Zerar tudo';
  }
};

// Zera a collection ativa — ou tudo (collections + skills) se nenhuma ativa.
// Não há endpoint de clear-all: apaga collection por collection + órfãs.
const clearSkillsDatabase = async () => {
  if (activeSkillCollectionId) {
    await clearSkillCollectionMocks(activeSkillCollectionId);
    return;
  }
  const total = allSkills.length;
  const cols = skillCollections.length;
  if (!total && !cols) { toast('Banco já está vazio'); return; }
  const ok = await confirmDialog(
    `Zerar tudo?\n${cols} collection(s) e ${total} skill(s) serão removidas permanentemente.`,
    { okLabel: 'Zerar tudo', danger: true },
  );
  if (!ok) return;
  for (const c of skillCollections) {
    await fetch(`/skills/collections/${c.id}/clear`, { method: 'DELETE' });
    await fetch(`/skills/collections/${c.id}`, { method: 'DELETE' });
  }
  for (const s of allSkills.filter((x) => !x.collectionId)) {
    await fetch(`/skills/${s.id}`, { method: 'DELETE' });
  }
  activeSkillCollectionId = null;
  currentSkill = null;
  $('skills-editor-form').classList.remove('visible');
  $('skills-editor-empty').style.display = 'flex';
  await loadSkillsList();
  toast('Banco de skills zerado');
};

// ── Filtro de busca ──
$('skills-search-input').addEventListener('input', debounce(() => {
  applySkillFilters();
}, 200));

// ── Abrir / Novo ──
const openSkill = async (id) => {
  if (currentMode !== 'skills') setMode('skills');
  try {
    const res = await fetch('/skills/' + id);
    currentSkill = await res.json();
    fillSkillEditor(currentSkill);
    applySkillFilters();
  } catch (err) { console.error('Erro ao abrir skill:', err); }
};

const newSkill = () => {
  currentSkill = null;
  $('skill-title-input').value   = '';
  $('skill-name-input').value    = '';
  $('skill-desc-input').value    = '';
  $('skill-tags-input').value    = '';
  $('skill-content-textarea').value = '';
  $('skill-name-badge').textContent = '';
  populateSkillCollectionSelect(activeSkillCollectionId);
  $('btn-skill-copy').style.display   = 'none';
  $('btn-skill-delete').style.display = 'none';
  showSkillEditor();
  setSkillPreview(false);
  $('skill-title-input').focus();
};

const fillSkillEditor = (s) => {
  $('skill-title-input').value      = s.title;
  $('skill-name-input').value       = s.name;
  $('skill-desc-input').value       = s.description || '';
  $('skill-tags-input').value       = (s.tags||[]).join(', ');
  $('skill-content-textarea').value = s.content;
  $('skill-name-badge').textContent = '@' + s.name;
  populateSkillCollectionSelect(s.collectionId);
  $('btn-skill-copy').style.display   = 'inline-flex';
  $('btn-skill-delete').style.display = 'inline-flex';
  showSkillEditor();
  setSkillPreview(false);
};

const populateSkillCollectionSelect = (selectedId) => {
  const select = $('skill-collection-select');
  if (!select) return;
  select.innerHTML = `<option value="">— sem collection —</option>` +
    skillCollections.map((collection) =>
      `<option value="${collection.id}"${collection.id === selectedId ? ' selected' : ''}>${escHtml(collection.name)}</option>`
    ).join('');
};

const showSkillEditor = () => {
  $('skills-editor-empty').style.display = 'none';
  $('skills-editor-form').classList.add('visible');
};

// ── Auto-slug ao digitar título ──
$('skill-title-input').addEventListener('input', () => {
  if (!currentSkill && !$('skill-name-input').value) {
    const slug = $('skill-title-input').value
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    $('skill-name-input').value = slug;
  }
});

// ── Salvar / Excluir ──
const saveCurrentSkill = async () => {
  const title   = $('skill-title-input').value.trim();
  const name    = $('skill-name-input').value.trim();
  const desc    = $('skill-desc-input').value.trim();
  const content = $('skill-content-textarea').value.trim();
  const tags    = $('skill-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);

  if (!title)   { $('skill-title-input').focus(); return toast('Dê um título à skill'); }
  if (!content) { $('skill-content-textarea').focus(); return toast('Conteúdo vazio'); }

  const collectionId = $('skill-collection-select')?.value || null;
  const url    = currentSkill ? '/skills/' + currentSkill.id : '/skills';
  const method = currentSkill ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name: name || title, description: desc, content, tags, collectionId }),
    });
    if (!res.ok) return toast(await res.text() || 'Erro ao salvar');
    currentSkill = await res.json();
    const [listRes, collectionsRes] = await Promise.all([
      fetch('/skills'),
      fetch('/skills/collections'),
    ]);
    allSkills = await listRes.json();
    skillCollections = await collectionsRes.json();
    fillSkillEditor(currentSkill);
    renderSkillCollections();
    applySkillFilters();
    updateSkillsClearBtn();
    toast('Skill salva');
  } catch { toast('Erro ao salvar'); }
};

const deleteCurrentSkill = async () => {
  if (!currentSkill) return;
  const ok = await confirmDialog(`Excluir a skill "@${currentSkill.name}"?`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/skills/' + currentSkill.id, { method: 'DELETE' });
  currentSkill = null;
  $('skills-editor-form').classList.remove('visible');
  $('skills-editor-empty').style.display = 'flex';
  const [listRes, collectionsRes] = await Promise.all([
    fetch('/skills'),
    fetch('/skills/collections'),
  ]);
  allSkills = await listRes.json();
  skillCollections = await collectionsRes.json();
  renderSkillCollections();
  applySkillFilters();
  updateSkillsClearBtn();
  toast('Skill excluída');
};

// Copia a referência que você cola num prompt de IA
const copySkillRef = () => {
  if (!currentSkill) return;
  const ref = `CURL http://127.0.0.1:3334/skills/${currentSkill.name}`;
  copyToClipboard(ref, 'Referência copiada — cole no prompt da IA');
};

// ── Preview markdown ──
const setSkillPreview = (on) => {
  skillPreview = on;
  const ta  = $('skill-content-textarea');
  const pv  = $('skill-preview');
  const btn = $('btn-skill-preview');
  if (on) {
    pv.innerHTML = window.marked ? marked.parse(ta.value) : `<pre>${escHtml(ta.value)}</pre>`;
    ta.style.display = 'none';
    pv.classList.add('visible');
    btn.innerHTML = `${ICON('pencil')} Editar`;
  } else {
    pv.classList.remove('visible');
    ta.style.display = '';
    btn.innerHTML = `${ICON('eye')} Preview`;
  }
};
const toggleSkillPreview = () => setSkillPreview(!skillPreview);

// Ctrl+S salva
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'skills') {
    e.preventDefault();
    saveCurrentSkill();
  }
});
