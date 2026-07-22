const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.claude',
]);

export const walkMd = (dir: string, collected: string[] = []): string[] => {
  for (const entry of Deno.readDirSync(dir)) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      walkMd(fullPath, collected);
    } else if (entry.name.endsWith('.md')) {
      collected.push(fullPath);
    }
  }
  return collected;
};

export const isPathSafe = (root: string, resolved: string): boolean =>
  resolved.startsWith(root + '/') || resolved === root;
