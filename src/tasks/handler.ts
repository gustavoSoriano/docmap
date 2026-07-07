import { createTask, getTaskById, updateTask, deleteTask, listTasks, reorderColumn } from './store.ts';
import { json, badRequest, notFound } from '../server/response.ts';
import type { CreateTaskInput, UpdateTaskInput, ReorderInput } from './types.ts';

export const tasksHandler = (kv: Deno.Kv) =>
  async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/tasks\/?/, '').split('/').filter(Boolean);
    const id = segments[0];

    if (req.method === 'GET' && !id) {
      return json(await listTasks(kv));
    }

    if (req.method === 'GET' && id) {
      const task = await getTaskById(kv, id);
      if (!task) return notFound();
      return json({ ...task, deepLink: `http://127.0.0.1:3333/#task/${task.id}` });
    }

    if (req.method === 'POST') {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
      const input = body as CreateTaskInput;
      if (!input.title) return badRequest('title required');
      const task = await createTask(kv, input);
      return json({ ...task, deepLink: `http://127.0.0.1:3333/#task/${task.id}` }, 201);
    }

    if (req.method === 'PUT' && id === 'reorder') {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
      const input = body as ReorderInput;
      if (!input.status || !Array.isArray(input.ids)) return badRequest('status and ids required');
      await reorderColumn(kv, input);
      return json({ ok: true });
    }

    if (req.method === 'PUT' && id) {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }
      const updated = await updateTask(kv, id, body as UpdateTaskInput);
      if (!updated) return notFound();
      return json({ ...updated, deepLink: `http://127.0.0.1:3333/#task/${updated.id}` });
    }

    if (req.method === 'DELETE' && id) {
      return json({ ok: await deleteTask(kv, id) });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
