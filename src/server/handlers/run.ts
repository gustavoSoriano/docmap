import { json, badRequest, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

const BLOCKLIST: RegExp[] = [
  /rm\s+-rf/i,
  /rm\s+-fr/i,
  />\s*\/dev\/sd/i,
  />\s*\/dev\/disk/i,
  /mkfs\./i,
  /format\s+[A-Z]:/i,
  /dd\s+if=/i,
  /:(){ :|: & };:/,
];

const isBlocked = (command: string, args: string[]): string | null => {
  const full = [command, ...args].join(' ');
  for (const pattern of BLOCKLIST) {
    if (pattern.test(full)) return `Padrão bloqueado: ${pattern.source}`;
  }
  return null;
};

export interface RunCommandBody {
  readonly command: string;
  readonly args?: string[];
  readonly timeout?: number;
}

export const createRunHandler =
  ({ workspace }: HandlerDeps) =>
  async (req: Request): Promise<Response> => {
    if (!workspace.root) return noWorkspace();
    if (req.method !== 'POST') return badRequest('Use POST');

    let body: RunCommandBody;
    try {
      body = await req.json();
    } catch {
      return badRequest('JSON inválido');
    }

    const command = String(body.command ?? '').trim();
    const args = Array.isArray(body.args)
      ? body.args.map((a) => String(a))
      : [];

    if (!command) return badRequest('command é obrigatório');

    const blocked = isBlocked(command, args);
    if (blocked) return json({ blocked: true, reason: blocked }, 403);

    const timeout = typeof body.timeout === 'number' && body.timeout > 0
      ? body.timeout
      : 30_000;

    try {
      const cmd = new Deno.Command(command, {
        args,
        cwd: workspace.root,
        stdout: 'piped',
        stderr: 'piped',
        env: Object.fromEntries(
          Object.entries(Deno.env.toObject()).filter(([k]) =>
            ['HOME', 'PATH', 'USER', 'SHELL', 'LANG', 'TERM'].includes(k)
          ),
        ),
      });
      const child = cmd.spawn();

      const timer = setTimeout(() => {
        try { child.kill(); } catch { /* noop */ }
      }, timeout);

      const { success, stdout, stderr, code } = await child.output();
      clearTimeout(timer);

      const decoder = new TextDecoder();
      return json({
        success,
        code,
        stdout: decoder.decode(stdout),
        stderr: decoder.decode(stderr),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return json({ success: false, error: msg }, 500);
    }
  };
