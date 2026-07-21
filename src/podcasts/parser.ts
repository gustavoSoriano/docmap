// ════ Parser do roteiro em falas ════
// Função pura: <Person1>olá</Person1> → { speaker: 'Person1', text: 'olá' }
// Estende para slides quando o roteiro usa <Slide title="…">…</Slide>.

import type { PodcastVoice, Slide, SlideMapEntry } from './types.ts';

export type Segment = {
  readonly speaker: string;
  readonly text: string;
};

const TAG_RE = /<([A-Za-z][A-Za-z0-9_-]*)>([\s\S]*?)<\/\1>/g;

// Casa um bloco <Slide title="…" transition="…">…</Slide>. O `attrs` é o
// trecho entre `Slide` e `>`, podendo ter atributos em qualquer ordem.
const SLIDE_BLOCK_RE = /<Slide\b([^>]*)>([\s\S]*?)<\/Slide>/gi;
const SLIDES_OUTER_RE = /<Slides>([\s\S]*?)<\/Slides>/i;
const ATTR_RE = /([A-Za-z-]+)\s*=\s*"([^"]*)"/g;
const HTML_BLOCK_RE = /<HTML>([\s\S]*?)<\/HTML>/i;
const CSS_BLOCK_RE = /<CSS>([\s\S]*?)<\/CSS>/i;

const parseAttrs = (attrStr: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(attrStr)) !== null) {
    attrs[m[1].toLowerCase()] = m[2];
  }
  return attrs;
};

export const parseScript = (script: string): Segment[] => {
  const segments: Segment[] = [];
  let match: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(script)) !== null) {
    // Ignora a própria tag <Slide>/<Slides> — só interessa persona.
    if (/^slide/i.test(match[1])) continue;
    const text = match[2].trim();
    if (text) segments.push({ speaker: match[1], text });
  }
  return segments;
};

// Parser estendido: extrai segments E o mapa de slides.
// Retorna slideMap vazio quando o roteiro não usa <Slide> (caso legado).
export const parseScriptWithSlides = (
  script: string,
): { segments: Segment[]; slideMap: SlideMapEntry[] } => {
  // Pode haver um bloco <Slides>…</Slides> no fim (manifesto visual);
  // ele NÃO contém falas — removemos antes de procurar <Slide> de roteiro.
  const withoutManifest = script.replace(SLIDES_OUTER_RE, '');

  const segments: Segment[] = [];
  const slideMap: SlideMapEntry[] = [];
  let hasSlideBlocks = false;
  let match: RegExpExecArray | null;
  const re = new RegExp(SLIDE_BLOCK_RE);
  while ((match = re.exec(withoutManifest)) !== null) {
    hasSlideBlocks = true;
    const attrs = parseAttrs(match[1]);
    const inner = match[2];
    const segBefore = segments.length;
    for (const seg of parseScript(inner)) segments.push(seg);
    const entry: SlideMapEntry = {
      index: slideMap.length + 1,
      title: attrs.title ?? `Slide ${slideMap.length + 1}`,
      ...(attrs.transition ? { transition: attrs.transition } : {}),
      segmentStart: segBefore,
      segmentEnd: segments.length,
      enterMs: 0, // preenchido no pipeline após ffprobe por segmento
    };
    slideMap.push(entry);
  }

  if (!hasSlideBlocks) {
    // Comportamento legado: sem slides, só segments do script inteiro.
    return { segments: parseScript(script), slideMap: [] };
  }

  return { segments, slideMap };
};

// Extrai o manifesto visual <Slides><Slide>…</Slide></Slides> para HTML/CSS.
// Tolera o manifesto solto no texto (sem <Slides> wrapper) para robustez.
export const extractSlidesManifest = (text: string): Slide[] => {
  const outer = SLIDES_OUTER_RE.exec(text);
  const src = outer ? outer[1] : text;
  const slides: Slide[] = [];
  const re = new RegExp(SLIDE_BLOCK_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const attrs = parseAttrs(m[1]);
    const body = m[2];
    const htmlMatch = HTML_BLOCK_RE.exec(body);
    const cssMatch = CSS_BLOCK_RE.exec(body);
    const parsedIndex = parseInt(attrs.index ?? '', 10);
    const index = Number.isFinite(parsedIndex) && parsedIndex > 0
      ? parsedIndex
      : slides.length + 1;
    slides.push({
      index,
      title: attrs.title ?? `Slide ${index}`,
      ...(attrs.transition ? { transition: attrs.transition } : {}),
      html: (htmlMatch ? htmlMatch[1] : '').trim(),
      css: (cssMatch ? cssMatch[1] : '').trim(),
    });
  }
  return slides;
};

// Remove o bloco <Slides>…</Slides> do roteiro antes de salvar no KV —
// o manifesto visual vai pro filesystem, não deve poluir `script`.
export const stripSlidesManifest = (script: string): string =>
  script.replace(SLIDES_OUTER_RE, '').trim();

// Valida que o roteiro casa com as personas. Retorna mensagem de erro ou null.
export const validateSegments = (
  segments: readonly Segment[],
  voices: readonly PodcastVoice[],
): string | null => {
  if (segments.length === 0) {
    return 'roteiro sem falas — use tags <Person1>texto</Person1>';
  }
  const voiceOf = new Map(voices.map((v) => [v.name, v.voice]));
  const speakers = new Set<string>();
  for (const seg of segments) {
    if (!voiceOf.has(seg.speaker)) {
      return `fala de "${seg.speaker}" sem voz mapeada (personas: ${
        voices.map((v) => v.name).join(', ')
      })`;
    }
    speakers.add(seg.speaker);
  }
  if (speakers.size < 2) {
    return 'roteiro usa só 1 persona — podcasts exigem 2+ vozes';
  }
  return null;
};

export const voiceIdOf = (
  voices: readonly PodcastVoice[],
  speaker: string,
): string | undefined => voices.find((v) => v.name === speaker)?.voice;
