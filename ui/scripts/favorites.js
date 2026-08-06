// ════ Favorites / Bookmarks Manager ════

const FAV_TYPES = {
  site:   { label: 'SITE'   },
  slack:  { label: 'SLACK'  },
  grid:   { label: 'GRID'   },
  dash:   { label: 'DASH'   },
  github: { label: 'GITHUB' },
};

const FAV_CATEGORIES = [
  { id: 'all',        label: 'Todos',       icon: '◈' },
  { id: 'produto',    label: 'Produto',     icon: '◆' },
  { id: 'design',     label: 'Design',      icon: '✦' },
  { id: 'metricas',   label: 'Métricas',    icon: '◉' },
  { id: 'docs',       label: 'Docs',        icon: '◎' },
  { id: 'referencia', label: 'Referência',  icon: '◇' },
  { id: 'devops',     label: 'DevOps',      icon: '⬡' },
  { id: 'arquitetura',label: 'Arquitetura', icon: '⬢' },
  { id: 'incidentes', label: 'Incidentes',  icon: '▲' },
];

const FAV_PAGE_SIZE = 30;

let favAll       = [];
let favPage      = 1;
let favState     = { search: '', category: 'all', type: 'all', tag: null };
let favModalTags = [];
let favModalType = 'site';
let favModalCat  = '';
let favEditing   = null;

// ─────────────────────────────────────
//  API
// ─────────────────────────────────────

const loadFavoritesData = async () => {
  try {
    const res = await fetch('/favorites');
    favAll = await res.json();
    renderFavSidebar();
    renderFavorites();
  } catch (err) {
    console.error('Erro ao carregar favoritos:', err);
  }
};

// ─────────────────────────────────────
//  Filtering
// ─────────────────────────────────────

const getFiltered = () => {
  let items = favAll;

  if (favState.category !== 'all') {
    const catLabel = FAV_CATEGORIES.find(c => c.id === favState.category)?.label ?? '';
    items = items.filter(b => b.category.toLowerCase() === catLabel.toLowerCase());
  }

  if (favState.type !== 'all') {
    items = items.filter(b => b.type === favState.type);
  }

  if (favState.tag) {
    items = items.filter(b => b.tags.includes(favState.tag));
  }

  if (favState.search) {
    const q = favState.search.toLowerCase();
    items = items.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q)) ||
      b.note.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  return items;
};

// counts ignoring the type filter (for tab counts)
const getBaseFiltered = () => {
  let items = favAll;
  if (favState.category !== 'all') {
    const catLabel = FAV_CATEGORIES.find(c => c.id === favState.category)?.label ?? '';
    items = items.filter(b => b.category.toLowerCase() === catLabel.toLowerCase());
  }
  if (favState.tag) items = items.filter(b => b.tags.includes(favState.tag));
  if (favState.search) {
    const q = favState.search.toLowerCase();
    items = items.filter(b =>
      b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) ||
      b.tags.some(t => t.includes(q)) || b.note.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }
  return items;
};

// ─────────────────────────────────────
//  Highlight
// ─────────────────────────────────────

const favHl = (text) => {
  if (!favState.search) return escHtml(text);
  const safe = favState.search.replace(/[.*+?^${}()|[\]\\]/g, (c) => '\\' + c);
  return escHtml(text).replace(
    new RegExp(safe, 'gi'),
    (m) => '<mark class="fav-hl">' + m + '</mark>',
  );
};

// ─────────────────────────────────────
//  Sidebar
// ─────────────────────────────────────

const renderFavSidebar = () => {
  const catList = document.getElementById('fav-cat-list');
  const tagCloud = document.getElementById('fav-tag-cloud');
  if (!catList || !tagCloud) return;

  const counts = {};
  favAll.forEach(b => {
    const k = b.category.toLowerCase();
    counts[k] = (counts[k] || 0) + 1;
  });

  catList.innerHTML = FAV_CATEGORIES.map(cat => {
    const count = cat.id === 'all'
      ? favAll.length
      : (counts[cat.label.toLowerCase()] || 0);
    return `
      <div class="fav-cat-item ${favState.category === cat.id ? 'active' : ''}" data-cat="${cat.id}">
        <span class="fav-cat-left">
          <span class="fav-cat-icon">${cat.icon}</span>
          ${escHtml(cat.label)}
        </span>
        <span class="fav-cat-count">${count}</span>
      </div>
    `;
  }).join('');

  catList.querySelectorAll('.fav-cat-item').forEach(el => {
    el.addEventListener('click', () => {
      favState.category = el.dataset.cat;
      favState.type = 'all';
      favPage = 1;
      updateFavTypeTabs();
      renderFavSidebar();
      renderFavorites();
    });
  });

  const tagCounts = {};
  favAll.forEach(b => b.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 22);

  tagCloud.innerHTML = topTags.map(([tag]) =>
    `<span class="fav-tag ${favState.tag === tag ? 'active' : ''}" data-tag="${escHtml(tag)}">#${escHtml(tag)}</span>`
  ).join('');

  tagCloud.querySelectorAll('.fav-tag').forEach(el => {
    el.addEventListener('click', () => {
      favState.tag = favState.tag === el.dataset.tag ? null : el.dataset.tag;
      favPage = 1;
      renderFavSidebar();
      renderFavorites();
    });
  });
};

