import type {
  Assignee,
  CreateNodeInput,
  TrilhaCriterion,
  TrilhaCriterionInput,
  TrilhaNode,
  TrilhaNodeStatus,
  UpdateNodeInput,
} from './types.ts';

const GLOBAL = '_global_';
const PREFIX = ['trilha_nodes', GLOBAL] as const;
const key = (id: string) => ['trilha_nodes', GLOBAL, id] as const;

// Sem sinal por mais que isso, a trava é considerada obsoleta (stale):
// visível na UI e passível de tomada (claim com force) ou next automático.
export const STALE_AFTER_MS = 5 * 60 * 1000;

export const isStaleClaim = (node: TrilhaNode, now = Date.now()): boolean => {
  if (!node.claimedBy) return false;
  const beat = node.lastHeartbeatAt ?? node.claimedAt;
  if (!beat) return true;
  return now - new Date(beat).getTime() > STALE_AFTER_MS;
};

const NODE_STATUS: readonly TrilhaNodeStatus[] = [
  'todo',
  'doing',
  'done',
  'blocked',
];

export const isNodeStatus = (value: unknown): value is TrilhaNodeStatus =>
  typeof value === 'string' &&
  (NODE_STATUS as readonly string[]).includes(value);

const defaultAssignee = (): Assignee => ({ kind: 'ai', label: 'IA' });

// Sanitiza critérios vindos de fora (API/UI/agentes): aceita string curta
// ou { id?, text, done? }; remove vazios, limita tamanho e garante shape
// { id, text, done }. Também cura registros antigos (string[]) na leitura.
// Função pura.
export const normalizeCriteria = (
  input: readonly TrilhaCriterionInput[] | undefined,
): readonly TrilhaCriterion[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => typeof item === 'string' ? { text: item } : item)
    .filter((item) =>
      item && typeof item.text === 'string' && item.text.trim()
    )
    .slice(0, 100)
    .map((item) => ({
      id: typeof item.id === 'string' && item.id
        ? item.id
        : crypto.randomUUID(),
      text: item.text.trim().slice(0, 500),
      done: item.done === true,
    }));
};

export const listNodes = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<TrilhaNode[]> => {
  const nodes: TrilhaNode[] = [];
  for await (const entry of kv.list<TrilhaNode>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) nodes.push(entry.value);
  }
  return nodes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getNode = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaNode | null> => {
  const entry = await kv.get<TrilhaNode>(key(id));
  return entry.value;
};

export const createNode = async (
  kv: Deno.Kv,
  trilhaId: string,
  input: CreateNodeInput,
  index: number,
): Promise<TrilhaNode> => {
  const now = new Date().toISOString();
  const node: TrilhaNode = {
    id: crypto.randomUUID(),
    trilhaId,
    title: input.title.trim(),
    details: input.details ?? '',
    result: input.result ?? '',
    doneCriteria: normalizeCriteria(input.doneCriteria),
    ...(input.blockedReason?.trim()
      ? { blockedReason: input.blockedReason.trim() }
      : {}),
    status: input.status ?? 'todo',
    assignee: input.assignee ?? defaultAssignee(),
    position: input.position ?? { x: 80 + (index % 4) * 240, y: 80 + Math.floor(index / 4) * 160 },
    createdAt: now,
    updatedAt: now,
  };
  await kv.set(key(node.id), node);
  return node;
};

export const updateNode = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateNodeInput,
): Promise<
  {
    node?: TrilhaNode;
    error?: 'not_found' | 'claimed' | 'stale' | 'done_needs_result';
    claimedBy?: string;
  }
