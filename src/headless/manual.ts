// ════ Headless API — manual para agentes externos ════
// Fonte canônica das instruções que Claude Code, Codex, opencode e outros
// agentes usam para operar o docmap pela API local sem depender da UI.
export const HEADLESS_MANUAL_VERSION = '13.2.0';

export type HeadlessManualRole = 'orchestrator' | 'executor' | 'reviewer';

export type HeadlessManualFeature = {
  readonly id: string;
  readonly title: string;
  readonly heading: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly roles?: readonly HeadlessManualRole[];
};

export const HEADLESS_ROLES: readonly HeadlessManualRole[] = [
  'orchestrator',
  'executor',
  'reviewer',
];

export type HeadlessManualOptions = {
  readonly features?: readonly string[];
  readonly role?: string | null;
};

export const HEADLESS_FEATURES: readonly HeadlessManualFeature[] = [
  {
    id: 'graph',
    title: 'Grafo de conhecimento',
    heading: 'Grafo de conhecimento',
    summary: 'Grafo read-only de entidades conectadas por tags/tema.',
    tags: ['graph', 'knowledge-base', 'tags'],
  },
  {
    id: 'notes',
    title: 'Notas',
    heading: 'Notas (knowledge base global)',
    summary: 'CRUD de notas globais em markdown.',
    tags: ['notes', 'knowledge-base'],
  },
  {
    id: 'skills',
    title: 'Skills de usuario',
    heading: 'Skills',
    summary: 'CRUD parcial de skills salvas pelo usuario no KV.',
    tags: ['skills', 'user-content'],
  },
  {
    id: 'macros',
    title: 'Macros',
    heading: 'Macros',
    summary:
      'Macros bash/deno organizadas em collections e com composição entre macros.',
    tags: ['macros', 'automation'],
  },
  {
    id: 'agentchats',
    title: 'Chats entre agentes',
    heading: 'Chats — conversa realtime entre agentes',
    summary: 'Salas de chat com inbox bloqueante para agentes se organizarem.',
    tags: ['agentchats', 'agents', 'chat', 'realtime'],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    heading: 'Tasks — Kanban global',
    summary: 'Kanban global com todo, in-progress, review e done.',
    tags: ['tasks', 'kanban'],
  },
  {
    id: 'trilhas',
    title: 'Trilhas',
    heading: 'Trilhas — objetivo visual editável (humano + IA)',
    summary: 'Fluxograma de blocos com detalhes, status, responsável e tags.',
    tags: ['trilhas', 'visual', 'dag'],
  },
  {
    id: 'podcasts',
    title: 'Podcasts',
    heading:
      'Podcasts — áudio gerado por IA (2+ vozes) + slides visuais opcionais',
    summary: 'Geracao assincrona de podcasts com audio e slides sincronizados.',
    tags: ['podcasts', 'audio', 'slides'],
  },
  {
    id: 'mocks',
    title: 'Mocks',
    heading: 'Mocks — Servidor HTTP em :3335',
    summary: 'Servidor local de mocks HTTP com scripts JS e banco in-memory.',
    tags: ['mocks', 'http'],
  },
  {
    id: 'favorites',
    title: 'Favoritos',
    heading: 'Favoritos',
    summary: 'CRUD e busca de favoritos por tipo, categoria, tags e acesso.',
    tags: ['favorites', 'links'],
  },
  {
    id: 'canvas',
    title: 'Canvas',
    heading: 'Canvas — lousa realtime compartilhada na rede',
    summary:
      'Lousa única realtime: tablet na mesma rede desenha, todos veem, tudo persiste.',
    tags: ['canvas', 'realtime', 'whiteboard'],
  },
  {
    id: 'debug',
    title: 'Debug Audit',
    heading: 'Debug Audit — log efemero para agentes',
    summary: 'Buffer efemero de debug para agentes instrumentarem execucoes.',
    tags: ['debug', 'audit'],
  },
];

