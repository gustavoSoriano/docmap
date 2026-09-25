// Builders de shapes para a IA desenhar via POST /canvas/shapes.
// Replica o formato de records do Quickdraw (ver src/editor.js vendored):
// text/note → props.text, geo → props.label + w/h, arrow/line → x/y + dx/dy.

import type { BoardRecord } from './types.ts';

export const SHAPE_COLORS = [
  'black',
  'grey',
  'light-violet',
  'violet',
  'blue',
  'light-blue',
  'yellow',
  'orange',
  'green',
  'light-green',
  'light-red',
  'red',
] as const;

export const SHAPE_SIZES = ['s', 'm', 'l', 'xl'] as const;
export const SHAPE_FONTS = ['draw', 'sans', 'serif', 'mono'] as const;
export const SHAPE_GEOS = [
  'rectangle',
  'ellipse',
  'triangle',
  'diamond',
  'hexagon',
  'star',
] as const;
export const SHAPE_FILLS = ['none', 'semi', 'solid', 'pattern'] as const;
export const SHAPE_DASHES = ['draw', 'solid', 'dashed', 'dotted'] as const;

/** Limites anti-abuso por request. */
export const MAX_SHAPES_PER_REQUEST = 50;
const MAX_TEXT_LEN = 500;
const MAX_LABEL_LEN = 200;
const MAX_COORD = 100_000;

export type TextShapeInput = {
  readonly kind: 'text';
  readonly text: string;
  readonly x?: number;
  readonly y?: number;
  readonly color?: string;
  readonly size?: string;
  readonly font?: string;
};

export type NoteShapeInput = {
  readonly kind: 'note';
  readonly text: string;
  readonly x?: number;
  readonly y?: number;
  readonly color?: string;
  readonly font?: string;
};

export type GeoShapeInput = {
  readonly kind: 'geo';
  readonly geo?: string;
  readonly label?: string;
  readonly w?: number;
  readonly h?: number;
  readonly x?: number;
  readonly y?: number;
  readonly color?: string;
  readonly size?: string;
  readonly fill?: string;
  readonly font?: string;
  readonly dash?: string;
};

export type ArrowShapeInput = {
  readonly kind: 'arrow' | 'line';
  readonly x1?: number;
  readonly y1?: number;
  readonly x2: number;
  readonly y2: number;
  readonly bend?: number;
  readonly color?: string;
  readonly size?: string;
};

export type ShapeInput =
  | TextShapeInput
  | NoteShapeInput
  | GeoShapeInput
  | ArrowShapeInput;

/** Input validado e normalizado (x/y sempre resolvidos). */
export type PlacedShape =
  | {
    readonly kind: 'text';
    readonly text: string;
    readonly x: number;
    readonly y: number;
    readonly color: string;
    readonly size: string;
    readonly font: string;
  }
  | {
    readonly kind: 'note';
    readonly text: string;
    readonly x: number;
    readonly y: number;
    readonly color: string;
    readonly font: string;
  }
  | {
    readonly kind: 'geo';
    readonly geo: string;
    readonly label: string;
    readonly w: number;
    readonly h: number;
    readonly x: number;
    readonly y: number;
    readonly color: string;
    readonly size: string;
    readonly fill: string;
    readonly font: string;
    readonly dash: string;
  }
  | {
    readonly kind: 'arrow' | 'line';
    readonly x: number;
    readonly y: number;
    readonly dx: number;
    readonly dy: number;
    readonly bend: number;
    readonly color: string;
    readonly size: string;
  };

const isFiniteNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const inList = (v: unknown, list: readonly string[]): v is string =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

const optNum = (v: unknown): number | null => (isFiniteNum(v) ? v : null);

const boundedCoord = (v: unknown): number | null => {
  if (!isFiniteNum(v) || Math.abs(v) > MAX_COORD) return null;
  return v;
};

/** undefined → ausente (auto-posiciona); número inválido → null (rejeita). */
const optCoord = (v: unknown): number | null | undefined =>
  v === undefined ? undefined : boundedCoord(v);

