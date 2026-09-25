---
name: docmap
version: 13.2.0
description: >
  Bootstrap da Headless API local do docmap desktop. Use para descobrir as
  instruções atualizadas via GET /headless/capabilities e /headless/manual,
  incluindo notas, desenhos, skills de usuário, macros, tasks, trilhas,
  podcasts, mocks, favoritos, canvas e debug.
  Use quando o usuário mencionar notas, desenhos, diagramas, skills, macros, tasks,
  trilhas, fluxos, kanban, agentes, chats, favoritos, podcasts, slides, mocks,
  canvas, canva, ou compartilhar um ID/link do docmap. O app precisa estar rodando.
metadata:
  category: productivity
  tags: [notes, skills, tasks, trilhas, agents, chats, podcasts, mocks, canvas, knowledge-base]
---

# docmap — Headless API

Base URL: `http://127.0.0.1:3334`

O docmap expõe uma Headless API local para agentes externos operarem notas,
tasks, macros, podcasts, mocks, canvas e demais recursos sem depender
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
curl 'http://127.0.0.1:3334/headless/manual?feature=notes'
curl 'http://127.0.0.1:3334/headless/manual?feature=podcasts'
curl 'http://127.0.0.1:3334/headless/manual?feature=canvas'
```

Use `/skills` somente para skills salvas pelo usuário no docmap. As instruções
do próprio docmap vivem em `/headless/manual`.

