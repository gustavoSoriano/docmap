// Walk do projeto (IO) + montagem do StructurePack.
// Tetos: 400 arquivos, 150KB/arquivo, fora node_modules/.git/dist.

import type { ScannedFile, StructurePack } from './types.ts';
import {
  detectLayer,
  extractSymbols,
  orderFiles,
  queryTerms,
  resolveImport,
  scoreFile,
} from './symbols.ts';

const MAX_FILES = 400;
const MAX_FILE_BYTES = 150_000;

const CODE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
]);

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.hg',
  '.svn',
  'dist',
  'build',
  'out',
  'target',
  'vendor',
  '__pycache__',
  '.venv',
  'coverage',
]);

const extOf = (name: string): string => {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
};

const walk = async (root: string, out: string[]): Promise<void> => {
  let entries: Deno.DirEntry[];
  try {
    entries = [];
    for await (const e of Deno.readDir(root)) entries.push(e);
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    if (out.length >= MAX_FILES) return;
    if (e.name.startsWith('.') && e.name !== '.env') {
      if (e.isDirectory) continue;
    }
    const full = `${root}/${e.name}`;
    if (e.isDirectory) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walk(full, out);
    } else if (e.isFile && CODE_EXTS.has(extOf(e.name))) {
      out.push(full);
    }
  }
};

export const scanProject = async (
  projectRoot: string,
  query: string,
): Promise<StructurePack> => {
  const root = projectRoot.replace(/\/+$/, '');
  const abs: string[] = [];
  await walk(root, abs);
  const truncated = abs.length >= MAX_FILES;
  const relOf = (full: string): string =>
    full.startsWith(root + '/') ? full.slice(root.length + 1) : full;
  const relSet = new Set(abs.map(relOf));
  const exists = (rel: string): boolean => relSet.has(rel);
  const terms = queryTerms(query);
  const scanned: ScannedFile[] = [];
  for (const full of abs) {
    const rel = relOf(full);
    let stat: Deno.FileInfo;
    try {
      stat = await Deno.stat(full);
    } catch {
      continue;
    }
    if ((stat.size ?? 0) > MAX_FILE_BYTES) continue;
    let source: string;
    try {
      source = await Deno.readTextFile(full);
    } catch {
      continue;
    }
    const { symbols, imports } = extractSymbols(source);
    scanned.push({
      path: rel,
      layer: detectLayer(rel),
      symbols,
      imports: imports.map((i) => ({
        from: i.from,
        resolved: resolveImport(i.from, rel, exists),
      })),
    });
  }
  const ranked = [...scanned].sort(
    (a, b) => scoreFile(b, terms) - scoreFile(a, terms),
  );
  return {
    root,
    query: query.trim(),
    scannedAt: new Date().toISOString(),
    files: ranked,
    order: orderFiles(scanned),
    truncated,
  };
};