const cleanText = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const text = v.trim();
  if (!text || text.length > max) return null;
  return text;
};

/**
 * Valida o body de POST /canvas/shapes.
 * Retorna os shapes normalizados ou o motivo da rejeição.
 */
export const validateShapeInputs = (
  body: unknown,
): { readonly shapes: readonly ShapeInput[] } | { readonly error: string } => {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'body deve ser um objeto { shapes: [...] }' };
  }
  const { shapes } = body as Record<string, unknown>;
  if (!Array.isArray(shapes) || shapes.length === 0) {
    return { error: 'shapes deve ser um array não-vazio' };
  }
  if (shapes.length > MAX_SHAPES_PER_REQUEST) {
    return { error: `máximo de ${MAX_SHAPES_PER_REQUEST} shapes por request` };
  }
  const out: ShapeInput[] = [];
  for (let i = 0; i < shapes.length; i++) {
    const err = `shapes[${i}] inválido`;
    const s = shapes[i];
    if (s === null || typeof s !== 'object' || Array.isArray(s)) {
      return { error: err };
    }
    const r = s as Record<string, unknown>;
    if (r.kind === 'text' || r.kind === 'note') {
      const text = cleanText(r.text, MAX_TEXT_LEN);
      if (!text) {
        return { error: `${err}: text obrigatório (1-${MAX_TEXT_LEN} chars)` };
      }
      const color = r.color === undefined ? 'black' : r.color;
      if (!inList(color, SHAPE_COLORS)) {
        return { error: `${err}: color desconhecida` };
      }
      const font = r.font === undefined ? 'draw' : r.font;
      if (!inList(font, SHAPE_FONTS)) {
        return { error: `${err}: font desconhecida` };
      }
      const x = optCoord(r.x);
      const y = optCoord(r.y);
      if (x === null || y === null) {
        return { error: `${err}: x/y fora do limite` };
      }
      if (r.kind === 'text') {
        const size = r.size === undefined ? 'm' : r.size;
        if (!inList(size, SHAPE_SIZES)) {
          return { error: `${err}: size desconhecido` };
        }
        out.push({ kind: 'text', text, x, y, color, size, font });
      } else {
        out.push({ kind: 'note', text, x, y, color, font });
      }
    } else if (r.kind === 'geo') {
      const geo = r.geo === undefined ? 'rectangle' : r.geo;
      if (!inList(geo, SHAPE_GEOS)) {
        return { error: `${err}: geo desconhecido` };
      }
      const label = r.label === undefined ? '' : r.label;
      if (typeof label !== 'string' || label.length > MAX_LABEL_LEN) {
        return { error: `${err}: label até ${MAX_LABEL_LEN} chars` };
      }
      const w = r.w === undefined ? 220 : optNum(r.w);
      const h = r.h === undefined ? 140 : optNum(r.h);
      if (w === null || h === null || w < 8 || w > 5000 || h < 8 || h > 5000) {
        return { error: `${err}: w/h entre 8 e 5000` };
      }
      const color = r.color === undefined ? 'black' : r.color;
      if (!inList(color, SHAPE_COLORS)) {
        return { error: `${err}: color desconhecida` };
      }
      const size = r.size === undefined ? 'm' : r.size;
      if (!inList(size, SHAPE_SIZES)) {
        return { error: `${err}: size desconhecido` };
      }
      const fill = r.fill === undefined ? 'none' : r.fill;
      if (!inList(fill, SHAPE_FILLS)) {
        return { error: `${err}: fill desconhecido` };
      }
      const font = r.font === undefined ? 'draw' : r.font;
      if (!inList(font, SHAPE_FONTS)) {
        return { error: `${err}: font desconhecida` };
      }
      // Traço reto por padrão; 'draw' = ondulado à mão.
      const dash = r.dash === undefined ? 'solid' : r.dash;
      if (!inList(dash, SHAPE_DASHES)) {
        return { error: `${err}: dash desconhecido` };
      }
      const x = optCoord(r.x);
      const y = optCoord(r.y);
      if (x === null || y === null) {
        return { error: `${err}: x/y fora do limite` };
      }
      out.push({
        kind: 'geo',
        geo,
        label: label.trim(),
        w,
        h,
        x,
        y,
        color,
        size,
        fill,
        font,
        dash,
      });
    } else if (r.kind === 'arrow' || r.kind === 'line') {
      const x2 = boundedCoord(r.x2);
      const y2 = boundedCoord(r.y2);
      if (x2 === null || y2 === null) {
        return { error: `${err}: x2/y2 obrigatórios` };
      }
      const x1 = optCoord(r.x1);
      const y1 = optCoord(r.y1);
      if (x1 === null || y1 === null) {
        return { error: `${err}: x1/y1 fora do limite` };
      }
      const bend = r.bend === undefined ? 0 : optNum(r.bend);
      if (bend === null) return { error: `${err}: bend deve ser número` };
      const color = r.color === undefined ? 'black' : r.color;
      if (!inList(color, SHAPE_COLORS)) {
        return { error: `${err}: color desconhecida` };
      }
      const size = r.size === undefined ? 'm' : r.size;
      if (!inList(size, SHAPE_SIZES)) {
        return { error: `${err}: size desconhecido` };
      }
      out.push({ kind: r.kind, x1, y1, x2, y2, bend, color, size });
    } else {
      return { error: `${err}: kind deve ser text|note|geo|arrow|line` };
    }
  }
  return { shapes: out };
};

