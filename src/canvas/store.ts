// Biblioteca de desenhos — metadados no KV, snapshots no filesystem.
// Snapshots podem passar de 64 KiB (imagens embutidas), então o documento
// vai pra disco como podcasts fazem com MP3; no KV fica só a ficha.

import { drawingsDir } from '../config.ts';
import { normalizeTags } from '../tags/normalize.ts';
import { validateSnapshot } from './hub.ts';
import { buildRecords, placeShapes } from './shapes.ts';
import type { ShapeInput } from './shapes.ts';
import type {
  BoardRecord,
  BoardSnapshot,
  DrawingCollection,
  DrawingDocument,
  DrawingMeta,
} from './types.ts';

const COL_PREFIX = ['canvas_collections'] as const;
const colKey = (id: string) => [...COL_PREFIX, id] as const;

const META_PREFIX = ['canvas_drawings'] as const;
const metaKey = (colId: string, id: string) =>
  [...META_PREFIX, colId, id] as const;
const metaColPrefix = (colId: string) => [...META_PREFIX, colId] as const;

/** Tamanho máximo do documento JSON no disco. */
const MAX_DOC_BYTES = 20 * 1024 * 1024;

/** Ids aceitos em caminhos (uuid + nome base) — anti path traversal. */
const isSafeId = (id: string): boolean => /^[A-Za-z0-9_-]{1,80}$/.test(id);

const docPath = (colId: string, id: string): string =>
  `${drawingsDir()}/${colId}/${id}.json`;

const now = (): string => new Date().toISOString();

// ── Collections ──────────────────────────────────────────────────────────────

