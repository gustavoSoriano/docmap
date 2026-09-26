// Validação v5 — visuais por slide, todas as tools obrigatórias no tour.
// Erros em pt-BR.
import type { CodeTour, TourDepth, TourVisualKind } from './types.ts';

type Ok = { readonly tour: CodeTour };
type Err = { readonly error: string };

export type TourContext = {
  readonly depth: TourDepth;
  readonly paths: ReadonlySet<string>;
};

type Bounds = {
  readonly slides: [number, number];
  readonly explain: [number, number];
  readonly snippet: [number, number];
  readonly flows: [number, number];
  readonly flowDetail: [number, number];
  readonly lists: number;
};

const BOUNDS: Record<TourDepth, Bounds> = {
  resumo: {
    slides: [1, 4],
    explain: [40, 400],
    snippet: [0, 800],
    flows: [1, 6],
    flowDetail: [20, 200],
    lists: 6,
  },
  repasse: {
    slides: [1, 6],
    explain: [200, 900],
    snippet: [20, 1500],
    flows: [1, 12],
    flowDetail: [20, 400],
    lists: 6,
  },
  deep: {
    slides: [1, 10],
    explain: [200, 1500],
    snippet: [20, 2500],
    flows: [1, 16],
    flowDetail: [20, 400],
    lists: 8,
  },
};

const ALL_KINDS: readonly TourVisualKind[] = ['mermaid', 'mindmap', 'html'];

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const isStrArr = (v: unknown, max: number): v is readonly string[] =>
  Array.isArray(v) &&
  v.length <= max &&
  v.every((s) => typeof s === 'string' && s.trim().length > 0);

export const isDepth = (v: unknown): v is TourDepth =>
  v === 'resumo' || v === 'repasse' || v === 'deep';

const isKind = (v: unknown): v is TourVisualKind =>
  v === 'mermaid' || v === 'mindmap' || v === 'html';

export const validateOpenInput = (v: unknown): string | null => {
  if (!isObj(v)) return 'corpo deve ser um objeto';
  const r = v as Record<string, unknown>;
  if (typeof r.projectRoot !== 'string' || !r.projectRoot.trim()) {
    return 'selecione a pasta primeiro';
  }
  if (r.projectRoot.includes('\0')) return 'pasta inválida';
  if (r.projectRoot.length > 1024) return 'caminho muito longo';
  if (typeof r.query !== 'string' || !r.query.trim()) {
    return 'diga o que quer ver (ex: camada de serviço)';
  }
  if (r.query.length > 280) return 'pedido excede 280 chars';
  if (r.depth !== undefined && !isDepth(r.depth)) {
    return 'depth deve ser resumo, repasse ou deep';
  }
  return null;
};

const basePathOf = (fileRef: string): string => fileRef.split(':')[0];

export const parseCodeTour = (v: unknown, ctx: TourContext): Ok | Err => {
  const b = BOUNDS[ctx.depth];
  if (!isObj(v)) return { error: 'tour deve ser um objeto' };
  const r = v as Record<string, unknown>;
  const topic = typeof r.topic === 'string'
    ? r.topic
    : typeof r.layer === 'string'
    ? r.layer
    : '';
  if (!topic.trim()) return { error: 'tour.topic obrigatório' };
  if (typeof r.goal !== 'string' || !r.goal.trim()) {
    return { error: 'tour.goal obrigatório' };
  }
  if (r.goal.length > 400) return { error: 'tour.goal excede 400 chars' };
  const slidesErr = checkSlides(r.slides, b, ctx);
  if (slidesErr) return { error: slidesErr };
  const slides = r.slides as Ok['tour']['slides'];
  const kindsErr = checkAllTools(slides);
  if (kindsErr) return { error: kindsErr };
  const flows = Array.isArray(r.flows) ? r.flows : [];
  const flowsErr = checkFlows(flows, b);
  if (flowsErr) return { error: flowsErr };
  const contracts = Array.isArray(r.contracts) ? r.contracts : [];
  if (contracts.length > 12) return { error: 'tour.contracts: máx 12' };
  if (!isStrArr(r.keyFiles ?? [], 15)) {
    return { error: 'tour.keyFiles: até 15 (ex: src/x.ts:10)' };
  }
  if (!isStrArr(r.pitfalls ?? [], b.lists)) {
    return { error: `tour.pitfalls: até ${b.lists}` };
  }
  if (!isStrArr(r.nextSteps ?? [], b.lists)) {
    return { error: `tour.nextSteps: até ${b.lists}` };
  }
  return {
    tour: {
      topic: topic.trim(),
      goal: (r.goal as string).trim(),
      slides,
      flows: flows as Ok['tour']['flows'],
      contracts: contracts as Ok['tour']['contracts'],
      keyFiles: (r.keyFiles ?? []) as readonly string[],
      pitfalls: (r.pitfalls ?? []) as readonly string[],
      nextSteps: (r.nextSteps ?? []) as readonly string[],
    },
  };
};

