// ════ Handler de podcasts — montado nos routers :3333 (UI) e :3334 (AI) ════

import { audioPath, audioStat, deleteAudio } from './audio.ts';
import { deleteScriptFile } from './scriptfile.ts';
import { deleteSlides, readSlides, slidesExists, writeSlides } from './slides.ts';
import {
  createPodcast,
  deletePodcast,
  getPodcastById,
  listFolders,
  listPodcasts,
  toPreview,
  updatePodcast,
} from './store.ts';
import { runPodcastPipeline } from './pipeline.ts';
import { getVoices, pickRandomVoices, validateVoices } from './voices.ts';
import { broadcast, subscribe } from './sse.ts';
import {
  extractSlidesManifest,
  parseScript,
  parseScriptWithSlides,
  stripSlidesManifest,
  validateSegments,
} from './parser.ts';
import { badRequest, html, json, notFound } from '../server/response.ts';
import { checkDeps } from './health.ts';
import {
  type GeneratePodcastInput,
  type UpdatePodcastInput,
} from './types.ts';
import { normalizeTags } from '../tags/normalize.ts';

const MAX_CONTENT = 20000;
const MAX_TITLE = 120;

const withLink = (p: Record<string, unknown>) => ({
  ...p,
  deepLink: `http://127.0.0.1:3333/#podcast/${p['id']}`,
});

// Stream de um intervalo de bytes do arquivo (suporte a seek no <audio>).
const streamRange = (
  file: Deno.FsFile,
  start: number,
  end: number,
): ReadableStream<Uint8Array> => {
  const chunkSize = 64 * 1024;
  return new ReadableStream({
    async pull(controller) {
      const remaining = end - start + 1;
      if (remaining <= 0) {
        controller.close();
        try { await file.close(); } catch { /* noop */ }
        return;
      }
      const buf = new Uint8Array(Math.min(chunkSize, remaining));
      const n = await file.read(buf);
      if (!n || n === 0) {
        controller.close();
        try { await file.close(); } catch { /* noop */ }
        return;
      }
      controller.enqueue(buf.subarray(0, n));
      start += n;
    },
    cancel() {
      try { file.close(); } catch { /* noop */ }
    },
  });
};

