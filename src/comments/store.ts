import type { Comment, UpsertCommentInput } from './types.ts';

const GLOBAL_SCOPE = '_global_';
const key = (fileId: string) => ['comments', GLOBAL_SCOPE, fileId] as const;

export const getComments = async (
  kv: Deno.Kv,
  fileId: string,
): Promise<Comment[]> => {
  const entry = await kv.get<Comment[]>(key(fileId));
  return entry.value ?? [];
};

export const upsertComment = async (
  kv: Deno.Kv,
  fileId: string,
  input: UpsertCommentInput,
): Promise<Comment[]> => {
  const existing = await getComments(kv, fileId);
  const idx = existing.findIndex((c) => c.quote === input.quote);

  if (!input.note) {
    const updated = existing.filter((c) => c.quote !== input.quote);
    if (updated.length) await kv.set(key(fileId), updated);
    else await kv.delete(key(fileId));
    return updated;
  }

  const comment: Comment = {
    quote: input.quote,
    note: input.note,
    type: input.type,
    updatedAt: new Date().toISOString(),
  };
  const updated = idx >= 0
    ? existing.map((c, i) => (i === idx ? comment : c))
    : [...existing, comment];

  await kv.set(key(fileId), updated);
  return updated;
};

export const deleteAllComments = async (
  kv: Deno.Kv,
  fileId: string,
): Promise<void> => {
  await kv.delete(key(fileId));
};
