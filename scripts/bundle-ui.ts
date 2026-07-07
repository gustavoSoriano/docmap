#!/usr/bin/env -S deno run --allow-read --allow-write
// Gera src/server/ui-bundle.gen.ts com o HTML completo (CSS + JS inlinados)
// Roda antes do deno compile — o resultado é importado pelo binário.

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

const ROOT   = new URL('..', import.meta.url).pathname;
const UI_DIR = join(ROOT, 'ui');
const OUT    = join(ROOT, 'src', 'server', 'handlers', 'ui-bundle.gen.ts');

const LINK_RE   = /<link rel="stylesheet" href="(\/styles\/[^"]+)">/g;
const SCRIPT_RE = /<script src="(\/scripts\/[^"]+)"><\/script>/g;

const readAsset = (relPath: string): string => {
  try { return Deno.readTextFileSync(join(UI_DIR, relPath)); } catch { return ''; }
};

const inline = (shell: string): string => {
  let out = shell;
  for (const m of [...shell.matchAll(LINK_RE)]) {
    out = out.replace(m[0], `<style>\n${readAsset(m[1])}\n</style>`);
  }
  for (const m of [...shell.matchAll(SCRIPT_RE)]) {
    out = out.replace(m[0], `<script>\n${readAsset(m[1])}\n</script>`);
  }
  return out;
};

const html   = Deno.readTextFileSync(join(UI_DIR, 'index.html'));
const bundle = inline(html);

// Escapa backticks e ${} para poder usar template literal
const escaped = bundle.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const output = `// AUTO-GENERATED — não edite. Rode: deno task bundle-ui
export const UI_HTML = \`${escaped}\`;
`;

Deno.writeTextFileSync(OUT, output);
console.log(`✓ ui-bundle.gen.ts gerado (${(bundle.length / 1024).toFixed(0)} KB)`);
