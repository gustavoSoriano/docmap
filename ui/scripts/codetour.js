// ==== Caderno v7 — reels: uma ideia por tela ====
// Fluxo: 1 seleciona pasta (scan automático) → 2 fala o que quer + depth
// → 3 a IA devolve o caderno sozinha via POST (/codetour/import).
// Render: trilho vertical com snap, HUD estilo Stories, snippet real com
// linhas marcadas e micro-animações. Visuais (mermaid/mindmap/html/bubble)
// são OPCIONAIS e montam só na tela ativa.
// depends on: dom.js ($, escHtml, toast, copyToClipboard), vendored
// d3/markmap/mermaid/DOMPurify.

let ctRoot = '';
let ctSession = null;
let ctReelData = null;
let ctSlides = [];
let ctSlideIdx = 0;
let ctPollTimer = null;
let ctPollId = '';
let ctDepth = 'repasse';
let ctNotebook = null;
let ctLibrary = [];
let ctNarrPlaying = false;
let ctNarrReelId = '';
let ctBooting = true;
let ctCurrent = -1;
// Prompt por caderno pendente (id → texto) — p/ reabrir "copiar prompt".
const ctPrompts = new Map();
const ctVisualMounts = new Map();
let ctListened = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('ct-listened') || '[]');
  if (Array.isArray(saved)) ctListened = new Set(saved);
} catch { /* sem cache */ }

const CT_ARTIFACT_DEFS = [
  ['audio', '🔊 Áudio'],
  ['podcast', '🎙 Podcast'],
  ['bubble', '🫧 Bolhas'],
  ['mindmap', '🧠 Mapa mental'],
  ['diagrams', '📊 Diagramas'],
  ['tables', '📋 Tabelas'],
];
let ctArtifacts = CT_ARTIFACT_DEFS.map(([k]) => k);
try {
  const savedArts = JSON.parse(localStorage.getItem('ct-artifacts') || '[]');
  if (Array.isArray(savedArts) && savedArts.length) {
    const valid = savedArts.filter((a) => CT_ARTIFACT_DEFS.some(([k]) => k === a));
    if (valid.length) ctArtifacts = valid;
  }
} catch { /* padrão: todos */ }

const setCtDepth = (depth) => {
  ctDepth = depth;
  document.querySelectorAll('input[name="ct-depth"]').forEach((r) => {
    r.checked = r.value === depth;
  });
};

// ════ Sessão ════

