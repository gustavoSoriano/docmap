// ════ Health check das dependências externas de podcast ════
// edge-tts (Python) e ffmpeg/ffprobe não vêm empacotados — precisam existir
// no sistema. Este módulo verifica e devolve instruções de instalação.

import { EDGE_TTS_BIN, FFMPEG_BIN, FFPROBE_BIN } from '../config.ts';

const binExists = async (bin: string, args: readonly string[]): Promise<boolean> => {
  try {
    const cmd = new Deno.Command(bin, {
      args: [...args],
      stdout: 'null',
      stderr: 'null',
    });
    const { code } = await cmd.output();
    return code === 0;
  } catch {
    return false;
  }
};

export type DepStatus = {
  readonly edgeTts: boolean;
  readonly ffmpeg: boolean;
  readonly ffprobe: boolean;
};

export type HealthReport = DepStatus & {
  readonly ready: boolean;
  readonly bins: {
    readonly edgeTts: string;
    readonly ffmpeg: string;
    readonly ffprobe: string;
  };
  readonly instructions: readonly { readonly dep: string; readonly cmd: string }[];
};

export const checkDeps = async (): Promise<HealthReport> => {
  const [edgeTts, ffmpeg, ffprobe] = await Promise.all([
    binExists(EDGE_TTS_BIN, ['--help']),
    binExists(FFMPEG_BIN, ['-version']),
    binExists(FFPROBE_BIN, ['-version']),
  ]);

  const instructions: { dep: string; cmd: string }[] = [];
  if (!edgeTts) {
    instructions.push({
      dep: 'edge-tts',
      cmd: Deno.build.os === 'darwin'
        ? 'pip3 install edge-tts  # (ou no seu venv: python3 -m pip install edge-tts)'
        : 'pip3 install edge-tts',
    });
  }
  if (!ffmpeg || !ffprobe) {
    instructions.push({
      dep: 'ffmpeg + ffprobe',
      cmd: Deno.build.os === 'darwin'
        ? 'brew install ffmpeg'
        : Deno.build.os === 'windows'
        ? 'winget install ffmpeg  # (ou baixe de ffmpeg.org)'
        : 'sudo apt install ffmpeg',
    });
  }

  return {
    edgeTts,
    ffmpeg,
    ffprobe,
    ready: edgeTts && ffmpeg && ffprobe,
    bins: { edgeTts: EDGE_TTS_BIN, ffmpeg: FFMPEG_BIN, ffprobe: FFPROBE_BIN },
    instructions,
  };
};
