import { badRequest, conflict, json, notFound } from '../server/response.ts';
import { listWorkflowMacroArchives } from '../macros/store.ts';
import {
  buildAgentConnectPrompt,
  buildNodePrompt,
  buildRoleProtocol,
  buildWorkflowPrompt,
  WORKFLOW_PROTOCOL_VERSION,
} from './prompts.ts';
import {
  answerWorkflowQuestion,
  askWorkflowQuestion,
  claimNode,
  claimOrchestration,
  completeWorkflow,
  connectAgent,
  createWorkflow,
  createWorkflowEdge,
  createWorkflowNode,
  deleteWorkflow,
  deleteWorkflowEdge,
  deleteWorkflowNode,
  disconnectAgent,
  ensureWorkflowFinalBarriers,
  getAgent,
  getAgentInbox,
  getNodeExecutionPackage,
  getNodeReviewPacket,
  getWorkflow,
  getWorkflowDetail,
  getWorkflowNode,
  getWorkflowPlanningPacket,
  getWorkflowStatusPacket,
  heartbeatAgent,
  humanReturnNode,
  listAgents,
  listAvailableNodes,
  listNodeRuns,
  listWorkflowEvents,
  listWorkflowNodes,
  listWorkflowQuestions,
  listWorkflows,
  releaseNode,
  releaseOrchestration,
  returnNode,
  reviewNode,
  startNode,
  startWorkflow,
  updateWorkflow,
  updateWorkflowNode,
  WorkflowConflictError,
  WorkflowMissingError,
  WorkflowValidationError,
} from './store.ts';
import {
  getWorkflowEventRevision,
  type RealtimeWorkflowEvent,
  subscribeWorkflowEvents,
  waitForWorkflowEvent,
} from './events.ts';
import type {
  AgentRole,
  ConnectAgentInput,
  ContextRef,
  CreateWorkflowInput,
  CreateWorkflowNodeInput,
  HumanReturnInput,
  ReturnRunInput,
  ReviewInput,
  RunTest,
  RunWorkspace,
  UpdateWorkflowInput,
  UpdateWorkflowNodeInput,
  WorkflowCompletionPolicy,
  WorkflowEdgeKind,
} from './types.ts';

const readJson = async (req: Request): Promise<Record<string, unknown>> => {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new WorkflowValidationError('body deve ser um objeto JSON');
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof WorkflowValidationError) throw error;
    throw new WorkflowValidationError('JSON inválido');
  }
};

const requiredString = (
  body: Record<string, unknown>,
  field: string,
): string => {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new WorkflowValidationError(`${field} é obrigatório`);
  }
  return value.trim();
};

const optionalString = (
  body: Record<string, unknown>,
  field: string,
): string | undefined =>
  typeof body[field] === 'string' ? String(body[field]).trim() : undefined;

const stringArray = (
  body: Record<string, unknown>,
  field: string,
): string[] => {
  const value = body[field];
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new WorkflowValidationError(`${field} deve ser um array de strings`);
  }
  return value.map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new WorkflowValidationError(
        `${field}[${index}] deve ser uma string não vazia`,
      );
    }
    return item.trim();
  });
};

const parseCompletionPolicy = (
  value: unknown,
): Partial<WorkflowCompletionPolicy> | undefined => {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new WorkflowValidationError('completionPolicy deve ser um objeto');
  }
  const policy = value as Record<string, unknown>;
  for (const field of ['requireQualityGate', 'requireFinalAudit']) {
    if (policy[field] !== undefined && typeof policy[field] !== 'boolean') {
      throw new WorkflowValidationError(`${field} deve ser boolean`);
    }
  }
  return {
    ...(typeof policy.requireQualityGate === 'boolean'
      ? { requireQualityGate: policy.requireQualityGate }
      : {}),
    ...(typeof policy.requireFinalAudit === 'boolean'
      ? { requireFinalAudit: policy.requireFinalAudit }
      : {}),
  };
};

