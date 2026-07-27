// ════ Podcasts — ouvir, buscar, organizar em pastas, apagar ════
// A geração acontece só via IA (integrada/externa) batendo na API. Aqui na UI
// não há botão "gerar": só consumo do que já existe.

let allPodcasts = [];
let allFolders = [];
let currentPodcast = null;
let podSearchTimer = null;
let podHealth = null;

// ── Health check das dependências externas ──
const loadPodHealth = async () => {
  const btn = $('pod-health');
  if (!btn) return;
  try {
    const res = await fetch('/podcasts/health');
    podHealth = await res.json();
  } catch {
    podHealth = null;
  }
  renderPodHealth();
};

const renderPodHealth = () => {
  const btn = $('pod-health');
  if (!btn || !podHealth) return;
  btn.classList.remove('pod-health-checking');
  if (podHealth.ready) {
    btn.classList.add('pod-health-ok');
    btn.classList.remove('pod-health-bad');
    btn.innerHTML = `${ICON('mic')}<span>deps OK</span>`;
    btn.title = 'edge-tts, ffmpeg e ffprobe disponíveis';
  } else {
    btn.classList.add('pod-health-bad');
    btn.classList.remove('pod-health-ok');
    btn.innerHTML = `${ICON('audio-lines')}<span>faltam deps</span>`;
    const missing = [
      !podHealth.edgeTts && 'edge-tts',
      !podHealth.ffmpeg && 'ffmpeg',
    ].filter(Boolean).join(', ');
    btn.title = `Faltando: ${missing}. Clique para ver como instalar.`;
  }
};

const togglePodHealth = () => {
  const panel = $('pod-health-panel');
  if (!panel || !podHealth) return;
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    return;
  }
  panel.classList.add('open');
  if (podHealth.ready) {
    panel.innerHTML = `<div class="pod-health-row ok">
      <span>${ICON('mic')} Todas as dependências de áudio estão instaladas:</span>
      <code>edge-tts ✓ · ffmpeg ✓ · ffprobe ✓</code>
    </div>`;
    return;
  }
  panel.innerHTML = '<div class="pod-health-row bad"><span>Dependências faltando para gerar podcasts:</span></div>' +
    podHealth.instructions.map((i) =>
      `<div class="pod-health-cmd"><span class="pod-health-dep">${escHtml(i.dep)}</span><code onclick="copyToClipboard(this.textContent,'Comando copiado')">${escHtml(i.cmd)}</code></div>`
    ).join('') +
    '<div class="pod-health-note">Após instalar, reinicie o docmap. Se o binário não estiver no PATH, defina <code>DOCMAP_EDGE_TTS</code> no arquivo <code>.env</code> da pasta de dados do app.</div>';
};

// ── Lista ──
const loadPodcastsList = async () => {
  loadPodHealth();
  try {
    const [listRes, foldersRes] = await Promise.all([
      fetch('/podcasts'), fetch('/podcasts/folders'),
    ]);
    allPodcasts = await listRes.json();
    allFolders = await foldersRes.json();
    renderPodcastsList();
    renderFolderFilter();
  } catch (err) { console.error('Erro ao carregar podcasts:', err); }
};

const activeFolderFilter = () => $('pod-folder-filter')?.value || '';
const activeSearch = () => $('pod-search')?.value?.trim().toLowerCase() || '';

const renderFolderFilter = () => {
  const sel = $('pod-folder-filter');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todas as pastas</option>' +
    allFolders.map((f) => `<option value="${escHtml(f)}"${f === cur ? ' selected' : ''}>${escHtml(f)}</option>`).join('');
  const dl = $('pod-folder-list');
  if (dl) dl.innerHTML = allFolders.map((f) => `<option value="${escHtml(f)}">`).join('');
};

