import { APP_VERSION } from '../config.ts';

export type BackupEntry = { readonly key: unknown[]; readonly value: unknown };
export type Backup = {
  readonly app: 'docmap';
  readonly version: string;
  readonly exportedAt: string;
  readonly entries: readonly BackupEntry[];
};

// Exporta TODO o KV (notas, anotações, workspaces, meta) num objeto serializável.
export const exportKv = async (kv: Deno.Kv): Promise<Backup> => {
  const entries: BackupEntry[] = [];
  for await (const entry of kv.list({ prefix: [] })) {
    entries.push({ key: entry.key as unknown[], value: entry.value });
  }
  return {
    app: 'docmap',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  };
};

// Importa um backup. Por padrão mescla; passe replace=true para limpar antes.
export const importKv = async (
  kv: Deno.Kv,
  backup: Backup,
  replace = false,
): Promise<number> => {
  if (backup.app !== 'docmap' || !Array.isArray(backup.entries)) {
    throw new Error('Arquivo de backup inválido');
  }

  if (replace) {
    for await (const entry of kv.list({ prefix: [] })) {
      await kv.delete(entry.key);
    }
  }

  let count = 0;
  for (const { key, value } of backup.entries) {
    await kv.set(key as Deno.KvKey, value);
    count += 1;
  }
  return count;
};
