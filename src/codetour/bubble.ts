// Parser puro do visual bubble (mapa radial hub-satélite).
// Content é JSON: {center:{label,detail},nodes:[{id,label,detail,parent,file?,slide?}]}.
// parent null = hub ligado ao centro; parent=<hubId> = satélite.
import type { TourBubbleContent, TourBubbleNode } from './types.ts';

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

type Ok = { readonly content: TourBubbleContent };
type Err = { readonly error: string };

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const parseBubbleContent = (raw: string): Ok | Err => {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return { error: 'bubble.content deve ser JSON válido' };
  }
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    return { error: 'bubble.content deve ser objeto {center, nodes}' };
  }
  const r = v as Record<string, unknown>;
  const center = r.center as Record<string, unknown> | undefined;
  const centerLabel = str(center?.label).trim();
  const centerDetail = str(center?.detail).trim();
  if (!centerLabel || centerLabel.length > 60) {
    return { error: 'bubble.center.label: 1 a 60 chars' };
  }
  if (!centerDetail || centerDetail.length > 280) {
    return { error: 'bubble.center.detail: 1 a 280 chars' };
  }
  if (!Array.isArray(r.nodes)) return { error: 'bubble.nodes deve ser lista' };
  const nodes = r.nodes as unknown[];
  if (nodes.length < 3 || nodes.length > 24) {
    return { error: 'bubble.nodes: de 3 a 24 nós' };
  }
  const ids = new Set<string>();
  const parsed: TourBubbleNode[] = [];
  for (const n of nodes) {
    if (n === null || typeof n !== 'object' || Array.isArray(n)) {
      return { error: 'bubble.nodes devem ser objetos' };
    }
    const o = n as Record<string, unknown>;
    const id = str(o.id).trim();
    const label = str(o.label).trim();
    const detail = str(o.detail).trim();
    if (!ID_RE.test(id)) {
      return { error: `bubble.node id inválido (${id || '?'})` };
    }
    if (ids.has(id)) return { error: `bubble.node id duplicado (${id})` };
    ids.add(id);
    if (!label || label.length > 40) {
      return { error: `bubble.node ${id}: label 1 a 40 chars` };
    }
    if (!detail || detail.length > 280) {
      return { error: `bubble.node ${id}: detail 1 a 280 chars` };
    }
    const parentRaw = o.parent === null ? null : str(o.parent).trim();
    const parent = parentRaw === '' ? null : parentRaw;
    if (parent !== null && !ID_RE.test(parent)) {
      return { error: `bubble.node ${id}: parent inválido` };
    }
    const file = str(o.file).trim() || null;
    const slide = str(o.slide).trim() || null;
    if (slide !== null && !ID_RE.test(slide)) {
      return { error: `bubble.node ${id}: slide inválido` };
    }
    parsed.push({ id, label, detail, parent, file, slide });
  }
  for (const n of parsed) {
    if (n.parent !== null && !ids.has(n.parent)) {
      return { error: `bubble.node ${n.id}: parent ${n.parent} não existe` };
    }
  }
  const hubs = parsed.filter((n) => n.parent === null);
  if (hubs.length < 2 || hubs.length > 8) {
    return { error: 'bubble: 2 a 8 hubs (parent null)' };
  }
  return {
    content: {
      center: { label: centerLabel, detail: centerDetail },
      nodes: parsed,
    },
  };
};

// Paleta por grupo (hub): o índice do hub define a cor, satélite herda.
export const BUBBLE_PALETTE = [
  '#f5b638',
  '#f2813c',
  '#2dd4bf',
  '#38bdf8',
  '#f472a6',
  '#a78bfa',
  '#fbbf24',
  '#34d399',
] as const;

export const bubbleColorOf = (hubIndex: number): string =>
  BUBBLE_PALETTE[
    ((hubIndex % BUBBLE_PALETTE.length) + BUBBLE_PALETTE.length) %
    BUBBLE_PALETTE.length
  ];
