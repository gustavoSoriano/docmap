// ════ Busca (topbar) — notas ════

const searchInput   = $('search-input');
const searchResults = $('search-results');
let lastQuery = '';

const doSearch = debounce(async (q) => {
  lastQuery = q;
  if (currentMode === 'graph') { filterGraph(q); return; }
  if (!q) { searchResults.classList.remove('visible'); return; }
  searchNotesTopbar(q);
}, 260);

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
searchInput.addEventListener('focus', () => { if (lastQuery && currentMode !== 'graph') searchResults.classList.add('visible'); });
document.addEventListener('mousedown', (e) => {
  if (!$('search-wrap').contains(e.target)) searchResults.classList.remove('visible');
});
