// Handler do codetour v7 — só orquestra (scan + validação + narração).
// Fluxo: o form cria o caderno PENDENTE (meta no KV + corpo congelado) e o
// agente entrega o reel via /codetour/import levando o id do caderno.
// N cadernos pendentes coexistem — o import valida contra a sessão do id.
import { createNotebookMeta, getNotebookMeta } from '../notebooks/store.ts';
import { isNotebookId, writeNotebookBody } from '../notebooks/body-file.ts';
import {
  attachPack,
  clearSession,
  getSession,
  openSession,
  publicSession,
} from './session.ts';
import { buildAgentPrompt, buildCodetourPrompt } from './prompt.ts';
import { normalizeArtifacts } from './artifacts.ts';
import { importReel } from './import.ts';
import { isDepth, validateOpenInput } from './validate.ts';
import { scanProject } from './scan.ts';
import { serveNarrationFile } from './audio.ts';
import { ensureNarrationAudio, findReel, resolveVoice } from './narration.ts';
import { checkVoiceDeps } from '../voice/health.ts';
import { openFolderDialog } from '../window/dialog.ts';
import { badRequest, json, notFound } from '../server/response.ts';
import type { TourDepth } from './types.ts';

const readBody = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

// Id alvo: body.id > ?id= > null (sem id → sessão ativa do app).
const targetIdFrom = (url: URL, body: unknown): string | null => {
  const fromBody = isObj(body) && typeof body.id === 'string'
    ? body.id.trim()
    : '';
  if (fromBody) return fromBody;
  const fromUrl = (url.searchParams.get('id') ?? '').trim();
  return fromUrl || null;
};

export const codetourHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const pathname = url.pathname;
    const method = req.method;
    if (pathname === '/codetour/session') {
      return sessionRoute(kv, req, url);
    }
    if (pathname === '/codetour/prompt') return promptRoute(url);
    if (pathname === '/codetour/agent-prompt') return agentPromptRoute(kv, url);
    if (pathname === '/codetour/structure') return structureRoute(url);
    if (pathname === '/codetour/pick-folder' && method === 'GET') {
      const path = await openFolderDialog();
      if (!path) return json({ cancelled: true });
      return json({ path });
    }
    if (pathname === '/codetour/import' && method === 'POST') {
      return importRoute(kv, req, url);
    }
    if (pathname === '/codetour/clear' && method === 'POST') {
      clearSession(targetIdFrom(url, await readBody(req)));
      return json({ ok: true });
    }
    if (pathname === '/codetour/voice-health' && method === 'GET') {
      return json(await checkVoiceDeps());
    }
    if (pathname === '/codetour/audio' && method === 'GET') {
      return audioRoute(req, url);
    }
    return notFound();
  };

// ── sessão (poll da UI; POST abre pendência nova) ──

const sessionRoute = (
  kv: Deno.Kv,
  req: Request,
  url: URL,
): Response | Promise<Response> => {
  if (req.method === 'GET') {
    return json({
      session: publicSession(getSession(targetIdFrom(url, undefined))),
    });
  }
  if (req.method === 'POST') return openPendingNotebook(kv, req);
  return notFound();
};

// POST /codetour/session: registra a ENTRADA do caderno (status pending no
// KV), abre a sessão do id, escaneia a pasta e congela os paths no corpo.
// Falha de disco não derruba o caderno (import cai pro fallback do KV).
const openPendingNotebook = async (kv: Deno.Kv, req: Request) => {
  const body = await readBody(req);
  const err = validateOpenInput(body);
  if (err) return badRequest(err);
  const { projectRoot, query } = body as {
    projectRoot: string;
    query: string;
  };
  const rawDepth = (body as Record<string, unknown>).depth;
  const depth: TourDepth = isDepth(rawDepth) ? rawDepth : 'repasse';
  const artifacts = normalizeArtifacts(
    (body as Record<string, unknown>).artifacts,
  );
  const meta = await createNotebookMeta(kv, {
    title: query.trim().slice(0, 120),
    query,
    projectRoot,
    depth,
    artifacts,
    reels: 0,
    status: 'pending',
  });
  openSession(meta.id, projectRoot, query, depth, artifacts);
  const pack = await scanProject(projectRoot.trim(), query.trim());
  const s = attachPack(meta.id, pack);
  await freezeScan(meta.id, s?.pack?.files ?? []);
  return json({
    session: publicSession(getSession(meta.id)),
    notebook: await getNotebookMeta(kv, meta.id),
    agentPrompt: buildAgentPrompt(projectRoot, query, depth, meta.id),
  }, 201);
};

