// ════ Offload do script quando ele excede o limite do KV ════
// Deno KV limita cada valor a ~64 KiB. Roteiros longos (especialmente
// com slides — CSS art pode inflar bastante) ultrapassam isso. Solução:
// quando o script passa de SCRIPT_KV_MAX, salvamos em arquivo e deixamos
// no KV apenas um placeholder. Quem lê usa readScript() que esconde a
// diferença (KV ou FS).

import { slidesDir } from './slides.ts';

// Limiar conservador: 50 KiB de texto já é um roteiro enorme.
export const SCRIPT_KV_MAX = 50_000;

export const scriptFilePath = (id: string): string =>
  `${slidesDir(id)}/script.txt`;

export const writeScriptFile = async (
  id: string,
  content: string,
): Promise<void> => {
  await Deno.mkdir(slidesDir(id), { recursive: true });
  await Deno.writeTextFile(scriptFilePath(id), content);
};

export const readScriptFile = async (id: string): Promise<string | null> => {
  try {
    return await Deno.readTextFile(scriptFilePath(id));
  } catch {
    return null;
  }
};

export const deleteScriptFile = async (id: string): Promise<void> => {
  await Deno.remove(scriptFilePath(id)).catch(() => {});
};

// Decide se o script deve ir pro FS e, se sim, escreve lá.
// Retorna o valor que deve ir no campo `script` do KV: ou o próprio
// script (se couber) ou string vazia (sinalizando que está no FS).
export const maybeOverflowScript = async (
  id: string,
  script: string,
): Promise<string> => {
  if (script.length <= SCRIPT_KV_MAX) return script;
  await writeScriptFile(id, script);
  return '';
};
