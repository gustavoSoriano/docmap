import {
  createMacro,
  deleteMacro,
  getMacroById,
  listMacros,
  updateMacro,
} from './store.ts';
import { runMacro } from './runner.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import type { CreateMacroInput, UpdateMacroInput } from './types.ts';
export const macrosHandler =
  (kv: Deno.Kv) =>
  async (req: Request, url: URL): Promise<Response> => {
    const parts = url.pathname.replace(/^\/macros\/?/, '').split('/').filter(
      Boolean,
    );
    const id = parts[0];
    const action = parts[1]; // "run"

    if (req.method === 'GET' && !id) return json(await listMacros(kv));
    if (req.method === 'GET' && id) return getMacro(kv, id);

    if (req.method === 'POST' && id && action === 'run') {
      const macro = await getMacroById(kv, id);
      if (!macro) return notFound();

      const result = await runMacro(macro);
      if (result.blocked) {
        return json({ error: 'blocked', reason: result.reason }, 403);
      }

      return new Response(result.stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    if (req.method === 'POST' && !id) return postMacro(kv, req);
    if (req.method === 'PUT' && id) return putMacro(kv, id, req);
    if (req.method === 'DELETE' && id) {
      return json({ ok: await deleteMacro(kv, id) });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };

const getMacro = async (kv: Deno.Kv, id: string): Promise<Response> => {
  const m = await getMacroById(kv, id);
  return m ? json(m) : notFound();
};

const postMacro = async (kv: Deno.Kv, req: Request): Promise<Response> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const input = body as CreateMacroInput;
  if (!input.title || !input.script) {
    return badRequest('title and script required');
  }
  if (
    input.lifecycle !== undefined &&
    input.lifecycle !== 'persistent' &&
    input.lifecycle !== 'workflow'
  ) {
    return badRequest('lifecycle must be persistent or workflow');
  }
  if (input.lifecycle === 'workflow' && !input.workflowId?.trim()) {
    return badRequest('workflowId required for workflow lifecycle');
  }
  return json(await createMacro(kv, input), 201);
};

const putMacro = async (
  kv: Deno.Kv,
  id: string,
  req: Request,
): Promise<Response> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const updated = await updateMacro(kv, id, body as UpdateMacroInput);
  return updated ? json(updated) : notFound();
};
