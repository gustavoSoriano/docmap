// ════ Orquestração da geração de um podcast (assíncrono) ════
// Chamado pelo handler em background (sem await). Grava status no KV e
// emite eventos SSE em cada etapa.

import { audioPath, deleteAudio, ensureAudioDir } from './audio.ts';
import { deleteSlides } from './slides.ts';
import {
  parseScript,
  parseScriptWithSlides,
  validateSegments,
  voiceIdOf,
} from './parser.ts';
import { broadcast } from './sse.ts';
import { concatAudio, probeDurationMs, synthesizeSegment } from './tts.ts';
import { getPodcastById, patchGeneration, toPreview } from './store.ts';
import type { Podcast, SlideMapEntry } from './types.ts';

const emitProgress = (
  id: string,
  stage: 'slides' | 'tts' | 'concat',
  detail?: string,
) => broadcast({ type: 'progress', id, stage, detail });

const handleReady = async (kv: Deno.Kv, p: Podcast, durationMs?: number) => {
  await patchGeneration(kv, p.id, { status: 'ready', durationMs });
  broadcast({
    type: 'ready',
    podcast: toPreview({
      ...p,
      status: 'ready',
      ...(durationMs !== undefined ? { durationMs } : {}),
    }),
  });
};

const handleError = async (kv: Deno.Kv, id: string, error: string) => {
  await patchGeneration(kv, id, { status: 'error', error });
  broadcast({ type: 'error', id, error });
};

// Computa enterMs de cada entrada do slideMap acumulando a duração
// (ffprobe por segmento) até o segmento inicial do slide.
const computeSlideMap = (
  slideMap: readonly SlideMapEntry[],
  segDurationsMs: readonly number[],
): SlideMapEntry[] => {
  const starts: number[] = [0];
  for (const d of segDurationsMs) {
    starts.push(starts[starts.length - 1] + d);
  }
  return slideMap.map((e) => ({
    ...e,
    enterMs: starts[e.segmentStart] ?? 0,
  }));
};

export const runPodcastPipeline = async (
  kv: Deno.Kv,
  id: string,
): Promise<void> => {
  const podcast = await getPodcastById(kv, id);
  if (!podcast) return;

  const tmpDir = await Deno.makeTempDir({ prefix: 'docmap-pod-' });

  try {
    // 1. Roteiro — vem pronto do handler (IAs externas enviam via POST).
    const { script } = podcast;
    const wantSlides = podcast.withSlides === true;

    // 2. Parse + validação contra as personas.
    const parsed = wantSlides
      ? parseScriptWithSlides(script)
      : { segments: parseScript(script), slideMap: [] as SlideMapEntry[] };
    const { segments, slideMap } = parsed;
    const invalid = validateSegments(segments, podcast.voices);
    if (invalid) throw new Error(invalid);

    // 3. Slides — o manifesto visual já foi escrito pelo handler quando o
    //    roteiro veio pronto com <Slides> (ou via input.slides). Não
    //    reextraímos aqui; apenas zeramos o slideMap quando o roteiro tem
    //    blocos <Slide> de diálogo mas nenhum manifesto visual.
    if (wantSlides) {
      emitProgress(id, 'slides', `${slideMap.length} slides`);
      if (slideMap.length > 0) {
        await patchGeneration(kv, id, { slideMap: [] });
      }
    }

    // 4. Síntese — uma chamada edge-tts por fala.
    await ensureAudioDir();
    const files: string[] = [];
    const segDurationsMs: number[] = [];
    for (let i = 0; i < segments.length; i++) {
      emitProgress(id, 'tts', `${i + 1}/${segments.length}`);
      const seg = segments[i];
      const voice = voiceIdOf(podcast.voices, seg.speaker);
      if (!voice) throw new Error(`sem voz para ${seg.speaker}`);
      const file = `${tmpDir}/seg_${String(i).padStart(3, '0')}.mp3`;
      await synthesizeSegment(seg.text, voice, file);
      files.push(file);
      // Probe por segmento — base da sincronização slide ↔ áudio.
      const dur = await probeDurationMs(file);
      segDurationsMs.push(dur ?? 0);
    }

    // 5. Sincronização: calcula enterMs para cada slide.
    if (slideMap.length > 0) {
      const computed = computeSlideMap(slideMap, segDurationsMs);
      await patchGeneration(kv, id, { slideMap: computed });
    }

    // 6. Concatenação com ffmpeg.
    emitProgress(id, 'concat');
    const out = audioPath(id);
    await concatAudio(files, out);
    const durationMs = await probeDurationMs(out);

    // 7. Pronto.
    await handleReady(kv, podcast, durationMs);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await handleError(kv, id, error);
    // Limpa áudio e slides parciais, se houver.
    await deleteAudio(id);
    if (podcast.withSlides) await deleteSlides(id);
  } finally {
    await Deno.remove(tmpDir, { recursive: true }).catch(() => {});
  }
};
