// ==== Codetour v4 — híbrido: scan local + IA só na semântica ====
// 1 seleciona pasta (scan automático) → 2 fala o que quer ver + depth
// → 3 IA busca protocolo + estrutura e devolve sozinha via POST.
// Diagrama Mermaid com zoom/pan; snippet com highlight; camadas com cor.
// depends on: dom.js ($, escHtml, toast, copyToClipboard)

let ctRoot = '';
let ctSession = null;
let ctSlideIdx = 0;
let ctPollTimer = null;
let ctDepth = 'repasse';
let ctVisualSeq = 0;
let ctSlideMms = [];
let ctNarrPlaying = false;
let ctNotebook = null;
let ctLibrary = [];
let ctQuiz = null;
const CT_ARTIFACT_DEFS = [
  ['audio', '🔊 Áudio'],
  ['podcast', '🎙 Podcast'],
  ['bubble', '🫧 Bolhas'],
  ['mindmap', '🧠 Mapa mental'],
  ['diagrams', '📊 Diagramas'],
  ['tables', '📋 Tabelas'],
  ['quiz', '🎓 Quiz'],
];
let ctArtifacts = CT_ARTIFACT_DEFS.map(([k]) => k);
try {
  const savedArts = JSON.parse(localStorage.getItem('ct-artifacts') || '[]');
  if (Array.isArray(savedArts) && savedArts.length) {
    const valid = savedArts.filter((a) => CT_ARTIFACT_DEFS.some(([k]) => k === a));
    if (valid.length) ctArtifacts = valid;
  }
} catch { /* padrão: todos */ }
let ctListened = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('ct-listened') || '[]');
  if (Array.isArray(saved)) ctListened = new Set(saved);
} catch { /* sem cache */ }

const ctTour = () => ctSession?.tour || null;
const ctLayers = () => ctSession?.layers || {};

const ctLayerOf = (fileRef) => {
  const base = String(fileRef || '').split(':')[0];
  return ctLayers()[base] || 'util';
};

const setCtDepth = (depth) => {
  ctDepth = depth;
  document.querySelectorAll('input[name="ct-depth"]').forEach((r) => {
    r.checked = r.value === depth;
  });
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
  ctSyncSessionNotebook();
  loadCtLibrary();
  startCtPoll();
};

const pickCodetourFolder = async () => {
  try {
    const res = await fetch('/codetour/pick-folder');
    const data = await res.json();
    if (data.cancelled || !data.path) return;
    ctRoot = data.path;
    if ($('ct-f-path')) $('ct-f-path').textContent = ctRoot;
    renderCodetour();
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
  if (q && !q.value && ctSession && !ctTour()) q.value = ctSession.query || '';
  setCtDepth(ctDepth);
  ov.style.display = '';
  $('ct-f-query')?.focus();
};

const ctCloseForm = () => {
  const ov = $('ct-form-overlay');
  if (ov) ov.style.display = 'none';
};

// Gera: abre sessão com pasta + query e auto-copia o prompt do agente.
const askCodetour = async () => {
  await ctSubmitForm();
};

const ctSubmitForm = async () => {
  const query = $('ct-f-query')?.value?.trim() || '';
  const depth = document.querySelector('input[name="ct-depth"]:checked')?.value || ctDepth;
  const arts = [...document.querySelectorAll('#ct-f-artifacts input:checked')].map((c) => c.value);
  if (!ctRoot && !ctSession) return toast('Selecione a pasta primeiro');
  if (!query) { $('ct-f-query')?.focus(); return toast('Diga o que quer estudar'); }
  if (!arts.length) return toast('Marque ao menos 1 artefato');
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
    ctSession = data.session;
    ctRoot = ctSession.projectRoot;
    ctSlideIdx = 0;
    ctNotebook = null;
    ctQuiz = null;
    ctCloseForm();
    copyToClipboard(data.agentPrompt, 'Prompt copiado — cole na IA');
    renderCodetour();
    startCtPoll();
  } catch { toast('Erro ao gerar'); }
};

const startCtPoll = () => {
  stopCtPoll();
  ctPollTimer = setInterval(async () => {
    if (currentMode !== 'codetour' || ctTour()) {
      if (ctTour()) stopCtPoll();
      return;
    }
    try {
      const res = await fetch('/codetour/session');
      const data = await res.json();
      if (data.session?.tour && !ctTour()) {
        ctSession = data.session;
        ctSlideIdx = 0;
        renderCodetour();
        ctSyncSessionNotebook();
        toast('Caderno pronto e salvo');
        stopCtPoll();
      } else if (data.session && !ctSession) {
        ctSession = data.session;
        ctRoot = data.session.projectRoot;
        renderCodetour();
      }
    } catch { /* próximo tick */ }
  }, 2000);
};

const stopCtPoll = () => {
  if (ctPollTimer) clearInterval(ctPollTimer);
  ctPollTimer = null;
};