const renderPodcastsList = () => {
  const list = $('pod-list');
  const q = activeSearch();
  const folder = activeFolderFilter();

  let items = allPodcasts;
  if (folder) items = items.filter((p) => p.folder === folder);
  if (q) items = items.filter((p) => p.title.toLowerCase().includes(q));

  if (!items.length) {
    list.innerHTML = allPodcasts.length
      ? `<div class="pod-empty">Nenhum podcast para este filtro.</div>`
      : `<div class="pod-empty">Nenhum podcast ainda.<br>Peça à IA integrada ou externa para gerar um via <code>POST /podcasts</code>.</div>`;
    return;
  }

  list.innerHTML = items.map((p) => {
    const status = p.status === 'generating'
      ? '<span class="pod-status gen">gerando…</span>'
      : p.status === 'error'
      ? '<span class="pod-status err">erro</span>'
      : '';
    const dur = p.durationMs ? formatDuration(p.durationMs) : '';
    const tags = (p.tags || []).length
      ? `<div class="pod-item-tags">${p.tags.map((t) => `<span class="note-tag">${escHtml(t)}</span>`).join('')}</div>`
      : '';
    return `<div class="pod-item${currentPodcast?.id === p.id ? ' active' : ''}" onclick="openPodcast('${p.id}')">
      <div class="pod-item-top">
        <span class="pod-item-title">${ICON('mic')} ${escHtml(p.title)}</span>
        ${status}
      </div>
      <div class="pod-item-meta">
        <span class="pod-folder">${escHtml(p.folder)}</span>
        <span class="pod-dot">·</span>
        <span>${p.voices?.length || 0} vozes</span>
        ${dur ? `<span class="pod-dot">·</span><span>${dur}</span>` : ''}
      </div>
      ${tags}
    </div>`;
  }).join('');
};

// ── Abrir ──
const openPodcast = async (id) => {
  if (currentMode !== 'podcasts') setMode('podcasts');
  try {
    const res = await fetch('/podcasts/' + id);
    currentPodcast = await res.json();
    fillPodcastPlayer(currentPodcast);
    renderPodcastsList();
  } catch (err) { console.error('Erro ao abrir podcast:', err); }
};

const fillPodcastPlayer = (p) => {
  $('pod-empty').style.display = 'none';
  $('pod-detail').style.display = 'flex';

  const titleInput = $('pod-title-input');
  const folderInput = $('pod-folder-input');
  const tagsInput  = $('pod-tags-input');
  if (document.activeElement !== titleInput) titleInput.value = p.title;
  if (document.activeElement !== tagsInput) tagsInput.value = (p.tags || []).join(', ');
  if (document.activeElement !== folderInput) folderInput.value = p.folder;

  $('pod-id-badge').textContent = p.id.slice(0, 8);
  $('btn-pod-delete').style.display = 'inline-flex';
  $('btn-pod-copy').style.display = 'inline-flex';

  renderPodStatus(p);
  renderPodScript(p);
  // Dispara setup (ou teardown) de slides conforme o caso.
  void setupSlides(p);
};

const renderPodStatus = (p) => {
  const audio = $('pod-audio');
  const wrap = $('pod-audio-wrap');
  const meta = $('pod-meta');

  if (p.status === 'generating') {
    wrap.style.display = 'none';
    meta.innerHTML = `<span class="pod-status gen">${ICON('refresh-cw')} gerando áudio…</span>`;
  } else if (p.status === 'error') {
    wrap.style.display = 'none';
    meta.innerHTML = `<span class="pod-status err">erro: ${escHtml(p.error || 'desconhecido')}</span>`;
  } else {
    wrap.style.display = 'block';
    audio.src = '/podcasts/' + p.id + '/audio';
    audio.load();
    const voices = (p.voices || []).map((v) => escHtml(v.name)).join(' · ');
    meta.innerHTML = [
      p.durationMs ? `<span>${ICON('clock')} ${formatDuration(p.durationMs)}</span>` : '',
      voices ? `<span>${ICON('audio-lines')} ${voices}</span>` : '',
      `<span>${ICON('folder')} ${escHtml(p.folder)}</span>`,
      `<span>${new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>`,
    ].join('');
  }
};