// ── Posicionamento ──

const numProp = (rec: BoardRecord, key: string): number => {
  const v = rec[key];
  return isFiniteNum(v) ? v : 0;
};

/** Base inferior aproximada de um record (para empilhar abaixo do conteúdo). */
const recordBottom = (rec: BoardRecord): number => {
  const y = numProp(rec, 'y');
  if (rec.typeName !== 'shape' || typeof rec.type !== 'string') return y;
  const props =
    rec.props && typeof rec.props === 'object' && !Array.isArray(rec.props)
      ? (rec.props as Record<string, unknown>)
      : null;
  switch (rec.type) {
    case 'text':
      return y + 60;
    case 'note':
      return y + 240;
    case 'geo':
      return y + (props && isFiniteNum(props.h) ? props.h : 140);
    case 'arrow':
    case 'line': {
      const dy = props && isFiniteNum(props.dy) ? props.dy : 0;
      return y + Math.max(0, dy) + 40;
    }
    case 'draw': {
      // pts planos [x, y, pressão, ...] relativos à origem do shape.
      const pts = props && Array.isArray(props.pts) ? props.pts : [];
      let maxDy = 0;
      for (let i = 1; i < pts.length; i += 3) {
        if (isFiniteNum(pts[i]) && pts[i] > maxDy) maxDy = pts[i];
      }
      return y + maxDy + 40;
    }
    default:
      return y + 200;
  }
};

/** Menor Y livre abaixo do conteúdo existente. */
export const contentBottom = (
  records:
    | ReadonlyMap<string, BoardRecord>
    | Readonly<Record<string, BoardRecord>>,
): number => {
  const list = records instanceof Map
    ? [...records.values()]
    : Object.values(records);
  if (list.length === 0) return 80;
  return Math.max(...list.map(recordBottom)) + 80;
};

const AUTO_X = 80;
const AUTO_GAP = 48;

const shapeHeight = (s: PlacedShape): number => {
  switch (s.kind) {
    case 'text':
      return 60;
    case 'note':
      return 240;
    case 'geo':
      return s.h;
    default:
      return Math.abs(s.dy) + 40;
  }
};

/**
 * Resolve x/y ausentes empilhando abaixo do conteúdo.
 * Shapes com x/y explícitos não movem o cursor automático.
 */