const clearCodetour = async () => {
  await fetch('/codetour/clear', { method: 'POST' });
  ctStopNarration();
  destroySlideMms();
  ctStopBubbles();
  ctSession = null;
  ctRoot = '';
  ctSlideIdx = 0;
  ctNotebook = null;
  ctQuiz = null;
  if ($('ct-quiz')) { $('ct-quiz').style.display = 'none'; $('ct-quiz').innerHTML = ''; }
  renderCodetour();
  renderCtLibrary();
  startCtPoll();
};

// ── Highlight leve p/ snippets TS/JS (sem dependências) ──
// Tokeniza em 1 passada e escapa cada trecho — seguro contra XSS.
const ctHighlight = (code) => {
  const src = String(code ?? '');
  const re = /(\/\*[\s\S]*?(?:\*\/|$))|(\/\/[^\n]*)|(`(?:[^`\\]|\\[\s\S])*`?|'(?:[^'\\\n]|\\.)*(?:'|$)|"(?:[^"\\\n]|\\.)*(?:"|$))|\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|try|catch|finally|throw|class|extends|implements|interface|type|enum|import|from|export|default|async|await|this|super|static|readonly|public|private|protected|get|set|null|undefined|true|false|void|never|unknown|any|string|number|boolean|satisfies|as|is|keyof|infer)\b|\b(\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;
  let html = '';
  let last = 0;
  let m;
  while ((m = re.exec(src)) !== null) {
    html += escHtml(src.slice(last, m.index));
    const tok = m[0];
    const cls = m[1] || m[2]
      ? 'tok-com'
      : m[3]
      ? 'tok-str'
      : m[4]
      ? 'tok-kw'
      : m[5]
      ? 'tok-num'
      : m[6]
      ? 'tok-fn'
      : /^[A-Z]/.test(m[7] || '')
      ? 'tok-type'
      : '';
    html += cls ? `<span class="${cls}">${escHtml(tok)}</span>` : escHtml(tok);
    last = m.index + tok.length;
  }
  return html + escHtml(src.slice(last));
};

const ctGo = (i) => {
  const tour = ctTour();
  if (!tour) return;
  ctStopNarration();
  destroySlideMms();
  ctSlideIdx = Math.max(0, Math.min(i, tour.slides.length - 1));
  renderCodetourSlide();
};
const ctPrev = () => ctGo(ctSlideIdx - 1);
const ctNext = () => ctGo(ctSlideIdx + 1);

const renderCodetour = () => {
  const tour = ctTour();
  const has = !!tour;
  if ($('ct-empty')) $('ct-empty').style.display = has ? 'none' : 'block';
  if ($('ct-active')) $('ct-active').style.display = has ? 'block' : 'none';
  if ($('ct-status')) {
    $('ct-status').textContent = !ctSession
      ? ''
      : tour
      ? 'pronto — ← → navega'
      : 'aguardando a IA…';
    $('ct-status').classList.toggle('ct-wait', !!ctSession && !tour);
  }
  if (!has) return;
  if ($('ct-topic')) $('ct-topic').textContent = tour.topic || ctSession.query || '';
  if ($('ct-goal')) $('ct-goal').textContent = tour.goal;
  if ($('ct-meta-path')) {
    const root = ctSession.projectRoot || '';
    $('ct-meta-path').textContent = root;
    $('ct-meta-path').title = root;
  }
  if ($('ct-meta-count')) {
    $('ct-meta-count').textContent = `${tour.slides.length} slides · ${tour.flows.length} passos`;
  }
  renderCodetourSlide();
  renderCodetourSections(tour);
  renderCtHeroExtras();
  renderCtQuizBtn();
};

const renderCodetourSlide = () => {
  const tour = ctTour();
  if (!tour) return;
  const s = tour.slides[ctSlideIdx];
  if (!s) return;
  const card = $('ct-slide-card');
  if (card) {
    card.classList.remove('ct-anim');
    void card.offsetWidth;
    card.classList.add('ct-anim');
  }
  $('ct-slide-kicker').textContent = `Slide ${ctSlideIdx + 1} de ${tour.slides.length}`;
  $('ct-slide-title').textContent = s.title;
  $('ct-slide-bullets').innerHTML = s.bullets.map((b) => `<div>• ${escHtml(b)}</div>`).join('');
  if ($('ct-slide-explain')) {
    $('ct-slide-explain').textContent = s.explain || '';
    $('ct-slide-explain').style.display = s.explain ? '' : 'none';
  }
  const wrap = $('ct-snippet-wrap');
  if (wrap) {
    const hasSnippet = !!(s.snippet && s.snippet.code);
    wrap.style.display = hasSnippet ? '' : 'none';
    if (hasSnippet) {
      $('ct-snippet-file').textContent = s.snippet.file;
      $('ct-snippet-code').innerHTML = ctHighlight(s.snippet.code);
    }
  }
  $('ct-slide-files').innerHTML = (s.files || []).map((f) => `<code>${escHtml(f)}</code>`).join('');
  const check = $('ct-slide-check');
  if (check) {
    // A IA às vezes repete o rótulo do protocolo — remove para não duplicar.
    const question = String(s.check || '').replace(/^\s*se entendeu,?\s*você responde:\s*/i, '');
    check.style.display = question ? '' : 'none';
    check.innerHTML = question ? `<span>Se entendeu, você responde:</span> ${escHtml(question)}` : '';
  }
  renderSlideVisuals(s);
  ctNarrPlaying = false;
  ctSetNarrStatus(s.narration ? '' : 'tour antigo — vai ler o texto');
  const heard = tour.slides.filter((x) => ctListened.has(x.id)).length;
  const pct = Math.round((heard / tour.slides.length) * 100);
  $('ct-slide-counter').textContent = `${ctSlideIdx + 1} / ${tour.slides.length} · ${pct}% ouvido`;
  const bar = $('ct-slide-bar');
  if (bar) bar.style.width = `${((ctSlideIdx + 1) / tour.slides.length) * 100}%`;
  renderCodetourDots();
};

const renderCodetourDots = () => {
  const tour = ctTour();
  if (!tour) return;
  const dots = $('ct-dots');
  if (!dots) return;
  dots.innerHTML = tour.slides.map((sl, i) => {
    const cls = [
      i === ctSlideIdx ? 'on' : '',
      ctListened.has(sl.id) ? 'heard' : '',
    ].join(' ').trim();
    return `<button data-i="${i}" class="${cls}" title="Slide ${i + 1}" aria-label="Ir para o slide ${i + 1}"></button>`;
  }).join('');
  dots.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => ctGo(Number(b.dataset.i)))
  );
};

// ── Visuais por slide: a IA escolhe mermaid, mindmap ou html ──
const destroySlideMms = () => {
  for (const mm of ctSlideMms) {
    try {
      mm.destroy();
    } catch { /* já descartado */ }
  }
  ctSlideMms = [];
};

// ── Narração por slide: MP3 do servidor, fallback Web Speech ──
const ctSlideId = () => ctTour()?.slides[ctSlideIdx]?.id || '';

const ctSetNarrStatus = (msg) => {
  if ($('ct-narr-status')) $('ct-narr-status').textContent = msg || '';
  const btn = $('ct-narr-btn');
  if (btn) btn.textContent = ctNarrPlaying ? '⏸ Parar' : '▶ Ouvir explicação';
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
  try {
    const a = $('ct-audio');
    if (a) { a.pause(); a.removeAttribute('src'); a.load(); }
  } catch { /* noop */ }
  try {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch { /* noop */ }
  ctSetNarrStatus('');
};

const ctSpeakFallback = (text) => {
  if (!window.speechSynthesis) {
    ctSetNarrStatus('sem áudio — instale edge-tts');
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.05;
    u.onend = () => {
      ctNarrPlaying = false;
      ctMarkListened(ctSlideId());
      ctSetNarrStatus('ouvido ✓ (voz do navegador)');
      renderCodetourDots();
    };
    ctNarrPlaying = true;
    ctSetNarrStatus('falando… (voz do navegador)');
    window.speechSynthesis.speak(u);
  } catch {
    ctNarrPlaying = false;
    ctSetNarrStatus('falha na voz do navegador');
  }
};

const ctToggleNarration = () => {
  if (ctNarrPlaying) { ctStopNarration(); return; }
  ctPlayNarration();
};

const ctPlayNarration = async () => {
  const tour = ctTour();
  const slide = tour?.slides[ctSlideIdx];
  if (!slide) return;
  const text = String(slide.narration || '').trim();
  // Tour antigo sem narration — fala o explain pra não quebrar.
  const speakText = text || String(slide.explain || '').trim();
  if (!speakText) return toast('Slide sem narração');
  ctStopNarration();
  ctSetNarrStatus('gerando áudio…');
  try {
    const res = await fetch(`/codetour/audio?slide=${encodeURIComponent(slide.id)}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = $('ct-audio');
      a.src = url;
      ctNarrPlaying = true;
      ctSetNarrStatus('tocando…');
      a.onended = () => {
        ctNarrPlaying = false;
        ctMarkListened(slide.id);
        ctSetNarrStatus('ouvido ✓');
        renderCodetourDots();
        URL.revokeObjectURL(url);
      };
      a.onerror = () => ctSpeakFallback(speakText);
      await a.play();
      return;
    }
    // 503 = edge-tts faltando → fallback; 400 tour antigo → fala explain.
    ctSpeakFallback(speakText);
  } catch {
    ctSpeakFallback(speakText);
  }
};

