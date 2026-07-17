// ════ Orquestração da geração de um podcast (assíncrono) ════
// Chamado pelo handler em background (sem await). Grava status no KV e
// emite eventos SSE em cada etapa.

import { audioPath, deleteAudio, ensureAudioDir } from './audio.ts';
import { parseScript, validateSegments, voiceIdOf } from './parser.ts';
import { broadcast } from './sse.ts';
import { generateScript } from './script.ts';
import { concatAudio, probeDurationMs, synthesizeSegment } from './tts.ts';
import { getPodcastById, patchGeneration, toPreview } from './store.ts';
import type { Podcast } from './types.ts';

const emitProgress = (id: string, stage: 'script' | 'tts' | 'concat', detail?: string) =>
  broadcast({ type: 'progress', id, stage, detail });

const handleReady = async (kv: Deno.Kv, p: Podcast, durationMs?: number) => {
  await patchGeneration(kv, p.id, { status: 'ready', durationMs });
  broadcast({ type: 'ready', podcast: toPreview({ ...p, status: 'ready', ...(durationMs !== undefined ? { durationMs } : {}) }) });
};

const handleError = async (kv: Deno.Kv, id: string, error: string) => {
  await patchGeneration(kv, id, { status: 'error', error });
  broadcast({ type: 'error', id, error });
};

export const runPodcastPipeline = async (kv: Deno.Kv, id: string): Promise<void> => {
  const podcast = await getPodcastById(kv, id);
  if (!podcast) return;

  const tmpDir = await Deno.makeTempDir({ prefix: 'docmap-pod-' });

  try {
    // 1. Roteiro — se vier de content, gera agora via LLM.
    let { script } = podcast;
    if (!script && podcast.sourceContent) {
      emitProgress(id, 'script');
      script = await generateScript(kv, podcast.sourceContent, podcast.voices);
      await patchGeneration(kv, id, { script });
    }

    // 2. Parse + validação contra as personas.
    const segments = parseScript(script);
    const invalid = validateSegments(segments, podcast.voices);
    if (invalid) throw new Error(invalid);

    // 3. Síntese — uma chamada edge-tts por fala.
    await ensureAudioDir();
    const files: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      emitProgress(id, 'tts', `${i + 1}/${segments.length}`);
      const seg = segments[i];
      const voice = voiceIdOf(podcast.voices, seg.speaker);
      if (!voice) throw new Error(`sem voz para ${seg.speaker}`);
      const file = `${tmpDir}/seg_${String(i).padStart(3, '0')}.mp3`;
      await synthesizeSegment(seg.text, voice, file);
      files.push(file);
    }

    // 4. Concatenação com ffmpeg.
    emitProgress(id, 'concat');
    const out = audioPath(id);
    await concatAudio(files, out);
    const durationMs = await probeDurationMs(out);

    // 5. Pronto.
    await handleReady(kv, podcast, durationMs);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await handleError(kv, id, error);
    // Limpa áudio parcial, se houver.
    await deleteAudio(id);
  } finally {
    await Deno.remove(tmpDir, { recursive: true }).catch(() => {});
  }
};
