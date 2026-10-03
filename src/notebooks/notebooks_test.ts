import {
  assert,
  assertEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  ARTIFACTS,
  isArtifact,
  kindsOf,
  normalizeArtifacts,
} from '../codetour/artifacts.ts';
import type { CodeTour } from '../codetour/types.ts';
import { parseScript, validateSegments } from '../podcasts/parser.ts';
import { buildNotebookPodcastScript } from './artifacts-podcast.ts';
import { isNotebookId } from './body-file.ts';
import { notebookTag } from './types.ts';

const tour = (): CodeTour => ({
  topic: 'serviço de notas',
  goal: 'Centraliza regras antes do store.',
  slides: [
    {
      id: 's1',
      title: 'Valida antes de salvar',
      bullets: ['barra título vazio'],
      explain:
        'O service recebe o título e barra vazio antes de salvar no store. Chega string vazia e explode com erro. Sem isso dado sujo pararia no banco de dados do aplicativo.',
      check: 'Onde um título vazio é barrado antes de salvar?',
      narration:
        'Olha esse service. Ele recebe o título, barra vazio e só aí salva no banco de dados.',
      snippet: null,
      visuals: [],
      files: [],
    },
  ],
  flows: [
    {
      label: 'handler → service',
      file: 'src/a.ts:1',
      detail: 'O handler delega ao service que valida.',
    },
    {
      label: 'service → store',
      file: 'src/b.ts:2',
      detail: 'O service normaliza e persiste no store.',
    },
  ],
  contracts: [],
  keyFiles: [],
  pitfalls: [],
  nextSteps: ['revisar amanhã'],
});

Deno.test('artefatos: normaliza seleção e mapeia p/ kinds', () => {
  assertEquals(normalizeArtifacts(undefined).length, ARTIFACTS.length);
  assertEquals(normalizeArtifacts(['bubble', 'x', 'bubble']), ['bubble']);
  assertEquals(normalizeArtifacts([]), []);
  assert(isArtifact('quiz') && !isArtifact('tour'));
  assertEquals(kindsOf(['diagrams', 'tables', 'bubble', 'mindmap']), [
    'mermaid',
    'mindmap',
    'html',
    'bubble',
  ]);
  assertEquals(kindsOf(['audio', 'podcast', 'quiz']), []);
});

Deno.test('roteiro do caderno vira diálogo válido p/ pipeline', () => {
  const script = buildNotebookPodcastScript(tour());
  assert(script.includes('<Guia>') && script.includes('<Explorador>'));
  const voices = [
    { name: 'Guia', voice: 'pt-BR-AntonioNeural' },
    { name: 'Explorador', voice: 'pt-BR-FranciscaNeural' },
  ];
  assertEquals(validateSegments(parseScript(script), voices), null);
});

Deno.test('tag do caderno é slug estável p/ grafo', () => {
  const id = crypto.randomUUID();
  assertEquals(notebookTag(id), `caderno-${id.slice(0, 8)}`);
  assert(/^caderno-[a-z0-9]{8}$/.test(notebookTag(id)));
});

Deno.test('id do caderno rejeita traversal', () => {
  assert(isNotebookId(crypto.randomUUID()));
  assert(!isNotebookId('../x'));
  assert(!isNotebookId(''));
});
