import { json, badRequest, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.nordic',
  'dist',
  'build',
  '.next',
  '.claude',
  'vendor',
  'coverage',
]);

export type CodeSearchResult = {
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
};

const BINARY_HINTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.svg',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.mp3',
  '.mp4',
  '.mov',
  '.wasm',
  '.so',
  '.dylib',
  '.dll',
  '.exe',
  '.lock',
]);

const isBinaryExt = (path: string): boolean => {
  const lower = path.toLowerCase();
  for (const ext of BINARY_HINTS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
};

const walkCode = (
  root: string,
  dir: string,
  globRe: RegExp | null,
  collected: string[],
): void => {
  for (const entry of Deno.readDirSync(dir)) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = `${dir}/${entry.name}`;

    if (entry.isDirectory) {
      walkCode(root, fullPath, globRe, collected);
    } else if (entry.isFile) {
      const relPath = fullPath.slice(root.length + 1);
      if (isBinaryExt(relPath)) continue;
      if (globRe && !globRe.test(relPath)) continue;
      collected.push(fullPath);
    }
  }
};

const globToRegex = (glob: string): RegExp => {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLESTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.')
    .replace(/__DOUBLESTAR__/g, '.*');
  return new RegExp(escaped);
};

export const createCodeSearchHandler =
  ({ workspace }: HandlerDeps) => (_req: Request, url: URL): Response => {
    if (!workspace.root) return noWorkspace();

    const q = url.searchParams.get('q')?.trim() ?? '';
    const glob = url.searchParams.get('glob')?.trim();
    const regexParam = url.searchParams.get('regex');

    if (!q) return badRequest('Missing q param');

    const files: string[] = [];
    try {
      const globRe = glob ? globToRegex(glob) : null;
      walkCode(workspace.root, workspace.root, globRe, files);
    } catch {
      return badRequest('Erro ao escanear workspace');
    }

    const results: CodeSearchResult[] = [];
    const maxResults = 80;

    let matcher: (line: string) => boolean;
    try {
      matcher = regexParam === 'true'
        ? (line: string) => new RegExp(q).test(line)
        : (line: string) => line.toLowerCase().includes(q.toLowerCase());
    } catch {
      return badRequest('Regex inválido');
    }

    for (const filePath of files) {
      if (results.length >= maxResults) break;
      let content: string;
      try {
        content = Deno.readTextFileSync(filePath);
      } catch {
        continue;
      }

      const lines = content.split('\n');
      const fileId = filePath.slice(workspace.root.length + 1);

      for (let i = 0; i < lines.length; i++) {
        if (!matcher(lines[i])) continue;

        const s0 = Math.max(0, i - 1);
        const s1 = Math.min(lines.length - 1, i + 2);
        results.push({
          file: fileId,
          line: i + 1,
          snippet: lines.slice(s0, s1 + 1).join('\n'),
        });
        if (results.length >= maxResults) break;
      }
    }

    return json(results);
  };
