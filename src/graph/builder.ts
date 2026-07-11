import { walkMd } from '../fs/walker.ts';
import { extractLinks } from '../fs/links.ts';
import type { GraphData, GraphEdge, GraphNode, NodeGroup } from './types.ts';

const classifyNode = (id: string, label: string): NodeGroup => {
  if (['INDEX', 'README'].includes(label)) return 'entry';
  if (id.includes('ARCHITECTURE') || id.includes('TIPS')) return 'arch';
  if (id.includes('ANDES') || id.includes('VISUAL')) return 'design';
  if (id.includes('SECURITY')) return 'security';
  if (['CONTRIBUTING', 'CHANGELOG'].includes(label)) return 'process';
  return 'default';
};

export const buildGraph = (root: string): GraphData => {
  const allFiles = walkMd(root);

  const nodes: GraphNode[] = allFiles.map((f) => {
    const id = f.slice(root.length + 1);
    const label = id.split('/').pop()!.replace('.md', '');
    return {
      id,
      label,
      group: classifyNode(id.toUpperCase(), label.toUpperCase()),
    };
  });

  const nodeIds = new Set(nodes.map((n) => n.id));
  const links: GraphEdge[] = [];
  for (const f of allFiles) {
    const source = f.slice(root.length + 1);
    let content = '';
    try {
      content = Deno.readTextFileSync(f);
    } catch {
      continue;
    }
    for (const target of extractLinks(f, content, allFiles, root)) {
      if (source !== target && nodeIds.has(target)) {
        links.push({ source, target });
      }
    }
  }

  return { nodes, links };
};
