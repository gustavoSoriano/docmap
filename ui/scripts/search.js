// ════ Busca (topbar) — docs no modo Mapa, notas no modo Notas ════

const searchInput   = $('search-input');
const searchResults = $('search-results');
let lastQuery = '';

const doSearch = debounce(async (q) => {
  lastQuery = q;
  if (!q) { searchResults.classList.remove('visible'); return; }
  if (currentMode === 'notes') return searchNotesTopbar(q);
  return searchDocsTopbar(q);
}, 260);

const searchDocsTopbar = async (q) => {
  try {
    const res = await fetch('/search?q=' + encodeURIComponent(q));
    renderSearchResults(await res.json(), q);
  } catch (err) { console.error('Erro na busca:', err); }
};

const renderSearchResults = (results, q) => {
  if (!results.length) {
    searchResults.innerHTML = `<div class="search-empty">Nenhum resultado para <strong>${escHtml(q)}</strong></div>`;
    searchResults.classList.add('visible');
    return;
  }
  const header = `<div class="search-count">${results.length} resultado${results.length !== 1 ? 's' : ''}</div>`;
  const items = results.map((r) => {
    const snippet = highlightQuery(r.snippet, q);
    const heading = r.heading ? ` · ${escHtml(r.heading)}` : '';
    const fileShort = r.file.split('/').pop().replace('.md', '');
    const fileAttr = JSON.stringify(r.file).replace(/"/g, '&quot;');
    return `<div class="search-result" onclick="openDocFromSearch(${fileAttr})">
      <div class="search-result-file">${escHtml(fileShort)}<span style="font-weight:400;color:var(--ink-3)">${heading}</span></div>
      <div class="search-result-heading">${escHtml(r.file)}:${r.line}</div>
      <div class="search-result-snippet">${snippet}</div>
    </div>`;
  }).join('');
  searchResults.innerHTML = header + items;
  searchResults.classList.add('visible');
};

const openDocFromSearch = (file) => {
  searchResults.classList.remove('visible');
  if (currentMode !== 'map') setMode('map');
  selectNode(file);
  loadFile(file);
};

// Busca de notas na topbar → filtra a lista e mostra dropdown simples
const searchNotesTopbar = (q) => {
  const filtered = filterNotes(q);
  if (!filtered.length) {
    searchResults.innerHTML = `<div class="search-empty">Nenhuma nota para <strong>${escHtml(q)}</strong></div>`;
  } else {
    const header = `<div class="search-count">${filtered.length} nota${filtered.length !== 1 ? 's' : ''}</div>`;
    searchResults.innerHTML = header + filtered.map((n) =>
      `<div class="search-result" onclick="openNote('${n.id}'); searchResults.classList.remove('visible')">
        <div class="search-result-file">${escHtml(n.title)}</div>
        <div class="search-result-snippet">${escHtml(n.preview || '')}</div>
      </div>`).join('');
  }
  searchResults.classList.add('visible');
};

searchInput.addEventListener('input', (e) => doSearch(e.target.value.trim()));
searchInput.addEventListener('focus', () => { if (lastQuery) searchResults.classList.add('visible'); });
document.addEventListener('mousedown', (e) => {
  if (!$('search-wrap').contains(e.target)) searchResults.classList.remove('visible');
});
