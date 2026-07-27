import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} from './store.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import { unlinkProjectFromTasks } from '../tasks/store.ts';
import type { CreateProjectInput, UpdateProjectInput } from './types.ts';

export const projectsHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/projects\/?/, '').split('/')
      .filter(
        Boolean,
      );
    const id = segments[0];

    if (req.method === 'GET' && !id) {
      return json(await listProjects(kv));
    }

    if (req.method === 'GET' && id) {
      const project = await getProjectById(kv, id);
      if (!project) return notFound();
      return json(project);
    }

    if (req.method === 'POST') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const input = body as CreateProjectInput;
      if (!input.name || !input.name.trim()) {
        return badRequest('name required');
      }
      const project = await createProject(kv, { name: input.name.trim() });
      return json(project, 201);
    }

    if (req.method === 'PUT' && id) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const input = body as UpdateProjectInput;
      if (!input.name || !input.name.trim()) {
        return badRequest('name required');
      }
      const updated = await updateProject(kv, id, { name: input.name.trim() });
      if (!updated) return notFound();
      return json(updated);
    }

    if (req.method === 'DELETE' && id) {
      const deleted = await deleteProject(kv, id);
      if (deleted) {
        const unlinked = await unlinkProjectFromTasks(kv, id);
        return json({ ok: true, unlinkedTasks: unlinked });
      }
      return json({ ok: false });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
