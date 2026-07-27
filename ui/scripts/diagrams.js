// ════ Diagramas Mermaid ════

let allDiagrams     = [];
let currentDiagram  = null;
let renderTimer     = null;
let mermaidReady    = false;

// ── Inicializa Mermaid com tema dark ──
const initMermaid = () => {
  if (!window.mermaid || mermaidReady) return;
  window.mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: 'dark',
    themeVariables: {
      background:       '#101216',
      primaryColor:     '#1e222a',
      primaryTextColor: '#edeef1',
      primaryBorderColor: '#22262e',
      lineColor:        '#626976',
      secondaryColor:   '#16191f',
      tertiaryColor:    '#262b34',
    },
  });
  mermaidReady = true;
};

// ── Lista ──
const loadDiagramsList = async () => {
  try {
    const res = await fetch('/diagrams');
    allDiagrams = await res.json();
    renderDiagramsList();
  } catch (err) { console.error('Erro ao carregar diagramas:', err); }
};

const renderDiagramsList = () => {
  const list = $('diag-list');
  if (!allDiagrams.length) {
    list.innerHTML = `<div class="diag-empty">Nenhum diagrama ainda.<br>Clique em <strong>+</strong> para criar.</div>`;
    return;
  }
  list.innerHTML = allDiagrams.map((d) =>
    `<div class="diag-item${currentDiagram?.id === d.id ? ' active' : ''}" onclick="openDiagram('${d.id}')">
      <div class="diag-item-title">${escHtml(d.title)}</div>
      <div class="diag-item-preview">${escHtml(d.preview || '')}</div>
      ${(d.tags||[]).length ? `<div class="diag-item-tags">${d.tags.map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
    </div>`
  ).join('');
};

// ── Abrir / Novo ──
const openDiagram = async (id) => {
  if (currentMode !== 'diagrams') setMode('diagrams');
  try {
    const res = await fetch('/diagrams/' + id);
    currentDiagram = await res.json();
    fillDiagramEditor(currentDiagram);
    renderDiagramsList();
  } catch (err) { console.error('Erro ao abrir diagrama:', err); }
};

const newDiagram = () => {
  currentDiagram = null;
  diagZoomLevel = 1;
  $('diag-title-input').value = '';
  $('diag-tags-input').value = '';
  $('diag-source').value = '';
  $('diag-id-badge').style.display = 'none';
  $('btn-diag-copy-link').style.display = 'none';
  $('btn-diag-delete').style.display = 'none';
  $('diag-preview').innerHTML = '';
  $('diag-zoom-label').textContent = '100%';
  showDiagramEditor();
  $('diag-title-input').focus();
};

const fillDiagramEditor = (d) => {
  $('diag-title-input').value = d.title;
  $('diag-tags-input').value = (d.tags || []).join(', ');
  $('diag-source').value      = d.source;
  const badge = $('diag-id-badge');
  badge.textContent            = d.id.slice(0, 8);
  badge.style.display          = 'inline-block';
  $('btn-diag-copy-link').style.display = 'inline-flex';
  $('btn-diag-delete').style.display    = 'inline-flex';
  showDiagramEditor();
  renderPreview(d.source);
};

const showDiagramEditor = () => {
  $('diag-editor-empty').style.display = 'none';
  $('diag-editor-form').classList.add('visible');
};

// ── Salvar / Excluir ──
const saveCurrentDiagram = async () => {
  const title  = $('diag-title-input').value.trim();
  const source = $('diag-source').value.trim();
  if (!title)  { $('diag-title-input').focus(); return toast('Dê um título ao diagrama'); }
  if (!source) { $('diag-source').focus();      return toast('Escreva o código Mermaid'); }

  const url    = currentDiagram ? '/diagrams/' + currentDiagram.id : '/diagrams';
  const method = currentDiagram ? 'PUT' : 'POST';
  try {
    const tags = $('diag-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, source, tags }),
    });
    currentDiagram = await res.json();
    fillDiagramEditor(currentDiagram);
    const listRes = await fetch('/diagrams');
    allDiagrams = await listRes.json();
    renderDiagramsList();
    toast('Diagrama salvo');
  } catch { toast('Erro ao salvar'); }
};

const deleteCurrentDiagram = async () => {
  if (!currentDiagram) return;
  const ok = await confirmDialog(`Excluir "${currentDiagram.title}"?`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/diagrams/' + currentDiagram.id, { method: 'DELETE' });
  currentDiagram = null;
  $('diag-editor-form').classList.remove('visible');
  $('diag-editor-empty').style.display = 'flex';
  $('diag-preview').innerHTML = '';
  const listRes = await fetch('/diagrams');
  allDiagrams = await listRes.json();
  renderDiagramsList();
  toast('Diagrama excluído');
};

// ── Deep link / copiar ──
const copyDiagramLink = () => {
  if (!currentDiagram) return;
  const link = `http://127.0.0.1:3333/#diagram/${currentDiagram.id}`;
  copyToClipboard(link, 'Link copiado — cole numa IA ou no navegador');
};

// ── Zoom ──
let diagZoomLevel = 1;

const diagApplyZoom = () => {
  const svgEl = $('diag-preview')?.querySelector('svg');
  if (!svgEl) return;
  const pct = Math.round(diagZoomLevel * 100);
  svgEl.style.width  = pct + '%';
  svgEl.style.height = 'auto';
  $('diag-zoom-label').textContent = pct + '%';
};

const diagZoomIn    = () => { diagZoomLevel = Math.min(diagZoomLevel + 0.25, 4);   diagApplyZoom(); };
const diagZoomOut   = () => { diagZoomLevel = Math.max(diagZoomLevel - 0.25, 0.25); diagApplyZoom(); };
const diagZoomReset = () => { diagZoomLevel = 1; diagApplyZoom(); };

// ── Preview Mermaid ──
const renderPreview = async (source) => {
  if (!source.trim()) { $('diag-preview').innerHTML = ''; return; }
  initMermaid();
  if (!window.mermaid) return;
  try {
    const id  = 'mmd-' + Date.now();
    const { svg } = await window.mermaid.render(id, source);
    const el = $('diag-preview');
    el.innerHTML = svg;
    const svgEl = el.querySelector('svg');
    if (svgEl) { svgEl.style.maxWidth = 'none'; }
    diagApplyZoom();
  } catch (err) {
    $('diag-preview').innerHTML =
      `<div class="diag-error">Erro no diagrama:<br><code>${escHtml(String(err).slice(0, 200))}</code></div>`;
  }
};

// ── Toggle código Mermaid ──
const toggleDiagSource = () => {
  $('diag-source-col').classList.toggle('open');
};

// ── Live preview ao digitar (debounced) ──
$('diag-source').addEventListener('input', debounce(() => {
  renderPreview($('diag-source').value);
}, 600));

// ── Atalho: Ctrl/Cmd+S salva ──
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMode === 'diagrams') {
    e.preventDefault();
    saveCurrentDiagram();
  }
});

