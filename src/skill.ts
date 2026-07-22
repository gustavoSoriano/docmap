// ════ Fonte canônica do conteúdo da skill ════
// Este é o corpo markdown servido em GET /system/skill (botão "Copiar skill" da
// UI). O SKILL.md (raiz) e o global ~/.claude/skills/docmap/SKILL.md são GERADOS
// a partir daqui. Edite ESTE arquivo e rode `deno task gen-skill` para propagar.
export const skillMarkdown = (): string =>
  `# docmap — API local (para IA)

Base URL: \`http://127.0.0.1:3334\`
Formato: JSON. App precisa estar rodando.

> **Tags = tema.** Notas, tarefas, diagramas, macros, podcasts e favoritos
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

- \`GET /graph\` — grafo de TODAS as entidades do docmap (notas, tasks, diagramas,
  macros, podcasts, favoritos, skills) conectadas por TEMA. Read-only; reflete o
  estado atual do KV.
  - \`nodes\`: \`{ id, label, kind }\` — \`id\` = \`"<tipo>:<uuid>"\` (entidade) ou
    \`"tag:<slug>"\` (tag). \`kind\` = \`note|task|diagram|macro|podcast|favorite|skill|tag\`.
  - \`links\`: \`{ source, target, kind }\` — \`kind\` = \`tagged\` (entidade→tag) ou
    \`reference\` (task→nota via \`noteId\`).
  - Cada tag é um NÓ próprio: entidades do mesmo tema ligam-se à mesma tag. Por
    isso vale usar tags consistentes — são o que conecta o grafo.

## Workspace (arquivos \`.md\`)

Estes endpoints leem a pasta de trabalho que o usuário abriu no docmap.
Retornam erro se nenhum workspace estiver selecionado.

- \`GET /content?file=<caminho/relativo.md>\` — conteúdo bruto do arquivo
  - Resposta: \`{ path, raw }\` com markdown completo
- \`GET /docs/search?q=termo\` — busca full-text nos \`.md\` do workspace
  - Resposta: array de \`{ file, line, heading, snippet }\`

> Se o usuário pedir para alterar um arquivo, você já tem o caminho relativo nos endpoints acima. A edição em si deve ser feita pelo canal de escrita que o usuário indicar (o docmap não expõe escrita de arquivos por esta API).

---

## Notas (knowledge base global)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/notes\` | Lista (id, title, tags, category, preview) |
| GET | \`/notes/:id\` | Nota completa com \`content\` em markdown |
| POST | \`/notes\` | Cria \`{ title, content, tags?, category? }\` |
| PUT | \`/notes/:id\` | Edita (campos parciais) |
| DELETE | \`/notes/:id\` | Remove |
| GET | \`/search?q=termo\` | Busca full-text nas notas |

Categoria: texto livre (\`general\`, \`ai\`, etc.).

---

## Diagramas Mermaid

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/diagrams\` | Lista (id, title, tags, preview) |
| GET | \`/diagrams/:id\` | Diagrama completo + \`deepLink\` |
| POST | \`/diagrams\` | Cria \`{ title, source, tags? }\` |
| PUT | \`/diagrams/:id\` | Edita |
| DELETE | \`/diagrams/:id\` | Remove |

**Deep link**: \`GET /diagrams/:id\` retorna \`{ deepLink: "http://127.0.0.1:3333/#diagram/<id>" }\`.  
Mande o \`deepLink\` ao usuário para abrir direto no app.

Tipos Mermaid: \`flowchart\`, \`sequenceDiagram\`, \`classDiagram\`, \`stateDiagram-v2\`, \`erDiagram\`, \`gantt\`, \`pie\`, \`gitGraph\`.

---

## Skills (read-only)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/skills\` | Lista (id, name, title, description, tags) |
| GET | \`/skills/:nameOrId\` | Skill completa com \`content\` em markdown |

\`name\` é o slug legível (ex: \`analyze-pr\`). Acesse por nome ou UUID.

---

## Macros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/macros\` | Lista macros (id, name, title, description, interpreter, tags) |
| GET | \`/macros/:id\` | Macro completa com \`script\` e \`interpreter\` |
| POST | \`/macros\` | Cria \`{ name, title, description?, script, tags? }\` |
| PUT | \`/macros/:id\` | Edita (campos parciais) |

O \`interpreter\` (\`bash\` ou \`deno\`) é detectado automaticamente pelo shebang.
Execução continua sendo manual pelo usuário dentro do app.

---

## Tasks — Kanban global

Colunas fixas: \`todo\` (A Fazer) · \`in-progress\` (Em Andamento) · \`done\` (Concluído).  
Ordem dentro da coluna = prioridade (menor \`order\` = mais prioritário).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | \`/tasks\` | Lista todas as tasks |
| GET | \`/tasks/:id\` | Task completa + \`deepLink\` |
| POST | \`/tasks\` | Cria \`{ title, description?, status?, dueDate?, noteId?, tags? }\` |
| PUT | \`/tasks/:id\` | Edita campos (parcial). \`dueDate: null\` e \`noteId: null\` removem o campo |
| DELETE | \`/tasks/:id\` | Remove |
| PUT | \`/tasks/reorder\` | Reordena coluna: \`{ status, ids: string[] }\` |

**Campos:**
- \`title\` (string, obrigatório)
- \`description\` (markdown, opcional)
- \`status\`: \`"todo"\` | \`"in-progress"\` | \`"done"\`
- \`order\` (número, definido automaticamente na criação)
- \`dueDate\` (YYYY-MM-DD, opcional)
- \`noteId\` (UUID de uma nota vinculada, opcional)
- \`tags\` (array de strings, opcional) — tema/assunto da task

**Deep link**: \`GET /tasks/:id\` retorna \`{ deepLink: "http://127.0.0.1:3333/#task/<id>" }\`.

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
    "content": "<cole aqui o texto/artigo de estudo>"
  }'
# → 202 { "id": "...", "deepLink": "...", "status": "generating" }
# O docmap gera diálogo + slides via LLM e depois o áudio.
\`\`\`

> **ATENÇÃO:** \`withSlides: true\` é **obrigatório** para ter slides. Sem esse
> campo, o docmap gera apenas o áudio comum. A palavra-chave do campo é
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
- \`content\` **ou** \`script\` (obrigatório um dos dois):
  - \`content\`: texto bruto → o docmap gera o roteiro via provider configurado
  - \`script\`: roteiro pronto com tags \`<Person1>…</Person1>\` → só sintetiza o áudio
- \`voices\` (opcional): array de \`{ name, voice }\` — mínimo 2, vozes distintas.
  Omitido → o docmap sorteia 2 vozes. Use \`GET /podcasts/voices\` pra escolher.
- \`folder\` (opcional, default "geral")
- \`tags\` (opcional): array de temas/assuntos do podcast (eixo do grafo)
- \`withSlides\` (opcional, default \`false\`): se \`true\`, o docmap gera slides
  visuais sincronizados com o áudio. Aplica-se a qualquer modo:
  - com \`content\`: o docmap gera diálogo + slides via LLM
  - com \`script\`: o script precisa conter blocos \`<Slide>\` (e opcionalmente
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
de um \`<Slide>\`. A LLM decide a quebra — pode ter 1 slide para 1 turno ou 1 slide
para N turnos. A sincronização é automática: cada slide aparece quando o áudio chega
na primeira fala do bloco.

\`\`\`bash
curl -X POST http://127.0.0.1:3334/podcasts \\
  -H 'Content-Type: application/json' -d '{
    "title": "Buracos negros",
    "folder": "cosmos",
    "withSlides": true,
    "content": "<cole aqui o texto/artigo>"
  }'
# → 202 { "id": "...", "deepLink": "...", "status": "generating" }
# docmap gera diálogo com <Slide> + manifesto visual numa única chamada de LLM.
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
`;
