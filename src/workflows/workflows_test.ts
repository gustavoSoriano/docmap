import { workflowsHandler } from './handler.ts';
import {
  createMacro,
  getMacroById,
  listWorkflowMacroArchives,
} from '../macros/store.ts';

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

const passedChecks = (...criteria: string[]) =>
  criteria.map((criterion) => ({
    criterion,
    status: 'pass',
    evidence: `Evidência verificada para: ${criterion}`,
  }));

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
      inbox.pollAfterSeconds === 15,
      'inbox acionável deveria sugerir polling curto',
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
    const executorWaitingInbox = await jsonBody(
      await request(kv, 'GET', `/agents/${executorId}/inbox`),
    );
    assert(
      executorWaitingInbox.nextAction === 'await_review',
      'executor deveria aguardar revisão após return',
    );
    assert(
      (executorWaitingInbox.awaitingReview as Array<Record<string, unknown>>)
        .some((item) => item.nodeId === firstId),
      'inbox do executor deveria preservar o run devolvido',
    );
    const reviewPacket = await jsonBody(
      await request(
        kv,
        'GET',
        `/workflows/nodes/${firstId}?view=review`,
      ),
    );
    const decisionRequest = reviewPacket.decisionRequest as Record<
      string,
      unknown
    >;
    const decisionBody = decisionRequest.body as Record<string, unknown>;
    assert(
      (decisionBody.acceptanceChecks as Array<Record<string, unknown>>)[0]
        .criterion === 'base pronta',
      'pacote de revisão deveria fornecer critério exato no payload pronto',
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

    const executorBlockingInbox = request(
      kv,
      'GET',
      `/agents/${executorId}/inbox?wait=2`,
    ).then(jsonBody);
    const approval = await request(
      kv,
      'POST',
      `/workflows/nodes/${firstId}/decision`,
      {
        agentSessionId: orchestratorId,
        decision: 'approve',
        feedback: 'Aceito',
        acceptanceChecks: passedChecks('base pronta'),
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
    const executorApprovedInbox = await executorBlockingInbox;
    assert(
      executorApprovedInbox.nextAction === 'claim_next',
      'inbox bloqueante deveria despertar com o próximo trabalho',
    );
    const wait = executorApprovedInbox.wait as Record<string, unknown>;
    assert(
      wait.reason === 'actionable' && wait.trigger === 'event',
      'inbox bloqueante deveria informar despertar por evento',
    );
    assert(
      (executorApprovedInbox.reviewedRuns as Array<Record<string, unknown>>)
        .some((item) => item.nodeId === firstId && item.status === 'approved'),
      'decisão aprovada deveria aparecer na inbox do executor',
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
        acceptanceChecks: passedChecks('evidência registrada'),
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

Deno.test('retrabalho permanece com executor original enquanto sessão está ativa', async () => {
  await withKv(async (kv) => {
    const workflow = await jsonBody(
      await request(kv, 'POST', '/workflows', {
        title: 'Afinidade de retrabalho',
        objective: 'Preservar contexto do executor',
        defaultMaxAttempts: 2,
      }),
    );
    const workflowId = String(workflow.id);
    const orchestrator = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'orquestrador',
        tool: 'codex-cli',
        provider: 'openai',
        model: 'modelo',
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
        title: 'Implementar',
        description: 'Executar e corrigir',
        acceptanceCriteria: ['resultado validado'],
      }),
    );
    const nodeId = String(node.id);
    await request(kv, 'POST', `/workflows/${workflowId}/start`, {
      agentSessionId: orchestratorId,
    });

    const firstExecutor = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'executor-1',
        tool: 'codex-cli',
        provider: 'openai',
        model: 'modelo',
        role: 'executor',
      }),
    );
    const firstExecutorId = String(firstExecutor.agentSessionId);
    const secondExecutor = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'executor-2',
        tool: 'opencode',
        provider: 'openai',
        model: 'modelo',
        role: 'executor',
      }),
    );
    const secondExecutorId = String(secondExecutor.agentSessionId);

    await request(kv, 'POST', `/workflows/nodes/${nodeId}/claim`, {
      agentSessionId: firstExecutorId,
    });
    await request(kv, 'POST', `/workflows/nodes/${nodeId}/start`, {
      agentSessionId: firstExecutorId,
    });
    await request(kv, 'POST', `/workflows/nodes/${nodeId}/return`, {
      agentSessionId: firstExecutorId,
      outcome: 'partial',
      summary: 'Precisa de ajuste',
      logs: [],
      changedFiles: [],
      tests: [],
      artifacts: [],
    });
    await request(kv, 'POST', `/workflows/nodes/${nodeId}/decision`, {
      agentSessionId: orchestratorId,
      decision: 'rework',
      feedback: 'Corrigir o caso limite',
    });

    const originalInbox = await jsonBody(
      await request(kv, 'GET', `/agents/${firstExecutorId}/inbox`),
    );
    assert(
      originalInbox.nextAction === 'rework',
      'executor original deveria receber retrabalho',
    );
    const otherAvailable = await jsonBody(
      await request(
        kv,
        'GET',
        `/agents/${secondExecutorId}/inbox`,
      ),
    );
    assert(
      !(otherAvailable.available as Array<Record<string, unknown>>).some(
        (item) =>
          (item.node as Record<string, unknown> | undefined)?.id === nodeId,
      ),
      'retrabalho não deveria aparecer para outro executor ativo',
    );

    await request(
      kv,
      'POST',
      `/agents/${firstExecutorId}/disconnect`,
    );
    const releasedAvailable = await jsonBody(
      await request(kv, 'GET', `/agents/${secondExecutorId}/inbox`),
    );
    assert(
      (releasedAvailable.available as Array<Record<string, unknown>>).some(
        (item) =>
          (item.node as Record<string, unknown> | undefined)?.id === nodeId,
      ),
      'retrabalho deveria voltar ao pool após desconexão',
    );
  });
});