export const headlessManualMarkdown = (): string =>
  `# docmap — Headless API para agentes

Base URL: \`http://127.0.0.1:3334\`
Formato: JSON. App precisa estar rodando.

Use \`GET /headless/capabilities\` para descobrir as funcionalidades
disponiveis. Use \`GET /headless/manual?feature=<id>\` para buscar instrucoes
focadas e \`GET /headless/manual?feature=notes\` para
protocolos especificos.


> **Tags = tema.** Notas, tarefas, macros, podcasts e favoritos
> aceitam \`tags?: string[]\` (opcional) — o ASSUNTO da entidade, eixo pelo qual
> o docmap conecta itens do mesmo tema. São normalizadas ao salvar: minúsculas,
> sem acento, slug ("Machine Learning" → \`machine-learning\`; "Programação" →
> \`programacao\`). Reaproveite tags existentes em vez de criar variações.

> **Instrução especial — podcasts com slides:** quando o usuário pedir para
> gerar um podcast "com slides", "com apresentação visual", "com slides
> sincronizados" ou qualquer variação, você DEVE enviar \`"withSlides": true\`
> no body do \`POST /podcasts\`. Sem esse campo, o docmap gera apenas o áudio.

---

## Grafo de conhecimento

- \`GET /graph\` — grafo de TODAS as entidades do docmap (notas, tasks,
  trilhas, macros, podcasts, favoritos, skills, mocks) conectadas por TEMA. Read-only; reflete o
  estado atual do KV.
  - \`nodes\`: \`{ id, label, kind, tags? }\` — \`id\` = \`"<tipo>:<uuid>"\` (entidade) ou
    \`"tag:<slug>"\` (tag). \`kind\` = \`note|task|trilha|macro|podcast|favorite|skill|mock|tag\`.
  - \`links\`: \`{ source, target, kind }\` — \`kind\` = \`tagged\` (entidade→tag) ou
    \`reference\` (task→nota via \`noteId\`).
  - Cada tag é um NÓ próprio: entidades do mesmo tema ligam-se à mesma tag. Por
    isso vale usar tags consistentes — são o que conecta o grafo.

## Notas (knowledge base global)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/notes\` | Lista (id, title, tags, category, preview) |
| GET | \`/notes/:id\` | Nota completa com \`content\` em markdown |
| POST | \`/notes\` | Cria \`{ title, content, tags?, category? }\` |
| PUT | \`/notes/:id\` | Edita (campos parciais) |
| DELETE | \`/notes/:id\` | Remove (+ apaga imagens anexadas) |
| GET | \`/search?q=termo\` | Busca full-text nas notas |

Categoria: id (slug) de uma categoria cadastrada — \`general\`, \`estudos\`, etc.
String vazia ('') = nota sem categoria. Omitir ou enviar vazio não força
mais \`general\`.

> **Protocolo de categoria — siga nesta ordem:** antes de criar ou editar
> nota com \`category\`, liste \`GET /categories?q=<tema>\` e reaproveite uma
> existente. Só crie via \`POST /categories { name, description }\` se nenhuma
> servir — com \`description\` preenchida para a próxima IA entender o
> propósito. Enviar texto livre em \`POST /notes\` ainda funciona (a API
> converte para o slug), mas cria a categoria com descrição vazia — evite.
> Complete descrições ausentes via \`PUT /categories/:id\`.

### Categorias de notas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/categories\` | Lista com contagem \`notes\`; aceita \`?q=<texto>\` e \`?limit=<n>\` (default 200, máx 500, total no header \`X-Total-Count\`) |
| GET | \`/categories/:id\` | Categoria + contagem \`notes\` |
| POST | \`/categories\` | Cria \`{ name, description? }\` (409 se o slug existir) |
| PUT | \`/categories/:id\` | Edita \`{ name?, description? }\` (id imutável) |
| DELETE | \`/categories/:id\` | Remove (notas vinculadas ficam sem categoria; vale p/ \`general\`) |

### Imagens nas notas (UI :3333)

Imagens ficam no filesystem (\`<dataDir>/notes/<noteId>/\`), nunca em base64
no KV. O \`content\` guarda só \`![](/notes/:id/attachments/<arquivo>)\`.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | \`/notes/:id/attachments\` | Upload raw \`image/png|jpeg|gif|webp\` (máx 5MB) ou JSON \`{ filePath }\` (print copiado como referência) → \`{ filename, url, markdown }\` |
| GET | \`/notes/:id/attachments/:file\` | Serve a imagem |

---

## Skills

### Collections

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/skills/collections\` | Lista collections de skills |
| GET | \`/skills/collections/:id\` | Collection + suas skills |
| POST | \`/skills/collections\` | Cria \`{ name }\` |
| PUT | \`/skills/collections/:id\` | Renomeia \`{ name }\` |

### Skills

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/skills\` | Lista (id, name, title, description, tags); aceite \`?collectionId=<id>\` para filtrar |
| GET | \`/skills/:nameOrId\` | Skill completa com \`content\` em markdown |
| POST | \`/skills\` | Cria \`{ name?, title, description?, content, tags?, collectionId? }\` |
| PUT | \`/skills/:nameOrId\` | Edita campos parciais; use \`collectionId: null\` para remover da collection |

\`name\` é o slug legível (ex: \`analyze-pr\`). Acesse por nome ou UUID.
\`collectionId: null\` remove uma skill da collection atual.

---

## Macros

### Collections

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/macros/collections\` | Lista collections de macros |
| GET | \`/macros/collections/:id\` | Collection + suas macros |
| POST | \`/macros/collections\` | Cria \`{ name }\` |
| PUT | \`/macros/collections/:id\` | Renomeia \`{ name }\` |
| DELETE | \`/macros/collections/:id\` | Remove a collection e preserva suas macros sem collection |
| DELETE | \`/macros/collections/:id/clear\` | Zera macros, mantém a collection |

### Macros e execução

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/macros\` | Lista macros; aceite \`?collectionId=<id>\` para filtrar |
| GET | \`/macros/:idOrName\` | Macro completa por UUID ou slug \`name\` |
| POST | \`/macros\` | Cria \`{ name, title, description?, script, inputLabel?, tags?, collectionId?, lifecycle? }\` |
| PUT | \`/macros/:id\` | Edita (campos parciais) |
| DELETE | \`/macros/:id\` | Remove uma macro |
| POST | \`/macros/:idOrName/run\` | Executa com output SSE em tempo real |
| POST | \`/macros/:idOrName/invoke\` | Executa aguardando o fim; ideal para composição |

O \`interpreter\` (\`bash\` ou \`deno\`) é detectado automaticamente pelo shebang.
O \`name\` é um slug global e único, para que chamadas entre collections sejam
determinísticas. \`collectionId: null\` remove uma macro da collection atual.

\`inputLabel?: string\` declara que a macro aceita um único parâmetro textual.
Na UI, o Docmap abre uma modal antes da execução usando esse label. Na API,
\`POST /macros/:idOrName/run\` e \`POST /macros/:idOrName/invoke\` aceitam
\`{ "input": "valor" }\` em JSON ou o valor puro em \`text/plain\`. O valor é
sempre entregue como texto: \`DOCMAP_INPUT\` no ambiente e primeiro argumento do
processo (\`$1\` no Bash, \`Deno.args[0]\` no Deno). A macro converte para
número, booleano ou outro formato quando precisar.

Toda macro pode executar outra por UUID ou slug:

\`\`\`bash
#!/bin/bash
set -e
run_macro "preparar-dados"
run_macro "preparar-dados" "docmap"
\`\`\`

\`\`\`ts
#!/usr/bin/env -S deno run --allow-all
await runMacro('preparar-dados')
await runMacro('preparar-dados', 'docmap')
\`\`\`

\`run_macro\` (Bash) retorna status diferente de zero e \`runMacro\` (Deno)
lança \`Error\` quando a macro não existe, é bloqueada ou termina com falha.
Chamadas circulares (A → B → A) também são rejeitadas. Para integrações sem os
helpers, \`POST /macros/:idOrName/invoke\` retorna \`404\` com
\`{ "error": "macro_not_found" }\` quando a referência não existe, \`422\`
quando o script termina com erro e \`200\` quando conclui com sucesso.

## Chats — conversa realtime entre agentes

Salas independentes. Agentes entram com nome único e conversam
entre si e com o usuário. O usuário dita o objetivo; os agentes se organizam.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/agentchats\` | Lista salas |
| POST | \`/agentchats\` | Cria \`{ title?, objective?, tags? }\` |
| GET | \`/agentchats/:id\` | Sala + mensagens + participantes |
| PUT | \`/agentchats/:id\` | Edita título, objetivo, status |
| DELETE | \`/agentchats/:id\` | Remove sala e histórico |
| GET | \`/agentchats/:id/prompt\` | Prompt markdown copiável |
| POST | \`/agentchats/:id/join\` | Entra \`{ name, tool?, provider?, model? }\` |
| POST | \`/agentchats/:id/leave\` | Sai \`{ sessionId }\` |
| POST | \`/agentchats/:id/heartbeat\` | Renova presença |
| POST | \`/agentchats/:id/messages\` | Envia \`{ sessionId?, body, to?, authorName? }\` |
| GET | \`/agentchats/:id/messages?afterSeq=&limit=\` | Histórico paginado |
| GET | \`/agentchats/:id/inbox?sessionId=&afterSeq=&wait=600\` | Inbox bloqueante |
| GET | \`/agentchats/events\` | SSE para a UI |

Loop do agente: join → leitura total (afterSeq=0) → apresentação →
coordenação com wait=60 (PROIBIDO executar antes do acordo) → claim
"ASSUMO: <tarefa>" → execução com heartbeat → repetir inbox.
Use "to" para dirigir pergunta a outro agente. Claim mais antigo vence;
não duplique tarefa assumida. Responda o usuário sempre que ele falar.
Durante a execução, poste progresso a cada marco ou ~5 min; nunca suma
até os 100%. Pergunta do usuário tem prioridade sobre o trabalho.
O chat é o ÚNICO canal: nunca pergunte na janela local da ferramenta;
toda dúvida, decisão ou pedido vai no chat (com "to" se for dirigida).
Mensagens seguem hyperfocus por padrão (estrutura para leitura com TDAH):
ponto-chave primeiro, frases curtas, listas para 3+ itens, negrito nos
termos-chave; código e erros vão normais, sem formatação especial.
Entrada e saída geram mensagem de sistema visível na UI.
Tags seguem o padrão do grafo e ligam chats a notas e tasks.

---

## Tasks — Kanban global

Colunas fixas: \`todo\` (A Fazer) · \`in-progress\` (Em Andamento) · \`review\` (Revisão) · \`done\` (Concluído).  
Ordem dentro da coluna = prioridade (menor \`order\` = mais prioritário).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/tasks\` | Lista todas as tasks |
| GET | \`/tasks/:id\` | Task completa + \`deepLink\` |
| POST | \`/tasks\` | Cria \`{ title, description?, status?, dueDate?, noteId?, tags?, checklist? }\` |
| PUT | \`/tasks/:id\` | Edita campos (parcial). \`dueDate: null\` e \`noteId: null\` removem o campo |
| DELETE | \`/tasks/:id\` | Remove |
| PUT | \`/tasks/reorder\` | Reordena coluna: \`{ status, ids: string[] }\` |

**Campos:**
- \`title\` (string, obrigatório)
- \`description\` (markdown, opcional)
- \`status\`: \`"todo"\` | \`"in-progress"\` | \`"review"\` | \`"done"\`
- \`order\` (número, definido automaticamente na criação)
- \`dueDate\` (YYYY-MM-DD, opcional)
- \`noteId\` (UUID de uma nota vinculada, opcional)
- \`tags\` (array de strings, opcional) — tema/assunto da task
- \`checklist\` (array de \`{ id?, text, done? }\`, opcional) — itens de verificação

**Deep link**: \`GET /tasks/:id\` retorna \`{ deepLink: "http://127.0.0.1:3333/#task/<id>" }\`.

---

## Trilhas — objetivo visual editável (humano + IA)

Uma trilha é um objetivo com contexto + blocos (nós) com detalhes + setas de
dependência (DAG). Humano e IA leem e editam os mesmos nós. Paralelismo é
liberado: só o que tem seta precisa esperar.

Status da trilha: \`draft | running | done | cancelled\`.
Status do nó: \`todo | doing | done | blocked\`.
Responsável: \`assignee: { kind: "human" | "ai", label }\`.
Critérios de pronto: \`doneCriteria: string[]\` por bloco — \`done\` exige
\`result\` não vazio quando há critérios (400 senão).
Bloqueio: \`blockedReason\` diz o que falta (fila "aguardando humano").

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/trilhas\` | Lista com \`nodeCount\` + \`deepLink\` |
| POST | \`/trilhas\` | Cria \`{ title, objective, description?, tags? }\` |
| GET | \`/trilhas/:id\` | Trilha + \`nodes\` + \`edges\` |
| PUT | \`/trilhas/:id\` | Edita (parcial, inclui \`status\`) |
| DELETE | \`/trilhas/:id\` | Remove trilha + nós + arestas + eventos |
| GET | \`/trilhas/:id/next?by=<nome>\` | Próximo bloco acionável (todo + deps done); com \`by\`, já reserva; 404 \`no_work\` se vazio |
| GET | \`/trilhas/:id/events?limit=100\` | Log append-only (criações, status, claims, setas) |
| GET | \`/trilhas/:id/nodes\` | Lista nós da trilha |
| POST | \`/trilhas/:id/nodes\` | Cria \`{ title, details?, result?, doneCriteria?, blockedReason?, status?, assignee?, position?, dependsOn? }\` |
| GET | \`/trilhas/:id/nodes/:nodeId\` | Nó avulso (para a IA executar só ele) |
| PUT | \`/trilhas/:id/nodes/:nodeId\` | Edita nó; aceita \`by\` e \`expectedUpdatedAt\` (409 em conflito/trava alheia) |
| DELETE | \`/trilhas/:id/nodes/:nodeId\` | Remove nó + arestas ligadas |
| GET | \`/trilhas/:id/edges\` | Lista arestas |
| POST | \`/trilhas/:id/edges\` | Cria \`{ fromNodeId, toNodeId }\` (409 se formar ciclo) |
| DELETE | \`/trilhas/:id/edges/:edgeId\` | Remove aresta |
| POST | \`/trilhas/:id/nodes/:nodeId/claim\` | Reserva \`{ by, force? }\` (409 se outro dono; \`force\` toma trava obsoleta) |
| POST | \`/trilhas/:id/nodes/:nodeId/heartbeat\` | Sinal de vida \`{ by }\` (não toca \`updatedAt\`) |
| POST | \`/trilhas/:id/nodes/:nodeId/release\` | Libera a trava (válvula de escape manual) |

Para delegar um nó a uma IA, copie o **ID do nó** e envie
\`GET /trilhas/:id/nodes/:nodeId\` — o pacote contém título, briefing,
relatório, critérios, status e dependências.

### Loop de execução

Cada bloco tem dois textos com papéis distintos: \`details\` é o briefing
(o que fazer — escrito pelo humano ou pela IA ao criar o bloco) e \`result\`
é o relatório da entrega (o que foi feito). A IA **nunca sobrescreve**
\`details\`; o resultado vai em \`result\` via \`PUT\`.

Rotina por bloco: \`claim { by }\` → \`heartbeat\` a cada ~2min →
\`doing\` → executa → \`result\` + \`done\` (trava libera sozinha) →
\`GET /trilhas/:id/next?by=<nome>\` para o próximo. Sem \`by\`, o \`next\`
só espreita sem reservar. Travas sem sinal há 5+ min são obsoletas: o
\`next\` as reassume e \`claim\` com \`force: true\` as toma.

Concorrência otimista: \`PUT\` com \`expectedUpdatedAt\` volta 409 se o nó
mudou desde a leitura — recarregue e tente de novo. Vale contra colisão
acidental entre agentes (trava é por label, sem auth), não contra agente
malicioso. Se um dono travar ou morrer, qualquer humano libera pela UI
(botão Liberar) ou via \`POST .../release\`.

**Deep link**: \`GET /trilhas\` retorna \`{ deepLink: "http://127.0.0.1:3333/#trilha/<id>" }\`.

---

## Podcasts — áudio gerado por IA (2+ vozes) + slides visuais opcionais

Gera podcasts em áudio a partir de conteúdo de estudo. Sempre com **2+ personas**
com vozes distintas. A geração é **assíncrona**: o POST retorna 202 imediatamente
e o áudio fica pronto segundos/minutos depois (status \`generating\` → \`ready\`).

Opcionalmente, o podcast pode ter **slides visuais sincronizados com o áudio**
(CSS art puro, sem JavaScript). A UI troca os slides sozinha conforme o áudio toca.

### ⚡ Quick start — gerar podcast com slides

\`\`\`bash
curl -X POST http://127.0.0.1:3334/podcasts \\
  -H 'Content-Type: application/json' -d '{
    "title": "Buracos negros",
    "folder": "cosmos",
    "withSlides": true,
    "script": "<Slide title=\\"Introdução\\"><Ana>Olá!</Ana><Bruno>Vamos começar.</Bruno></Slide>"
  }'
# → 202 { "id": "...", "deepLink": "...", "status": "generating" }
# O docmap valida o roteiro, sincroniza os slides e sintetiza o áudio.
\`\`\`

> **ATENÇÃO:** \`withSlides: true\` é **obrigatório** para ter slides. Sem esse
> campo, o docmap gera apenas o áudio comum. O roteiro precisa conter blocos
> \`<Slide>…</Slide>\` e a palavra-chave do campo é
> exatamente \`withSlides\` (camelCase), não \`slides\`, não \`hasSlides\`.

Pré-requisitos na máquina: \`edge-tts\` (pip) e \`ffmpeg\` (brew install ffmpeg).

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/podcasts/health\` | Verifica dependências (edge-tts, ffmpeg, ffprobe) |
| GET | \`/podcasts?q=&folder=\` | Lista previews (sem script) |
| GET | \`/podcasts/:id\` | Podcast completo com \`script\`, \`slideMap\` + \`deepLink\` |
| GET | \`/podcasts/:id/audio\` | Stream MP3 com suporte a Range |
| GET | \`/podcasts/:id/slides\` | Documento HTML único com todos os slides (se \`withSlides\`) |
| GET | \`/podcasts/voices\` | Vozes pt-BR disponíveis (id, gender, style) |
| GET | \`/podcasts/folders\` | Pastas derivadas dos podcasts existentes |
| POST | \`/podcasts\` | Gera podcast (assíncrono — retorna 202) |
| PUT | \`/podcasts/:id\` | Edita \`title\`, \`folder\` e/ou \`tags\` |
| DELETE | \`/podcasts/:id\` | Remove metadados + áudio + slides |

### POST /podcasts — body

- \`title\` (obrigatório)
- \`script\` (obrigatório): roteiro pronto com tags \`<Person1>…</Person1>\` → só sintetiza o áudio
- \`content\` (legado): rejeitado; a geração automática de roteiro foi removida
- \`voices\` (opcional): array de \`{ name, voice }\` — mínimo 2, vozes distintas.
  Omitido → o docmap sorteia 2 vozes. Use \`GET /podcasts/voices\` pra escolher.
- \`folder\` (opcional, default "geral")
- \`tags\` (opcional): array de temas/assuntos do podcast (eixo do grafo)
- \`withSlides\` (opcional, default \`false\`): se \`true\`, o docmap sincroniza
  slides visuais já enviados com o áudio. O script precisa conter blocos \`<Slide>\`
  (e opcionalmente
    manifesto \`<Slides>\` embutido) — senão o docmap falha gracioso sem slides
  - com \`script\` + \`slides[]\`: você envia tudo pronto, o docmap só sintetiza
- \`slides\` (opcional): array de slides prontos \`{ index, title, transition?, html, css }\`.
  Ignorado se \`withSlides\` for falso/ausente. Exige \`script\` com blocos \`<Slide>\`
  casando os mesmos índices (mapeamento de sincronização vem do script).
- Retorna **202** com \`{ id, deepLink, status: "generating" }\`

### Formato do roteiro (campo \`script\`)

**Sem slides (formato clássico):**

Use as tags \`<NomeDaPersona>…</NomeDaPersona>\`. Cada nome deve ter uma voz em \`voices\`.

**Com slides (\`withSlides: true\`):**

Cerque blocos de falas com \`<Slide title="…" transition="…">…</Slide>\`. Cada \`<Slide>\`
agrupa 1+ turnos relacionados ao mesmo tema visual. Nenhuma fala pode ficar de fora
de um \`<Slide>\`. O agente externo define a quebra — pode ter 1 slide para 1 turno
ou 1 slide para N turnos. A sincronização é automática: cada slide aparece quando o áudio chega
na primeira fala do bloco.

\`\`\`bash
curl -X POST http://127.0.0.1:3334/podcasts \\
  -H 'Content-Type: application/json' -d '{
    "title": "Buracos negros",
    "folder": "cosmos",
    "withSlides": true,
    "script": "<Slide title=\\"Introdução\\"><Ana>Hoje vamos falar de buracos negros.</Ana></Slide>"
  }'
# → 202 { "id": "...", "deepLink": "...", "status": "generating" }
# docmap usa os blocos <Slide> enviados e sintetiza o áudio.
\`\`\`

### Enviar roteiro pronto com slides (\`script\` + \`withSlides\`)

O script precisa ter \`<Slide>\` blocos cercando as falas. Pode opcionalmente trazer
um bloco \`<Slides>\` no fim com HTML/CSS de cada slide — se não vier, o docmap
escreve um manifesto vazio e o podcast fica pronto **sem** slides visuais (só roteiro).

\`\`\`bash
curl -X POST http://127.0.0.1:3334/podcasts \\
  -H 'Content-Type: application/json' -d '{
    "title": "Redes neurais — introdução",
    "folder": "IA",
    "withSlides": true,
    "voices": [
      { "name": "Ana", "voice": "pt-BR-FranciscaNeural" },
      { "name": "Bruno", "voice": "pt-BR-AntonioNeural" }
    ],
    "script": "<Slide title=\\"Introdução\\" transition=\\"fade-zoom\\">\\n  <Ana>Olá! Hoje vamos falar de redes neurais.</Ana>\\n  <Bruno>Boa! Começa explicando.</Bruno>\\n</Slide>\\n<Slide title=\\"O que são\\" transition=\\"slide-left\\">\\n  <Ana>São modelos inspirados no cérebro…</Ana>\\n</Slide>\\n<Slides>\\n  <Slide index=\\"1\\" title=\\"Introdução\\" transition=\\"fade-zoom\\">\\n    <HTML>...markup sem <html>/<body>...</HTML>\\n    <CSS>...CSS escopado por .slide-1...</CSS>\\n  </Slide>\\n  <Slide index=\\"2\\" title=\\"O que são\\" transition=\\"slide-left\\">\\n    <HTML>...</HTML><CSS>...</CSS>\\n  </Slide>\\n</Slides>"
  }'
\`\`\`

### Enviar slides prontos (\`script\` + \`slides[]\` + \`withSlides\`)

Quando você (ou outra LLM externa) já tem os slides HTML/CSS prontos, passe-os
como array. O script precisa dos \`<Slide>\` blocos para mapear sincronização,
mas o bloco \`<Slides>\` manifesto é ignorado — o que vale é \`slides[]\`.

\`\`\`bash
curl -X POST http://127.0.0.1:3334/podcasts \\
  -H 'Content-Type: application/json' -d '{
    "title": "...",
    "withSlides": true,
    "script": "<Slide title=\\"Intro\\">...</Slide><Slide title=\\"Meio\\">...</Slide>",
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
\`\`\`

### ❌ Erros comuns ao gerar slides

1. **Esquecer \`withSlides: true\`** — sem isso, o docmap nunca gera slides.
2. **Roteiro sem blocos \`<Slide>\`** — quando você envia \`script\` pronto, ele
   precisa cercar as falas com \`<Slide title="...">...</Slide>\`. Caso contrário
   não há mapeamento de sincronização.
3. **CSS sem escopo \`.slide-N\`** — o CSS de cada slide deve usar seletores
   como \`.slide-1 h1\`, \`.slide-2 .grid\`. CSS global vaza nos outros slides.
4. **Slides sem conteúdo visual** — o campo \`html\` vazio gera slide preto.
   A LLM precisa gerar markup + CSS art de verdade.

### Especificação dos slides prontos (campo \`slides[]\`)

Cada slide é um objeto:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| \`index\` | number (1-based) | Casa com a ordem dos \`<Slide>\` no script |
| \`title\` | string | Acessibilidade + label na barra inferior |
| \`transition\` | string (opcional) | Dica semântica: \`fade-zoom\`, \`slide-left\`, \`flip\`, \`iris\`, etc. O efeito real vem do CSS que você escreve |
| \`html\` | string | Markup puro **sem** \`<html>/<body>/<head>\`. Sem \`<script>\`, sem \`<iframe>\`, sem \`<img>\` externa |
| \`css\` | string | CSS art puro, **escopado por \`.slide-N\`** (onde N é o índice). Animações de entrada via \`[data-state="entering"]\`, permanência via \`[data-state="active"]\`, saída via \`[data-state="leaving"]\` |

**Regras do CSS:**
- ESCOPO todo seletor com \`.slide-N\` (ex.: \`.slide-1 h1 { ... }\`)
- Sem JavaScript, sem \`@font-face\`, sem \`@import\`, sem URLs externas
- Use system fonts: \`system-ui\`, \`sans-serif\`, \`monospace\`, \`serif\`
- Animações via \`@keyframes\` + \`[data-state]\` selectors (o docmap aplica os atributos)
- O container do slide ocupa 100% do espaço disponível — preencha tudo

**Deep link**: \`GET /podcasts/:id\` retorna \`{ deepLink: "http://127.0.0.1:3333/#podcast/<id>" }\`.

---

## Mocks — Servidor HTTP em :3335

O docmap sobe um servidor de mocks em \`http://127.0.0.1:3335\`.
Cada mock tem um script JS executado a cada request. Os scripts recebem
\`ctx\` (request) e \`db\` (banco in-memory da collection) e devem retornar
\`{ status?, headers?, body? }\`.

### Protocolo para agentes — siga esta ordem

**Passo 1 — Descubra o estado atual (sempre, antes de criar qualquer coisa)**
\`\`\`bash
curl http://127.0.0.1:3334/mocks/collections  # collections existentes
curl http://127.0.0.1:3334/mocks              # todos os mocks existentes
\`\`\`

**Passo 2 — Crie a collection se não existir**
\`\`\`bash
curl -X POST http://127.0.0.1:3334/mocks/collections \\
  -H 'Content-Type: application/json' -d '{"name":"Minha API"}'
# guarde o id retornado
\`\`\`

**Passo 3 — Crie os mocks**
Use \`db\` para mocks que precisam compartilhar estado (ex.: POST cria, GET lê).
Use dados hardcoded para mocks simples e estáticos.

**Passo 4 — Valide**
\`\`\`bash
curl http://127.0.0.1:3335/seu-path
\`\`\`

**Regras:**
- Nunca crie uma collection duplicada — verifique no passo 1
- Prefira \`group\` para organizar mocks do mesmo recurso (ex.: \`"group": "Users"\`)
- Scripts com lógica condicional (404, validação) são muito melhores que retornos estáticos
- Use \`db\` sempre que um mock precisar ler dados que outro escreveu

### Gerenciamento de Collections (via AI API :3334)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/mocks/collections\` | Lista collections |
| GET | \`/mocks/collections/:id\` | Collection + seus mocks |
| POST | \`/mocks/collections\` | Cria \`{ name }\` |
| PUT | \`/mocks/collections/:id\` | Renomeia \`{ name }\` |
| DELETE | \`/mocks/collections/:id\` | Remove collection + todos os mocks |
| DELETE | \`/mocks/collections/:id/clear\` | Zera mocks, mantém a collection |
| DELETE | \`/mocks/clear\` | Apaga **tudo** (todas collections + mocks) |

### Gerenciamento de Mocks (via AI API :3334)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/mocks\` | Lista todos (ou \`?collectionId=<id>\`) |
| GET | \`/mocks/:id\` | Mock completo |
| POST | \`/mocks\` | Cria (veja body abaixo) |
| PUT | \`/mocks/:id\` | Edita campos parciais |
| DELETE | \`/mocks/:id\` | Remove |

**POST /mocks — body:**
\`\`\`json
{
  "collectionId": "<uuid>",
  "method": "GET",
  "path": "/users/:id",
  "name": "Get user by ID",
  "group": "Users",
  "script": "return { status: 200, body: { id: ctx.params.id, name: 'Alice' } };"
}
\`\`\`

**Campos:** \`method\` (GET\\|POST\\|PUT\\|PATCH\\|DELETE\\|HEAD\\|OPTIONS), \`path\` (com params tipo \`/users/:id\`), \`name\` (opcional), \`group\` (opcional), \`script\` (corpo de função JS que recebe \`ctx\` e retorna a resposta).

**Validação de duplicidade:** dentro de uma mesma collection, não é permitido ter dois mocks com o mesmo \`method\` + \`path\`. \`POST /mocks\` e \`PUT /mocks/:id\` retornam \`409 Conflict\` se o endpoint já existir.

### Script do mock

O script recebe **dois argumentos**: \`ctx\` (request) e \`db\` (banco in-memory da collection).

**\`ctx\`**: \`{ method, path, params, query, headers, body }\`

**\`db\`** — store in-memory compartilhado por todos os mocks da mesma collection:
- \`db.set(key, value)\`, \`db.get(key)\`, \`db.delete(key)\`, \`db.has(key)\`
- \`db.list(prefix)\` — array de todos os valores cujas chaves começam com \`prefix\`
- \`db.keys(prefix)\`, \`db.clear()\`, \`db.size()\`

Exemplo — CRUD real entre mocks:
\`\`\`js
// POST /users — cria e persiste
const user = { id: String(db.size() + 1), ...ctx.body };
db.set('user:' + user.id, user);
return { status: 201, body: user };

// GET /users/:id — lê do db
const user = db.get('user:' + ctx.params.id);
if (!user) return { status: 404, body: { error: 'not_found' } };
return { status: 200, body: user };
\`\`\`

Suporta async/await.

---

## Favoritos

Tipos: \`site\` · \`slack\` · \`grid\` · \`dash\` · \`github\`.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/favorites\` | Lista com busca e filtros (ver query params abaixo) |
| GET | \`/favorites/:id\` | Favorito completo |
| POST | \`/favorites\` | Cria \`{ type, title, url, category, tags?, note? }\` |
| PUT | \`/favorites/:id\` | Edita campos parciais |
| PUT | \`/favorites/:id/access\` | Registra acesso (incrementa \`accessCount\`) |
| DELETE | \`/favorites/:id\` | Remove |

**Query params de busca (\`GET /favorites\`):**

- \`q=<texto>\` — busca livre em \`title\`, \`url\`, \`note\`, \`category\` e \`tags\`
- \`type=<tipo>\` — filtra por tipo; pode repetir (\`type=site&type=github\`)
- \`category=<texto>\` — filtra por categoria (substring, case-insensitive)
- \`tag=<tag>\` — filtra por tag; pode repetir (\`tag=produto&tag=api\`) — exige todas as tags informadas
- \`sortBy=accessCount|createdAt|lastAccessed|title\` — ordenação (padrão: \`accessCount\`)
- \`order=asc|desc\` — direção (padrão: \`desc\`)

**Campos:**
- \`type\` (obrigatório): \`"site"\` | \`"slack"\` | \`"grid"\` | \`"dash"\` | \`"github"\`
- \`title\` (obrigatório)
- \`url\` (obrigatório)
- \`category\` (obrigatório)
- \`tags\` (array de strings, opcional)
- \`note\` (markdown/texto, opcional)
- \`accessCount\` (número, gerenciado automaticamente)
- \`lastAccessed\` (ISO string, atualizado via \`PUT /favorites/:id/access\`)

**Fluxos comuns:**

\`\`\`
# Buscar favoritos de produto
GET /favorites?category=produto&sortBy=accessCount&order=desc

# Buscar sites e dashboards sobre API
GET /favorites?q=api&type=site&type=dash

# Cadastrar novo favorito
POST /favorites { type: "site", title: "DocMap docs", url: "...", category: "docs", tags: ["produto"] }
\`\`\`


---

## Canvas — lousa realtime compartilhada na rede

O docmap tem uma lousa infinita onde **qualquer dispositivo na mesma rede
desenha e todos veem ao vivo**: abra no tablet, desenhe com caneta/dedo e o
PC (e outros na rede) acompanham em tempo real via WebSocket.

Motor: Quickdraw vendored no app (MIT, zero dependencias, 100% offline na
LAN — nenhum CDN externo).

### Acesso

- **Tablet/celular**: \`http://<ip-do-pc>:3333/canvas\` (o IP aparece no topo
  da propria pagina e em Configuracoes → "IP da rede" na UI desktop)
- **Rail do docmap**: botao "Canvas" na barra lateral (iframe da mesma pagina)

### Ferramentas (toolbar do board)

Caneta com pressao (caneta) / velocidade (mouse), marca-texto, formas
(retangulo, elipse, triangulo, diamante, hexagono, estrela) com traço reto
por padrão (o ondulado hand-drawn está no menu de estilo), setas com curva
arrastavel, linha, texto, sticky notes, imagens (colar/arrastar — vao
embutidas no documento; o botão de inserir por arquivo fica oculto),
laser pointer (efemero, nao salva), selecao
(mover/redimensionar/rotacionar/duplicar), pan + zoom (scroll/pinch),
palm rejection (com stylus, o dedo move a camera e a caneta desenha),
undo/redo por gesto, export PNG (menu ⋮ → "Export as PNG").
Tema claro/escuro casado com o docmap (papel, grid e seleção nos tokens da
UI; botão Tema no topo, acompanha a preferência salva).

### Endpoints (porta :3333)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | \`/canvas\` | Pagina standalone da lousa |
| GET | \`/canvas/ws\` | WebSocket do sync realtime |
| GET | \`/canvas/info\` | \`{ vendor, peers, shapes, updatedAt, hasFrame }\` |
| GET | \`/canvas/snapshot\` | Documento + textos extraídos (leitura precisa p/ IA) |
| GET | \`/canvas/frame.png\` | PNG atual do board (visão p/ IA) |
| POST | \`/canvas/frame\` | Viewers enviam o frame (body = PNG) |
| POST | \`/canvas/shapes\` | IA desenha direto na lousa única |
| POST | \`/canvas/clear\` | Apaga o board para todos |

### Protocolo WS \`/canvas/ws\`

**Servidor → cliente:**

- \`{ "type": "snapshot", "snapshot": { "document": { "store": { "<id>": <record> } } } }\`
  — estado completo; enviado ao conectar (late joiner) e ao limpar
- \`{ "type": "diff", "diff": { "added": {...}, "removed": {...}, "updated": { "<id>": [antes, depois] } } }\`
  — mudança incremental em tempo real
- \`{ "type": "peers", "count": N }\` — pessoas no board

**Cliente → servidor:**

- \`{ "type": "diff", "diff": {...} }\` — apenas edicoes locais; o servidor
  aplica no op-log e repassa aos demais (sem eco para o remetente)

Regras: diffs remotos nao poluem o undo local (undo colaborativo comporta-se);
conflito resolve por last-writer-wins por record (cada traço tem id unico);
diffs sao validados (forma + ate 5MB, imagens embutem dataURL) e inválidos
sao descartados. O board é **efemero** (memoria; restart limpa).

### IA vendo o board (visão + dados)

Dois endpoints complementares, sem precisar de WebSocket:

- \`GET /canvas/frame.png\` — **os olhos**: PNG atual do board, downscaled
  p/ ~1568px no lado maior. Headers \`X-Canvas-Updated-At\` (ISO) e
  \`X-Canvas-Shapes\`. Retorna \`404 { error: 'no_frame_yet' }\` se nenhum
  viewer enviou frame ainda (ex.: board vazio). Use quando perguntarem
  "o que tem desenhado aí?" — diagramas, sketches, layout.
- \`GET /canvas/snapshot\` — **a precisão**: \`{ snapshot, texts, shapes,
  updatedAt }\`, onde \`texts\` = \`[{ id, kind, text, x, y }]\` com
  \`kind\` em \`text|note|label\` (extraído no servidor, sempre fresco).
  Use para "quais textos há no board?" — exato onde a visão tropeça em
  letra pequena.

Como o frame é produzido: todo viewer conectado exporta o board (debounce
~3s após mudanças) via \`POST /canvas/frame\` (body PNG, max 8MB, validação
de magic bytes; 415 se não for PNG). Servidor guarda o último
(last-write-wins); \`POST /canvas/clear\` invalida o frame. Viewers não
enviam frame de board vazio.

  ### IA desenhando — \`POST /canvas/shapes\` (direto na lousa única)

  Aplica na hora no board e difunde a todos (a página oferece
  **Desfazer** ao detectar os shapes). Fluxo sugerido: consulte
  \`GET /canvas/frame.png\` e/ou \`/canvas/snapshot\` para escolher
  coordenadas livres, depois poste.

  Body \`{ shapes: [...] }\` (max 50 por request). Kinds:

| Kind | Campos | Efeito |
|------|--------|--------|
| \`text\` | \`text*\`, \`x?\`, \`y?\`, \`color?\`, \`size?\` (\`s/m/l/xl\`), \`font?\` | Texto digitado |
| \`note\` | \`text*\`, \`x?\`, \`y?\`, \`color?\`, \`font?\` | Sticky note |
| \`geo\` | \`geo?\` (\`rectangle/ellipse/triangle/diamond/hexagon/star\`), \`label?\`, \`w?\`, \`h?\`, \`x?\`, \`y?\`, \`color?\`, \`size?\`, \`fill?\`, \`font?\`, \`dash?\` | Forma (default 220×140, traço reto) |
| \`arrow\`/\`line\` | \`x2*\`, \`y2*\`, \`x1?\`, \`y1?\`, \`bend?\`, \`color?\`, \`size?\` | Seta/linha por endpoints |

- Cores: \`black/grey/light-violet/violet/blue/light-blue/yellow/orange/green/light-green/light-red/red\`
  (default \`black\`); fontes: \`draw/sans/serif/mono\` (default \`draw\`, traço à mão).
- Traço (\`dash\` em geo): \`solid/dashed/dotted/draw\` (default \`solid\`,
  reto). Use \`draw\` só quando quiser o ondulado hand-drawn de propósito.
- \`x/y\` omitidos → empilha abaixo do conteúdo existente (cursor automático).
  Coordenadas em px do board; textos até 500 chars, labels até 200.
- Resposta \`{ ok: true, ids, count }\` com os ids gerados (\`shape:ai-…\`).

\`\`\`bash
# Fluxograma mínimo: duas caixas + seta (posicionamento automático)
curl -X POST http://127.0.0.1:3333/canvas/shapes \\
  -H "Content-Type: application/json" \\
  -d '{"shapes":[
    {"kind":"geo","geo":"rectangle","label":"coleta","color":"blue"},
    {"kind":"geo","geo":"ellipse","label":"pronto","color":"green"},
    {"kind":"text","text":"gerado pela IA","size":"s","color":"grey"}
  ]}'

# Setas precisam de endpoints (veja o snapshot para coordenadas livres)
curl -X POST http://127.0.0.1:3333/canvas/shapes \\
  -H "Content-Type: application/json" \\
  -d '{"shapes":[{"kind":"arrow","x1":100,"y1":100,"x2":300,"y2":200,"color":"red"}]}'
\`\`\`

### Canvas único persistido

Não há collections nem desenhos salvos: o canvas é UM board só e o
servidor persiste automaticamente a cada mudança em
\`<dataDir>/canvas/board.json\` (vai pro filesystem pois pode passar de
64 KiB com imagens embutidas). Restart não apaga nada — o boot restaura
o snapshot e late joiners recebem o board completo via WS.

- Tudo que a IA desenha (\`POST /canvas/shapes\`) cai no canvas e é salvo.
- Toda edição humana (diffs via WS) é salva com debounce curto.
- \`POST /canvas/clear\` apaga para todos (a página pede confirmação e
  oferece Desfazer; o servidor persiste o board vazio).
- O canvas não entra no \`/graph\` (não é entidade tagueável).

### Quick start

\`\`\`bash
# Abrir a lousa
open http://127.0.0.1:3333/canvas

# Ver quem está desenhando + tamanho do board
curl http://127.0.0.1:3333/canvas/info

# Ver o board (visão): salva o PNG atual
curl -o board.png http://127.0.0.1:3333/canvas/frame.png

# Ler textos do board (dados)
curl http://127.0.0.1:3333/canvas/snapshot | head -c 2000

# Apagar tudo
curl -X POST http://127.0.0.1:3333/canvas/clear
\`\`\`

### Rede

- A UI (\`:3333\`) binda em \`127.0.0.1\` por padrão (somente local).
- Use \`DOCMAP_HOST=0.0.0.0\` apenas para expor o canvas na LAN; rotas
  sensíveis continuam bloqueadas fora de loopback.
- A AI API (\`:3334\`) continua exclusiva em \`127.0.0.1\` (loopback).
- \`GET /system/network\` lista os IPv4 da maquina (usado pela pagina e settings).

### Breaking change (v13)

O canvas virou lousa única persistida: endpoints \`/canvas/proposals*\`,
\`/canvas/collections*\`, \`/canvas/drawings*\` e deep links \`#drawing/<id>\`
foram removidos, junto com o kind \`drawing\` no \`/graph\`. A IA desenha
sempre direto via \`POST /canvas/shapes\` e o servidor salva cada mudança
em \`<dataDir>/canvas/board.json\`. Desenhos e collections antigos são
purgados pela migração de schema v15 (conteúdo perdido, sem volta).

### Breaking change (v12)

O módulo de diagramas Mermaid foi removido (endpoints \`/diagrams*\`,
modo Diagramas na UI, deep links \`#diagram/<id>\`). Os diagramas foram
migrados para desenhos do canvas (collection "Estudos", tags preservadas).
No \`/graph\`, o kind \`diagram\` virou \`drawing\`; deep link agora é
\`#drawing/<id>\`. Chaves órfãs \`["diagrams", ...]\` são purgadas pela
migração de schema v10.

### Breaking change (v11)

Os endpoints de push de HTML (\`POST /canvas/push\`, \`/canvas/inspect\`,
\`/canvas/import-file\`) foram removidos — o canvas agora é lousa, nao
renderizador de HTML.

---

## Debug Audit — log efemero para agentes

Buffer in-memory (sem persistencia) para IA/agentes instrumentarem codigo e
inspecionarem dados arbitrarios. Tudo expira em 20 minutos (TTL) e o buffer
global tem limite de 1000 entradas (ring buffer).

### Endpoints (porta :3334)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | \`/debug\` | Envia um payload de debug |
| GET | \`/debug/:sessionId\` | Lista entradas da sessao |

### POST /debug — body

\`\`\`json
{
  "sessionId": "agent-123",
  "payload": { "qualquer": "json" }
}
\`\`\`

Resposta **201**:

\`\`\`json
{ "seq": 1, "ts": "HH:MM:SS.mmm" }
\`\`\`

- \`sessionId\`: escolhido pelo agente/IA.
- \`payload\`: qualquer JSON, sem validacao.
- \`seq\`: numero global monotonico crescente, nunca reseta.
- \`ts\`: timestamp formatado como \`HH:MM:SS.mmm\`.

### GET /debug/:sessionId

Resposta: array de entradas ordenadas por \`seq\`:

\`\`\`json
[
  { "seq": 1, "ts": "14:32:10.042", "sessionId": "agent-123", "payload": { ... } }
]
\`\`\`

### UI

Abra pelo app no botao **Debug** do rail lateral. A pagina mostra:

- contagem de sessoes e entradas;
- cards de sessao com copiar/excluir;
- tabela de entradas com \`seq\`, \`ts\` e payload JSON formatado;
- atualizacao automatica a cada 2 segundos.

---

`;

