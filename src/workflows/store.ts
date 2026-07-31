import { normalizeTags } from '../tags/normalize.ts';
import {
  archiveAndDeleteWorkflowMacros,
  deleteWorkflowMacroArchives,
  deleteWorkflowMacros,
  listWorkflowMacroArchives,
} from '../macros/store.ts';
import { broadcastWorkflowEvent } from './events.ts';
import type {
  AcceptanceCheck,
  AgentPresence,
  AgentSession,
  ConnectAgentInput,
  CreateWorkflowInput,
  CreateWorkflowNodeInput,
  DependencyResult,
  HumanReturnInput,
  NodeExecutionPackage,
  ReturnRunInput,
  ReviewInput,
  RunOutput,
  RunWorkspace,
  UpdateWorkflowInput,
  UpdateWorkflowNodeInput,
  Workflow,
  WorkflowCompletionReadiness,
  WorkflowEdge,
  WorkflowEdgeKind,
  WorkflowEvent,
  WorkflowNode,
  WorkflowQuestion,
  WorkflowRun,
} from './types.ts';

const WORKFLOW_PREFIX = ['workflows'] as const;
const NODE_PREFIX = ['workflow_nodes'] as const;
const EDGE_PREFIX = ['workflow_edges'] as const;
const RUN_PREFIX = ['workflow_runs'] as const;
const AGENT_PREFIX = ['agent_sessions'] as const;
const EVENT_PREFIX = ['workflow_events'] as const;
const QUESTION_PREFIX = ['workflow_questions'] as const;
const STALE_AFTER_MS = 2 * 60 * 1000;
const WORKFLOW_POLL_AFTER_SECONDS = 180;
const EXECUTOR_REVIEW_POLL_AFTER_SECONDS = 15;
const DEFAULT_COMPLETION_POLICY = {
  requireQualityGate: true,
  requireFinalAudit: true,
} as const;

const workflowKey = (id: string) => ['workflows', id] as const;
const nodeKey = (id: string) => ['workflow_nodes', id] as const;
const edgeKey = (workflowId: string, id: string) =>
  ['workflow_edges', workflowId, id] as const;
const runKey = (nodeId: string, id: string) =>
  ['workflow_runs', nodeId, id] as const;
const agentKey = (id: string) => ['agent_sessions', id] as const;
const eventKey = (event: WorkflowEvent) =>
  ['workflow_events', event.workflowId, event.createdAt, event.id] as const;
const questionKey = (workflowId: string, id: string) =>
  ['workflow_questions', workflowId, id] as const;

export class WorkflowValidationError extends Error {}
export class WorkflowConflictError extends Error {}
export class WorkflowMissingError extends Error {}

const now = (): string => new Date().toISOString();
const uniqueStrings = (
  values: readonly string[] | undefined,
): string[] => [
  ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
];
const capabilities = (values: readonly string[] | undefined): string[] =>
  uniqueStrings(values).map((value) => value.toLowerCase());
const scopes = (values: readonly string[] | undefined): string[] =>
  uniqueStrings(values).map((value) =>
    value === '*' ? value : value.replace(/\/+$/, '')
  );

const makeEvent = (
  workflowId: string,
  type: string,
  payload: Record<string, unknown>,
  refs: {
    nodeId?: string;
    runId?: string;
    agentSessionId?: string;
  } = {},
): WorkflowEvent => ({
  id: crypto.randomUUID(),
  workflowId,
  type,
  payload,
  ...refs,
  createdAt: now(),
});

const recordEvent = async (
  kv: Deno.Kv,
  event: WorkflowEvent,
): Promise<void> => {
  await kv.set(eventKey(event), event);
  broadcastWorkflowEvent(event);
};

const trimText = (value: string | undefined, max: number): string | undefined =>
  value === undefined
    ? undefined
    : value.length > max
    ? `${value.slice(0, max)}\n[truncated by docmap]`
    : value;

const sanitizeOutput = (input: ReturnRunInput): RunOutput => ({
  outcome: input.outcome,
  summary: trimText(input.summary, 2000) ?? '',
  ...(input.result !== undefined
    ? { result: trimText(input.result, 8000) }
    : {}),
  logs: (input.logs ?? []).slice(-20).map((line) =>
    trimText(String(line), 500) ?? ''
  ),
  changedFiles: uniqueStrings(input.changedFiles).slice(0, 200).map((file) =>
    trimText(file, 500) ?? ''
  ),
  ...(input.diff !== undefined ? { diff: trimText(input.diff, 12000) } : {}),
  tests: (input.tests ?? []).slice(0, 10).map((test) => ({
    command: trimText(test.command, 500) ?? '',
    status: test.status,
    ...(test.output !== undefined
      ? { output: trimText(test.output, 500) }
      : {}),
  })),
  artifacts: (input.artifacts ?? []).slice(0, 15).map((artifact) => ({
    kind: trimText(artifact.kind, 100) ?? '',
    label: trimText(artifact.label, 200) ?? '',
    ...(artifact.ref !== undefined ? { ref: trimText(artifact.ref, 500) } : {}),
  })),
});

const computedPresence = (agent: AgentSession): AgentPresence => {
  if (agent.presence === 'offline') return 'offline';
  const age = Date.now() - Date.parse(agent.lastHeartbeatAt);
  return age > STALE_AFTER_MS ? 'stale' : agent.presence;
};

const withComputedPresence = (agent: AgentSession): AgentSession => ({
  ...agent,
  presence: computedPresence(agent),
});

const normalizeWorkflow = (workflow: Workflow): Workflow => ({
  ...workflow,
  completionPolicy: {
    ...DEFAULT_COMPLETION_POLICY,
    ...(workflow.completionPolicy ?? {}),
  },
});

export const getWorkflow = async (
  kv: Deno.Kv,
  id: string,
): Promise<Workflow | null> => {
  const entry = await kv.get<Workflow>(workflowKey(id));
  return entry.value ? normalizeWorkflow(entry.value) : null;
};

