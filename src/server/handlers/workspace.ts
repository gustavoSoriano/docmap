import { getRecentWorkspaces, setWorkspace } from '../../workspace/manager.ts';
import { openFolderDialog } from '../../window/dialog.ts';
import { json, noWorkspace } from '../response.ts';
import type { HandlerDeps } from '../types.ts';

export const createWorkspaceHandler =
  ({ kv, workspace }: HandlerDeps) => {
  let pickInProgress = false;

  return async (req: Request, url: URL): Promise<Response> => {
    if (req.method === 'GET' && url.pathname === '/workspace') {
      return json({
        root: workspace.root,
        name: workspace.root?.split('/').pop() ?? null,
      });
    }

    if (req.method === 'GET' && url.pathname === '/workspace/recent') {
      return json(await getRecentWorkspaces(kv));
    }

    if (req.method === 'POST' && url.pathname === '/workspace/pick') {
      if (!pickInProgress) {
        pickInProgress = true;
        (async () => {
          try {
            const selected = await openFolderDialog();
            if (selected) await setWorkspace(kv, workspace, selected);
          } finally {
            pickInProgress = false;
          }
        })();
      }
      return json({ polling: true });
    }

    if (req.method === 'POST' && url.pathname === '/workspace/set') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return json({ error: 'invalid_json' }, 400);
      }
      const { path } = body as { path: string };
      if (!path) return json({ error: 'missing_path' }, 400);
      try {
        Deno.statSync(path);
      } catch {
        return json({ error: 'path_not_found' }, 404);
      }
      await setWorkspace(kv, workspace, path);
      return json({ root: path, name: path.split('/').pop() });
    }

    return noWorkspace();
  };
};
