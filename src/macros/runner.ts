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
export type InvokeResult = {
  blocked: false;
  stdout: string;
  stderr: string;
  code: number;
};

export type RunMacroOptions = {
  readonly stack?: readonly string[];
  readonly apiUrl?: string;
};

const checkBlocklist = (script: string): string | null => {
  for (const pattern of BLOCKLIST) {
    if (pattern.test(script)) return `Padrão bloqueado: ${pattern.source}`;
  }
  return null;
};

const denoPrelude = `Object.defineProperty(globalThis, 'runMacro', {
  configurable: true,
  value: async (reference) => {
    if (!reference || typeof reference !== 'string') {
      throw new Error('runMacro requires a macro UUID or slug');
    }
    const api = Deno.env.get('DOCMAP_API');
    const stack = Deno.env.get('DOCMAP_MACRO_STACK') ?? '';
    const response = await fetch(
      api + '/macros/' + encodeURIComponent(reference) + '/invoke',
      { method: 'POST', headers: { 'X-Docmap-Macro-Stack': stack } },
    );
    const output = await response.text();
    if (!response.ok) throw new Error(output || ('Macro failed: HTTP ' + response.status));
    if (output) console.log(output.replace(/\\n$/, ''));
    return output;
  },
});
`;

const bashPrelude = `run_macro() {
  if [ -z "\${1:-}" ]; then
    echo "run_macro requires a macro UUID or slug" >&2
    return 64
  fi
  curl --fail-with-body --silent --show-error \\
    -X POST \\
    -H "X-Docmap-Macro-Stack: \${DOCMAP_MACRO_STACK:-}" \\
    "\${DOCMAP_API}/macros/\${1}/invoke"
}
`;

const prepareMacro = async (
  macro: Macro,
  options: RunMacroOptions,
): Promise<{
  cmd: string[];
  env: Record<string, string>;
  tmpFile: string;
}> => {
  const ext = macro.interpreter === 'deno' ? '.ts' : '.sh';
  const tmpFile = await Deno.makeTempFile({ suffix: ext });
  const original = macro.interpreter === 'deno' && macro.script.startsWith('#!')
    ? macro.script.replace(/^#![^\n]*(?:\n|$)/, '')
    : macro.script;
  const script = macro.interpreter === 'deno'
    ? denoPrelude + original
    : bashPrelude + original;
  await Deno.writeTextFile(tmpFile, script);
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
    DOCMAP_API: options.apiUrl ?? 'http://127.0.0.1:3334',
    DOCMAP_KV: `${
      Deno.env.get('HOME')
    }/Library/Application Support/docmap/data.sqlite3`,
    DOCMAP_MACRO_STACK: (options.stack ?? [macro.id]).join(','),
  };

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
  return { cmd, env, tmpFile };
};

export const invokeMacro = async (
  macro: Macro,
  options: RunMacroOptions = {},
): Promise<BlockedResult | InvokeResult> => {
  const blocked = checkBlocklist(macro.script);
  if (blocked) return { blocked: true, reason: blocked };

  const { cmd, env, tmpFile } = await prepareMacro(macro, options);
  try {
    const output = await new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      cwd: dirname(tmpFile),
      env,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return {
      blocked: false,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
      code: output.code,
    };
  } finally {
    try {
      await Deno.remove(tmpFile);
    } catch { /* noop */ }
  }
};

export const runMacro = async (
  macro: Macro,
  options: RunMacroOptions = {},
): Promise<BlockedResult | RunResult> => {
  const blocked = checkBlocklist(macro.script);
  if (blocked) return { blocked: true, reason: blocked };

  const { cmd, env, tmpFile } = await prepareMacro(macro, options);

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