// ─────────────────────────────────────
//  Type tabs
// ─────────────────────────────────────

const updateFavTypeTabs = () => {
  const base = getBaseFiltered();
  const g    = { site: 0, slack: 0, grid: 0, dash: 0, github: 0 };
  base.forEach(b => { if (g[b.type] !== undefined) g[b.type]++; });

  const s = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
  s('fav-count-all',    base.length);
  s('fav-count-site',   g.site);
  s('fav-count-slack',  g.slack);
  s('fav-count-grid',   g.grid);
  s('fav-count-dash',   g.dash);
  s('fav-count-github', g.github);

  document.querySelectorAll('.fav-type-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === favState.type);
  });
};

// ─────────────────────────────────────
//  Main render
// ─────────────────────────────────────

const renderFavorites = () => {
  const filtered = getFiltered();
  const grid     = document.getElementById('fav-grid');
  const empty    = document.getElementById('fav-empty');
  const mvSection = document.getElementById('fav-most-visited');
  if (!grid || !empty) return;

  updateFavTypeTabs();

  // Most visited — only when no active filter/search
  const noFilter = !favState.search && favState.category === 'all' &&
                   favState.type === 'all' && !favState.tag;
  const topVisited = favAll.filter(b => b.accessCount > 0).slice(0, 5);

  if (mvSection) {
    if (noFilter && topVisited.length > 0) {
      mvSection.style.display = 'block';
      renderFeaturedCards(topVisited);
    } else {
      mvSection.style.display = 'none';
    }
  }

  // Grid
  const countEl = document.getElementById('fav-result-count');
  if (countEl) countEl.textContent = `${filtered.length} link${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.style.display  = 'none';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.style.display  = 'grid';

  const totalPages = Math.max(1, Math.ceil(filtered.length / FAV_PAGE_SIZE));
  if (favPage > totalPages) favPage = totalPages;

  const start     = (favPage - 1) * FAV_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + FAV_PAGE_SIZE);

  grid.innerHTML = '';
  pageItems.forEach((b, i) => grid.appendChild(buildFavCard(b, i)));

  renderFavPagination(filtered.length, totalPages);
};

// ─────────────────────────────────────
//  Featured cards (most visited)
// ─────────────────────────────────────

const renderFeaturedCards = (items) => {
  const row = document.getElementById('fav-featured-row');
  if (!row) return;

  row.innerHTML = items.map(b => `
    <div class="fav-featured-card" data-type="${b.type}" data-id="${b.id}" data-url="${escHtml(b.url)}">
      <div class="fav-featured-title">${escHtml(b.title)}</div>
      <div class="fav-featured-url">${escHtml(b.url)}</div>
      <div class="fav-featured-footer">
        <span class="fav-type-badge">${FAV_TYPES[b.type]?.label ?? b.type}</span>
        <span class="fav-access-badge">${b.accessCount} visita${b.accessCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  `).join('');

  row.querySelectorAll('.fav-featured-card').forEach(card => {
    card.addEventListener('click', () => openFavLink(card.dataset.id, card.dataset.url));
  });
};

// ─────────────────────────────────────
//  Pagination
// ─────────────────────────────────────

const renderFavPagination = (total, totalPages) => {
  const el = document.getElementById('fav-pagination');
  if (!el) return;

  if (totalPages <= 1) { el.innerHTML = ''; return; }

  const pages = [];
  // Always show first, last, current ±2
  const range = new Set([1, totalPages]);
  for (let p = Math.max(1, favPage - 2); p <= Math.min(totalPages, favPage + 2); p++) range.add(p);
  const sorted = [...range].sort((a, b) => a - b);

  let html = `<div class="fav-page-info">${total} links · página ${favPage} de ${totalPages}</div><div class="fav-page-btns">`;

  html += `<button class="fav-page-btn" data-p="${favPage - 1}" ${favPage === 1 ? 'disabled' : ''}>←</button>`;

  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) html += `<span class="fav-page-gap">…</span>`;
    html += `<button class="fav-page-btn ${p === favPage ? 'active' : ''}" data-p="${p}">${p}</button>`;
    prev = p;
  }

  html += `<button class="fav-page-btn" data-p="${favPage + 1}" ${favPage === totalPages ? 'disabled' : ''}>→</button>`;
  html += '</div>';

  el.innerHTML = html;

  el.querySelectorAll('.fav-page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      favPage = Number(btn.dataset.p);
      const grid = document.getElementById('fav-grid');
      const scroll = document.getElementById('fav-scroll');
      renderFavorites();
      // Sobe para o topo do scroll ao trocar de página
      if (scroll) scroll.scrollTop = 0;
    });
  });
};

// ─────────────────────────────────────
//  Build card
// ─────────────────────────────────────

const buildFavCard = (b, index) => {
  const el = document.createElement('div');
  el.className = 'fav-card';
  el.dataset.type = b.type;
  el.dataset.id   = b.id;
  el.style.animationDelay = `${index * 22}ms`;

  const dateStr   = new Date(b.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const typeLabel = FAV_TYPES[b.type]?.label ?? b.type.toUpperCase();

  el.innerHTML = `
    <div class="fav-card-top">
      <span class="fav-type-badge">${typeLabel}</span>
      <div class="fav-card-actions">
        <button class="fav-action-btn" title="Abrir" data-action="open">${ICON('external-link')}</button>
        <button class="fav-action-btn" title="Editar" data-action="edit">${ICON('pencil')}</button>
        <button class="fav-action-btn danger" title="Remover" data-action="delete">${ICON('trash')}</button>
      </div>
    </div>
    <div class="fav-card-title">${favHl(b.title)}</div>
    <div class="fav-card-url">${favHl(b.url)}</div>
    ${b.note ? `<div class="fav-card-note">${favHl(b.note)}</div>` : ''}
    <div class="fav-card-footer">
      <div class="fav-card-tags">
        ${b.tags.map(t => `<span class="fav-card-tag" data-tag="${escHtml(t)}">#${escHtml(t)}</span>`).join('')}
      </div>
      <div class="fav-card-meta">
        <span class="fav-card-cat">${escHtml(b.category)}</span>
        <span class="fav-card-date">${dateStr}</span>
      </div>
    </div>
  `;

  el.querySelector('[data-action="open"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openFavLink(b.id, b.url);
  });
  el.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
    e.stopPropagation();
    openFavEditModal(b);
  });
  el.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteFav(b.id);
  });
  el.querySelectorAll('.fav-card-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      favState.tag = favState.tag === tag.dataset.tag ? null : tag.dataset.tag;
      renderFavSidebar();
      renderFavorites();
    });
  });
  el.addEventListener('dblclick', () => openFavLink(b.id, b.url));

  return el;
};

// ─────────────────────────────────────
//  Open link + record access
// ─────────────────────────────────────

const openFavLink = async (id, url) => {
  // Webview não suporta window.open — usa endpoint do servidor para abrir no browser padrão
  openExternalUrl(url);

  try {
    const res     = await fetch(`/favorites/${id}/access`, { method: 'PUT' });
    const updated = await res.json();
    const idx     = favAll.findIndex(b => b.id === id);
    if (idx !== -1) {
      favAll[idx] = updated;
      favAll.sort((a, b) => {
        if (b.accessCount !== a.accessCount) return b.accessCount - a.accessCount;
        return b.createdAt.localeCompare(a.createdAt);
      });
    }
  } catch { /* silencioso */ }
};

// ─────────────────────────────────────
//  Delete
// ─────────────────────────────────────

const deleteFav = async (id) => {
  try {
    await fetch(`/favorites/${id}`, { method: 'DELETE' });
    favAll = favAll.filter(b => b.id !== id);
    renderFavSidebar();
    renderFavorites();
    toast('Favorito removido');
  } catch {
    toast('Erro ao remover');
  }
};

// ─────────────────────────────────────
//  Modal helpers
// ─────────────────────────────────────

const favDetectType = (url) => {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('slack.com'))                                                     return 'slack';
  if (u.includes('grid.adminml') || u.includes('grid.melioffice'))                 return 'grid';
  if (u.includes('datadog') || u.includes('grafana') || u.includes('amplitude') ||
      u.includes('kibana')  || u.includes('dashboard'))                            return 'dash';
  if (u.includes('github.com') || u.includes('github.dev') ||
      u.includes('githubusercontent'))                                              return 'github';
  return 'site';
};

const favSuggestTitle = (url) => {
  try {
    const u     = new URL(url.startsWith('http') ? url : `https://${url}`);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length) {
      return parts[parts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    return u.hostname.replace(/^www\./, '');
  } catch { return ''; }
};

const selectFavModalType = (type) => {
  favModalType = type;
  document.querySelectorAll('.fav-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.t === type);
  });
  const modal = document.getElementById('fav-modal');
  if (modal) modal.dataset.detected = type;
};

