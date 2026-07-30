---
name: docmap
version: 7.0.0
description: >
  API REST local do docmap desktop — notas com mapa mental anotável, diagramas
  Mermaid, skills, macros, kanban de tasks, favoritos, podcasts com áudio por IA
  (2+ vozes) e slides visuais sincronizados, canvas realtime para IA desenhar
  HTML ao vivo, mocks HTTP e workflows para orquestrar agentes externos de
  diferentes ferramentas, providers e modelos.
  Use quando o usuário mencionar notas, diagramas, skills, macros, tasks,
  kanban, agentes, orquestração, workflows, favoritos, podcasts, slides, mocks,
  canvas, canva, ou compartilhar um ID/link do docmap. O app precisa estar rodando.
metadata:
  category: productivity
  tags: [notes, diagrams, skills, tasks, agents, orchestration, workflows, podcasts, mocks, canvas, knowledge-base]
---

# docmap — API local (para IA)

Base URL: `http://127.0.0.1:3334`
Formato: JSON. App precisa estar rodando.

> **Tags = tema.** Notas, tarefas, workflows, diagramas, macros, podcasts e favoritos
> aceitam `tags?: string[]` (opcional) — o ASSUNTO da entidade, eixo pelo qual
> o docmap conecta itens do mesmo tema. São normalizadas ao salvar: minúsculas,
> sem acento, slug ("Machine Learning" → `machine-learning`; "Programação" →
> `programacao`). Reaproveite tags existentes em vez de criar variações.

> **Instrução especial — podcasts com slides:** quando o usuário pedir para
> gerar um podcast "com slides", "com apresentação visual", "com slides
> sincronizados" ou qualquer variação, você DEVE enviar `"withSlides": true`
> no body do `POST /podcasts`. Sem esse campo, o docmap gera apenas o áudio.

---

## Grafo de conhecimento

- `GET /graph` — grafo de TODAS as entidades do docmap (notas, tasks, diagramas,
  macros, podcasts, favoritos, skills, mocks, workflows) conectadas por TEMA. Read-only; reflete o
  estado atual do KV.
  - `nodes`: `{ id, label, kind }` — `id` = `"<tipo>:<uuid>"` (entidade) ou
    `"tag:<slug>"` (tag). `kind` = `note|task|diagram|macro|podcast|favorite|skill|mock|workflow|tag`.
  - `links`: `{ source, target, kind }` — `kind` = `tagged` (entidade→tag) ou
    `reference` (task→nota via `noteId`).
  - Cada tag é um NÓ próprio: entidades do mesmo tema ligam-se à mesma tag. Por
    isso vale usar tags consistentes — são o que conecta o grafo.

## Workspace (arquivos `.md`)

Estes endpoints leem a pasta de trabalho que o usuário abriu no docmap.
Retornam erro se nenhum workspace estiver selecionado.

- `GET /content?file=<caminho/relativo.md>` — conteúdo bruto do arquivo
  - Resposta: `{ path, raw }` com markdown completo
- `GET /docs/search?q=termo` — busca full-text nos `.md` do workspace
  - Resposta: array de `{ file, line, heading, snippet }`

> Se o usuário pedir para alterar um arquivo, você já tem o caminho relativo nos endpoints acima. A edição em si deve ser feita pelo canal de escrita que o usuário indicar (o docmap não expõe escrita de arquivos por esta API).

---

## Notas (knowledge base global)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/notes` | Lista (id, title, tags, category, preview) |
| GET | `/notes/:id` | Nota completa com `content` em markdown |
| POST | `/notes` | Cria `{ title, content, tags?, category? }` |
| PUT | `/notes/:id` | Edita (campos parciais) |
| DELETE | `/notes/:id` | Remove |
| GET | `/search?q=termo` | Busca full-text nas notas |

Categoria: texto livre (`general`, `ai`, etc.).

---

## Diagramas Mermaid

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/diagrams` | Lista (id, title, tags, preview) |
| GET | `/diagrams/:id` | Diagrama completo + `deepLink` |
| POST | `/diagrams` | Cria `{ title, source, tags? }` |
| PUT | `/diagrams/:id` | Edita |
| DELETE | `/diagrams/:id` | Remove |

**Deep link**: `GET /diagrams/:id` retorna `{ deepLink: "http://127.0.0.1:3333/#diagram/<id>" }`.  
Mande o `deepLink` ao usuário para abrir direto no app.

Tipos Mermaid: `flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`, `erDiagram`, `gantt`, `pie`, `gitGraph`.

---

## Skills (read-only)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/skills` | Lista (id, name, title, description, tags) |
| GET | `/skills/:nameOrId` | Skill completa com `content` em markdown |

