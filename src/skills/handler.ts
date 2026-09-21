import {
  clearSkillCollection,
  createSkill,
  createSkillCollection,
  deleteSkill,
  deleteSkillCollection,
  getSkillCollection,
  listSkillCollections,
  listSkills,
  resolveSkill,
  updateSkill,
  updateSkillCollection,
} from './store.ts';
import { badRequest, conflict, json, notFound } from '../server/response.ts';
import { toSlug } from './store.ts';
import type {
  CreateSkillCollectionInput,
  CreateSkillInput,
  UpdateSkillInput,
} from './types.ts';

const validateCollection = async (
  kv: Deno.Kv,
  collectionId: string | null | undefined,
): Promise<Response | null> => {
  if (!collectionId) return null;
  return await getSkillCollection(kv, collectionId)
    ? null
    : badRequest('collectionId not found');
};

// UI handler — CRUD completo
export const skillsUiHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const parts = url.pathname.replace(/^\/skills\/?/, '').split('/').filter(
      Boolean,
    );
    const id = parts[0] || '';

    // ── /skills/collections ──
    if (id === 'collections') {
      const collectionId = parts[1];
      if (req.method === 'GET' && !collectionId) {
        return json(await listSkillCollections(kv));
      }
      if (req.method === 'GET' && collectionId && !parts[2]) {
        const collection = await getSkillCollection(kv, collectionId);
        if (!collection) return notFound();
        return json({
          ...collection,
          skills: await listSkills(kv, collectionId),
        });
      }
      if (req.method === 'POST' && !collectionId) {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as CreateSkillCollectionInput;
        if (!name?.trim()) return badRequest('name required');
        return json(await createSkillCollection(kv, name.trim()), 201);
      }
      if (req.method === 'PUT' && collectionId && !parts[2]) {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as CreateSkillCollectionInput;
        if (!name?.trim()) return badRequest('name required');
        const updated = await updateSkillCollection(
          kv,
          collectionId,
          name.trim(),
        );
        return updated ? json(updated) : notFound();
      }
      // DELETE /skills/collections/:id/clear → esvazia, mantém a collection
      if (req.method === 'DELETE' && collectionId && parts[2] === 'clear') {
        const cleared = await clearSkillCollection(kv, collectionId);
        return json({ ok: true, cleared });
      }
      if (req.method === 'DELETE' && collectionId && !parts[2]) {
        const result = await deleteSkillCollection(kv, collectionId);
        return result.deleted ? json({ ok: true, ...result }) : notFound();
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    if (req.method === 'GET' && !id) {
      return json(
        await listSkills(kv, url.searchParams.get('collectionId') ?? undefined),
      );
    }
    if (req.method === 'GET' && id) return getSkill(kv, id);
    if (req.method === 'POST') return postSkill(kv, req);
    if (req.method === 'PUT' && id) return putSkill(kv, id, req);
    if (req.method === 'DELETE' && id) return delSkill(kv, id);
    return json({ error: 'method_not_allowed' }, 405);
  };

// AI/headless handler — escrita básica para agentes externos
export const skillsApiHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const parts = url.pathname.replace(/^\/skills\/?/, '').split('/').filter(
      Boolean,
    );
    const id = parts[0] || '';
    if (id === 'collections') {
      const collectionId = parts[1];
      if (req.method === 'GET' && !collectionId) {
        return json(await listSkillCollections(kv));
      }
      if (req.method === 'GET' && collectionId && !parts[2]) {
        const collection = await getSkillCollection(kv, collectionId);
        if (!collection) return notFound();
        return json({
          ...collection,
          skills: await listSkills(kv, collectionId),
        });
      }
      if (req.method === 'POST' && !collectionId) {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as CreateSkillCollectionInput;
        if (!name?.trim()) return badRequest('name required');
        return json(await createSkillCollection(kv, name.trim()), 201);
      }
      if (req.method === 'PUT' && collectionId && !parts[2]) {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return badRequest('Invalid JSON');
        }
        const { name } = body as CreateSkillCollectionInput;
        if (!name?.trim()) return badRequest('name required');
        const updated = await updateSkillCollection(
          kv,
          collectionId,
          name.trim(),
        );
        return updated ? json(updated) : notFound();
      }
      return json({ error: 'method_not_allowed' }, 405);
    }
    if (!id) {
      if (req.method === 'POST') return postSkill(kv, req);
      if (req.method !== 'GET') {
        return json({ error: 'method_not_allowed' }, 405);
      }
      return json(
        await listSkills(kv, url.searchParams.get('collectionId') ?? undefined),
      );
    }
    if (req.method === 'GET') return getSkill(kv, id);
    if (req.method === 'PUT') return putSkill(kv, id, req);
    return json({ error: 'method_not_allowed' }, 405);
  };

// ── helpers ──

const getSkill = async (kv: Deno.Kv, idOrName: string): Promise<Response> => {
  const s = await resolveSkill(kv, idOrName);
  return s ? json(s) : notFound();
};

const postSkill = async (kv: Deno.Kv, req: Request): Promise<Response> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const input = body as CreateSkillInput;
  if (!input.title || !input.content) {
    return badRequest('title and content required');
  }
  if (!input.name && !input.title) return badRequest('name or title required');
  if (toSlug(input.name || input.title) === 'collections') {
    return conflict('skill name is reserved');
  }
  const invalidCollection = await validateCollection(kv, input.collectionId);
  if (invalidCollection) return invalidCollection;
  return json(await createSkill(kv, input), 201);
};

const putSkill = async (
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
  const input = body as UpdateSkillInput;
  if (
    input.name !== undefined && toSlug(input.name) === 'collections'
  ) {
    return conflict('skill name is reserved');
  }
  const invalidCollection = await validateCollection(kv, input.collectionId);
  if (invalidCollection) return invalidCollection;
  const existing = await resolveSkill(kv, id);
  if (!existing) return notFound();
  const updated = await updateSkill(kv, existing.id, input);
  return updated ? json(updated) : notFound();
};

const delSkill = async (kv: Deno.Kv, id: string): Promise<Response> =>
  json({ ok: await deleteSkill(kv, id) });
