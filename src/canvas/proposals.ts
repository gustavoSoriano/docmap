// Propostas da IA — Fase 3 (consentimento antes de tocar no board ao vivo).
// A IA manda shapes e o servidor segura como proposta; nada entra no board
// sem o humano clicar Aplicar. Ephemeral em memória como o hub (não vai
// pro KV): restart limpa pendências, desenhos salvos não são afetados.

import { buildRecords, placeShapes } from './shapes.ts';
import type { ShapeInput } from './shapes.ts';
import type { BoardRecord, ProposalNotice } from './types.ts';

export interface Proposal {
  readonly id: string;
  readonly label: string;
  readonly inputs: readonly ShapeInput[];
  readonly records: readonly BoardRecord[];
  readonly createdAt: string;
}

/** Teto de propostas pendentes (anti-abuso / anti-spam de agentes). */
const MAX_PENDING = 20;

const pending = new Map<string, Proposal>();

const now = (): string => new Date().toISOString();

const noticeOf = (p: Proposal): ProposalNotice => ({
  id: p.id,
  label: p.label,
  count: p.records.length,
  createdAt: p.createdAt,
});

const maxZOf = (
  records: ReadonlyMap<string, BoardRecord> | Readonly<Record<string, BoardRecord>>,
): number => {
  const list = records instanceof Map
    ? [...records.values()]
    : Object.values(records);
  let z = 0;
  for (const rec of list) {
    const recZ = rec.z;
    if (typeof recZ === 'number' && Number.isFinite(recZ) && recZ > z) z = recZ;
  }
  return z;
};

export const createProposal = (
  inputs: readonly ShapeInput[],
  base: ReadonlyMap<string, BoardRecord> | Readonly<Record<string, BoardRecord>>,
  label?: string,
): Proposal => {
  const placed = placeShapes(inputs, base);
  const records = buildRecords(placed, maxZOf(base) + 1);
  const cleanLabel = (label ?? '').trim().slice(0, 120) || 'proposta da IA';
  const proposal: Proposal = {
    id: crypto.randomUUID(),
    label: cleanLabel,
    inputs,
    records,
    createdAt: now(),
  };
  pending.set(proposal.id, proposal);
  // Evita crescimento infinito: descarta as mais antigas.
  while (pending.size > MAX_PENDING) {
    const oldest = pending.keys().next().value;
    if (!oldest) break;
    pending.delete(oldest);
  }
  return proposal;
};

export const listProposalNotices = (): ProposalNotice[] =>
  [...pending.values()].map(noticeOf);

export const getProposal = (id: string): Proposal | null =>
  pending.get(id) ?? null;

export const dismissProposal = (id: string): boolean =>
  pending.delete(id);

/** Uso em testes — limpa todas as pendências. */
export const clearProposals = (): void => {
  pending.clear();
};
