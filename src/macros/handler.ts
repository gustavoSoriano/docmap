import {
  clearMacroCollection,
  createMacro,
  createMacroCollection,
  deleteMacro,
  deleteMacroCollection,
  getMacroByRef,
  getMacroCollection,
  listMacroCollections,
  listMacros,
  macroNameExists,
  normalizeMacroName,
  updateMacro,
  updateMacroCollection,
} from './store.ts';
import { invokeMacro, runMacro } from './runner.ts';
import { badRequest, conflict, json, notFound } from '../server/response.ts';
import type {
  CreateMacroCollectionInput,
  CreateMacroInput,
  UpdateMacroInput,
} from './types.ts';

const readStack = (req: Request): string[] =>
  (req.headers.get('X-Docmap-Macro-Stack') ?? '').split(',').map((id) =>
    id.trim()
  ).filter(Boolean);

const validateCollection = async (
  kv: Deno.Kv,
  collectionId: string | null | undefined,
): Promise<Response | null> => {
  if (!collectionId) return null;
  return await getMacroCollection(kv, collectionId)
    ? null
    : badRequest('collectionId not found');
};

const validateMacroName = (name: string): Response | null => {
  const slug = normalizeMacroName(name);
  if (!slug) return badRequest('macro name must contain letters or numbers');
  if (slug === 'collections') return conflict('macro name is reserved');
  return null;
};

const validateInputLabel = (body: Record<string, unknown>): Response | null => {
  if (body.inputLabel === undefined || body.inputLabel === null) return null;
  if (typeof body.inputLabel !== 'string') {
    return badRequest('inputLabel must be a string');
  }
  if (body.inputLabel.trim().length > 120) {
    return badRequest('inputLabel must be 120 characters or fewer');
  }
  return null;
};

const readMacroInput = async (
  req: Request,
): Promise<{ input?: string; error?: Response }> => {
  if (!req.body) return {};
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return { error: badRequest('Invalid JSON') };
    }
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return { error: badRequest('body must be an object') };
    }
    const input = (body as Record<string, unknown>).input;
    if (input === undefined || input === null) return {};
    if (typeof input !== 'string') {
      return { error: badRequest('input must be a string') };
    }
    return { input };
  }
  return { input: await req.text() };
};

const runByRef = async (
  kv: Deno.Kv,
  req: Request,
  ref: string,
  buffered: boolean,
): Promise<Response> => {
  const macro = await getMacroByRef(kv, ref);
  if (!macro) return json({ error: 'macro_not_found', reference: ref }, 404);

  const parentStack = readStack(req);
  if (parentStack.includes(macro.id)) {
    return conflict(`Circular macro call detected: ${macro.name}`);
  }
  const stack = [...parentStack, macro.id];
  const { input, error } = await readMacroInput(req);
  if (error) return error;

  if (buffered) {
    const result = await invokeMacro(macro, { stack, input });
    if (result.blocked) {
      return json({ error: 'blocked', reason: result.reason }, 403);
    }
    const body = result.stdout + result.stderr;
    return new Response(body, {
      status: result.code === 0 ? 200 : 422,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Docmap-Macro-Exit-Code': String(result.code),
      },
    });
  }

  const result = await runMacro(macro, { stack, input });
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
};

export const macrosHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const parts = url.pathname.replace(/^\/macros\/?/, '').split('/').filter(
      Boolean,
    );
    const id = parts[0];
    const action = parts[1];

    if (id === 'collections') {
      const collectionId = parts[1];
      if (req.method === 'GET' && !collectionId) {
        return json(await listMacroCollections(kv));
      }
      if (req.method === 'GET' && collectionId) {
        const collection = await getMacroCollection(kv, collectionId);
        if (!collection) return notFound();
        return json({
          ...collection,
          macros: await listMacros(kv, collectionId),
        });
      }
      if (req.method === 'POST' && !collectionId) {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as CreateMacroCollectionInput;
        if (!name?.trim()) return badRequest('name required');
        return json(await createMacroCollection(kv, name.trim()), 201);
      }
      if (req.method === 'PUT' && collectionId) {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as CreateMacroCollectionInput;
        if (!name?.trim()) return badRequest('name required');
        const updated = await updateMacroCollection(
          kv,
          collectionId,
          name.trim(),
        );
        return updated ? json(updated) : notFound();
      }
      if (req.method === 'DELETE' && collectionId) {
        const action = parts[2];
        // DELETE /macros/collections/:id/clear → esvazia, mantém a collection
        if (action === 'clear') {
          const cleared = await clearMacroCollection(kv, collectionId);
          return json({ ok: true, cleared });
        }
        if (action) return json({ error: 'method_not_allowed' }, 405);
        const result = await deleteMacroCollection(kv, collectionId);
        return result.deleted ? json({ ok: true, ...result }) : notFound();
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (req.method === 'GET' && !id) {
      return json(
        await listMacros(kv, url.searchParams.get('collectionId') ?? undefined),
      );
    }
    if (req.method === 'GET' && id) return getMacro(kv, id);

    if (req.method === 'POST' && id && action === 'run') {
      return runByRef(kv, req, id, false);
    }

    if (req.method === 'POST' && id && action === 'invoke') {
      return runByRef(kv, req, id, true);
    }

    if (req.method === 'POST' && !id) return postMacro(kv, req);
    if (req.method === 'PUT' && id) return putMacro(kv, id, req);
    if (req.method === 'DELETE' && id) {
      return json({ ok: await deleteMacro(kv, id) });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };

const getMacro = async (kv: Deno.Kv, id: string): Promise<Response> => {
  const m = await getMacroByRef(kv, id);
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
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return badRequest('body must be an object');
  }
  const invalidInputLabel = validateInputLabel(body as Record<string, unknown>);
  if (invalidInputLabel) return invalidInputLabel;
  if (!input.title || !input.script) {
    return badRequest('title and script required');
  }
  if (
    input.lifecycle !== undefined &&
    input.lifecycle !== 'persistent'
  ) {
    return badRequest('lifecycle must be persistent');
  }
  const invalidCollection = await validateCollection(kv, input.collectionId);
  if (invalidCollection) return invalidCollection;
  const requestedName = input.name || input.title;
  const invalidName = validateMacroName(requestedName);
  if (invalidName) return invalidName;
  if (await macroNameExists(kv, requestedName)) {
    return conflict('macro name already exists');
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
  const input = body as UpdateMacroInput;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return badRequest('body must be an object');
  }
  const invalidInputLabel = validateInputLabel(body as Record<string, unknown>);
  if (invalidInputLabel) return invalidInputLabel;
  const invalidCollection = await validateCollection(kv, input.collectionId);
  if (invalidCollection) return invalidCollection;
  if (input.name !== undefined) {
    const invalidName = validateMacroName(input.name);
    if (invalidName) return invalidName;
    if (await macroNameExists(kv, input.name, id)) {
      return conflict('macro name already exists');
    }
  }
  const updated = await updateMacro(kv, id, input);
  return updated ? json(updated) : notFound();
};
