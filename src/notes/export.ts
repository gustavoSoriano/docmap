import type { Note } from './types.ts';

const formatNote = (note: Note): string => {
  const tags = note.tags.length ? `\n> Tags: ${note.tags.join(', ')}` : '';
  const date = note.updatedAt.slice(0, 10);
  return [
    `## ${note.title}`,
    ``,
    `> Categoria: ${note.category} · Atualizado: ${date}${tags}`,
    ``,
    note.content,
    ``,
    `---`,
    ``,
  ].join('\n');
};

export const exportNotesToMarkdown = (notes: Note[], workspaceName: string): string => {
  const date = new Date().toLocaleDateString('pt-BR');
  const header = [
    `# Notas — ${workspaceName}`,
    ``,
    `> Exportado em ${date} via docmap desktop`,
    ``,
    `---`,
    ``,
  ].join('\n');
  return header + notes.map(formatNote).join('\n');
};