const renderFavModalTags = () => {
  const wrap  = document.getElementById('fav-modal-tags-wrap');
  const input = document.getElementById('fav-modal-tags-input');
  if (!wrap || !input) return;

  wrap.querySelectorAll('.fav-tag-chip').forEach(c => c.remove());
  favModalTags.forEach((tag, i) => {
    const chip = document.createElement('span');
    chip.className = 'fav-tag-chip';
    chip.innerHTML = `#${escHtml(tag)} <span class="fav-tag-chip-rm" data-i="${i}">×</span>`;
    chip.querySelector('.fav-tag-chip-rm').addEventListener('click', () => {
      favModalTags.splice(i, 1);
      renderFavModalTags();
    });
    wrap.insertBefore(chip, input);
  });
};

const renderFavModalCats = () => {
  const sel = document.getElementById('fav-cat-sel');
  if (!sel) return;
  sel.innerHTML = FAV_CATEGORIES.filter(c => c.id !== 'all').map(cat =>
    `<button class="fav-cat-sel-btn ${favModalCat === cat.label ? 'active' : ''}" data-cat="${escHtml(cat.label)}">${escHtml(cat.label)}</button>`
  ).join('');
  sel.querySelectorAll('.fav-cat-sel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      favModalCat = favModalCat === btn.dataset.cat ? '' : btn.dataset.cat;
      renderFavModalCats();
    });
  });
};

