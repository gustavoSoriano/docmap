type Platform = 'darwin' | 'windows' | 'linux';

const DIALOG_COMMANDS: Record<Platform, string[]> = {
  darwin:  ['osascript', '-e', 'POSIX path of (choose folder)'],
  windows: ['powershell', '-Command', '[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") | Out-Null; $f = New-Object System.Windows.Forms.FolderBrowserDialog; if ($f.ShowDialog() -eq "OK") { $f.SelectedPath }'],
  linux:   ['zenity', '--file-selection', '--directory'],
};

const getPlatform = (): Platform => {
  const os = Deno.build.os;
  if (os === 'darwin') return 'darwin';
  if (os === 'windows') return 'windows';
  return 'linux';
};

export const openFileDialog = async (prompt = 'Selecionar arquivo'): Promise<string | null> => {
  if (Deno.build.os !== 'darwin') return null; // só macOS por ora
  try {
    const proc = new Deno.Command('osascript', {
      args: ['-e', `POSIX path of (choose file with prompt "${prompt}" of type {"json"})`],
      stdout: 'piped', stderr: 'piped',
    });
    const { code, stdout } = await proc.output();
    if (code !== 0) return null;
    return new TextDecoder().decode(stdout).trim() || null;
  } catch { return null; }
};

export const openFolderDialog = async (): Promise<string | null> => {
  const platform = getPlatform();
  const [cmd, ...args] = DIALOG_COMMANDS[platform];

  try {
    const proc = new Deno.Command(cmd, { args, stdout: 'piped', stderr: 'piped' });
    const { code, stdout } = await proc.output();
    if (code !== 0) return null;
    const selected = new TextDecoder().decode(stdout).trim();
    return selected || null;
  } catch {
    return null;
  }
};