export const listWorkflowNodes = async (
  kv: Deno.Kv,
  workflowId?: string,
): Promise<WorkflowNode[]> => {
  const nodes: WorkflowNode[] = [];
  for await (const entry of kv.list<WorkflowNode>({ prefix: NODE_PREFIX })) {
    if (!entry.value) continue;
    if (workflowId && entry.value.workflowId !== workflowId) continue;
    nodes.push(entry.value);
  }
  return nodes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getWorkflowNode = async (
  kv: Deno.Kv,
  id: string,
): Promise<WorkflowNode | null> => {
  const entry = await kv.get<WorkflowNode>(nodeKey(id));
  return entry.value;
};

export const listWorkflowEdges = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<WorkflowEdge[]> => {
  const edges: WorkflowEdge[] = [];
  for await (
    const entry of kv.list<WorkflowEdge>({
      prefix: ['workflow_edges', workflowId],
    })
  ) {
    if (entry.value) edges.push(entry.value);
  }
  return edges.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const listNodeRuns = async (
  kv: Deno.Kv,
  nodeId: string,
): Promise<WorkflowRun[]> => {
  const runs: WorkflowRun[] = [];
  for await (
    const entry of kv.list<WorkflowRun>({
      prefix: ['workflow_runs', nodeId],
    })
  ) {
    if (entry.value) runs.push(entry.value);
  }
  return runs.sort((a, b) => a.attempt - b.attempt);
};

export const getRun = async (
  kv: Deno.Kv,
  nodeId: string,
  runId: string,
): Promise<WorkflowRun | null> => {
  const entry = await kv.get<WorkflowRun>(runKey(nodeId, runId));
  return entry.value;
};

export const listWorkflowRuns = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<WorkflowRun[]> => {
  const runs: WorkflowRun[] = [];
  for await (const entry of kv.list<WorkflowRun>({ prefix: RUN_PREFIX })) {
    if (entry.value?.workflowId === workflowId) runs.push(entry.value);
  }
  return runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

const listAgentRuns = async (
  kv: Deno.Kv,
  agentSessionId: string,
): Promise<WorkflowRun[]> => {
  const runs: WorkflowRun[] = [];
  for await (const entry of kv.list<WorkflowRun>({ prefix: RUN_PREFIX })) {
    if (entry.value?.agentSessionId === agentSessionId) {
      runs.push(entry.value);
    }
  }
  return runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const listWorkflowQuestions = async (
  kv: Deno.Kv,
  workflowId?: string,
): Promise<WorkflowQuestion[]> => {
  const prefix = workflowId
    ? ['workflow_questions', workflowId] as const
    : QUESTION_PREFIX;
  const questions: WorkflowQuestion[] = [];
  for await (const entry of kv.list<WorkflowQuestion>({ prefix })) {
    if (entry.value) questions.push(entry.value);
  }
  return questions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getWorkflowCompletionReadiness = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<WorkflowCompletionReadiness> => {
  const workflow = await getWorkflow(kv, workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (workflow.status === 'done') return { canComplete: true, missing: [] };

  const [nodes, edges, questions] = await Promise.all([
    listWorkflowNodes(kv, workflowId),
    listWorkflowEdges(kv, workflowId),
    listWorkflowQuestions(kv, workflowId),
  ]);
  const missing: string[] = [];
  const workNodes = nodes.filter((node) =>
    node.kind !== 'quality_gate' && node.kind !== 'final_audit'
  );
  if (workNodes.length === 0) missing.push('work_nodes');
  if (nodes.some((node) => node.status === 'cancelled')) {
    missing.push('cancelled_nodes');
  }
  if (nodes.some((node) => node.status !== 'done')) {
    missing.push('unfinished_nodes');
  }
  if (questions.some((question) => question.status === 'open')) {
    missing.push('open_questions');
  }

  const blockingTargets = new Map<string, string[]>();
  for (const edge of edges.filter((item) => item.kind === 'blocks')) {
    const targets = blockingTargets.get(edge.fromNodeId) ?? [];
    targets.push(edge.toNodeId);
    blockingTargets.set(edge.fromNodeId, targets);
  }
  const hasBlockingPath = (fromNodeId: string, toNodeId: string): boolean => {
    const queue = [fromNodeId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === toNodeId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      queue.push(...(blockingTargets.get(current) ?? []));
    }
    return false;
  };
  const qualityGate = [...nodes]
    .filter((node) =>
      node.kind === 'quality_gate' &&
      node.status === 'done' &&
      workNodes.every((workNode) => hasBlockingPath(workNode.id, node.id))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (workflow.completionPolicy.requireQualityGate && !qualityGate) {
    missing.push(
      nodes.some((node) => node.kind === 'quality_gate')
        ? 'quality_gate_stale_or_incomplete'
        : 'quality_gate',
    );
  }

  const finalAudit =
    qualityGate || !workflow.completionPolicy.requireQualityGate
      ? [...nodes]
        .filter((node) =>
          node.kind === 'final_audit' &&
          node.status === 'done' &&
          (
            !workflow.completionPolicy.requireQualityGate
              ? workNodes.every((workNode) =>
                hasBlockingPath(workNode.id, node.id)
              )
              : edges.some((edge) =>
                edge.fromNodeId === qualityGate?.id &&
                edge.toNodeId === node.id &&
                edge.kind === 'blocks'
              )
          )
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : undefined;
  if (workflow.completionPolicy.requireFinalAudit && !finalAudit) {
    missing.push(
      nodes.some((node) => node.kind === 'final_audit')
        ? 'final_audit_stale_incomplete_or_unlinked'
        : 'final_audit',
    );
  }

  return {
    canComplete: missing.length === 0,
    missing: [...new Set(missing)],
    ...(qualityGate ? { qualityGateNodeId: qualityGate.id } : {}),
    ...(finalAudit ? { finalAuditNodeId: finalAudit.id } : {}),
  };
};

export const listWorkflows = async (
  kv: Deno.Kv,
  tags?: readonly string[],
): Promise<unknown[]> => {
  const workflows: Workflow[] = [];
  for await (
    const entry of kv.list<Workflow>({ prefix: WORKFLOW_PREFIX })
  ) {
    if (entry.value) workflows.push(normalizeWorkflow(entry.value));
  }
  const nodes = await listWorkflowNodes(kv);
  const normalizedFilter = tags ? normalizeTags(tags) : undefined;
  const filtered = workflows
    .filter((workflow) => {
      if (!normalizedFilter || normalizedFilter.length === 0) return true;
      return normalizedFilter.every((tag) => workflow.tags.includes(tag));
    });
  const decorated = await Promise.all(
    filtered.map(async (workflow) => {
      const own = nodes.filter((node) => node.workflowId === workflow.id);
      const counts = own.reduce<Record<string, number>>((acc, node) => {
        acc[node.status] = (acc[node.status] ?? 0) + 1;
        return acc;
      }, {});
      const completionReadiness = await getWorkflowCompletionReadiness(
        kv,
        workflow.id,
      );
      return {
        ...workflow,
        nodeCount: own.length,
        nodeCounts: counts,
        canComplete: completionReadiness.canComplete,
        completionReadiness,
      };
    }),
  );
  return decorated.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getWorkflowDetail = async (
  kv: Deno.Kv,
  id: string,
): Promise<Record<string, unknown> | null> => {
  const workflow = await getWorkflow(kv, id);
  if (!workflow) return null;
  const [
    nodes,
    edges,
    runs,
    questions,
    agents,
    events,
    completionReadiness,
    macroArchives,
  ] = await Promise.all([
    listWorkflowNodes(kv, id),
    listWorkflowEdges(kv, id),
    listWorkflowRuns(kv, id),
    listWorkflowQuestions(kv, id),
    listAgents(kv),
    listWorkflowEvents(kv, id, 100),
    getWorkflowCompletionReadiness(kv, id),
    listWorkflowMacroArchives(kv, id),
  ]);
  return {
    workflow,
    nodes,
    edges,
    runs,
    questions,
    agents,
    events,
    canComplete: completionReadiness.canComplete,
    completionReadiness,
    macroArchives: macroArchives.map((archive) => ({
      macroId: archive.macroId,
      name: archive.name,
      title: archive.title,
      interpreter: archive.interpreter,
      scriptHash: archive.scriptHash,
      archivedAt: archive.archivedAt,
    })),
    deepLink: `http://127.0.0.1:3333/#workflow/${workflow.id}`,
  };
};

export const getWorkflowPlanningPacket = async (
  kv: Deno.Kv,
  id: string,
): Promise<Record<string, unknown> | null> => {
  const workflow = await getWorkflow(kv, id);
  if (!workflow) return null;
  const [nodes, edges, questions, completionReadiness] = await Promise.all([
    listWorkflowNodes(kv, id),
    listWorkflowEdges(kv, id),
    listWorkflowQuestions(kv, id),
    getWorkflowCompletionReadiness(kv, id),
  ]);
  return {
    workflow,
    planDigest: {
      nodeCount: nodes.length,
      statusCounts: nodes.reduce<Record<string, number>>((counts, node) => {
        counts[node.status] = (counts[node.status] ?? 0) + 1;
        return counts;
      }, {}),
      openQuestionCount:
        questions.filter((question) => question.status === 'open').length,
      completionReadiness,
    },
    nodes: nodes.map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      acceptanceCriteria: node.acceptanceCriteria,
      contextRefs: node.contextRefs,
      status: node.status,
      complexity: node.complexity,
      kind: node.kind,
      requiredCapabilities: node.requiredCapabilities,
      recommendedAgent: node.recommendedAgent,
      readScopes: node.readScopes,
      writeScopes: node.writeScopes,
      isolation: node.isolation,
      attemptCount: node.attemptCount,
      maxAttempts: node.maxAttempts,
    })),
    edges,
  };
};

export const getWorkflowStatusPacket = async (
  kv: Deno.Kv,
  id: string,
): Promise<Record<string, unknown> | null> => {
  const workflow = await getWorkflow(kv, id);
  if (!workflow) return null;
  const [nodes, completionReadiness] = await Promise.all([
    listWorkflowNodes(kv, id),
    getWorkflowCompletionReadiness(kv, id),
  ]);
  return {
    workflow: {
      id: workflow.id,
      title: workflow.title,
      objective: workflow.objective,
      status: workflow.status,
      orchestrationSessionId: workflow.orchestrationSessionId,
      updatedAt: workflow.updatedAt,
    },
    nodeCounts: nodes.reduce<Record<string, number>>((counts, node) => {
      counts[node.status] = (counts[node.status] ?? 0) + 1;
      return counts;
    }, {}),
    completionReadiness,
  };
};

export const createWorkflow = async (
  kv: Deno.Kv,
  input: CreateWorkflowInput,
): Promise<Workflow> => {
  const timestamp = now();
  const workflow: Workflow = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    objective: input.objective.trim(),
    description: input.description?.trim() ?? '',
    tags: normalizeTags(input.tags),
    status: 'draft',
    conflictPolicy: input.conflictPolicy ?? 'warn',
    defaultMaxAttempts: Math.max(
      1,
      Math.min(20, input.defaultMaxAttempts ?? 3),
    ),
    completionPolicy: {
      ...DEFAULT_COMPLETION_POLICY,
      ...(input.completionPolicy ?? {}),
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await kv.set(workflowKey(workflow.id), workflow);
  await recordEvent(
    kv,
    makeEvent(workflow.id, 'workflow.created', { title: workflow.title }),
  );
  return workflow;
};

export const updateWorkflow = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateWorkflowInput,
): Promise<Workflow | null> => {
  const existing = await getWorkflow(kv, id);
  if (!existing) return null;
  const updated: Workflow = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.objective !== undefined
      ? { objective: input.objective.trim() }
      : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() }
      : {}),
    ...(input.tags !== undefined ? { tags: normalizeTags(input.tags) } : {}),
    ...(input.conflictPolicy !== undefined
      ? { conflictPolicy: input.conflictPolicy }
      : {}),
    ...(input.defaultMaxAttempts !== undefined
      ? {
        defaultMaxAttempts: Math.max(
          1,
          Math.min(20, input.defaultMaxAttempts),
        ),
      }
      : {}),
    ...(input.completionPolicy !== undefined
      ? {
        completionPolicy: {
          ...existing.completionPolicy,
          ...input.completionPolicy,
        },
      }
      : {}),
    updatedAt: now(),
  };
  await kv.set(workflowKey(id), updated);
  await recordEvent(
    kv,
    makeEvent(id, 'workflow.updated', { fields: Object.keys(input) }),
  );
  return updated;
};

export const deleteWorkflow = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const workflow = await getWorkflow(kv, id);
  if (!workflow) return false;
  const nodes = await listWorkflowNodes(kv, id);
  for (const node of nodes) {
    for (const run of await listNodeRuns(kv, node.id)) {
      await kv.delete(runKey(node.id, run.id));
    }
    await kv.delete(nodeKey(node.id));
  }
  for (const edge of await listWorkflowEdges(kv, id)) {
    await kv.delete(edgeKey(id, edge.id));
  }
  for (const question of await listWorkflowQuestions(kv, id)) {
    await kv.delete(questionKey(id, question.id));
  }
  for await (
    const entry of kv.list<WorkflowEvent>({
      prefix: ['workflow_events', id],
    })
  ) {
    await kv.delete(entry.key);
  }
  await deleteWorkflowMacros(kv, id);
  await deleteWorkflowMacroArchives(kv, id);
  await kv.delete(workflowKey(id));
  broadcastWorkflowEvent({
    id: crypto.randomUUID(),
    type: 'workflow.deleted',
    payload: { workflowId: id },
    createdAt: now(),
  });
  return true;
};

const blockingDependenciesDone = (
  node: WorkflowNode,
  nodes: readonly WorkflowNode[],
  edges: readonly WorkflowEdge[],
): boolean => {
  const blockers = edges.filter((edge) =>
    edge.toNodeId === node.id && edge.kind === 'blocks'
  );
  if (blockers.length === 0) return true;
  const byId = new Map(nodes.map((item) => [item.id, item]));
  return blockers.every((edge) => {
    const source = byId.get(edge.fromNodeId);
    return source?.status === 'done' || source?.status === 'cancelled';
  });
};

export const refreshWorkflowReadiness = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<void> => {
  const workflow = await getWorkflow(kv, workflowId);
  if (!workflow) return;
  const [nodes, edges] = await Promise.all([
    listWorkflowNodes(kv, workflowId),
    listWorkflowEdges(kv, workflowId),
  ]);
  const active = workflow.status === 'running' ||
    workflow.status === 'reviewing' ||
    workflow.status === 'blocked';
  for (const node of nodes) {
    if (node.status !== 'pending' && node.status !== 'ready') continue;
    const next = active && blockingDependenciesDone(node, nodes, edges)
      ? 'ready'
      : 'pending';
    if (next === node.status) continue;
    const updated: WorkflowNode = {
      ...node,
      status: next,
      updatedAt: now(),
    };
    await kv.set(nodeKey(node.id), updated);
    await recordEvent(
      kv,
      makeEvent(
        workflowId,
        `node.${next}`,
        { title: node.title },
        { nodeId: node.id },
      ),
    );
  }
};

export const createWorkflowNode = async (
  kv: Deno.Kv,
  workflowId: string,
  input: CreateWorkflowNodeInput,
): Promise<WorkflowNode> => {
  const workflow = await getWorkflow(kv, workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  const dependencyIds = uniqueStrings(input.dependsOn);
  for (const dependencyId of dependencyIds) {
    const dependency = await getWorkflowNode(kv, dependencyId);
    if (!dependency || dependency.workflowId !== workflowId) {
      throw new WorkflowValidationError(
        `dependência ${dependencyId} não pertence ao workflow`,
      );
    }
  }
  const timestamp = now();
  const node: WorkflowNode = {
    id: crypto.randomUUID(),
    workflowId,
    title: input.title.trim(),
    description: input.description.trim(),
    acceptanceCriteria: uniqueStrings(input.acceptanceCriteria),
    contextRefs: input.contextRefs ?? [],
    status: 'pending',
    complexity: input.complexity ?? 'm',
    kind: input.kind?.trim() || 'general',
    requiredCapabilities: capabilities(input.requiredCapabilities),
    ...(input.recommendedAgent
      ? { recommendedAgent: input.recommendedAgent }
      : {}),
    readScopes: scopes(input.readScopes),
    writeScopes: scopes(input.writeScopes),
    isolation: input.isolation ?? 'shared',
    attemptCount: 0,
    maxAttempts: Math.max(
      1,
      Math.min(20, input.maxAttempts ?? workflow.defaultMaxAttempts),
    ),
    ...(input.position ? { position: input.position } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await kv.set(nodeKey(node.id), node);
  for (const dependencyId of dependencyIds) {
    await createWorkflowEdge(
      kv,
      workflowId,
      dependencyId,
      node.id,
      'blocks',
    );
  }
  await recordEvent(
    kv,
    makeEvent(
      workflowId,
      'node.created',
      {
        title: node.title,
        complexity: node.complexity,
        kind: node.kind,
      },
      { nodeId: node.id },
    ),
  );
  await refreshWorkflowReadiness(kv, workflowId);
  return (await getWorkflowNode(kv, node.id)) ?? node;
};

export const updateWorkflowNode = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateWorkflowNodeInput,
): Promise<WorkflowNode | null> => {
  const existing = await getWorkflowNode(kv, id);
  if (!existing) return null;
  const updated: WorkflowNode = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() }
      : {}),
    ...(input.acceptanceCriteria !== undefined
      ? { acceptanceCriteria: uniqueStrings(input.acceptanceCriteria) }
      : {}),
    ...(input.contextRefs !== undefined
      ? { contextRefs: input.contextRefs }
      : {}),
    ...(input.complexity !== undefined ? { complexity: input.complexity } : {}),
    ...(input.kind !== undefined ? { kind: input.kind.trim() } : {}),
    ...(input.requiredCapabilities !== undefined
      ? {
        requiredCapabilities: capabilities(input.requiredCapabilities),
      }
      : {}),
    ...(input.recommendedAgent !== undefined
      ? { recommendedAgent: input.recommendedAgent }
      : {}),
    ...(input.readScopes !== undefined
      ? { readScopes: scopes(input.readScopes) }
      : {}),
    ...(input.writeScopes !== undefined
      ? { writeScopes: scopes(input.writeScopes) }
      : {}),
    ...(input.isolation !== undefined ? { isolation: input.isolation } : {}),
    ...(input.maxAttempts !== undefined
      ? { maxAttempts: Math.max(1, Math.min(20, input.maxAttempts)) }
      : {}),
    ...(input.position !== undefined ? { position: input.position } : {}),
    updatedAt: now(),
  };
  await kv.set(nodeKey(id), updated);
  await recordEvent(
    kv,
    makeEvent(
      existing.workflowId,
      'node.updated',
      { fields: Object.keys(input) },
      { nodeId: id },
    ),
  );
  return updated;
};

export const deleteWorkflowNode = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const node = await getWorkflowNode(kv, id);
  if (!node) return false;
  if (
    node.status === 'claimed' || node.status === 'in_progress' ||
    node.status === 'waiting_input'
  ) {
    throw new WorkflowConflictError('nó possui execução ativa');
  }
  for (const run of await listNodeRuns(kv, id)) {
    await kv.delete(runKey(id, run.id));
  }
  for (const edge of await listWorkflowEdges(kv, node.workflowId)) {
    if (edge.fromNodeId === id || edge.toNodeId === id) {
      await kv.delete(edgeKey(node.workflowId, edge.id));
    }
  }
  await kv.delete(nodeKey(id));
  await recordEvent(
    kv,
    makeEvent(
      node.workflowId,
      'node.deleted',
      { title: node.title },
      { nodeId: id },
    ),
  );
  await refreshWorkflowReadiness(kv, node.workflowId);
  return true;
};