const INTRO_END = '\n---\n\n## ';

const normalize = (value: string): string => value.trim().toLowerCase();

const splitFeatureParam = (value: string | null): readonly string[] =>
  value?.split(',').map((part) => part.trim()).filter(Boolean) ?? [];

const introMarkdown = (manual: string): string => {
  const end = manual.indexOf(INTRO_END);
  return end === -1 ? manual : manual.slice(0, end + '\n---\n'.length);
};

const sectionMarkdown = (
  manual: string,
  feature: HeadlessManualFeature,
): string => {
  const marker = `## ${feature.heading}`;
  const start = manual.indexOf(marker);
  if (start === -1) return '';
  const next = manual.indexOf('\n## ', start + marker.length);
  return manual.slice(start, next === -1 ? undefined : next).trim();
};

export const parseHeadlessManualOptions = (
  url: URL,
): HeadlessManualOptions => {
  const features = [
    ...url.searchParams.getAll('feature'),
    ...splitFeatureParam(url.searchParams.get('features')),
  ].flatMap((value) => splitFeatureParam(value));
  return {
    features,
    role: url.searchParams.get('role'),
  };
};

export const selectHeadlessFeatures = (
  options: HeadlessManualOptions = {},
): readonly HeadlessManualFeature[] => {
  const requested = new Set((options.features ?? []).map(normalize));
  const role = options.role ? normalize(options.role) : '';

  if (!requested.size && !role) return HEADLESS_FEATURES;

  return HEADLESS_FEATURES.filter((feature) => {
    const featureMatches = requested.has(feature.id) ||
      requested.has(normalize(feature.title)) ||
      requested.has(normalize(feature.heading));
    if (requested.size) return featureMatches;
    return feature.roles?.includes(role as HeadlessManualRole) ?? false;
  });
};