Deno.test('barreiras finais, macro efêmera e conclusão verificável', async () => {
  await withKv(async (kv) => {
    const workflow = await jsonBody(
      await request(kv, 'POST', '/workflows', {
        title: 'Fechamento rigoroso',
        objective: 'Validar gate e auditoria',
      }),
    );
    const workflowId = String(workflow.id);
    const work = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        title: 'Implementação',
        description: 'Entregar funcionalidade',
        acceptanceCriteria: ['funcionalidade pronta'],
        kind: 'code',
      }),
    );
    const workId = String(work.id);
    const gate = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        title: 'Quality gate',
        description: 'Executar checks oficiais',
        acceptanceCriteria: ['checks obrigatórios passam'],
        kind: 'quality_gate',
        dependsOn: [workId],
      }),
    );
    const gateId = String(gate.id);
    const audit = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        title: 'Auditoria final',
        description: 'Revisar riscos e regressões',
        acceptanceCriteria: ['verdict pass sem achado crítico'],
        kind: 'final_audit',
        dependsOn: [gateId],
      }),
    );
    const auditId = String(audit.id);

    await request(kv, 'POST', `/workflows/${workflowId}/start`, {});

    const workReturn = await request(
      kv,
      'POST',
      `/workflows/nodes/${workId}/human-return`,
      { summary: 'Implementação pronta' },
    );
    assert(workReturn.ok, 'retorno da implementação falhou');
    const uncheckedApproval = await request(
      kv,
      'POST',
      `/workflows/nodes/${workId}/decision`,
      { decision: 'approve', feedback: 'Sem checklist' },
    );
    assert(
      uncheckedApproval.status === 409,
      'aprovação sem checks de aceite deveria ser bloqueada',
    );
    const workApproval = await request(
      kv,
      'POST',
      `/workflows/nodes/${workId}/decision`,
      {
        decision: 'approve',
        feedback: 'Evidência suficiente',
        acceptanceChecks: passedChecks('funcionalidade pronta'),
      },
    );
    assert(workApproval.ok, 'aprovação da implementação falhou');

    const partialGateReturn = await request(
      kv,
      'POST',
      `/workflows/nodes/${gateId}/human-return`,
      { summary: 'Gate parcial', outcome: 'partial' },
    );
    assert(partialGateReturn.ok, 'retorno parcial do gate falhou');
    const invalidGateApproval = await request(
      kv,
      'POST',
      `/workflows/nodes/${gateId}/decision`,
      {
        decision: 'approve',
        feedback: 'Aprovação indevida',
        acceptanceChecks: passedChecks('checks obrigatórios passam'),
      },
    );
    assert(
      invalidGateApproval.status === 409,
      'gate sem outcome=success não deveria ser aprovado',
    );
    const gateRework = await request(
      kv,
      'POST',
      `/workflows/nodes/${gateId}/decision`,
      { decision: 'rework', feedback: 'Corrigir checks que falharam' },
    );
    assert(gateRework.ok, 'gate parcial deveria aceitar retrabalho');

    for (
      const [nodeId, summary, criterion] of [
        [gateId, 'Gate passou', 'checks obrigatórios passam'],
        [auditId, 'Auditoria passou', 'verdict pass sem achado crítico'],
      ]
    ) {
      const returned = await request(
        kv,
        'POST',
        `/workflows/nodes/${nodeId}/human-return`,
        { summary },
      );
      assert(returned.ok, `retorno humano falhou para ${nodeId}`);
      const approved = await request(
        kv,
        'POST',
        `/workflows/nodes/${nodeId}/decision`,
        {
          decision: 'approve',
          feedback: 'Evidência suficiente',
          acceptanceChecks: passedChecks(criterion),
        },
      );
      assert(approved.ok, `aprovação falhou para ${nodeId}`);
    }

    const detail = await jsonBody(
      await request(kv, 'GET', `/workflows/${workflowId}`),
    );
    assert(detail.canComplete === true, 'barreiras deveriam liberar conclusão');
    assert(
      (detail.completionReadiness as Record<string, unknown>).canComplete ===
        true,
      'readiness deveria estar explícita',
    );

    const macro = await createMacro(kv, {
      name: 'gate-efemero',
      title: 'Gate efêmero',
      script: '#!/bin/bash\nexit 0',
      lifecycle: 'workflow',
      workflowId,
    });
    const completed = await request(
      kv,
      'POST',
      `/workflows/${workflowId}/complete`,
      { summary: 'Tudo validado' },
    );
    assert(completed.ok, 'workflow com barreiras não concluiu');
    assert(
      await getMacroById(kv, macro.id) === null,
      'macro efêmera deveria ser removida',
    );
    const archives = await listWorkflowMacroArchives(kv, workflowId);
    assert(archives.length === 1, 'macro deveria ser arquivada');
    assert(
      archives[0].scriptHash.length === 64,
      'arquivo deveria guardar hash SHA-256',
    );
  });
});

