// Importação do reel entregue pela IA — lógica de domínio, sem HTTP.
// Valida contra o scan da sessão (ou do corpo pendente gravado no form),
// então finaliza o caderno pendente (status ready) + auto-save do corpo.
import { attachReel, getSession } from './session.ts';
import { allowedVisualKinds } from './artifacts.ts';
import { parseCodeReel } from './validate.ts';
import { readNotebookBody, writeNotebookBody } from '../notebooks/body-file.ts';
import {
  createNotebookMeta,
  getNotebookMeta,
  patchNotebookMeta,
} from '../notebooks/store.ts';
import type { CodeReel, ReelVisualKind, TourDepth } from './types.ts';
import type { NotebookMeta } from '../notebooks/types.ts';

type ImportCtx = {
  readonly depth: TourDepth;
  readonly paths: ReadonlySet<string>;
  readonly allowed: readonly ReelVisualKind[];
  readonly filesTop: readonly string[];
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const reelPayload = (body: unknown): unknown =>
  isObj(body) && 'reel' in body ? body.reel : body;

const ctxFromSession = (id: string): ImportCtx | null => {
  const s = getSession(id);
  if (!s?.pack || s.pack.files.length === 0) return null;
  return {
    depth: s.depth,
    paths: new Set(s.pack.files.map((f) => f.path)),
    allowed: allowedVisualKinds(s.artifacts),
    filesTop: s.pack.files.slice(0, 80).map((f) => f.path),
  };
};

const ctxFromStorage = async (
  kv: Deno.Kv,
  id: string,
): Promise<ImportCtx | null> => {
  const body = await readNotebookBody(id);
  const paths = new Set(body?.paths ?? []);
  if (paths.size === 0) return null;
  const meta = await getNotebookMeta(kv, id);
  return {
    depth: meta?.depth ?? 'repasse',
    paths,
    allowed: allowedVisualKinds(meta?.artifacts ?? []),
    filesTop: body?.filesTop ?? [...paths].slice(0, 80),
  };
};

const validationCtx = (ctx: ImportCtx) => ({
  depth: ctx.depth,
  paths: ctx.paths,
  allowed: ctx.allowed,
});

export type ImportResult =
  | { readonly reel: CodeReel; readonly notebook: NotebookMeta | null }
  | { readonly error: string };

export const importReel = async (
  kv: Deno.Kv,
  id: string,
  body: unknown,
): Promise<ImportResult> => {
  const ctx = ctxFromSession(id) ?? await ctxFromStorage(kv, id);
  if (!ctx) return { error: 'sessão não encontrada — reabra o caderno' };
  const metas = await getNotebookMeta(kv, id);
  const parsed = parseCodeReel(reelPayload(body), validationCtx(ctx));
  if ('error' in parsed) return { error: parsed.error };
  if (getSession(id)) attachReel(id, parsed.reel);
  return {
    reel: parsed.reel,
    notebook: await finalizeNotebook(kv, id, parsed.reel, ctx, metas),
  };
};

// Falha de disco não derruba o caderno — meta continua pendente p/ retry.
const finalizeNotebook = async (
  kv: Deno.Kv,
  id: string,
  reel: CodeReel,
  ctx: ImportCtx,
  meta: NotebookMeta | null,
): Promise<NotebookMeta | null> => {
  try {
    await writeNotebookBody(id, {
      reel,
      paths: [...ctx.paths],
      filesTop: ctx.filesTop.length
        ? ctx.filesTop
        : [...ctx.paths].slice(0, 80),
    });
  } catch (err) {
    console.error('codetour: falha no auto-save do corpo', err);
    return null;
  }
  if (!meta) {
    return await createNotebookMeta(kv, {
      title: reel.topic,
      query: reel.topic,
      projectRoot: '',
      depth: ctx.depth,
      artifacts: [],
      reels: reel.reels.length,
    }).catch(() => null);
  }
  return await patchNotebookMeta(kv, id, {
    title: reel.topic,
    reels: reel.reels.length,
    status: 'ready',
  });
};
