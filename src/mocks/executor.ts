import type { MockContext, MockResult } from './types.ts';

// ── In-memory store por collection ───────────────────────────────────────────
// Resets quando o app reinicia — comportamento esperado em mocks.
// Cada collection tem seu próprio namespace isolado.

const collectionDbs = new Map<string, Map<string, unknown>>();

const getStore = (colId: string): Map<string, unknown> => {
  if (!collectionDbs.has(colId)) collectionDbs.set(colId, new Map());
  return collectionDbs.get(colId)!;
};

export const clearCollectionDb = (colId: string): void => {
  collectionDbs.delete(colId);
};

export const clearAllDbs = (): void => {
  collectionDbs.clear();
};

// Objeto `db` exposto no script — API síncrona, simples e previsível.
const makeDb = (colId: string) => {
  const store = getStore(colId);
  return {
    // Persiste um valor com a chave dada.
    set: (key: string, value: unknown): void => { store.set(key, value); },

    // Retorna o valor ou undefined se não existir.
    get: (key: string): unknown => store.get(key),

    // Remove uma chave. Retorna true se existia.
    delete: (key: string): boolean => store.delete(key),

    // Verifica existência.
    has: (key: string): boolean => store.has(key),

    // Lista todos os valores cujas chaves começam com `prefix`.
    list: (prefix = ''): unknown[] =>
      [...store.entries()]
        .filter(([k]) => k.startsWith(prefix))
        .map(([, v]) => v),

    // Lista as chaves que começam com `prefix`.
    keys: (prefix = ''): string[] =>
      [...store.keys()].filter((k) => k.startsWith(prefix)),

    // Apaga tudo desta collection.
    clear: (): void => { store.clear(); },

    // Número de entradas no store desta collection.
    size: (): number => store.size,
  };
};

// ── Executor ─────────────────────────────────────────────────────────────────
// new Function é intencional: script é autoria do usuário (salvo no KV),
// não dados de requests HTTP. Roda em strict mode em closure async.

export const executeScript = async (
  script: string,
  ctx: MockContext,
  colId: string,
): Promise<MockResult> => {
  try {
    const db = makeDb(colId);
    // deno-lint-ignore no-new-func
    const fn = new Function('ctx', 'db', `
      "use strict";
      return (async () => {
        ${script}
      })();
    `);
    const result = await (fn(ctx, db) as Promise<unknown>);
    if (result === null || result === undefined) return { status: 200 };
    if (typeof result !== 'object') return { status: 200, body: result };
    return result as MockResult;
  } catch (err) {
    return {
      status: 500,
      body: { error: 'script_error', message: String(err) },
    };
  }
};