// HTML da IA passa pelo mesmo perfil restritivo do markdown.
const ctSanitizeHtml = (raw) => {
  if (!window.DOMPurify) return escHtml(raw);
  return window.DOMPurify.sanitize(String(raw ?? ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'video', 'audio'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onsubmit'],
  });
};

// Monta os blocos visuais do slide ativo e dispara os renders.
const renderSlideVisuals = (slide) => {
  const box = $('ct-slide-visuals');
  if (!box) return;
  destroySlideMms();
  ctStopBubbles();
  const visuals = slide.visuals || [];
  if (!visuals.length) {
    box.innerHTML = '';
    return;
  }
  const mine = ++ctVisualSeq;
  box.innerHTML = visuals.map((v, i) => {
    const kind = v.kind === 'mermaid' ? 'Mermaid'
      : v.kind === 'mindmap' ? 'Mindmap'
      : v.kind === 'bubble' ? 'Bolhas'
      : 'Quadro';
    const tools = v.kind === 'mermaid'
      ? `<div class="ct-vzoom"><button class="ct-btn" data-vz="-1" title="Reduzir">−</button><button class="ct-btn" data-vz="0" title="Restaurar">1:1</button><button class="ct-btn" data-vz="1" title="Ampliar">+</button></div>`
      : '';
    return `<div class="ct-visual" data-kind="${v.kind}"><div class="ct-visual-head"><span class="ct-visual-kind">${kind}</span><span class="ct-visual-title">${escHtml(v.title || '')}</span>${tools}</div><div class="ct-visual-body" data-vi="${i}"></div></div>`;
  }).join('');
  box.querySelectorAll('.ct-visual').forEach((el) => {
    const body = el.querySelector('.ct-visual-body');
    const vis = visuals[Number(body.dataset.vi)];
    if (vis.kind === 'mermaid') renderVisualMermaid(vis, body, mine);
    else if (vis.kind === 'mindmap') renderVisualMindmap(vis, body, mine);
    else if (vis.kind === 'bubble') renderVisualBubble(vis, body);
    else body.innerHTML = `<div class="ct-vhtml">${ctSanitizeHtml(vis.content)}</div>`;
  });
  box.querySelectorAll('[data-vz]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const canvas = btn.closest('.ct-visual')?.querySelector('.ct-vm-canvas');
      if (!canvas) return;
      const cur = Number(canvas.dataset.zoom || '1');
      const next = btn.dataset.vz === '0'
        ? 1
        : Math.min(2.5, Math.max(0.5, +(cur + Number(btn.dataset.vz) * 0.25).toFixed(2)));
      canvas.dataset.zoom = String(next);
      canvas.style.transform = `scale(${next})`;
    })
  );
};