const renderPodScript = (p) => {
  const box = $('pod-script');
  if (!p.script || p.status !== 'ready') {
    box.innerHTML = p.status === 'generating'
      ? '<div class="pod-script-pending">Roteiro será exibido quando o áudio estiver pronto.</div>'
      : '';
    return;
  }
  // Quebra o script em falas por persona, com cor por índice.
  const voiceNames = (p.voices || []).map((v) => v.name);
  const colorOf = (name) => {
    const idx = voiceNames.indexOf(name);
    return idx < 0 ? 'var(--text-2)' : `hsl(${(idx * 137) % 360} 55% 62%)`;
  };
  const re = /<([A-Za-z][A-Za-z0-9_-]*)>([\s\S]*?)<\/\1>/g;
  let html = '';
  let m;
  while ((m = re.exec(p.script)) !== null) {
    const name = m[1];
    const text = m[2].trim();
    if (!text) continue;
    html += `<div class="pod-line">
      <span class="pod-line-name" style="color:${colorOf(name)}">${escHtml(name)}</span>
      <span class="pod-line-text">${escHtml(text)}</span>
    </div>`;
  }
  box.innerHTML = html || `<div class="pod-script-pending">Roteiro sem falas parseáveis.</div>`;
};

// ── Editar metadados (title/folder/tags) ──
const savePodcastMeta = async () => {
  if (!currentPodcast) return;
  const title = $('pod-title-input').value.trim();
  const folder = $('pod-folder-input').value.trim() || 'geral';
  const tags  = $('pod-tags-input').value.split(',').map((t) => t.trim()).filter(Boolean);
  if (!title) { $('pod-title-input').focus(); return toast('Título obrigatório'); }
  try {
    const res = await fetch('/podcasts/' + currentPodcast.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, folder, tags }),
    });
    if (res.ok) {
      currentPodcast = { ...currentPodcast, title, folder, tags };
      renderPodcastsList();
      toast('Podcast atualizado');
    } else {
      // Restaura valores anteriores no DOM
      $('pod-title-input').value = currentPodcast.title;
      $('pod-folder-input').value = currentPodcast.folder;
      $('pod-tags-input').value = (currentPodcast.tags || []).join(', ');
      toast('Erro ao atualizar');
    }
  } catch { toast('Erro ao atualizar'); }
};

const deleteCurrentPodcast = async () => {
  if (!currentPodcast) return;
  const ok = await confirmDialog(`Excluir o podcast "${currentPodcast.title}"?`, { danger: true, okLabel: 'Excluir' });
  if (!ok) return;
  await fetch('/podcasts/' + currentPodcast.id, { method: 'DELETE' });
  currentPodcast = null;
  $('pod-detail').style.display = 'none';
  $('pod-empty').style.display = 'flex';
  loadPodcastsList();
  toast('Podcast excluído');
};

const copyPodcastLink = () => {
  if (!currentPodcast) return;
  copyToClipboard(
    `http://127.0.0.1:3333/#podcast/${currentPodcast.id}`,
    'Link copiado',
  );
};