Deno.test('protocolos e views compactas evitam contexto global', async () => {
  await withKv(async (kv) => {
    const protocolResponse = await request(
      kv,
      'GET',
      '/workflows/protocol?role=orchestrator',
    );
    const protocol = await protocolResponse.text();
    assert(protocol.includes('quality_gate'), 'protocolo deveria incluir gate');
    assert(
      !protocol.toLowerCase().includes('podcast'),
      'protocolo de workflow não deveria carregar módulos irrelevantes',
    );
    assert(protocol.length < 7000, 'protocolo deveria permanecer compacto');

    const workflow = await jsonBody(
      await request(kv, 'POST', '/workflows', {
        title: 'Payload compacto',
        objective: 'Reduzir tokens',
      }),
    );
    const workflowId = String(workflow.id);
    const orchestrator = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'orquestrador-compacto',
        tool: 'codex-cli',
        provider: 'openai',
        model: 'modelo',
        role: 'orchestrator',
      }),
    );
    const compactInbox = await jsonBody(
      await request(
        kv,
        'GET',
        `/orchestrator/inbox?agentSessionId=${
          String(orchestrator.agentSessionId)
        }&compact=true&wait=1`,
      ),
    );
    assert(
      Array.isArray(compactInbox.nextActions),
      'inbox compacta deveria trazer próximas ações',
    );
    assert(
      !('planning' in compactInbox) && !('returned' in compactInbox),
      'inbox compacta não deveria repetir coleções completas',
    );
    assert(
      (compactInbox.wait as Record<string, unknown>).trigger === 'initial',
      'inbox bloqueante deveria retornar imediatamente quando já há ação',
    );
    const planning = await jsonBody(
      await request(
        kv,
        'GET',
        `/workflows/${workflowId}?view=planning`,
      ),
    );
    assert(!('runs' in planning), 'planning não deveria trazer runs');
    assert(!('events' in planning), 'planning não deveria trazer eventos');
    assert(!('agents' in planning), 'planning não deveria trazer agentes');

    const orchestratorPromptResponse = await request(
      kv,
      'GET',
      `/workflows/${workflowId}/prompt?role=orchestrator`,
    );
    const orchestratorPrompt = await orchestratorPromptResponse.text();
    assert(
      !orchestratorPrompt.includes('/system/skill'),
      'prompt não deveria exigir skill global',
    );
    assert(
      orchestratorPrompt.includes('?view=planning'),
      'prompt deveria priorizar pacote de planejamento',
    );
    assert(
      orchestratorPrompt.includes('Você é SOMENTE orquestrador.') &&
        !orchestratorPrompt.includes(
          'Você executa nós, valida resultados e devolve evidências.',
        ),
      'prompt do orquestrador deveria manter papel exclusivo',
    );

    const executorPromptResponse = await request(
      kv,
      'GET',
      `/workflows/${workflowId}/prompt?role=executor`,
    );
    const executorPrompt = await executorPromptResponse.text();
    assert(
      executorPrompt.includes('await_review'),
      'executor deveria receber loop pós-return',
    );
    assert(
      executorPrompt.includes(
        'Você executa nós, valida resultados e devolve evidências.',
      ) && !executorPrompt.includes('Você é SOMENTE orquestrador.'),
      'prompt do executor não deveria conter instruções do orquestrador',
    );
  });
});

