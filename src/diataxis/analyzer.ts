import { walkMd } from '../fs/walker.ts';
import { listNotes } from '../notes/store.ts';
import { listSkills } from '../skills/store.ts';
import { listMacros } from '../macros/store.ts';
import { listDiagrams } from '../diagrams/store.ts';
import { listTasks } from '../tasks/store.ts';
import { listCollections, listMocks } from '../mocks/store.ts';
import { listFavorites } from '../favorites/store.ts';
import type { DiataxisEntityKind } from './types.ts';

export type AnalyzedFile = {
  readonly kind: 'file';
  readonly id: string;
  readonly title: string;
  readonly preview: string;
};

export type AnalyzedEntity = {
  readonly kind: Exclude<DiataxisEntityKind, 'file'>;
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly tags?: readonly string[];
};

export type WorkspaceContext = {
  readonly workspace: string;
  readonly files: readonly AnalyzedFile[];
  readonly notes: readonly AnalyzedEntity[];
  readonly skills: readonly AnalyzedEntity[];
  readonly macros: readonly AnalyzedEntity[];
  readonly diagrams: readonly AnalyzedEntity[];
  readonly tasks: readonly AnalyzedEntity[];
  readonly mocks: readonly AnalyzedEntity[];
  readonly favorites: readonly AnalyzedEntity[];
};

export const readFileHead = (path: string, lines = 20): string => {
  try {
    const content = Deno.readTextFileSync(path);
    return content.split('\n').slice(0, lines).join('\n');
  } catch {
    return '';
  }
};

const extractTitle = (content: string, fallback: string): string => {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
};

const analyzeFiles = (root: string): AnalyzedFile[] => {
  return walkMd(root).map((path) => {
    const id = path.slice(root.length + 1);
    const content = readFileHead(path);
    const title = extractTitle(content, id.split('/').pop()!.replace('.md', ''));
    return {
      kind: 'file',
      id,
      title,
      preview: content.slice(0, 300),
    };
  });
};

const toAnalyzed = (
  kind: Exclude<DiataxisEntityKind, 'file'>,
  item: { id: string; title: string; description?: string; tags?: readonly string[] },
): AnalyzedEntity => ({
  kind,
  id: item.id,
  title: item.title,
  description: item.description,
  tags: item.tags,
});

export const analyzeWorkspace = async (
  kv: Deno.Kv,
  root: string,
): Promise<WorkspaceContext> => {
  const files = analyzeFiles(root);
  const notes = (await listNotes(kv)).map((n) =>
    toAnalyzed('note', { id: n.id, title: n.title, tags: n.tags })
  );
  const skills = (await listSkills(kv)).map((s) =>
    toAnalyzed('skill', { id: s.id, title: s.title, description: s.description, tags: s.tags })
  );
  const macros = (await listMacros(kv)).map((m) =>
    toAnalyzed('macro', { id: m.id, title: m.title, description: m.description })
  );
  const diagrams = (await listDiagrams(kv)).map((d) =>
    toAnalyzed('diagram', { id: d.id, title: d.title })
  );
  const tasks = (await listTasks(kv)).map((t) =>
    toAnalyzed('task', { id: t.id, title: t.title, description: t.description })
  );

  const collections = await listCollections(kv);
  const mocks: AnalyzedEntity[] = [];
  for (const collection of collections) {
    const collectionMocks = await listMocks(kv, collection.id);
    for (const mock of collectionMocks) {
      mocks.push(toAnalyzed('mock', {
        id: mock.id,
        title: `${mock.method} ${mock.path}`,
        description: mock.name,
      }));
    }
  }

  const favorites = (await listFavorites(kv)).map((f) =>
    toAnalyzed('favorite', { id: f.id, title: f.title, description: f.note, tags: f.tags })
  );

  return {
    workspace: root,
    files,
    notes,
    skills,
    macros,
    diagrams,
    tasks,
    mocks,
    favorites,
  };
};