// Todas as tools precisam aparecer ao menos 1x no tour.
const checkAllTools = (slides: Ok['tour']['slides']): string | null => {
  const seen = new Set<string>();
  for (const s of slides) {
    for (const vis of s.visuals ?? []) {
      if (isObj(vis) && isKind(vis.kind)) seen.add(vis.kind);
    }
  }
  const missing = ALL_KINDS.filter((k) => !seen.has(k));
  if (missing.length > 0) {
    return `tour sem usar: ${
      missing.join(', ')
    } — use todas as tools (mermaid, mindmap, html)`;
  }
  return null;
};

const checkVisual = (vis: unknown, slideIdx: number): string | null => {
  if (!isObj(vis)) return `tour.slides[${slideIdx}].visuals deve ser objetos`;
  if (!isKind(vis.kind)) {
    return `tour.slides[${slideIdx}].visual kind deve ser mermaid, mindmap ou html`;
  }
  if (typeof vis.title !== 'string' || !vis.title.trim()) {
    return `tour.slides[${slideIdx}].visual.title obrigatório`;
  }
  if (vis.title.length > 120) {
    return `tour.slides[${slideIdx}].visual.title excede 120 chars`;
  }
  if (typeof vis.content !== 'string' || !vis.content.trim()) {
    return `tour.slides[${slideIdx}].visual.content obrigatório`;
  }
  const content = vis.content.trim();
  if (vis.kind === 'mermaid') {
    if (content.length < 60) {
      return `tour.slides[${slideIdx}].mermaid curto — desenhe o fluxo`;
    }
    if (content.length > 4000) {
      return `tour.slides[${slideIdx}].mermaid excede 4000 chars`;
    }
    if (!/^(flowchart|graph)\s+[A-Z]{1,2}\b/m.test(content)) {
      return `tour.slides[${slideIdx}].mermaid deve começar com "flowchart LR"`;
    }
    if (!/-->|---|==>/.test(content)) {
      return `tour.slides[${slideIdx}].mermaid sem conexões`;
    }
  }
  if (vis.kind === 'mindmap') {
    if (content.length < 20 || content.length > 3000) {
      return `tour.slides[${slideIdx}].mindmap: 20 a 3000 chars de markdown`;
    }
    if (
      !/^#{1,6}\s/m.test(content) && !/^(\s*[-*]|\s*\d+\.)\s/m.test(content)
    ) {
      return `tour.slides[${slideIdx}].mindmap precisa de títulos (#) ou lista (-)`;
    }
  }
  if (vis.kind === 'html') {
    if (content.length < 20 || content.length > 5000) {
      return `tour.slides[${slideIdx}].html: 20 a 5000 chars`;
    }
    if (/<\s*script/i.test(content) || /<\s*iframe/i.test(content)) {
      return `tour.slides[${slideIdx}].html não pode ter script nem iframe`;
    }
  }
  return null;
};

