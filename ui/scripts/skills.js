// ════ Skills — gerenciamento local, leitura pela IA ════

let allSkills    = [];
let currentSkill = null;
let skillPreview = false;

// ── Lista ──
const loadSkillsList = async () => {
  try {
    const res = await fetch('/skills');
    allSkills  = await res.json();
    renderSkillsList(allSkills);
  } catch (err) { console.error('Erro ao carregar skills:', err); }
};

const renderSkillsList = (skills) => {
  const list = $('skills-list');
  if (!skills.length) {
    list.innerHTML = `<div class="skills-empty">Nenhuma skill ainda.<br>Clique em <strong>+</strong> para criar.</div>`;
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

// ── Filtro de busca ──
$('skills-search-input').addEventListener('input', debounce((e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) { renderSkillsList(allSkills); return; }
  renderSkillsList(allSkills.filter((s) =>
    s.name.includes(q) || s.title.toLowerCase().includes(q) ||
    (s.description||'').toLowerCase().includes(q) ||
    (s.tags||[]).some((t) => t.toLowerCase().includes(q))
  ));
}, 200));

// ── Abrir / Novo ──
const openSkill = async (id) => {
  if (currentMode !== 'skills') setMode('skills');
  try {
    const res = await fetch('/skills/' + id);
    currentSkill = await res.json();
    fillSkillEditor(currentSkill);
    renderSkillsList(allSkills);
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
  $('btn-skill-copy').style.display   = 'inline-flex';
  $('btn-skill-delete').style.display = 'inline-flex';
  showSkillEditor();
  setSkillPreview(false);
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

  const url    = currentSkill ? '/skills/' + currentSkill.id : '/skills';
  const method = currentSkill ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, name: name || title, description: desc, content, tags }),
    });
    currentSkill = await res.json();
    const listRes = await fetch('/skills');
    allSkills = await listRes.json();
    fillSkillEditor(currentSkill);
    renderSkillsList(allSkills);
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
  const listRes = await fetch('/skills');
  allSkills = await listRes.json();
  renderSkillsList(allSkills);
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