const ctLoadNotebookMeta = async (id) => {
  if (!id) return null;
  try {
    const res = await fetch(`/tours/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.notebook || null;
  } catch { return null; }
};

const loadCodetour = async () => {
  try {
    const res = await fetch('/codetour/session');
    ctSession = (await res.json()).session || null;
    if (ctSession) {
      ctRoot = ctSession.projectRoot;
      if (ctSession.depth) setCtDepth(ctSession.depth);
    }
  } catch { ctSession = null; }
  renderCodetour();
  if (ctSession?.reel) {
    const nb = await ctLoadNotebookMeta(ctSession.id);
    if (nb) { ctNotebook = nb; renderCtHeroExtras(); }
  } else if (ctSession) {
    const nb = await ctLoadNotebookMeta(ctSession.id);
    if (nb && nb.status === 'pending') {
      ctNotebook = nb;
      await ctShowPending(nb);
    }
  }
  loadCtLibrary();
  if (ctNotebook?.status === 'pending') startCtPoll(ctNotebook.id);
  else startCtPoll('');
};

const pickCodetourFolder = async () => {
  try {
    const res = await fetch('/codetour/pick-folder');
    const data = await res.json();
    if (data.cancelled || !data.path) return;
    ctRoot = data.path;
    if ($('ct-f-path')) $('ct-f-path').textContent = ctRoot;
    toast('Pasta selecionada');
    if ($('ct-form-overlay')?.style.display !== 'none') $('ct-f-query')?.focus();
  } catch { toast('Erro ao abrir pasta'); }
};

// ── Form de criação: pasta + foco + profundidade + artefatos ──
const ctRenderFormArtifacts = () => {
  const box = $('ct-f-artifacts');
  if (!box || box.dataset.done) return;
  box.dataset.done = '1';
  for (const [key, label] of CT_ARTIFACT_DEFS) {
    const lab = document.createElement('label');
    lab.innerHTML = `<input type="checkbox" value="${key}" ${
      ctArtifacts.includes(key) ? 'checked' : ''
    } /> ${escHtml(label)}`;
    box.appendChild(lab);
  }
};

const ctOpenForm = () => {
  const ov = $('ct-form-overlay');
  if (!ov) return;
  ctRenderFormArtifacts();
  if ($('ct-f-path')) {
    $('ct-f-path').textContent = ctRoot || ctSession?.projectRoot || 'nenhuma pasta';
  }
  const q = $('ct-f-query');
  if (q && !q.value && ctSession && !ctReelData) q.value = ctSession.query || '';
  setCtDepth(ctDepth);
  ov.style.display = '';
  $('ct-f-query')?.focus();
};

const ctCloseForm = () => {
  const ov = $('ct-form-overlay');
  if (ov) ov.style.display = 'none';
};

const ctSubmitForm = async () => {
  const query = $('ct-f-query')?.value?.trim() || '';
  const depth = document.querySelector('input[name="ct-depth"]:checked')?.value || ctDepth;
  const arts = [...document.querySelectorAll('#ct-f-artifacts input:checked')].map((c) => c.value);
  if (!ctRoot && !ctSession) return toast('Selecione a pasta primeiro');
  if (!query) { $('ct-f-query')?.focus(); return toast('Diga o que quer estudar'); }
  ctDepth = depth;
  ctArtifacts = arts;
  try {
    localStorage.setItem('ct-artifacts', JSON.stringify(ctArtifacts));
  } catch { /* sem cache */ }
  try {
    const res = await fetch('/codetour/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectRoot: ctRoot || ctSession.projectRoot, query, depth, artifacts: arts }),
    });
    if (!res.ok) return toast(await res.text() || 'Erro ao gerar');
    const data = await res.json();
    // Caderno já registrado e listado — pendência é só do agente.
    ctSession = data.session;
    ctNotebook = data.notebook;
    ctRoot = ctSession.projectRoot;
    if (data.agentPrompt) ctPrompts.set(ctSession.id, data.agentPrompt);
    ctDebug('decision', 'caderno pendente criado', {
      id: ctSession.id,
      query,
      depth,
      artifacts: arts.join(','),
    });
    ctSlideIdx = 0;
    ctCloseForm();
    if ($('ct-f-query')) $('ct-f-query').value = '';
    copyToClipboard(data.agentPrompt, 'Prompt copiado — cole na IA');
    loadCtLibrary();
    ctShowPending(data.notebook, data.agentPrompt);
    startCtPoll(ctSession.id);
  } catch { toast('Erro ao gerar'); }
};

// ════ Caderno pendente (aguardando o agente) ════

const ctShowPending = async (nb, prompt) => {
  ctNotebook = nb || ctNotebook;
  const box = $('ct-pending');
  if (!box || !nb) return;
  if ($('ct-empty')) $('ct-empty').style.display = 'none';
  if ($('ct-active')) $('ct-active').style.display = 'none';
  box.style.display = '';
  if ($('ct-pending-title')) $('ct-pending-title').textContent = nb.query || nb.title;
  if ($('ct-pending-path')) {
    $('ct-pending-path').textContent = nb.projectRoot || '';
    $('ct-pending-path').title = nb.projectRoot || '';
  }
  const pre = $('ct-pending-prompt');
  if (pre) {
    if (!prompt) {
      try {
        const res = await fetch(`/codetour/agent-prompt?id=${encodeURIComponent(nb.id)}`);
        const data = res.ok ? await res.json() : null;
        prompt = data?.prompt || '';
      } catch { prompt = ''; }
    }
    if (prompt) ctPrompts.set(nb.id, prompt);
    pre.textContent = prompt || 'Prompt indisponível — o agente deve usar POST /codetour/import.';
    pre.dataset.hasPrompt = prompt ? '1' : '';
  }
  requestAnimationFrame(() => pre?.scrollIntoView({ block: 'nearest' }));
};

const ctHidePending = () => {
  if ($('ct-pending')) $('ct-pending').style.display = 'none';
};

const ctCancelPending = async () => {
  const nb = ctNotebook;
  if (!nb || !nb.id) return;
  stopCtPoll();
  try {
    const res = await fetch(`/tours/${encodeURIComponent(nb.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refs: { podcast: false, canvas: false, audio: false } }),
    });
    if (!res.ok && res.status !== 404) return toast(await res.text() || 'Erro ao cancelar');
    ctPrompts.delete(nb.id);
    toast('Caderno cancelado');
    ctSession = null;
    ctReelData = null;
    ctNotebook = null;
    ctSlides = [];
    ctHidePending();
    renderCodetour();
    loadCtLibrary();
  } catch { toast('Erro ao cancelar'); }
};

const ctCopyPendingPrompt = () => {
  const nb = ctNotebook;
  const prompt = nb && ctPrompts.get(nb.id) || $('ct-pending-prompt')?.textContent || '';
  if (!prompt.trim()) return toast('Prompt indisponível');
  copyToClipboard(prompt, 'Prompt copiado');
};

const ctPollPending = async (id) => {
  try {
    const res = await fetch(`/codetour/session?id=${encodeURIComponent(id)}`);
    const data = res.ok ? await res.json() : null;
    if (data?.session?.reel) {
      ctSession = data.session;
      ctSlideIdx = 0;
      ctHidePending();
      renderCodetour();
      ctDebug('log', 'import confirmado — caderno pronto', {
        id,
        telas: data.session.reel?.reels?.length ?? 0,
      });
      const nb = await ctLoadNotebookMeta(id);
      if (nb) { ctNotebook = nb; renderCtHeroExtras(); }
      loadCtLibrary();
      toast('Caderno pronto e salvo');
      stopCtPoll();
      return;
    }
    const nb = await ctLoadNotebookMeta(id);
    if (nb && nb.status === 'ready') {
      // App reiniciou e perdeu a sessão: abre pelo corpo gravado.
      ctDebug('log', 'sessão perdida — reabrindo pelo disco', { id });
      await ctOpenNotebook(id);
      stopCtPoll();
      return;
    }
  } catch { /* próximo tick */ }
};

const startCtPoll = (id) => {
  if (id && ctPollId === id && ctPollTimer) return;
  stopCtPoll();
  if (!id) return;
  ctPollId = id;
  ctPollTimer = setInterval(async () => {
    if (currentMode !== 'codetour') return;
    const nb = ctNotebook;
    if (!nb || nb.id !== id) { stopCtPoll(); return; }
    if (nb.status !== 'pending') { stopCtPoll(); return; }
    ctPollPending(id);
  }, 2000);
};

const stopCtPoll = () => {
  if (ctPollTimer) clearInterval(ctPollTimer);
  ctPollTimer = null;
};

