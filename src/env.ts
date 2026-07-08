// ════ Carregamento de variáveis de ambiente de arquivo .env ════
// Apps GUI no macOS não herdam env vars do shell (~/.zshrc etc.).
// Este módulo lê um arquivo .env no diretório de dados do app e define as
// vars via Deno.env.set() apenas se ainda não estiverem definidas.
//
// Deve ser importado como PRIMEIRO módulo em main.ts e worker.ts, para que
// as env vars estejam disponíveis antes de config.ts ser avaliado.

const appDataDir = (): string => {
  const home = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE') ?? '.';
  switch (Deno.build.os) {
    case 'darwin':
      return `${home}/Library/Application Support/docmap`;
    case 'windows':
      return `${Deno.env.get('APPDATA') ?? home}\\docmap`;
    default: {
      const xdg = Deno.env.get('XDG_DATA_HOME');
      return xdg ? `${xdg}/docmap` : `${home}/.local/share/docmap`;
    }
  }
};

const parseEnvLine = (line: string): { readonly key: string; readonly value: string } | null => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const eq = trimmed.indexOf('=');
  if (eq === -1) return null;
  const key = trimmed.slice(0, eq).trim();
  const rawValue = trimmed.slice(eq + 1).trim();
  if (!key) return null;
  const value = rawValue.replace(/^["']|["']$/g, '');
  return { key, value };
};

const loadEnvFile = (): void => {
  const path = `${appDataDir()}/.env`;
  try {
    const text = Deno.readTextFileSync(path);
    for (const line of text.split('\n')) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      const { key, value } = parsed;
      if (Deno.env.get(key) === undefined) {
        Deno.env.set(key, value);
      }
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      console.error(`[env] erro lendo ${path}:`, err);
    }
  }
};

loadEnvFile();
