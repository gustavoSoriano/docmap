export const openFolderDialog = async (
  prompt = 'Selecionar pasta do projeto',
): Promise<string | null> => {
  if (Deno.build.os !== 'darwin') return null; // só macOS por ora
  try {
    const proc = new Deno.Command('osascript', {
      args: [
        '-e',
        `POSIX path of (choose folder with prompt "${prompt}")`,
      ],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code, stdout } = await proc.output();
    if (code !== 0) return null;
    return new TextDecoder().decode(stdout).trim() || null;
  } catch {
    return null;
  }
};

export const openFileDialog = async (
  prompt = 'Selecionar arquivo',
): Promise<string | null> => {
  if (Deno.build.os !== 'darwin') return null; // só macOS por ora
  try {
    const proc = new Deno.Command('osascript', {
      args: [
        '-e',
        `POSIX path of (choose file with prompt "${prompt}" of type {"json"})`,
      ],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code, stdout } = await proc.output();
    if (code !== 0) return null;
    return new TextDecoder().decode(stdout).trim() || null;
  } catch {
    return null;
  }
};
