// Mata qualquer processo que esteja segurando a porta, para que uma nova
// instância sempre assuma no lugar da anterior (nada de zumbi/código velho).

const killUnix = async (port: number): Promise<void> => {
  const lsof = await new Deno.Command('lsof', {
    args: ['-ti', `tcp:${port}`],
    stdout: 'piped',
    stderr: 'null',
  }).output();
  const pids = new TextDecoder().decode(lsof.stdout).trim().split('\n').filter(
    Boolean,
  );
  for (const pid of pids) {
    await new Deno.Command('kill', { args: ['-9', pid], stderr: 'null' })
      .output();
  }
};

const killWindows = async (port: number): Promise<void> => {
  await new Deno.Command('cmd', {
    args: [
      '/c',
      `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`,
    ],
    stderr: 'null',
    stdout: 'null',
  }).output();
};

export const freePort = async (port: number): Promise<void> => {
  try {
    if (Deno.build.os === 'windows') await killWindows(port);
    else await killUnix(port);
  } catch {
    // lsof/kill indisponível ou nada rodando — segue o baile
  }
};
