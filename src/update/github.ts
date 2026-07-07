import { APP_VERSION, GITHUB_REPO } from '../config.ts';

export type UpdateStatus = {
  readonly current: string;
  readonly latest: string | null;
  readonly available: boolean;
  readonly url: string | null;
  readonly assetUrl: string | null;
  readonly checkedAt: string;
  readonly error?: string;
};

// Compara "1.2.0" vs "1.10.0" numericamente por segmento.
const isNewer = (latest: string, current: string): boolean => {
  const a = latest.replace(/^v/, '').split('.').map(Number);
  const b = current.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return false;
};

// Nome do asset esperado por plataforma (você nomeia assim no release).
const assetName = (): string => {
  const os = Deno.build.os === 'darwin' ? 'macos' : Deno.build.os;
  return `docmap-${os}-${Deno.build.arch}`;
};

export const checkForUpdate = async (): Promise<UpdateStatus> => {
  const base: UpdateStatus = {
    current: APP_VERSION, latest: null, available: false,
    url: null, assetUrl: null, checkedAt: new Date().toISOString(),
  };
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { ...base, error: `GitHub ${res.status}` };

    const rel = await res.json() as {
      tag_name: string;
      html_url: string;
      assets: Array<{ name: string; browser_download_url: string }>;
    };
    const latest = rel.tag_name;
    const asset = rel.assets?.find((a) => a.name === assetName());
    return {
      ...base,
      latest,
      available: isNewer(latest, APP_VERSION),
      url: rel.html_url,
      assetUrl: asset?.browser_download_url ?? null,
    };
  } catch (err) {
    return { ...base, error: err instanceof Error ? err.message : 'erro desconhecido' };
  }
};