const formatDuration = (ms) => {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

// ── Filtros ──
$('pod-search')?.addEventListener('input', () => {
  clearTimeout(podSearchTimer);
  podSearchTimer = setTimeout(renderPodcastsList, 150);
});
$('pod-folder-filter')?.addEventListener('change', renderPodcastsList);

// Salvar título/pasta ao perder foco
$('pod-title-input')?.addEventListener('blur', savePodcastMeta);
$('pod-folder-input')?.addEventListener('blur', savePodcastMeta);
$('pod-tags-input')?.addEventListener('blur', savePodcastMeta);

// ── SSE: atualiza status de geração em tempo real ──
const connectPodcastEvents = () => {
  const es = new EventSource('/podcasts/events');

  es.addEventListener('created', (e) => {
    const { podcast } = JSON.parse(e.data);
    if (!allPodcasts.find((p) => p.id === podcast.id)) {
      allPodcasts = [podcast, ...allPodcasts];
      renderPodcastsList();
    }
  });

  es.addEventListener('progress', (e) => {
    const { id, stage, detail } = JSON.parse(e.data);
    const item = allPodcasts.find((p) => p.id === id);
    if (!item) return;
    item.status = 'generating';
    renderPodcastsList();
    if (currentPodcast?.id === id) {
      const label = stage === 'script' ? 'escrevendo roteiro…'
        : stage === 'slides' ? `compondo slides ${detail || ''}`
        : stage === 'tts' ? `sintetizando vozes ${detail || ''}`
        : stage === 'concat' ? 'montando áudio…' : 'processando…';
      $('pod-meta').innerHTML = `<span class="pod-status gen">${ICON('refresh-cw')} ${label}</span>`;
    }
  });

  es.addEventListener('ready', (e) => {
    const { podcast } = JSON.parse(e.data);
    allPodcasts = allPodcasts.map((p) => p.id === podcast.id
      ? { ...p, status: 'ready', durationMs: podcast.durationMs }
      : p);
    renderPodcastsList();
    if (currentPodcast?.id === podcast.id) {
      currentPodcast = { ...currentPodcast, status: 'ready', durationMs: podcast.durationMs };
      renderPodStatus(currentPodcast);
      // Recarrega o roteiro agora que está disponível.
      openPodcast(podcast.id);
    }
  });

  es.addEventListener('error', (e) => {
    try {
      const { id, error } = JSON.parse(e.data);
      allPodcasts = allPodcasts.map((p) => p.id === id ? { ...p, status: 'error' } : p);
      renderPodcastsList();
      if (currentPodcast?.id === id) {
        currentPodcast = { ...currentPodcast, status: 'error', error };
        renderPodStatus(currentPodcast);
      }
    } catch { /* reconexão automática do EventSource */ }
  });

  es.addEventListener('deleted', (e) => {
    const { id } = JSON.parse(e.data);
    allPodcasts = allPodcasts.filter((p) => p.id !== id);
    if (currentPodcast?.id === id) {
      currentPodcast = null;
      $('pod-detail').style.display = 'none';
      $('pod-empty').style.display = 'flex';
    }
    renderPodcastsList();
  });

  es.addEventListener('updated', (e) => {
    const { podcast } = JSON.parse(e.data);
    allPodcasts = allPodcasts.map((p) => p.id === podcast.id
      ? { ...p, ...podcast }
      : p);
    renderPodcastsList();
    if (currentPodcast?.id === podcast.id) {
      currentPodcast = { ...currentPodcast, ...podcast };
      fillPodcastPlayer(currentPodcast);
    }
  });
};

// ── Slides (sync via requestAnimationFrame) ──
// Shadow DOM isola o CSS dos slides da UI do docmap. O rAF lê
// audio.currentTime e troca o slide ativo aplicando [data-state] nos
// <section>. Funciona com pause, seek, playbackRate — tudo reage ao
// "tempo de mídia" (currentTime), não ao tempo de parede.

let slidesShadow = null;
let slidesRaf = null;
let slidesMap = [];
let slidesActiveIdx = -1;
let slidesLeaveTimer = null;

const SLIDE_LEAVE_MS = 700;

const teardownSlides = () => {
  if (slidesRaf) cancelAnimationFrame(slidesRaf);
  slidesRaf = null;
  if (slidesLeaveTimer) clearTimeout(slidesLeaveTimer);
  slidesLeaveTimer = null;
  if (slidesShadow) slidesShadow.innerHTML = '';
  slidesMap = [];
  slidesActiveIdx = -1;
  $('pod-slides-stage').style.display = 'none';
  $('pod-script').style.display = '';
};

const setSlideState = (index, state) => {
  if (!slidesShadow || index < 0 || index >= slidesMap.length) return;
  const el = slidesShadow.querySelector(
    `section[data-slide="${slidesMap[index].index}"]`,
  );
  if (el) el.setAttribute('data-state', state);
};

const applySlideTransition = (newIdx) => {
  if (newIdx === slidesActiveIdx) return;
  const prevIdx = slidesActiveIdx;
  slidesActiveIdx = newIdx;

  // Slide anterior: marca leaving e esconde após a animação de saída.
  if (prevIdx >= 0) {
    setSlideState(prevIdx, 'leaving');
    const prevEl = slidesMap[prevIdx];
    if (slidesLeaveTimer) clearTimeout(slidesLeaveTimer);
    slidesLeaveTimer = setTimeout(() => {
      // Só esconde se ainda estiver leaving (não foi reativado).
      const el = slidesShadow?.querySelector(
        `section[data-slide="${prevEl.index}"]`,
      );
      if (el && el.getAttribute('data-state') === 'leaving') {
        el.setAttribute('data-state', 'hidden');
      }
    }, SLIDE_LEAVE_MS);
  }

  // Novo slide: entering → active no próximo frame.
  if (newIdx >= 0) {
    setSlideState(newIdx, 'entering');
    requestAnimationFrame(() => setSlideState(newIdx, 'active'));
    updateSlidesBar(newIdx);
  }
};

const updateSlidesBar = (idx) => {
  if (idx < 0 || idx >= slidesMap.length) return;
  const s = slidesMap[idx];
  $('pod-slide-counter').textContent = `${idx + 1} / ${slidesMap.length}`;
  $('pod-slide-title').textContent = s.title || '';
};

const findSlideAt = (tMs) => {
  // Busca linear — slideMap é pequeno (dezenas). Pode trocar por binária.
  let idx = -1;
  for (let i = 0; i < slidesMap.length; i++) {
    if (slidesMap[i].enterMs <= tMs) idx = i;
    else break;
  }
  return idx;
};

const startSlidesSync = () => {
  if (slidesRaf) cancelAnimationFrame(slidesRaf);
  const audio = $('pod-audio');
  if (!audio) return;

  const tick = () => {
    slidesRaf = requestAnimationFrame(tick);
    if (!slidesShadow || !audio.duration) return;
    const tMs = audio.currentTime * 1000;
    const idx = findSlideAt(tMs);
    if (idx !== slidesActiveIdx) applySlideTransition(idx);
  };
  slidesRaf = requestAnimationFrame(tick);
};

const setupSlides = async (p) => {
  // Sem slides → comportamento legado (só roteiro).
  if (!p.withSlides || !p.slideMap || p.slideMap.length === 0 || p.status !== 'ready') {
    teardownSlides();
    return;
  }
  try {
    const res = await fetch(`/podcasts/${p.id}/slides`);
    if (!res.ok) { teardownSlides(); return; }
    const doc = await res.text();

    if (!slidesShadow) {
      slidesShadow = $('pod-slides-host').attachShadow({ mode: 'open' });
    }
    slidesShadow.innerHTML = doc;

    // Ordena por enterMs e zera estados.
    slidesMap = [...p.slideMap].sort((a, b) => a.enterMs - b.enterMs);
    slidesActiveIdx = -1;
    const sections = slidesShadow.querySelectorAll('section[data-slide]');
    sections.forEach((s) => s.setAttribute('data-state', 'hidden'));

    $('pod-slides-stage').style.display = 'flex';
    $('pod-script').style.display = 'none';

    // Estado inicial: mostra o primeiro slide antes do áudio tocar.
    applySlideTransition(0);
    startSlidesSync();
  } catch (err) {
    console.error('Erro ao carregar slides:', err);
    teardownSlides();
  }
};

// ── Controles da barra de slides ──
const seekToSlide = (idx) => {
  if (idx < 0 || idx >= slidesMap.length) return;
  const audio = $('pod-audio');
  if (!audio) return;
  audio.currentTime = slidesMap[idx].enterMs / 1000;
};

const slidesNext = () => {
  if (slidesActiveIdx < 0) return;
  const next = Math.min(slidesActiveIdx + 1, slidesMap.length - 1);
  seekToSlide(next);
};

const slidesPrev = () => {
  if (slidesActiveIdx < 0) return;
  const prev = Math.max(slidesActiveIdx - 1, 0);
  seekToSlide(prev);
};

const slidesFullscreen = async () => {
  const host = $('pod-slides-host');
  if (!host) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => {});
  } else {
    await host.requestFullscreen?.().catch(() => {});
  }
};

$('btn-slide-prev')?.addEventListener('click', slidesPrev);
$('btn-slide-next')?.addEventListener('click', slidesNext);
$('btn-slide-full')?.addEventListener('click', slidesFullscreen);

// Atalhos de teclado quando o stage está visível.
document.addEventListener('keydown', (e) => {
  if ($('pod-slides-stage').style.display !== 'flex') return;
  if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') { slidesNext(); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { slidesPrev(); e.preventDefault(); }
  if (e.key === 'f' || e.key === 'F') { slidesFullscreen(); }
});

connectPodcastEvents();
