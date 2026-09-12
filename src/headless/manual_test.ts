import { headlessHandler } from './handler.ts';
import {
  headlessCapabilities,
  renderHeadlessManual,
  selectHeadlessFeatures,
} from './manual.ts';

const assert: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const request = (path: string): Response => {
  const url = new URL(`http://127.0.0.1:3334${path}`);
  return headlessHandler(new Request(url), url);
};

Deno.test('headless capabilities expose feature discovery', () => {
  const caps = headlessCapabilities();
  assert(caps.name === 'docmap-headless-api', 'nome incorreto');
  assert(
    caps.endpoints.manual === '/headless/manual',
    'manualUrl principal ausente',
  );
  assert(
    caps.filters.feature.includes('workflows'),
    'workflows deveria ser feature filtravel',
  );
});

Deno.test('headless manual can be filtered by feature', () => {
  const manual = renderHeadlessManual({ features: ['podcasts'] });
  assert(
    manual.includes('## Podcasts'),
    'manual filtrado deveria conter podcasts',
  );
  assert(
    !manual.includes('## Workflows'),
    'manual filtrado nao deveria conter workflows',
  );
});

Deno.test('macro manual documents collections and composed execution', () => {
  const manual = renderHeadlessManual({ features: ['macros'] });
  assert(
    manual.includes('/macros/collections'),
    'manual de macros deveria documentar collections',
  );
  assert(
    manual.includes('run_macro') && manual.includes('runMacro'),
    'manual de macros deveria documentar helpers de composição',
  );
  assert(
    manual.includes('inputLabel') && manual.includes('DOCMAP_INPUT'),
    'manual de macros deveria documentar parametro unico',
  );
  assert(
    manual.includes('macro_not_found'),
    'manual de macros deveria documentar erro de referência ausente',
  );
});

Deno.test('headless role selection resolves workflow protocol', () => {
  const selected = selectHeadlessFeatures({ role: 'executor' });
  assert(
    selected.map((feature) => feature.id).includes('workflows'),
    'executor deveria selecionar workflows',
  );
});

Deno.test('headless handler returns markdown by default', async () => {
  const res = request('/headless/manual?feature=canvas');
  assert(res.status === 200, 'status deveria ser 200');
  assert(
    res.headers.get('content-type')?.includes('text/markdown'),
    'content-type deveria ser markdown',
  );
  const body = await res.text();
  assert(body.includes('## Canvas'), 'body deveria conter canvas');
  assert(!body.includes('## Podcasts'), 'body nao deveria conter podcasts');
});

Deno.test('headless handler returns short bootstrap', async () => {
  const res = request('/headless/bootstrap');
  assert(res.status === 200, 'status deveria ser 200');
  const body = await res.text();
  assert(
    body.includes('/headless/capabilities'),
    'bootstrap deveria apontar capabilities',
  );
  assert(
    !body.includes('## Workflows'),
    'bootstrap nao deveria incluir manual completo',
  );
});

Deno.test('headless handler returns json when requested', async () => {
  const res = request('/headless/manual?feature=workflows&format=json');
  const body = await res.json();
  assert(res.status === 200, 'status deveria ser 200');
  assert(
    body.selectedFeatures.includes('workflows'),
    'json deveria listar feature selecionada',
  );
  assert(
    body.markdown.includes('## Workflows'),
    'json deveria incluir markdown renderizado',
  );
});