`name` é o slug legível (ex: `analyze-pr`). Acesse por nome ou UUID.

---

## Macros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/macros` | Lista macros (id, name, title, description, interpreter, tags) |
| GET | `/macros/:id` | Macro completa com `script` e `interpreter` |
| POST | `/macros` | Cria `{ name, title, description?, script, tags? }` |
| PUT | `/macros/:id` | Edita (campos parciais) |

O `interpreter` (`bash` ou `deno`) é detectado automaticamente pelo shebang.
Execução continua sendo manual pelo usuário dentro do app.

---

## Workflows — orquestração de agentes externos

Workflows são apartados das tasks do Kanban. O Docmap **não chama CLIs nem
LLMs** neste módulo: Claude Code, Codex, opencode e o próprio orquestrador são
agentes externos iniciados manualmente. A API apenas coordena estado,
dependências, claims, conflitos, eventos e histórico.

### Regra fundamental

O executor nunca marca um nó como concluído. Ele envia
`POST /workflows/nodes/:id/return`, que deixa o nó em `returned`. O usuário
também pode registrar manualmente "fiz isso" pela UI ou por
`POST /workflows/nodes/:id/human-return`; isso cria uma execução humana
rastreável e também deixa o nó em `returned`. O orquestrador descobre o
retorno pela inbox persistida e decide se aprova, solicita retrabalho, expande
o fluxo ou pede intervenção humana.

### Papel estrito do orquestrador

O orquestrador **não executa trabalho de nó**. Ele não altera arquivos, não roda
testes, não implementa código, não cria branch/worktree, não faz commits e não
deve chamar endpoints de execução de nó como `/workflows/nodes/:id/claim`,
`/start` ou `/return`. O papel dele é somente:

- decompor o objetivo em nós;
- criar dependências e escopos;
- recomendar ferramenta/provider/modelo e complexidade;
- responder perguntas dos executores;
- revisar retornos `returned` e decidir `approve | rework | expand |
  human_intervention | cancel`;
- concluir o workflow quando a inbox indicar que ele está concluível.

Para saber se uma tarefa terminou, o orquestrador deve consultar
`GET /orchestrator/inbox?agentSessionId=...`. O ciclo operacional é:

1. enviar `POST /agents/:agentSessionId/heartbeat`;
2. consultar a inbox;
3. processar todos os itens `planning`, `returned`, `questions` e
   `completable`;
4. se não houver ação, aguardar o `pollAfterSeconds` retornado pela inbox
   (padrão: 180 segundos) e consultar novamente.

O orquestrador não deve dizer apenas "vou verificar depois" e parar; ele precisa
manter essa cadência enquanto estiver conectado.

### Conectar um agente

```http
POST /agents/connect
Content-Type: application/json

{
  "name": "codex-backend-1",
  "tool": "codex-cli",
  "provider": "openai",
  "model": "gpt-5-codex",
  "role": "executor",
  "capabilities": ["code", "deno", "tests"]
}
```

Guarde o `agentSessionId` retornado. Durante trabalhos longos, envie
`POST /agents/:agentSessionId/heartbeat`. A interface mostra nome,
ferramenta, provider, modelo, papel, presença e nó atual.

### Endpoints de agentes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/agents` | Sessões e presença dos agentes |
| POST | `/agents/connect` | Conecta e declara identidade |
| POST | `/agents/:id/heartbeat` | Mantém a sessão ativa |
| GET | `/agents/:id/inbox` | Trabalho, perguntas e respostas da sessão |
| POST | `/agents/:id/disconnect` | Encerra sessão sem trabalho ativo |
| GET | `/orchestrator/inbox?agentSessionId=...` | Planejamentos, retornos, perguntas e workflows concluíveis |