// Congela os paths do scan em arquivinho do caderno — sobrevive a restart.
const freezeScan = async (id: string, files: readonly { path: string }[]) => {
  try {
    await writeNotebookBody(id, {
      reel: null,
      paths: files.map((f) => f.path),
      filesTop: files.slice(0, 80).map((f) => f.path),
    });
  } catch (diskErr) {
    console.error('codetour: falha ao congelar scan', diskErr);
  }
};

// ── prompts/estrutura (agente aceita ?id=) ──

const promptRoute = (url: URL): Response => {
  const s = getSession(targetIdFrom(url, undefined));
  if (!s) return badRequest('selecione a pasta primeiro');
  return json({
    prompt: buildCodetourPrompt(s.projectRoot, s.query, s.depth, s.pack),
  });
};

// Prompt p/ o agente — sem sessão viva (restart), cai pra meta no KV.
const agentPromptRoute = async (kv: Deno.Kv, url: URL) => {
  const id = targetIdFrom(url, undefined);
  const s = getSession(id);
  if (s) {
    return json({
      prompt: buildAgentPrompt(s.projectRoot, s.query, s.depth, s.id),
    });
  }
  const meta = id && isNotebookId(id) ? await getNotebookMeta(kv, id) : null;
  if (!meta) return badRequest('selecione a pasta primeiro');
  return json({
    prompt: buildAgentPrompt(meta.projectRoot, meta.query, meta.depth, meta.id),
  });
};

const structureRoute = (url: URL): Response => {
  const s = getSession(targetIdFrom(url, undefined));
  if (!s?.pack) return badRequest('selecione a pasta primeiro');
  return json({ pack: s.pack });
};

// ── import (agente entrega o reel) ──

const importRoute = async (kv: Deno.Kv, req: Request, url: URL) => {
  const body = await readBody(req);
  const id = targetIdFrom(url, body);
  if (!id || !isNotebookId(id)) {
    return badRequest(
      'id do caderno ausente — veja GET http://127.0.0.1:3333/codetour/agent-prompt',
    );
  }
  if (!getSession(id) && !await getNotebookMeta(kv, id)) {
    return badRequest('sessão não encontrada — peda o prompt de novo');
  }
  const out = await importReel(kv, id, body);
  if ('error' in out) return badRequest(out.error);
  return json({
    session: publicSession(getSession(id)),
    notebook: out.notebook,
  });
};

// ── narração ──

const audioRoute = async (req: Request, url: URL): Promise<Response> => {
  const s = getSession(targetIdFrom(url, undefined));
  if (!s?.reel) return badRequest('selecione a pasta primeiro');
  const reelId = url.searchParams.get('reel') ??
    url.searchParams.get('slide') ?? '';
  const reel = findReel(s, reelId);
  if (!reel) return badRequest('reel inválido');
  const narration = reel.narration?.trim() ?? '';
  if (!narration) return badRequest('reel antigo sem narration — gere de novo');
  const voice = resolveVoice(url.searchParams.get('voice'));
  try {
    const hash = await ensureNarrationAudio(narration, voice);
    return await serveNarrationFile(hash, req);
  } catch (err) {
    return await narrationError(err);
  }
};

// Erro de TTS: NUNCA cai pra voz do sistema — devolve instrução de setup
// (edge-tts é o único caminho de áudio do caderno).
const narrationError = async (err: unknown): Promise<Response> => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('edge-tts')) {
    const health = await checkVoiceDeps();
    return json({ error: msg, instructions: health.instructions }, 503);
  }
  return badRequest(msg);
};