const parseWorkspace = (value: unknown): RunWorkspace | undefined => {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new WorkflowValidationError('workspace deve ser um objeto');
  }
  const workspace = value as Record<string, unknown>;
  if (
    workspace.kind !== 'shared' && workspace.kind !== 'branch' &&
    workspace.kind !== 'worktree'
  ) {
    throw new WorkflowValidationError('workspace.kind inválido');
  }
  return {
    kind: workspace.kind,
    ...(typeof workspace.path === 'string' ? { path: workspace.path } : {}),
    ...(typeof workspace.branch === 'string'
      ? { branch: workspace.branch }
      : {}),
    ...(typeof workspace.baseCommit === 'string'
      ? { baseCommit: workspace.baseCommit }
      : {}),
  };
};

const RUN_OUTCOMES = [
  'success',
  'partial',
  'failed',
  'blocked',
  'needs_input',
] as const;

const parseRunTests = (value: unknown): RunTest[] =>
  Array.isArray(value)
    ? value.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new WorkflowValidationError('tests contém item inválido');
      }
      const test = item as Record<string, unknown>;
      if (
        test.status !== 'passed' && test.status !== 'failed' &&
        test.status !== 'skipped'
      ) {
        throw new WorkflowValidationError('status de teste inválido');
      }
      return {
        command: requiredString(test, 'command'),
        status: test.status as RunTest['status'],
        ...(typeof test.output === 'string' ? { output: test.output } : {}),
      };
    })
    : [];

const parseRunArtifacts = (
  value: unknown,
): ReturnRunInput['artifacts'] =>
  Array.isArray(value)
    ? value.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new WorkflowValidationError('artifacts contém item inválido');
      }
      const artifact = item as Record<string, unknown>;
      return {
        kind: requiredString(artifact, 'kind'),
        label: requiredString(artifact, 'label'),
        ...(typeof artifact.ref === 'string' ? { ref: artifact.ref } : {}),
      };
    })
    : [];

const parseRunOutput = (
  body: Record<string, unknown>,
  options: { defaultOutcome?: ReturnRunInput['outcome'] } = {},
): Omit<ReturnRunInput, 'agentSessionId'> => {
  const outcome = body.outcome ?? options.defaultOutcome;
  if (!RUN_OUTCOMES.includes(String(outcome) as typeof RUN_OUTCOMES[number])) {
    throw new WorkflowValidationError('outcome inválido');
  }
  return {
    outcome: outcome as ReturnRunInput['outcome'],
    summary: requiredString(body, 'summary'),
    ...(typeof body.result === 'string' ? { result: body.result } : {}),
    logs: stringArray(body, 'logs'),
    changedFiles: stringArray(body, 'changedFiles'),
    ...(typeof body.diff === 'string' ? { diff: body.diff } : {}),
    tests: parseRunTests(body.tests),
    artifacts: parseRunArtifacts(body.artifacts),
  };
};

const textResponse = (body: string): Response =>
  new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });

const handleError = (error: unknown): Response => {
  const message = error instanceof Error ? error.message : 'erro interno';
  if (error instanceof WorkflowMissingError) return notFound();
  if (error instanceof WorkflowConflictError) return conflict(message);
  if (error instanceof WorkflowValidationError) return badRequest(message);
  console.error('workflow handler:', error);
  return json({ error: 'internal_error', message }, 500);
};

const validateAgentRole = (value: unknown): AgentRole => {
  if (
    value !== 'orchestrator' && value !== 'executor' &&
    value !== 'reviewer'
  ) {
    throw new WorkflowValidationError('role inválido');
  }
  return value;
};

const MAX_INBOX_WAIT_SECONDS = 120;

const parseInboxWaitMs = (url: URL): number | null => {
  if (!url.searchParams.has('wait')) return null;
  const seconds = Number(url.searchParams.get('wait'));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new WorkflowValidationError(
      'wait deve ser um número positivo de segundos',
    );
  }
  return Math.min(seconds, MAX_INBOX_WAIT_SECONDS) * 1000;
};

