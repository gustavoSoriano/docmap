import type { Note } from './types.ts';
import { listNotes } from './store.ts';

export type NoteSearchResult = {
  readonly note: Omit<Note, 'content'> & { preview: string };
  readonly score: number;
  readonly snippet: string;
};

const scoreNote = (note: Note, q: string): number => {
  const ql = q.toLowerCase();
  let score = 0;
  if (note.title.toLowerCase().includes(ql)) score += 3;
  if (note.content.toLowerCase().includes(ql)) score += 1;
  if (note.tags.some((t) => t.toLowerCase().includes(ql))) score += 2;
  if ((note.category || '').toLowerCase().includes(ql)) score += 1;
  return score;
};

const extractSnippet = (content: string, query: string): string => {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return content.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 80);
  return (start > 0 ? '…' : '') + content.slice(start, end) +
    (end < content.length ? '…' : '');
};

export const searchNotes = async (
  kv: Deno.Kv,
  query: string,
): Promise<NoteSearchResult[]> => {
  const results: NoteSearchResult[] = [];
  for await (const entry of kv.list<Note>({ prefix: ['notes', '_global_'] })) {
    const note = entry.value;
    if (!note) continue;
    const score = scoreNote(note, query);
    if (score === 0) continue;
    results.push({
      note: {
        id: note.id,
        title: note.title,
        tags: note.tags,
        category: note.category,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        preview: note.content.slice(0, 120),
      },
      score,
      snippet: extractSnippet(note.content, query),
    });
  }
  return results.sort((a, b) => b.score - a.score);
};

export { listNotes };
