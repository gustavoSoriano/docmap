// Baixa o novo binário, valida SHA-256 e o coloca no lugar do atual.
// No macOS/Linux dá pra renomear por cima de um binário em execução: o processo
// atual segue com o inode antigo; o novo vale a partir do próximo start.

const sha256File = async (path: string): Promise<string> => {
  const bytes = await Deno.readFile(path);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const fetchExpectedSha256 = async (
  checksumUrl: string,
  assetUrl: string,
): Promise<string> => {
  const res = await fetch(checksumUrl);
  if (!res.ok) throw new Error(`Checksum falhou: ${res.status}`);
  const text = await res.text();
  const assetName = assetUrl.split('/').pop() ?? '';
  for (const line of text.split('\n')) {
    const match = line.trim().match(/^([a-fA-F0-9]{64})(?:\s+\*?(.+))?$/);
    if (!match) continue;
    const name = match[2]?.trim();
    if (!name || name.endsWith(assetName)) return match[1].toLowerCase();
  }
  throw new Error('Checksum SHA-256 não encontrado para este binário');
};

export const applyUpdate = async (
  assetUrl: string,
  checksumUrl: string,
): Promise<void> => {
  const target = Deno.execPath();
  const staging = `${target}.new`;
  const expectedSha256 = await fetchExpectedSha256(checksumUrl, assetUrl);

  const res = await fetch(assetUrl);
  if (!res.ok || !res.body) throw new Error(`Download falhou: ${res.status}`);

  const file = await Deno.open(staging, {
    write: true,
    create: true,
    truncate: true,
  });
  await res.body.pipeTo(file.writable);

  const actualSha256 = await sha256File(staging);
  if (actualSha256 !== expectedSha256) {
    await Deno.remove(staging).catch(() => {});
    throw new Error('Checksum SHA-256 do binário não confere');
  }

  await Deno.chmod(staging, 0o755);
  await Deno.rename(staging, target);
};