const inboxHasAction = (inbox: Record<string, unknown>): boolean => {
  const agent = inbox.agent as Record<string, unknown>;
  if (agent.role === 'orchestrator' || agent.role === 'reviewer') {
    return Array.isArray(inbox.nextActions) && inbox.nextActions.length > 0;
  }
  return [
    'execute_current',
    'rework',
    'claim_next',
    'capability_mismatch',
    'stop',
  ].includes(String(inbox.nextAction));
};

const relevantInboxEvent = (event: RealtimeWorkflowEvent): boolean =>
  event.type !== 'agent.heartbeat';

type InboxWaitMetadata = {
  readonly mode: 'long_poll';
  readonly reason: 'actionable' | 'timeout' | 'aborted';
  readonly trigger: 'initial' | 'event' | 'timeout' | 'abort';
  readonly waitedMs: number;
  readonly timeoutSeconds: number;
};

const getAgentInboxWithWait = async (
  kv: Deno.Kv,
  agentSessionId: string,
  waitMs: number,
  signal: AbortSignal,
  workflowId?: string,
): Promise<{
  readonly inbox: Record<string, unknown>;
  readonly wait: InboxWaitMetadata;
}> => {
  const startedAt = Date.now();
  const deadline = startedAt + waitMs;
  let revision = getWorkflowEventRevision();
  let inbox = await getAgentInbox(kv, agentSessionId, { workflowId });

  if (inboxHasAction(inbox)) {
    return {
      inbox,
      wait: {
        mode: 'long_poll',
        reason: 'actionable',
        trigger: 'initial',
        waitedMs: Date.now() - startedAt,
        timeoutSeconds: waitMs / 1000,
      },
    };
  }

  while (Date.now() < deadline) {
    const eventResult = await waitForWorkflowEvent({
      afterRevision: revision,
      timeoutMs: deadline - Date.now(),
      signal,
      predicate: relevantInboxEvent,
    });
    revision = eventResult.revision;
    inbox = await getAgentInbox(kv, agentSessionId, { workflowId });

    if (inboxHasAction(inbox)) {
      return {
        inbox,
        wait: {
          mode: 'long_poll',
          reason: 'actionable',
          trigger: 'event',
          waitedMs: Date.now() - startedAt,
          timeoutSeconds: waitMs / 1000,
        },
      };
    }
    if (eventResult.reason !== 'event') {
      return {
        inbox,
        wait: {
          mode: 'long_poll',
          reason: eventResult.reason,
          trigger: eventResult.reason === 'aborted' ? 'abort' : 'timeout',
          waitedMs: Date.now() - startedAt,
          timeoutSeconds: waitMs / 1000,
        },
      };
    }
  }

  return {
    inbox,
    wait: {
      mode: 'long_poll',
      reason: 'timeout',
      trigger: 'timeout',
      waitedMs: Date.now() - startedAt,
      timeoutSeconds: waitMs / 1000,
    },
  };
};

