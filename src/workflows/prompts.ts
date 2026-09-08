import type {
  AgentRole,
  NodeExecutionPackage,
  Workflow,
  WorkflowNode,
} from './types.ts';

const API = 'http://127.0.0.1:3334';
export const WORKFLOW_PROTOCOL_VERSION = '8.4';

const identityExample = (
  role: AgentRole,
  executorCapabilities: readonly string[] = [],
): string =>
  JSON.stringify(
    {
      name: role === 'orchestrator'
        ? 'orquestrador-principal'
        : role === 'reviewer'
        ? 'revisor-1'
        : '<tool>-<provider>-<modelo>-executor-<curto>',
      tool: '<claude-code|codex-cli|opencode|outro>',
      provider: '<anthropic|openai|google|outro>',
      model: '<modelo exato>',
      role,
      capabilities: role === 'orchestrator'
        ? ['planning', 'review']
        : role === 'reviewer'
        ? ['review', 'code-quality']
        : executorCapabilities.length > 0
        ? executorCapabilities
        : ['code', 'tests'],
    },
    null,
    2,
  );

const strictRole = (role: AgentRole): string =>
  role === 'executor'
    ? `Você executa nós, valida resultados e devolve evidências. Nunca aprova o
próprio retorno nem conclui o workflow. Depois do return, aguarda a decisão,
faz o retrabalho solicitado ou pega o próximo nó.`
    : `Você é SOMENTE ${role === 'orchestrator' ? 'orquestrador' : 'revisor'}.
Não altera arquivos, não implementa código, não cria branch/worktree, não faz
commit, não assume nó executor e não chama /claim, /start ou /return em nós.
Quando precisar de execução prática, cria/solicita um nó executor.`;

export const buildRoleProtocol = (role: AgentRole): string => {
  const common = `# Protocolo Docmap Workflows v${WORKFLOW_PROTOCOL_VERSION}

${strictRole(role)}

Fonte da verdade: a API local ${API}. Não dependa da memória da conversa para
retomar trabalho. Não invente IDs nem pule estados. Consultar a inbox renova sua
presença; durante operações longas, envie heartbeat. Busque payloads compactos
primeiro; use views completas somente quando faltar evidência. Para esperar
trabalho, prefira a inbox bloqueante com wait=600: ela retorna imediatamente
quando há ação e, caso contrário, aguarda um evento sem consumir tokens do
modelo. Em timeout, repita a chamada imediatamente, sem sleep. Use
pollAfterSeconds somente como fallback se sua ferramenta não suportar uma
requisição HTTP bloqueante.`;

  if (role === 'orchestrator') {
    return `${common}

## Loop obrigatório

1. consultar /orchestrator/inbox?compact=true&wait=600;
2. processar nextActions em ordem de priority, sem pular review_return;
3. revisar cada critério como pass|fail|insufficient e registrar evidência;
4. usar o decisionRequest do pacote de revisão, preenchendo seus campos;
5. decidir approve|rework|expand|human_intervention|cancel;
6. em timeout, repetir imediatamente a inbox bloqueante;
7. repetir até estado terminal.

Nunca crie um nó para representar uma aprovação e nunca crie nós com nomes como
"aprovado". Aprovação existe somente via POST /decision. Antes de expandir o
plano, drene todos os review_return já presentes na inbox.

## Planejamento eficiente

- Comece por GET /workflows/{id}?view=planning.
- Para demandas grandes/incertas, crie uma onda curta de discovery com modelos
  econômicos para mapear arquitetura, testes e riscos; sintetize os briefings.
- Paralelize apenas nós sem dependência lógica e sem writeScopes conflitantes.
- Todo critério deve declarar resultado observável e evidência esperada.
- Crie as barreiras finais por POST /workflows/{id}/final-barriers; o servidor
  cria/reutiliza nós kind=quality_gate e kind=final_audit e liga
  automaticamente todas as folhas.
- Se houver correções posteriores, chame final-barriers novamente.
- Nunca conclua enquanto completionReadiness.canComplete for false.`;
  }

  if (role === 'reviewer') {
    return `${common}

Revise de forma independente objetivo, critérios, evidências, diff, riscos de
regressão, bugs, crashes, efeitos não intencionais e qualidade. Classifique
achados por severidade. Toda aprovação deve enviar acceptanceChecks com status
e evidência para cada critério; aprove apenas quando todos forem pass. Consulte
primeiro /workflows/nodes/{id}?view=review e abra o detalhe completo sob demanda.`;
  }

  return `${common}

## Loop obrigatório do worker

1. consultar /agents/{agentSessionId}/inbox?wait=600;
2. seguir nextAction;
3. claim -> start -> executar -> validar -> return;
4. em await_review, manter a inbox bloqueante até chegar a decisão;
5. em rework, reler feedback, assumir o mesmo nó e corrigir;
6. em claim_next, fazer checkpoint, compactar/resetar contexto se suportado e
   assumir próximo nó;
7. em capability_mismatch, ler missingCapabilities e reconectar declarando
   somente capacidades que sua ferramenta realmente possui;
8. em wait ou timeout, repetir imediatamente a inbox bloqueante;
9. parar apenas em stop, intervenção humana ou ordem explícita do operador.

O POST /return NÃO encerra seu trabalho. Nunca compacte antes da revisão:
detalhes ainda podem ser necessários para retrabalho.`;
};

