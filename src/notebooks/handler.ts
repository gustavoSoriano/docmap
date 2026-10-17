// Handler dos cadernos — só orquestra (store + body-file + bridges).
// Montado em /tours*. A sessão ativa do codetour segue sendo o "aberto".
import { normalizeArtifacts } from '../codetour/artifacts.ts';
import {
  attachReel,
  getSession,
  openSession,
  publicSession,
} from '../codetour/session.ts';
import { badRequest, conflict, json, notFound } from '../server/response.ts';
import { deleteNotebookRefs, exportNotebookPodcast } from './bridges.ts';
import {
  deleteNotebookBody,
  isNotebookId,
  readNotebookBody,
  writeNotebookBody,
} from './body-file.ts';
import {
  createNotebookMeta,
  deleteNotebookMeta,
  getNotebookMeta,
  listNotebookMetas,
  patchNotebookMeta,
} from './store.ts';
import type { NotebookProgress } from './types.ts';

const readBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const parseProgress = (v: unknown): NotebookProgress | null => {
  if (!isObj(v)) return null;
  const listened = Array.isArray(v.listened)
    ? v.listened.filter((s) => typeof s === 'string' && s.length <= 64).slice(
      0,
      200,
    )
    : [];
  const quiz: Record<string, 'hit' | 'miss'> = {};
  if (isObj(v.quiz)) {
    for (const [k, val] of Object.entries(v.quiz)) {
      if (k.length <= 64 && (val === 'hit' || val === 'miss')) quiz[k] = val;
    }
  }
  return { listened, quiz };
};

export const notebooksHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const rest = url.pathname.slice('/tours'.length);
    const seg = rest.split('/').filter((s) => s.length > 0);

    // ── GET /tours — biblioteca ──
    if (req.method === 'GET' && seg.length === 0) {
      return json({ notebooks: await listNotebookMetas(kv) });
    }

    // ── POST /tours — salva a sessão ativa como caderno ──
    if (req.method === 'POST' && seg.length === 0) {
      const s = getSession();
      if (!s?.reel) return badRequest('gere um caderno antes de salvar');
      const body = await readBody(req);
      const title = isObj(body) && typeof body.title === 'string'
        ? body.title.trim().slice(0, 120)
        : s.reel.topic;
      const meta = await createNotebookMeta(kv, {
        title: title || 'Caderno sem título',
        query: s.query,
        projectRoot: s.projectRoot,
        depth: s.depth,
        artifacts: s.artifacts,
        reels: s.reel.reels.length,
      });
      try {
        await writeNotebookBody(meta.id, {
          reel: s.reel,
          paths: (s.pack?.files ?? []).map((f) => f.path),
          filesTop: (s.pack?.files ?? []).slice(0, 80).map((f) => f.path),
        });
      } catch {
        await deleteNotebookMeta(kv, meta.id);
        return json({ error: 'falha ao gravar corpo do caderno' }, 500);
      }
      return json({ notebook: meta }, 201);
    }

    const [id, action] = seg;
    if (!isNotebookId(id)) return badRequest('caderno inválido');

    // ── GET /tours/:id — abre o corpo ──
    if (req.method === 'GET' && seg.length === 1) {
      const meta = await getNotebookMeta(kv, id);
      if (!meta) return notFound();
      const body = await readNotebookBody(id);
      if (!body) return notFound();
      return json({ notebook: meta, reel: body.reel, filesTop: body.filesTop });
    }

    // ── POST /tours/:id/open — coloca na sessão ativa ──
    if (req.method === 'POST' && action === 'open') {
      const meta = await getNotebookMeta(kv, id);
      if (!meta) return notFound();
      const body = await readNotebookBody(id);
      if (!body) return notFound();
      openSession(meta.projectRoot, meta.query, meta.depth, meta.artifacts);
      attachReel(body.reel);
      return json({ session: publicSession(getSession()) });
    }

    // ── PATCH /tours/:id — título, artefatos, progresso ──
    if (req.method === 'PATCH' && seg.length === 1) {
      const meta = await getNotebookMeta(kv, id);
      if (!meta) return notFound();
      const body = await readBody(req);
      if (!isObj(body)) return badRequest('corpo deve ser um objeto');
      if (body.title !== undefined && typeof body.title !== 'string') {
        return badRequest('title deve ser texto');
      }
      if (body.artifacts !== undefined) {
        const arts = normalizeArtifacts(body.artifacts);
        if (arts.length === 0) {
          return badRequest('selecione ao menos 1 artefato');
        }
      }
      let progress: NotebookProgress | undefined;
      if (body.progress !== undefined) {
        const p = parseProgress(body.progress);
        if (!p) return badRequest('progress inválido');
        progress = p;
      }
      const updated = await patchNotebookMeta(kv, id, {
        ...(typeof body.title === 'string' ? { title: body.title } : {}),
        ...(body.artifacts !== undefined
          ? { artifacts: normalizeArtifacts(body.artifacts) }
          : {}),
        ...(progress ? { progress } : {}),
      });
      return json({ notebook: updated });
    }

    // ── DELETE /tours/:id — apaga caderno (+ referências se marcadas) ──
    if (req.method === 'DELETE' && seg.length === 1) {
      const meta = await getNotebookMeta(kv, id);
      if (!meta) return notFound();
      const body = await readNotebookBody(id);
      if (!body) return notFound();
      const raw = await readBody(req);
      const r = isObj(raw) && isObj(raw.refs) ? raw.refs : {};
      const refs = {
        podcast: r.podcast === true,
        canvas: r.canvas === true,
        audio: r.audio === true,
      };
      const removed = await deleteNotebookRefs(kv, meta, body.reel, refs);
      await deleteNotebookBody(id);
      await deleteNotebookMeta(kv, id);
      return json({ ok: true, removed });
    }

    // ── POST /tours/:id/podcast — gera e linka ──
    if (req.method === 'POST' && action === 'podcast') {
      const meta = await getNotebookMeta(kv, id);
      if (!meta) return notFound();
      const body = await readNotebookBody(id);
      if (!body) return notFound();
      const out = await exportNotebookPodcast(kv, meta, body.reel);
      if ('error' in out) return conflict(out.error);
      const updated = await getNotebookMeta(kv, id);
      return json({ podcastId: out.podcastId, notebook: updated }, 202);
    }

    return notFound();
  };
