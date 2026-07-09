import { isPathSafe } from '../../fs/walker.ts';
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

    if (pathname === '/git/filemeta') {
      const file = url.searchParams.get('file');
      if (!file) return badRequest('file param required');

      const resolved = `${workspace.root}/${file}`.replace(/\/\.\//g, '/');
      if (!isPathSafe(workspace.root, resolved)) return badRequest('Invalid path');

      // %cI = ISO 8601 strict (with T separator) — %ci uses a space which breaks Date() on WebKit
      const logRes = await runGit(workspace.root, [
        'log', '--follow', '--format=%an|%cI', '--', file,
      ]);

      let commitCount = 0;
      const authorCounts = new Map<string, number>();
      let lastDate: string | null = null;

      if (logRes.ok && logRes.output.trim()) {
        const lines = logRes.output.trim().split('\n').filter(Boolean);
        commitCount = lines.length;
        lines.forEach((line, i) => {
          const sep = line.indexOf('|');
          const author = line.slice(0, sep).trim();
          const date = line.slice(sep + 1).trim();
          if (author) authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
          if (i === 0 && date) lastDate = date;
        });
      }

      const authors = [...authorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, commits]) => ({ name, commits }));

      let mtimeMs: number | null = null;
      try {
        const stat = await Deno.stat(resolved);
        mtimeMs = stat.mtime?.getTime() ?? null;
        if (!lastDate && mtimeMs) lastDate = new Date(mtimeMs).toISOString();
      } catch { /* ignore */ }

      return json({ commitCount, authors, lastDate, mtimeMs });
    }

    return badRequest('Unknown git endpoint');
  };