Deno.test('inbox bloqueante retorna timeout sem polling ativo', async () => {
  await withKv(async (kv) => {
    const executor = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'executor-em-espera',
        tool: 'codex-cli',
        provider: 'openai',
        model: 'modelo',
        role: 'executor',
      }),
    );
    const startedAt = Date.now();
    const inbox = await jsonBody(
      await request(
        kv,
        'GET',
        `/agents/${String(executor.agentSessionId)}/inbox?wait=0.02`,
      ),
    );
    const wait = inbox.wait as Record<string, unknown>;
    assert(wait.reason === 'timeout', 'espera deveria terminar por timeout');
    assert(
      Number(wait.waitedMs) >= 10 && Date.now() - startedAt < 1000,
      'timeout curto deveria aguardar sem travar o servidor',
    );
    assert(inbox.nextAction === 'wait', 'inbox deveria preservar nextAction');
  });
});

Deno.test('prompt e inbox explicam capacidades ausentes', async () => {
  await withKv(async (kv) => {
    const workflow = await jsonBody(
      await request(kv, 'POST', '/workflows', {
        title: 'Capacidades especializadas',
        objective: 'Distribuir trabalho compatível',
      }),
    );
    const workflowId = String(workflow.id);
    const node = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        title: 'Analisar regressões',
        description: 'Inspecionar código e riscos',
        acceptanceCriteria: ['riscos documentados'],
        requiredCapabilities: ['code', 'tests', 'analysis'],
      }),
    );
    await request(kv, 'POST', `/workflows/${workflowId}/start`, {});
    const executor = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'executor-sem-analysis',
        tool: 'opencode',
        provider: 'anthropic',
        model: 'modelo',
        role: 'executor',
        capabilities: ['code', 'tests'],
      }),
    );
    const agentSessionId = String(executor.agentSessionId);
    const inbox = await jsonBody(
      await request(
        kv,
        'GET',
        `/agents/${agentSessionId}/inbox?workflowId=${workflowId}&wait=1`,
      ),
    );
    assert(
      inbox.nextAction === 'capability_mismatch',
      'inbox deveria explicar por que o nó pronto foi filtrado',
    );
    assert(
      (inbox.wait as Record<string, unknown>).trigger === 'initial',
      'incompatibilidade deveria despertar a inbox imediatamente',
    );
    const mismatch = inbox.capabilityMismatch as Record<string, unknown>;
    assert(
      (mismatch.missingCapabilities as string[]).includes('analysis'),
      'inbox deveria listar capability ausente',
    );
    assert(
      (mismatch.incompatibleAvailable as Array<Record<string, unknown>>)
        .some((item) => item.nodeId === node.id),
      'diagnóstico deveria identificar o nó incompatível',
    );

    const prompt = await (
      await request(
        kv,
        'GET',
        `/workflows/${workflowId}/prompt?role=executor`,
      )
    ).text();
    assert(
      prompt.includes('"analysis"'),
      'prompt do workflow deveria declarar capabilities dos nós',
    );
    assert(
      prompt.includes(`inbox?workflowId=${workflowId}&wait=55`),
      'prompt deveria manter a inbox limitada ao workflow alvo',
    );

    const nodePrompt = await (
      await request(
        kv,
        'GET',
        `/workflows/nodes/${String(node.id)}/prompt`,
      )
    ).text();
    assert(
      nodePrompt.includes('"analysis"'),
      'prompt específico do nó deveria declarar capability exigida',
    );
  });
});

