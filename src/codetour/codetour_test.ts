import {
  assert,
  assertEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildAgentPrompt, buildCodetourPrompt } from './prompt.ts';
import {
  attachReel,
  clearSession,
  getSession,
  openSession,
} from './session.ts';
import { parseCodeReel, validateOpenInput } from './validate.ts';
import { scanProject } from './scan.ts';
import {
  detectLayer,
  extractSymbols,
  orderFiles,
  resolveImport,
  scoreFile,
} from './symbols.ts';
import type { CodeReel, Reel, StructurePack, TourDepth } from './types.ts';

const MERMAID =
  'flowchart LR; A[handler]-->B[service]; B-->C[store]; class A api; class B service;';

const BUBBLE_JSON = JSON.stringify({
  center: { label: 'SERVIÇO', detail: 'Centraliza regras antes do store.' },
  nodes: [
    {
      id: 'validacao',
      label: 'VALIDAÇÃO',
      detail: 'Barra título vazio na linha doze.',
      parent: null,
      file: 'src/notes/service.ts:12',
      reel: 'r1',
    },
    {
      id: 'persistencia',
      label: 'STORE',
      detail: 'Persiste só dado normalizado.',
      parent: null,
    },
    {
      id: 'vazio',
      label: 'VAZIO',
      detail: 'Exemplo: chega título vazio e explode.',
      parent: 'validacao',
    },
  ],
});

const reel = (over: Partial<Reel> = {}): Reel => ({
  id: 'r1',
  label: 'valida',
  title: 'O service barra título vazio antes de salvar',
  code: {
    file: 'src/notes/service.ts:12',
    code:
      'export const createNote = (input: CreateInput) => {\n  if (!input.title.trim()) throw new Error("title required");\n  return store.save(normalize(input));\n};',
    mark: [12, 13],
  },
  visual: null,
  rule: {
    file: 'src/notes/service.ts',
    text: 'Título vazio nunca chega ao store.',
  },
  sub: 'Sem essa barreira, dado sujo pararia no banco.',
  narration:
    'Ele recebe o título, barra vazio na linha doze e só aí salva. Sem isso, dado sujo pararia no banco de dados do aplicativo.',
  ...over,
});

const caderno = (
  n: number,
  over: (i: number) => Partial<Reel> = () => ({}),
): CodeReel => ({
  topic: 'camada de serviço',
  goal: 'Centraliza regras antes do store, por isso importa.',
  reels: Array.from(
    { length: n },
    (_, i) => reel({ id: `r${i + 1}`, ...over(i) }),
  ),
});

const ctxOf = (
  paths: string[] = ['src/notes/service.ts'],
  depth: TourDepth = 'repasse',
  allowed?: readonly ('mermaid' | 'mindmap' | 'html' | 'bubble')[],
) => ({
  depth,
  paths: new Set(paths),
  ...(allowed ? { allowed } : {}),
});

Deno.test('camada detectada pelo path', () => {
  assertEquals(detectLayer('src/routes/users.ts'), 'api');
  assertEquals(detectLayer('src/email.service.ts'), 'service');
  assertEquals(detectLayer('src/notes/store.ts'), 'data');
  assertEquals(detectLayer('ui/graph.tsx'), 'ui');
  assertEquals(detectLayer('src/x.test.ts'), 'test');
  assertEquals(detectLayer('src/config.ts'), 'util');
});

Deno.test('símbolos e imports extraídos', () => {
  const src = [
    `import { store } from './store.ts';`,
    `import zod from 'zod';`,
    `export const createNote = () => {};`,
    `export class NotesHandler {}`,
    `export { a, b as c };`,
  ].join('\n');
  const { symbols, imports } = extractSymbols(src);
  assert(symbols.some((s) => s.name === 'createNote'));
  assert(symbols.some((s) => s.name === 'NotesHandler' && s.kind === 'class'));
  assertEquals(imports[0].from, './store.ts');
  assertEquals(
    resolveImport(
      './store.ts',
      'src/notes/service.ts',
      (p) => p === 'src/notes/store.ts',
    ),
    'src/notes/store.ts',
  );
  assertEquals(resolveImport('zod', 'src/a.ts', () => true), null);
});