const clearCodetour = async () => {
  await fetch('/codetour/clear', { method: 'POST' });
  ctClearPollSoon();
  ctStopNarration();
  ctTeardownVisuals();
  ctSession = null;
  ctReelData = null;
  ctSlides = [];
  ctRoot = '';
  ctSlideIdx = 0;
  ctCurrent = -1;
  ctNotebook = null;
  ctHidePending();
  renderCodetour();
  renderCtLibrary();
};

// ════ Montagem das telas ════

const buildSlides = (reel) => {
  const out = [{
    type: 'cover',
    label: 'caderno',
    title: reel.topic,
    sub: reel.goal,
    foot: '<div class="bob" style="font-size:30px;color:var(--ct-muted)">↓</div>',
  }];
  for (const r of reel.reels) {
    out.push({
      type: 'reel',
      reelId: r.id,
      label: r.label,
      title: r.title,
      code: r.code,
      visual: r.visual,
      rule: r.rule,
      sub: r.sub,
    });
  }
  out.push({
    type: 'end',
    label: 'fim',
    title: 'Fim do caderno',
    sub: 'Agora leia o código na ordem dos arquivos.',
    foot: '<span class="ct-chip">arrasta ↑ pra recomeçar</span>',
  });
  return out;
};

/* ── realce de código (sem dependências, seguro contra XSS) ── */
const CT_KW = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'await', 'async', 'import', 'from', 'export', 'type', 'readonly', 'null',
  'undefined', 'true', 'false', 'new', 'of', 'in', 'try', 'catch', 'throw',
  'class', 'extends', 'interface', 'as', 'void', 'this', 'typeof',
  'instanceof', 'delete', 'default', 'switch', 'case', 'break', 'continue',
  'static', 'never', 'unknown', 'string', 'number', 'boolean', 'Promise',
  'Deno', 'crypto', 'satisfies', 'keyof', 'infer', 'enum', 'implements',
  'public', 'private', 'protected', 'super', 'do', 'finally',
]);
const CT_TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:[^`\\]|\\[\s\S])*`?|"[^"\n]*"|'[^'\n]*')|(\b\d[\w.]*\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|([^\sA-Za-z0-9_$]+)|(\s+)/g;

const ctHlLine = (line) => {
  let out = '', last = 0, m;
  CT_TOKEN_RE.lastIndex = 0;
  while ((m = CT_TOKEN_RE.exec(line))) {
    if (m.index > last) out += escHtml(line.slice(last, m.index));
    last = CT_TOKEN_RE.lastIndex;
    const t = escHtml(m[0]);
    if (m[1]) out += `<span class="tok-c">${t}</span>`;
    else if (m[2]) out += `<span class="tok-s">${t}</span>`;
    else if (m[3]) out += `<span class="tok-n">${t}</span>`;
    else if (m[4]) out += `<span class="tok-f">${t}</span>`;
    else if (m[5]) {
      if (CT_KW.has(m[0])) out += `<span class="tok-k">${t}</span>`;
      else if (/^[A-Z]/.test(m[0])) out += `<span class="tok-t">${t}</span>`;
      else out += t;
    } else if (m[6]) out += escHtml(m[6]);
    else out += m[7];
  }
  if (line.length > last) out += escHtml(line.slice(last));
  return out;
};

const ctCodeBlock = (c) => {
  const m = /:(\d+)$/.exec(c.file || '');
  const from = m ? Number(m[1]) : 1;
  const path = String(c.file || '').replace(/:\d+$/, '');
  const lines = String(c.code || '').replace(/\n+$/, '').split('\n');
  const mark = Array.isArray(c.mark) ? c.mark : [];
  const end = from + lines.length - 1;
  const rows = lines.map((ln, i) => {
    const n = from + i;
    const cls = 'cl' + (mark.includes(n) ? ' mark' : '');
    return `<span class="${cls}" style="--i:${i}" data-n="${n}">${
      ctHlLine(ln) || '&nbsp;'
    }</span>`;
  }).join('\n');
  const label = from === end ? `linha ${from}` : `linhas ${from}–${end}`;
  return `<figure class="source"><figcaption>${escHtml(path)} · ${label}</figcaption><pre class="code">${rows}</pre></figure>`;
};

const ctRuleBlock = (r) => {
  const head = r.file
    ? `<div class="rule-head">${escHtml(r.file)}</div>`
    : '';
  return `<div class="rule">${head}<p>${escHtml(r.text || '')}</p></div>`;
};

const ctVisualBlock = (vis, i) => `<div class="ct-reel-visual" data-vi="${i}"></div>`;

const ctBuildSlide = (s, i) => {
  let k = 0;
  const parts = [];
  parts.push(`<div class="kicker r" style="--i:${k++}">${escHtml(s.label)}</div>`);
  parts.push(`<h2 class="r" style="--i:${k++}">${escHtml(s.title)}</h2>`);
  if (s.visual) parts.push(`<div class="r" style="--i:${k++}">${ctVisualBlock(s.visual, i)}</div>`);
  if (s.code) parts.push(`<div class="r" style="--i:${k++}">${ctCodeBlock(s.code)}</div>`);
  if (s.rule) parts.push(`<div class="r" style="--i:${k++}">${ctRuleBlock(s.rule)}</div>`);
  if (s.sub) parts.push(`<p class="sub r" style="--i:${k++}">${escHtml(s.sub)}</p>`);
  if (s.foot) parts.push(`<div class="r" style="--i:${k++}">${s.foot}</div>`);
  return `<section class="ct-slide" data-i="${i}"><div class="ct-card">${parts.join('')}</div></section>`;
};

const ctTeardownVisuals = () => {
  for (const clean of ctVisualMounts.values()) {
    try { clean(); } catch { /* já limpo */ }
  }
  ctVisualMounts.clear();
};

