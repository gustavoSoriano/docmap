import { createNote, getNoteById } from '../notes/store.ts';
import { createSkill, getSkillById } from '../skills/store.ts';
import { createMacro, getMacroById } from '../macros/store.ts';
import { createDiagram, getDiagramById } from '../diagrams/store.ts';
import { createTask, getTaskById } from '../tasks/store.ts';
import { getMock } from '../mocks/store.ts';
import { getFavoriteById } from '../favorites/store.ts';
import { createDocSet, updateDocSet } from './store.ts';
import { isPathSafe } from '../fs/walker.ts';
import type {
  DiataxisEntityKind,
  DocSet,
  DocSetItem,
  SuggestedDocSet,
  SuggestedItem,
} from './types.ts';
import type { CreateNoteInput } from '../notes/types.ts';
import type { CreateSkillInput } from '../skills/types.ts';
import type { CreateMacroInput } from '../macros/types.ts';
import type { CreateDiagramInput } from '../diagrams/types.ts';
import type { CreateTaskInput } from '../tasks/types.ts';

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const hasString = (o: Record<string, unknown>, k: string): boolean =>
  typeof o[k] === 'string';

const toNoteInput = (
  content: unknown,
  docSetId: string,
): CreateNoteInput | null => {
  if (!isObject(content)) return null;
  if (!hasString(content, 'title') || !hasString(content, 'content')) return null;
  return {
    title: content.title as string,
    content: content.content as string,
    category: typeof content.category === 'string' ? content.category : 'diataxis',
    tags: Array.isArray(content.tags)
      ? content.tags.filter((t): t is string => typeof t === 'string')
      : undefined,
    docSetId,
  };
};

const toSkillInput = (
  content: unknown,
  docSetId: string,
): CreateSkillInput | null => {
  if (!isObject(content)) return null;
  if (!hasString(content, 'title') || !hasString(content, 'content')) return null;
  return {
    name: hasString(content, 'name')
      ? (content.name as string)
      : (content.title as string),
    title: content.title as string,
    description: hasString(content, 'description')
      ? (content.description as string)
      : '',
    content: content.content as string,
    tags: Array.isArray(content.tags)
      ? content.tags.filter((t): t is string => typeof t === 'string')
      : undefined,
    docSetId,
  };
};

const toMacroInput = (
  content: unknown,
  docSetId: string,
): CreateMacroInput | null => {
  if (!isObject(content)) return null;
  if (!hasString(content, 'title') || !hasString(content, 'script')) return null;
  return {
    name: hasString(content, 'name')
      ? (content.name as string)
      : (content.title as string),
    title: content.title as string,
    description: hasString(content, 'description')
      ? (content.description as string)
      : undefined,
    script: content.script as string,
    docSetId,
  };
};

const toDiagramInput = (
  content: unknown,
  docSetId: string,
): CreateDiagramInput | null => {
  if (!isObject(content)) return null;
  if (!hasString(content, 'title') || !hasString(content, 'source')) return null;
  return {
    title: content.title as string,
    source: content.source as string,
    docSetId,
  };
};

const toTaskInput = (
  content: unknown,
  docSetId: string,
): CreateTaskInput | null => {
  if (!isObject(content)) return null;
  if (!hasString(content, 'title')) return null;
  return {
    title: content.title as string,
    description: hasString(content, 'description')
      ? (content.description as string)
      : undefined,
    status:
      typeof content.status === 'string' &&
        ['todo', 'in-progress', 'done'].includes(content.status)
        ? content.status as 'todo' | 'in-progress' | 'done'
        : undefined,
    docSetId,
  };
};

const createEntity = async (
  kv: Deno.Kv,
  kind: DiataxisEntityKind,
  content: unknown,
  docSetId: string,
): Promise<string | null> => {
  try {
    switch (kind) {
      case 'note': {
        const input = toNoteInput(content, docSetId);
        if (!input) return null;
        return (await createNote(kv, input)).id;
      }
      case 'skill': {
        const input = toSkillInput(content, docSetId);
        if (!input) return null;
        return (await createSkill(kv, input)).id;
      }
      case 'macro': {
        const input = toMacroInput(content, docSetId);
        if (!input) return null;
        return (await createMacro(kv, input)).id;
      }
      case 'diagram': {
        const input = toDiagramInput(content, docSetId);
        if (!input) return null;
        return (await createDiagram(kv, input)).id;
      }
      case 'task': {
        const input = toTaskInput(content, docSetId);
        if (!input) return null;
        return (await createTask(kv, input)).id;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
};

const toDocSetItem = (suggested: SuggestedItem): DocSetItem | null => {
  if (suggested.action === 'reference' && suggested.ref) {
    return {
      type: suggested.type,
      ref: suggested.ref,
      origin: 'existing',
      reason: suggested.reason,
      userQuestion: suggested.userQuestion,
    };
  }
  return null;
};

export const createGeneratedItems = async (
  kv: Deno.Kv,
  docSetId: string,
  suggestions: readonly SuggestedItem[],
): Promise<DocSetItem[]> => {
  const generatedItems: DocSetItem[] = [];
  for (const suggested of suggestions) {
    if (
      suggested.action !== 'create' ||
      !suggested.entityKind ||
      !suggested.proposedContent
    ) {
      continue;
    }

    const id = await createEntity(
      kv,
      suggested.entityKind,
      suggested.proposedContent,
      docSetId,
    );
    if (!id) continue;

    generatedItems.push({
      type: suggested.type,
      ref: { kind: suggested.entityKind, id },
      origin: 'generated',
      reason: suggested.reason,
      userQuestion: suggested.userQuestion,
      generatedAt: new Date().toISOString(),
    });
  }
  return generatedItems;
};

export const createDocSetFromSuggestion = async (
  kv: Deno.Kv,
  workspace: string,
  suggestion: SuggestedDocSet,
): Promise<DocSet | null> => {
  // Cria DocSet vazio para obter um ID real.
  const docSet = await createDocSet(kv, {
    workspace,
    title: suggestion.title,
    purpose: suggestion.purpose,
    audience: suggestion.audience,
    depth: suggestion.depth,
    items: suggestion.items
      .map(toDocSetItem)
      .filter((item): item is DocSetItem => item !== null),
  });

  const generatedItems = await createGeneratedItems(kv, docSet.id, suggestion.items);

  if (generatedItems.length === 0 && docSet.items.length === 0) {
    return null;
  }

  return await updateDocSet(kv, workspace, docSet.id, {
    items: [...docSet.items, ...generatedItems],
  }) ?? docSet;
};

export const entityExists = async (
  kv: Deno.Kv,
  workspace: string,
  kind: DiataxisEntityKind,
  id: string,
): Promise<boolean> => {
  try {
    switch (kind) {
      case 'file': {
        const resolved = `${workspace}/${id}`;
        if (!isPathSafe(workspace, resolved)) return false;
        const info = await Deno.stat(resolved);
        return info.isFile;
      }
      case 'note':
        return (await getNoteById(kv, id)) !== null;
      case 'skill':
        return (await getSkillById(kv, id)) !== null;
      case 'macro':
        return (await getMacroById(kv, id)) !== null;
      case 'diagram':
        return (await getDiagramById(kv, id)) !== null;
      case 'task':
        return (await getTaskById(kv, id)) !== null;
      case 'mock':
        return (await getMock(kv, id)) !== null;
      case 'favorite':
        return (await getFavoriteById(kv, id)) !== null;
      default:
        return false;
    }
  } catch {
    return false;
  }
};
