import { isPathSafe } from '../../fs/walker.ts';
import { badRequest, json, noWorkspace } from '../response.ts';
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

export type FileEntry = {
  readonly path: string;
  readonly isDirectory: boolean;
  readonly size: number;
};

const walk = (
  root: string,
  dir: string,
  results: FileEntry[],
): void => {
  for (const entry of Deno.readDirSync(dir)) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = `${dir}/${entry.name}`;
    const relPath = fullPath.slice(root.length + 1);

    if (entry.isDirectory) {
      results.push({ path: relPath, isDirectory: true, size: 0 });
      walk(root, fullPath, results);
    } else if (entry.isFile) {
      const info = Deno.statSync(fullPath);
      results.push({ path: relPath, isDirectory: false, size: info.size });
    }
  }
};

export const createWorkspaceFilesHandler =
  ({ workspace }: HandlerDeps) => (_req: Request, url: URL): Response => {
    if (!workspace.root) return noWorkspace();

    const pattern = url.searchParams.get('pattern')?.trim();
    const resolved = workspace.root;

    const files: FileEntry[] = [];
    try {
      walk(resolved, resolved, files);
    } catch {
      return badRequest('Erro ao ler workspace');
    }

    const filtered = pattern
      ? files.filter((f) => new RegExp(pattern).test(f.path))
      : files;

    return json(filtered);
  };

export const createFileTypeHandler =
  ({ workspace }: HandlerDeps) => (_req: Request, url: URL): Response => {
    if (!workspace.root) return noWorkspace();

    const fileParam = url.searchParams.get('file');
    if (!fileParam) return badRequest('Missing file param');

    const resolved = `${workspace.root}/${fileParam}`.replace(/\/\.\//g, '/');
    if (!isPathSafe(workspace.root, resolved)) {
      return badRequest('Invalid path');
    }

    try {
      const info = Deno.statSync(resolved);
      return json({
        path: fileParam,
        isDirectory: info.isDirectory,
        isFile: info.isFile,
        size: info.size,
        modifiedAt: info.mtime?.toISOString() ?? null,
      });
    } catch {
      return json({
        path: fileParam,
        exists: false,
        isDirectory: false,
        isFile: false,
        size: 0,
        modifiedAt: null,
      });
    }
  };