Deno.test('barreiras finais automáticas são estritas e idempotentes', async () => {
  await withKv(async (kv) => {
    const workflow = await jsonBody(
      await request(kv, 'POST', '/workflows', {
        title: 'Barreiras automáticas',
        objective: 'Evitar JSON manual e arestas ausentes',
      }),
    );
    const workflowId = String(workflow.id);
    const orchestrator = await jsonBody(
      await request(kv, 'POST', '/agents/connect', {
        name: 'orquestrador-barreiras',
        tool: 'codex-cli',
        provider: 'openai',
        model: 'modelo',
        role: 'orchestrator',
        capabilities: ['planning', 'review'],
      }),
    );
    const orchestratorId = String(orchestrator.agentSessionId);
    await request(
      kv,
      'POST',
      `/workflows/${workflowId}/claim-orchestration`,
      { agentSessionId: orchestratorId },
    );

    const invalidNode = await request(
      kv,
      'POST',
      `/workflows/${workflowId}/nodes`,
      {
        agentSessionId: orchestratorId,
        title: 'Critério inválido',
        description: 'Não deve ser criado',
        acceptanceCriteria: [{ status: 'pass' }],
      },
    );
    assert(
      invalidNode.status === 400,
      'acceptanceCriteria com objeto deveria ser rejeitado',
    );

    const first = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        agentSessionId: orchestratorId,
        title: 'Implementar base',
        description: 'Criar base',
        acceptanceCriteria: ['base pronta'],
      }),
    );
    const second = await jsonBody(
      await request(kv, 'POST', `/workflows/${workflowId}/nodes`, {
        agentSessionId: orchestratorId,
        title: 'Integrar base',
        description: 'Integrar base',
        acceptanceCriteria: ['integração pronta'],
        dependsOn: [String(first.id)],
      }),
    );

    const firstEnsure = await jsonBody(
      await request(
        kv,
        'POST',
        `/workflows/${workflowId}/final-barriers`,
        { agentSessionId: orchestratorId },
      ),
    );
    const gate = firstEnsure.qualityGate as Record<string, unknown>;
    const audit = firstEnsure.finalAudit as Record<string, unknown>;
    assert(gate.kind === 'quality_gate', 'quality gate não foi criado');
    assert(audit.kind === 'final_audit', 'auditoria final não foi criada');
    assert(
      (firstEnsure.leafNodeIds as string[]).length === 1 &&
        (firstEnsure.leafNodeIds as string[])[0] === String(second.id),
      'barreira deveria depender somente da folha do DAG de trabalho',
    );

    const secondEnsure = await jsonBody(
      await request(
        kv,
        'POST',
        `/workflows/${workflowId}/final-barriers`,
        { agentSessionId: orchestratorId },
      ),
    );
    assert(
      (secondEnsure.qualityGate as Record<string, unknown>).id === gate.id &&
        (secondEnsure.finalAudit as Record<string, unknown>).id === audit.id,
      'segunda chamada deveria reutilizar as mesmas barreiras',
    );

    const detail = await jsonBody(
      await request(kv, 'GET', `/workflows/${workflowId}`),
    );
    const nodes = detail.nodes as Array<Record<string, unknown>>;
    const edges = detail.edges as Array<Record<string, unknown>>;
    assert(
      nodes.filter((node) => node.kind === 'quality_gate').length === 1 &&
        nodes.filter((node) => node.kind === 'final_audit').length === 1,
      'chamada idempotente não deveria duplicar barreiras',
    );
    assert(
      edges.some((edge) =>
        edge.fromNodeId === second.id && edge.toNodeId === gate.id
      ) &&
        edges.some((edge) =>
          edge.fromNodeId === gate.id && edge.toNodeId === audit.id
        ),
      'arestas finais não foram ligadas corretamente',
    );
  });
});

