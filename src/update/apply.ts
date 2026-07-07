// Baixa o novo binário e o coloca no lugar do atual.
// No macOS/Linux dá pra renomear por cima de um binário em execução: o processo
// atual segue com o inode antigo; o novo vale a partir do próximo start.

export const applyUpdate = async (assetUrl: string): Promise<void> => {
  const target = Deno.execPath();
  const staging = `${target}.new`;

  const res = await fetch(assetUrl);
  if (!res.ok || !res.body) throw new Error(`Download falhou: ${res.status}`);

  const file = await Deno.open(staging, { write: true, create: true, truncate: true });
  await res.body.pipeTo(file.writable);

  await Deno.chmod(staging, 0o755);
  await Deno.rename(staging, target);
};
