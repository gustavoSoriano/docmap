// ════ Gerador da skill ════
// Gera o SKILL.md (raiz do projeto) e as skills globais dos agentes como um
// bootstrap curto para a Headless API. O manual completo vive no endpoint:
//   GET /headless/manual
//
// Rode após editar src/headless/manual.ts:
//   deno task gen-skill

import {
  HEADLESS_MANUAL_VERSION,
  headlessBootstrapMarkdown,
} from '../src/headless/manual.ts';

const VERSION = HEADLESS_MANUAL_VERSION;

const frontMatter = `---
name: docmap
version: ${VERSION}
description: >
  Bootstrap da Headless API local do docmap desktop. Use para descobrir as
  instruções atualizadas via GET /headless/capabilities e /headless/manual,
  incluindo notas, diagramas, skills de usuário, macros, tasks, workflows,
  podcasts, mocks, favoritos, canvas e debug.
  Use quando o usuário mencionar notas, diagramas, skills, macros, tasks,
  kanban, agentes, orquestração, workflows, favoritos, podcasts, slides, mocks,
  canvas, canva, ou compartilhar um ID/link do docmap. O app precisa estar rodando.
metadata:
  category: productivity
  tags: [notes, diagrams, skills, tasks, agents, orchestration, workflows, podcasts, mocks, canvas, knowledge-base]
---

`;

const doc = frontMatter + headlessBootstrapMarkdown() + '\n';

// 1) SKILL.md na raiz do projeto.
await Deno.writeTextFile(new URL('../SKILL.md', import.meta.url), doc);
console.log('✓ SKILL.md (raiz) gerado');

// 2) Skills globais das ferramentas conhecidas (se HOME existir).
const home = Deno.env.get('HOME');
if (home) {
  const dirs = [
    `${home}/.claude/skills/docmap`,
    `${home}/.codex/skills/docmap`,
    `${home}/.config/opencode/skills/docmap`,
  ];
  for (const dir of dirs) {
    await Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(`${dir}/SKILL.md`, doc);
    console.log(`✓ skill global gerada em ${dir}/SKILL.md`);
  }
} else {
  console.log('• HOME indefinido — skill global pulada');
}

console.log(`✓ skill v${VERSION} propagada`);
