// Slug estável da categoria — função pura.
// Reaproveita as mesmas regras das tags (minúsculo, sem acento).
export const toCategoryId = (raw: string): string => {
  const slug = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'general';
};
