// Canvas único persistido — snapshot do board num arquivo JSON.
// O board pode passar de 64 KiB (imagens embutidas), então vai pro
// filesystem como os podcasts fazem com MP3; o KV não guarda nada do canvas.
//
// Toda mutação do hub agenda um save com debounce curto (coalesce traços
// rápidos do pincel); o boot restaura o arquivo via `readBoardDocument`.
// Propositalmente sem importar `hub.ts` (o hub importa daqui — sem ciclo).

import { canvasFile } from '../config.ts';
import type { BoardSnapshot } from './types.ts';

export interface CanvasDocument {
  readonly version: 1;
  readonly snapshot: BoardSnapshot;
  readonly updatedAt: string;
}

/** Teto do documento JSON no disco (mesmo teto dos snapshots validáveis). */
const MAX_DOC_BYTES = 20 * 1024 * 1024;

/** Debounce do auto-save — mutações em rajada viram uma escrita só. */
const SAVE_DEBOUNCE_MS = 400;

const dirOf = (path: string): string => {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return i > 0 ? path.slice(0, i) : '.';
};

/** Checagem estrutural leve (o hub revalida de verdade no restore). */
const isSnapshotLike = (v: unknown): v is BoardSnapshot => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const doc = (v as Record<string, unknown>).document;
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return false;
  }
  const store = (doc as Record<string, unknown>).store;
  if (store === null || typeof store !== 'object' || Array.isArray(store)) {
    return false;
  }
  for (const [id, rec] of Object.entries(store)) {
    if (!id || rec === null || typeof rec !== 'object' || Array.isArray(rec)) {
      return false;
    }
    const r = rec as Record<string, unknown>;
    if (typeof r.id !== 'string' || r.id !== id) return false;
    if (typeof r.typeName !== 'string' || !r.typeName) return false;
  }
  return true;
};

/** Lê o documento persistido. Null se inexistente ou inválido. */
export const readBoardDocument = async (): Promise<CanvasDocument | null> => {
  const path = canvasFile();
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(path);
  } catch {
    return null;
  }
  if (!stat.isFile || stat.size > MAX_DOC_BYTES) return null;
  try {
    const raw = await Deno.readTextFile(path);
    const doc = JSON.parse(raw) as Partial<CanvasDocument>;
    if (doc.version !== 1 || !isSnapshotLike(doc.snapshot)) return null;
    if (typeof doc.updatedAt !== 'string' || !doc.updatedAt) return null;
    return {
      version: 1,
      snapshot: doc.snapshot,
      updatedAt: doc.updatedAt,
    };
  } catch {
    return null;
  }
};

/** Grava o snapshot atual. Retorna o updatedAt gravado. */
export const writeBoardDocument = async (
  snapshot: BoardSnapshot,
): Promise<string> => {
  if (!isSnapshotLike(snapshot)) throw new Error('snapshot inválido');
  const updatedAt = new Date().toISOString();
  const body = JSON.stringify(
    { version: 1, snapshot, updatedAt } satisfies CanvasDocument,
  );
  if (body.length > MAX_DOC_BYTES) throw new Error('board excede 20MB');
  const path = canvasFile();
  await Deno.mkdir(dirOf(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await Deno.writeTextFile(tmp, body);
  await Deno.rename(tmp, path);
  return updatedAt;
};

/** Apaga o arquivo persistido (board volta vazio no próximo boot). */
export const clearBoardDocument = async (): Promise<void> => {
  await Deno.remove(canvasFile()).catch(() => {});
};

// ── Auto-save com debounce ─────────────────────────────────────────────────

let pending: BoardSnapshot | null = null;
let timer: ReturnType<typeof setTimeout> | 0 = 0;

const flushSoon = (): void => {
  timer = setTimeout(async () => {
    timer = 0;
    const next = pending;
    pending = null;
    if (!next) return;
    try {
      await writeBoardDocument(next);
    } catch (err) {
      console.error('canvas: falha ao persistir board', err);
    }
  }, SAVE_DEBOUNCE_MS);
};

/** Agenda a persistência do snapshot atual (coalesce rajadas de diffs). */
export const scheduleBoardPersist = (snapshot: BoardSnapshot): void => {
  pending = snapshot;
  if (timer) return;
  flushSoon();
};

/** Uso em testes/boot — grava agora o que estiver pendente. */
export const flushBoardPersist = async (): Promise<void> => {
  if (timer) {
    clearTimeout(timer);
    timer = 0;
  }
  const next = pending;
  pending = null;
  if (next) await writeBoardDocument(next);
};

/** Uso em testes — descarta pendência sem gravar. */
export const resetBoardPersistForTests = (): void => {
  if (timer) {
    clearTimeout(timer);
    timer = 0;
  }
  pending = null;
};
