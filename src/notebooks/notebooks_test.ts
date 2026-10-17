import {
  assert,
  assertEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  allowedVisualKinds,
  ARTIFACTS,
  isArtifact,
  normalizeArtifacts,
} from '../codetour/artifacts.ts';
import type { CodeReel } from '../codetour/types.ts';
import { parseScript, validateSegments } from '../podcasts/parser.ts';
import { buildNotebookPodcastScript } from './artifacts-podcast.ts';
import { isNotebookId } from './body-file.ts';
import { notebookTag } from './types.ts';

const reel = (): CodeReel => ({
  topic: 'serviço de notas',
  goal: 'Centraliza regras antes do store.',
  reels: [
    {
      id: 'r1',
      label: 'valida',
      title: 'O service barra título vazio antes de salvar',
      code: null,
      visual: null,
      rule: { file: null, text: 'Título vazio nunca chega ao store.' },
      sub: 'Sem essa barreira, dado sujo pararia no banco.',
      narration:
        'Olha esse service. Ele recebe o título, barra vazio e só aí salva no banco de dados.',
    },
  ],
});

Deno.test('artefatos: normaliza seleção e mapeia p/ kinds', () => {
  assertEquals(normalizeArtifacts(undefined).length, ARTIFACTS.length);
  assertEquals(normalizeArtifacts(['bubble', 'x', 'bubble']), ['bubble']);
  assertEquals(normalizeArtifacts([]), []);
  assert(!isArtifact('quiz') && isArtifact('bubble'));
  assertEquals(
    allowedVisualKinds(['diagrams', 'tables', 'bubble', 'mindmap']),
    [
      'mermaid',
      'mindmap',
      'html',
      'bubble',
    ],
  );
  assertEquals(allowedVisualKinds(['audio', 'podcast']), []);
});

Deno.test('roteiro do caderno vira diálogo válido p/ pipeline', () => {
  const script = buildNotebookPodcastScript(reel());
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
