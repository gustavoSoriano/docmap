// Validação v7 (reels) — 1 ideia por reel; visuais OPCIONAIS (só da paleta).
// Erros em pt-BR.
import type { CodeReel, Reel, ReelVisualKind, TourDepth } from './types.ts';
import { parseBubbleContent } from './bubble.ts';

type Ok = { readonly reel: CodeReel };
type Err = { readonly error: string };

export type TourContext = {
  readonly depth: TourDepth;
  readonly paths: ReadonlySet<string>;
  // Paleta permitida de visuais (derivada dos artefatos inline do caderno).
  // Omitido → todas permitidas.
  readonly allowed?: readonly ReelVisualKind[];
};

type Bounds = {
  readonly reels: [number, number];
  readonly code: [number, number];
};

const BOUNDS: Record<TourDepth, Bounds> = {
  resumo: { reels: [3, 6], code: [20, 800] },
  repasse: { reels: [6, 12], code: [20, 1500] },
  deep: { reels: [10, 18], code: [20, 2500] },
};

const ALL_KINDS: readonly ReelVisualKind[] = [
  'mermaid',
  'mindmap',
  'html',
  'bubble',
];

const LABEL: [number, number] = [2, 24];
const TITLE: [number, number] = [8, 100];
const SUB_MAX = 160;
const RULE: [number, number] = [20, 300];
const NARRATION: [number, number] = [40, 800];
const MARK_MAX = 8;

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const isStr = (v: unknown): v is string => typeof v === 'string';

export const isDepth = (v: unknown): v is TourDepth =>
  v === 'resumo' || v === 'repasse' || v === 'deep';

const isKind = (v: unknown): v is ReelVisualKind =>
  v === 'mermaid' || v === 'mindmap' || v === 'html' || v === 'bubble';

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

// Start line de "path:line" — 1 quando não há linha.
const startLineOf = (fileRef: string): number => {
  const m = /:(\d+)$/.exec(fileRef);
  return m ? Number(m[1]) : 1;
};

export const parseCodeReel = (v: unknown, ctx: TourContext): Ok | Err => {
  const b = BOUNDS[ctx.depth];
  if (!isObj(v)) return { error: 'caderno deve ser um objeto' };
  const r = v as Record<string, unknown>;
  const topic = isStr(r.topic) ? r.topic : '';
  if (!topic.trim()) return { error: 'caderno.topic obrigatório' };
  if (!isStr(r.goal) || !r.goal.trim()) {
    return { error: 'caderno.goal obrigatório' };
  }
  if (r.goal.length > 400) return { error: 'caderno.goal excede 400 chars' };
  if (
    !Array.isArray(r.reels) ||
    r.reels.length < b.reels[0] ||
    r.reels.length > b.reels[1]
  ) {
    return { error: `caderno.reels: de ${b.reels[0]} a ${b.reels[1]} telas` };
  }
  const allowed = ctx.allowed ?? ALL_KINDS;
  const ids = new Set<string>();
  for (const [i, raw] of r.reels.entries()) {
    const err = checkReel(raw, i, b, ctx, allowed, ids);
    if (err) return { error: err };
  }
  const reelIds = new Set<string>();
  for (const [i, raw] of r.reels.entries()) {
    if (isObj(raw)) {
      const id = isStr(raw.id) && raw.id.trim() ? raw.id.trim() : `r${i + 1}`;
      reelIds.add(id);
    }
  }
  return {
    reel: {
      topic: topic.trim(),
      goal: (r.goal as string).trim(),
      reels: r.reels as readonly Reel[],
    },
  };
};

