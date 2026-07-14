import type {
  CreateCollectionInput,
  CreateMockInput,
  Mock,
  MockCollection,
  UpdateMockInput,
} from './types.ts';

const COL_PREFIX = ['mock_collections'] as const;
const colKey = (id: string) => [...COL_PREFIX, id] as const;

const MOCK_PREFIX = ['mocks_data'] as const;
const mockKey = (colId: string, id: string) =>
  [...MOCK_PREFIX, colId, id] as const;
const mockColPrefix = (colId: string) => [...MOCK_PREFIX, colId] as const;

// ── Collections ──────────────────────────────────────────────────────────────

export const listCollections = async (
  kv: Deno.Kv,
): Promise<MockCollection[]> => {
  const cols: MockCollection[] = [];
  for await (const entry of kv.list<MockCollection>({ prefix: COL_PREFIX })) {
    if (entry.value) cols.push(entry.value);
  }
  return cols.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<MockCollection | null> => {
  const entry = await kv.get<MockCollection>(colKey(id));
  return entry.value;
};

export const createCollection = async (
  kv: Deno.Kv,
  input: CreateCollectionInput,
): Promise<MockCollection> => {
  const col: MockCollection = {
    id: crypto.randomUUID(),
    name: input.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(colKey(col.id), col);
  return col;
};

export const updateCollection = async (
  kv: Deno.Kv,
  id: string,
  name: string,
): Promise<MockCollection | null> => {
  const existing = await getCollection(kv, id);
  if (!existing) return null;
  const updated: MockCollection = {
    ...existing,
    name,
    updatedAt: new Date().toISOString(),
  };
  await kv.set(colKey(id), updated);
  return updated;
};

export const deleteCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const existing = await getCollection(kv, id);
  if (!existing) return false;
  for await (const entry of kv.list({ prefix: mockColPrefix(id) })) {
    await kv.delete(entry.key);
  }
  await kv.delete(colKey(id));
  return true;
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

export const listMocks = async (
  kv: Deno.Kv,
  collectionId?: string,
): Promise<Mock[]> => {
  const prefix = collectionId ? mockColPrefix(collectionId) : MOCK_PREFIX;
  const mocks: Mock[] = [];
  for await (const entry of kv.list<Mock>({ prefix })) {
    if (entry.value) mocks.push(entry.value);
  }
  return mocks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getMock = async (
  kv: Deno.Kv,
  id: string,
): Promise<Mock | null> => {
  for await (const entry of kv.list<Mock>({ prefix: MOCK_PREFIX })) {
    if (entry.value?.id === id) return entry.value;
  }
  return null;
};

export const findMockByEndpoint = async (
  kv: Deno.Kv,
  collectionId: string,
  method: string,
  path: string,
  excludeId?: string,
): Promise<Mock | null> => {
  for await (
    const entry of kv.list<Mock>({ prefix: mockColPrefix(collectionId) })
  ) {
    const mock = entry.value;
    if (!mock) continue;
    if (mock.id === excludeId) continue;
    if (mock.method === method && mock.path === path) return mock;
  }
  return null;
};

export const createMock = async (
  kv: Deno.Kv,
  input: CreateMockInput,
): Promise<Mock> => {
  const mock: Mock = {
    id: crypto.randomUUID(),
    collectionId: input.collectionId,
    method: input.method,
    path: input.path,
    name: input.name ?? '',
    group: input.group ?? '',
    script: input.script,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(mockKey(input.collectionId, mock.id), mock);
  return mock;
};

export const updateMock = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateMockInput,
): Promise<Mock | null> => {
  const existing = await getMock(kv, id);
  if (!existing) return null;

  const updated: Mock = {
    ...existing,
    ...(input.method !== undefined ? { method: input.method } : {}),
    ...(input.path !== undefined ? { path: input.path } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.group !== undefined ? { group: input.group } : {}),
    ...(input.script !== undefined ? { script: input.script } : {}),
    updatedAt: new Date().toISOString(),
  };

  if (input.collectionId && input.collectionId !== existing.collectionId) {
    await kv.delete(mockKey(existing.collectionId, id));
    const moved: Mock = { ...updated, collectionId: input.collectionId };
    await kv.set(mockKey(input.collectionId, id), moved);
    return moved;
  }

  await kv.set(mockKey(existing.collectionId, id), updated);
  return updated;
};

export const deleteMock = async (kv: Deno.Kv, id: string): Promise<boolean> => {
  const existing = await getMock(kv, id);
  if (!existing) return false;
  await kv.delete(mockKey(existing.collectionId, id));
  return true;
};

// Remove todos os mocks de uma collection sem deletar a collection em si.
export const clearCollectionMocks = async (
  kv: Deno.Kv,
  colId: string,
): Promise<number> => {
  let count = 0;
  for await (const entry of kv.list({ prefix: mockColPrefix(colId) })) {
    await kv.delete(entry.key);
    count++;
  }
  return count;
};

export const clearAllMocks = async (kv: Deno.Kv): Promise<void> => {
  for await (const entry of kv.list({ prefix: MOCK_PREFIX })) {
    await kv.delete(entry.key);
  }
  for await (const entry of kv.list({ prefix: COL_PREFIX })) {
    await kv.delete(entry.key);
  }
};