const serveAudio = async (id: string, req: Request): Promise<Response> => {
  const stat = await audioStat(id);
  if (!stat?.size) return notFound();

  const range = req.headers.get('range');
  const headers = (extra: Record<string, string>) => ({
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    ...extra,
  });

  // Resposta completa (sem Range).
  if (!range) {
    const file = await Deno.open(audioPath(id), { read: true });
    return new Response(file.readable, {
      headers: headers({ 'Content-Length': String(stat.size) }),
    });
  }

  // Resposta parcial (206) — browsers fazem seek assim.
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  if (!m) return badRequest('range inválido');
  const start = Number(m[1]);
  const end = m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1;
  if (start > end || start >= stat.size) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${stat.size}` },
    });
  }
  const file = await Deno.open(audioPath(id), { read: true });
  await file.seek(start, Deno.SeekMode.Start);
  return new Response(streamRange(file, start, end), {
    status: 206,
    headers: headers({
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    }),
  });
};

export const podcastsHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    const segments = url.pathname.replace(/^\/podcasts\/?/, '').split('/')
      .filter(Boolean);
    const id = segments[0];
    const sub = segments[1];

    // ── GET /podcasts/events — SSE ──
    if (req.method === 'GET' && id === 'events') {
      return new Response(subscribe(), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // ── GET /podcasts/voices — vozes pt-BR e pt-PT disponíveis (dinâmico) ──
    if (req.method === 'GET' && id === 'voices') {
      const voices = await getVoices().catch(() => [] as const);
      return json(voices);
    }

    // ── GET /podcasts/folders ──
    if (req.method === 'GET' && id === 'folders') {
      return json(await listFolders(kv));
    }

    // ── GET /podcasts/health — verifica dependências externas ──
    if (req.method === 'GET' && id === 'health') {
      return json(await checkDeps());
    }

    // ── GET /podcasts — lista com ?q=&folder= ──
    if (req.method === 'GET' && !id) {
      return json(await listPodcasts(kv, {
        q: url.searchParams.get('q') ?? undefined,
        folder: url.searchParams.get('folder') ?? undefined,
      }));
    }

    // ── POST /podcasts — gera podcast ──
    if (req.method === 'POST' && !id) {
      // Fail fast: dependências externas precisam existir antes de gerar.
      const deps = await checkDeps();
      if (!deps.ready) {
        const missing = deps.instructions
          .map((i) => `instale ${i.dep}: ${i.cmd}`)
          .join(' | ');
        return badRequest(`dependências faltando — ${missing}`);
      }

      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('JSON inválido'); }
      const input = body as GeneratePodcastInput;

      const title = input.title?.trim();
      if (!title) return badRequest('title é obrigatório');
      if (title.length > MAX_TITLE) return badRequest(`title: máx ${MAX_TITLE} chars`);

      const hasContent = input.content != null && input.content.trim().length > 0;
      const hasScript = input.script != null && input.script.trim().length > 0;
      if (hasContent && hasScript) {
        return badRequest('envie content OU script, não ambos');
      }
      if (!hasContent && !hasScript) {
        return badRequest('content ou script é obrigatório');
      }
      if (hasContent && input.content!.length > MAX_CONTENT) {
        return badRequest(`content: máx ${MAX_CONTENT} chars`);
      }

      // Vozes — enviadas ou sorteadas (sempre 2+).
      const voices = input.voices && input.voices.length > 0
        ? input.voices
        : await pickRandomVoices(2);
      const voiceError = validateVoices(voices);
      if (voiceError) return badRequest(voiceError);

      // Se vier roteiro pronto, valida as tags já no POST (fail fast pra IA).
      let script = '';
      // Guarda o bruto quando o roteiro vem com manifesto <Slides> embutido.
      let scriptWithManifest: string | null = null;
      const wantSlides = input.withSlides === true;
      if (hasScript) {
        const raw = input.script!.trim();
        // Quando o usuário quer slides, o roteiro pode trazer <Slide>…</Slide>
        // e, no fim, um bloco <Slides>…</Slides> (manifesto visual). Aceita
        // ambos — escrevemos o manifesto no filesystem e salvamos o script
        // limpo no KV.
        if (wantSlides) {
          const parsed = parseScriptWithSlides(raw);
          const segErr = validateSegments(parsed.segments, voices);
          if (segErr) return badRequest(segErr);
          scriptWithManifest = raw;
          script = stripSlidesManifest(raw);
        } else {
          const segErr = validateSegments(parseScript(raw), voices);
          if (segErr) return badRequest(segErr);
          script = raw;
        }
      }

      const folder = (input.folder?.trim() || 'geral');

      // Slides prontos (API externa): escreve direto no filesystem; o
      // pipeline apenas computa enterMs depois do TTS. Se vier slides sem
      // script com <Slide> blocos, falha aqui mesmo.
      let preSlideMap;
      if (wantSlides && input.slides && input.slides.length > 0 && hasScript) {
        const parsed = parseScriptWithSlides(script);
        if (parsed.slideMap.length === 0) {
          return badRequest(
            'slides enviados mas o script não contém blocos <Slide>…</Slide>',
          );
        }
        preSlideMap = parsed.slideMap;
      }

      const podcast = await createPodcast(kv, {
        title,
        folder,
        tags: normalizeTags(input.tags),
        script,
        ...(hasContent ? { sourceContent: input.content!.trim() } : {}),
        voices,
        status: 'generating',
        ...(wantSlides ? { withSlides: true } : {}),
        ...(preSlideMap ? { slideMap: preSlideMap } : {}),
      });

      // Slides prontos ou manifesto no próprio script: escreve no FS agora.
      // O pipeline (branch sourceContent) faz isso sozinho quando gera.
      if (wantSlides && !hasContent) {
        const manifest = input.slides && input.slides.length > 0
          ? input.slides
          : extractSlidesManifest(scriptWithManifest ?? script);
        if (manifest.length > 0) {
          await writeSlides(podcast.id, manifest);
        }
      }

      // Dispara o pipeline em background — não aguardamos.
      runPodcastPipeline(kv, podcast.id);

      const payload = withLink(toPreview(podcast) as unknown as Record<string, unknown>);
      broadcast({ type: 'created', podcast: toPreview(podcast) });
      return json(payload, 202);
    }

    // A partir daqui precisa de id.
    if (!id) return json({ error: 'method_not_allowed' }, 405);

    // ── GET /podcasts/:id ──
    if (req.method === 'GET' && !sub) {
      const p = await getPodcastById(kv, id);
      if (!p) return notFound();
      return json(withLink(p as unknown as Record<string, unknown>));
    }

    // ── GET /podcasts/:id/audio — stream com Range ──
    if (req.method === 'GET' && sub === 'audio') {
      const p = await getPodcastById(kv, id);
      if (!p) return notFound();
      if (p.status !== 'ready') return badRequest('podcast ainda não está pronto');
      return serveAudio(id, req);
    }

    // ── GET /podcasts/:id/slides — documento HTML único ──
    if (req.method === 'GET' && sub === 'slides') {
      const p = await getPodcastById(kv, id);
      if (!p) return notFound();
      if (!p.withSlides) return badRequest('podcast não tem slides');
      const exists = await slidesExists(id);
      if (!exists) return notFound();
      const doc = await readSlides(id);
      if (doc === null) return notFound();
      return html(doc);
    }

    // ── PUT /podcasts/:id — renomear / mover de pasta ──
    if (req.method === 'PUT' && !sub) {
      let body: unknown;
      try { body = await req.json(); } catch { return badRequest('JSON inválido'); }
      const updated = await updatePodcast(kv, id, body as UpdatePodcastInput);
      if (!updated) return notFound();
      const payload = withLink(toPreview(updated) as unknown as Record<string, unknown>);
      broadcast({ type: 'updated', podcast: toPreview(updated) });
      return json(payload);
    }

    // ── DELETE /podcasts/:id — remove metadados + áudio + slides + script ──
    if (req.method === 'DELETE' && !sub) {
      const ok = await deletePodcast(kv, id);
      if (ok) {
        await deleteAudio(id);
        await deleteSlides(id);
        await deleteScriptFile(id);
        broadcast({ type: 'deleted', id });
      }
      return json({ ok });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