const checkReel = (
  raw: unknown,
  i: number,
  b: Bounds,
  ctx: TourContext,
  allowed: readonly ReelVisualKind[],
  ids: Set<string>,
): string | null => {
  if (!isObj(raw)) return `caderno.reels[${i}] deve ser objeto`;
  const id = isStr(raw.id) && raw.id.trim() ? raw.id.trim() : `r${i + 1}`;
  if (ids.has(id)) return `caderno.reels[${i}] id duplicado (${id})`;
  ids.add(id);

  const label = isStr(raw.label) ? raw.label.trim() : '';
  if (label.length < LABEL[0] || label.length > LABEL[1]) {
    return `caderno.reels[${i}].label: ${LABEL[0]} a ${LABEL[1]} chars`;
  }
  const title = isStr(raw.title) ? raw.title.trim() : '';
  if (title.length < TITLE[0] || title.length > TITLE[1]) {
    return `caderno.reels[${i}].title: ${TITLE[0]} a ${
      TITLE[1]
    } chars — diga a conclusão`;
  }
  const sub = isStr(raw.sub) ? raw.sub.trim() : '';
  if (sub.length > SUB_MAX) {
    return `caderno.reels[${i}].sub excede ${SUB_MAX} chars`;
  }
  const narration = isStr(raw.narration) ? raw.narration : '';
  const narrErr = checkNarration(narration, i);
  if (narrErr) return narrErr;

  const codeErr = checkCode(raw.code, i, b, ctx);
  if (codeErr) return codeErr;

  const ruleErr = checkRule(raw.rule, i);
  if (ruleErr) return ruleErr;

  const visual = raw.visual;
  if (visual !== null && visual !== undefined) {
    const visErr = checkVisual(visual, i, ctx, allowed);
    if (visErr) return visErr;
  }

  (raw as Record<string, unknown>).id = id;
  if (raw.code === undefined) (raw as Record<string, unknown>).code = null;
  if (raw.visual === undefined) (raw as Record<string, unknown>).visual = null;
  if (raw.rule === undefined) (raw as Record<string, unknown>).rule = null;
  if (raw.sub === undefined) (raw as Record<string, unknown>).sub = '';
  return null;
};

const checkCode = (
  raw: unknown,
  i: number,
  b: Bounds,
  ctx: TourContext,
): string | null => {
  if (raw === null || raw === undefined) return null; // prova é opcional
  if (!isObj(raw)) return `caderno.reels[${i}].code deve ser objeto`;
  const file = isStr(raw.file) ? raw.file.trim() : '';
  if (!file) return `caderno.reels[${i}].code.file obrigatório (path:linha)`;
  if (ctx.paths.size > 0 && !ctx.paths.has(basePathOf(file))) {
    return `caderno.reels[${i}].code.file fora do scan (${file})`;
  }
  const code = isStr(raw.code) ? raw.code : '';
  if (code.trim().length < b.code[0] || code.length > b.code[1]) {
    return `caderno.reels[${i}].code.code: ${b.code[0]} a ${b.code[1]} chars`;
  }
  const start = startLineOf(file);
  const lines = code.replace(/\n+$/, '').split('\n').length;
  const end = start + lines - 1;
  const mark = raw.mark;
  if (mark !== undefined) {
    if (!Array.isArray(mark) || mark.length > MARK_MAX) {
      return `caderno.reels[${i}].code.mark: lista de até ${MARK_MAX} linhas`;
    }
    for (const m of mark) {
      if (typeof m !== 'number' || !Number.isInteger(m)) {
        return `caderno.reels[${i}].code.mark deve conter números de linha`;
      }
      if (m < start || m > end) {
        return `caderno.reels[${i}].code.mark ${m} fora do trecho (${start}–${end})`;
      }
    }
  } else {
    (raw as Record<string, unknown>).mark = [];
  }
  return null;
};

const checkRule = (raw: unknown, i: number): string | null => {
  if (raw === null || raw === undefined) return null; // rule é opcional
  if (!isObj(raw)) return `caderno.reels[${i}].rule deve ser objeto`;
  const text = isStr(raw.text) ? raw.text.trim() : '';
  if (text.length < RULE[0] || text.length > RULE[1]) {
    return `caderno.reels[${i}].rule.text: ${RULE[0]} a ${RULE[1]} chars`;
  }
  if (raw.file !== undefined && raw.file !== null && !isStr(raw.file)) {
    return `caderno.reels[${i}].rule.file deve ser texto`;
  }
  return null;
};

