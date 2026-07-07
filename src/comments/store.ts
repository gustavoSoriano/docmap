import type { Comment, UpsertCommentInput } from './types.ts';

const key = (workspace: string, fileId: string) => ['comments', workspace, fileId] as const;

export const getComments = async (kv: Deno.Kv, workspace: string, fileId: string): Promise<Comment[]> => {
  const entry = await kv.get<Comment[]>(key(workspace, fileId));
  return entry.value ?? [];
};

export const upsertComment = async (
  kv: Deno.Kv,
  workspace: string,
  fileId: string,
  input: UpsertCommentInput,
): Promise<Comment[]> => {
  const existing = await getComments(kv, workspace, fileId);
  const idx = existing.findIndex((c) => c.quote === input.quote);

  if (!input.note) {
    const updated = existing.filter((c) => c.quote !== input.quote);
    if (updated.length) await kv.set(key(workspace, fileId), updated);
    else await kv.delete(key(workspace, fileId));
    return updated;
  }

  const comment: Comment = { quote: input.quote, note: input.note, type: input.type, updatedAt: new Date().toISOString() };
  const updated = idx >= 0
    ? existing.map((c, i) => (i === idx ? comment : c))
    : [...existing, comment];

  await kv.set(key(workspace, fileId), updated);
  return updated;
};

export const deleteAllComments = async (kv: Deno.Kv, workspace: string, fileId: string): Promise<void> => {
  await kv.delete(key(workspace, fileId));
};
