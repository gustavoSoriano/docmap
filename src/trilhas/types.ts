export type TrilhaStatus = 'draft' | 'running' | 'done' | 'cancelled';

export type TrilhaNodeStatus = 'todo' | 'doing' | 'done' | 'blocked';

export type TrilhaCriterion = {
  readonly id: string;
  readonly text: string;
  readonly done: boolean;
};

// Entrada aceita objeto completo ou string curta (vira { text, done: false }).
export type TrilhaCriterionInput = string | {
  readonly id?: string;
  readonly text: string;
  readonly done?: boolean;
};

export type AssigneeKind = 'human' | 'ai';

export type Assignee = {
  readonly kind: AssigneeKind;
  readonly label: string;
};

export type Trilha = {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly status: TrilhaStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
};

export type TrilhaNode = {
  readonly id: string;
  readonly trilhaId: string;
  readonly title: string;
  readonly details: string;
  readonly result: string;
  readonly doneCriteria: readonly TrilhaCriterion[];
  readonly blockedReason?: string;
  readonly status: TrilhaNodeStatus;
  readonly assignee: Assignee;
  readonly claimedBy?: string;
  readonly claimedAt?: string;
  readonly lastHeartbeatAt?: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type TrilhaEdge = {
  readonly id: string;
  readonly trilhaId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly createdAt: string;
};

export type TrilhaDetail = {
  readonly trilha: Trilha;
  readonly nodes: readonly TrilhaNode[];
  readonly edges: readonly TrilhaEdge[];
};

export type CreateTrilhaInput = {
  readonly title: string;
  readonly objective: string;
  readonly description?: string;
  readonly tags?: readonly string[];
};

export type UpdateTrilhaInput = {
  readonly title?: string;
  readonly objective?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly status?: TrilhaStatus;
};

export type CreateNodeInput = {
  readonly title: string;
  readonly details?: string;
  readonly result?: string;
  readonly doneCriteria?: readonly TrilhaCriterionInput[];
  readonly blockedReason?: string;
  readonly status?: TrilhaNodeStatus;
  readonly assignee?: Assignee;
  readonly position?: { readonly x: number; readonly y: number };
  readonly dependsOn?: readonly string[];
};

export type UpdateNodeInput = {
  readonly title?: string;
  readonly details?: string;
  readonly result?: string;
  readonly doneCriteria?: readonly TrilhaCriterionInput[];
  readonly blockedReason?: string;
  readonly status?: TrilhaNodeStatus;
  readonly assignee?: Assignee;
  readonly position?: { readonly x: number; readonly y: number };
  readonly by?: string;
  readonly expectedUpdatedAt?: string;
};

export type ClaimInput = {
  readonly by: string;
  readonly force?: boolean;
};

export type HeartbeatInput = {
  readonly by: string;
};

export type CreateEdgeInput = {
  readonly fromNodeId: string;
  readonly toNodeId: string;
};
