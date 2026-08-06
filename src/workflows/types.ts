export type WorkflowStatus =
  | 'draft'
  | 'planning'
  | 'running'
  | 'reviewing'
  | 'blocked'
  | 'done'
  | 'cancelled';

export type WorkflowNodeStatus =
  | 'pending'
  | 'ready'
  | 'claimed'
  | 'in_progress'
  | 'waiting_input'
  | 'returned'
  | 'needs_rework'
  | 'done'
  | 'human_intervention'
  | 'cancelled';

export type WorkflowComplexity = 'xs' | 's' | 'm' | 'l' | 'xl';
export type WorkflowConflictPolicy = 'warn' | 'block';
export type WorkflowIsolation = 'shared' | 'branch' | 'worktree';
export type WorkflowEdgeKind = 'blocks' | 'informs' | 'reviews' | 'rework_of';
export type WorkflowCompletionPolicy = {
  readonly requireQualityGate: boolean;
  readonly requireFinalAudit: boolean;
};
export type AgentRole = 'orchestrator' | 'executor' | 'reviewer';
export type AgentPresence = 'online' | 'idle' | 'busy' | 'stale' | 'offline';
export type RunStatus =
  | 'claimed'
  | 'in_progress'
  | 'waiting_input'
  | 'returned'
  | 'approved'
  | 'rework'
  | 'failed'
  | 'abandoned'
  | 'cancelled';
export type RunOutcome =
  | 'success'
  | 'partial'
  | 'failed'
  | 'blocked'
  | 'needs_input';

export type ContextRef = {
  readonly kind: 'note' | 'file' | 'skill' | 'url' | 'text' | 'other';
  readonly ref: string;
  readonly label?: string;
  readonly excerpt?: string;
};

export type AgentRecommendation = {
  readonly tool?: string;
  readonly provider?: string;
  readonly model?: string;
};

export type Workflow = {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly status: WorkflowStatus;
  readonly conflictPolicy: WorkflowConflictPolicy;
  readonly defaultMaxAttempts: number;
  readonly completionPolicy: WorkflowCompletionPolicy;
  readonly orchestrationSessionId?: string;
  readonly completionSummary?: string;
  readonly stopReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
};