export const listCollections = async (
  kv: Deno.Kv,
): Promise<DrawingCollection[]> => {
  const cols: DrawingCollection[] = [];
  for await (
    const entry of kv.list<DrawingCollection>({ prefix: COL_PREFIX })
  ) {
    if (entry.value) cols.push(entry.value);
  }
  return cols.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getCollection = async (
  kv: Deno.Kv,
  id: string,
): Promise<DrawingCollection | null> => {
  const entry = await kv.get<DrawingCollection>(colKey(id));
  return entry.value;
};

export const createCollection = async (
  kv: Deno.Kv,
  input: { name: string; tags?: readonly string[] },
): Promise<DrawingCollection> => {
  const col: DrawingCollection = {
    id: crypto.randomUUID(),
    name: input.name,
    tags: normalizeTags(input.tags),
    createdAt: now(),
    updatedAt: now(),
  };
  await kv.set(colKey(col.id), col);
  return col;
};

/** Garante a collection padrão ("Geral") — a UI salva nela sem perguntar. */
export const ensureDefaultCollection = async (
  kv: Deno.Kv,
): Promise<DrawingCollection> => {
  const existing = await listCollections(kv);
  if (existing.length > 0) return existing[0];
  return await createCollection(kv, { name: 'Geral' });
};

export const updateCollection = async (
  kv: Deno.Kv,
  id: string,
  input: { name: string; tags?: readonly string[] },
): Promise<DrawingCollection | null> => {
  const existing = await getCollection(kv, id);
  if (!existing) return null;
  const updated: DrawingCollection = {
    ...existing,
    name: input.name,
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    updatedAt: now(),
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
  for await (const entry of kv.list({ prefix: metaColPrefix(id) })) {
    await kv.delete(entry.key);
  }
  await kv.delete(colKey(id));
  await Deno.remove(`${drawingsDir()}/${id}`, { recursive: true }).catch(
    () => {},
  );
  return true;
};

// ── Desenhos (metadados) ─────────────────────────────────────────────────────

export const listDrawings = async (
  kv: Deno.Kv,
  collectionId?: string,
): Promise<DrawingMeta[]> => {
  const prefix = collectionId ? metaColPrefix(collectionId) : META_PREFIX;
  const out: DrawingMeta[] = [];
  for await (const entry of kv.list<DrawingMeta>({ prefix })) {
    if (entry.value) out.push(entry.value);
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getDrawing = async (
  kv: Deno.Kv,
  id: string,
): Promise<DrawingMeta | null> => {
  for await (const entry of kv.list<DrawingMeta>({ prefix: META_PREFIX })) {
    if (entry.value?.id === id) return entry.value;
  }
  return null;
};

export const createDrawing = async (
  kv: Deno.Kv,
  input: {
    collectionId: string;
    name: string;
    tags?: readonly string[];
    snapshot: BoardSnapshot;
    shapes: number;
  },
): Promise<DrawingMeta | null> => {
  const col = await getCollection(kv, input.collectionId);
  if (!col) return null;
  if (validateSnapshot(input.snapshot) !== null) return null;
  const meta: DrawingMeta = {
    id: crypto.randomUUID(),
    collectionId: input.collectionId,
    name: input.name,
    // Sem tags explícitas, herda as da collection (eixo do grafo).
    tags: normalizeTags(input.tags ?? col.tags),
    shapes: input.shapes,
    createdAt: now(),
    updatedAt: now(),
  };
  await writeDocument(input.collectionId, meta.id, input.snapshot);
  await kv.set(metaKey(input.collectionId, meta.id), meta);
  return meta;
};

export const overwriteDrawing = async (
  kv: Deno.Kv,
  id: string,
  input: { snapshot: BoardSnapshot; shapes: number },
): Promise<DrawingMeta | null> => {
  const existing = await getDrawing(kv, id);
  if (!existing) return null;
  if (validateSnapshot(input.snapshot) !== null) return null;
  await writeDocument(existing.collectionId, id, input.snapshot);
  const updated: DrawingMeta = {
    ...existing,
    shapes: input.shapes,
    updatedAt: now(),
  };
  await kv.set(metaKey(existing.collectionId, id), updated);
  return updated;
};

export const renameDrawing = async (
  kv: Deno.Kv,
  id: string,
  input: { name?: string; collectionId?: string; tags?: readonly string[] },
): Promise<DrawingMeta | null> => {
  const existing = await getDrawing(kv, id);
  if (!existing) return null;
  const nextCollectionId = input.collectionId ?? existing.collectionId;
  if (nextCollectionId !== existing.collectionId) {
    const col = await getCollection(kv, nextCollectionId);
    if (!col) return null;
    const doc = await readDocument(existing.collectionId, id);
    if (!doc) return null;
    await writeDocument(nextCollectionId, id, doc.snapshot);
    await deleteDocument(existing.collectionId, id);
    await kv.delete(metaKey(existing.collectionId, id));
  }
  const updated: DrawingMeta = {
    ...existing,
    collectionId: nextCollectionId,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    updatedAt: now(),
  };
  await kv.set(metaKey(nextCollectionId, id), updated);
  return updated;
};

export const deleteDrawing = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const existing = await getDrawing(kv, id);
  if (!existing) return false;
  await deleteDocument(existing.collectionId, id);
  await kv.delete(metaKey(existing.collectionId, id));
  return true;
};

// ── IA isolada (Fase 3): desenha direto no desenho salvo, sem live ──

/**
 * Anexa shapes da IA a um desenho salvo (posiciona abaixo do conteúdo
 * existente do próprio desenho). Não toca no board ao vivo — isolamento.
 * Retorna metadados atualizados + ids, ou null se desenho/inputs inválidos.
 */
export const appendShapesToDrawing = async (
  kv: Deno.Kv,
  id: string,
  inputs: readonly ShapeInput[],
): Promise<{ meta: DrawingMeta; ids: string[] } | null> => {
  const existing = await getDrawing(kv, id);
  if (!existing) return null;
  const doc = await readDocument(existing.collectionId, id);
  if (!doc) return null;
  const placed = placeShapes(inputs, doc.snapshot.document.store);
  let maxZ = 0;
  for (const rec of Object.values(doc.snapshot.document.store)) {
    const recZ = rec.z;
    if (typeof recZ === 'number' && Number.isFinite(recZ) && recZ > maxZ) {
      maxZ = recZ;
    }
  }
  const records = buildRecords(placed, maxZ + 1);
  const store: Record<string, BoardRecord> = {
    ...doc.snapshot.document.store,
  };
  for (const rec of records) store[rec.id] = rec;
  const snapshot: BoardSnapshot = { document: { store } };
  if (validateSnapshot(snapshot) !== null) return null;
  await writeDocument(existing.collectionId, id, snapshot);
  const updated: DrawingMeta = {
    ...existing,
    shapes: Object.keys(store).length,
    updatedAt: now(),
  };
  await kv.set(metaKey(existing.collectionId, id), updated);
  return { meta: updated, ids: records.map((rec) => rec.id) };
};

/**
 * Cria um desenho isolado a partir de records prontos (proposta salva —
 * Fase 3). Snapshot vai pro filesystem como nos saves normais.
 */
export const createDrawingFromRecords = async (
  kv: Deno.Kv,
  input: {
    collectionId: string;
    name: string;
    tags?: readonly string[];
    records: readonly BoardRecord[];
  },
): Promise<DrawingMeta | null> => {
  const col = await getCollection(kv, input.collectionId);
  if (!col) return null;
  const store: Record<string, BoardRecord> = {};
  for (const rec of input.records) store[rec.id] = rec;
  const snapshot: BoardSnapshot = { document: { store } };
  if (validateSnapshot(snapshot) !== null) return null;
  const meta: DrawingMeta = {
    id: crypto.randomUUID(),
    collectionId: input.collectionId,
    name: input.name,
    tags: normalizeTags(input.tags ?? col.tags),
    shapes: input.records.length,
    createdAt: now(),
    updatedAt: now(),
  };
  await writeDocument(input.collectionId, meta.id, snapshot);
  await kv.set(metaKey(input.collectionId, meta.id), meta);
  return meta;
};

// ── Documentos (filesystem) ──────────────────────────────────────────────────

export const writeDocument = async (
  colId: string,
  id: string,
  snapshot: BoardSnapshot,
): Promise<void> => {
  if (!isSafeId(colId) || !isSafeId(id)) throw new Error('id inválido');
  const body = JSON.stringify(
    { version: 1, snapshot } satisfies DrawingDocument,
  );
  if (body.length > MAX_DOC_BYTES) throw new Error('documento excede 20MB');
  const dir = `${drawingsDir()}/${colId}`;
  await Deno.mkdir(dir, { recursive: true });
  const tmp = `${dir}/.${id}.tmp`;
  await Deno.writeTextFile(tmp, body);
  await Deno.rename(tmp, docPath(colId, id));
};

export const readDocument = async (
  colId: string,
  id: string,
): Promise<DrawingDocument | null> => {
  if (!isSafeId(colId) || !isSafeId(id)) return null;
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(docPath(colId, id));
  } catch {
    return null;
  }
  if (!stat.isFile || stat.size > MAX_DOC_BYTES) return null;
  try {
    const raw = await Deno.readTextFile(docPath(colId, id));
    const doc = JSON.parse(raw) as Partial<DrawingDocument>;
    if (doc.version !== 1 || validateSnapshot(doc.snapshot) !== null) {
      return null;
    }
    return { version: 1, snapshot: doc.snapshot as BoardSnapshot };
  } catch {
    return null;
  }
};

const deleteDocument = async (colId: string, id: string): Promise<void> => {
  if (!isSafeId(colId) || !isSafeId(id)) return;
  await Deno.remove(docPath(colId, id)).catch(() => {});
};