export const placeShapes = (
  inputs: readonly ShapeInput[],
  records:
    | ReadonlyMap<string, BoardRecord>
    | Readonly<Record<string, BoardRecord>>,
): readonly PlacedShape[] => {
  let cursor = contentBottom(records);
  return inputs.map((s): PlacedShape => {
    if (s.kind === 'text') {
      const x = s.x ?? AUTO_X;
      const y = s.y ?? cursor;
      if (s.y === undefined) cursor += 60 + AUTO_GAP;
      return {
        kind: 'text',
        text: s.text,
        x,
        y,
        color: s.color ?? 'black',
        size: s.size ?? 'm',
        font: s.font ?? 'draw',
      };
    }
    if (s.kind === 'note') {
      const x = s.x ?? AUTO_X;
      const y = s.y ?? cursor;
      if (s.y === undefined) cursor += 240 + AUTO_GAP;
      return {
        kind: 'note',
        text: s.text,
        x,
        y,
        color: s.color ?? 'black',
        font: s.font ?? 'draw',
      };
    }
    if (s.kind === 'geo') {
      const x = s.x ?? AUTO_X;
      const y = s.y ?? cursor;
      if (s.y === undefined) cursor += (s.h ?? 140) + AUTO_GAP;
      return {
        kind: 'geo',
        geo: s.geo ?? 'rectangle',
        label: s.label ?? '',
        w: s.w ?? 220,
        h: s.h ?? 140,
        x,
        y,
        color: s.color ?? 'black',
        size: s.size ?? 'm',
        fill: s.fill ?? 'none',
        font: s.font ?? 'draw',
        dash: s.dash ?? 'solid',
      };
    }
    const x = s.x1 ?? AUTO_X;
    const y = s.y1 ?? cursor;
    const placed: PlacedShape = {
      kind: s.kind,
      x,
      y,
      dx: s.x2 - x,
      dy: s.y2 - y,
      bend: s.bend ?? 0,
      color: s.color ?? 'black',
      size: s.size ?? 'm',
    };
    if (s.y1 === undefined) cursor += shapeHeight(placed) + AUTO_GAP;
    return placed;
  });
};

// ── Construção de records ──

let idSeq = 0;

export const newServerId = (): string =>
  `shape:ai-${Date.now().toString(36)}${
    (idSeq++ % 1296).toString(36).padStart(2, '0')
  }${Math.random().toString(36).slice(2, 6)}`;

/** Converte shapes posicionados em records Quickdraw (z sequencial). */
export const buildRecords = (
  placed: readonly PlacedShape[],
  startZ: number,
): readonly BoardRecord[] =>
  placed.map((s, i): BoardRecord => {
    const z = startZ + i;
    const id = newServerId();
    if (s.kind === 'text') {
      return {
        id,
        typeName: 'shape',
        type: 'text',
        x: s.x,
        y: s.y,
        rot: 0,
        z,
        props: {
          text: s.text,
          color: s.color,
          size: s.size,
          font: s.font,
          autosize: true,
          scale: 1,
        },
      };
    }
    if (s.kind === 'note') {
      // Sticky claro se a cor pedida for ilegível sobre amarelo: o cliente
      // usa amarelo quando a cor é 'black' — replicamos a regra.
      const color = s.color === 'black' ? 'yellow' : s.color;
      return {
        id,
        typeName: 'shape',
        type: 'note',
        x: s.x,
        y: s.y,
        rot: 0,
        z,
        props: { text: s.text, color, size: 'm', font: s.font, scale: 1 },
      };
    }
    if (s.kind === 'geo') {
      return {
        id,
        typeName: 'shape',
        type: 'geo',
        x: s.x,
        y: s.y,
        rot: 0,
        z,
        props: {
          geo: s.geo,
          w: s.w,
          h: s.h,
          color: s.color,
          size: s.size,
          dash: s.dash,
          fill: s.fill,
          font: s.font,
          ...(s.label ? { label: s.label } : {}),
        },
      };
    }
    // arrow | line: o cliente converte dash 'draw' em 'solid' ao criar.
    return {
      id,
      typeName: 'shape',
      type: s.kind,
      x: s.x,
      y: s.y,
      rot: 0,
      z,
      props: {
        dx: s.dx === 0 ? 0.01 : s.dx,
        dy: s.dy === 0 ? 0.01 : s.dy,
        bend: s.bend,
        color: s.color,
        size: s.size,
        dash: 'solid',
      },
    };
  });
