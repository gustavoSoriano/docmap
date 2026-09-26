// Health check só do edge-tts — codetour precisa de 1 segmento por slide,
// sem ffmpeg/ffprobe (sem concatenação). Não importa de podcasts/health.ts
// de propósito: módulos irmãos, não pai/filho.
import { EDGE_TTS_BIN } from '../config.ts';

export type VoiceHealth = {
  readonly edgeTts: boolean;
  readonly ready: boolean;
  readonly instructions: readonly { readonly dep: string; readonly cmd: string }[];
};

const binExists = async (): Promise<boolean> => {
  try {
    const cmd = new Deno.Command(EDGE_TTS_BIN, {
      args: ['--help'],
      stdout: 'null',
      stderr: 'null',
    });
    const { code } = await cmd.output();
    return code === 0;
  } catch {
    return false;
  }
};

export const checkVoiceDeps = async (): Promise<VoiceHealth> => {
  const edgeTts = await binExists();
  return {
    edgeTts,
    ready: edgeTts,
    instructions: edgeTts
      ? []
      : [{
        dep: 'edge-tts',
        cmd: Deno.build.os === 'darwin'
          ? 'pip3 install edge-tts'
          : 'pip3 install edge-tts',
      }],
  };
};
