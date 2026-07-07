export type NodeGroup = 'entry' | 'arch' | 'design' | 'security' | 'process' | 'default';

export type GraphNode = {
  readonly id: string;
  readonly label: string;
  readonly group: NodeGroup;
};

export type GraphEdge = {
  readonly source: string;
  readonly target: string;
};

export type GraphData = {
  readonly nodes: readonly GraphNode[];
  readonly links: readonly GraphEdge[];
};