### Endpoints de workflows

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/workflows` | Lista demandas e contagens por estado |
| POST | `/workflows` | Cria `{ title, objective, description?, tags?, conflictPolicy?, defaultMaxAttempts? }` |
| GET | `/workflows/:id` | Workflow, nós, arestas, runs, perguntas e agentes |
| PUT | `/workflows/:id` | Edita metadados |
| DELETE | `/workflows/:id` | Remove workflow e histórico |
| POST | `/workflows/:id/claim-orchestration` | Orquestrador assume o workflow |
| POST | `/workflows/:id/release-orchestration` | Libera o orquestrador |
| POST | `/workflows/:id/start` | Inicia e libera nós sem bloqueios |
| POST | `/workflows/:id/complete` | Conclusão explícita quando `canComplete=true` |
| GET | `/workflows/:id/events` | Event log persistido |
| GET | `/workflows/events` | SSE de atualizações em tempo real |
| GET | `/workflows/:id/prompt?role=orchestrator|executor` | Prompt sincronizado com a API |

### Nós e dependências

```http
POST /workflows/:workflowId/nodes
Content-Type: application/json

{
  "title": "Implementar store",
  "description": "Criar persistência e regras determinísticas",
  "acceptanceCriteria": ["check passa", "claim é atômico"],
  "contextRefs": [{"kind": "file", "ref": "src/tasks/store.ts"}],
  "complexity": "m",
  "kind": "code",
  "requiredCapabilities": ["deno", "tests"],
  "recommendedAgent": {
    "tool": "codex-cli",
    "provider": "openai",
    "model": "gpt-5-codex"
  },
  "readScopes": ["src/tasks/"],
  "writeScopes": ["src/workflows/"],
  "isolation": "worktree",
  "maxAttempts": 3,
  "dependsOn": ["<node-id>"]
}
```

Complexidade: `xs | s | m | l | xl`. Isolamento:
`shared | branch | worktree`. O agente externo cria a branch/worktree; o
Docmap apenas registra e valida o contrato.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/workflows/available?agentSessionId=...&workflowId=...` | Nós prontos compatíveis com capacidades |
| POST | `/workflows/:id/nodes` | Cria nó |
| POST | `/workflows/:id/edges` | Cria `{ fromNodeId, toNodeId, kind }` |
| GET | `/workflows/nodes/:id` | Pacote completo + dependências aprovadas |
| GET | `/workflows/nodes/:id/prompt` | Prompt específico copiável |
| POST | `/workflows/nodes/:id/claim` | Claim atômico `{ agentSessionId }` |
| POST | `/workflows/nodes/:id/start` | Inicia e registra ambiente/worktree |
| POST | `/workflows/nodes/:id/questions` | Registra dúvida sem falhar |
| POST | `/workflows/questions/:id/answer` | Orquestrador/humano responde |
| POST | `/workflows/nodes/:id/return` | Executor devolve resultado |
| POST | `/workflows/nodes/:id/human-return` | Usuário registra execução manual e envia para revisão |
| POST | `/workflows/nodes/:id/decision` | Revisa o retorno |
| POST | `/workflows/nodes/:id/release` | Abandona tentativa e libera nó |

### Retorno estruturado

```json
{
  "agentSessionId": "...",
  "outcome": "success",
  "summary": "Implementação concluída",
  "result": "Decisões e detalhes para o orquestrador",
  "logs": ["deno task check: ok"],
  "changedFiles": ["src/workflows/store.ts"],
  "diff": "...",
  "tests": [{"command": "deno task check", "status": "passed"}],
  "artifacts": []
}
```

`outcome`: `success | partial | failed | blocked | needs_input`.

### Retorno humano

`POST /workflows/nodes/:id/human-return` usa o mesmo contrato de evidências do
retorno estruturado, mas não exige `agentSessionId`. O Docmap cria uma sessão
sintética `docmap-ui · human · manual`, registra uma tentativa e move o nó para
`returned`. O orquestrador continua sendo responsável por revisar e decidir.

### Revisão

```json
POST /workflows/nodes/:id/decision
{
  "agentSessionId": "<sessão do orquestrador>",
  "decision": "approve",
  "feedback": "Critérios atendidos"
}
```

`decision`: `approve | rework | expand | human_intervention | cancel`.
Em `expand`, envie também `newNodes`; os novos nós dependerão do nó revisado.
Ao esgotar `maxAttempts`, retrabalho vira `human_intervention`.

### Prompts prontos

- `GET /workflows/prompts/connect?role=orchestrator|executor|reviewer`
- `GET /workflows/:id/prompt?role=orchestrator|executor|reviewer`
- `GET /workflows/nodes/:id/prompt`

---

## Tasks — Kanban global