export const buildAgentConnectPrompt = (
  role: AgentRole,
  executorCapabilities: readonly string[] = [],
  workflowId?: string,
): string =>
  `${buildRoleProtocol(role)}

Este prompt já contém o protocolo necessário. Consulte
GET ${API}/workflows/protocol?role=${role} apenas ao retomar uma sessão ou se a
versão local for diferente de ${WORKFLOW_PROTOCOL_VERSION}.

Conecte-se informando sua identidade real:

- \`name\` deve ser único e identificável, sem copiar literalmente o exemplo.
- \`tool\`, \`provider\` e \`model\` devem refletir a ferramenta e modelo reais.

POST ${API}/agents/connect
Content-Type: application/json

${identityExample(role, executorCapabilities)}

Guarde o \`agentSessionId\` retornado.

${
    role === 'orchestrator'
      ? `Consulte:
GET ${API}/orchestrator/inbox?agentSessionId={agentSessionId}&compact=true&wait=600`
      : `Consulte:
GET ${API}/agents/{agentSessionId}/inbox?${
        workflowId ? `workflowId=${workflowId}&` : ''
      }wait=600`
  }`;

export const buildWorkflowPrompt = (
  workflow: Workflow,
  role: AgentRole,
  nodes: readonly WorkflowNode[] = [],
): string => {
  const workflowCapabilities = [
    ...new Set(nodes.flatMap((node) => node.requiredCapabilities)),
  ];
  const header = `Workflow alvo: ${workflow.title}
ID: ${workflow.id}
Objetivo: ${workflow.objective}
Descrição: ${workflow.description || '(sem descrição adicional)'}
Política de conflitos: ${workflow.conflictPolicy}
Máximo padrão de tentativas: ${workflow.defaultMaxAttempts}
Quality gate obrigatório: ${workflow.completionPolicy.requireQualityGate}
Auditoria final obrigatória: ${workflow.completionPolicy.requireFinalAudit}`;

  if (role === 'executor') {
    return `${
      buildAgentConnectPrompt(
        role,
        workflowCapabilities,
        workflow.id,
      )
    }

${header}

As capacidades no payload de conexão foram derivadas dos nós atuais deste
workflow: ${workflowCapabilities.join(', ') || 'code, tests'}. Não remova itens,
pois a API usa correspondência estrita para distribuir trabalho.

Trabalhe somente neste workflow. Consulte a inbox e filtre trabalho por:

GET ${API}/agents/{agentSessionId}/inbox?workflowId=${workflow.id}&wait=600

Para inspeção sem espera:
GET ${API}/workflows/available?workflowId=${workflow.id}&agentSessionId={agentSessionId}

Respeite dependências, critérios, escopos e isolamento. Após cada return,
aguarde a decisão pela inbox. Se aprovado, preserve apenas um checkpoint mínimo
(agentSessionId, workflowId, workspace e último run), compacte o contexto se a
ferramenta permitir e busque o próximo nó. Não encerre enquanto houver
nextAction acionável.`;
  }

  if (role === 'reviewer') {
    return `${buildAgentConnectPrompt('reviewer')}

${header}

Revise somente este workflow. Para cada item returned:

1. GET ${API}/workflows/nodes/{nodeId}?view=review
2. Compare cada critério com evidência concreta.
3. Abra GET ${API}/workflows/nodes/{nodeId} apenas se o pacote compacto não
   bastar.
4. Copie o decisionRequest retornado pelo pacote, substitua agentSessionId,
   preencha evidências e envie para a URL indicada. Não redigite critérios.

Em final_audit, procure qualidade de código, bugs, edge cases, crashes,
regressões e mudanças fora do escopo.`;
  }

  return `${buildAgentConnectPrompt('orchestrator')}

${header}

Depois de conectar:

1. Faça claim:
   POST ${API}/workflows/${workflow.id}/claim-orchestration
   {"agentSessionId":"..."}

2. Leia apenas o pacote de planejamento:
   GET ${API}/workflows/${workflow.id}?view=planning

3. Classifique a demanda:
   - pequena/clara: decomponha diretamente;
   - média/grande/incerta: crie primeiro nós discovery econômicos para
     arquitetura/impacto, testes/comandos e riscos/regressões. Após os retornos,
     sintetize e expanda o plano.

4. Construa um DAG de entregáveis coesos:
   - paralelize apenas trabalho realmente independente;
   - serialize writeScopes sobrepostos;
   - cada nó deve ter critérios observáveis, evidência esperada, contexto,
     complexidade, capacidades, readScopes, writeScopes e isolamento;
   - prefira resumos/refs e abra arquivos/diffs completos sob demanda.
   - inclua agentSessionId em toda criação de nó ou aresta para renovar presença.

5. Crie/repare as barreiras finais em uma única chamada idempotente:

   POST ${API}/workflows/${workflow.id}/final-barriers
   {"agentSessionId":"..."}

O servidor identifica as folhas, cria/reutiliza quality_gate e final_audit e
liga as arestas. Não crie essas barreiras manualmente.

Se um executor criar macro agregadora para o gate, ela deve usar:
{"lifecycle":"workflow","workflowId":"${workflow.id}"}
O servidor arquiva o script/hash e remove a macro ao concluir.

6. Inicie:
   POST ${API}/workflows/${workflow.id}/start
   {"agentSessionId":"..."}

## Loop de decisão

1. GET ${API}/orchestrator/inbox?agentSessionId={agentSessionId}&compact=true&wait=600
2. Execute nextActions em ordem de priority. Drene review_return antes de criar
   ou expandir qualquer nó.
3. Para cada review_return, abra:
   GET ${API}/workflows/nodes/{nodeId}?view=review
4. Use o decisionRequest retornado, apenas substituindo agentSessionId,
   decisão, feedback e evidências. Não redigite os critérios.
5. Aprove apenas com evidência suficiente. Feedback de rework deve ser
   específico, verificável e limitado ao gap.
6. Se discovery revelar trabalho, use expand/crie nós e arestas.
7. Se gate/auditoria revelar problema, crie correções e depois chame
   /final-barriers novamente.
8. Se wait.reason=timeout, repita imediatamente a mesma chamada. Não use sleep.

Só conclua quando a inbox trouxer o workflow em completable e
\`completionReadiness.canComplete=true\`:

POST ${API}/workflows/${workflow.id}/complete
{"agentSessionId":"...","summary":"resultado, gates, auditoria e riscos residuais"}`;
};

