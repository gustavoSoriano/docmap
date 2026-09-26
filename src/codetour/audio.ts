// Arquivos de narração do codetour — cache em filesystem.
// Local: <dataDir>/codetour/<hash>.mp3. Sessão segue em memória; só o MP3
// persiste (KV tem limite de ~64 KiB/valor). Nome é hash hex — sem traversal.
import { codetourDir } from '../config.ts';

export const audioPathForHash = (hash: string): string =>
  `${codetourDir()}/${hash}.mp3`;

export const ensureCodetourDir = async (): Promise<void> => {
  await Deno.mkdir(codetourDir(), { recursive: true });
};

export const statNarration = async (
  hash: string,
): Promise<Deno.FileInfo | null> => {
  try {
    return await Deno.stat(audioPathForHash(hash));
  } catch {
    return null;
  }
};

// Stream com suporte a Range — browsers fazem seek assim no <audio>.
const streamRange = (
  file: Deno.FsFile,
  start: number,
  end: number,
): ReadableStream<Uint8Array> => {
  const chunk = 64 * 1024;
  return new ReadableStream({
    async pull(controller) {
      const remaining = end - start + 1;
      if (remaining <= 0) {
        controller.close();
        try {
          await file.close();
        } catch { /* noop */ }
        return;
      }
      const buf = new Uint8Array(Math.min(chunk, remaining));
      const n = await file.read(buf);
      if (!n) {
        controller.close();
        try {
          await file.close();
        } catch { /* noop */ }
        return;
      }
      controller.enqueue(buf.subarray(0, n));
      start += n;
    },
    cancel() {
      try {
        file.close();
      } catch { /* noop */ }
    },
  });
};

export const serveNarrationFile = async (
  hash: string,
  req: Request,
): Promise<Response> => {
  const stat = await statNarration(hash);
  if (!stat?.size) {
    return new Response('Not found', { status: 404 });
  }
  const size = stat.size;
  const base = {
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
  };
  const range = req.headers.get('range');
  if (!range) {
    const file = await Deno.open(audioPathForHash(hash), { read: true });
    return new Response(file.readable, {
      headers: { ...base, 'Content-Length': String(size) },
    });
  }
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  if (!m) return new Response('range inválido', { status: 400 });
  const start = Number(m[1]);
  const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start > end || start >= size) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}` },
    });
  }
  const file = await Deno.open(audioPathForHash(hash), { read: true });
  await file.seek(start, Deno.SeekMode.Start);
  return new Response(streamRange(file, start, end), {
    status: 206,
    headers: {
      ...base,
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${size}`,
    },
  });
};