export type WorkflowNode = {
  readonly id: string;
  readonly workflowId: string;
  readonly title: string;
  readonly description: string;
  readonly acceptanceCriteria: readonly string[];
  readonly contextRefs: readonly ContextRef[];
  readonly status: WorkflowNodeStatus;
  readonly complexity: WorkflowComplexity;
  readonly kind: string;
  readonly requiredCapabilities: readonly string[];
  readonly recommendedAgent?: AgentRecommendation;
  readonly readScopes: readonly string[];
  readonly writeScopes: readonly string[];
  readonly isolation: WorkflowIsolation;
  readonly attemptCount: number;
  readonly maxAttempts: number;
  readonly currentRunId?: string;
  readonly claimedBySessionId?: string;
  readonly position?: { readonly x: number; readonly y: number };
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type WorkflowCompletionReadiness = {
  readonly canComplete: boolean;
  readonly missing: readonly string[];
  readonly qualityGateNodeId?: string;
  readonly finalAuditNodeId?: string;
};

export type WorkflowEdge = {
  readonly id: string;
  readonly workflowId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly kind: WorkflowEdgeKind;
  readonly createdAt: string;
};

export type AgentSession = {
  readonly id: string;
  readonly name: string;
  readonly tool: string;
  readonly provider: string;
  readonly model: string;
  readonly role: AgentRole;
  readonly capabilities: readonly string[];
  readonly operator?: string;
  readonly presence: AgentPresence;
  readonly currentWorkflowId?: string;
  readonly currentNodeId?: string;
  readonly connectedAt: string;
  readonly lastHeartbeatAt: string;
  readonly disconnectedAt?: string;
};

export type RunTest = {
  readonly command: string;
  readonly status: 'passed' | 'failed' | 'skipped';
  readonly output?: string;
};

export type RunArtifact = {
  readonly kind: string;
  readonly label: string;
  readonly ref?: string;
};

export type RunOutput = {
  readonly outcome: RunOutcome;
  readonly summary: string;
  readonly result?: string;
  readonly logs: readonly string[];
  readonly changedFiles: readonly string[];
  readonly diff?: string;
  readonly tests: readonly RunTest[];
  readonly artifacts: readonly RunArtifact[];
};

export type RunWorkspace = {
  readonly kind: WorkflowIsolation;
  readonly path?: string;
  readonly branch?: string;
  readonly baseCommit?: string;
};

export type AcceptanceCheckStatus = 'pass' | 'fail' | 'insufficient';

export type AcceptanceCheck = {
  readonly criterion: string;
  readonly status: AcceptanceCheckStatus;
  readonly evidence: string;
};

export type WorkflowRun = {
  readonly id: string;
  readonly workflowId: string;
  readonly nodeId: string;
  readonly agentSessionId: string;
  readonly attempt: number;
  readonly status: RunStatus;
  readonly workspace?: RunWorkspace;
  readonly output?: RunOutput;
  readonly reviewDecision?:
    | 'approve'
    | 'rework'
    | 'expand'
    | 'human_intervention'
    | 'cancel';
  readonly reviewFeedback?: string;
  readonly acceptanceChecks?: readonly AcceptanceCheck[];
  readonly reviewedBySessionId?: string;
  readonly createdAt: string;
  readonly startedAt?: string;
  readonly returnedAt?: string;
  readonly reviewedAt?: string;
  readonly updatedAt: string;
};

export type WorkflowEvent = {
  readonly id: string;
  readonly workflowId: string;
  readonly nodeId?: string;
  readonly runId?: string;
  readonly agentSessionId?: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
};

export type WorkflowQuestion = {
  readonly id: string;
  readonly workflowId: string;
  readonly nodeId: string;
  readonly runId: string;
  readonly askedBySessionId: string;
  readonly question: string;
  readonly status: 'open' | 'answered' | 'dismissed';
  readonly answer?: string;
  readonly answeredBySessionId?: string;
  readonly createdAt: string;
  readonly answeredAt?: string;
};

export type CreateWorkflowInput = {
  readonly title: string;
  readonly objective: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly conflictPolicy?: WorkflowConflictPolicy;
  readonly defaultMaxAttempts?: number;
  readonly completionPolicy?: Partial<WorkflowCompletionPolicy>;
};

export type UpdateWorkflowInput =
  & Partial<
    Pick<
      Workflow,
      | 'title'
      | 'objective'
      | 'description'
      | 'tags'
      | 'conflictPolicy'
      | 'defaultMaxAttempts'
    >
  >
  & {
    readonly completionPolicy?: Partial<WorkflowCompletionPolicy>;
  };

export type CreateWorkflowNodeInput = {
  readonly title: string;
  readonly description: string;
  readonly acceptanceCriteria: readonly string[];
  readonly contextRefs?: readonly ContextRef[];
  readonly complexity?: WorkflowComplexity;
  readonly kind?: string;
  readonly requiredCapabilities?: readonly string[];
  readonly recommendedAgent?: AgentRecommendation;
  readonly readScopes?: readonly string[];
  readonly writeScopes?: readonly string[];
  readonly isolation?: WorkflowIsolation;
  readonly maxAttempts?: number;
  readonly dependsOn?: readonly string[];
  readonly position?: { readonly x: number; readonly y: number };
};

export type UpdateWorkflowNodeInput =
  & Partial<
    Pick<
      WorkflowNode,
      | 'title'
      | 'description'
      | 'acceptanceCriteria'
      | 'contextRefs'
      | 'complexity'
      | 'kind'
      | 'requiredCapabilities'
      | 'recommendedAgent'
      | 'readScopes'
      | 'writeScopes'
      | 'isolation'
      | 'maxAttempts'
      | 'position'
    >
  >
  & {
    readonly dependsOn?: readonly string[];
  };

export type ConnectAgentInput = {
  readonly name: string;
  readonly tool: string;
  readonly provider: string;
  readonly model: string;
  readonly role: AgentRole;
  readonly capabilities?: readonly string[];
  readonly operator?: string;
};

export type ReturnRunInput = RunOutput & {
  readonly agentSessionId: string;
};

export type HumanReturnInput = {
  readonly outcome?: RunOutcome;
  readonly summary: string;
  readonly result?: string;
  readonly logs?: readonly string[];
  readonly changedFiles?: readonly string[];
  readonly diff?: string;
  readonly tests?: readonly RunTest[];
  readonly artifacts?: readonly RunArtifact[];
};

export type ReviewInput = {
  readonly agentSessionId?: string;
  readonly decision:
    | 'approve'
    | 'rework'
    | 'expand'
    | 'human_intervention'
    | 'cancel';
  readonly feedback?: string;
  readonly acceptanceChecks?: readonly AcceptanceCheck[];
  readonly newNodes?: readonly CreateWorkflowNodeInput[];
};

export type DependencyResult = {
  readonly nodeId: string;
  readonly title: string;
  readonly summary?: string;
  readonly result?: string;
  readonly changedFiles: readonly string[];
  readonly artifacts: readonly RunArtifact[];
  readonly workspace?: RunWorkspace;
};

export type NodeExecutionPackage = {
  readonly workflow: Workflow;
  readonly node: WorkflowNode;
  readonly dependencies: readonly DependencyResult[];
  readonly conflicts: readonly {
    nodeId: string;
    title: string;
    writeScopes: readonly string[];
  }[];
};