const nodeKindProtocol = (pkg: NodeExecutionPackage): string => {
  if (pkg.node.kind === 'quality_gate') {
    return `Este é um QUALITY GATE. Não altere código. Execute todos os checks
oficiais do projeto e os específicos da demanda: format, lint, typecheck,
testes, build e smoke/startup quando aplicáveis. Registre cada comando, status e
evidência. outcome=success somente se todos os checks obrigatórios passarem.
Se criar uma macro agregadora no Docmap, use lifecycle=workflow e
workflowId=${pkg.workflow.id}; não a apague manualmente.`;
  }
  if (pkg.node.kind === 'final_audit') {
    const isolatedDeps = pkg.dependencies.filter((dep) =>
      dep.workspace &&
      (dep.workspace.kind === 'worktree' || dep.workspace.kind === 'branch')
    );
    const workspaceAudit = isolatedDeps.length > 0
      ? `


Critérios de integridade de workspaces isolados — ${isolatedDeps.length} nó(s) rodaram em isolamento:

${
        isolatedDeps.map((dep, i) =>
          `${i + 1}. Nó "${dep.title}" (${dep.nodeId}):
   - Isolamento: ${dep.workspace!.kind}
   - Path: ${dep.workspace!.path ?? 'não reportado'}
   - Branch: ${dep.workspace!.branch ?? 'não reportado'}
   - Base commit: ${dep.workspace!.baseCommit ?? 'não reportado'}`
        ).join('\n')
      }

Verifique:
1. Cada branch/worktree acima foi mergeada na branch base? Se alguma não foi,
   o diff consolidado está incompleto.
2. Há conflitos de merge não resolvidos?
3. O diff final contém contribuições de todos os nós isolados?
4. Alguma worktree ficou órfã (sem merge e sem descarte documentado)?

Se qualquer verificação falhar, verdict=changes_required e descreva exatamente
quais branches/worktrees estão pendentes. Se todos os nós usaram shared,
marque esta seção como N/A.`
      : '';

    return `Esta é uma AUDITORIA FINAL independente e read-only. Não altere
código. Revise objetivo, diff consolidado, arquitetura, legibilidade, erros,
edge cases, crashes, concorrência, segurança, regressões, efeitos fora do
escopo e cobertura.${workspaceAudit}

No result, informe verdict=pass|changes_required|blocked,
findings com severity/category/evidence/expectedFix e residualRisks.
outcome=success somente com verdict=pass e sem achados critical/high.`;
  }
  if (pkg.node.kind === 'discovery') {
    return `Este é um nó DISCOVERY. Não implemente. Produza briefing curto e
estruturado com fatos, caminhos, comandos, riscos, incertezas e recomendações
para o orquestrador. Evite despejar arquivos ou logs completos.`;
  }
  return 'Implemente apenas o escopo deste nó e valide todos os critérios.';
};

