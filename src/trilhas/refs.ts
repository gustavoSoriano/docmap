import type { CreateRefInput, RefKind, RefRole, TrilhaRef } from './types.ts';

const GLOBAL = '_global_';
const PREFIX = ['trilha_refs', GLOBAL] as const;
const key = (id: string) => ['trilha_refs', GLOBAL, id] as const;

const KINDS: readonly RefKind[] = [
  'note',
  'skill',
  'macro',
  'podcast',
  'favorite',
];

export const isRefKind = (value: unknown): value is RefKind =>
  typeof value === 'string' && (KINDS as readonly string[]).includes(value);

export const isRefRole = (value: unknown): value is RefRole =>
  value === 'guardrail' || value === 'context';

export const listRefs = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<TrilhaRef[]> => {
  const out: TrilhaRef[] = [];
  for await (const entry of kv.list<TrilhaRef>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) out.push(entry.value);
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getRef = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaRef | null> => (await kv.get<TrilhaRef>(key(id))).value;

// Mesma (kind, targetId, nodeId) não duplica: atualiza o papel e devolve.
export const createRef = async (
  kv: Deno.Kv,
  trilhaId: string,
  input: CreateRefInput,
): Promise<{ ref: TrilhaRef; created: boolean }> => {
  const role = input.role ?? 'context';
  const existing = (await listRefs(kv, trilhaId)).find((r) =>
    r.kind === input.kind && r.targetId === input.targetId &&
    r.nodeId === input.nodeId
  );
  if (existing) {
    if (existing.role === role) return { ref: existing, created: false };
    const updated = { ...existing, role };
    await kv.set(key(existing.id), updated);
    return { ref: updated, created: false };
  }
  const ref: TrilhaRef = {
    id: crypto.randomUUID(),
    trilhaId,
    kind: input.kind,
    targetId: input.targetId,
    role,
    ...(input.nodeId ? { nodeId: input.nodeId } : {}),
    createdAt: new Date().toISOString(),
  };
  await kv.set(key(ref.id), ref);
  return { ref, created: true };
};

export const deleteRef = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaRef | null> => {
  const existing = await getRef(kv, id);
  if (!existing) return null;
  await kv.delete(key(id));
  return existing;
};

export const deleteRefsOf = async (
  kv: Deno.Kv,
  match: (r: TrilhaRef) => boolean,
): Promise<void> => {
  for await (const entry of kv.list<TrilhaRef>({ prefix: PREFIX })) {
    if (entry.value && match(entry.value)) await kv.delete(entry.key);
  }
};
