import type { AgentRole, NodeExecutionPackage, Workflow } from './types.ts';

const API = 'http://127.0.0.1:3334';

const identityExample = (role: AgentRole): string =>
  JSON.stringify(
    {
      name: role === 'orchestrator'
        ? 'orquestrador-principal'
        : role === 'reviewer'
        ? 'revisor-1'
        : 'executor-1',
      tool: '<claude-code|codex-cli|opencode|outro>',
      provider: '<anthropic|openai|google|outro>',
      model: '<modelo exato>',
      role,
      capabilities: role === 'orchestrator'
        ? ['planning', 'review']
        : ['code', 'tests'],
    },
    null,
    2,
  );

export const buildAgentConnectPrompt = (role: AgentRole): string =>
  `Você é um agente ${role} externo conectado ao Docmap.

O Docmap não vai iniciar sua CLI nem executar comandos por você. Use a API local
como plano de coordenação e faça o trabalho no seu próprio ambiente.

${
    role === 'orchestrator' || role === 'reviewer'
      ? `Papel estrito: você é SOMENTE ${
        role === 'orchestrator' ? 'orquestrador' : 'revisor'
      }. Não altere arquivos, não rode testes,
não implemente código, não crie branch/worktree, não faça commits, não faça
claim de nó executor e não chame endpoints de execução como \`/claim\`,
\`/start\` ou \`/return\` em nós. Sua atuação é decidir: decompor demandas,
criar dependências quando seu papel permitir, responder dúvidas, revisar
retornos, pedir retrabalho, expandir o workflow quando permitido e concluir
quando permitido. Se precisar de verificação prática, crie uma subdemanda de
revisão ou peça retrabalho; não execute você.`
      : ''
  }

1. Leia a skill atualizada:

   GET ${API}/system/skill

2. Conecte-se informando sua identidade real:

   POST ${API}/agents/connect
   Content-Type: application/json

${identityExample(role)}

Guarde o \`id\` retornado como \`agentSessionId\`. Envie heartbeat em
\`POST /agents/{agentSessionId}/heartbeat\` durante trabalhos longos.

${
    role === 'orchestrator'
      ? `3. Consulte sua caixa de entrada:

   GET ${API}/orchestrator/inbox?agentSessionId={agentSessionId}

Pegue um workflow em planejamento, faça claim da orquestração, crie nós e
dependências, e inicie o workflow. Depois monitore a mesma inbox. Um executor
termina apenas quando envia seu retorno; isso cria um item \`returned\`. Revise
cada retorno e registre \`approve\`, \`rework\`, \`expand\`,
\`human_intervention\` ou \`cancel\`.

Rotina obrigatória de monitoramento:

- Envie heartbeat antes de cada ciclo: POST /agents/{agentSessionId}/heartbeat
- Consulte a inbox.
- Processe todos os itens acionáveis: \`planning\`, \`returned\`, \`questions\`
  e \`completable\`.
- Se não houver ação, aguarde o \`pollAfterSeconds\` retornado pela inbox
  (padrão: 180 segundos) e consulte de novo. Não diga apenas "vou verificar";
  mantenha o loop no ambiente onde você está rodando.
- Repita até o workflow ser concluído, cancelado ou bloqueado por intervenção
  humana.`
      : role === 'reviewer'
      ? `3. Consulte sua caixa de entrada de revisão:

   GET ${API}/orchestrator/inbox?agentSessionId={agentSessionId}

Revise itens \`returned\`, responda perguntas quando tiver contexto suficiente e
registre decisões em \`/workflows/nodes/{nodeId}/decision\`. Você não assume
nós de execução e não devolve \`return\`; só revisa evidências e decide. Se não
houver ação, aguarde o \`pollAfterSeconds\` retornado pela inbox e consulte de
novo.`
      : `3. Liste trabalho compatível:

   GET ${API}/workflows/available?agentSessionId={agentSessionId}

Escolha um nó, faça claim atômico, inicie, execute e devolva resultado
estruturado. Você nunca marca o nó como done; o orquestrador revisa o retorno.`
  }

Não invente IDs e não altere estados pulando endpoints do contrato.`;

export const buildWorkflowPrompt = (
  workflow: Workflow,
  role: AgentRole,
): string => {
  const header = `Workflow alvo: ${workflow.title}
ID: ${workflow.id}
Objetivo: ${workflow.objective}
Descrição: ${workflow.description || '(sem descrição adicional)'}
Política de conflitos: ${workflow.conflictPolicy}
Máximo padrão de tentativas: ${workflow.defaultMaxAttempts}`;

  if (role === 'executor') {
    return `${buildAgentConnectPrompt(role)}

${header}

Filtre a busca por este workflow:

GET ${API}/workflows/available?workflowId=${workflow.id}&agentSessionId={agentSessionId}

Respeite as dependências, critérios de aceite, escopos e isolamento descritos em
cada pacote de execução.`;
  }

  if (role === 'reviewer') {
    return `${buildAgentConnectPrompt('reviewer')}

${header}

Este workflow é o alvo da revisão. Depois de conectar:

1. Consulte o estado completo:
   GET ${API}/workflows/${workflow.id}

2. Consulte a inbox de revisão:
   GET ${API}/orchestrator/inbox?agentSessionId={agentSessionId}

