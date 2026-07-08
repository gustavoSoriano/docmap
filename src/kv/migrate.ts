// ════ Migração de schema do KV ════
// Uma chave ["_meta","schemaVersion"] guarda a versão atual dos dados.
// Cada migração transforma o KV de N para N+1. Rodam em ordem no boot.

const VERSION_KEY = ['_meta', 'schemaVersion'] as const;

type Migration = (kv: Deno.Kv) => Promise<void>;

// Índice = versão de destino. migrations[0] leva de v0 (vazio) para v1.
const migrations: Migration[] = [
  // v1 — baseline. Nada a fazer; estrutura inicial já é a corrente.
  async (_kv) => {},

  // v2 — adiciona config de AI. Default: ollama (provider local).
  async (kv) => {
    await kv.set(['ai', 'config'], { provider: 'ollama' });
  },
];

export const CURRENT_SCHEMA = migrations.length;

export const runMigrations = async (kv: Deno.Kv): Promise<number> => {
  const entry = await kv.get<number>(VERSION_KEY);
  let version = entry.value ?? 0;

  while (version < CURRENT_SCHEMA) {
    await migrations[version](kv);
    version += 1;
    await kv.set(VERSION_KEY, version);
  }

  return version;
};
