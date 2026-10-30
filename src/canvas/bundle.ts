// Pacote portátil do canvas — desenho + macros vinculadas num JSON só.
// Links (`url`) e vínculos (`macroId`) já vivem nos records das formas; o
// pacote só junta as macros referenciadas (com o script) para o arquivo
// funcionar em outra máquina. Funções puras: o I/O fica em transfer.ts.

import type { Macro } from '../macros/types.ts';
import { validateSnapshot } from './hub.ts';
import type { BoardRecord, BoardSnapshot } from './types.ts';

export const BUNDLE_KIND = 'docmap-canvas';

export interface CanvasBundle {
  readonly kind: typeof BUNDLE_KIND;
  readonly version: 1;
  readonly exportedAt: string;
  readonly snapshot: BoardSnapshot;
  readonly macros: readonly Macro[];
}

export type ParsedBundle =
  | { readonly bundle: CanvasBundle }
  | { readonly error: string };

/** Ids de macro referenciados pelas formas (sem repetição). */
export const linkedMacroIds = (snapshot: BoardSnapshot): string[] => {
  const ids = new Set<string>();
  for (const rec of Object.values(snapshot.document.store)) {
    if (typeof rec.macroId === 'string' && rec.macroId) ids.add(rec.macroId);
  }
  return [...ids];
};

export const buildBundle = (
  snapshot: BoardSnapshot,
  macros: readonly Macro[],
  exportedAt: string,
): CanvasBundle => ({
  kind: BUNDLE_KIND,
  version: 1,
  exportedAt,
  snapshot,
  macros,
});

const isObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const isMacroLike = (v: unknown): v is Macro =>
  isObject(v) && typeof v.id === 'string' && !!v.id &&
  typeof v.name === 'string' && typeof v.title === 'string' &&
  typeof v.script === 'string';

/**
 * Valida o arquivo importado. Aceita o pacote completo ou só um documento
 * com `snapshot` (ex.: o board.json do disco) — nesse caso sem macros.
 */
export const parseBundle = (v: unknown): ParsedBundle => {
  if (!isObject(v)) return { error: 'arquivo deve ser um objeto JSON' };
  if (v.kind !== undefined && v.kind !== BUNDLE_KIND) {
    return { error: 'arquivo não é um canvas do docmap' };
  }
  if (v.version !== 1) return { error: 'versão do arquivo não suportada' };
  const snapErr = validateSnapshot(v.snapshot);
  if (snapErr) return { error: snapErr };
  const macros = v.macros ?? [];
  if (!Array.isArray(macros) || !macros.every(isMacroLike)) {
    return { error: 'lista de macros inválida' };
  }
  return {
    bundle: buildBundle(
      v.snapshot as BoardSnapshot,
      macros,
      typeof v.exportedAt === 'string' ? v.exportedAt : '',
    ),
  };
};

/** Troca os `macroId` das formas conforme o mapa (id antigo → id novo). */
export const remapMacroIds = (
  snapshot: BoardSnapshot,
  idMap: ReadonlyMap<string, string>,
): BoardSnapshot => {
  const store: Record<string, BoardRecord> = {};
  for (const [id, rec] of Object.entries(snapshot.document.store)) {
    const next = typeof rec.macroId === 'string'
      ? idMap.get(rec.macroId)
      : undefined;
    store[id] = next && next !== rec.macroId ? { ...rec, macroId: next } : rec;
  }
  return { document: { store } };
};

/** Nomes já usados que `uniqueName(base)` pode ter gerado (base primeiro). */
export const importedNames = (
  base: string,
  taken: ReadonlySet<string>,
): string[] => {
  const stem = `${base}-importada`;
  const variant = new RegExp(
    `^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-\\d+)?$`,
  );
  return [...taken]
    .filter((n) => n === base || variant.test(n))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
};

/** Nome livre a partir de `base`: base, base-importada, base-importada-2… */
export const uniqueName = (
  base: string,
  taken: ReadonlySet<string>,
): string => {
  if (!taken.has(base)) return base;
  const stem = `${base}-importada`;
  if (!taken.has(stem)) return stem;
  let n = 2;
  while (taken.has(`${stem}-${n}`)) n++;
  return `${stem}-${n}`;
};
