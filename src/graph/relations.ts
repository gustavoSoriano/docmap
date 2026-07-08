import type { GraphData } from './types.ts';

export type GraphRelations = {
  readonly file: string;
  readonly outgoing: readonly string[];
  readonly incoming: readonly string[];
};

export const buildRelations = (graph: GraphData, file: string): GraphRelations => {
  const outgoing: string[] = [];
  const incoming: string[] = [];

  for (const link of graph.links) {
    if (link.source === file) outgoing.push(link.target);
    if (link.target === file) incoming.push(link.source);
  }

  return { file, outgoing, incoming };
};