const renderCodetour = () => {
  const reel = ctSession?.reel || null;
  ctReelData = reel;
  const has = !!reel;
  const pendingOpen = $('ct-pending')?.style.display !== 'none';
  if ($('ct-empty')) $('ct-empty').style.display = has || pendingOpen ? 'none' : 'block';
  if ($('ct-active')) $('ct-active').style.display = has ? 'block' : 'none';
  const clearBtn = $('ct-clear-btn');
  if (clearBtn) clearBtn.style.display = ctSession ? '' : 'none';
  if (!has) { ctSlides = []; return; }

  ctSlides = buildSlides(reel);
  ctRebuild();
  renderCtHeroExtras();
};

const ctRebuild = () => {
  ctStopNarration();
  ctTeardownVisuals();
  const reels = $('ct-reels');
  const segs = $('ct-segs');
  if (!reels) return;
  reels.innerHTML = ctSlides.map(ctBuildSlide).join('');
  if (segs) segs.innerHTML = ctSlides.map(() => '<i></i>').join('');
  ctCurrent = -1;
  ctBooting = true;
  ctMountObserver();
  requestAnimationFrame(() => {
    ctSetCurrent(0);
    requestAnimationFrame(() => { ctBooting = false; });
  });
};

let ctObserver = null;
const ctMountObserver = () => {
  const reels = $('ct-reels');
  if (!reels) return;
  if (ctObserver) ctObserver.disconnect();
  const els = Array.from(reels.children);
  ctObserver = new IntersectionObserver((entries) => {
    if (ctBooting) return;
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        ctSetCurrent(Number(e.target.dataset.i));
      }
    }
  }, { root: reels, threshold: [0.6] });
  els.forEach((el) => ctObserver.observe(el));
};

const ctSetCurrent = (idx) => {
  if (idx === ctCurrent || idx < 0 || idx >= ctSlides.length) return;
  ctCurrent = idx;
  ctSlideIdx = idx;
  const reels = $('ct-reels');
  if (reels) {
    Array.from(reels.children).forEach((el, i) =>
      el.classList.toggle('active', i === idx)
    );
  }
  const segs = $('ct-segs');
  if (segs) {
    Array.from(segs.children).forEach((el, i) => {
      el.className = i < idx ? 'done' : (i === idx ? 'now' : '');
    });
  }
  if ($('ct-counter')) $('ct-counter').textContent = `${idx + 1}/${ctSlides.length}`;
  const up = $('ct-up');
  const down = $('ct-down');
  if (up) up.disabled = idx === 0;
  if (down) down.disabled = idx === ctSlides.length - 1;
  ctMountActiveVisual(idx);
  const slide = ctSlides[idx];
  const isReel = slide?.type === 'reel' && slide.reelId;
  const btn = $('ct-narr-btn');
  if (btn) btn.style.display = isReel ? '' : 'none';
  if (isReel) ctSetNarrStatus('');
};

// ════ Visuais (opcionais) — montam só na tela ativa ════

const ctMountActiveVisual = (idx) => {
  const reels = $('ct-reels');
  const slide = ctSlides[idx];
  if (!reels || !slide?.visual) return;
  const el = reels.children[idx];
  const box = el?.querySelector('.ct-reel-visual');
  if (!box || box.dataset.mounted === '1') return;
  box.dataset.mounted = '1';
  const cleanup = ctMountVisual(box, slide.visual);
  if (cleanup) ctVisualMounts.set(idx, cleanup);
};

const ctMountVisual = (box, vis) => {
  if (vis.kind === 'mermaid') return ctMountMermaid(box, vis);
  if (vis.kind === 'mindmap') return ctMountMindmap(box, vis);
  if (vis.kind === 'bubble') return ctMountBubble(box, vis);
  box.innerHTML = `<div class="ct-vhtml">${ctSanitizeHtml(vis.content)}</div>`;
  return null;
};

const ctSanitizeHtml = (raw) => {
  if (!window.DOMPurify) return escHtml(raw);
  return window.DOMPurify.sanitize(String(raw ?? ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'video', 'audio'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onsubmit'],
  });
};

const ctIsDark = () =>
  document.documentElement.getAttribute('data-theme') !== 'light';
const ctToken = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const CT_LAYER_DEFS =
  '\nclassDef api fill:#60a5fa,stroke:#1e3a5f,color:#0b0c0e,stroke-width:2px;\nclassDef service fill:#37d99a,stroke:#0f3d2e,color:#0b0c0e,stroke-width:2px;\nclassDef data fill:#fbbf24,stroke:#4a3a12,color:#0b0c0e,stroke-width:2px;\nclassDef ui fill:#f472b6,stroke:#4a1f38,color:#0b0c0e,stroke-width:2px;\nclassDef test fill:#9aa1ad,stroke:#2a2f36,color:#0b0c0e,stroke-width:2px;\nclassDef util fill:#3a4150,stroke:#6b7280,color:#eef1f5,stroke-width:2px;';

