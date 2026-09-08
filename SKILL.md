---
name: docmap
version: 11.0.0
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

# docmap — Headless API

Base URL: `http://127.0.0.1:3334`

O docmap expõe uma Headless API local para agentes externos operarem notas,
tasks, workflows, macros, podcasts, mocks, canvas e demais recursos sem depender
da UI.

Antes de agir, descubra as capacidades atuais:

```bash
curl http://127.0.0.1:3334/headless/capabilities
```

Para carregar instruções completas:

```bash
curl http://127.0.0.1:3334/headless/manual
```

Para reduzir contexto, busque apenas a funcionalidade necessária:

```bash
curl 'http://127.0.0.1:3334/headless/manual?feature=workflows&role=executor'
curl 'http://127.0.0.1:3334/headless/manual?feature=podcasts'
curl 'http://127.0.0.1:3334/headless/manual?feature=canvas'
```

Use `/skills` somente para skills salvas pelo usuário no docmap. As instruções
do próprio docmap vivem em `/headless/manual`.