Deno.test('lista de workflows pagina e busca no servidor', async () => {
  await withKv(async (kv) => {
    const first = await request(kv, 'POST', '/workflows', {
      title: 'Workflow antigo',
      objective: 'Objetivo comum',
    });
    const second = await request(kv, 'POST', '/workflows', {
      title: 'Workflow específico',
      objective: 'Objetivo pesquisável',
    });
    assert(
      first.status === 201 && second.status === 201,
      'workflows não foram criados',
    );

    const page = await jsonBody(
      await request(kv, 'GET', '/workflows?limit=1'),
    );
    assert(Array.isArray(page.items), 'resposta paginada não possui items');
    assert(page.total === 2, 'total paginado incorreto');
    assert(
      (page.items as unknown[]).length === 1,
      'limite da página não foi aplicado',
    );
    assert(page.nextCursor === '1', 'cursor da próxima página incorreto');

    const previousPage = await jsonBody(
      await request(kv, 'GET', '/workflows?limit=1&cursor=1'),
    );
    assert(
      previousPage.previousCursor === '0',
      'cursor da página anterior incorreto',
    );

    const search = await jsonBody(
      await request(kv, 'GET', '/workflows?q=pesquisável&limit=25'),
    );
    const results = search.items as Array<Record<string, unknown>>;
    assert(results.length === 1, 'busca deveria retornar um workflow');
    assert(
      results[0].title === 'Workflow específico',
      'busca retornou workflow incorreto',
    );
  });
});