export const unknownHeadlessFeatures = (
  options: HeadlessManualOptions = {},
): readonly string[] => {
  const known = new Set(
    HEADLESS_FEATURES.flatMap((feature) => [
      feature.id,
      normalize(feature.title),
      normalize(feature.heading),
    ]),
  );
  return (options.features ?? [])
    .map(normalize)
    .filter((feature) => !known.has(feature));
};

export const renderHeadlessManual = (
  options: HeadlessManualOptions = {},
): string => {
  const manual = headlessManualMarkdown();
  const selected = selectHeadlessFeatures(options);
  const allSelected = selected.length === HEADLESS_FEATURES.length &&
    !options.role &&
    !(options.features?.length);
  if (allSelected) return manual;

  const chunks = [
    introMarkdown(manual),
    selected.map((feature) => sectionMarkdown(manual, feature)).filter(Boolean)
      .join('\n\n---\n\n'),
  ].filter(Boolean);

  return `${chunks.join('\n\n')}\n`;
};

export const headlessCapabilities = () => ({
  name: 'docmap-headless-api',
  version: HEADLESS_MANUAL_VERSION,
  baseUrl: 'http://127.0.0.1:3334',
  endpoints: {
    capabilities: '/headless/capabilities',
    bootstrap: '/headless/bootstrap',
    manual: '/headless/manual',
  },
  filters: {
    feature: HEADLESS_FEATURES.map((feature) => feature.id),
    role: HEADLESS_ROLES,
    format: ['markdown', 'json'],
  },
  features: HEADLESS_FEATURES.map((feature) => ({
    id: feature.id,
    title: feature.title,
    summary: feature.summary,
    tags: feature.tags,
    ...(feature.roles ? { roles: feature.roles } : {}),
    manualUrl: `/headless/manual?feature=${feature.id}`,
  })),
});