const renderVisualMermaid = (vis, body, mine) => {
  if (!window.mermaid) {
    body.innerHTML = '<div class="ct-list">Mermaid indisponível.</div>';
    return;
  }
  try {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
      flowchart: { curve: 'linear', htmlLabels: false },
    });
  } catch { /* já inicializado */ }
  const code = String(vis.content || '')
    .replace(/```+\w*\n?/g, '')
    .replace(/```+/g, '')
    .trim();
  const src = /classDef\s/m.test(code) ? code : code + CT_LAYER_DEFS;
  const id = `ctvm-${mine}-${body.dataset.vi}`;
  window.mermaid.render(id, src).then(({ svg }) => {
    if (mine !== ctVisualSeq) return;
    if (/syntax error/i.test(svg)) {
      console.error('mermaid: syntax error', code.slice(0, 200));
      body.innerHTML = `<div class="ct-vm-error"><span>Diagrama com sintaxe inválida — o conteúdo foi preservado abaixo.</span>` +
        `<details><summary>Ver código do diagrama</summary><pre>${escHtml(code)}</pre></details></div>`;
      return;
    }
    body.innerHTML = `<div class="ct-vm"><div class="ct-vm-canvas" data-zoom="1">${
      window.DOMPurify ? window.DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }) : svg
    }</div></div>`;
  }).catch((err) => {
    console.error('mermaid:', err);
    if (mine === ctVisualSeq) {
      body.innerHTML = `<div class="ct-vm-error"><span>Diagrama inválido.</span>` +
        `<details><summary>Ver código do diagrama</summary><pre>${escHtml(code)}</pre></details></div>`;
    }
  });
};