// ── SSE: atualiza preview em tempo real quando um agente modifica o diagrama ──
const connectDiagramEvents = () => {
  const es = new EventSource('/diagrams/events');

  es.addEventListener('updated', (e) => {
    const { diagram } = JSON.parse(e.data);
    allDiagrams = allDiagrams.map((d) => d.id === diagram.id
      ? { ...d, ...diagram, preview: (diagram.source ?? '').slice(0, 120) }
      : d);
    renderDiagramsList();
    if (currentDiagram?.id === diagram.id) {
      currentDiagram = diagram;
      // Só sobrescreve o editor se o usuário não estiver digitando nele
      if (document.activeElement !== $('diag-source')) {
        $('diag-title-input').value = diagram.title;
        $('diag-source').value      = diagram.source;
      }
      if (document.activeElement !== $('diag-tags-input')) {
        $('diag-tags-input').value = (diagram.tags || []).join(', ');
      }
      renderPreview(diagram.source);
    }
  });

  es.addEventListener('created', (e) => {
    const { diagram } = JSON.parse(e.data);
    if (!allDiagrams.find((d) => d.id === diagram.id)) {
      allDiagrams = [diagram, ...allDiagrams];
      renderDiagramsList();
    }
  });

  es.addEventListener('deleted', (e) => {
    const { id } = JSON.parse(e.data);
    allDiagrams = allDiagrams.filter((d) => d.id !== id);
    if (currentDiagram?.id === id) {
      currentDiagram = null;
      $('diag-editor-form').classList.remove('visible');
      $('diag-editor-empty').style.display = 'flex';
      $('diag-preview').innerHTML = '';
    }
    renderDiagramsList();
  });
};

connectDiagramEvents();