Colunas fixas: `todo` (A Fazer) · `in-progress` (Em Andamento) · `done` (Concluído).  
Ordem dentro da coluna = prioridade (menor `order` = mais prioritário).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tasks` | Lista todas as tasks |
| GET | `/tasks/:id` | Task completa + `deepLink` |
| POST | `/tasks` | Cria `{ title, description?, status?, dueDate?, noteId?, tags? }` |
| PUT | `/tasks/:id` | Edita campos (parcial). `dueDate: null` e `noteId: null` removem o campo |
| DELETE | `/tasks/:id` | Remove |
| PUT | `/tasks/reorder` | Reordena coluna: `{ status, ids: string[] }` |

**Campos:**
- `title` (string, obrigatório)
- `description` (markdown, opcional)
- `status`: `"todo"` | `"in-progress"` | `"done"`
- `order` (número, definido automaticamente na criação)
- `dueDate` (YYYY-MM-DD, opcional)
- `noteId` (UUID de uma nota vinculada, opcional)
- `tags` (array de strings, opcional) — tema/assunto da task

**Deep link**: `GET /tasks/:id` retorna `{ deepLink: "http://127.0.0.1:3333/#task/<id>" }`.

---

## Podcasts — áudio gerado por IA (2+ vozes) + slides visuais opcionais

Gera podcasts em áudio a partir de conteúdo de estudo. Sempre com **2+ personas**
com vozes distintas. A geração é **assíncrona**: o POST retorna 202 imediatamente
e o áudio fica pronto segundos/minutos depois (status `generating` → `ready`).

Opcionalmente, o podcast pode ter **slides visuais sincronizados com o áudio**
(CSS art puro, sem JavaScript). A UI troca os slides sozinha conforme o áudio toca.

### ⚡ Quick start — gerar podcast com slides

```bash
curl -X POST http://127.0.0.1:3334/podcasts \
  -H 'Content-Type: application/json' -d '{
    "title": "Buracos negros",
    "folder": "cosmos",
    "withSlides": true,
    "content": "<cole aqui o texto/artigo de estudo>"
  }'
# → 202 { "id": "...", "deepLink": "...", "status": "generating" }
# O docmap gera diálogo + slides via LLM e depois o áudio.
```

> **ATENÇÃO:** `withSlides: true` é **obrigatório** para ter slides. Sem esse
> campo, o docmap gera apenas o áudio comum. A palavra-chave do campo é
> exatamente `withSlides` (camelCase), não `slides`, não `hasSlides`.

Pré-requisitos na máquina: `edge-tts` (pip) e `ffmpeg` (brew install ffmpeg).

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/podcasts/health` | Verifica dependências (edge-tts, ffmpeg, ffprobe) |
| GET | `/podcasts?q=&folder=` | Lista previews (sem script) |
| GET | `/podcasts/:id` | Podcast completo com `script`, `slideMap` + `deepLink` |
| GET | `/podcasts/:id/audio` | Stream MP3 com suporte a Range |
| GET | `/podcasts/:id/slides` | Documento HTML único com todos os slides (se `withSlides`) |
| GET | `/podcasts/voices` | Vozes pt-BR disponíveis (id, gender, style) |
| GET | `/podcasts/folders` | Pastas derivadas dos podcasts existentes |
| POST | `/podcasts` | Gera podcast (assíncrono — retorna 202) |
| PUT | `/podcasts/:id` | Edita `title`, `folder` e/ou `tags` |
| DELETE | `/podcasts/:id` | Remove metadados + áudio + slides |

### POST /podcasts — body

- `title` (obrigatório)
- `content` **ou** `script` (obrigatório um dos dois):
  - `content`: texto bruto → o docmap gera o roteiro via provider configurado
  - `script`: roteiro pronto com tags `<Person1>…</Person1>` → só sintetiza o áudio
- `voices` (opcional): array de `{ name, voice }` — mínimo 2, vozes distintas.
  Omitido → o docmap sorteia 2 vozes. Use `GET /podcasts/voices` pra escolher.
- `folder` (opcional, default "geral")
- `tags` (opcional): array de temas/assuntos do podcast (eixo do grafo)
- `withSlides` (opcional, default `false`): se `true`, o docmap gera slides
  visuais sincronizados com o áudio. Aplica-se a qualquer modo:
  - com `content`: o docmap gera diálogo + slides via LLM
  - com `script`: o script precisa conter blocos `<Slide>` (e opcionalmente
    manifesto `<Slides>` embutido) — senão o docmap falha gracioso sem slides
  - com `script` + `slides[]`: você envia tudo pronto, o docmap só sintetiza