const ctMountMermaid = (box, vis) => {
  if (!window.mermaid) {
    box.innerHTML = '<div class="ct-reel-note">Mermaid indisponível.</div>';
    return null;
  }
  try {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: ctIsDark() ? 'dark' : 'default',
      securityLevel: 'strict',
      // useMaxWidth FALSE = diagrama no tamanho natural (sem espremer o
      // grafo pra dentro do max-width), rolável dentro do canvas.
      flowchart: { curve: 'linear', htmlLabels: false, useMaxWidth: false },
    });
  } catch { /* já inicializado */ }
  const code = String(vis.content || '')
    .replace(/```+\w*\n?/g, '')
    .replace(/```+/g, '')
    .trim();
  const src = /classDef\s/m.test(code) ? code : code + CT_LAYER_DEFS;
  const id = `ctvm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  window.mermaid.render(id, src).then(({ svg }) => {
    if (/syntax error/i.test(svg)) {
      box.innerHTML = ctmermaidError(code);
      return;
    }
    box.innerHTML = `<div class="ct-vm-canvas">${
      window.DOMPurify ? window.DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }) : svg
    }</div>`;
    const el = box.querySelector('svg');
    if (el) {
      el.style.maxWidth = 'none';
      el.style.width = 'auto';
      el.style.height = 'auto';
      const vb = el.viewBox?.baseVal;
      if (vb?.width && vb?.height) {
        el.setAttribute('width', String(Math.round(vb.width)));
        el.setAttribute('height', String(Math.round(vb.height)));
      }
    }
  }).catch(() => { box.innerHTML = ctmermaidError(code); });
  return null;
};

const ctmermaidError = (code) =>
  `<div class="ct-reel-note"><span>Diagrama inválido.</span>` +
  `<details><summary>Ver código</summary><pre>${escHtml(code)}</pre></details></div>`;

const ctMountMindmap = (box, vis) => {
  if (!window.markmap?.Markmap || !window.markmap?.Transformer) {
    box.innerHTML = '<div class="ct-reel-note">Mindmap indisponível.</div>';
    return null;
  }
  let root;
  try {
    root = new window.markmap.Transformer().transform(String(vis.content || '')).root;
  } catch {
    box.innerHTML = '<div class="ct-reel-note">Mapa inválido.</div>';
    return null;
  }
  const wrap = document.createElement('div');
  wrap.className = 'ct-vmap';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  wrap.appendChild(svg);
  box.innerHTML = '';
  box.appendChild(wrap);
  try {
    const mm = window.markmap.Markmap.create(svg, {
      duration: 300,
      initialExpandLevel: 2,
    }, root);
    const fit = () => { try { mm.fit(); } catch { /* noop */ } };
    requestAnimationFrame(() => requestAnimationFrame(fit));
    setTimeout(fit, 500);
    return () => { try { mm.destroy(); } catch { /* noop */ } };
  } catch {
    box.innerHTML = '<div class="ct-reel-note">Falha ao montar o mapa.</div>';
    return null;
  }
};

let ctBubbleSim = null;
const ctMountBubble = (box, vis) => {
  if (!window.d3) {
    box.innerHTML = '<div class="ct-reel-note">Bolhas indisponíveis.</div>';
    return null;
  }
  let data;
  try { data = JSON.parse(String(vis.content || '')); } catch {
    box.innerHTML = '<div class="ct-reel-note">Bolhas inválidas.</div>';
    return null;
  }
  const rawNodes = Array.isArray(data?.nodes) ? data.nodes : [];
  const center = data?.center || { label: vis.title || 'Mapa' };
  const hubs = rawNodes.filter((n) => !n.parent);
  if (!rawNodes.length || hubs.length < 2) {
    box.innerHTML = '<div class="ct-reel-note">Bolhas inválidas.</div>';
    return null;
  }
  const W = 720, H = 460;
  const hubIdx = new Map(hubs.map((h, i) => [h.id, i]));
  const rootOf = (node) => {
    let n = node;
    const seen = new Set();
    while (n?.parent && !hubIdx.has(n.parent) && !seen.has(n.parent)) {
      seen.add(n.id);
      n = rawNodes.find((x) => x.id === n.parent) || null;
    }
    return n?.parent || n?.id;
  };
  const palette = ['#f5b638', '#f2813c', '#2dd4bf', '#38bdf8', '#f472a6', '#a78bfa', '#fbbf24', '#34d399'];
  const colorOf = (node) => palette[(hubIdx.get(rootOf(node)) ?? 0) % palette.length];
  const radiusOf = (kind) => (kind === 'center' ? 58 : kind === 'hub' ? 44 : 28);
  const nodes = [
    {
      uid: '__center', kind: 'center', label: center.label, detail: center.detail || '',
      file: null, reel: null, color: ctToken('--surface'), r: radiusOf('center'),
      x: W / 2, y: H / 2,
    },
    ...rawNodes.filter((n) => !n.parent || hubs.some((h) => h.id === n.parent)).map((n) => ({
      uid: n.id,
      kind: !n.parent ? 'hub' : 'leaf',
      label: n.label,
      detail: n.detail || '',
      file: n.file || null,
      reel: n.reel || null,
      color: colorOf(n),
      r: radiusOf(!n.parent ? 'hub' : 'leaf'),
      x: W / 2 + (Math.random() - 0.5) * 240,
      y: H / 2 + (Math.random() - 0.5) * 200,
    })),
  ];
  const byUid = new Map(nodes.map((n) => [n.uid, n]));
  const links = [];
  for (const n of rawNodes) {
    if (!n.parent) links.push({ source: '__center', target: n.id, main: true });
    else if (byUid.has(n.parent)) links.push({ source: n.parent, target: n.id, main: false });
  }

  box.innerHTML = '<div class="ct-vbubble"></div>';
  const wrap = box.querySelector('.ct-vbubble');
  const svg = window.d3.select(wrap).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', center.label)
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');
  const g = svg.append('g');
  svg.call(window.d3.zoom().scaleExtent([0.5, 2.5]).on('zoom', (e) => g.attr('transform', e.transform)));

  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', (d) => (d.main ? ctToken('--text-3') : (byUid.get(d.target)?.color || '#888')))
    .attr('stroke-width', (d) => (d.main ? 3 : 2))
    .attr('stroke-dasharray', '1 7')
    .attr('stroke-linecap', 'round');

  const node = g.append('g').selectAll('g').data(nodes, (d) => d.uid).join('g')
    .attr('class', 'ct-bnode')
    .style('cursor', 'pointer');

  node.each(function (d) {
    const el = window.d3.select(this);
    if (d.kind === 'hub') {
      el.append('circle').attr('r', d.r + 8).attr('fill', 'none').attr('stroke', ctToken('--surface')).attr('stroke-width', 4);
    }
    el.append('circle')
      .attr('r', d.r)
      .attr('fill', d.color)
      .attr('stroke', d.kind === 'center' ? ctToken('--border-hi') : 'none')
      .attr('stroke-width', d.kind === 'center' ? 3 : 0);
    const lines = ctWrapLabel(d.label, d.kind === 'center' ? 14 : d.kind === 'hub' ? 10 : 9);
    const size = d.kind === 'center' ? 13 : d.kind === 'hub' ? 12 : 9;
    const t = el.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', size)
      .attr('fill', d.kind === 'center' ? ctToken('--text') : '#0b0c0e')
      .attr('font-weight', 700)
      .style('pointer-events', 'none');
    lines.forEach((ln, i) => {
      t.append('tspan')
        .attr('x', 0)
        .attr('dy', i === 0 ? -(lines.length - 1) * size * 0.6 + 4 : size * 1.15)
        .text(ln);
    });
  });

  if (ctBubbleSim) { try { ctBubbleSim.stop(); } catch { /* noop */ } }
  const sim = window.d3.forceSimulation(nodes)
    .force('link', window.d3.forceLink(links).id((d) => d.uid)
      .distance((l) => {
        const t = typeof l.target === 'object' ? l.target : byUid.get(l.target);
        return t?.kind === 'hub' ? 200 : 110;
      })
      .strength(0.55))
    .force('charge', window.d3.forceManyBody().strength(-300))
    .force('collide', window.d3.forceCollide().radius((d) => d.r + 12).strength(0.9))
    .force('center', window.d3.forceCenter(W / 2, H / 2).strength(0.08))
    .alphaDecay(0.06)
    .on('tick', () => {
      link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
  ctBubbleSim = sim;
  const centerNode = byUid.get('__center');
  if (centerNode) { centerNode.fx = W / 2; centerNode.fy = H / 2; }
  node.call(window.d3.drag()
    .on('start', (e, d) => {
      if (!e.active) sim.alphaTarget(0.3).restart();
      if (d.kind !== 'center') { d.fx = d.x; d.fy = d.y; }
    })
    .on('drag', (e, d) => {
      if (d.kind !== 'center') { d.fx = e.x; d.fy = e.y; }
    })
    .on('end', (e, d) => {
      if (!e.active) sim.alphaTarget(0);
      if (d.kind !== 'center') { d.fx = null; d.fy = null; }
    }));
  return () => { try { sim.stop(); } catch { /* noop */ } };
};

const ctWrapLabel = (text, perLine) => {
  const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > perLine && cur) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
    if (lines.length === 2) break;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 3);
};

// ════ Narração por tela ════

// kind: '' | 'gen' (spinner) | 'play' | 'ok' | 'err' — muda cor/ícone da pill.
const ctSetNarrStatus = (msg, kind = '') => {
  const el = $('ct-narr-status');
  if (el) {
    el.className = msg ? `on ${kind}`.trim() : '';
    el.textContent = msg;
  }
  const btn = $('ct-narr-btn');
  if (btn) btn.textContent = ctNarrPlaying ? '⏸ Parar' : '▶ Ouvir';
};

// Debug Audit local (porta 3333 aceita sem origin) — alimenta a timeline
// do /debug na sessão "codetour". Fire-and-forget.
const ctDebug = (type, title, detail) => {
  try {
    fetch('/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'codetour',
        payload: { type, title, ...(detail || {}) },
      }),
    }).catch(() => {});
  } catch { /* noop */ }
};

const ctMarkListened = (id) => {
  if (!id || ctListened.has(id)) return;
  ctListened.add(id);
  try {
    localStorage.setItem('ct-listened', JSON.stringify([...ctListened].slice(-200)));
  } catch { /* sem cache */ }
  ctSyncProgress();
};

const ctStopNarration = () => {
  ctNarrPlaying = false;
  ctNarrReelId = '';
  try {
    const a = $('ct-audio');
    if (a) { a.pause(); a.removeAttribute('src'); a.load(); }
  } catch { /* noop */ }
  ctSetNarrStatus('');
};

// Sem edge-tts NÃO existe fallback: voz do sistema (webkitSpeech) está
// proibida no caderno. Falha ⇒ status com instrução de instalação.
const ctNarrFail = async (reelId, serverError) => {
  ctNarrPlaying = false;
  let extra = '';
  let cmd = '';
  try {
    const res = await fetch('/codetour/voice-health');
    const health = res.ok ? await res.json() : null;
    cmd = health?.instructions?.[0]?.cmd || '';
    if (cmd) extra = ` — rode: ${cmd}`;
  } catch { /* segue sem hint */ }
  ctSetNarrStatus(`sem áudio — instale edge-tts${extra}`, 'err');
  ctDebug('error', 'narração sem áudio', {
    reel: reelId || '',
    serverError: String(serverError || '').slice(0, 160),
    fix: cmd || 'pip3 install edge-tts',
  });
  toast('edge-tts ausente — instale para ouvir o caderno');
};

const ctToggleNarration = () => {
  if (ctNarrPlaying) { ctStopNarration(); return; }
  ctPlayNarration();
};

const ctPlayNarration = async () => {
  const slide = ctSlides[ctSlideIdx];
  if (!slide?.reelId) return;
  const reel = ctReelData?.reels.find((r) => r.id === slide.reelId);
  if (!String(reel?.narration || '').trim()) return toast('Tela sem narração');
  ctStopNarration();
  const t0 = Date.now();
  ctSetNarrStatus('gerando áudio…', 'gen');
  ctDebug('decision', 'tocar narração', {
    reel: slide.reelId,
    label: reel.label || '',
  });
  try {
    const res = await fetch(
      `/codetour/audio?reel=${encodeURIComponent(slide.reelId)}`,
    );
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = $('ct-audio');
      a.src = url;
      ctNarrPlaying = true;
      ctNarrReelId = slide.reelId;
      ctSetNarrStatus('tocando… (edge-tts)', 'play');
      ctDebug('log', 'áudio pronto', {
        reel: slide.reelId,
        kb: Math.round(blob.size / 1024),
        ms: Date.now() - t0,
      });
      a.onended = () => {
        ctNarrPlaying = false;
        ctMarkListened(slide.reelId);
        ctSetNarrStatus('ouvido ✓', 'ok');
        ctDebug('log', 'narração concluída', {
          reel: slide.reelId,
          kb: Math.round(blob.size / 1024),
        });
        URL.revokeObjectURL(url);
      };
      a.onerror = () => ctNarrFail(slide.reelId);
      await a.play();
      return;
    }
    const err = res.ok ? '' : await res.text().catch(() => '');
    await ctNarrFail(slide.reelId, err);
  } catch (e) {
    await ctNarrFail(slide.reelId, String(e?.message || e));
  }
};

// ════ Biblioteca (sidebar) ════

const loadCtLibrary = async () => {
  try {
    const res = await fetch('/tours');
    ctLibrary = (await res.json()).notebooks || [];
  } catch { ctLibrary = []; }
  renderCtLibrary();
};

const renderCtLibrary = () => {
  const box = $('ct-library-list');
  if (!box) return;
  const count = $('ct-library-count');
  if (count) count.textContent = ctLibrary.length ? `${ctLibrary.length} caderno(s)` : '';
  if (!ctLibrary.length) {
    box.innerHTML = '<div class="ct-reel-note">Nenhum caderno ainda.</div>';
    return;
  }
  box.innerHTML = '';
  for (const nb of ctLibrary) {
    const pending = nb.status === 'pending';
    const div = document.createElement('div');
    div.className = 'ct-nb' + (ctNotebook && nb.id === ctNotebook.id ? ' on' : '');
    const date = (nb.updatedAt || '').slice(0, 10);
    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'ct-nb-main';
    main.title = pending ? 'Ver caderno aguardando o agente' : 'Abrir caderno';
    main.innerHTML = `<strong>${escHtml(nb.title)}</strong>` +
      (pending
        ? '<span class="ct-nb-badge">⏳ aguardando a IA</span> '
        : '') +
      `<span>${escHtml(nb.query || '')}${pending ? '' : ` · ${nb.reels ?? 0} telas`} · ${escHtml(date)}</span>`;
    main.addEventListener('click', () =>
      pending ? ctClickPending(nb) : ctOpenNotebook(nb.id));
    div.appendChild(main);
    box.appendChild(div);
  }
};

// Clique num pendente da lista — reabre o painel de prompt.
const ctClickPending = async (nb) => {
  ctNotebook = nb;
  if (ctSession?.id !== nb.id) ctSession = null;
  ctReelData = null;
  ctSlides = [];
  ctDebug('log', 'reabrindo caderno pendente', { id: nb.id });
  renderCtLibrary();
  await ctShowPending(nb, ctPrompts.get(nb.id) || '');
  startCtPoll(nb.id);
};

const ctOpenNotebook = async (id) => {
  try {
    const metaRes = await fetch(`/tours/${encodeURIComponent(id)}`);
    if (!metaRes.ok) return toast('Caderno não encontrado');
    const data = await metaRes.json();
    if (data.notebook?.status === 'pending') return ctClickPending(data.notebook);
    ctNotebook = data.notebook;
    ctDebug('decision', 'abrir caderno', {
      id,
      title: ctNotebook.title,
      telas: ctNotebook.reels ?? '?',
    });
    const openRes = await fetch(`/tours/${encodeURIComponent(id)}/open`, { method: 'POST' });
    if (!openRes.ok) {
      ctDebug('error', 'falha ao abrir caderno', {
        id,
        status: openRes.status,
        body: (await openRes.text()).slice(0, 160),
      });
      return toast('Erro ao abrir');
    }
    ctSession = (await openRes.json()).session;
    ctDebug('log', 'apresentação recarregada', {
      id,
      telas: ctSession?.reel?.reels?.length ?? 0,
      scan: ctSession?.scan?.files ?? 0,
    });
    ctHidePending();
    ctSlideIdx = 0;
    stopCtPoll();
    renderCodetour();
    renderCtLibrary();
    toast('Caderno aberto');
  } catch { toast('Erro ao abrir'); }
};

const ctAskDeleteNotebook = () => {
  if (!ctNotebook) return;
  const nb = ctNotebook;
  const old = $('ct-del-overlay');
  if (old) old.remove();
  const ov = document.createElement('div');
  ov.id = 'ct-del-overlay';
  ov.className = 'ct-overlay';
  const hasPod = !!nb.links?.podcastId;
  const hasCanvas = (nb.links?.canvasShapeIds?.length || 0) > 0;
  ov.innerHTML = `<div class="ct-dialog" role="dialog" aria-label="Apagar caderno">` +
    `<h3>Apagar “${escHtml(nb.title)}”?</h3>` +
    `<p>O caderno sai da biblioteca. Quer remover as referências junto?</p>` +
    `<label><input type="checkbox" id="ct-del-pod" ${hasPod ? 'checked' : ''} ${hasPod ? '' : 'disabled'} /> Apagar podcast vinculado${hasPod ? '' : ' (nenhum)'}</label>` +
    (hasCanvas
      ? `<label><input type="checkbox" id="ct-del-canvas" checked /> Apagar desenho antigo da lousa</label>`
      : '') +
    `<label><input type="checkbox" id="ct-del-audio" /> Apagar áudios exclusivos <small>(só os que nenhum outro caderno usa)</small></label>` +
    `<div class="ct-dialog-actions"><button class="ct-btn" id="ct-del-cancel">Cancelar</button>` +
    `<button class="ct-btn primary" id="ct-del-ok">Apagar caderno</button></div></div>`;
  document.body.appendChild(ov);
  $('ct-del-cancel').addEventListener('click', () => ov.remove());
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
  $('ct-del-ok').addEventListener('click', async () => {
    const refs = {
      podcast: $('ct-del-pod')?.checked === true,
      canvas: $('ct-del-canvas')?.checked === true,
      audio: $('ct-del-audio')?.checked === true,
    };
    try {
      const res = await fetch(`/tours/${encodeURIComponent(nb.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refs }),
      });
      if (!res.ok) return toast(await res.text() || 'Erro ao apagar');
      const data = await res.json().catch(() => ({}));
      const r = data.removed || {};
      ov.remove();
      toast(`Apagado${r.podcast ? ' + podcast' : ''}${r.canvas ? ` + ${r.canvas} shapes` : ''}${r.audio ? ` + ${r.audio} áudios` : ''}`);
      await clearCodetour();
    } catch { toast('Erro ao apagar'); }
  });
};

