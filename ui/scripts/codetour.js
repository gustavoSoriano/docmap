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
  document.querySelectorAll('#ct-depth button').forEach((b) =>
    b.classList.toggle('on', b.dataset.depth === depth)
  );
};

const loadCodetour = async () => {
  try {
    const res = await fetch('/codetour/session');
    ctSession = (await res.json()).session || null;
    if (ctSession) {
      ctRoot = ctSession.projectRoot;
      if ($('ct-query') && !$('ct-query').value) {
        $('ct-query').value = ctSession.query || '';
      }
      if (ctSession.depth) setCtDepth(ctSession.depth);
    }
  } catch { ctSession = null; }
  renderCodetour();
  startCtPoll();
};

const pickCodetourFolder = async () => {
  try {
    const res = await fetch('/codetour/pick-folder');
    const data = await res.json();
    if (data.cancelled || !data.path) return;
    ctRoot = data.path;
    renderCodetour();
    toast('Pasta selecionada — diga o que quer ver');
    $('ct-query')?.focus();
  } catch { toast('Erro ao abrir pasta'); }
};

// Gera: abre sessão com pasta + query e auto-copia o prompt do agente.
const askCodetour = async () => {
  const query = $('ct-query')?.value?.trim() || '';
  if (!ctRoot && !ctSession) return toast('Selecione a pasta primeiro');
  if (!query) { $('ct-query')?.focus(); return toast('Diga o que quer ver'); }
  try {
    const res = await fetch('/codetour/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectRoot: ctRoot || ctSession.projectRoot, query, depth: ctDepth }),
    });
    if (!res.ok) return toast(await res.text() || 'Erro ao gerar');
    const data = await res.json();
    ctSession = data.session;
    ctRoot = ctSession.projectRoot;
    ctSlideIdx = 0;
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
        toast('Tour pronto');
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
  ctSession = null;
  ctRoot = '';
  ctSlideIdx = 0;
  const q = $('ct-query');
  if (q) q.value = '';
  renderCodetour();
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
  if ($('ct-path')) {
    $('ct-path').textContent = ctRoot || ctSession?.projectRoot || 'nenhuma pasta';
  }
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
  const visuals = slide.visuals || [];
  if (!visuals.length) {
    box.innerHTML = '';
    return;
  }
  const mine = ++ctVisualSeq;
  box.innerHTML = visuals.map((v, i) => {
    const kind = v.kind === 'mermaid' ? 'Mermaid'
      : v.kind === 'mindmap' ? 'Mindmap'
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
  const code = String(vis.content || '').trim();
  const src = /classDef\s/m.test(code) ? code : code + CT_LAYER_DEFS;
  const id = `ctvm-${mine}-${body.dataset.vi}`;
  window.mermaid.render(id, src).then(({ svg }) => {
    if (mine !== ctVisualSeq) return;
    body.innerHTML = `<div class="ct-vm"><div class="ct-vm-canvas" data-zoom="1">${
      window.DOMPurify ? window.DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }) : svg
    }</div></div>`;
  }).catch((err) => {
    console.error('mermaid:', err);
    if (mine === ctVisualSeq) {
      body.innerHTML = '<div class="ct-list">Diagrama inválido.</div>';
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
  wrap.className = 'ct-vmap markmap-dark';
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
  if (e.key === 'Enter' && document.activeElement?.id === 'ct-query') askCodetour();
});
