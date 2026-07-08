import { json, badRequest, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

const runGit = async (
  cwd: string,
  args: string[],
): Promise<{ ok: true; output: string } | { ok: false; error: string }> => {
  try {
    const cmd = new Deno.Command('git', {
      args,
      cwd,
      stdout: 'piped',
      stderr: 'piped',
    });
    const child = cmd.spawn();
    const { success, stdout, stderr } = await child.output();
    const decoder = new TextDecoder();
    const output = decoder.decode(stdout);
    const error = decoder.decode(stderr);

    if (!success) {
      return { ok: false, error: error || 'git command failed' };
    }
    return { ok: true, output };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
};

export const createGitHandler =
  ({ workspace }: HandlerDeps) =>
  async (_req: Request, url: URL): Promise<Response> => {
    if (!workspace.root) return noWorkspace();

    const { pathname } = url;

    if (pathname === '/git/status') {
      const res = await runGit(workspace.root, ['status', '--porcelain', '-b']);
      if (!res.ok) return json({ error: res.error }, 500);
      return json({ status: res.output });
    }

    if (pathname === '/git/diff') {
      const res = await runGit(workspace.root, ['diff']);
      if (!res.ok) return json({ error: res.error }, 500);
      return json({ diff: res.output });
    }

    if (pathname === '/git/log') {
      const limit = url.searchParams.get('limit') ?? '20';
      const res = await runGit(workspace.root, ['log', '--oneline', `-n${limit}`]);
      if (!res.ok) return json({ error: res.error }, 500);
      return json({ log: res.output });
    }

    return badRequest('Unknown git endpoint');
  };