// Narração p/ TTS — texto de fala, não de leitura. Limites fixos em todas
// as depths p/ caber em ~1min de áudio e não travar o edge-tts.
const checkNarration = (narration: string, i: number): string | null => {
  const text = narration.trim();
  if (text.length < 40 || narration.length > 800) {
    return `tour.slides[${i}].narration: 40 a 800 chars de texto falável`;
  }
  if (/```/.test(narration) || /<\s*script/i.test(narration)) {
    return `tour.slides[${i}].narration: texto puro, sem código nem script`;
  }
  return null;
};

const checkSlides = (
  v: unknown,
  b: Bounds,
  ctx: TourContext,
): string | null => {
  if (!Array.isArray(v) || v.length < b.slides[0] || v.length > b.slides[1]) {
    return `tour.slides: de ${b.slides[0]} a ${b.slides[1]} slides`;
  }
  for (const [i, s] of v.entries()) {
    if (!isObj(s)) return `tour.slides[${i}] deve ser objeto`;
    if (typeof s.title !== 'string' || !s.title.trim()) {
      return `tour.slides[${i}].title obrigatório`;
    }
    if ((s.title as string).trim().length > 100) {
      return `tour.slides[${i}].title excede 100 chars — direto à conclusão`;
    }
    if (!Array.isArray(s.bullets) || s.bullets.length > 3) {
      return `tour.slides[${i}].bullets: máx 3`;
    }
    for (const item of s.bullets as unknown[]) {
      if (typeof item !== 'string' || !item.trim()) {
        return `tour.slides[${i}] com bullet vazio`;
      }
      if (item.length > 140) {
        return `tour.slides[${i}] tem bullet > 140 chars`;
      }
    }
    const explain = typeof s.explain === 'string' ? s.explain : '';
    if (
      explain.trim().length < b.explain[0] || explain.length > b.explain[1]
    ) {
      return `tour.slides[${i}].explain: ${b.explain[0]} a ${
        b.explain[1]
      } chars`;
    }
    const check = typeof s.check === 'string' ? s.check : '';
    if (check.trim().length < 20 || check.length > 280) {
      return `tour.slides[${i}].check: pergunta de 20 a 280 chars`;
    }
    const narration = typeof s.narration === 'string' ? s.narration : '';
    const narrErr = checkNarration(narration, i);
    if (narrErr) return narrErr;
    const visuals = Array.isArray(s.visuals) ? s.visuals : [];
    if (visuals.length > 3) {
      return `tour.slides[${i}].visuals: máx 3 por slide`;
    }
    for (const vis of visuals) {
      const err = checkVisual(vis, i);
      if (err) return err;
    }
    const sn = s.snippet as unknown;
    if (sn === null || sn === undefined) {
      if (b.snippet[0] > 0) return `tour.slides[${i}].snippet obrigatório`;
    } else {
      if (!isObj(sn)) return `tour.slides[${i}].snippet deve ser objeto`;
      if (typeof sn.file !== 'string' || !sn.file.trim()) {
        return `tour.slides[${i}].snippet.file obrigatório`;
      }
      if (ctx.paths.size > 0 && !ctx.paths.has(basePathOf(sn.file))) {
        return `tour.slides[${i}].snippet.file fora do scan (${sn.file})`;
      }
      const code = typeof sn.code === 'string' ? sn.code : '';
      if (
        code.trim().length < b.snippet[0] || code.length > b.snippet[1]
      ) {
        return `tour.slides[${i}].snippet.code: ${b.snippet[0]} a ${
          b.snippet[1]
        } chars`;
      }
    }
    if (s.files !== undefined && !isStrArr(s.files, 5)) {
      return `tour.slides[${i}].files: até 5`;
    }
    if (typeof s.id !== 'string' || !s.id.trim()) {
      (s as Record<string, unknown>).id = `s${i + 1}`;
    }
    if (s.files === undefined) (s as Record<string, unknown>).files = [];
    if (!Array.isArray(s.visuals)) {
      (s as Record<string, unknown>).visuals = [];
    }
  }
  return null;
};

const checkFlows = (flows: unknown[], b: Bounds): string | null => {
  if (flows.length < b.flows[0] || flows.length > b.flows[1]) {
    return `tour.flows: de ${b.flows[0]} a ${b.flows[1]} passos`;
  }
  for (const [i, f] of flows.entries()) {
    if (!isObj(f)) return `tour.flows[${i}] deve ser objeto`;
    if (typeof f.label !== 'string' || !f.label.trim()) {
      return `tour.flows[${i}].label obrigatório`;
    }
    if (typeof f.file !== 'string' || !f.file.trim()) {
      return `tour.flows[${i}].file obrigatório`;
    }
    const d = typeof f.detail === 'string' ? f.detail : '';
    if (
      d.trim().length < b.flowDetail[0] || d.length > b.flowDetail[1]
    ) {
      return `tour.flows[${i}].detail: ${b.flowDetail[0]} a ${
        b.flowDetail[1]
      } chars`;
    }
  }
  return null;
};