const ctGenPodcast = async () => {
  if (!ctNotebook) return toast('Salve o caderno primeiro');
  toast('Gerando podcast do caderno…');
  try {
    const res = await fetch(`/tours/${encodeURIComponent(ctNotebook.id)}/podcast`, { method: 'POST' });
    if (!res.ok) return toast(await res.text() || 'Erro ao gerar podcast');
    const data = await res.json();
    ctNotebook = data.notebook;
    renderCtHeroExtras();
    toast('Podcast gerando — acompanhe em Podcasts');
  } catch { toast('Erro ao gerar podcast'); }
};

const renderCtHeroExtras = () => {
  const reel = ctReelData;
  if ($('ct-topic')) $('ct-topic').textContent = reel?.topic || ctSession?.query || '';
  if ($('ct-meta')) {
    const root = ctSession?.projectRoot || '';
    const n = reel?.reels.length || 0;
    $('ct-meta').textContent = root ? `${n} telas · ${root}` : '';
    $('ct-meta').title = root;
  }
  if ($('ct-status')) {
    const txt = !ctSession
      ? ''
      : reel
      ? 'pronto — ↑ ↓ navega'
      : 'aguardando a IA…';
    $('ct-status').textContent = txt;
    $('ct-status').classList.toggle('ct-wait', !!ctSession && !reel);
  }
  const delBtn = $('ct-del-btn');
  if (delBtn) delBtn.style.display = ctNotebook ? '' : 'none';
  const links = $('ct-links');
  if (!links) return;
  if (!reel) { links.innerHTML = ''; return; }
  const nb = ctNotebook;
  const pod = nb?.links?.podcastId;
  links.innerHTML = ctHasArtifact('podcast')
    ? `<button class="ct-btn" ${pod ? `onclick="setMode('podcasts')"` : 'onclick="ctGenPodcast()"'}>🎙 ${pod ? 'Ouvir podcast' : 'Gerar podcast'}</button>`
    : '';
};

