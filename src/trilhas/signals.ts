import type { CreateSignalInput, SignalKind, TrilhaSignal } from './types.ts';

const GLOBAL = '_global_';
const PREFIX = ['trilha_signals', GLOBAL] as const;
const key = (id: string) => ['trilha_signals', GLOBAL, id] as const;

const KINDS: readonly SignalKind[] = [
  'blocker',
  'warning',
  'question',
  'pending',
];

export const isSignalKind = (value: unknown): value is SignalKind =>
  typeof value === 'string' && (KINDS as readonly string[]).includes(value);

export const listSignals = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<TrilhaSignal[]> => {
  const out: TrilhaSignal[] = [];
  for await (const entry of kv.list<TrilhaSignal>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) out.push(entry.value);
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getSignal = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaSignal | null> => (await kv.get<TrilhaSignal>(key(id))).value;

export const createSignal = async (
  kv: Deno.Kv,
  trilhaId: string,
  input: CreateSignalInput,
): Promise<TrilhaSignal> => {
  const by = input.by?.trim();
  const signal: TrilhaSignal = {
    id: crypto.randomUUID(),
    trilhaId,
    ...(input.nodeId ? { nodeId: input.nodeId } : {}),
    kind: input.kind,
    text: input.text.trim().slice(0, 500),
    ...(by ? { by: by.slice(0, 60) } : {}),
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  await kv.set(key(signal.id), signal);
  return signal;
};

export const resolveSignal = async (
  kv: Deno.Kv,
  id: string,
  resolution?: string,
  by?: string,
): Promise<TrilhaSignal | null> => {
  const existing = await getSignal(kv, id);
  if (!existing) return null;
  const note = resolution?.trim().slice(0, 500);
  const who = by?.trim();
  const updated: TrilhaSignal = {
    ...existing,
    status: 'resolved',
    ...(note ? { resolution: note } : {}),
    ...(who ? { resolvedBy: who.slice(0, 60) } : {}),
    resolvedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const reopenSignal = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaSignal | null> => {
  const existing = await getSignal(kv, id);
  if (!existing) return null;
  const base = { ...existing, status: 'open' } as Record<string, unknown>;
  delete base.resolution;
  delete base.resolvedAt;
  delete base.resolvedBy;
  await kv.set(key(id), base as TrilhaSignal);
  return base as TrilhaSignal;
};

export const deleteSignal = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaSignal | null> => {
  const existing = await getSignal(kv, id);
  if (!existing) return null;
  await kv.delete(key(id));
  return existing;
};

export const deleteSignalsOf = async (
  kv: Deno.Kv,
  match: (s: TrilhaSignal) => boolean,
): Promise<void> => {
  for await (const entry of kv.list<TrilhaSignal>({ prefix: PREFIX })) {
    if (entry.value && match(entry.value)) await kv.delete(entry.key);
  }
};