- `slides` (opcional): array de slides prontos `{ index, title, transition?, html, css }`.
  Ignorado se `withSlides` for falso/ausente. Exige `script` com blocos `<Slide>`
  casando os mesmos índices (mapeamento de sincronização vem do script).
- Retorna **202** com `{ id, deepLink, status: "generating" }`

### Formato do roteiro (campo `script`)

**Sem slides (formato clássico):**

Use as tags `<NomeDaPersona>…</NomeDaPersona>`. Cada nome deve ter uma voz em `voices`.

**Com slides (`withSlides: true`):**

Cerque blocos de falas com `<Slide title="…" transition="…">…</Slide>`. Cada `<Slide>`
agrupa 1+ turnos relacionados ao mesmo tema visual. Nenhuma fala pode ficar de fora
de um `<Slide>`. A LLM decide a quebra — pode ter 1 slide para 1 turno ou 1 slide
para N turnos. A sincronização é automática: cada slide aparece quando o áudio chega
na primeira fala do bloco.

```bash
curl -X POST http://127.0.0.1:3334/podcasts \
  -H 'Content-Type: application/json' -d '{
    "title": "Buracos negros",
    "folder": "cosmos",
    "withSlides": true,
    "content": "<cole aqui o texto/artigo>"
  }'
# → 202 { "id": "...", "deepLink": "...", "status": "generating" }
# docmap gera diálogo com <Slide> + manifesto visual numa única chamada de LLM.
```

### Enviar roteiro pronto com slides (`script` + `withSlides`)

O script precisa ter `<Slide>` blocos cercando as falas. Pode opcionalmente trazer
um bloco `<Slides>` no fim com HTML/CSS de cada slide — se não vier, o docmap
escreve um manifesto vazio e o podcast fica pronto **sem** slides visuais (só roteiro).

```bash
curl -X POST http://127.0.0.1:3334/podcasts \
  -H 'Content-Type: application/json' -d '{
    "title": "Redes neurais — introdução",
    "folder": "IA",
    "withSlides": true,
    "voices": [
      { "name": "Ana", "voice": "pt-BR-FranciscaNeural" },
      { "name": "Bruno", "voice": "pt-BR-AntonioNeural" }
    ],
    "script": "<Slide title=\"Introdução\" transition=\"fade-zoom\">\n  <Ana>Olá! Hoje vamos falar de redes neurais.</Ana>\n  <Bruno>Boa! Começa explicando.</Bruno>\n</Slide>\n<Slide title=\"O que são\" transition=\"slide-left\">\n  <Ana>São modelos inspirados no cérebro…</Ana>\n</Slide>\n<Slides>\n  <Slide index=\"1\" title=\"Introdução\" transition=\"fade-zoom\">\n    <HTML>...markup sem <html>/<body>...</HTML>\n    <CSS>...CSS escopado por .slide-1...</CSS>\n  </Slide>\n  <Slide index=\"2\" title=\"O que são\" transition=\"slide-left\">\n    <HTML>...</HTML><CSS>...</CSS>\n  </Slide>\n</Slides>"
  }'
```

### Enviar slides prontos (`script` + `slides[]` + `withSlides`)

Quando você (ou outra LLM externa) já tem os slides HTML/CSS prontos, passe-os
como array. O script precisa dos `<Slide>` blocos para mapear sincronização,
mas o bloco `<Slides>` manifesto é ignorado — o que vale é `slides[]`.

```bash
curl -X POST http://127.0.0.1:3334/podcasts \
  -H 'Content-Type: application/json' -d '{
    "title": "...",
    "withSlides": true,
    "script": "<Slide title=\"Intro\">...</Slide><Slide title=\"Meio\">...</Slide>",
    "slides": [
      {
        "index": 1,
        "title": "Intro",
        "transition": "fade-zoom",
        "html": "<h1>Bem-vindos</h1>",
        "css": ".slide-1 { background: radial-gradient(...); } .slide-1 h1 { color: white; }"
      },
      {
        "index": 2,
        "title": "Meio",
        "html": "...",
        "css": "..."
      }
    ]
  }'
```

### ❌ Erros comuns ao gerar slides

1. **Esquecer `withSlides: true`** — sem isso, o docmap nunca gera slides.
2. **Roteiro sem blocos `<Slide>`** — quando você envia `script` pronto, ele
   precisa cercar as falas com `<Slide title="...">...</Slide>`. Caso contrário
   não há mapeamento de sincronização.
