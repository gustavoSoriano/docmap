import { dataDir, kvPath } from '../config.ts';

// Garante o diretório de dados e abre o KV num caminho FIXO, próprio do app.
// Isso desacopla os dados do caminho do binário — atualizar o app não perde nada.
export const openAppKv = async (): Promise<Deno.Kv> => {
  await Deno.mkdir(dataDir(), { recursive: true });
  return Deno.openKv(kvPath());
};