const handleAgents = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
): Promise<Response> => {
  const segments = url.pathname.replace(/^\/agents\/?/, '').split('/')
    .filter(Boolean);
  const id = segments[0];
  const action = segments[1];

  if (req.method === 'GET' && !id) return json(await listAgents(kv));

  if (req.method === 'POST' && id === 'connect') {
    const body = await readJson(req);
    const input: ConnectAgentInput = {
      name: requiredString(body, 'name'),
      tool: requiredString(body, 'tool'),
      provider: requiredString(body, 'provider'),
      model: requiredString(body, 'model'),
      role: validateAgentRole(body.role),
      capabilities: stringArray(body, 'capabilities'),
      ...(optionalString(body, 'operator')
        ? { operator: optionalString(body, 'operator') }
        : {}),
    };
    const agent = await connectAgent(kv, input);
    return json({
      agent,
      agentSessionId: agent.id,
      heartbeatUrl: `/agents/${agent.id}/heartbeat`,
      inboxUrl: `/agents/${agent.id}/inbox`,
      blockingInboxUrl: `/agents/${agent.id}/inbox?wait=55`,
      availableWorkUrl: `/workflows/available?agentSessionId=${agent.id}`,
      orchestratorInboxUrl: `/orchestrator/inbox?agentSessionId=${agent.id}`,
      orchestratorBlockingInboxUrl:
        `/orchestrator/inbox?agentSessionId=${agent.id}&compact=true&wait=55`,
      protocolVersion: WORKFLOW_PROTOCOL_VERSION,
      protocolUrl: `/workflows/protocol?role=${agent.role}`,
    }, 201);
  }

  if (req.method === 'GET' && id && !action) {
    const agent = await getAgent(kv, id);
    return agent ? json(agent) : notFound();
  }

  if (req.method === 'POST' && id && action === 'heartbeat') {
    const agent = await heartbeatAgent(kv, id);
    return agent ? json(agent) : notFound();
  }

  if (req.method === 'POST' && id && action === 'disconnect') {
    const agent = await disconnectAgent(kv, id);
    return agent ? json(agent) : notFound();
  }

  if (req.method === 'GET' && id && action === 'inbox') {
    const agent = await getAgent(kv, id);
    if (agent && agent.presence !== 'offline') await heartbeatAgent(kv, id);
    const workflowId = url.searchParams.get('workflowId') ?? undefined;
    const waitMs = parseInboxWaitMs(url);
    if (waitMs === null) {
      return json(await getAgentInbox(kv, id, { workflowId }));
    }
    const result = await getAgentInboxWithWait(
      kv,
      id,
      waitMs,
      req.signal,
      workflowId,
    );
    return json({ ...result.inbox, wait: result.wait });
  }

  return notFound();
};

const handleOrchestrator = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
): Promise<Response> => {
  if (req.method !== 'GET' || url.pathname !== '/orchestrator/inbox') {
    return notFound();
  }
  const agentSessionId = url.searchParams.get('agentSessionId');
  if (!agentSessionId) return badRequest('agentSessionId é obrigatório');
  const currentAgent = await getAgent(kv, agentSessionId);
  if (currentAgent && currentAgent.presence !== 'offline') {
    await heartbeatAgent(kv, agentSessionId);
  }
  const waitMs = parseInboxWaitMs(url);
  const result = waitMs === null
    ? { inbox: await getAgentInbox(kv, agentSessionId) }
    : await getAgentInboxWithWait(
      kv,
      agentSessionId,
      waitMs,
      req.signal,
    );
  const inbox = result.inbox;
  if (url.searchParams.get('compact') !== 'true') {
    return json({
      ...inbox,
      ...('wait' in result ? { wait: result.wait } : {}),
    });
  }
  const agent = inbox.agent as Record<string, unknown>;
  return json({
    agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      presence: agent.presence,
      lastHeartbeatAt: agent.lastHeartbeatAt,
    },
    pollAfterSeconds: inbox.pollAfterSeconds,
    role: inbox.role,
    nextActions: inbox.nextActions,
    counts: {
      planning: (inbox.planning as unknown[] | undefined)?.length ?? 0,
      returned: (inbox.returned as unknown[] | undefined)?.length ?? 0,
      questions: (inbox.questions as unknown[] | undefined)?.length ?? 0,
      completable: (inbox.completable as unknown[] | undefined)?.length ?? 0,
    },
    ...('wait' in result ? { wait: result.wait } : {}),
  });
};

const nodeDetail = async (
  kv: Deno.Kv,
  nodeId: string,
  view: string | null,
): Promise<Response> => {
  if (view === 'review') {
    const packet = await getNodeReviewPacket(kv, nodeId);
    return packet ? json(packet) : notFound();
  }
  const pkg = await getNodeExecutionPackage(kv, nodeId);
  if (!pkg) return notFound();
  const [runs, questions, agent] = await Promise.all([
    listNodeRuns(kv, nodeId),
    listWorkflowQuestions(kv, pkg.workflow.id),
    pkg.node.claimedBySessionId
      ? getAgent(kv, pkg.node.claimedBySessionId)
      : Promise.resolve(null),
  ]);
  return json({
    ...pkg,
    runs,
    questions: questions.filter((question) => question.nodeId === nodeId),
    agent,
  });
};

