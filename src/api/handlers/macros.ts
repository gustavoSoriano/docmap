import {
  createMacro,
  getMacroById,
  listMacros,
  updateMacro,
} from '../../macros/store.ts';
import { badRequest, json, notFound } from '../../server/response.ts';
import type { HandlerDeps } from '../../server/types.ts';
import type { CreateMacroInput, UpdateMacroInput } from '../../macros/types.ts';

export const createApiMacrosHandler = ({ kv }: HandlerDeps) =>
async (
  req: Request,
  url: URL,
): Promise<Response> => {
  const segments = url.pathname.replace('/macros', '').split('/').filter(
    Boolean,
  );
  const macroId = segments[0];

  if (req.method === 'GET' && !macroId) {
    return json(await listMacros(kv));
  }

  if (req.method === 'GET' && macroId) {
    const macro = await getMacroById(kv, macroId);
    return macro ? json(macro) : notFound();
  }

  if (req.method === 'POST') {
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
    return json(await createMacro(kv, input), 201);
  }

  if (req.method === 'PUT' && macroId) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest('Invalid JSON');
    }
    const updated = await updateMacro(kv, macroId, body as UpdateMacroInput);
    return updated ? json(updated) : notFound();
  }

  return json({ error: 'method_not_allowed' }, 405);
};