const createsCycle = (
  edges: readonly WorkflowEdge[],
  fromNodeId: string,
  toNodeId: string,
): boolean => {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges.filter((item) => item.kind === 'blocks')) {
    outgoing.set(edge.fromNodeId, [
      ...(outgoing.get(edge.fromNodeId) ?? []),
      edge.toNodeId,
    ]);
  }
  outgoing.set(fromNodeId, [
    ...(outgoing.get(fromNodeId) ?? []),
    toNodeId,
  ]);
  const pending = [toNodeId];
  const seen = new Set<string>();
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (current === fromNodeId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    pending.push(...(outgoing.get(current) ?? []));
  }
  return false;
};

export const createWorkflowEdge = async (
  kv: Deno.Kv,
  workflowId: string,
  fromNodeId: string,
  toNodeId: string,
  kind: WorkflowEdgeKind = 'blocks',
): Promise<WorkflowEdge> => {
  if (fromNodeId === toNodeId) {
    throw new WorkflowValidationError('um nó não pode depender dele mesmo');
  }
  const [from, to, edges] = await Promise.all([
    getWorkflowNode(kv, fromNodeId),
    getWorkflowNode(kv, toNodeId),
    listWorkflowEdges(kv, workflowId),
  ]);
  if (
    !from || !to || from.workflowId !== workflowId ||
    to.workflowId !== workflowId
  ) {
    throw new WorkflowValidationError('nós da aresta são inválidos');
  }
  const duplicate = edges.find((edge) =>
    edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId &&
    edge.kind === kind
  );
  if (duplicate) return duplicate;
  if (kind === 'blocks' && createsCycle(edges, fromNodeId, toNodeId)) {
    throw new WorkflowConflictError('a dependência criaria um ciclo');
  }
  const edge: WorkflowEdge = {
    id: crypto.randomUUID(),
    workflowId,
    fromNodeId,
    toNodeId,
    kind,
    createdAt: now(),
  };
  await kv.set(edgeKey(workflowId, edge.id), edge);
  await recordEvent(
    kv,
    makeEvent(workflowId, 'edge.created', {
      edgeId: edge.id,
      fromNodeId,
      toNodeId,
      kind,
    }),
  );
  await refreshWorkflowReadiness(kv, workflowId);
  return edge;
};