const handleNodeRoute = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
  segments: string[],
): Promise<Response> => {
  const nodeId = segments[2];
  const action = segments[3];
  if (!nodeId) return notFound();

  if (req.method === 'GET' && !action) {
    return nodeDetail(kv, nodeId, url.searchParams.get('view'));
  }

  if (req.method === 'GET' && action === 'prompt') {
    const pkg = await getNodeExecutionPackage(kv, nodeId);
    return pkg ? textResponse(buildNodePrompt(pkg)) : notFound();
  }

  if (req.method === 'PUT' && !action) {
    const body = await readJson(req);
    const updated = await updateWorkflowNode(
      kv,
      nodeId,
      body as UpdateWorkflowNodeInput,
    );
    return updated ? json(updated) : notFound();
  }

  if (req.method === 'DELETE' && !action) {
    return json({ ok: await deleteWorkflowNode(kv, nodeId) });
  }

  if (req.method === 'POST' && action === 'claim') {
    const body = await readJson(req);
    return json(
      await claimNode(kv, nodeId, requiredString(body, 'agentSessionId')),
    );
  }

  if (req.method === 'POST' && action === 'start') {
    const body = await readJson(req);
    const workspace = parseWorkspace(body.workspace);
    return json(
      await startNode(
        kv,
        nodeId,
        requiredString(body, 'agentSessionId'),
        workspace,
      ),
    );
  }

  if (req.method === 'POST' && action === 'return') {
    const body = await readJson(req);
    const input: ReturnRunInput = {
      agentSessionId: requiredString(body, 'agentSessionId'),
      ...parseRunOutput(body),
    };
    return json(await returnNode(kv, nodeId, input));
  }

  if (req.method === 'POST' && action === 'human-return') {
    const body = await readJson(req);
    const input: HumanReturnInput = parseRunOutput(body, {
      defaultOutcome: 'success',
    });
    return json(await humanReturnNode(kv, nodeId, input));
  }

  if (req.method === 'POST' && action === 'decision') {
    const body = await readJson(req);
    const decisions = [
      'approve',
      'rework',
      'expand',
      'human_intervention',
      'cancel',
    ];
    if (!decisions.includes(String(body.decision))) {
      throw new WorkflowValidationError('decision inválida');
    }
    const rawChecks = body.acceptanceChecks;
    if (rawChecks !== undefined && !Array.isArray(rawChecks)) {
      throw new WorkflowValidationError('acceptanceChecks deve ser um array');
    }
    const acceptanceChecks = (rawChecks as unknown[] | undefined)?.map(
      (value, index) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          throw new WorkflowValidationError(
            `acceptanceChecks[${index}] deve ser um objeto`,
          );
        }
        const check = value as Record<string, unknown>;
        const criterion = requiredString(check, 'criterion');
        const status = String(check.status ?? '');
        if (!['pass', 'fail', 'insufficient'].includes(status)) {
          throw new WorkflowValidationError(
            `acceptanceChecks[${index}].status inválido`,
          );
        }
        return {
          criterion,
          status: status as 'pass' | 'fail' | 'insufficient',
          evidence: requiredString(check, 'evidence'),
        };
      },
    );
    const input: ReviewInput = {
      ...(body as ReviewInput),
      ...(acceptanceChecks ? { acceptanceChecks } : {}),
    };
    const original = await getWorkflowNode(kv, nodeId);
    if (!original) return notFound();
    if (input.decision === 'expand') {
      if (!input.newNodes?.length) {
        throw new WorkflowValidationError(
          'newNodes é obrigatório para expand',
        );
      }
      for (const child of input.newNodes) {
        validateCreateNode(child as unknown as Record<string, unknown>);
      }
    }
    const reviewed = await reviewNode(kv, nodeId, input);
    const createdNodes = [];
    if (input.decision === 'expand') {
      for (const child of input.newNodes ?? []) {
        createdNodes.push(
          await createWorkflowNode(kv, original.workflowId, {
            ...child,
            dependsOn: [...(child.dependsOn ?? []), original.id],
          }),
        );
      }
    }
    return json({ node: reviewed, createdNodes });
  }

  if (req.method === 'POST' && action === 'release') {
    const body = await readJson(req);
    return json(
      await releaseNode(
        kv,
        nodeId,
        optionalString(body, 'agentSessionId'),
      ),
    );
  }

  if (req.method === 'POST' && action === 'questions') {
    const body = await readJson(req);
    return json(
      await askWorkflowQuestion(
        kv,
        nodeId,
        requiredString(body, 'agentSessionId'),
        requiredString(body, 'question'),
      ),
      201,
    );
  }

  return notFound();
};

