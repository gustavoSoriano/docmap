// ════ Síntese de voz (Edge TTS) e concatenação (ffmpeg) ════
// Side effects isolados: subprocessos externos + escrita no filesystem.

import { EDGE_TTS_BIN, FFMPEG_BIN, FFPROBE_BIN } from '../config.ts';

const run = async (
  bin: string,
  args: readonly string[],
): Promise<{ ok: boolean; stdout: string; stderr: string }> => {
  const cmd = new Deno.Command(bin, {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await cmd.output();
  const dec = new TextDecoder();
  return {
    ok: code === 0,
    stdout: dec.decode(stdout).trim(),
    stderr: dec.decode(stderr).trim(),
  };
};

export const synthesizeSegment = async (
  text: string,
  voice: string,
  outFile: string,
): Promise<void> => {
  const r = await run(EDGE_TTS_BIN, [
    '--voice', voice,
    '--text', text,
    '--rate', '+8%',
    '--write-media', outFile,
  ]);
  if (!r.ok) {
    throw new Error(
      `edge-tts falhou (voz ${voice}): ${r.stderr || r.stdout}`,
    );
  }
};

export const concatAudio = async (
  files: readonly string[],
  outFile: string,
): Promise<void> => {
  const filelist = files[0].replace(/\/[^/]+$/, '/') + 'filelist.txt';
  await Deno.writeTextFile(
    filelist,
    files.map((f) => `file '${f}'`).join('\n'),
  );

  const r = await run(FFMPEG_BIN, [
    '-f', 'concat',
    '-safe', '0',
    '-i', filelist,
    '-c', 'copy',
    outFile,
    '-y',
  ]);
  await Deno.remove(filelist).catch(() => {});

  if (!r.ok) {
    throw new Error(`ffmpeg falhou: ${r.stderr || r.stdout}`);
  }
};

export const probeDurationMs = async (
  file: string,
): Promise<number | undefined> => {
  const r = await run(FFPROBE_BIN, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    file,
  ]);
  const seconds = parseFloat(r.stdout);
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : undefined;
};