const checkVisual = (
  vis: unknown,
  i: number,
  ctx: TourContext,
  allowed: readonly ReelVisualKind[],
): string | null => {
  if (!isObj(vis)) return `caderno.reels[${i}].visual deve ser objeto`;
  if (!isKind(vis.kind)) {
    return `caderno.reels[${i}].visual.kind deve ser mermaid, mindmap, html ou bubble`;
  }
  if (!allowed.includes(vis.kind)) {
    return `caderno.reels[${i}].visual.kind ${vis.kind} desativado nos artefatos`;
  }
  const title = isStr(vis.title) ? vis.title.trim() : '';
  if (!title || title.length > 120) {
    return `caderno.reels[${i}].visual.title: 1 a 120 chars`;
  }
  if (!isStr(vis.content) || !vis.content.trim()) {
    return `caderno.reels[${i}].visual.content obrigatório`;
  }
  const content = vis.content.trim();
  if (vis.kind === 'mermaid') {
    if (content.length < 60) {
      return `caderno.reels[${i}].mermaid curto — desenhe o fluxo`;
    }
    if (content.length > 4000) {
      return `caderno.reels[${i}].mermaid excede 4000 chars`;
    }
    if (!/^(flowchart|graph)\s+[A-Z]{1,2}\b/m.test(content)) {
      return `caderno.reels[${i}].mermaid deve começar com "flowchart LR"`;
    }
    if (!/-->|---|==>/.test(content)) {
      return `caderno.reels[${i}].mermaid sem conexões`;
    }
    const mermaidErr = checkMermaidSafe(content, i);
    if (mermaidErr) return mermaidErr;
  }
  if (vis.kind === 'mindmap') {
    if (content.length < 20 || content.length > 3000) {
      return `caderno.reels[${i}].mindmap: 20 a 3000 chars de markdown`;
    }
    if (
      !/^#{1,6}\s/m.test(content) && !/^(\s*[-*]|\s*\d+\.)\s/m.test(content)
    ) {
      return `caderno.reels[${i}].mindmap precisa de títulos (#) ou lista (-)`;
    }
  }
  if (vis.kind === 'html') {
    if (content.length < 20 || content.length > 5000) {
      return `caderno.reels[${i}].html: 20 a 5000 chars`;
    }
    if (/<\s*script/i.test(content) || /<\s*iframe/i.test(content)) {
      return `caderno.reels[${i}].html não pode ter script nem iframe`;
    }
  }
  if (vis.kind === 'bubble') {
    return checkBubbleRefs(content, i, ctx);
  }
  return null;
};

const checkBubbleRefs = (
  raw: string,
  i: number,
  ctx: TourContext,
): string | null => {
  if (raw.length > 12_000) {
    return `caderno.reels[${i}].bubble excede 12000 chars`;
  }
  const parsed = parseBubbleContent(raw);
  if ('error' in parsed) return `caderno.reels[${i}].${parsed.error}`;
  for (const n of parsed.content.nodes) {
    if (
      n.file !== null && ctx.paths.size > 0 &&
      !ctx.paths.has(basePathOf(n.file))
    ) {
      return `caderno.reels[${i}].bubble.node ${n.id} fora do scan (${n.file})`;
    }
  }
  return null;
};

// Subconjunto seguro do mermaid: o render 10.x quebra (bomba "Syntax error")
// com fences, HTML, aspas, pipes, hashtags e diretivas click/style/subgraph.
const MERMAID_FORBIDDEN: ReadonlyArray<[RegExp, string]> = [
  [/```/, 'sem cercas de código (```)'],
  [/[<]/, 'sem <'],
  [/(?<![-=])>/, 'sem > fora de --> ou ==>'],
  [/["'`]/, 'sem aspas nem crase'],
  [/\|/, 'sem pipe (|)'],
  [/#/, 'sem hashtag (#)'],
  [/[()]/, 'sem parênteses nos labels'],
  [/\b(click|style|subgraph|classDef)\b/i, 'sem click/style/subgraph/classDef'],
];

const MERMAID_LAYERS = [
  'api',
  'service',
  'data',
  'ui',
  'test',
  'util',
] as const;

const checkMermaidSafe = (content: string, i: number): string | null => {
  for (const [re, why] of MERMAID_FORBIDDEN) {
    if (re.test(content)) return `caderno.reels[${i}].mermaid inválido: ${why}`;
  }
  const ids = new Set<string>();
  for (const m of content.matchAll(/\b([A-Za-z][\w-]*)\s*[\[{]/g)) {
    ids.add(m[1]);
  }
  for (const m of content.matchAll(/\bclass\s+([\w-]+)\s+([A-Za-z]+)/g)) {
    if (!ids.has(m[1])) {
      return `caderno.reels[${i}].mermaid: class ${m[1]} sem nó definido`;
    }
    if (!(MERMAID_LAYERS as readonly string[]).includes(m[2])) {
      return `caderno.reels[${i}].mermaid: camada ${
        m[2]
      } inválida (use api/service/data/ui/test/util)`;
    }
  }
  return null;
};

// Narração p/ TTS — texto de fala, não de leitura.
const checkNarration = (narration: string, i: number): string | null => {
  const text = narration.trim();
  if (text.length < NARRATION[0] || narration.length > NARRATION[1]) {
    return `caderno.reels[${i}].narration: ${NARRATION[0]} a ${
      NARRATION[1]
    } chars de texto falável`;
  }
  if (/```/.test(narration) || /<\s*script/i.test(narration)) {
    return `caderno.reels[${i}].narration: texto puro, sem código nem script`;
  }
  return null;
};