Deno.test('ordem topológica respeita imports', () => {
  const files = [
    {
      path: 'b.ts',
      layer: 'util' as const,
      symbols: [],
      imports: [{ from: './a.ts', resolved: 'a.ts' }],
    },
    { path: 'a.ts', layer: 'util' as const, symbols: [], imports: [] },
  ];
  assertEquals(orderFiles(files), ['a.ts', 'b.ts']);
});

Deno.test('scan varre tempdir com teto', async () => {
  const dir = await Deno.makeTempDir();
  await Deno.mkdir(`${dir}/src/services`, { recursive: true });
  await Deno.writeTextFile(
    `${dir}/src/services/mail.service.ts`,
    `import { q } from '../queue.ts';\nexport const send = () => q.add();\n`,
  );
  await Deno.writeTextFile(`${dir}/src/queue.ts`, `export const q = {};\n`);
  await Deno.writeTextFile(`${dir}/README.md`, 'x');
  const pack = await scanProject(dir, 'email service');
  assertEquals(pack.files.length, 2);
  assert(pack.files[0].path.includes('mail.service.ts'));
  assertEquals(pack.files[0].layer, 'service');
  assert(
    pack.order.indexOf('src/queue.ts') <
      pack.order.indexOf('src/services/mail.service.ts'),
  );
  assertEquals(scoreFile(pack.files[0], ['email', 'service']) > 0, true);
  await Deno.remove(dir, { recursive: true });
});

Deno.test('protocolo descreve reels e não exige todas as tools', () => {
  const pack: StructurePack = {
    root: '/tmp/p',
    query: 'auth',
    scannedAt: new Date().toISOString(),
    files: [],
    order: [],
    truncated: false,
  };
  const p = buildCodetourPrompt('/tmp/p', 'auth', 'repasse', pack);
  assert(p.includes('reels') && p.includes('mark') && p.includes('narration'));
  assert(p.includes('mermaid') && p.includes('mindmap') && p.includes('html'));
  assert(p.includes('OPCIONAL'));
  assert(!p.includes('TODAS as tools'));
  assert(!buildAgentPrompt('/tmp/p', 'x', 'deep').includes('TODAS as tools'));
});

Deno.test('open aceita depth e rejeita inválida', () => {
  assertEquals(
    validateOpenInput({ projectRoot: '/x', query: 'q', depth: 'deep' }),
    null,
  );
  assertEquals(
    validateOpenInput({ projectRoot: '/x', query: 'q', depth: 'turbo' }),
    'depth deve ser resumo, repasse ou deep',
  );
});

Deno.test('parse aceita caderno sem nenhum visual', () => {
  const r = parseCodeReel(caderno(6), ctxOf());
  assert(!('error' in r));
  if (!('error' in r)) assertEquals(r.reel.reels.length, 6);
});

Deno.test('parse aceita visual opcional (mermaid)', () => {
  const r = parseCodeReel(
    caderno(
      6,
      (i) =>
        i === 0
          ? { visual: { kind: 'mermaid', title: 'Fluxo', content: MERMAID } }
          : {},
    ),
    ctxOf(),
  );
  assert(!('error' in r));
});

Deno.test('parse rejeita visual fora da paleta permitida', () => {
  const c = caderno(6, (i) =>
    i === 0
      ? {
        visual: {
          kind: 'mindmap',
          title: 'Mapa',
          content: '# tópico\n- item um\n- item dois',
        },
      }
      : {});
  const r = parseCodeReel(c, ctxOf(undefined, 'repasse', ['mermaid']));
  assert('error' in r && r.error.includes('desativado'));
});

Deno.test('parse rejeita mermaid fora do subconjunto seguro', () => {
  const bads = [
    'flowchart LR; A[x]-->B[y]; ```',
    'flowchart LR; A["com aspas"]-->B[y]; B-->C[z];',
    'flowchart LR; A[x]-->B[y]; B-->C[z]; class Z api;',
    'flowchart LR; A[x]-->B[y]; B-->C[z]; class A backend;',
    'flowchart LR; A[x]-->B[y]; click A callback;',
  ];
  for (const content of bads) {
    const c = caderno(
      6,
      (i) =>
        i === 0 ? { visual: { kind: 'mermaid', title: 'F', content } } : {},
    );
    const r = parseCodeReel(c, ctxOf());
    assert('error' in r && r.error.includes('mermaid'), content);
  }
});