const ctHasArtifact = (k) => {
  const sel = ctSession?.artifacts || ctArtifacts;
  return sel.includes(k);
};

const ctSyncProgress = () => {
  if (!ctNotebook) return;
  try {
    fetch(`/tours/${encodeURIComponent(ctNotebook.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: { listened: [...ctListened].slice(-200), quiz: {} } }),
    }).catch(() => {});
  } catch { /* offline */ }
};

// ════ Navegação ════

const ctGo = (d) => {
  const reels = $('ct-reels');
  if (!reels || !ctSlides.length) return;
  const n = Math.max(0, Math.min(ctSlides.length - 1, (ctCurrent < 0 ? 0 : ctCurrent) + d));
  reels.children[n].scrollIntoView({ behavior: 'smooth' });
};

document.addEventListener('keydown', (e) => {
  if (currentMode !== 'codetour' || !ctReelData) return;
  if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ctGo(1); }
  else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); ctGo(-1); }
  else if (e.key === 'Home') { e.preventDefault(); ctGo(-ctSlides.length); }
  else if (e.key === 'End') { e.preventDefault(); ctGo(ctSlides.length); }
  else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); ctToggleNarration(); }
});

document.addEventListener('keydown', (e) => {
  const formOpen = $('ct-form-overlay')?.style.display !== 'none';
  if (!formOpen) return;
  if (e.key === 'Escape') { ctCloseForm(); e.preventDefault(); }
  if (e.key === 'Enter' && document.activeElement?.id === 'ct-f-query') {
    ctSubmitForm();
    e.preventDefault();
  }
});

document.addEventListener('click', (e) => {
  if (e.target?.id === 'ct-form-overlay') ctCloseForm();
  if (e.target?.id === 'ct-up') ctGo(-1);
  if (e.target?.id === 'ct-down') ctGo(1);
  if (e.target?.id === 'ct-pending-copy') ctCopyPendingPrompt();
  if (e.target?.id === 'ct-pending-cancel') ctCancelPending();
});
