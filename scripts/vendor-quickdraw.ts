#!/usr/bin/env -S deno run --allow-net --allow-write --allow-env
// ════ Vendoriza o @quickdrawjs/core ════
// Baixa o tarball pinado do npm e gera src/canvas/vendor.gen.ts com o
// conteúdo dos arquivos (ESM + CSS) como strings — o binário `deno compile`
// serve esses arquivos da memória (offline na LAN), sem node_modules.
//
// Rode ao atualizar a versão:
//   DOCMAP_QUICKDRAW_VERSION=0.2.0 deno task vendor-quickdraw

const VERSION = Deno.env.get('DOCMAP_QUICKDRAW_VERSION') ?? '0.2.0';
const TARBALL =
  `https://registry.npmjs.org/@quickdrawjs/core/-/core-${VERSION}.tgz`;

// Arquivos servidos em /canvas/vendor/quickdraw/<nome>.
// index.js importa os demais por caminho relativo — a estrutura precisa
// ser preservada 1:1.
const FILES = [
  'index.js',
  'editor.js',
  'store.js',
  'ui.js',
  'palette.js',
  'shapes.js',
  'geometry.js',
  'freehand.js',
  'quickdraw.css',
] as const;

const OUT = new URL('../src/canvas/vendor.gen.ts', import.meta.url);

const gunzip = async (data: Uint8Array): Promise<Uint8Array> => {
  const ds = new DecompressionStream('gzip');
  const stream = new Response(
    new Blob([data as unknown as BlobPart]).stream().pipeThrough(ds),
  );
  return new Uint8Array(await stream.arrayBuffer());
};

// ── tar parser mínimo (POSIX ustar, só arquivos regulares) ──
const readTar = (tar: Uint8Array): Map<string, Uint8Array> => {
  const files = new Map<string, Uint8Array>();
  const dec = new TextDecoder();
  let off = 0;
  const readStr = (b: Uint8Array, s: number, len: number): string =>
    dec.decode(b.slice(s, s + len)).replace(/\0.*$/s, '');
  while (off + 512 <= tar.length) {
    const head = tar.slice(off, off + 512);
    if (head.every((b) => b === 0)) break;
    const name = readStr(head, 0, 100);
    const size = parseInt(readStr(head, 124, 12).trim() || '0', 8);
    const type = String.fromCharCode(head[156]);
    off += 512;
    if ((type === '0' || type === '\0') && name) {
      files.set(name, tar.slice(off, off + size));
    }
    off += Math.ceil(size / 512) * 512;
  }
  return files;
};

console.log(`▼ baixando @quickdrawjs/core@${VERSION}…`);
const res = await fetch(TARBALL);
if (!res.ok) throw new Error(`download falhou: ${res.status} ${TARBALL}`);
const files = readTar(await gunzip(new Uint8Array(await res.arrayBuffer())));

const entries: string[] = [];
for (const name of FILES) {
  const key = `package/src/${name}`;
  const raw = files.get(key);
  if (!raw) throw new Error(`arquivo ausente no tarball: ${key}`);
  const text = new TextDecoder().decode(raw);
  const esc = text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  entries.push(`  ${JSON.stringify(name)}: \`${esc}\`,`);
  console.log(`  ✓ ${name} (${(raw.length / 1024).toFixed(1)} KB)`);
}

const licenseRaw = files.get('package/LICENSE') ??
  files.get('package/license') ??
  null;
const licenseNote = licenseRaw
  ? new TextDecoder().decode(licenseRaw).split('\n').slice(0, 3).join(' ')
  : 'MIT — ver https://github.com/quickdrawjs/quickdraw/blob/main/LICENSE';

const output = `// AUTO-GENERATED — não edite. Rode: deno task vendor-quickdraw
// @quickdrawjs/core@${VERSION} (${licenseNote})
// Servido em /canvas/vendor/quickdraw/* (offline, da memória).
export const QUICKDRAW_VERSION = ${JSON.stringify(VERSION)};

export const QUICKDRAW_FILES: Readonly<Record<string, string>> = {
${entries.join('\n')}
};
`;

await Deno.writeTextFile(OUT, output);
console.log(`✓ src/canvas/vendor.gen.ts gerado (${VERSION})`);
