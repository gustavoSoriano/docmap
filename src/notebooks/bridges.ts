// Pontes caderno → módulos externos (efeitos isolados aqui).
// Handler só orquestra; regras puras vivem em artifacts-*.ts e review.ts.
import { boardHub } from '../canvas/hub.ts';
import { audioPathForHash } from '../codetour/audio.ts';
// NOTE: gerar desenho na lousa foi removido da UI (não compensava —
// board único em memória). O ramo canvas abaixo só limpa referências
// legadas de cadernos que já exportaram.
import { narrationHash } from '../codetour/narration.ts';
import type { CodeTour } from '../codetour/types.ts';
import { deleteAudio } from '../podcasts/audio.ts';
import { checkDeps } from '../podcasts/health.ts';
import { runPodcastPipeline } from '../podcasts/pipeline.ts';
import { parseScript, validateSegments } from '../podcasts/parser.ts';
import { broadcast } from '../podcasts/sse.ts';
import { deleteSlides } from '../podcasts/slides.ts';
import { deleteScriptFile } from '../podcasts/scriptfile.ts';
import { createPodcast, deletePodcast, toPreview } from '../podcasts/store.ts';
import { pickRandomVoices } from '../podcasts/voices.ts';
import { normalizeTags } from '../tags/normalize.ts';
import { notebookTag } from './types.ts';
import { buildNotebookPodcastScript } from './artifacts-podcast.ts';
import { readNotebookBody } from './body-file.ts';
import {
  getNotebookMeta,
  listNotebookMetas,
  patchNotebookMeta,
} from './store.ts';
import type { NotebookMeta, NotebookRefs } from './types.ts';

type Fail = { readonly error: string };

// Gera o podcast do caderno (diálogo Guia/Explorador) e linka no meta.
// Roda o pipeline em background — o status vai por SSE como nos podcasts.
export const exportNotebookPodcast = async (
  kv: Deno.Kv,
  meta: NotebookMeta,
  tour: CodeTour,
): Promise<{ readonly podcastId: string } | Fail> => {
  if (meta.links.podcastId) {
    return { error: 'podcast já gerado — apague a referência para regerar' };
  }
  const deps = await checkDeps();
  if (!deps.ready) {
    const missing = deps.instructions
      .map((i) => `instale ${i.dep}: ${i.cmd}`)
      .join(' | ');
    return { error: `dependências faltando — ${missing}` };
  }
  const script = buildNotebookPodcastScript(tour);
  const picked = await pickRandomVoices(2, ['pt-BR']);
  if (picked.length < 2) return { error: 'sem vozes pt-BR no edge-tts' };
  const voices = picked.map((v, i) => ({
    ...v,
    name: i === 0 ? 'Guia' : 'Explorador',
  }));
  const segErr = validateSegments(parseScript(script), voices);
  if (segErr) return { error: segErr };
  const podcast = await createPodcast(kv, {
    title: `Caderno: ${tour.topic}`.slice(0, 120),
    folder: 'cadernos',
    tags: normalizeTags(['caderno', notebookTag(meta.id)]),
    script,
    voices,
    status: 'generating',
  });
  runPodcastPipeline(kv, podcast.id);
  broadcast({ type: 'created', podcast: toPreview(podcast) });
  await patchNotebookMeta(kv, meta.id, {
    links: { ...meta.links, podcastId: podcast.id },
  });
  return { podcastId: podcast.id };
};

const tourAudioHashes = (tour: CodeTour): string[] =>
  tour.slides.map((s) => narrationHash(s.narration)).filter((h) => !!h);

// Apaga as referências externas do caderno (escolhidas no diálogo).
// Áudio: só apaga narrações que NENHUM outro caderno usa (cache compartilhado).
export const deleteNotebookRefs = async (
  kv: Deno.Kv,
  meta: NotebookMeta,
  tour: CodeTour,
  refs: NotebookRefs,
): Promise<
  { readonly podcast: boolean; readonly canvas: number; readonly audio: number }
> => {
  let podcast = false;
  let canvas = 0;
  let audio = 0;
  if (refs.podcast && meta.links.podcastId) {
    const id = meta.links.podcastId;
    if (await deletePodcast(kv, id)) {
      await deleteAudio(id);
      await deleteSlides(id);
      await deleteScriptFile(id);
      podcast = true;
    }
  }
  if (refs.canvas && meta.links.canvasShapeIds.length > 0) {
    canvas = boardHub.removeRecords(meta.links.canvasShapeIds);
  }
  if (refs.audio) {
    const mine = new Set(tourAudioHashes(tour));
    const others = await listNotebookMetas(kv);
    for (const o of others) {
      if (o.id === meta.id) continue;
      const body = await readNotebookBody(o.id);
      if (!body) continue;
      for (const h of tourAudioHashes(body.tour)) mine.delete(h);
    }
    for (const h of mine) {
      try {
        await Deno.remove(audioPathForHash(h));
        audio += 1;
      } catch {
        // cache já ausente — ok
      }
    }
  }
  const cur = await getNotebookMeta(kv, meta.id);
  if (cur) {
    await patchNotebookMeta(kv, meta.id, {
      links: {
        podcastId: refs.podcast ? null : cur.links.podcastId,
        canvasShapeIds: refs.canvas ? [] : cur.links.canvasShapeIds,
        canvasAt: refs.canvas ? null : cur.links.canvasAt,
      },
    });
  }
  return { podcast, canvas, audio };
};
