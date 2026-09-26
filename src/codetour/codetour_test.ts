import {
  assert,
  assertEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildAgentPrompt, buildCodetourPrompt } from './prompt.ts';
import {
  attachTour,
  clearSession,
  getSession,
  openSession,
} from './session.ts';
import { parseCodeTour, validateOpenInput } from './validate.ts';
import { scanProject } from './scan.ts';
import {
  detectLayer,
  extractSymbols,
  orderFiles,
  resolveImport,
  scoreFile,
} from './symbols.ts';
import type { CodeTour, StructurePack, TourSlide } from './types.ts';

const MERMAID =
  'flowchart LR; A[handler]-->B[service]; B-->C[store]; class A api; class B service;';

const slide = (over: Partial<TourSlide> = {}): TourSlide => ({
  id: 's1',
  title: 'Visão',
  bullets: ['valida e orquestra'],
  explain:
    'Pense no service como o porteiro: nada chega ao store sem passar por ele. ' +
    'Chega {title: ""} na linha 12 e explode com title required antes de gravar. ' +
    'Sem ele, cada handler duplicaria a validação e dado sujo pararia no KV. ' +
    'Se apagar este arquivo, o porteiro some e o store aceita qualquer coisa.',
  check: 'Se entendeu, você responde: onde um título vazio é barrado?',
  narration:
    'Olha esse service. Ele recebe o título, barra vazio na linha doze e só aí salva. ' +
    'Sem ele, dado sujo pararia no banco e cada handler duplicaria a validação.',
  snippet: {
    file: 'src/notes/service.ts:12',
    code:
      'export const createNote = (input: CreateInput) => {\n  if (!input.title.trim()) throw new Error("title required");\n  return store.save(normalize(input));\n};',
  },
  visuals: [
    { kind: 'mermaid', title: 'Fluxo', content: MERMAID },
    {
      kind: 'mindmap',
      title: 'Mapa',
      content: '# service\n- validate\n- store',
    },
    {
      kind: 'html',
      title: 'Antes/depois',
      content:
        '<table><tr><th>entra</th><th>sai</th></tr><tr><td>x</td><td>y</td></tr></table>',
    },
  ],
  files: ['src/notes/service.ts:12'],
  ...over,
});

const deepTour = (): CodeTour => ({
  topic: 'camada de serviço',
  goal: 'Centraliza regras antes do store, por isso importa.',
  slides: [slide()],
  flows: [{
    label: 'handler → service → store',
    file: 'src/notes/service.ts:12',
    detail:
      'O handler extrai o corpo e delega; o service valida e normaliza antes de persistir para evitar dado sujo no KV.',
  }],
  contracts: [],
  keyFiles: ['src/notes/service.ts:1'],
  pitfalls: ['pular validação no handler e duplicar regra'],
  nextSteps: ['ler src/notes/service.ts'],
});

const ctxOf = (paths: string[] = ['src/notes/service.ts']) => ({
  depth: 'repasse' as const,
  paths: new Set(paths),
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

Deno.test('protocolo lista tools e linguagem simples', () => {
  const pack: StructurePack = {
    root: '/tmp/p',
    query: 'auth',
    scannedAt: new Date().toISOString(),
    files: [],
    order: [],
    truncated: false,
  };
  const p = buildCodetourPrompt('/tmp/p', 'auth', 'repasse', pack);
  assert(p.includes('mermaid') && p.includes('mindmap') && p.includes('html'));
  assert(p.includes('check'));
  assert(p.includes('narration'));
  assert(buildAgentPrompt('/tmp/p', 'x', 'deep').includes('TODAS as tools'));
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

Deno.test('parse exige as três tools no tour', () => {
  const t = deepTour();
  const onlyMermaid = {
    ...t,
    slides: [
      slide({ visuals: [{ kind: 'mermaid', title: 'F', content: MERMAID }] }),
    ],
  };
  const r = parseCodeTour(onlyMermaid, ctxOf());
  assert('error' in r && r.error.includes('mindmap'));
});

Deno.test('parse rejeita html com script', () => {
  const t = deepTour();
  const evil = {
    ...t,
    slides: [slide({
      visuals: [
        { kind: 'mermaid', title: 'F', content: MERMAID },
        {
          kind: 'mindmap',
          title: 'M',
          content: '# tópico\n- item um\n- item dois',
        },
        {
          kind: 'html',
          title: 'H',
          content: '<div onclick="x()">oi</div><script>alert(1)</script>',
        },
      ],
    })],
  };
  const r = parseCodeTour(evil, ctxOf());
  assert('error' in r && r.error.includes('script'));
});

Deno.test('parse exige check por slide', () => {
  const t = deepTour();
  const noCheck = { ...t, slides: [slide({ check: '' })] };
  assert('error' in parseCodeTour(noCheck, ctxOf()));
});

Deno.test('parse exige narration por slide', () => {
  const t = deepTour();
  const noNarr = { ...t, slides: [slide({ narration: '' })] };
  const r = parseCodeTour(noNarr, ctxOf());
  assert('error' in r && r.error.includes('narration'));
});

Deno.test('parse rejeita narration com código', () => {
  const t = deepTour();
  const evil = { ...t, slides: [slide({ narration: '```code``` fala isso' })] };
  assert('error' in parseCodeTour(evil, ctxOf()));
});

Deno.test('parse aceita tour v5 completo', () => {
  const r = parseCodeTour(deepTour(), ctxOf());
  assert(!('error' in r));
  clearSession();
  openSession('/tmp/a', 'camada de serviço', 'repasse');
  if (!('error' in r)) attachTour(r.tour);
  assertEquals(getSession()?.tour?.slides[0].visuals.length, 3);
  clearSession();
});
