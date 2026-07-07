import type { WorkspaceRef, WorkspaceMeta } from './types.ts';

const MAX_RECENT = 10;

// Remove barra(s) final(is) — seletores de pasta (macOS) retornam com barra,
// e isso quebra a resolução de links e a checagem de path traversal.
const normalizePath = (p: string): string => p.replace(/\/+$/, '') || '/';

export const createWorkspaceRef = (): WorkspaceRef => ({ root: null });

export const setWorkspace = async (kv: Deno.Kv, ref: WorkspaceRef, newPath: string): Promise<void> => {
  const path = normalizePath(newPath);
  ref.root = path;
  await kv.set(['workspace', 'last'], path);

  const entry = await kv.get<string[]>(['workspace', 'recent']);
  const recent = entry.value ?? [];
  const updated = [path, ...recent.filter((p) => p !== path)].slice(0, MAX_RECENT);
  await kv.set(['workspace', 'recent'], updated);
};

export const restoreLastWorkspace = async (kv: Deno.Kv, ref: WorkspaceRef): Promise<void> => {
  const entry = await kv.get<string>(['workspace', 'last']);
  if (entry.value) {
    const path = normalizePath(entry.value);
    try {
      Deno.statSync(path);
      ref.root = path;
    } catch {
      // path no longer exists — ignore
    }
  }
};

export const getRecentWorkspaces = async (kv: Deno.Kv): Promise<WorkspaceMeta[]> => {
  const entry = await kv.get<string[]>(['workspace', 'recent']);
  return (entry.value ?? [])
    .filter((p) => { try { Deno.statSync(p); return true; } catch { return false; } })
    .map((p) => ({ path: p, name: p.split('/').pop() ?? p, lastOpened: new Date().toISOString() }));
};
