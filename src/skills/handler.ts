import {
  createSkill, resolveSkill, updateSkill, deleteSkill, listSkills,
} from './store.ts';
import { json, badRequest, notFound } from '../server/response.ts';
import type { CreateSkillInput, UpdateSkillInput } from './types.ts';

// UI handler — CRUD completo
export const skillsUiHandler = (kv: Deno.Kv) =>
  async (req: Request, url: URL): Promise<Response> => {
    const id = url.pathname.replace(/^\/skills\/?/, '').split('/')[0] || '';

    if (req.method === 'GET' && !id)   return json(await listSkills(kv));
    if (req.method === 'GET' && id)    return getSkill(kv, id);
    if (req.method === 'POST')         return postSkill(kv, req);
    if (req.method === 'PUT' && id)    return putSkill(kv, id, req);
    if (req.method === 'DELETE' && id) return delSkill(kv, id);
    return json({ error: 'method_not_allowed' }, 405);
  };

// AI handler — GET only (por id ou name)
export const skillsApiHandler = (kv: Deno.Kv) =>
  async (req: Request, url: URL): Promise<Response> => {
    if (req.method !== 'GET') return json({ error: 'read_only' }, 405);
    const id = url.pathname.replace(/^\/skills\/?/, '').split('/')[0] || '';
    if (!id) return json(await listSkills(kv));
    return getSkill(kv, id);
  };

// ── helpers ──

const getSkill = async (kv: Deno.Kv, idOrName: string): Promise<Response> => {
  const s = await resolveSkill(kv, idOrName);
  return s ? json(s) : notFound();
};

const postSkill = async (kv: Deno.Kv, req: Request): Promise<Response> => {
  let body: unknown;
  try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
  const input = body as CreateSkillInput;
  if (!input.title || !input.content) return badRequest('title and content required');
  if (!input.name && !input.title)    return badRequest('name or title required');
  return json(await createSkill(kv, input), 201);
};

const putSkill = async (kv: Deno.Kv, id: string, req: Request): Promise<Response> => {
  let body: unknown;
  try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
  const updated = await updateSkill(kv, id, body as UpdateSkillInput);
  return updated ? json(updated) : notFound();
};

const delSkill = async (kv: Deno.Kv, id: string): Promise<Response> =>
  json({ ok: await deleteSkill(kv, id) });