3. **CSS sem escopo `.slide-N`** — o CSS de cada slide deve usar seletores
   como `.slide-1 h1`, `.slide-2 .grid`. CSS global vaza nos outros slides.
4. **Slides sem conteúdo visual** — o campo `html` vazio gera slide preto.
   A LLM precisa gerar markup + CSS art de verdade.

### Especificação dos slides prontos (campo `slides[]`)

Cada slide é um objeto:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `index` | number (1-based) | Casa com a ordem dos `<Slide>` no script |
| `title` | string | Acessibilidade + label na barra inferior |
| `transition` | string (opcional) | Dica semântica: `fade-zoom`, `slide-left`, `flip`, `iris`, etc. O efeito real vem do CSS que você escreve |
| `html` | string | Markup puro **sem** `<html>/<body>/<head>`. Sem `<script>`, sem `<iframe>`, sem `<img>` externa |
| `css` | string | CSS art puro, **escopado por `.slide-N`** (onde N é o índice). Animações de entrada via `[data-state="entering"]`, permanência via `[data-state="active"]`, saída via `[data-state="leaving"]` |

**Regras do CSS:**
- ESCOPO todo seletor com `.slide-N` (ex.: `.slide-1 h1 { ... }`)
- Sem JavaScript, sem `@font-face`, sem `@import`, sem URLs externas
- Use system fonts: `system-ui`, `sans-serif`, `monospace`, `serif`
- Animações via `@keyframes` + `[data-state]` selectors (o docmap aplica os atributos)
- O container do slide ocupa 100% do espaço disponível — preencha tudo

**Deep link**: `GET /podcasts/:id` retorna `{ deepLink: "http://127.0.0.1:3333/#podcast/<id>" }`.

---

## Mocks — Servidor HTTP em :3335

O docmap sobe um servidor de mocks em `http://127.0.0.1:3335`.
Cada mock tem um script JS executado a cada request. Os scripts recebem
`ctx` (request) e `db` (banco in-memory da collection) e devem retornar
`{ status?, headers?, body? }`.

### Protocolo para agentes — siga esta ordem

**Passo 1 — Descubra o estado atual (sempre, antes de criar qualquer coisa)**
```bash
curl http://127.0.0.1:3334/mocks/collections  # collections existentes
curl http://127.0.0.1:3334/mocks              # todos os mocks existentes
```

**Passo 2 — Crie a collection se não existir**
```bash
curl -X POST http://127.0.0.1:3334/mocks/collections \
  -H 'Content-Type: application/json' -d '{"name":"Minha API"}'
# guarde o id retornado
```

**Passo 3 — Crie os mocks**
Use `db` para mocks que precisam compartilhar estado (ex.: POST cria, GET lê).
Use dados hardcoded para mocks simples e estáticos.

**Passo 4 — Valide**
```bash
curl http://127.0.0.1:3335/seu-path
```

**Regras:**
- Nunca crie uma collection duplicada — verifique no passo 1
- Prefira `group` para organizar mocks do mesmo recurso (ex.: `"group": "Users"`)
- Scripts com lógica condicional (404, validação) são muito melhores que retornos estáticos
- Use `db` sempre que um mock precisar ler dados que outro escreveu

### Gerenciamento de Collections (via AI API :3334)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/mocks/collections` | Lista collections |
| GET | `/mocks/collections/:id` | Collection + seus mocks |
| POST | `/mocks/collections` | Cria `{ name }` |
| PUT | `/mocks/collections/:id` | Renomeia `{ name }` |
| DELETE | `/mocks/collections/:id` | Remove collection + todos os mocks |
| DELETE | `/mocks/collections/:id/clear` | Zera mocks, mantém a collection |
| DELETE | `/mocks/clear` | Apaga **tudo** (todas collections + mocks) |

### Gerenciamento de Mocks (via AI API :3334)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/mocks` | Lista todos (ou `?collectionId=<id>`) |
| GET | `/mocks/:id` | Mock completo |
| POST | `/mocks` | Cria (veja body abaixo) |
| PUT | `/mocks/:id` | Edita campos parciais |
| DELETE | `/mocks/:id` | Remove |

**POST /mocks — body:**
```json
{
  "collectionId": "<uuid>",
  "method": "GET",
  "path": "/users/:id",
  "name": "Get user by ID",
  "group": "Users",
  "script": "return { status: 200, body: { id: ctx.params.id, name: 'Alice' } };"
}
```

