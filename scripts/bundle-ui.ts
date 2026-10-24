#!/usr/bin/env -S deno run --allow-read --allow-write
// Gera, antes do deno compile:
//  - src/server/handlers/ui-bundle.gen.ts: o HTML completo (CSS + JS inlinados)
//  - src/server/handlers/ui-shared.gen.ts: fonte, tokens e componentes como
//    strings, para as páginas standalone em iframe (/canvas, /debug), que não
//    herdam o CSS do app.

import { join } from 'https://deno.land/std@0.224.0/path/mod.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const UI_DIR = join(ROOT, 'ui');
const OUT = join(ROOT, 'src', 'server', 'handlers', 'ui-bundle.gen.ts');
const OUT_SHARED = join(ROOT, 'src', 'server', 'handlers', 'ui-shared.gen.ts');

const LINK_RE =
  /<link rel="stylesheet" href="(\/(?:styles|vendor)\/[^"]+)"\s*\/?>/g;
const SCRIPT_RE = /<script src="(\/(?:scripts|vendor)\/[^"]+)"><\/script>/g;

const readAsset = (relPath: string): string => {
  try {
    return Deno.readTextFileSync(join(UI_DIR, relPath));
  } catch {
    return '';
  }
};

const inlineStyle = (content: string): string =>
  `<style>\n${content.replace(/<\/style/gi, '<\\/style')}\n</style>`;

const inlineScript = (content: string): string =>
  `<script>\n${
    content
      .replace(/<\/script/gi, '<\\/script')
      .replace(/<!--/g, '<\\!--')
  }\n</script>`;

const inline = (shell: string): string => {
  let out = shell;
  for (const m of [...shell.matchAll(LINK_RE)]) {
    out = out.replace(m[0], () => inlineStyle(readAsset(m[1])));
  }
  for (const m of [...shell.matchAll(SCRIPT_RE)]) {
    out = out.replace(m[0], () => inlineScript(readAsset(m[1])));
  }
  return out;
};

const html = Deno.readTextFileSync(join(UI_DIR, 'index.html'));
const bundle = inline(html);

// Escapa backticks e ${} para poder usar template literal
const escaped = bundle.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(
  /\$\{/g,
  '\\${',
);

const output = `// AUTO-GENERATED — não edite. Rode: deno task bundle-ui
export const UI_HTML = \`${escaped}\`;
`;

Deno.writeTextFileSync(OUT, output);
console.log(
  `✓ ui-bundle.gen.ts gerado (${(bundle.length / 1024).toFixed(0)} KB)`,
);

// ── CSS compartilhado para as páginas standalone (iframes) ──
// JSON.stringify gera um literal de string seguro (sem escapar à mão).
const sharedConst = (name: string, relPath: string): string =>
  `export const ${name} = ${JSON.stringify(readAsset(relPath))};\n`;

const sharedOutput = `// AUTO-GENERATED — não edite. Rode: deno task bundle-ui
// CSS do design system para páginas standalone servidas em iframe.
${sharedConst('FONT_CSS', 'styles/fonts.css')}${
  sharedConst('TOKENS_CSS', 'styles/tokens.css')
}${sharedConst('COMPONENTS_CSS', 'styles/components.css')}`;

Deno.writeTextFileSync(OUT_SHARED, sharedOutput);
console.log(
  `✓ ui-shared.gen.ts gerado (${(sharedOutput.length / 1024).toFixed(0)} KB)`,
);
