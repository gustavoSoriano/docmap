import {
  createDiagram,
  deleteDiagram,
  getDiagramById,
  listDiagrams,
  updateDiagram,
} from './store.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import { broadcast, subscribe } from './sse.ts';
import type { CreateDiagramInput, UpdateDiagramInput } from './types.ts';

const withLink = (d: Record<string, unknown>) => ({
  ...d,
  deepLink: `http://127.0.0.1:3333/#diagram/${d['id']}`,
});

export const diagramsHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/diagrams\/?/, '').split('/')
      .filter(Boolean);
    const id = segments[0];

    if (req.method === 'GET' && id === 'events') {
      return new Response(subscribe(), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    if (req.method === 'GET' && !id) {
      return json(await listDiagrams(kv));
    }

    if (req.method === 'GET' && id) {
      const d = await getDiagramById(kv, id);
      if (!d) return notFound();
      return json(withLink(d as unknown as Record<string, unknown>));
    }

    if (req.method === 'POST') {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const input = body as CreateDiagramInput;
      if (!input.title || !input.source) {
        return badRequest('title and source required');
      }
      const d = await createDiagram(kv, input);
      const payload = withLink(d as unknown as Record<string, unknown>);
      broadcast({ type: 'created', diagram: payload });
      return json(payload, 201);
    }

    if (req.method === 'PUT' && id) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return badRequest('Invalid JSON');
      }
      const updated = await updateDiagram(kv, id, body as UpdateDiagramInput);
      if (!updated) return notFound();
      const payload = withLink(updated as unknown as Record<string, unknown>);
      broadcast({ type: 'updated', diagram: payload });
      return json(payload);
    }

    if (req.method === 'DELETE' && id) {
      const ok = await deleteDiagram(kv, id);
      if (ok) broadcast({ type: 'deleted', id });
      return json({ ok });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