const handleQuestionRoute = async (
  kv: Deno.Kv,
  req: Request,
  segments: string[],
): Promise<Response> => {
  const questionId = segments[2];
  const action = segments[3];
  if (
    req.method !== 'POST' || !questionId || action !== 'answer'
  ) return notFound();
  const body = await readJson(req);
  return json(
    await answerWorkflowQuestion(
      kv,
      questionId,
      requiredString(body, 'answer'),
      optionalString(body, 'agentSessionId'),
    ),
  );
};

const validateCreateNode = (
  body: Record<string, unknown>,
): CreateWorkflowNodeInput => {
  const criteria = body.acceptanceCriteria;
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new WorkflowValidationError(
      'acceptanceCriteria deve ter ao menos um item',
    );
  }
  const acceptanceCriteria = stringArray(body, 'acceptanceCriteria');
  const validComplexities = ['xs', 's', 'm', 'l', 'xl'];
  if (
    body.complexity !== undefined &&
    !validComplexities.includes(String(body.complexity))
  ) {
    throw new WorkflowValidationError('complexity inválida');
  }
  const validIsolation = ['shared', 'branch', 'worktree'];
  if (
    body.isolation !== undefined &&
    !validIsolation.includes(String(body.isolation))
  ) {
    throw new WorkflowValidationError('isolation inválido');
  }
  const recommendation = body.recommendedAgent &&
      typeof body.recommendedAgent === 'object' &&
      !Array.isArray(body.recommendedAgent)
    ? body.recommendedAgent as Record<string, unknown>
    : null;
  const contextRefs = Array.isArray(body.contextRefs)
    ? body.contextRefs.map((value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new WorkflowValidationError('contextRefs contém item inválido');
      }
      const ref = value as Record<string, unknown>;
      const validKinds = ['note', 'file', 'skill', 'url', 'text', 'other'];
      if (!validKinds.includes(String(ref.kind))) {
        throw new WorkflowValidationError('contextRefs.kind inválido');
      }
      return {
        kind: ref.kind as ContextRef['kind'],
        ref: requiredString(ref, 'ref'),
        ...(typeof ref.label === 'string' ? { label: ref.label } : {}),
        ...(typeof ref.excerpt === 'string' ? { excerpt: ref.excerpt } : {}),
      };
    })
    : [];
  return {
    title: requiredString(body, 'title'),
    description: requiredString(body, 'description'),
    acceptanceCriteria,
    contextRefs,
    ...(body.complexity
      ? {
        complexity: body.complexity as CreateWorkflowNodeInput['complexity'],
      }
      : {}),
    ...(optionalString(body, 'kind')
      ? { kind: optionalString(body, 'kind') }
      : {}),
    requiredCapabilities: stringArray(body, 'requiredCapabilities'),
    ...(recommendation
      ? {
        recommendedAgent: {
          ...(typeof recommendation.tool === 'string'
            ? { tool: recommendation.tool }
            : {}),
          ...(typeof recommendation.provider === 'string'
            ? { provider: recommendation.provider }
            : {}),
          ...(typeof recommendation.model === 'string'
            ? { model: recommendation.model }
            : {}),
        },
      }
      : {}),
    readScopes: stringArray(body, 'readScopes'),
    writeScopes: stringArray(body, 'writeScopes'),
    ...(body.isolation
      ? {
        isolation: body.isolation as CreateWorkflowNodeInput['isolation'],
      }
      : {}),
    ...(typeof body.maxAttempts === 'number'
      ? { maxAttempts: body.maxAttempts }
      : {}),
    dependsOn: stringArray(body, 'dependsOn'),
    ...(body.position && typeof body.position === 'object' &&
        !Array.isArray(body.position)
      ? {
        position: {
          x: Number((body.position as Record<string, unknown>).x),
          y: Number((body.position as Record<string, unknown>).y),
        },
      }
      : {}),
  };
};

