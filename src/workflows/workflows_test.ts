import { workflowsHandler } from './handler.ts';

const assert: (
  condition: unknown,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const withKv = async (run: (kv: Deno.Kv) => Promise<void>): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'docmap-workflows-' });
  const kv = await Deno.openKv(`${dir}/test.sqlite3`);
  try {
    await run(kv);
  } finally {
    kv.close();
    await Deno.remove(dir, { recursive: true });
  }
};

const request = async (
  kv: Deno.Kv,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> => {
  const url = new URL(`http://127.0.0.1:3334${path}`);
  const req = new Request(url, {
    method,
    ...(body
      ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
      : {}),
  });
  return await workflowsHandler(kv)(req, url);
};

const jsonBody = async (
  response: Response,
): Promise<Record<string, unknown>> => {
  const data = await response.json();
  return data as Record<string, unknown>;
};

Deno.test('workflow externo libera dependências somente após revisão', async () => {
  await withKv(async (kv) => {
    const workflowRes = await request(kv, 'POST', '/workflows', {
      title: 'Fluxo de teste',
      objective: 'Validar coordenação',
      defaultMaxAttempts: 2,
      conflictPolicy: 'block',
    });
    assert(workflowRes.status === 201, 'workflow não foi criado');
    const workflow = await jsonBody(workflowRes);
    const workflowId = String(workflow.id);

    const orchestratorRes = await request(kv, 'POST', '/agents/connect', {
      name: 'orquestrador',
      tool: 'claude-code',
      provider: 'anthropic',
      model: 'claude',
      role: 'orchestrator',
      capabilities: ['planning', 'review'],
    });
    const orchestrator = await jsonBody(orchestratorRes);
    const orchestratorId = String(orchestrator.agentSessionId);

    const claimOrchestration = await request(
      kv,
      'POST',
      `/workflows/${workflowId}/claim-orchestration`,
      { agentSessionId: orchestratorId },
    );
    assert(claimOrchestration.ok, 'orquestrador não assumiu workflow');

    const firstRes = await request(
      kv,
      'POST',
      `/workflows/${workflowId}/nodes`,
      {
        title: 'Primeiro nó',
        description: 'Produzir base',
        acceptanceCriteria: ['base pronta'],
        complexity: 's',
        kind: 'code',
        requiredCapabilities: ['code'],
        writeScopes: ['src/base'],
      },
    );
    const first = await jsonBody(firstRes);
    const firstId = String(first.id);

    const secondRes = await request(
      kv,
      'POST',
      `/workflows/${workflowId}/nodes`,
      {
        title: 'Segundo nó',
        description: 'Consumir base',
        acceptanceCriteria: ['integração pronta'],
        complexity: 'm',
        kind: 'code',
        requiredCapabilities: ['code'],
        writeScopes: ['src/integration'],
        dependsOn: [firstId],
      },
    );
    const second = await jsonBody(secondRes);
    const secondId = String(second.id);

    const start = await request(
      kv,
      'POST',
      `/workflows/${workflowId}/start`,
      { agentSessionId: orchestratorId },
    );
    assert(start.ok, 'workflow não iniciou');

    const detailBefore = await jsonBody(
      await request(kv, 'GET', `/workflows/${workflowId}`),
    );
    const nodesBefore = detailBefore.nodes as Array<Record<string, unknown>>;
    assert(
      nodesBefore.find((node) => node.id === firstId)?.status === 'ready',
      'primeiro nó deveria estar pronto',
    );
    assert(
      nodesBefore.find((node) => node.id === secondId)?.status === 'pending',
      'dependente deveria continuar pendente',
    );

    const executorRes = await request(kv, 'POST', '/agents/connect', {
      name: 'executor',
      tool: 'codex-cli',
      provider: 'openai',
      model: 'codex',
      role: 'executor',
      capabilities: ['code'],
    });
    const executor = await jsonBody(executorRes);
    const executorId = String(executor.agentSessionId);

    const orchestratorClaim = await request(
      kv,
      'POST',
      `/workflows/nodes/${firstId}/claim`,
      { agentSessionId: orchestratorId },
    );
    assert(
      orchestratorClaim.status === 400,
      'orquestrador não deveria conseguir executar nó',
    );

    const reviewerRes = await request(kv, 'POST', '/agents/connect', {
      name: 'revisor',
      tool: 'claude-code',
      provider: 'anthropic',
      model: 'claude',
      role: 'reviewer',
      capabilities: ['code'],
    });
    const reviewer = await jsonBody(reviewerRes);
    const reviewerClaim = await request(
      kv,
      'POST',
      `/workflows/nodes/${firstId}/claim`,
      { agentSessionId: String(reviewer.agentSessionId) },
    );
    assert(
      reviewerClaim.status === 400,
      'revisor não deveria conseguir executar nó',
    );

    const claim = await request(
      kv,
      'POST',
      `/workflows/nodes/${firstId}/claim`,
      { agentSessionId: executorId },
    );
    assert(claim.ok, 'executor não conseguiu claim');

    const otherExecutorRes = await request(kv, 'POST', '/agents/connect', {
      name: 'executor-2',
      tool: 'opencode',
      provider: 'google',
      model: 'gemini',
      role: 'executor',
      capabilities: ['code'],
    });
    const otherExecutor = await jsonBody(otherExecutorRes);
    const duplicateClaim = await request(
      kv,
      'POST',
      `/workflows/nodes/${firstId}/claim`,
      { agentSessionId: String(otherExecutor.agentSessionId) },
    );
    assert(duplicateClaim.status === 409, 'claim duplicado deveria falhar');

    assert(
      (
        await request(kv, 'POST', `/workflows/nodes/${firstId}/start`, {
          agentSessionId: executorId,
        })
      ).ok,
      'run não iniciou',
    );
    assert(
      (
        await request(kv, 'POST', `/workflows/nodes/${firstId}/return`, {
          agentSessionId: executorId,
          outcome: 'success',
          summary: 'Base pronta',
          result: 'Implementação validada',
          logs: ['check ok'],
          changedFiles: ['src/base/store.ts'],
          tests: [{ command: 'deno check', status: 'passed' }],
          artifacts: [],
        })
      ).ok,
      'retorno falhou',
    );

    const inbox = await jsonBody(
      await request(
        kv,
        'GET',
        `/orchestrator/inbox?agentSessionId=${orchestratorId}`,
      ),
    );
    assert(
      inbox.pollAfterSeconds === 180,
      'inbox do orquestrador deveria sugerir cadência de polling',
    );
    assert(
      (inbox.role as Record<string, unknown>).canExecuteNodes === false,
      'inbox deveria reforçar que orquestrador não executa nós',
    );
    const returned = inbox.returned as Array<Record<string, unknown>>;
    assert(
      returned.some((node) => node.id === firstId),
      'retorno não apareceu na inbox',
    );

    const detailReturned = await jsonBody(
      await request(kv, 'GET', `/workflows/${workflowId}`),
    );
    const returnedNodes = detailReturned.nodes as Array<
      Record<string, unknown>
    >;
    assert(
      returnedNodes.find((node) => node.id === secondId)?.status === 'pending',
      'retorno sem aprovação não pode liberar dependente',
    );

    const approval = await request(
      kv,
      'POST',
      `/workflows/nodes/${firstId}/decision`,
      {
        agentSessionId: orchestratorId,
        decision: 'approve',
        feedback: 'Aceito',
      },
    );
    assert(approval.ok, 'aprovação falhou');

    const detailApproved = await jsonBody(
      await request(kv, 'GET', `/workflows/${workflowId}`),
    );
    const approvedNodes = detailApproved.nodes as Array<
      Record<string, unknown>
    >;
    assert(
      approvedNodes.find((node) => node.id === secondId)?.status === 'ready',
      'aprovação deveria liberar dependente',
    );
  });
});

Deno.test('retorno humano envia nó disponível para revisão', async () => {
  await withKv(async (kv) => {
    const workflow = await jsonBody(
      await request(kv, 'POST', '/workflows', {
        title: 'Trabalho manual',
        objective: 'Permitir execução pelo usuário',
      }),
    );
    const workflowId = String(workflow.id);
    const orchestrator = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'orquestrador',
        tool: 'claude-code',
        provider: 'anthropic',
        model: 'claude',
        role: 'orchestrator',
      }),
    );
    const orchestratorId = String(orchestrator.agentSessionId);
    await request(
      kv,
      'POST',
      `/workflows/${workflowId}/claim-orchestration`,
      { agentSessionId: orchestratorId },
    );
    const node = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        title: 'Checagem manual',
        description: 'Executar fora de uma IA',
        acceptanceCriteria: ['evidência registrada'],
        complexity: 'xs',
      }),
    );
    const nodeId = String(node.id);
    await request(kv, 'POST', `/workflows/${workflowId}/start`, {
      agentSessionId: orchestratorId,
    });

    const humanReturn = await request(
      kv,
      'POST',
      `/workflows/nodes/${nodeId}/human-return`,
      {
        summary: 'Validei manualmente',
        changedFiles: ['docs/checklist.md'],
      },
    );
    assert(humanReturn.ok, 'retorno humano falhou');
    const run = await jsonBody(humanReturn);
    assert(run.status === 'returned', 'run manual deveria aguardar revisão');

    const detail = await jsonBody(
      await request(kv, 'GET', `/workflows/${workflowId}`),
    );
    const nodes = detail.nodes as Array<Record<string, unknown>>;
    assert(
      nodes.find((item) => item.id === nodeId)?.status === 'returned',
      'nó manual deveria ficar em revisão',
    );
    assert(
      nodes.find((item) => item.id === nodeId)?.claimedBySessionId ===
        run.agentSessionId,
      'nó deveria apontar para a sessão humana sintética',
    );

    const inbox = await jsonBody(
      await request(
        kv,
        'GET',
        `/orchestrator/inbox?agentSessionId=${orchestratorId}`,
      ),
    );
    const returned = inbox.returned as Array<Record<string, unknown>>;
    assert(
      returned.some((item) => item.id === nodeId),
      'retorno humano não apareceu para o orquestrador',
    );

    const approval = await request(
      kv,
      'POST',
      `/workflows/nodes/${nodeId}/decision`,
      {
        agentSessionId: orchestratorId,
        decision: 'approve',
        feedback: 'Aceito',
      },
    );
    assert(approval.ok, 'orquestrador não aprovou retorno humano');
  });
});