// ─────────────────────────────────────
//  Open modal (add)
// ─────────────────────────────────────

const openFavAddModal = () => {
  favEditing   = null;
  favModalTags = [];
  favModalType = 'site';
  favModalCat  = '';

  const titleText = document.getElementById('fav-modal-title-text');
  if (titleText) titleText.textContent = '⚡ Novo Favorito';

  const urlEl   = document.getElementById('fav-modal-url');
  const titleEl = document.getElementById('fav-modal-title');
  const noteEl  = document.getElementById('fav-modal-note');
  const detEl   = document.getElementById('fav-url-detected');

  if (urlEl)   { urlEl.value = '';   urlEl.dataset.auto = '0'; }
  if (titleEl) { titleEl.value = ''; titleEl.dataset.auto = '0'; }
  if (noteEl)  noteEl.value = '';
  if (detEl)   detEl.className = 'fav-url-detected';

  const modal = document.getElementById('fav-modal');
  if (modal) modal.dataset.detected = '';

  selectFavModalType('site');
  renderFavModalTags();
  renderFavModalCats();

  document.getElementById('fav-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('fav-modal-url')?.focus(), 80);
};

// ─────────────────────────────────────
//  Open modal (edit)
// ─────────────────────────────────────

const openFavEditModal = (b) => {
  favEditing   = b;
  favModalTags = [...b.tags];
  favModalType = b.type;
  favModalCat  = b.category;

  const titleText = document.getElementById('fav-modal-title-text');
  if (titleText) titleText.textContent = '✏️ Editar Favorito';

  const urlEl   = document.getElementById('fav-modal-url');
  const titleEl = document.getElementById('fav-modal-title');
  const noteEl  = document.getElementById('fav-modal-note');

  if (urlEl)   urlEl.value   = b.url;
  if (titleEl) titleEl.value = b.title;
  if (noteEl)  noteEl.value  = b.note;

  selectFavModalType(b.type);
  renderFavModalTags();
  renderFavModalCats();

  document.getElementById('fav-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('fav-modal-title')?.focus(), 80);
};

const closeFavModal = () => {
  document.getElementById('fav-modal-overlay')?.classList.remove('open');
};

// ─────────────────────────────────────
//  Save
// ─────────────────────────────────────

const saveFavorite = async () => {
  const url   = document.getElementById('fav-modal-url')?.value.trim() ?? '';
  const title = document.getElementById('fav-modal-title')?.value.trim() ?? '';

  if (!url || !title) { toast('Preencha a URL e o título'); return; }

  const payload = {
    type:     favModalType,
    title,
    url,
    category: favModalCat || 'Produto',
    tags:     [...favModalTags],
    note:     document.getElementById('fav-modal-note')?.value.trim() ?? '',
  };

  try {
    if (favEditing) {
      const res     = await fetch(`/favorites/${favEditing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      const idx     = favAll.findIndex(b => b.id === favEditing.id);
      if (idx !== -1) favAll[idx] = updated;
      toast('Favorito atualizado');
    } else {
      const res     = await fetch('/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      favAll.unshift(created);
      toast('Favorito salvo');
    }

    closeFavModal();
    renderFavSidebar();
    renderFavorites();
  } catch {
    toast('Erro ao salvar favorito');
  }
};

// ─────────────────────────────────────
//  Init — wires all events once on load
// ─────────────────────────────────────

const initFavorites = () => {
  // URL auto-detect + auto-title
  document.getElementById('fav-modal-url')?.addEventListener('input', (e) => {
    const url  = e.target.value.trim();
    const type = favDetectType(url);
    const det  = document.getElementById('fav-url-detected');

    if (type && url.length > 5) {
      det.className = `fav-url-detected visible ${type}`;
      det.textContent = FAV_TYPES[type].label;
      selectFavModalType(type);
    } else if (det) {
      det.className = 'fav-url-detected';
    }

    const titleEl = document.getElementById('fav-modal-title');
    if (titleEl && (!titleEl.value || titleEl.dataset.auto === '1')) {
      const suggested = favSuggestTitle(url);
      if (suggested) { titleEl.value = suggested; titleEl.dataset.auto = '1'; }
    }
  });

  document.getElementById('fav-modal-title')?.addEventListener('input', (e) => {
    e.target.dataset.auto = '0';
  });

  // Tags input
  document.getElementById('fav-modal-tags-input')?.addEventListener('keydown', (e) => {
    const val = e.target.value.trim().replace(/^#/, '');
    if ((e.key === 'Enter' || e.key === ',') && val) {
      e.preventDefault();
      if (!favModalTags.includes(val)) { favModalTags.push(val); renderFavModalTags(); }
      e.target.value = '';
    } else if (e.key === 'Backspace' && !e.target.value && favModalTags.length) {
      favModalTags.pop();
      renderFavModalTags();
    }
  });

  document.getElementById('fav-modal-tags-wrap')?.addEventListener('click', () => {
    document.getElementById('fav-modal-tags-input')?.focus();
  });

  // Type buttons
  document.querySelectorAll('.fav-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selectFavModalType(btn.dataset.t));
  });

  // Modal open/close
  document.getElementById('fav-add-btn')?.addEventListener('click', openFavAddModal);
  document.getElementById('fav-modal-close')?.addEventListener('click', closeFavModal);
  document.getElementById('fav-modal-cancel')?.addEventListener('click', closeFavModal);
  document.getElementById('fav-modal-save')?.addEventListener('click', saveFavorite);

  document.getElementById('fav-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'fav-modal-overlay') closeFavModal();
  });

  // Search
  const searchEl = document.getElementById('fav-search');
  const clearEl  = document.getElementById('fav-search-clear');

  searchEl?.addEventListener('input', (e) => {
    favState.search = e.target.value;
    favPage = 1;
    clearEl?.classList.toggle('visible', !!e.target.value);
    renderFavorites();
  });

  clearEl?.addEventListener('click', () => {
    if (searchEl) searchEl.value = '';
    favState.search = '';
    favPage = 1;
    clearEl.classList.remove('visible');
    searchEl?.focus();
    renderFavorites();
  });

  // Type tabs
  document.querySelectorAll('.fav-type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      favState.type = tab.dataset.type;
      favPage = 1;
      renderFavorites();
    });
  });

  // Keyboard shortcuts (only active in favorites mode)
  document.addEventListener('keydown', (e) => {
    if (currentMode !== 'favorites') return;

    const modalOpen = document.getElementById('fav-modal-overlay')?.classList.contains('open');

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (!modalOpen) openFavAddModal();
    }

    if (e.key === 'Escape' && modalOpen) closeFavModal();

    if (e.key === 'Enter' && modalOpen) {
      const inTags = document.activeElement?.closest('#fav-modal-tags-wrap');
      if (!inTags) { e.preventDefault(); saveFavorite(); }
    }

    // / to focus search when not in an input
    if (!modalOpen && e.key === '/' && !document.activeElement?.closest('input, textarea')) {
      e.preventDefault();
      searchEl?.focus();
    }
  });
};

document.addEventListener('DOMContentLoaded', initFavorites);