3. Quando houver nó \`returned\` deste workflow, leia as evidências e registre:
   POST ${API}/workflows/nodes/{nodeId}/decision
   {"agentSessionId":"...","decision":"approve|rework|expand|human_intervention|cancel","feedback":"..."}

Não faça claim de nó, não inicie execução e não altere arquivos.`;
  }

  return `${buildAgentConnectPrompt('orchestrator')}

${header}

Depois de conectar:

1. Faça claim:
   POST ${API}/workflows/${workflow.id}/claim-orchestration
   {"agentSessionId":"..."}

2. Consulte o estado completo:
   GET ${API}/workflows/${workflow.id}

3. Decomponha o objetivo em nós independentes com descrição, critérios de
   aceite, contexto, complexidade, capacidades, recomendação de
   ferramenta/provider/model, readScopes, writeScopes e isolamento. Não
   implemente nenhuma parte do trabalho e não execute comandos de código.

4. Crie os nós:
   POST ${API}/workflows/${workflow.id}/nodes

5. Crie dependências adicionais quando necessário:
   POST ${API}/workflows/${workflow.id}/edges
   {"fromNodeId":"...","toNodeId":"...","kind":"blocks"}

6. Inicie:
   POST ${API}/workflows/${workflow.id}/start
   {"agentSessionId":"..."}

7. A partir daqui, apenas monitore e revise. Não implemente nada, não altere
   arquivos e não execute comandos de código. Consulte continuamente:
   GET ${API}/orchestrator/inbox?agentSessionId={agentSessionId}

Loop de orquestração:

1. POST ${API}/agents/{agentSessionId}/heartbeat
2. GET ${API}/orchestrator/inbox?agentSessionId={agentSessionId}
3. Se houver \`returned\`, revise as evidências e registre decisão.
4. Se houver \`questions\`, responda ou marque a necessidade de intervenção humana.
5. Se houver \`completable\`, consolide o resultado e conclua o workflow.
6. Se não houver ação, aguarde o \`pollAfterSeconds\` retornado pela inbox
   (padrão: 180 segundos) e repita. Não encerre dizendo que vai verificar
   depois sem realmente manter essa cadência.

Quando aparecer um nó em \`returned\`, leia seu run e decida via:

POST ${API}/workflows/nodes/{nodeId}/decision
{"agentSessionId":"...","decision":"approve|rework|expand|human_intervention|cancel","feedback":"..."}

Para \`expand\`, envie também \`newNodes\`; eles dependerão automaticamente do
nó revisado. Só conclua o workflow quando \`canComplete\` for true:

POST ${API}/workflows/${workflow.id}/complete
{"agentSessionId":"...","summary":"resultado final consolidado"}`;
};

export const buildNodePrompt = (pkg: NodeExecutionPackage): string => {
  const recommendation = pkg.node.recommendedAgent
    ? JSON.stringify(pkg.node.recommendedAgent)
    : 'sem preferência';
  const dependencies = pkg.dependencies.length > 0
    ? JSON.stringify(pkg.dependencies, null, 2)
    : '[]';
  return `Você é um agente executor externo do Docmap. Execute o nó abaixo.

Antes de começar, conecte-se em \`${API}/agents/connect\` informando seu nome,
ferramenta, provider, modelo, papel \`executor\` e capacidades reais. Guarde o
\`agentSessionId\`.

Workflow: ${pkg.workflow.title}
Workflow ID: ${pkg.workflow.id}
Objetivo: ${pkg.workflow.objective}

Nó: ${pkg.node.title}
Node ID: ${pkg.node.id}
Tipo: ${pkg.node.kind}
Complexidade: ${pkg.node.complexity}
Descrição:
${pkg.node.description}

Critérios de aceite:
${
    pkg.node.acceptanceCriteria.map((item, index) => `${index + 1}. ${item}`)
      .join('\n')
  }

Contexto:
${JSON.stringify(pkg.node.contextRefs, null, 2)}

Resultados das dependências:
${dependencies}

Capacidades exigidas: ${pkg.node.requiredCapabilities.join(', ') || 'nenhuma'}
Recomendação: ${recommendation}
Escopos de leitura: ${pkg.node.readScopes.join(', ') || 'não declarados'}
Escopos de escrita: ${pkg.node.writeScopes.join(', ') || 'não declarados'}
Isolamento exigido: ${pkg.node.isolation}
Tentativas: ${pkg.node.attemptCount}/${pkg.node.maxAttempts}

Fluxo obrigatório:

1. POST ${API}/workflows/nodes/${pkg.node.id}/claim
   {"agentSessionId":"..."}

2. Prepare o ambiente. Se o isolamento for \`worktree\`, crie/use uma worktree
   no seu próprio processo. O Docmap não executa comandos.

3. POST ${API}/workflows/nodes/${pkg.node.id}/start
   {"agentSessionId":"...","workspace":{"kind":"${pkg.node.isolation}","path":"...","branch":"...","baseCommit":"..."}}

4. Envie heartbeat durante a execução:
   POST ${API}/agents/{agentSessionId}/heartbeat

5. Se precisar perguntar:
   POST ${API}/workflows/nodes/${pkg.node.id}/questions
   {"agentSessionId":"...","question":"..."}
   Consulte a resposta em GET ${API}/agents/{agentSessionId}/inbox.

6. Ao terminar, devolva:
   POST ${API}/workflows/nodes/${pkg.node.id}/return
   {
     "agentSessionId":"...",
     "outcome":"success|partial|failed|blocked|needs_input",
     "summary":"resumo curto",
     "result":"resultado detalhado",
     "logs":["comandos e fatos relevantes"],
     "changedFiles":["..."],
     "diff":"diff ou referência",
     "tests":[{"command":"...","status":"passed|failed|skipped","output":"..."}],
     "artifacts":[{"kind":"...","label":"...","ref":"..."}]
   }

O retorno deixa o nó em \`returned\`. Não tente marcá-lo como \`done\`; isso é
responsabilidade do orquestrador após revisar as evidências.`;
};