Deno.test('dúvida volta para o executor e limite encerra retrabalho', async () => {
  await withKv(async (kv) => {
    const workflow = await jsonBody(
      await request(kv, 'POST', '/workflows', {
        title: 'Retrabalho',
        objective: 'Validar parada',
        defaultMaxAttempts: 1,
      }),
    );
    const workflowId = String(workflow.id);
    const orchestrator = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'orquestrador',
        tool: 'claude-code',
        provider: 'anthropic',
        model: 'claude',
        role: 'orchestrator',
      }),
    );
    const orchestratorId = String(orchestrator.agentSessionId);
    await request(
      kv,
      'POST',
      `/workflows/${workflowId}/claim-orchestration`,
      { agentSessionId: orchestratorId },
    );
    const node = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        title: 'Nó único',
        description: 'Executar',
        acceptanceCriteria: ['feito'],
      }),
    );
    const nodeId = String(node.id);
    await request(kv, 'POST', `/workflows/${workflowId}/start`, {
      agentSessionId: orchestratorId,
    });
    const executor = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'executor',
        tool: 'opencode',
        provider: 'openai',
        model: 'modelo',
        role: 'executor',
      }),
    );
    const executorId = String(executor.agentSessionId);
    await request(kv, 'POST', `/workflows/nodes/${nodeId}/claim`, {
      agentSessionId: executorId,
    });
    await request(kv, 'POST', `/workflows/nodes/${nodeId}/start`, {
      agentSessionId: executorId,
    });
    const question = await jsonBody(
      await request(kv, 'POST', `/workflows/nodes/${nodeId}/questions`, {
        agentSessionId: executorId,
        question: 'Qual formato?',
      }),
    );
    assert(
      (
        await request(
          kv,
          'POST',
          `/workflows/questions/${String(question.id)}/answer`,
          {
            agentSessionId: orchestratorId,
            answer: 'Use JSON',
          },
        )
      ).ok,
      'resposta falhou',
    );
    const executorInbox = await jsonBody(
      await request(kv, 'GET', `/agents/${executorId}/inbox`),
    );
    const questions = executorInbox.questions as Array<Record<string, unknown>>;
    assert(
      questions.some((item) => item.status === 'answered'),
      'executor não recebeu resposta',
    );
    await request(kv, 'POST', `/workflows/nodes/${nodeId}/return`, {
      agentSessionId: executorId,
      outcome: 'failed',
      summary: 'Não concluído',
      logs: [],
      changedFiles: [],
      tests: [],
      artifacts: [],
    });
    await request(kv, 'POST', `/workflows/nodes/${nodeId}/decision`, {
      agentSessionId: orchestratorId,
      decision: 'rework',
      feedback: 'Tente novamente',
    });
    const detail = await jsonBody(
      await request(kv, 'GET', `/workflows/${workflowId}`),
    );
    const nodes = detail.nodes as Array<Record<string, unknown>>;
    assert(
      nodes.find((item) => item.id === nodeId)?.status ===
        'human_intervention',
      'limite deveria exigir intervenção humana',
    );
  });
});