Deno.test('parse rejeita html com script', () => {
  const c = caderno(6, (i) =>
    i === 0
      ? {
        visual: {
          kind: 'html',
          title: 'H',
          content: '<div onclick="x()">oi</div><script>alert(1)</script>',
        },
      }
      : {});
  const r = parseCodeReel(c, ctxOf());
  assert('error' in r && r.error.includes('script'));
});

Deno.test('parse rejeita mark fora do trecho', () => {
  const c = caderno(
    6,
    (i) => (i === 0 ? { code: { ...reel().code!, mark: [99] } } : {}),
  );
  const r = parseCodeReel(c, ctxOf());
  assert('error' in r && r.error.includes('mark'));
});

Deno.test('parse rejeita code fora do scan', () => {
  const c = caderno(
    6,
    (i) =>
      i === 0
        ? {
          code: { file: 'src/outro.ts:1', code: reel().code!.code, mark: [1] },
        }
        : {},
  );
  const r = parseCodeReel(c, ctxOf());
  assert('error' in r && r.error.includes('fora do scan'));
});

Deno.test('parse exige narration por reel', () => {
  const c = caderno(6, (i) => (i === 0 ? { narration: '' } : {}));
  const r = parseCodeReel(c, ctxOf());
  assert('error' in r && r.error.includes('narration'));
});

Deno.test('parse rejeita narration com código', () => {
  const c = caderno(
    6,
    (i) => i === 0 ? { narration: '```code``` fala isso' } : {},
  );
  assert('error' in parseCodeReel(c, ctxOf()));
});

Deno.test('parse aceita caderno completo e popula a sessão por id', () => {
  const r = parseCodeReel(caderno(6), ctxOf());
  assert(!('error' in r));
  clearSession();
  const id = crypto.randomUUID();
  openSession(id, '/tmp/a', 'camada de serviço', 'repasse');
  if (!('error' in r)) attachReel(id, r.reel);
  assertEquals(getSession(id)?.reel?.reels.length, 6);
  assertEquals(getSession()?.id, id);
  clearSession();
});

Deno.test('parse rejeita bubble com parent inexistente', () => {
  const c = caderno(6, (i) =>
    i === 0
      ? {
        visual: {
          kind: 'bubble',
          title: 'B',
          content: JSON.stringify({
            center: { label: 'C', detail: 'Centro de teste para o mapa.' },
            nodes: [
              {
                id: 'h1',
                label: 'H1',
                detail: 'Hub um do mapa.',
                parent: null,
              },
              {
                id: 'h2',
                label: 'H2',
                detail: 'Hub dois do mapa.',
                parent: null,
              },
              {
                id: 's1',
                label: 'S1',
                detail: 'Satélite órfão.',
                parent: 'fantasma',
              },
            ],
          }),
        },
      }
      : {});
  const r = parseCodeReel(c, ctxOf());
  assert('error' in r && r.error.includes('fantasma'));
});

Deno.test('parse valida refs de bubble (arquivo fora do scan)', () => {
  const c = caderno(6, (i) =>
    i === 0
      ? {
        visual: {
          kind: 'bubble',
          title: 'B',
          content: JSON.stringify({
            center: { label: 'C', detail: 'Centro de teste para o mapa.' },
            nodes: [
              {
                id: 'h1',
                label: 'H1',
                detail: 'Hub um do mapa.',
                parent: null,
                file: 'src/fantasma.ts:1',
              },
              {
                id: 'h2',
                label: 'H2',
                detail: 'Hub dois do mapa.',
                parent: null,
              },
              { id: 's1', label: 'S1', detail: 'Satélite.', parent: 'h1' },
            ],
          }),
        },
      }
      : {});
  const r = parseCodeReel(c, ctxOf());
  assert('error' in r && r.error.includes('fantasma'));
});

Deno.test('parse rejeita número de reels fora da faixa', () => {
  assert('error' in parseCodeReel(caderno(2), ctxOf()));
  assert('error' in parseCodeReel(caderno(20), ctxOf()));
});

Deno.test('bubble do parser aceita campo reel', () => {
  const c = caderno(
    6,
    (i) =>
      i === 0
        ? { visual: { kind: 'bubble', title: 'B', content: BUBBLE_JSON } }
        : {},
  );
  const r = parseCodeReel(c, ctxOf());
  assert(!('error' in r));
});