const touchWorkflowOrchestrator = async (
  kv: Deno.Kv,
  workflowId: string,
  agentSessionId: string,
): Promise<void> => {
  const [workflow, agent] = await Promise.all([
    getWorkflow(kv, workflowId),
    getAgent(kv, agentSessionId),
  ]);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (!agent) throw new WorkflowMissingError('sessão de agente não encontrada');
  if (agent.role !== 'orchestrator') {
    throw new WorkflowValidationError('agente não é orquestrador');
  }
  if (agent.presence === 'offline') {
    throw new WorkflowConflictError('sessão do orquestrador está offline');
  }
  if (workflow.orchestrationSessionId !== agentSessionId) {
    throw new WorkflowConflictError('sessão não controla este workflow');
  }
  await heartbeatAgent(kv, agentSessionId);
};

const handleWorkflowById = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
  segments: string[],
): Promise<Response> => {
  const workflowId = segments[1];
  const action = segments[2];
  const childId = segments[3];
  if (!workflowId) return notFound();

  if (req.method === 'GET' && !action) {
    const view = url.searchParams.get('view');
    const detail = view === 'planning'
      ? await getWorkflowPlanningPacket(kv, workflowId)
      : view === 'status'
      ? await getWorkflowStatusPacket(kv, workflowId)
      : await getWorkflowDetail(kv, workflowId);
    return detail ? json(detail) : notFound();
  }

  if (req.method === 'PUT' && !action) {
    const body = await readJson(req);
    const updated = await updateWorkflow(
      kv,
      workflowId,
      {
        ...(body as UpdateWorkflowInput),
        ...(body.completionPolicy !== undefined
          ? {
            completionPolicy: parseCompletionPolicy(body.completionPolicy),
          }
          : {}),
      },
    );
    return updated ? json(updated) : notFound();
  }

  if (req.method === 'DELETE' && !action) {
    return json({ ok: await deleteWorkflow(kv, workflowId) });
  }

  if (req.method === 'GET' && action === 'events') {
    const limit = Number(url.searchParams.get('limit') ?? '200');
    return json(await listWorkflowEvents(kv, workflowId, limit));
  }

  if (req.method === 'GET' && action === 'macro-archives') {
    return json(await listWorkflowMacroArchives(kv, workflowId));
  }

  if (req.method === 'GET' && action === 'prompt') {
    const workflow = await getWorkflow(kv, workflowId);
    if (!workflow) return notFound();
    const role = validateAgentRole(
      url.searchParams.get('role') ?? 'orchestrator',
    );
    const nodes = role === 'executor'
      ? await listWorkflowNodes(kv, workflowId)
      : [];
    return textResponse(buildWorkflowPrompt(workflow, role, nodes));
  }

  if (req.method === 'POST' && action === 'claim-orchestration') {
    const body = await readJson(req);
    return json(
      await claimOrchestration(
        kv,
        workflowId,
        requiredString(body, 'agentSessionId'),
      ),
    );
  }

  if (req.method === 'POST' && action === 'release-orchestration') {
    const body = await readJson(req);
    return json(
      await releaseOrchestration(
        kv,
        workflowId,
        optionalString(body, 'agentSessionId'),
      ),
    );
  }

  if (req.method === 'POST' && action === 'start') {
    const body = await readJson(req);
    return json(
      await startWorkflow(
        kv,
        workflowId,
        optionalString(body, 'agentSessionId'),
      ),
    );
  }

  if (req.method === 'POST' && action === 'complete') {
    const body = await readJson(req);
    return json(
      await completeWorkflow(
        kv,
        workflowId,
        requiredString(body, 'summary'),
        optionalString(body, 'agentSessionId'),
      ),
    );
  }

  if (req.method === 'POST' && action === 'final-barriers') {
    const body = await readJson(req);
    const agentSessionId = requiredString(body, 'agentSessionId');
    await touchWorkflowOrchestrator(kv, workflowId, agentSessionId);
    return json(
      await ensureWorkflowFinalBarriers(kv, workflowId),
      201,
    );
  }

  if (req.method === 'POST' && action === 'nodes') {
    const body = await readJson(req);
    const input = validateCreateNode(body);
    const agentSessionId = optionalString(body, 'agentSessionId');
    if (agentSessionId) {
      await touchWorkflowOrchestrator(kv, workflowId, agentSessionId);
    }
    return json(
      await createWorkflowNode(kv, workflowId, input),
      201,
    );
  }

  if (req.method === 'POST' && action === 'edges') {
    const body = await readJson(req);
    const validKinds = ['blocks', 'informs', 'reviews', 'rework_of'];
    const kind = String(body.kind ?? 'blocks') as WorkflowEdgeKind;
    if (!validKinds.includes(kind)) {
      throw new WorkflowValidationError('kind de aresta inválido');
    }
    const agentSessionId = optionalString(body, 'agentSessionId');
    if (agentSessionId) {
      await touchWorkflowOrchestrator(kv, workflowId, agentSessionId);
    }
    return json(
      await createWorkflowEdge(
        kv,
        workflowId,
        requiredString(body, 'fromNodeId'),
        requiredString(body, 'toNodeId'),
        kind,
      ),
      201,
    );
  }

  if (req.method === 'DELETE' && action === 'edges' && childId) {
    return json({
      ok: await deleteWorkflowEdge(kv, workflowId, childId),
    });
  }

  return notFound();
};