Deno.test('workflow com barreiras removidas e nós aprovados é concluível', async () => {
  await withKv(async (kv) => {
    // Rascunho vazio continua bloqueado pela barreira work_nodes.
    const draftRes = await request(kv, 'POST', '/workflows', {
      title: 'Rascunho sem tasks',
      objective: 'Validar barreira de nós de trabalho',
    });
    assert(draftRes.status === 201, 'workflow rascunho não foi criado');
    const draft = await jsonBody(draftRes);
    const draftDetail = await jsonBody(
      await request(kv, 'GET', `/workflows/${String(draft.id)}`),
    );
    assert(
      draftDetail.canComplete === false,
      'rascunho vazio não deveria ser concluível',
    );

    // Workflow com trabalho aprovado e SEM nós de quality_gate/final_audit
    // (removidos por validação manual) é concluível mesmo com completionPolicy
    // padrão exigindo as barreiras — não há nós de barreira para a política
    // forçar.
    const wfRes = await request(kv, 'POST', '/workflows', {
      title: 'Validado manualmente',
      objective: 'Sem gate/auditoria',
    });
    assert(wfRes.status === 201, 'workflow não foi criado');
    const wf = await jsonBody(wfRes);
    const wfId = String(wf.id);

    const nodeRes = await request(kv, 'POST', `/workflows/${wfId}/nodes`, {
      title: 'Trabalho aprovado',
      description: 'Única tarefa',
      acceptanceCriteria: ['critério'],
      complexity: 'm',
      kind: 'code',
      isolation: 'shared',
    });
    assert(nodeRes.ok, 'nó não foi criado');
    const node = await jsonBody(nodeRes);
    const nodeId = String(node.id);

    const startRes = await request(kv, 'POST', `/workflows/${wfId}/start`, {});
    assert(startRes.ok, 'workflow não iniciou');

    const returned = await request(
      kv,
      'POST',
      `/workflows/nodes/${nodeId}/human-return`,
      { outcome: 'success', summary: 'Validado manualmente' },
    );
    assert(returned.ok, 'retorno humano falhou');
    const approved = await request(
      kv,
      'POST',
      `/workflows/nodes/${nodeId}/decision`,
      {
        decision: 'approve',
        feedback: 'Validação manual concluída',
        acceptanceChecks: [
          { criterion: 'critério', status: 'pass', evidence: 'Revisão manual' },
        ],
      },
    );
    assert(approved.ok, 'aprovação falhou');

    const detail = await jsonBody(
      await request(kv, 'GET', `/workflows/${wfId}`),
    );
    assert(
      detail.canComplete === true,
      'workflow sem barreiras e com nós aprovados deveria liberar conclusão',
    );

    const completed = await request(kv, 'POST', `/workflows/${wfId}/complete`, {
      summary: 'Validação manual',
    });
    assert(completed.ok, 'conclusão sem barreiras falhou');
  });
});

Deno.test('workflow ativo sem nós de trabalho é concluível', async () => {
  await withKv(async (kv) => {
    // Workflow iniciado com nós, depois todos excluídos manualmente: não há
    // mais nada a validar, então a conclusão é liberada.
    const wfRes = await request(kv, 'POST', '/workflows', {
      title: 'Fluxo esvaziado',
      objective: 'Validar saída do estado preso',
    });
    assert(wfRes.status === 201, 'workflow não foi criado');
    const wf = await jsonBody(wfRes);
    const wfId = String(wf.id);

    const nodeRes = await request(kv, 'POST', `/workflows/${wfId}/nodes`, {
      title: 'Única tarefa',
      description: 'Será excluída',
      acceptanceCriteria: ['critério'],
      complexity: 'm',
      kind: 'code',
      isolation: 'shared',
    });
    assert(nodeRes.ok, 'nó não foi criado');
    const node = await jsonBody(nodeRes);

    const startRes = await request(kv, 'POST', `/workflows/${wfId}/start`, {});
    assert(startRes.ok, 'workflow não iniciou');

    const deleteRes = await request(
      kv,
      'DELETE',
      `/workflows/nodes/${String(node.id)}`,
    );
    assert(deleteRes.ok, 'nó não foi excluído');

    const detail = await jsonBody(
      await request(kv, 'GET', `/workflows/${wfId}`),
    );
    assert(
      (detail.workflow as Record<string, unknown>).status === 'running',
      'workflow deveria seguir em execução',
    );
    assert(
      detail.canComplete === true,
      'workflow ativo esvaziado deveria liberar conclusão',
    );

    const completed = await request(kv, 'POST', `/workflows/${wfId}/complete`, {
      summary: 'Sem tasks restantes',
    });
    assert(completed.ok, 'conclusão de workflow esvaziado falhou');
  });
});
