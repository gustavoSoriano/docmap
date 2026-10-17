// Corpo do caderno no filesystem — <dataDir>/notebooks/<id>.json.
// Id é UUID do store (sem traversal). Espelho do padrão podcasts/scriptfile.
import { notebooksDir } from '../config.ts';
import type { NotebookBody } from './types.ts';

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;

export const isNotebookId = (v: unknown): v is string =>
  typeof v === 'string' && ID_RE.test(v);

const bodyPath = (id: string): string => `${notebooksDir()}/${id}.json`;

export const writeNotebookBody = async (
  id: string,
  body: NotebookBody,
): Promise<void> => {
  await Deno.mkdir(notebooksDir(), { recursive: true });
  await Deno.writeTextFile(bodyPath(id), JSON.stringify(body));
};

export const readNotebookBody = async (
  id: string,
): Promise<NotebookBody | null> => {
  try {
    const raw = await Deno.readTextFile(bodyPath(id));
    const v = JSON.parse(raw) as Partial<NotebookBody>;
    if (!v || typeof v !== 'object' || !('reel' in v)) return null;
    return v as NotebookBody;
  } catch {
    return null;
  }
};

export const deleteNotebookBody = async (id: string): Promise<void> => {
  try {
    await Deno.remove(bodyPath(id));
  } catch {
    // já ausente — ok
  }
};
