// Exportar/importar o canvas com as macros vinculadas (I/O: KV + hub).
// Importar SUBSTITUI a lousa única para todos; cada macro do pacote é
// resolvida antes: mesmo id → reaproveita; mesmo nome e mesmo script →
// reaproveita (inclui `nome-importada[-N]`); senão cria uma nova (nome
// livre) e remapeia o `macroId`.

import {
  createMacro,
  getMacroById,
  getMacroByName,
  getMacroCollection,
  listMacros,
} from '../macros/store.ts';
import type { Macro } from '../macros/types.ts';
import {
  buildBundle,
  importedNames,
  linkedMacroIds,
  remapMacroIds,
  uniqueName,
} from './bundle.ts';
import type { CanvasBundle } from './bundle.ts';
import { boardHub } from './hub.ts';

export interface CanvasImportResult {
  readonly shapes: number;
  readonly macrosCreated: number;
  readonly macrosReused: number;
}

export const exportCanvas = async (kv: Deno.Kv): Promise<CanvasBundle> => {
  const snapshot = boardHub.getSnapshot();
  const found = await Promise.all(
    linkedMacroIds(snapshot).map((id) => getMacroById(kv, id)),
  );
  const macros = found.filter((m): m is Macro => m !== null);
  return buildBundle(snapshot, macros, new Date().toISOString());
};

/**
 * Id local equivalente à macro do pacote, ou null se precisa criar.
 * Procura também `nome-importada[-N]`: reimportar o mesmo arquivo depois de
 * uma colisão de nome não cria outra cópia.
 */
const findExisting = async (
  kv: Deno.Kv,
  m: Macro,
  taken: ReadonlySet<string>,
): Promise<string | null> => {
  if (await getMacroById(kv, m.id)) return m.id;
  for (const name of importedNames(m.name, taken)) {
    const found = await getMacroByName(kv, name);
    if (found && found.script === m.script) return found.id;
  }
  return null;
};

const createFrom = async (
  kv: Deno.Kv,
  m: Macro,
  taken: Set<string>,
): Promise<string> => {
  const name = uniqueName(m.name, taken);
  taken.add(name);
  const keepCollection = m.collectionId &&
    await getMacroCollection(kv, m.collectionId);
  const created = await createMacro(kv, {
    name,
    title: m.title,
    description: m.description,
    script: m.script,
    inputLabel: m.inputLabel ?? null,
    tags: m.tags,
    ...(keepCollection ? { collectionId: m.collectionId } : {}),
  });
  return created.id;
};

export const importCanvas = async (
  kv: Deno.Kv,
  bundle: CanvasBundle,
): Promise<CanvasImportResult> => {
  const taken = new Set((await listMacros(kv)).map((m) => m.name));
  const idMap = new Map<string, string>();
  let macrosCreated = 0;
  for (const m of bundle.macros) {
    const existing = await findExisting(kv, m, taken);
    if (!existing) macrosCreated++;
    idMap.set(m.id, existing ?? await createFrom(kv, m, taken));
  }
  const snapshot = remapMacroIds(bundle.snapshot, idMap);
  boardHub.replaceBoard(snapshot);
  return {
    shapes: Object.keys(snapshot.document.store).length,
    macrosCreated,
    macrosReused: bundle.macros.length - macrosCreated,
  };
};