export const ensureWorkflowFinalBarriers = async (
  kv: Deno.Kv,
  workflowId: string,
): Promise<Record<string, unknown>> => {
  const workflow = await getWorkflow(kv, workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (workflow.status === 'done' || workflow.status === 'cancelled') {
    throw new WorkflowConflictError(`workflow está ${workflow.status}`);
  }

  let nodes = await listWorkflowNodes(kv, workflowId);
  const workNodes = nodes.filter((node) =>
    node.kind !== 'quality_gate' && node.kind !== 'final_audit'
  );
  if (workNodes.length === 0) {
    throw new WorkflowValidationError(
      'crie ao menos um nó de trabalho antes das barreiras finais',
    );
  }

  const edgesBefore = await listWorkflowEdges(kv, workflowId);
  const workNodeIds = new Set(workNodes.map((node) => node.id));
  const workNodesWithSuccessor = new Set(
    edgesBefore
      .filter((edge) =>
        edge.kind === 'blocks' &&
        workNodeIds.has(edge.fromNodeId) &&
        workNodeIds.has(edge.toNodeId)
      )
      .map((edge) => edge.fromNodeId),
  );
  const leafNodes = workNodes.filter((node) =>
    !workNodesWithSuccessor.has(node.id)
  );
  const reusable = (node: WorkflowNode): boolean =>
    node.status !== 'done' && node.status !== 'cancelled' &&
    node.status !== 'human_intervention';
  let qualityGate = [...nodes]
    .filter((node) => node.kind === 'quality_gate' && reusable(node))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  let qualityGateCreated = false;
  if (!qualityGate) {
    qualityGate = await createWorkflowNode(kv, workflowId, {
      title: 'Quality Gate: validação consolidada',
      description:
        'Executar em modo read-only todos os checks oficiais do projeto e os checks específicos da demanda.',
      acceptanceCriteria: [
        'Todos os comandos obrigatórios foram executados e registrados',
        'Lint, typecheck, testes, build e smoke aplicáveis passaram',
        'Nenhuma falha obrigatória foi omitida ou classificada como sucesso',
      ],
      kind: 'quality_gate',
      complexity: 'm',
      requiredCapabilities: ['code', 'tests'],
      readScopes: ['*'],
      writeScopes: [],
      dependsOn: leafNodes.map((node) => node.id),
    });
    qualityGateCreated = true;
  } else {
    for (const leaf of leafNodes) {
      await createWorkflowEdge(
        kv,
        workflowId,
        leaf.id,
        qualityGate.id,
        'blocks',
      );
    }
  }

  nodes = await listWorkflowNodes(kv, workflowId);
  let finalAudit = [...nodes]
    .filter((node) => node.kind === 'final_audit' && reusable(node))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  let finalAuditCreated = false;
  if (!finalAudit) {
    finalAudit = await createWorkflowNode(kv, workflowId, {
      title: 'Final Audit: revisão geral independente',
      description:
        'Auditoria read-only de qualidade, bugs, crashes, edge cases, regressões, segurança e mudanças fora do escopo.',
      acceptanceCriteria: [
        'Diff consolidado e objetivo foram revisados',
        'Não há achados critical ou high sem correção',
        'Riscos residuais e comportamentos não intencionais foram registrados',
      ],
      kind: 'final_audit',
      complexity: 'm',
      requiredCapabilities: ['code', 'tests'],
      readScopes: ['*'],
      writeScopes: [],
      dependsOn: [qualityGate.id],
    });
    finalAuditCreated = true;
  } else {
    await createWorkflowEdge(
      kv,
      workflowId,
      qualityGate.id,
      finalAudit.id,
      'blocks',
    );
  }

  const finalEdges = await listWorkflowEdges(kv, workflowId);
  return {
    workflowId,
    qualityGate,
    finalAudit,
    created: {
      qualityGate: qualityGateCreated,
      finalAudit: finalAuditCreated,
    },
    leafNodeIds: leafNodes.map((node) => node.id),
    blockingEdges: finalEdges.filter((edge) =>
      edge.kind === 'blocks' &&
      (
        edge.toNodeId === qualityGate.id ||
        (
          edge.fromNodeId === qualityGate.id &&
          edge.toNodeId === finalAudit.id
        )
      )
    ),
  };
};

export const deleteWorkflowEdge = async (
  kv: Deno.Kv,
  workflowId: string,
  id: string,
): Promise<boolean> => {
  const entry = await kv.get<WorkflowEdge>(edgeKey(workflowId, id));
  if (!entry.value) return false;
  await kv.delete(edgeKey(workflowId, id));
  await recordEvent(
    kv,
    makeEvent(workflowId, 'edge.deleted', { edgeId: id }),
  );
  await refreshWorkflowReadiness(kv, workflowId);
  return true;
};

export const getAgent = async (
  kv: Deno.Kv,
  id: string,
): Promise<AgentSession | null> => {
  const entry = await kv.get<AgentSession>(agentKey(id));
  return entry.value ? withComputedPresence(entry.value) : null;
};

export const listAgents = async (kv: Deno.Kv): Promise<AgentSession[]> => {
  const agents: AgentSession[] = [];
  for await (
    const entry of kv.list<AgentSession>({ prefix: AGENT_PREFIX })
  ) {
    if (entry.value) agents.push(withComputedPresence(entry.value));
  }
  return agents.sort((a, b) =>
    b.lastHeartbeatAt.localeCompare(a.lastHeartbeatAt)
  );
};

export const connectAgent = async (
  kv: Deno.Kv,
  input: ConnectAgentInput,
): Promise<AgentSession> => {
  const timestamp = now();
  const agent: AgentSession = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    tool: input.tool.trim(),
    provider: input.provider.trim(),
    model: input.model.trim(),
    role: input.role,
    capabilities: capabilities(input.capabilities),
    ...(input.operator?.trim() ? { operator: input.operator.trim() } : {}),
    presence: 'idle',
    connectedAt: timestamp,
    lastHeartbeatAt: timestamp,
  };
  await kv.set(agentKey(agent.id), agent);
  broadcastWorkflowEvent({
    id: crypto.randomUUID(),
    type: 'agent.connected',
    payload: { agent },
    createdAt: timestamp,
  });
  return agent;
};

export const heartbeatAgent = async (
  kv: Deno.Kv,
  id: string,
): Promise<AgentSession | null> => {
  const entry = await kv.get<AgentSession>(agentKey(id));
  if (!entry.value) return null;
  const updated: AgentSession = {
    ...entry.value,
    presence: entry.value.currentNodeId ? 'busy' : 'idle',
    lastHeartbeatAt: now(),
  };
  await kv.set(agentKey(id), updated);
  broadcastWorkflowEvent({
    id: crypto.randomUUID(),
    type: 'agent.heartbeat',
    payload: {
      agentId: id,
      presence: updated.presence,
      lastHeartbeatAt: updated.lastHeartbeatAt,
    },
    createdAt: updated.lastHeartbeatAt,
  });
  return updated;
};

export const disconnectAgent = async (
  kv: Deno.Kv,
  id: string,
): Promise<AgentSession | null> => {
  const entry = await kv.get<AgentSession>(agentKey(id));
  if (!entry.value) return null;
  if (entry.value.currentNodeId) {
    throw new WorkflowConflictError(
      'agente possui execução ativa; libere o nó antes',
    );
  }
  const timestamp = now();
  const updated: AgentSession = {
    ...entry.value,
    presence: 'offline',
    lastHeartbeatAt: timestamp,
    disconnectedAt: timestamp,
  };
  await kv.set(agentKey(id), updated);
  broadcastWorkflowEvent({
    id: crypto.randomUUID(),
    type: 'agent.disconnected',
    payload: { agentId: id },
    createdAt: timestamp,
  });
  return updated;
};

export const claimOrchestration = async (
  kv: Deno.Kv,
  workflowId: string,
  agentSessionId: string,
): Promise<Workflow> => {
  const [workflowEntry, agentEntry] = await Promise.all([
    kv.get<Workflow>(workflowKey(workflowId)),
    kv.get<AgentSession>(agentKey(agentSessionId)),
  ]);
  const workflow = workflowEntry.value;
  const agent = agentEntry.value;
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (!agent) throw new WorkflowMissingError('sessão de agente não encontrada');
  if (agent.role !== 'orchestrator') {
    throw new WorkflowValidationError('agente não é orquestrador');
  }
  if (computedPresence(agent) === 'stale' || agent.presence === 'offline') {
    throw new WorkflowConflictError('sessão offline ou stale; envie heartbeat');
  }
  if (
    workflow.orchestrationSessionId &&
    workflow.orchestrationSessionId !== agentSessionId
  ) {
    throw new WorkflowConflictError(
      'workflow já possui outro orquestrador',
    );
  }
  const timestamp = now();
  const updatedWorkflow: Workflow = {
    ...workflow,
    orchestrationSessionId: agentSessionId,
    status: workflow.status === 'draft' ? 'planning' : workflow.status,
    updatedAt: timestamp,
  };
  const updatedAgent: AgentSession = {
    ...agent,
    currentWorkflowId: workflowId,
    presence: 'busy',
    lastHeartbeatAt: timestamp,
  };
  const event = makeEvent(
    workflowId,
    'workflow.orchestrator_claimed',
    {
      agentName: agent.name,
      provider: agent.provider,
      model: agent.model,
    },
    { agentSessionId },
  );
  const result = await kv.atomic()
    .check(workflowEntry)
    .check(agentEntry)
    .set(workflowKey(workflowId), updatedWorkflow)
    .set(agentKey(agentSessionId), updatedAgent)
    .set(eventKey(event), event)
    .commit();
  if (!result.ok) {
    throw new WorkflowConflictError('workflow mudou durante o claim');
  }
  broadcastWorkflowEvent(event);
  return updatedWorkflow;
};