export const buildNodePrompt = (pkg: NodeExecutionPackage): string => {
  const recommendation = pkg.node.recommendedAgent
    ? JSON.stringify(pkg.node.recommendedAgent)
    : 'sem preferência';
  const dependencies = pkg.dependencies.length > 0
    ? JSON.stringify(pkg.dependencies, null, 2)
    : '[]';
  return `${
    buildAgentConnectPrompt(
      'executor',
      pkg.node.requiredCapabilities,
      pkg.workflow.id,
    )
  }

Execute o nó abaixo e depois permaneça no loop do worker.

Workflow: ${pkg.workflow.title}
Workflow ID: ${pkg.workflow.id}
Objetivo: ${pkg.workflow.objective}

Nó: ${pkg.node.title}
Node ID: ${pkg.node.id}
Tipo: ${pkg.node.kind}
Complexidade: ${pkg.node.complexity}
Descrição:
${pkg.node.description}

Instrução do tipo:
${nodeKindProtocol(pkg)}

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

## Execução

1. POST ${API}/workflows/nodes/${pkg.node.id}/claim
   {"agentSessionId":"..."}

2. Prepare o ambiente exigido.

3. POST ${API}/workflows/nodes/${pkg.node.id}/start
   {"agentSessionId":"...","workspace":{"kind":"${pkg.node.isolation}","path":"...","branch":"...","baseCommit":"..."}}

4. Envie heartbeat durante trabalhos longos.

5. Se precisar perguntar:
   POST ${API}/workflows/nodes/${pkg.node.id}/questions
   {"agentSessionId":"...","question":"..."}
   Consulte a resposta na inbox.

6. Antes de devolver, avalie cada critério e registre evidência. Então:
   POST ${API}/workflows/nodes/${pkg.node.id}/return
   {
     "agentSessionId":"...",
     "outcome":"success|partial|failed|blocked|needs_input",
     "summary":"resumo curto",
     "result":"resultado detalhado e critérios verificados",
     "logs":["fatos relevantes"],
     "changedFiles":["..."],
     "diff":"diff ou referência",
     "tests":[{"command":"...","status":"passed|failed|skipped","output":"..."}],
     "artifacts":[{"kind":"...","label":"...","ref":"..."}]
   }

## Depois do return — obrigatório

Não encerre e não marque done. Consulte:

GET ${API}/agents/{agentSessionId}/inbox?wait=600

- await_review: repita a inbox bloqueante até chegar a decisão;
- rework: leia feedback, faça claim do mesmo nó e execute nova tentativa;
- claim_next: somente após aprovação, faça checkpoint/compact se suportado e
  assuma o próximo nó deste workflow;
- wait ou wait.reason=timeout: repita imediatamente a chamada, sem sleep;
- stop: desconecte e encerre.

O estado persistido no Docmap deve permitir retomada mesmo após compactação.`;
};
