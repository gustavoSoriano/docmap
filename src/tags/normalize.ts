// ════ Normalização de tags — função pura, compartilhada por todos os stores ════
// Tags representam o TEMA/assunto de uma entidade (o eixo semântico do grafo).
// Sem normalizar, "Arquitetura", "arquitetura " e "ARQUITETURA" divergem e o
// grafo nunca liga dois nós pelo mesmo tema. Aqui garantimos que qualquer
// variação (caixa, acento, espaço, pontuação) convirja para uma forma-slug única.
//
// Regras: minúsculo · sem acentos · [^a-z0-9] vira hífen · sem hífen nas pontas
// · sem vazios · sem duplicatas (preserva ordem de 1ª aparição).

const slugTag = (raw: string): string =>
  raw
    .normalize('NFD') // separa letra-base do diacrítico (ã → a + ˜)
    .replace(/[̀-ͯ]/g, '') // remove os diacríticos combinantes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // não-alfanumérico → hífen (colapsa repetidos)
    .replace(/^-+|-+$/g, ''); // limpa hífens das pontas

export const normalizeTags = (
  input: readonly string[] | undefined,
): string[] => {
  if (!input) return [];
  const seen = new Set<string>();
  for (const raw of input) {
    const tag = slugTag(raw);
    if (tag) seen.add(tag);
  }
  return [...seen];
};