> => {
  const existing = await getNode(kv, id);
  if (!existing) return { error: 'not_found' };
  if (
    input.expectedUpdatedAt !== undefined &&
    input.expectedUpdatedAt !== existing.updatedAt
  ) {
    return { error: 'stale' };
  }
  const by = input.by?.trim();
  if (existing.claimedBy && by !== existing.claimedBy) {
    return { error: 'claimed', claimedBy: existing.claimedBy };
  }
  const status = input.status ?? existing.status;
  const result = input.result ?? existing.result;
  const doneCriteria = normalizeCriteria(
    input.doneCriteria ?? existing.doneCriteria,
  );
  if (
    status === 'done' && doneCriteria.length > 0 && !result.trim()
  ) {
    return { error: 'done_needs_result' };
  }
  const blockedReason = input.blockedReason !== undefined
    ? input.blockedReason.trim()
    : existing.blockedReason;
  const updated: TrilhaNode = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.details !== undefined ? { details: input.details } : {}),
    ...(input.result !== undefined ? { result: input.result } : {}),
    ...(input.doneCriteria !== undefined
      ? { doneCriteria }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.assignee !== undefined ? { assignee: input.assignee } : {}),
    ...(input.position !== undefined ? { position: input.position } : {}),
    // Concluir libera a trava automaticamente — trabalho acabou.
    ...(status === 'done' ? { claimedBy: undefined, claimedAt: undefined } : {}),
    // Atividade do dono = sinal de vida (sem tocar updatedAt).
    ...(by ? { lastHeartbeatAt: new Date().toISOString() } : {}),
    updatedAt: new Date().toISOString(),
  };
  const base = { ...updated } as Record<string, unknown>;
  // Nós não têm tags (só a trilha tem) — limpa resquício de versões antigas.
  delete base.tags;
  if (!blockedReason) delete base.blockedReason;
  else base.blockedReason = blockedReason;
  if (status === 'done') {
    delete base.claimedBy;
    delete base.claimedAt;
  }
  await kv.set(key(id), base as TrilhaNode);
  return { node: base as TrilhaNode };
};

export const claimNode = async (
  kv: Deno.Kv,
  id: string,
  by: string,
  force = false,
): Promise<
  { node?: TrilhaNode; error?: 'not_found' | 'claimed'; claimedBy?: string }
> => {
  const existing = await getNode(kv, id);
  if (!existing) return { error: 'not_found' };
  const label = by.trim();
  if (existing.claimedBy && existing.claimedBy !== label && !force) {
    return { error: 'claimed', claimedBy: existing.claimedBy };
  }
  const now = new Date().toISOString();
  const updated: TrilhaNode = {
    ...existing,
    claimedBy: label,
    claimedAt: now,
    lastHeartbeatAt: now,
    updatedAt: now,
  };
  await kv.set(key(id), updated);
  return { node: updated };
};

export const heartbeatNode = async (
  kv: Deno.Kv,
  id: string,
  by: string,
): Promise<
  { node?: TrilhaNode; error?: 'not_found' | 'claimed'; claimedBy?: string }
> => {
  const existing = await getNode(kv, id);
  if (!existing) return { error: 'not_found' };
  const label = by.trim();
  if (existing.claimedBy && existing.claimedBy !== label) {
    return { error: 'claimed', claimedBy: existing.claimedBy };
  }
  const beat = new Date().toISOString();
  const updated: TrilhaNode = {
    ...existing,
    ...(existing.claimedBy ? {} : { claimedBy: label, claimedAt: beat }),
    lastHeartbeatAt: beat,
  };
  await kv.set(key(id), updated);
  return { node: updated };
};

export const releaseNode = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaNode | null> => {
  const existing = await getNode(kv, id);
  if (!existing) return null;
  if (!existing.claimedBy) return existing;
  const base = { ...existing } as Record<string, unknown>;
  delete base.claimedBy;
  delete base.claimedAt;
  base.updatedAt = new Date().toISOString();
  await kv.set(key(id), base as TrilhaNode);
  return base as TrilhaNode;
};

export const deleteNode = async (
  kv: Deno.Kv,
  id: string,
): Promise<TrilhaNode | null> => {
  const existing = await getNode(kv, id);
  if (!existing) return null;
  await kv.delete(key(id));
  return existing;
};

export const deleteNodesOfTrilha = async (
  kv: Deno.Kv,
  trilhaId: string,
): Promise<void> => {
  for await (const entry of kv.list<TrilhaNode>({ prefix: PREFIX })) {
    if (entry.value?.trilhaId === trilhaId) await kv.delete(entry.key);
  }
};