export const releaseOrchestration = async (
  kv: Deno.Kv,
  workflowId: string,
  agentSessionId?: string,
): Promise<Workflow> => {
  const workflow = await getWorkflow(kv, workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (
    agentSessionId && workflow.orchestrationSessionId &&
    workflow.orchestrationSessionId !== agentSessionId
  ) {
    throw new WorkflowConflictError('sessão não controla este workflow');
  }
  const previousAgentId = workflow.orchestrationSessionId;
  const base = { ...workflow } as Record<string, unknown>;
  delete base.orchestrationSessionId;
  const updated = {
    ...base,
    updatedAt: now(),
  } as Workflow;
  await kv.set(workflowKey(workflowId), updated);
  if (previousAgentId) {
    const agentEntry = await kv.get<AgentSession>(agentKey(previousAgentId));
    if (agentEntry.value && !agentEntry.value.currentNodeId) {
      const agentBase = { ...agentEntry.value } as Record<string, unknown>;
      delete agentBase.currentWorkflowId;
      await kv.set(agentKey(previousAgentId), {
        ...agentBase,
        presence: 'idle',
        lastHeartbeatAt: now(),
      } as AgentSession);
    }
  }
  await recordEvent(
    kv,
    makeEvent(
      workflowId,
      'workflow.orchestrator_released',
      {},
      previousAgentId ? { agentSessionId: previousAgentId } : {},
    ),
  );
  return updated;
};

export const startWorkflow = async (
  kv: Deno.Kv,
  workflowId: string,
  agentSessionId?: string,
): Promise<Workflow> => {
  const workflow = await getWorkflow(kv, workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (
    agentSessionId && workflow.orchestrationSessionId &&
    workflow.orchestrationSessionId !== agentSessionId
  ) {
    throw new WorkflowConflictError('sessão não controla este workflow');
  }
  const updated: Workflow = {
    ...workflow,
    status: 'running',
    updatedAt: now(),
  };
  await kv.set(workflowKey(workflowId), updated);
  await recordEvent(
    kv,
    makeEvent(
      workflowId,
      'workflow.started',
      {},
      agentSessionId ? { agentSessionId } : {},
    ),
  );
  await refreshWorkflowReadiness(kv, workflowId);
  return updated;
};

export const completeWorkflow = async (
  kv: Deno.Kv,
  workflowId: string,
  summary: string,
  agentSessionId?: string,
): Promise<Workflow> => {
  const workflow = await getWorkflow(kv, workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (
    agentSessionId && workflow.orchestrationSessionId &&
    workflow.orchestrationSessionId !== agentSessionId
  ) {
    throw new WorkflowConflictError('sessão não controla este workflow');
  }
  const completionReadiness = await getWorkflowCompletionReadiness(
    kv,
    workflowId,
  );
  if (!completionReadiness.canComplete) {
    throw new WorkflowConflictError(
      `workflow ainda não atende às barreiras de conclusão: ${
        completionReadiness.missing.join(', ')
      }`,
    );
  }
  const timestamp = now();
  const updated: Workflow = {
    ...workflow,
    status: 'done',
    completionSummary: trimText(summary, 12000) ?? '',
    completedAt: timestamp,
    updatedAt: timestamp,
  };
  await kv.set(workflowKey(workflowId), updated);
  const archivedMacros = await archiveAndDeleteWorkflowMacros(kv, workflowId);
  if (workflow.orchestrationSessionId) {
    const agentEntry = await kv.get<AgentSession>(
      agentKey(workflow.orchestrationSessionId),
    );
    if (agentEntry.value) {
      const agentBase = { ...agentEntry.value } as Record<string, unknown>;
      delete agentBase.currentWorkflowId;
      await kv.set(agentKey(agentEntry.value.id), {
        ...agentBase,
        presence: 'idle',
        lastHeartbeatAt: timestamp,
      } as AgentSession);
    }
  }
  await recordEvent(
    kv,
    makeEvent(
      workflowId,
      'workflow.completed',
      {
        summary: updated.completionSummary,
        completionReadiness,
        archivedWorkflowMacros: archivedMacros.map((archive) => ({
          macroId: archive.macroId,
          name: archive.name,
          scriptHash: archive.scriptHash,
        })),
      },
      agentSessionId ? { agentSessionId } : {},
    ),
  );
  return updated;
};

const scopesOverlap = (
  left: readonly string[],
  right: readonly string[],
): boolean => {
  for (const a of left) {
    for (const b of right) {
      if (
        a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`) ||
        a === '*' || b === '*'
      ) return true;
    }
  }
  return false;
};

const activeConflicts = async (
  kv: Deno.Kv,
  node: WorkflowNode,
): Promise<NodeExecutionPackage['conflicts']> => {
  if (node.writeScopes.length === 0) return [];
  const nodes = await listWorkflowNodes(kv, node.workflowId);
  return nodes
    .filter((other) =>
      other.id !== node.id &&
      (
        other.status === 'claimed' || other.status === 'in_progress' ||
        other.status === 'waiting_input'
      ) &&
      scopesOverlap(node.writeScopes, other.writeScopes)
    )
    .map((other) => ({
      nodeId: other.id,
      title: other.title,
      writeScopes: other.writeScopes,
    }));
};

const dependencyResults = async (
  kv: Deno.Kv,
  node: WorkflowNode,
): Promise<DependencyResult[]> => {
  const edges = await listWorkflowEdges(kv, node.workflowId);
  const dependencies = edges.filter((edge) =>
    edge.toNodeId === node.id && edge.kind === 'blocks'
  );
  const results: DependencyResult[] = [];
  for (const edge of dependencies) {
    const dependency = await getWorkflowNode(kv, edge.fromNodeId);
    if (!dependency) continue;
    const runs = await listNodeRuns(kv, dependency.id);
    const run = [...runs].reverse().find((item) =>
      item.status === 'approved' && item.output
    );
    results.push({
      nodeId: dependency.id,
      title: dependency.title,
      ...(run?.output?.summary ? { summary: run.output.summary } : {}),
      ...(run?.output?.result ? { result: run.output.result } : {}),
      changedFiles: run?.output?.changedFiles ?? [],
      artifacts: run?.output?.artifacts ?? [],
    });
  }
  return results;
};

export const getNodeExecutionPackage = async (
  kv: Deno.Kv,
  nodeId: string,
): Promise<NodeExecutionPackage | null> => {
  const node = await getWorkflowNode(kv, nodeId);
  if (!node) return null;
  const workflow = await getWorkflow(kv, node.workflowId);
  if (!workflow) return null;
  const [dependencies, conflicts] = await Promise.all([
    dependencyResults(kv, node),
    activeConflicts(kv, node),
  ]);
  return { workflow, node, dependencies, conflicts };
};

export const getNodeReviewPacket = async (
  kv: Deno.Kv,
  nodeId: string,
): Promise<Record<string, unknown> | null> => {
  const pkg = await getNodeExecutionPackage(kv, nodeId);
  if (!pkg) return null;
  const [runs, questions] = await Promise.all([
    listNodeRuns(kv, nodeId),
    listWorkflowQuestions(kv, pkg.workflow.id),
  ]);
  const currentRun = pkg.node.currentRunId
    ? runs.find((run) => run.id === pkg.node.currentRunId)
    : undefined;
  const output = currentRun?.output;
  return {
    workflow: {
      id: pkg.workflow.id,
      title: pkg.workflow.title,
      objective: pkg.workflow.objective,
      status: pkg.workflow.status,
    },
    node: pkg.node,
    dependencies: pkg.dependencies,
    conflicts: pkg.conflicts,
    currentRun: currentRun
      ? {
        id: currentRun.id,
        attempt: currentRun.attempt,
        status: currentRun.status,
        outcome: output?.outcome,
        summary: output?.summary,
        result: output?.result,
        changedFiles: output?.changedFiles ?? [],
        tests: output?.tests ?? [],
        artifacts: output?.artifacts ?? [],
        logCount: output?.logs.length ?? 0,
        diffChars: output?.diff?.length ?? 0,
        workspace: currentRun.workspace,
        returnedAt: currentRun.returnedAt,
      }
      : null,
    openQuestions: questions.filter((question) =>
      question.nodeId === nodeId && question.status === 'open'
    ),
    decisionRequest: {
      method: 'POST',
      url: `/workflows/nodes/${nodeId}/decision`,
      body: {
        agentSessionId: '{agentSessionId}',
        decision: 'approve',
        feedback: '',
        acceptanceChecks: pkg.node.acceptanceCriteria.map((criterion) => ({
          criterion,
          status: 'pass',
          evidence: '',
        })),
      },
    },
    fullDetailUrl: `/workflows/nodes/${nodeId}`,
  };
};

const agentCanExecute = (
  agent: AgentSession,
  node: WorkflowNode,
): boolean =>
  node.requiredCapabilities.every((capability) =>
    agent.capabilities.includes(capability)
  );

export const listAvailableNodes = async (
  kv: Deno.Kv,
  filter: {
    workflowId?: string;
    agentSessionId?: string;
  } = {},
): Promise<NodeExecutionPackage[]> => {
  const agent = filter.agentSessionId
    ? await getAgent(kv, filter.agentSessionId)
    : null;
  if (filter.agentSessionId && !agent) {
    throw new WorkflowMissingError('sessão de agente não encontrada');
  }
  const nodes = (await listWorkflowNodes(kv, filter.workflowId))
    .filter((node) => node.status === 'ready' || node.status === 'needs_rework')
    .filter((node) => !agent || agentCanExecute(agent, node));
  const packages: NodeExecutionPackage[] = [];
  for (const node of nodes) {
    if (
      agent && node.status === 'needs_rework' &&
      node.claimedBySessionId &&
      node.claimedBySessionId !== agent.id
    ) {
      const previousAgent = await getAgent(kv, node.claimedBySessionId);
      if (
        previousAgent &&
        computedPresence(previousAgent) !== 'stale' &&
        previousAgent.presence !== 'offline'
      ) {
        continue;
      }
    }
    const item = await getNodeExecutionPackage(kv, node.id);
    if (item) packages.push(item);
  }
  return packages;
};

export const claimNode = async (
  kv: Deno.Kv,
  nodeId: string,
  agentSessionId: string,
): Promise<NodeExecutionPackage> => {
  const [nodeEntry, agentEntry] = await Promise.all([
    kv.get<WorkflowNode>(nodeKey(nodeId)),
    kv.get<AgentSession>(agentKey(agentSessionId)),
  ]);
  const node = nodeEntry.value;
  const agent = agentEntry.value;
  if (!node) throw new WorkflowMissingError('nó não encontrado');
  if (!agent) throw new WorkflowMissingError('sessão de agente não encontrada');
  if (computedPresence(agent) === 'stale' || agent.presence === 'offline') {
    throw new WorkflowConflictError('sessão offline ou stale; envie heartbeat');
  }
  if (agent.role !== 'executor') {
    throw new WorkflowValidationError(
      'somente agente executor pode assumir execução',
    );
  }
  if (agent.currentNodeId && agent.currentNodeId !== nodeId) {
    throw new WorkflowConflictError('agente já está executando outro nó');
  }
  if (node.status !== 'ready' && node.status !== 'needs_rework') {
    throw new WorkflowConflictError(`nó não está disponível: ${node.status}`);
  }
  if (
    node.status === 'needs_rework' &&
    node.claimedBySessionId &&
    node.claimedBySessionId !== agentSessionId
  ) {
    const previousAgent = await getAgent(kv, node.claimedBySessionId);
    if (
      previousAgent &&
      computedPresence(previousAgent) !== 'stale' &&
      previousAgent.presence !== 'offline'
    ) {
      throw new WorkflowConflictError(
        'retrabalho reservado ao executor anterior enquanto sua sessão está ativa',
      );
    }
  }
  if (!agentCanExecute(agent, node)) {
    throw new WorkflowConflictError(
      'agente não possui as capacidades exigidas',
    );
  }
  if (node.attemptCount >= node.maxAttempts) {
    throw new WorkflowConflictError('limite de tentativas esgotado');
  }
  const workflow = await getWorkflow(kv, node.workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  const conflicts = await activeConflicts(kv, node);
  if (workflow.conflictPolicy === 'block' && conflicts.length > 0) {
    throw new WorkflowConflictError(
      `escopo de escrita conflita com ${
        conflicts.map((item) => item.title).join(', ')
      }`,
    );
  }
  const timestamp = now();
  const run: WorkflowRun = {
    id: crypto.randomUUID(),
    workflowId: node.workflowId,
    nodeId,
    agentSessionId,
    attempt: node.attemptCount + 1,
    status: 'claimed',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const updatedNode: WorkflowNode = {
    ...node,
    status: 'claimed',
    attemptCount: run.attempt,
    currentRunId: run.id,
    claimedBySessionId: agentSessionId,
    updatedAt: timestamp,
  };
  const updatedAgent: AgentSession = {
    ...agent,
    presence: 'busy',
    currentWorkflowId: node.workflowId,
    currentNodeId: nodeId,
    lastHeartbeatAt: timestamp,
  };
  const event = makeEvent(
    node.workflowId,
    'node.claimed',
    {
      title: node.title,
      attempt: run.attempt,
      agentName: agent.name,
      tool: agent.tool,
      provider: agent.provider,
      model: agent.model,
      conflicts,
    },
    { nodeId, runId: run.id, agentSessionId },
  );
  const result = await kv.atomic()
    .check(nodeEntry)
    .check(agentEntry)
    .set(nodeKey(nodeId), updatedNode)
    .set(runKey(nodeId, run.id), run)
    .set(agentKey(agentSessionId), updatedAgent)
    .set(eventKey(event), event)
    .commit();
  if (!result.ok) {
    throw new WorkflowConflictError('nó foi assumido por outro agente');
  }
  broadcastWorkflowEvent(event);
  return {
    workflow,
    node: updatedNode,
    dependencies: await dependencyResults(kv, updatedNode),
    conflicts,
  };
};

export const startNode = async (
  kv: Deno.Kv,
  nodeId: string,
  agentSessionId: string,
  workspace?: RunWorkspace,
): Promise<WorkflowRun> => {
  const node = await getWorkflowNode(kv, nodeId);
  if (!node) throw new WorkflowMissingError('nó não encontrado');
  if (node.claimedBySessionId !== agentSessionId || !node.currentRunId) {
    throw new WorkflowConflictError('nó não pertence a esta sessão');
  }
  if (node.status !== 'claimed' && node.status !== 'in_progress') {
    throw new WorkflowConflictError(`nó não pode iniciar em ${node.status}`);
  }
  const run = await getRun(kv, nodeId, node.currentRunId);
  const agent = await getAgent(kv, agentSessionId);
  if (!run || !agent) throw new WorkflowMissingError('run ou agente ausente');
  if (workspace && node.isolation !== workspace.kind) {
    throw new WorkflowValidationError(
      `isolamento esperado: ${node.isolation}`,
    );
  }
  if (node.isolation !== 'shared' && !workspace) {
    throw new WorkflowValidationError(
      `informe o ambiente ${node.isolation} usado pelo agente`,
    );
  }
  if (workspace?.kind === 'worktree' && !workspace.path?.trim()) {
    throw new WorkflowValidationError('worktree exige workspace.path');
  }
  if (workspace?.kind === 'branch' && !workspace.branch?.trim()) {
    throw new WorkflowValidationError('branch exige workspace.branch');
  }
  const timestamp = now();
  const updatedRun: WorkflowRun = {
    ...run,
    status: 'in_progress',
    ...(workspace ? { workspace } : {}),
    startedAt: run.startedAt ?? timestamp,
    updatedAt: timestamp,
  };
  const updatedNode: WorkflowNode = {
    ...node,
    status: 'in_progress',
    updatedAt: timestamp,
  };
  const updatedAgent: AgentSession = {
    ...agent,
    presence: 'busy',
    lastHeartbeatAt: timestamp,
  };
  await kv.set(runKey(nodeId, run.id), updatedRun);
  await kv.set(nodeKey(nodeId), updatedNode);
  await kv.set(agentKey(agentSessionId), updatedAgent);
  const workflow = await getWorkflow(kv, node.workflowId);
  if (workflow && workflow.status !== 'running') {
    await kv.set(workflowKey(workflow.id), {
      ...workflow,
      status: 'running',
      updatedAt: timestamp,
    });
  }
  await recordEvent(
    kv,
    makeEvent(
      node.workflowId,
      'node.started',
      { title: node.title, workspace: workspace ?? null },
      { nodeId, runId: run.id, agentSessionId },
    ),
  );
  return updatedRun;
};

export const returnNode = async (
  kv: Deno.Kv,
  nodeId: string,
  input: ReturnRunInput,
): Promise<WorkflowRun> => {
  const node = await getWorkflowNode(kv, nodeId);
  if (!node) throw new WorkflowMissingError('nó não encontrado');
  if (
    node.claimedBySessionId !== input.agentSessionId || !node.currentRunId
  ) {
    throw new WorkflowConflictError('nó não pertence a esta sessão');
  }
  if (
    node.status !== 'claimed' && node.status !== 'in_progress' &&
    node.status !== 'waiting_input'
  ) {
    throw new WorkflowConflictError(`nó não pode retornar em ${node.status}`);
  }
  const [run, agent, workflow] = await Promise.all([
    getRun(kv, nodeId, node.currentRunId),
    getAgent(kv, input.agentSessionId),
    getWorkflow(kv, node.workflowId),
  ]);
  if (!run || !agent || !workflow) {
    throw new WorkflowMissingError('run, agente ou workflow ausente');
  }
  const timestamp = now();
  const output = sanitizeOutput(input);
  const updatedRun: WorkflowRun = {
    ...run,
    status: 'returned',
    output,
    returnedAt: timestamp,
    updatedAt: timestamp,
  };
  const updatedNode: WorkflowNode = {
    ...node,
    status: 'returned',
    updatedAt: timestamp,
  };
  const agentBase = { ...agent } as Record<string, unknown>;
  delete agentBase.currentNodeId;
  delete agentBase.currentWorkflowId;
  const updatedAgent = {
    ...agentBase,
    presence: 'idle',
    lastHeartbeatAt: timestamp,
  } as AgentSession;
  await kv.set(runKey(nodeId, run.id), updatedRun);
  await kv.set(nodeKey(nodeId), updatedNode);
  await kv.set(agentKey(agent.id), updatedAgent);
  await kv.set(workflowKey(workflow.id), {
    ...workflow,
    status: 'reviewing',
    updatedAt: timestamp,
  });
  await recordEvent(
    kv,
    makeEvent(
      node.workflowId,
      'node.returned',
      {
        title: node.title,
        outcome: output.outcome,
        summary: output.summary,
        attempt: run.attempt,
      },
      {
        nodeId,
        runId: run.id,
        agentSessionId: input.agentSessionId,
      },
    ),
  );
  return updatedRun;
};

export const humanReturnNode = async (
  kv: Deno.Kv,
  nodeId: string,
  input: HumanReturnInput,
): Promise<WorkflowRun> => {
  const nodeEntry = await kv.get<WorkflowNode>(nodeKey(nodeId));
  const node = nodeEntry.value;
  if (!node) throw new WorkflowMissingError('nó não encontrado');
  if (node.status !== 'ready' && node.status !== 'needs_rework') {
    throw new WorkflowConflictError(
      `nó não aceita retorno humano em ${node.status}`,
    );
  }
  if (node.attemptCount >= node.maxAttempts) {
    throw new WorkflowConflictError('limite de tentativas esgotado');
  }
  const workflow = await getWorkflow(kv, node.workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  if (workflow.status === 'done' || workflow.status === 'cancelled') {
    throw new WorkflowConflictError(`workflow está ${workflow.status}`);
  }
  const conflicts = await activeConflicts(kv, node);
  if (workflow.conflictPolicy === 'block' && conflicts.length > 0) {
    throw new WorkflowConflictError(
      `escopo de escrita conflita com ${
        conflicts.map((item) => item.title).join(', ')
      }`,
    );
  }
  const timestamp = now();
  const agent: AgentSession = {
    id: crypto.randomUUID(),
    name: 'Usuário',
    tool: 'docmap-ui',
    provider: 'human',
    model: 'manual',
    role: 'executor',
    capabilities: ['human', 'manual'],
    operator: 'user',
    presence: 'idle',
    connectedAt: timestamp,
    lastHeartbeatAt: timestamp,
  };
  const output = sanitizeOutput({
    agentSessionId: agent.id,
    outcome: input.outcome ?? 'success',
    summary: input.summary,
    ...(input.result !== undefined ? { result: input.result } : {}),
    logs: input.logs ?? ['Retorno manual registrado no Docmap'],
    changedFiles: input.changedFiles ?? [],
    ...(input.diff !== undefined ? { diff: input.diff } : {}),
    tests: input.tests ?? [],
    artifacts: input.artifacts ?? [],
  });
  const run: WorkflowRun = {
    id: crypto.randomUUID(),
    workflowId: node.workflowId,
    nodeId,
    agentSessionId: agent.id,
    attempt: node.attemptCount + 1,
    status: 'returned',
    output,
    createdAt: timestamp,
    startedAt: timestamp,
    returnedAt: timestamp,
    updatedAt: timestamp,
  };
  const updatedNode: WorkflowNode = {
    ...node,
    status: 'returned',
    attemptCount: run.attempt,
    currentRunId: run.id,
    claimedBySessionId: agent.id,
    updatedAt: timestamp,
  };
  const updatedWorkflow: Workflow = {
    ...workflow,
    status: 'reviewing',
    updatedAt: timestamp,
  };
  const event = makeEvent(
    node.workflowId,
    'node.returned',
    {
      title: node.title,
      source: 'human',
      outcome: output.outcome,
      summary: output.summary,
      attempt: run.attempt,
      conflicts,
    },
    { nodeId, runId: run.id, agentSessionId: agent.id },
  );
  const result = await kv.atomic()
    .check(nodeEntry)
    .set(agentKey(agent.id), agent)
    .set(nodeKey(nodeId), updatedNode)
    .set(runKey(nodeId, run.id), run)
    .set(workflowKey(workflow.id), updatedWorkflow)
    .set(eventKey(event), event)
    .commit();
  if (!result.ok) {
    throw new WorkflowConflictError('nó mudou antes do retorno humano');
  }
  broadcastWorkflowEvent(event);
  return run;
};

const validateReviewer = async (
  kv: Deno.Kv,
  workflow: Workflow,
  agentSessionId?: string,
): Promise<void> => {
  if (!agentSessionId) return;
  const agent = await getAgent(kv, agentSessionId);
  if (!agent) throw new WorkflowMissingError('sessão de agente não encontrada');
  if (agent.role !== 'orchestrator' && agent.role !== 'reviewer') {
    throw new WorkflowValidationError('agente não pode revisar');
  }
  if (
    workflow.orchestrationSessionId &&
    agent.role === 'orchestrator' &&
    workflow.orchestrationSessionId !== agentSessionId
  ) {
    throw new WorkflowConflictError('sessão não controla este workflow');
  }
};

export const reviewNode = async (
  kv: Deno.Kv,
  nodeId: string,
  input: ReviewInput,
): Promise<WorkflowNode> => {
  const node = await getWorkflowNode(kv, nodeId);
  if (!node) throw new WorkflowMissingError('nó não encontrado');
  if (node.status !== 'returned' || !node.currentRunId) {
    throw new WorkflowConflictError(`nó não aguarda revisão: ${node.status}`);
  }
  const [run, workflow] = await Promise.all([
    getRun(kv, nodeId, node.currentRunId),
    getWorkflow(kv, node.workflowId),
  ]);
  if (!run || !workflow) {
    throw new WorkflowMissingError('run ou workflow ausente');
  }
  await validateReviewer(kv, workflow, input.agentSessionId);
  const acceptanceChecks: AcceptanceCheck[] = [];
  const checkedCriteria = new Set<string>();
  for (const check of input.acceptanceChecks ?? []) {
    const criterion = check.criterion.trim();
    const evidence = trimText(check.evidence.trim(), 4000) ?? '';
    if (!node.acceptanceCriteria.includes(criterion)) {
      throw new WorkflowValidationError(
        `critério não pertence ao nó: ${criterion}`,
      );
    }
    if (checkedCriteria.has(criterion)) {
      throw new WorkflowValidationError(`critério duplicado: ${criterion}`);
    }
    if (!['pass', 'fail', 'insufficient'].includes(check.status)) {
      throw new WorkflowValidationError(
        `status inválido para critério: ${criterion}`,
      );
    }
    checkedCriteria.add(criterion);
    acceptanceChecks.push({ criterion, status: check.status, evidence });
  }
  if (input.decision === 'approve' || input.decision === 'expand') {
    const checksByCriterion = new Map(
      acceptanceChecks.map((check) => [check.criterion, check]),
    );
    const unresolved = node.acceptanceCriteria.filter((criterion) => {
      const check = checksByCriterion.get(criterion);
      return check?.status !== 'pass' || !check.evidence;
    });
    if (unresolved.length > 0) {
      throw new WorkflowConflictError(
        `aprovação exige pass com evidência em todos os critérios: ${
          unresolved.join(' | ')
        }`,
      );
    }
  }
  if (
    (input.decision === 'approve' || input.decision === 'expand') &&
    (node.kind === 'quality_gate' || node.kind === 'final_audit') &&
    run.output?.outcome !== 'success'
  ) {
    throw new WorkflowConflictError(
      `${node.kind} só pode ser aprovado com outcome=success`,
    );
  }
  let nextStatus: WorkflowNode['status'];
  let runStatus: WorkflowRun['status'];
  if (input.decision === 'approve' || input.decision === 'expand') {
    nextStatus = 'done';
    runStatus = 'approved';
  } else if (input.decision === 'cancel') {
    nextStatus = 'cancelled';
    runStatus = 'cancelled';
  } else if (
    input.decision === 'human_intervention' ||
    node.attemptCount >= node.maxAttempts
  ) {
    nextStatus = 'human_intervention';
    runStatus = 'failed';
  } else {
    nextStatus = 'needs_rework';
    runStatus = 'rework';
  }
  const timestamp = now();
  const updatedRun: WorkflowRun = {
    ...run,
    status: runStatus,
    reviewDecision: input.decision,
    ...(input.feedback !== undefined
      ? { reviewFeedback: trimText(input.feedback, 12000) }
      : {}),
    ...(acceptanceChecks.length > 0 ? { acceptanceChecks } : {}),
    ...(input.agentSessionId
      ? { reviewedBySessionId: input.agentSessionId }
      : {}),
    reviewedAt: timestamp,
    updatedAt: timestamp,
  };
  const updatedNode: WorkflowNode = {
    ...node,
    status: nextStatus,
    updatedAt: timestamp,
  };
  await kv.set(runKey(nodeId, run.id), updatedRun);
  await kv.set(nodeKey(nodeId), updatedNode);
  const workflowStatus = nextStatus === 'human_intervention'
    ? 'blocked'
    : 'running';
  await kv.set(workflowKey(workflow.id), {
    ...workflow,
    status: workflowStatus,
    updatedAt: timestamp,
  });
  const eventType = nextStatus === 'done'
    ? 'node.done'
    : nextStatus === 'needs_rework'
    ? 'node.needs_rework'
    : nextStatus === 'human_intervention'
    ? 'node.human_intervention'
    : 'node.cancelled';
  await recordEvent(
    kv,
    makeEvent(
      node.workflowId,
      eventType,
      {
        title: node.title,
        decision: input.decision,
        feedback: input.feedback ?? '',
        acceptanceChecks,
        attempt: node.attemptCount,
        maxAttempts: node.maxAttempts,
      },
      {
        nodeId,
        runId: run.id,
        ...(input.agentSessionId
          ? { agentSessionId: input.agentSessionId }
          : {}),
      },
    ),
  );
  await refreshWorkflowReadiness(kv, node.workflowId);
  if (input.agentSessionId) {
    await heartbeatAgent(kv, input.agentSessionId);
  }
  return updatedNode;
};

export const releaseNode = async (
  kv: Deno.Kv,
  nodeId: string,
  agentSessionId?: string,
): Promise<WorkflowNode> => {
  const node = await getWorkflowNode(kv, nodeId);
  if (!node) throw new WorkflowMissingError('nó não encontrado');
  if (
    node.status !== 'claimed' && node.status !== 'in_progress' &&
    node.status !== 'waiting_input'
  ) {
    throw new WorkflowConflictError('nó não possui execução ativa');
  }
  if (
    agentSessionId && node.claimedBySessionId &&
    node.claimedBySessionId !== agentSessionId
  ) {
    throw new WorkflowConflictError('sessão não controla este nó');
  }
  const timestamp = now();
  const nextStatus = node.attemptCount >= node.maxAttempts
    ? 'human_intervention'
    : 'needs_rework';
  const base = { ...node } as Record<string, unknown>;
  delete base.currentRunId;
  delete base.claimedBySessionId;
  const updatedNode = {
    ...base,
    status: nextStatus,
    updatedAt: timestamp,
  } as WorkflowNode;
  if (node.currentRunId) {
    const run = await getRun(kv, nodeId, node.currentRunId);
    if (run) {
      await kv.set(runKey(nodeId, run.id), {
        ...run,
        status: 'abandoned',
        updatedAt: timestamp,
      } as WorkflowRun);
    }
  }
  if (node.claimedBySessionId) {
    const agent = await getAgent(kv, node.claimedBySessionId);
    if (agent) {
      const agentBase = { ...agent } as Record<string, unknown>;
      delete agentBase.currentNodeId;
      delete agentBase.currentWorkflowId;
      await kv.set(agentKey(agent.id), {
        ...agentBase,
        presence: 'idle',
        lastHeartbeatAt: timestamp,
      } as AgentSession);
    }
  }
  await kv.set(nodeKey(nodeId), updatedNode);
  await recordEvent(
    kv,
    makeEvent(
      node.workflowId,
      'node.released',
      { title: node.title, nextStatus },
      {
        nodeId,
        ...(node.currentRunId ? { runId: node.currentRunId } : {}),
        ...(agentSessionId ? { agentSessionId } : {}),
      },
    ),
  );
  return updatedNode;
};

export const askWorkflowQuestion = async (
  kv: Deno.Kv,
  nodeId: string,
  agentSessionId: string,
  questionText: string,
): Promise<WorkflowQuestion> => {
  const node = await getWorkflowNode(kv, nodeId);
  if (!node) throw new WorkflowMissingError('nó não encontrado');
  if (
    node.claimedBySessionId !== agentSessionId || !node.currentRunId
  ) {
    throw new WorkflowConflictError('nó não pertence a esta sessão');
  }
  if (node.status !== 'in_progress' && node.status !== 'claimed') {
    throw new WorkflowConflictError('nó não aceita pergunta neste estado');
  }
  const run = await getRun(kv, nodeId, node.currentRunId);
  if (!run) throw new WorkflowMissingError('run não encontrado');
  const timestamp = now();
  const question: WorkflowQuestion = {
    id: crypto.randomUUID(),
    workflowId: node.workflowId,
    nodeId,
    runId: run.id,
    askedBySessionId: agentSessionId,
    question: trimText(questionText.trim(), 8000) ?? '',
    status: 'open',
    createdAt: timestamp,
  };
  await kv.set(questionKey(node.workflowId, question.id), question);
  await kv.set(nodeKey(nodeId), {
    ...node,
    status: 'waiting_input',
    updatedAt: timestamp,
  } as WorkflowNode);
  await kv.set(runKey(nodeId, run.id), {
    ...run,
    status: 'waiting_input',
    updatedAt: timestamp,
  } as WorkflowRun);
  await recordEvent(
    kv,
    makeEvent(
      node.workflowId,
      'question.opened',
      { question: question.question, title: node.title },
      { nodeId, runId: run.id, agentSessionId },
    ),
  );
  return question;
};

export const answerWorkflowQuestion = async (
  kv: Deno.Kv,
  questionId: string,
  answer: string,
  agentSessionId?: string,
): Promise<WorkflowQuestion> => {
  let found: WorkflowQuestion | null = null;
  for await (
    const entry of kv.list<WorkflowQuestion>({ prefix: QUESTION_PREFIX })
  ) {
    if (entry.value?.id === questionId) {
      found = entry.value;
      break;
    }
  }
  if (!found) throw new WorkflowMissingError('pergunta não encontrada');
  if (found.status !== 'open') {
    throw new WorkflowConflictError('pergunta já foi encerrada');
  }
  const workflow = await getWorkflow(kv, found.workflowId);
  if (!workflow) throw new WorkflowMissingError('workflow não encontrado');
  await validateReviewer(kv, workflow, agentSessionId);
  const timestamp = now();
  const updated: WorkflowQuestion = {
    ...found,
    status: 'answered',
    answer: trimText(answer.trim(), 12000) ?? '',
    ...(agentSessionId ? { answeredBySessionId: agentSessionId } : {}),
    answeredAt: timestamp,
  };
  await kv.set(questionKey(found.workflowId, found.id), updated);
  const node = await getWorkflowNode(kv, found.nodeId);
  if (node?.status === 'waiting_input') {
    await kv.set(nodeKey(node.id), {
      ...node,
      status: 'in_progress',
      updatedAt: timestamp,
    } as WorkflowNode);
  }
  const run = await getRun(kv, found.nodeId, found.runId);
  if (run?.status === 'waiting_input') {
    await kv.set(runKey(found.nodeId, found.runId), {
      ...run,
      status: 'in_progress',
      updatedAt: timestamp,
    } as WorkflowRun);
  }
  await recordEvent(
    kv,
    makeEvent(
      found.workflowId,
      'question.answered',
      { questionId, answer: updated.answer },
      {
        nodeId: found.nodeId,
        runId: found.runId,
        ...(agentSessionId ? { agentSessionId } : {}),
      },
    ),
  );
  return updated;
};

export const listWorkflowEvents = async (
  kv: Deno.Kv,
  workflowId: string,
  limit = 200,
): Promise<WorkflowEvent[]> => {
  const events: WorkflowEvent[] = [];
  for await (
    const entry of kv.list<WorkflowEvent>({
      prefix: ['workflow_events', workflowId],
    }, { reverse: true, limit: Math.max(1, Math.min(1000, limit)) })
  ) {
    if (entry.value) events.push(entry.value);
  }
  return events;
};

export const getAgentInbox = async (
  kv: Deno.Kv,
  agentSessionId: string,
  filter: { readonly workflowId?: string } = {},
): Promise<Record<string, unknown>> => {
  const agent = await getAgent(kv, agentSessionId);
  if (!agent) throw new WorkflowMissingError('sessão de agente não encontrada');
  if (agent.role === 'orchestrator' || agent.role === 'reviewer') {
    const workflows = await listWorkflows(kv) as Array<
      Workflow & { canComplete: boolean }
    >;
    const nodes = await listWorkflowNodes(kv);
    const questions = await listWorkflowQuestions(kv);
    const allowed = (workflow: Workflow): boolean =>
      !workflow.orchestrationSessionId ||
      workflow.orchestrationSessionId === agentSessionId ||
      agent.role === 'reviewer';
    const workflowById = new Map(
      workflows.map((workflow) => [workflow.id, workflow]),
    );
    const planning = workflows.filter((workflow) =>
      (workflow.status === 'draft' || workflow.status === 'planning') &&
      allowed(workflow)
    );
    const returned = nodes.filter((node) =>
      node.status === 'returned' &&
      !!workflowById.get(node.workflowId) &&
      allowed(workflowById.get(node.workflowId)!)
    );
    const openQuestions = questions.filter((question) =>
      question.status === 'open' &&
      !!workflowById.get(question.workflowId) &&
      allowed(workflowById.get(question.workflowId)!)
    );
    const completable = workflows.filter((workflow) =>
      workflow.canComplete && workflow.status !== 'done' &&
      allowed(workflow)
    );
    const nextActions = [
      ...returned.map((node) => ({
        type: 'review_return',
        priority: 1,
        workflowId: node.workflowId,
        nodeId: node.id,
        reviewPacketUrl: `/workflows/nodes/${node.id}?view=review`,
      })),
      ...openQuestions.map((question) => ({
        type: 'answer_question',
        priority: 2,
        workflowId: question.workflowId,
        nodeId: question.nodeId,
        questionId: question.id,
        question: question.question,
      })),
      ...planning.map((workflow) => ({
        type: 'plan_workflow',
        priority: 3,
        workflowId: workflow.id,
        planningPacketUrl: `/workflows/${workflow.id}?view=planning`,
      })),
      ...completable.map((workflow) => ({
        type: 'complete_workflow',
        priority: 4,
        workflowId: workflow.id,
        statusPacketUrl: `/workflows/${workflow.id}?view=status`,
      })),
    ];
    return {
      agent,
      pollAfterSeconds: nextActions.length > 0
        ? EXECUTOR_REVIEW_POLL_AFTER_SECONDS
        : WORKFLOW_POLL_AFTER_SECONDS,
      role: {
        kind: agent.role,
        canExecuteNodes: false,
        reminder:
          'Orquestradores coordenam, revisam e decidem; não executam subdemandas nem alteram arquivos.',
      },
      nextActions,
      planning,
      returned,
      questions: openQuestions,
      completable,
    };
  }
  const currentNode = agent.currentNodeId
    ? await getNodeExecutionPackage(kv, agent.currentNodeId)
    : null;
  const agentRuns = (await listAgentRuns(kv, agentSessionId)).filter((run) =>
    !filter.workflowId || run.workflowId === filter.workflowId
  );
  const nodes = await listWorkflowNodes(kv, filter.workflowId);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const awaitingReview = agentRuns
    .filter((run) => run.status === 'returned')
    .slice(0, 5)
    .map((run) => ({
      workflowId: run.workflowId,
      nodeId: run.nodeId,
      nodeTitle: nodeById.get(run.nodeId)?.title ?? run.nodeId,
      runId: run.id,
      attempt: run.attempt,
      returnedAt: run.returnedAt,
      reviewPacketUrl: `/workflows/nodes/${run.nodeId}?view=review`,
    }));
  const rework = agentRuns
    .filter((run) =>
      run.status === 'rework' &&
      nodeById.get(run.nodeId)?.status === 'needs_rework' &&
      nodeById.get(run.nodeId)?.claimedBySessionId === agentSessionId
    )
    .slice(0, 5)
    .map((run) => ({
      workflowId: run.workflowId,
      nodeId: run.nodeId,
      nodeTitle: nodeById.get(run.nodeId)?.title ?? run.nodeId,
      runId: run.id,
      attempt: run.attempt,
      feedback: run.reviewFeedback ?? '',
      nodeUrl: `/workflows/nodes/${run.nodeId}`,
    }));
  const reviewedRuns = agentRuns
    .filter((run) =>
      run.status === 'approved' || run.status === 'rework' ||
      run.status === 'failed' || run.status === 'cancelled'
    )
    .slice(0, 5)
    .map((run) => ({
      workflowId: run.workflowId,
      nodeId: run.nodeId,
      nodeTitle: nodeById.get(run.nodeId)?.title ?? run.nodeId,
      runId: run.id,
      attempt: run.attempt,
      status: run.status,
      decision: run.reviewDecision,
      feedback: run.reviewFeedback ?? '',
      reviewedAt: run.reviewedAt,
    }));
  const questions = currentNode
    ? (await listWorkflowQuestions(kv, currentNode.workflow.id)).filter(
      (question) =>
        question.nodeId === currentNode.node.id &&
        question.askedBySessionId === agentSessionId,
    )
    : [];
  const available = await listAvailableNodes(kv, {
    agentSessionId,
    workflowId: filter.workflowId,
  });
  const incompatibleAvailable = (await listAvailableNodes(kv, {
    workflowId: filter.workflowId,
  }))
    .filter((pkg) => !agentCanExecute(agent, pkg.node))
    .slice(0, 10)
    .map((pkg) => ({
      workflowId: pkg.workflow.id,
      workflowTitle: pkg.workflow.title,
      nodeId: pkg.node.id,
      nodeTitle: pkg.node.title,
      requiredCapabilities: pkg.node.requiredCapabilities,
      missingCapabilities: pkg.node.requiredCapabilities.filter(
        (capability) => !agent.capabilities.includes(capability),
      ),
    }));
  const missingCapabilities = [
    ...new Set(
      incompatibleAvailable.flatMap((item) => item.missingCapabilities),
    ),
  ];
  const recentWorkflow = agentRuns[0]
    ? await getWorkflow(kv, agentRuns[0].workflowId)
    : null;
  const nextAction = currentNode
    ? 'execute_current'
    : rework.length > 0
    ? 'rework'
    : awaitingReview.length > 0
    ? 'await_review'
    : available.length > 0
    ? 'claim_next'
    : incompatibleAvailable.length > 0
    ? 'capability_mismatch'
    : recentWorkflow?.status === 'done' ||
        recentWorkflow?.status === 'cancelled'
    ? 'stop'
    : 'wait';
  return {
    agent,
    pollAfterSeconds: nextAction === 'await_review'
      ? EXECUTOR_REVIEW_POLL_AFTER_SECONDS
      : WORKFLOW_POLL_AFTER_SECONDS,
    nextAction,
    currentNode,
    awaitingReview,
    rework,
    reviewedRuns,
    questions,
    available,
    capabilityMismatch: incompatibleAvailable.length > 0
      ? {
        workflowId: filter.workflowId,
        missingCapabilities,
        incompatibleAvailable,
        recommendation:
          'Reconecte declarando apenas capacidades que sua ferramenta realmente possui.',
      }
      : null,
  };
};

export const allWorkflowKeyPrefixes = {
  workflows: WORKFLOW_PREFIX,
  nodes: NODE_PREFIX,
  edges: EDGE_PREFIX,
  runs: RUN_PREFIX,
  agents: AGENT_PREFIX,
  events: EVENT_PREFIX,
  questions: QUESTION_PREFIX,
};