const renderVisualMindmap = (vis, body, mine) => {
  if (!window.markmap?.Markmap || !window.markmap?.Transformer) {
    body.innerHTML = '<div class="ct-list">Mindmap indisponível.</div>';
    return;
  }
  let root;
  try {
    root = new window.markmap.Transformer().transform(String(vis.content || '')).root;
  } catch (err) {
    console.error('mindmap parse:', err);
    body.innerHTML = '<div class="ct-list">Markdown do mapa inválido.</div>';
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'ct-vmap';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  wrap.appendChild(svg);
  body.innerHTML = '';
  body.appendChild(wrap);
  try {
    const mm = window.markmap.Markmap.create(svg, {
      duration: 300,
      initialExpandLevel: 2,
    }, root);
    ctSlideMms.push(mm);
    const fitSoon = () => {
      if (mine !== ctVisualSeq) return;
      try {
        mm.fit();
      } catch (err) {
        console.error('mindmap fit:', err);
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(fitSoon));
    setTimeout(fitSoon, 600);
  } catch (err) {
    console.error('mindmap:', err);
    body.innerHTML = `<div class="ct-list">Falha ao montar o mapa: ${escHtml(err?.message || err)}</div>`;
  }
};

// ── Diagrama Mermaid (obrigatório no protocolo) ──
const CT_LAYER_DEFS = '\nclassDef api fill:#60a5fa,stroke:#1e3a5f,color:#0b0c0e,stroke-width:2px;\nclassDef service fill:#37d99a,stroke:#0f3d2e,color:#0b0c0e,stroke-width:2px;\nclassDef data fill:#fbbf24,stroke:#4a3a12,color:#0b0c0e,stroke-width:2px;\nclassDef ui fill:#f472b6,stroke:#4a1f38,color:#0b0c0e,stroke-width:2px;\nclassDef test fill:#9aa1ad,stroke:#2a2f36,color:#0b0c0e,stroke-width:2px;\nclassDef util fill:#3a4150,stroke:#6b7280,color:#eef1f5,stroke-width:2px;';

const renderCodetourSections = (tour) => {
  if ($('ct-flows')) {
    $('ct-flows').innerHTML = (tour.flows || []).length
      ? tour.flows.map((f, i) => {
        const layer = ctLayerOf(f.file);
        return `<div class="ct-flow"><span class="ct-flow-idx">${i + 1}</span><span><strong>${escHtml(f.label)}</strong> <span class="ct-layer-dot" data-layer="${layer}" title="Camada ${layer}">${layer}</span><br /><span class="ct-flow-detail">${escHtml(f.detail || '')}</span><br /><span class="ct-flow-file">${escHtml(f.file)}</span></span></div>`;
      }).join('')
      : '<div class="ct-list">—</div>';
  }
  if ($('ct-contracts')) {
    $('ct-contracts').innerHTML = (tour.contracts || []).length
      ? tour.contracts.map((c) => `<div class="ct-contract"><div class="ct-contract-name">${escHtml(c.name)}</div><div class="ct-contract-sig"><span>in</span><code>${escHtml(c.input)}</code></div><div class="ct-contract-sig"><span>out</span><code>${escHtml(c.output)}</code></div>${c.notes ? `<div class="ct-contract-notes">${escHtml(c.notes)}</div>` : ''}</div>`).join('')
      : '<div class="ct-list">—</div>';
  }
  const list = (arr) => (arr || []).length
    ? arr.map((x) => `<div>• ${escHtml(x)}</div>`).join('')
    : '—';
  if ($('ct-files')) $('ct-files').innerHTML = list(tour.keyFiles);
  if ($('ct-pitfalls')) $('ct-pitfalls').innerHTML = list(tour.pitfalls);
  if ($('ct-next')) $('ct-next').innerHTML = list(tour.nextSteps);
};

document.addEventListener('keydown', (e) => {
  if (currentMode !== 'codetour' || !ctTour()) return;
  if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') { ctNext(); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { ctPrev(); e.preventDefault(); }
  if (e.key === 'p' || e.key === 'P') { ctToggleNarration(); e.preventDefault(); }
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
});

// ════ Caderno: artefatos, biblioteca, pontes ════

const ctHasArtifact = (k) => {
  const sel = ctSession?.artifacts || ctArtifacts;
  return sel.includes(k);
};

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
  if (count) {
    count.textContent = ctLibrary.length ? `${ctLibrary.length} caderno(s)` : '';
  }
  if (!ctLibrary.length) {
    box.innerHTML = '<div class="ct-list">Nenhum caderno ainda.</div>';
    return;
  }
  box.innerHTML = '';
  for (const nb of ctLibrary) {
    const div = document.createElement('div');
    div.className = 'ct-nb' + (ctNotebook && nb.id === ctNotebook.id ? ' on' : '');
    const date = (nb.updatedAt || '').slice(0, 10);
    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'ct-nb-main';
    main.title = 'Abrir caderno';
    main.innerHTML = `<strong>${escHtml(nb.title)}</strong>` +
      `<span>${escHtml(nb.query || '')} · ${nb.slides} slides · ${escHtml(date)}</span>`;
    main.addEventListener('click', () => ctOpenNotebook(nb.id));
    div.appendChild(main);
    box.appendChild(div);
  }
};

const ctLoadNotebookMeta = async (id) => {
  if (!id || ctNotebook?.id === id) return;
  try {
    const res = await fetch(`/tours/${encodeURIComponent(id)}`);
    if (!res.ok) return;
    ctNotebook = (await res.json()).notebook;
    renderCtHeroExtras();
    renderCtLibrary();
  } catch { /* segue sem meta */ }
};

const ctSyncSessionNotebook = () => {
  const id = ctSession?.notebookId || null;
  if (id && !ctNotebook) ctLoadNotebookMeta(id);
  if (!id && ctNotebook && ctTour()) ctNotebook = null;
};

const ctOpenNotebook = async (id) => {
  try {
    const metaRes = await fetch(`/tours/${encodeURIComponent(id)}`);
    if (!metaRes.ok) return toast('Caderno não encontrado');
    const data = await metaRes.json();
    ctNotebook = data.notebook;
    const openRes = await fetch(`/tours/${encodeURIComponent(id)}/open`, { method: 'POST' });
    if (!openRes.ok) return toast(await openRes.text() || 'Erro ao abrir');
    ctSession = (await openRes.json()).session;
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
  const saved = $('ct-saved-label');
  if (saved) saved.textContent = ctNotebook ? '✓ Salvo automaticamente na biblioteca' : '';
  const delBtn = $('ct-del-btn');
  if (delBtn) delBtn.style.display = ctNotebook ? '' : 'none';
  const links = $('ct-links');
  if (!links) return;
  if (!ctTour()) { links.style.display = 'none'; links.innerHTML = ''; return; }
  links.style.display = '';
  const nb = ctNotebook;
  const pod = nb?.links?.podcastId;
  links.innerHTML = ctHasArtifact('podcast')
    ? `<div class="ct-link-card"><span>🎙 Podcast</span><span>${escHtml(pod ? 'pronto/vinculado' : 'não gerado')}</span>` +
      (pod
        ? `<button class="ct-btn" onclick="setMode('podcasts')">Ouvir em Podcasts</button>`
        : `<button class="ct-btn" onclick="ctGenPodcast()">Gerar podcast</button>`) +
      `</div>`
    : '';
};

let ctQuizAnswers = {};
try {
  const qa = JSON.parse(localStorage.getItem('ct-quiz-answers') || '{}');
  if (qa && typeof qa === 'object') ctQuizAnswers = qa;
} catch { /* sem cache */ }

const ctSyncProgress = () => {
  if (!ctNotebook) return;
  try {
    fetch(`/tours/${encodeURIComponent(ctNotebook.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: { listened: [...ctListened].slice(-200), quiz: ctQuizAnswers } }),
    }).catch(() => {});
  } catch { /* offline */ }
};

const renderCtQuizBtn = () => {
  const btn = $('ct-quiz-btn');
  if (btn) btn.style.display = ctTour() && ctHasArtifact('quiz') ? '' : 'none';
};

const ctToggleQuiz = () => {
  if (ctQuiz) {
    ctQuiz = null;
    if ($('ct-quiz')) { $('ct-quiz').style.display = 'none'; $('ct-quiz').innerHTML = ''; }
    return;
  }
  const tour = ctTour();
  if (!tour) return;
  ctQuiz = { qi: 0, phase: 'ask', hits: 0, misses: 0 };
  renderCtQuiz();
};

const renderCtQuiz = () => {
  const box = $('ct-quiz');
  const tour = ctTour();
  if (!box || !tour || !ctQuiz) return;
  box.style.display = '';
  if (ctQuiz.qi >= tour.slides.length) {
    const total = tour.slides.length;
    box.innerHTML = `<div class="ct-quiz-done">🎓 Fim do quiz — ${ctQuiz.hits} acertos, ${ctQuiz.misses} erros de ${total}.` +
      `<div class="ct-quiz-actions"><button class="ct-btn" onclick="ctQuizRestart()">Recomeçar</button>` +
      `<button class="ct-btn" onclick="ctToggleQuiz()">Fechar</button></div></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  const s = tour.slides[ctQuiz.qi];
  if (ctQuiz.phase === 'ask') {
    box.innerHTML = `<div class="ct-quiz-q"><span>Pergunta ${ctQuiz.qi + 1} de ${tour.slides.length} · ${escHtml(s.title)}</span>` +
      `<p>${escHtml(s.check)}</p>` +
      `<textarea id="ct-quiz-answer" rows="2" placeholder="Tente lembrar antes de ver a resposta…"></textarea>` +
      `<div class="ct-quiz-actions"><button class="ct-btn primary" onclick="ctQuizReveal()">Responder</button>` +
      `<button class="ct-btn" onclick="ctToggleQuiz()">Sair</button></div></div>`;
    $('ct-quiz-answer')?.focus();
  } else {
    const expected = [...(s.bullets || []), (s.explain || '').slice(0, 280)].filter(Boolean).join(' ');
    box.innerHTML = `<div class="ct-quiz-a"><span>Resposta esperada</span><p>${escHtml(expected)}</p>` +
      `<div class="ct-quiz-actions"><button class="ct-btn primary" onclick="ctQuizScore('hit')">Acertei ✓</button>` +
      `<button class="ct-btn" onclick="ctQuizScore('miss')">Errei ✗</button></div></div>`;
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

const ctQuizReveal = () => {
  if (ctQuiz) { ctQuiz.phase = 'feedback'; renderCtQuiz(); }
};

const ctQuizScore = (mark) => {
  const tour = ctTour();
  if (!tour || !ctQuiz) return;
  const s = tour.slides[ctQuiz.qi];
  ctQuizAnswers[s.id] = mark;
  try {
    localStorage.setItem('ct-quiz-answers', JSON.stringify(ctQuizAnswers));
  } catch { /* sem cache */ }
  if (mark === 'hit') ctQuiz.hits += 1; else ctQuiz.misses += 1;
  ctSyncProgress();
  ctQuiz.qi += 1;
  ctQuiz.phase = 'ask';
  renderCtQuiz();
};

const ctQuizRestart = () => {
  ctQuiz = { qi: 0, phase: 'ask', hits: 0, misses: 0 };
  renderCtQuiz();
};

// ── Mapa de bolhas clicável (hub-satélite, estilo infográfico) ──
const CT_BUBBLE_COLORS = ['#f5b638', '#f2813c', '#2dd4bf', '#38bdf8', '#f472a6', '#a78bfa', '#fbbf24', '#34d399'];

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
  if (words.join(' ').length > lines.join(' ').length && lines.length) {
    lines[lines.length - 1] += '…';
  }
  return lines.slice(0, 3);
};

let ctBubbleSims = [];

const ctStopBubbles = () => {
  for (const sim of ctBubbleSims) {
    try {
      sim.stop();
    } catch { /* já parada */ }
  }
  ctBubbleSims = [];
};

// ── Mapa de bolhas com física (D3 force): arrasta, zoom, hover destaca ──
const renderVisualBubble = (vis, body) => {
  if (!window.d3) {
    body.innerHTML = '<div class="ct-list">Bolhas indisponíveis.</div>';
    return;
  }
  let data;
  try {
    data = JSON.parse(String(vis.content || ''));
  } catch {
    body.innerHTML = '<div class="ct-list">Bolhas inválidas.</div>';
    return;
  }
  const rawNodes = Array.isArray(data?.nodes) ? data.nodes : [];
  const center = data?.center || { label: vis.title || 'Mapa', detail: '' };
  const hubs = rawNodes.filter((n) => !n.parent);
  if (!rawNodes.length || hubs.length < 2) {
    body.innerHTML = '<div class="ct-list">Bolhas inválidas.</div>';
    return;
  }
  const W = 720;
  const H = 520;
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
  const colorOf = (node) =>
    CT_BUBBLE_COLORS[(hubIdx.get(rootOf(node)) ?? 0) % CT_BUBBLE_COLORS.length];
  const radiusOf = (kind) => (kind === 'center' ? 62 : kind === 'hub' ? 46 : 30);

  const nodes = [
    {
      uid: '__center', kind: 'center', label: center.label, detail: center.detail || '',
      file: null, slide: null, color: '#ffffff', r: radiusOf('center'),
      x: W / 2, y: H / 2,
    },
    ...rawNodes.filter((n) => pos_final(n)).map((n) => ({
      uid: n.id,
      kind: !n.parent ? 'hub' : 'leaf',
      label: n.label,
      detail: n.detail || '',
      file: n.file || null,
      slide: n.slide || null,
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
  function pos_final(n) {
    return !n.parent || hubs.some((h) => h.id === n.parent);
  }

  body.innerHTML = '<div class="ct-vbubble"></div>';
  const wrap = body.querySelector('.ct-vbubble');
  const svg = window.d3.select(wrap).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', center.label)
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');
  const g = svg.append('g');
  svg.call(
    window.d3.zoom().scaleExtent([0.5, 2.5]).on('zoom', (e) => g.attr('transform', e.transform)),
  );

  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', (d) => (d.main ? '#111' : (byUid.get(d.target)?.color || '#888')))
    .attr('stroke-width', (d) => (d.main ? 3 : 2))
    .attr('stroke-dasharray', '1 7')
    .attr('stroke-linecap', 'round');

  const showDetail = (node) => {
    let d = body.querySelector('.ct-bubble-detail');
    if (!d) {
      d = document.createElement('div');
      d.className = 'ct-bubble-detail';
      body.appendChild(d);
    }
    d.innerHTML = `<strong>${escHtml(node.label)}</strong><p>${escHtml(node.detail || '')}</p><div class="ct-bubble-actions"></div>`;
    const acts = d.querySelector('.ct-bubble-actions');
    if (node.file) {
      const fb = document.createElement('button');
      fb.className = 'ct-btn';
      fb.textContent = `📄 ${node.file}`;
      fb.title = 'Copiar caminho do arquivo';
      fb.addEventListener('click', () => copyToClipboard(node.file, 'Caminho copiado'));
      acts.appendChild(fb);
    }
    if (node.slide) {
      const sb = document.createElement('button');
      sb.className = 'ct-btn primary';
      sb.textContent = 'Ir para o slide →';
      sb.addEventListener('click', () => ctGoSlideById(node.slide));
      acts.appendChild(sb);
    }
  };

  const neighbor = new Map();
  for (const l of links) {
    const a = typeof l.source === 'object' ? l.source.uid : l.source;
    const b = typeof l.target === 'object' ? l.target.uid : l.target;
    if (!neighbor.has(a)) neighbor.set(a, new Set());
    if (!neighbor.has(b)) neighbor.set(b, new Set());
    neighbor.get(a).add(b);
    neighbor.get(b).add(a);
  }

  const node = g.append('g').selectAll('g').data(nodes, (d) => d.uid).join('g')
    .attr('class', 'ct-bnode')
    .attr('tabindex', '0')
    .attr('role', 'button')
    .attr('aria-label', (d) => d.label)
    .style('cursor', 'pointer')
    .on('click', (_e, d) => showDetail(d))
    .on('keydown', (e, d) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetail(d); }
    })
    .on('mouseenter', (_e, d) => {
      const keep = neighbor.get(d.uid) || new Set();
      keep.add(d.uid);
      node.style('opacity', (o) => (keep.has(o.uid) ? 1 : 0.22));
      link.style('opacity', (l) => {
        const s = typeof l.source === 'object' ? l.source.uid : l.source;
        const t = typeof l.target === 'object' ? l.target.uid : l.target;
        return s === d.uid || t === d.uid ? 1 : 0.15;
      });
    })
    .on('mouseleave', () => {
      node.style('opacity', 1);
      link.style('opacity', 1);
    });

  node.each(function (d) {
    const el = window.d3.select(this);
    if (d.kind === 'hub') {
      el.append('circle')
        .attr('r', d.r + 9)
        .attr('fill', 'none')
        .attr('stroke', '#fff')
        .attr('stroke-width', 4)
        .attr('class', 'ct-bring');
    }
    el.append('circle')
      .attr('r', d.r)
      .attr('fill', d.color)
      .attr('stroke', d.kind === 'center' ? '#111' : 'none')
      .attr('stroke-width', d.kind === 'center' ? 3 : 0);
    const lines = ctWrapLabel(d.label, d.kind === 'center' ? 14 : d.kind === 'hub' ? 10 : 9);
    const size = d.kind === 'center' ? 13 : d.kind === 'hub' ? 12 : 9;
    const fill = d.kind === 'center' ? '#1a1a1a' : '#fff';
    const t = el.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', size)
      .attr('fill', fill)
      .attr('font-weight', 700)
      .style('pointer-events', 'none');
    lines.forEach((ln, i) => {
      t.append('tspan')
        .attr('x', 0)
        .attr('dy', i === 0 ? -(lines.length - 1) * size * 0.6 + 4 : size * 1.15)
        .text(ln);
    });
  });

  const sim = window.d3.forceSimulation(nodes)
    .force('link', window.d3.forceLink(links).id((d) => d.uid)
      .distance((l) => {
        const t = typeof l.target === 'object' ? l.target : byUid.get(l.target);
        return t?.kind === 'hub' ? 215 : 115;
      })
      .strength(0.55))
    .force('charge', window.d3.forceManyBody().strength(-320))
    .force('collide', window.d3.forceCollide().radius((d) => d.r + 12).strength(0.9))
    .force('center', window.d3.forceCenter(W / 2, H / 2).strength(0.08))
    .alphaDecay(0.06)
    .on('tick', () => {
      link
        .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
  ctBubbleSims.push(sim);

  const centerNode = byUid.get('__center');
  if (centerNode) {
    centerNode.fx = W / 2;
    centerNode.fy = H / 2;
  }
  node.call(
    window.d3.drag()
      .on('start', (e, d) => {
        if (!e.active) sim.alphaTarget(0.3).restart();
        if (d.kind !== 'center') {
          d.fx = d.x;
          d.fy = d.y;
        }
      })
      .on('drag', (e, d) => {
        if (d.kind !== 'center') {
          d.fx = e.x;
          d.fy = e.y;
        }
      })
      .on('end', (e, d) => {
        if (!e.active) sim.alphaTarget(0);
        if (d.kind !== 'center') {
          d.fx = null;
          d.fy = null;
        }
      }),
  );

  showDetail({ label: center.label, detail: center.detail || 'Arraste as bolhas, passe o mouse para destacar, clique para explorar.', file: null, slide: null });
};

const ctGoSlideById = (slideId) => {
  const tour = ctTour();
  if (!tour) return;
  const i = tour.slides.findIndex((s) => s.id === slideId);
  if (i >= 0) {
    ctGo(i);
    document.querySelector('#ct-slide-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    toast('Slide não encontrado neste caderno');
  }
};
