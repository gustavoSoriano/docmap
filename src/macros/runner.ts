import { dirname } from 'jsr:@std/path@1/dirname';
import type { Macro } from './types.ts';

// Padrões bloqueados por padrão — protegem contra scripts destrutivos acidentais.
// O usuário pode ver mas não pode executar scripts que contenham esses padrões.
const BLOCKLIST: RegExp[] = [
  /rm\s+-rf/,
  /rm\s+-fr/,
  /Deno\.remove/,
  /Deno\.removeSync/,
  /DROP\s+TABLE/i,
  /DELETE\s+FROM/i,
  /format\s+[A-Z]:/i, // Windows format
  /mkfs\./, // Linux format
  />\s*\/dev\/sd/, // disk overwrite
];

export type BlockedResult = { blocked: true; reason: string };
export type RunResult = { blocked: false; stream: ReadableStream<Uint8Array> };

const checkBlocklist = (script: string): string | null => {
  for (const pattern of BLOCKLIST) {
    if (pattern.test(script)) return `Padrão bloqueado: ${pattern.source}`;
  }
  return null;
};

export const runMacro = async (
  macro: Macro,
): Promise<BlockedResult | RunResult> => {
  const blocked = checkBlocklist(macro.script);
  if (blocked) return { blocked: true, reason: blocked };

  // escreve o script em arquivo temporário
  const ext = macro.interpreter === 'deno' ? '.ts' : '.sh';
  const tmpFile = await Deno.makeTempFile({ suffix: ext });
  await Deno.writeTextFile(tmpFile, macro.script);
  if (macro.interpreter === 'bash') await Deno.chmod(tmpFile, 0o755);

  const cmd = macro.interpreter === 'deno'
    ? ['deno', 'run', '--allow-all', '--unstable-kv', tmpFile]
    : ['bash', tmpFile];

  const env: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(Deno.env.toObject()).filter(([k]) =>
        ['HOME', 'PATH', 'USER', 'SHELL', 'LANG', 'TERM'].includes(k)
      ),
    ),
    DOCMAP_API: 'http://127.0.0.1:3334',
    DOCMAP_KV: `${
      Deno.env.get('HOME')
    }/Library/Application Support/docmap/data.sqlite3`,
  };

  // macOS GUI apps não herdam o PATH do shell.
  // Adiciona diretórios comuns de package managers se existirem no sistema.
  const extraPaths = ['/opt/homebrew/bin', '/usr/local/bin'].filter((p) => {
    try {
      Deno.statSync(p);
      return true;
    } catch {
      return false;
    }
  });
  if (extraPaths.length > 0) {
    env.PATH = `${extraPaths.join(':')}:${env.PATH}`;
  }

  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: dirname(tmpFile),
    env,
    stdout: 'piped',
    stderr: 'piped',
  });

  const child = proc.spawn();
  const enc = new TextEncoder();
  const sse = (type: string, data: string) =>
    enc.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const pump = async (
        readable: ReadableStream<Uint8Array>,
        type: 'stdout' | 'stderr',
      ) => {
        const reader = readable.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = dec.decode(value);
          for (const line of lines.split('\n')) {
            if (line) ctrl.enqueue(sse(type, line));
          }
        }
      };

      await Promise.all([
        pump(child.stdout, 'stdout'),
        pump(child.stderr, 'stderr'),
      ]);

      const status = await child.status;
      ctrl.enqueue(sse('exit', String(status.code)));
      ctrl.close();

      // limpa o arquivo temporário
      try {
        await Deno.remove(tmpFile);
      } catch { /* noop */ }
    },
    cancel() {
      try {
        child.kill();
      } catch { /* noop */ }
    },
  });

  return { blocked: false, stream };
};