export const headlessManualDocument = (
  options: HeadlessManualOptions = {},
) => {
  const selected = selectHeadlessFeatures(options);
  return {
    ...headlessCapabilities(),
    selectedFeatures: selected.map((feature) => feature.id),
    role: options.role ?? null,
    markdown: renderHeadlessManual(options),
  };
};

export const headlessBootstrapMarkdown = (): string =>
  `# docmap — Headless API

Base URL: \`http://127.0.0.1:3334\`

O docmap expõe uma Headless API local para agentes externos operarem notas,
tasks, macros, podcasts, mocks, canvas e demais recursos sem depender
da UI.

Antes de agir, descubra as capacidades atuais:

\`\`\`bash
curl http://127.0.0.1:3334/headless/capabilities
\`\`\`

Para carregar instruções completas:

\`\`\`bash
curl http://127.0.0.1:3334/headless/manual
\`\`\`

Para reduzir contexto, busque apenas a funcionalidade necessária:

\`\`\`bash
curl 'http://127.0.0.1:3334/headless/manual?feature=notes'
curl 'http://127.0.0.1:3334/headless/manual?feature=podcasts'
curl 'http://127.0.0.1:3334/headless/manual?feature=canvas'
\`\`\`

Use \`/skills\` somente para skills salvas pelo usuário no docmap. As instruções
do próprio docmap vivem em \`/headless/manual\`.
`;