**Campos:** `method` (GET\|POST\|PUT\|PATCH\|DELETE\|HEAD\|OPTIONS), `path` (com params tipo `/users/:id`), `name` (opcional), `group` (opcional), `script` (corpo de função JS que recebe `ctx` e retorna a resposta).

**Validação de duplicidade:** dentro de uma mesma collection, não é permitido ter dois mocks com o mesmo `method` + `path`. `POST /mocks` e `PUT /mocks/:id` retornam `409 Conflict` se o endpoint já existir.

### Script do mock

O script recebe **dois argumentos**: `ctx` (request) e `db` (banco in-memory da collection).

**`ctx`**: `{ method, path, params, query, headers, body }`

**`db`** — store in-memory compartilhado por todos os mocks da mesma collection:
- `db.set(key, value)`, `db.get(key)`, `db.delete(key)`, `db.has(key)`
- `db.list(prefix)` — array de todos os valores cujas chaves começam com `prefix`
- `db.keys(prefix)`, `db.clear()`, `db.size()`

Exemplo — CRUD real entre mocks:
```js
// POST /users — cria e persiste
const user = { id: String(db.size() + 1), ...ctx.body };
db.set('user:' + user.id, user);
return { status: 201, body: user };

// GET /users/:id — lê do db
const user = db.get('user:' + ctx.params.id);
if (!user) return { status: 404, body: { error: 'not_found' } };
return { status: 200, body: user };
```

Suporta async/await.

---

## Favoritos

Tipos: `site` · `slack` · `grid` · `dash` · `github`.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/favorites` | Lista com busca e filtros (ver query params abaixo) |
| GET | `/favorites/:id` | Favorito completo |
| POST | `/favorites` | Cria `{ type, title, url, category, tags?, note? }` |
| PUT | `/favorites/:id` | Edita campos parciais |
| PUT | `/favorites/:id/access` | Registra acesso (incrementa `accessCount`) |
| DELETE | `/favorites/:id` | Remove |

**Query params de busca (`GET /favorites`):**

- `q=<texto>` — busca livre em `title`, `url`, `note`, `category` e `tags`
- `type=<tipo>` — filtra por tipo; pode repetir (`type=site&type=github`)
- `category=<texto>` — filtra por categoria (substring, case-insensitive)
- `tag=<tag>` — filtra por tag; pode repetir (`tag=produto&tag=api`) — exige todas as tags informadas
- `sortBy=accessCount|createdAt|lastAccessed|title` — ordenação (padrão: `accessCount`)
- `order=asc|desc` — direção (padrão: `desc`)

**Campos:**
- `type` (obrigatório): `"site"` | `"slack"` | `"grid"` | `"dash"` | `"github"`
- `title` (obrigatório)
- `url` (obrigatório)
- `category` (obrigatório)
- `tags` (array de strings, opcional)
- `note` (markdown/texto, opcional)
- `accessCount` (número, gerenciado automaticamente)
- `lastAccessed` (ISO string, atualizado via `PUT /favorites/:id/access`)

**Fluxos comuns:**

```
# Buscar favoritos de produto
GET /favorites?category=produto&sortBy=accessCount&order=desc

# Buscar sites e dashboards sobre API
GET /favorites?q=api&type=site&type=dash

# Cadastrar novo favorito
POST /favorites { type: "site", title: "DocMap docs", url: "...", category: "docs", tags: ["produto"] }
```


---

## Canvas — tela realtime para IA desenhar HTML/CSS/JS ao vivo

O docmap tem uma tela de canvas onde **IAs externas podem desenhar HTML visual em tempo real**,
e o usuario ve o resultado instantaneamente. Util para prototipacao visual, diagramas
dinamicos, debugging front-end e conversas visuais entre humano e IA.

### Endpoints (porta :3333)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/canvas` | Abre a pagina standalone do canvas no navegador |
| GET | `/canvas/ws` | WebSocket para receber atualizacoes em tempo real |
| POST | `/canvas/push` | Envia HTML pro canvas (veja body abaixo) |
| POST | `/canvas/clear` | Limpa o canvas |
| POST | `/canvas/inspect` | Gera prompt estruturado para LLM a partir de elemento HTML + instrucao do usuario |
| POST | `/canvas/import-file` | Importa arquivo .html do filesystem e renderiza no canvas |

### POST /canvas/inspect — body

