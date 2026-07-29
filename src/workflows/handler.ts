import { badRequest, conflict, json, notFound } from '../server/response.ts';
import {
  buildAgentConnectPrompt,
  buildNodePrompt,
  buildWorkflowPrompt,
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
  getAgent,
  getAgentInbox,
  getNodeExecutionPackage,
  getWorkflow,
  getWorkflowDetail,
  getWorkflowNode,
  heartbeatAgent,
  humanReturnNode,
  listAgents,
  listAvailableNodes,
  listNodeRuns,
  listWorkflowEvents,
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
import { subscribeWorkflowEvents } from './events.ts';
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
): string[] =>
  Array.isArray(body[field]) ? (body[field] as unknown[]).map(String) : [];

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
      capabilities: Array.isArray(body.capabilities)
        ? body.capabilities.map(String)
        : [],
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
      availableWorkUrl: `/workflows/available?agentSessionId=${agent.id}`,
      orchestratorInboxUrl: `/orchestrator/inbox?agentSessionId=${agent.id}`,
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
    return json(await getAgentInbox(kv, id));
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
  return json(await getAgentInbox(kv, agentSessionId));
};

const nodeDetail = async (
  kv: Deno.Kv,
  nodeId: string,
): Promise<Response> => {
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
  segments: string[],
): Promise<Response> => {
  const nodeId = segments[2];
  const action = segments[3];
  if (!nodeId) return notFound();

  if (req.method === 'GET' && !action) return nodeDetail(kv, nodeId);

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
    const input = body as ReviewInput;
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
    acceptanceCriteria: criteria.map(String),
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
    const detail = await getWorkflowDetail(kv, workflowId);
    return detail ? json(detail) : notFound();
  }

  if (req.method === 'PUT' && !action) {
    const updated = await updateWorkflow(
      kv,
      workflowId,
      await readJson(req) as UpdateWorkflowInput,
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

  if (req.method === 'GET' && action === 'prompt') {
    const workflow = await getWorkflow(kv, workflowId);
    if (!workflow) return notFound();
    const role = validateAgentRole(
      url.searchParams.get('role') ?? 'orchestrator',
    );
    return textResponse(buildWorkflowPrompt(workflow, role));
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

  if (req.method === 'POST' && action === 'nodes') {
    const body = await readJson(req);
    return json(
      await createWorkflowNode(kv, workflowId, validateCreateNode(body)),
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

  if (req.method === 'GET' && url.pathname === '/workflows/prompts/connect') {
    const role = validateAgentRole(
      url.searchParams.get('role') ?? 'executor',
    );
    return textResponse(buildAgentConnectPrompt(role));
  }

  if (segments[1] === 'nodes') {
    return handleNodeRoute(kv, req, segments);
  }
  if (segments[1] === 'questions') {
    return handleQuestionRoute(kv, req, segments);
  }

  if (req.method === 'GET' && segments.length === 1) {
    return json(await listWorkflows(kv));
  }

  if (req.method === 'POST' && segments.length === 1) {
    const body = await readJson(req);
    const input: CreateWorkflowInput = {
      ...(body as unknown as CreateWorkflowInput),
      title: requiredString(body, 'title'),
      objective: requiredString(body, 'objective'),
      tags: stringArray(body, 'tags'),
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
