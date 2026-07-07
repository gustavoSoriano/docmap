import { resolve, relative } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { isPathSafe } from './walker.ts';

const WIKI_LINK = /\[\[([^\]]+)\]\]/g;
const MD_LINK = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

const resolveWikiLink = (target: string, allFiles: string[], root: string): string | null => {
  const normalized = target.replace(/^\//, '');
  return allFiles.find((f) => {
    const rel = f.slice(root.length + 1).replace(/\.md$/, '');
    return rel === normalized || rel.endsWith('/' + normalized) || f.endsWith('/' + normalized + '.md');
  }) ?? null;
};

export const extractLinks = (filePath: string, content: string, allFiles: string[], root: string): string[] => {
  const fileDir = filePath.slice(0, filePath.lastIndexOf('/'));
  const links = new Set<string>();

  for (const match of content.matchAll(WIKI_LINK)) {
    const resolved = resolveWikiLink(match[1], allFiles, root);
    if (resolved) links.add(resolved.slice(root.length + 1));
  }

  for (const match of content.matchAll(MD_LINK)) {
    const target = match[2].split('#')[0];
    const resolved = resolve(fileDir, target);
    if (!isPathSafe(root, resolved)) continue;
    try {
      Deno.statSync(resolved);
      links.add(relative(root, resolved));
    } catch {
      // file doesn't exist — skip
    }
  }

  return [...links];
};