const handleWorkflows = async (
  kv: Deno.Kv,
  req: Request,
  url: URL,
): Promise<Response> => {
  const segments = url.pathname.replace(/^\/workflows\/?/, 'workflows/')
    .split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/workflows/events') {
    return new Response(subscribeWorkflowEvents(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  if (req.method === 'GET' && url.pathname === '/workflows/available') {
    return json(
      await listAvailableNodes(kv, {
        workflowId: url.searchParams.get('workflowId') ?? undefined,
        agentSessionId: url.searchParams.get('agentSessionId') ?? undefined,
      }),
    );
  }

  if (req.method === 'GET' && url.pathname === '/workflows/protocol') {
    const role = validateAgentRole(
      url.searchParams.get('role') ?? 'executor',
    );
    return textResponse(buildRoleProtocol(role));
  }

  if (req.method === 'GET' && url.pathname === '/workflows/prompts/connect') {
    const role = validateAgentRole(
      url.searchParams.get('role') ?? 'executor',
    );
    return textResponse(buildAgentConnectPrompt(role));
  }

  if (segments[1] === 'nodes') {
    return handleNodeRoute(kv, req, url, segments);
  }
  if (segments[1] === 'questions') {
    return handleQuestionRoute(kv, req, segments);
  }

  if (req.method === 'GET' && segments.length === 1) {
    const tags = url.searchParams.getAll('tag');
    return json(
      await listWorkflows(kv, tags.length > 0 ? tags : undefined),
    );
  }

  if (req.method === 'POST' && segments.length === 1) {
    const body = await readJson(req);
    const input: CreateWorkflowInput = {
      ...(body as unknown as CreateWorkflowInput),
      title: requiredString(body, 'title'),
      objective: requiredString(body, 'objective'),
      tags: stringArray(body, 'tags'),
      ...(body.completionPolicy !== undefined
        ? {
          completionPolicy: parseCompletionPolicy(body.completionPolicy),
        }
        : {}),
    };
    return json(await createWorkflow(kv, input), 201);
  }

  return handleWorkflowById(kv, req, url, segments);
};

export const workflowsHandler =
  (kv: Deno.Kv) => async (req: Request, url: URL): Promise<Response> => {
    try {
      if (url.pathname.startsWith('/agents')) {
        return await handleAgents(kv, req, url);
      }
      if (url.pathname.startsWith('/orchestrator')) {
        return await handleOrchestrator(kv, req, url);
      }
      return await handleWorkflows(kv, req, url);
    } catch (error) {
      return handleError(error);
    }
  };