```json
{
  "element": {
    "tag": "button",
    "id": "submit-btn",
    "classes": ["primary", "large"],
    "attributes": { "data-testid": "submit", "type": "submit" },
    "textContent": "Enviar",
    "boundingRect": { "x": 100, "y": 200, "width": 120, "height": 40 }
  },
  "userText": "mudar a cor para azul e aumentar o padding"
}
```

Retorna `{ prompt, elementDescription }`. O prompt combina a identificacao do elemento
(seletor CSS, atributos, posicao, texto) com a instrucao do usuario, pronto para colar
numa LLM.

### POST /canvas/import-file — body

```json
{
  "filePath": "/caminho/absoluto/para/pagina.html"
}
```

Valida extensao (.html/.htm), tipo (arquivo regular), tamanho (ate 10MB por default,
configuravel via `DOCMAP_CANVAS_MAX_IMPORT_SIZE`). Retorna `{ success, path, fileSize, preview }`.
Util para arquivos HTML muito grandes que excederiam o limite do JSON via push.

### Modo inspecionar (UI)

O canvas tem um botao "Inspecionar" que ativa o modo de inspecao de elementos:
- Ao passar o mouse, um contorno roxo segue os elementos (hover highlight)
- Ao clicar, abre um modal com resumo do elemento + campo de texto
- O botao "Copiar prompt" gera o prompt via `POST /canvas/inspect` e copia pro clipboard

### POST /canvas/push — body

```json
{
  "html": "<h1>Ola</h1>",
  "type": "replace"
}
```

**Tipos de mensagem:**

| Type | Efeito |
|------|--------|
| `replace` | Substitui TODO o conteudo do canvas pelo HTML enviado |
| `append` | Adiciona o HTML ao final do conteudo existente |
| `css` | Injeta CSS (envolto em `<style>`) no canvas |
| `clear` | Limpa o canvas (ignora o campo `html`) |

### Quick start

```bash
# Abrir o canvas standalone
open http://127.0.0.1:3333/canvas

# Desenhar algo
curl -X POST http://127.0.0.1:3333/canvas/push \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Ola!</h1><style>body{background:#1a1a2e;color:#fff;display:grid;place-items:center;min-height:100vh;font-family:system-ui}</style>","type":"replace"}'

# Acrescentar conteudo
curl -X POST http://127.0.0.1:3333/canvas/push \
  -H "Content-Type: application/json" \
  -d '{"html":"<p>Mais conteudo</p>","type":"append"}'

# Limpar
curl -X POST http://127.0.0.1:3333/canvas/clear
```

### Seguranca

- HTML renderizado em **iframe sandbox="allow-scripts"** (sem allow-same-origin)
- O conteudo nao acessa cookies, localStorage ou DOM do docmap
- Servidor valida tipo da mensagem e estrutura do body
- Reconexao WebSocket com backoff exponencial e limite de 20 tentativas

### Acesso

- **Standalone**: http://127.0.0.1:3333/canvas
- **Rail do docmap**: botao "Canva" na barra lateral
- **URL direta**: qualquer navegador na rede local

---

## Debug Audit — log efemero para agentes

Buffer in-memory (sem persistencia) para IA/agentes instrumentarem codigo e
inspecionarem dados arbitrarios. Tudo expira em 20 minutos (TTL) e o buffer
global tem limite de 1000 entradas (ring buffer).

### Endpoints (porta :3334)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/debug` | Envia um payload de debug |
| GET | `/debug/:sessionId` | Lista entradas da sessao |

### POST /debug — body

```json
{
  "sessionId": "agent-123",
  "payload": { "qualquer": "json" }
}
```

Resposta **201**:

```json
{ "seq": 1, "ts": "HH:MM:SS.mmm" }
```

- `sessionId`: escolhido pelo agente/IA.
- `payload`: qualquer JSON, sem validacao.
- `seq`: numero global monotonico crescente, nunca reseta.
- `ts`: timestamp formatado como `HH:MM:SS.mmm`.

### GET /debug/:sessionId

Resposta: array de entradas ordenadas por `seq`:

```json
[
  { "seq": 1, "ts": "14:32:10.042", "sessionId": "agent-123", "payload": { ... } }
]
```

### UI

Abra pelo app no botao **Debug** do rail lateral. A pagina mostra:

- contagem de sessoes e entradas;
- cards de sessao com copiar/excluir;
- tabela de entradas com `seq`, `ts` e payload JSON formatado;
- atualizacao automatica a cada 2 segundos.

---


