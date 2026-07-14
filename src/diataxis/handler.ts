import {
  createDocSet,
  deleteDocSet,
  getDocSetById,
  listDocSetsByWorkspace,
  updateDocSet,
} from './store.ts';
import { analyzeWorkspace } from './analyzer.ts';
import { suggestDocSet } from './suggest.ts';
import { suggestDocSetWithAi } from './ai.ts';
import { createDocSetFromSuggestion, createGeneratedItems, entityExists } from './engine.ts';
import { readFileHead } from './analyzer.ts';
import { json, noWorkspace } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import { getNoteById } from '../notes/store.ts';
import { getSkillById } from '../skills/store.ts';
import { getMacroById } from '../macros/store.ts';
import { getDiagramById } from '../diagrams/store.ts';
import { getTaskById } from '../tasks/store.ts';
import { getMock } from '../mocks/store.ts';
import { getFavoriteById } from '../favorites/store.ts';
import type {
  CreateDocSetInput,
  DocSet,
  DocSetItem,
  DocSetItemView,
  DocSetView,
  SuggestDocSetInput,
  SuggestedDocSet,
  UpdateDocSetInput,
} from './types.ts';

const resolveItemTitle = async (
  kv: Deno.Kv,
  workspace: string,
  item: DocSetItem,
): Promise<string | undefined> => {
  try {
    switch (item.ref.kind) {
      case 'file': {
        const path = `${workspace}/${item.ref.id}`;
        const head = readFileHead(path, 5);
        const match = head.match(/^#\s+(.+)$/m);
        return match?.[1]?.trim() || item.ref.id.split('/').pop()?.replace('.md', '');
      }
      case 'note':
        return (await getNoteById(kv, item.ref.id))?.title;
      case 'skill':
        return (await getSkillById(kv, item.ref.id))?.title;
      case 'macro':
        return (await getMacroById(kv, item.ref.id))?.title;
      case 'diagram':
        return (await getDiagramById(kv, item.ref.id))?.title;
      case 'task':
        return (await getTaskById(kv, item.ref.id))?.title;
      case 'mock': {
        const mock = await getMock(kv, item.ref.id);
        return mock ? `${mock.method} ${mock.path}` : undefined;
      }
      case 'favorite':
        return (await getFavoriteById(kv, item.ref.id))?.title;
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
};

const toDocSetView = async (
  kv: Deno.Kv,
  workspace: string,
  docSet: DocSet,
): Promise<DocSetView> => {
  const items: DocSetItemView[] = await Promise.all(
    docSet.items.map(async (item) => ({
      ...item,
      title: await resolveItemTitle(kv, workspace, item),
      exists: await entityExists(kv, workspace, item.ref.kind, item.ref.id),
    })),
  );
  return { ...docSet, items };
};

const parseBody = async <T>(req: Request): Promise<T | null> => {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
};

export const createDiataxisHandler = (deps: HandlerDeps) => {
  const { kv, workspace } = deps;

  return async (req: Request, url: URL): Promise<Response> => {
    const { pathname } = url;

    if (pathname === '/docsets' && req.method === 'GET') {
      if (!workspace.root) return noWorkspace();
      const docSets = await listDocSetsByWorkspace(kv, workspace.root);
      return json(docSets);
    }

    if (pathname === '/docsets' && req.method === 'POST') {
      if (!workspace.root) return noWorkspace();
      const body = await parseBody<CreateDocSetInput>(req);
      if (!body || !body.title || !body.purpose) {
        return json({ error: 'missing_title_or_purpose' }, 400);
      }
      const docSet = await createDocSet(kv, {
        ...body,
        workspace: workspace.root,
      });
      return json(await toDocSetView(kv, workspace.root, docSet));
    }

    if (pathname === '/docsets/suggest' && req.method === 'POST') {
      if (!workspace.root) return noWorkspace();
      const body = await parseBody<SuggestDocSetInput>(req);
      if (!body || !body.purpose) {
        return json({ error: 'missing_purpose' }, 400);
      }
      const context = await analyzeWorkspace(kv, workspace.root);
      try {
        const suggestion = body.useAi
          ? await suggestDocSetWithAi(
            kv,
            context,
            body.purpose,
            body.audience,
            body.depth ?? 'complete',
            body.allowCreation ?? true,
          )
          : suggestDocSet(
            context,
            body.purpose,
            body.audience,
            body.depth,
            body.allowCreation ?? true,
          );
        return json(suggestion);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ia_failed';
        return json({ error: 'ia_failed', message: msg }, 502);
      }
    }

    if (pathname === '/docsets/apply' && req.method === 'POST') {
      if (!workspace.root) return noWorkspace();
      const body = await parseBody<SuggestedDocSet>(req);
      if (!body || !body.purpose) {
        return json({ error: 'missing_purpose' }, 400);
      }
      const docSet = await createDocSetFromSuggestion(kv, workspace.root, body);
      if (!docSet) {
        return json({ error: 'generation_failed' }, 500);
      }
      return json(await toDocSetView(kv, workspace.root, docSet));
    }

    const singleMatch = pathname.match(/^\/docsets\/([^/]+)$/);
    if (singleMatch) {
      const id = singleMatch[1];
      if (!workspace.root) return noWorkspace();

      if (req.method === 'GET') {
        const docSet = await getDocSetById(kv, workspace.root, id);
        if (!docSet) return json({ error: 'not_found' }, 404);
        return json(await toDocSetView(kv, workspace.root, docSet));
      }

      if (req.method === 'PUT') {
        const body = await parseBody<UpdateDocSetInput>(req);
        if (!body) return json({ error: 'invalid_body' }, 400);
        const docSet = await updateDocSet(kv, workspace.root, id, body);
        if (!docSet) return json({ error: 'not_found' }, 404);
        return json(await toDocSetView(kv, workspace.root, docSet));
      }

      if (req.method === 'DELETE') {
        const deleted = await deleteDocSet(kv, workspace.root, id);
        if (!deleted) return json({ error: 'not_found' }, 404);
        return json({ ok: true });
      }
    }

    const regenerateMatch = pathname.match(/^\/docsets\/([^/]+)\/regenerate$/);
    if (regenerateMatch && req.method === 'POST') {
      const id = regenerateMatch[1];
      if (!workspace.root) return noWorkspace();
      const docSet = await getDocSetById(kv, workspace.root, id);
      if (!docSet) return json({ error: 'not_found' }, 404);

      // Regeneração: recria apenas os itens gerados, mantendo referências existentes.
      const context = await analyzeWorkspace(kv, workspace.root);
      const fresh = suggestDocSet(
        context,
        docSet.purpose,
        docSet.audience,
        docSet.depth,
        true,
      );
      const existingItems = docSet.items.filter((i) => i.origin === 'existing');
      const generatedItems = await createGeneratedItems(
        kv,
        docSet.id,
        fresh.items.filter((i) => i.action === 'create'),
      );

      const updated = await updateDocSet(kv, workspace.root, id, {
        items: [...existingItems, ...generatedItems],
      });
      if (!updated) return json({ error: 'update_failed' }, 500);
      return json(await toDocSetView(kv, workspace.root, updated));
    }

    return json({ error: 'not_found' }, 404);
  };
};
