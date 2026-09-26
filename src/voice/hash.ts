// Hash estável p/ cache de áudio — FNV-1a 32bit, hex de 8 chars.
// Função pura: mesmo texto → mesmo nome de arquivo. Evita path traversal
// porque a saída é só [0-9a-f].
export const hashText = (text: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};
