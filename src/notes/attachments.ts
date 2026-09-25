// Anexos de imagem das notas — binário no filesystem, referência no KV.
// Local: <dataDir>/notes/<noteId>/<uuid>.<ext> — sobrevive a updates.

import { noteAttachmentsDir } from '../config.ts';

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

const validNoteId = (id: string): boolean => /^[A-Za-z0-9_-]{1,64}$/.test(id);

export const validFileName = (name: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}\.(png|jpe?g|gif|webp)$/i.test(name) &&
  !name.includes('..');

const magicOk = (bytes: Uint8Array, mime: string): boolean => {
  if (mime === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
      bytes[3] === 0x47;
  }
  if (mime === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === 'image/gif') {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  }
  if (mime === 'image/webp') {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
      bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 &&
      bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
};

// Detecta o tipo real pelos magic bytes (não confia na extensão).
export const detectImageMime = (bytes: Uint8Array): string | null => {
  for (const mime of Object.keys(EXT_BY_MIME)) {
    if (magicOk(bytes, mime)) return mime;
  }
  return null;
};

// Lê uma imagem do disco local (ex.: print salvo que veio na área de
// transferência como referência de arquivo). Valida tamanho e conteúdo.
export const loadImageFromPath = async (
  rawPath: string,
): Promise<{ bytes: Uint8Array; mime: string } | null> => {
  let path = rawPath.trim().replace(/^file:\/\/localhost/, '').replace(
    /^file:\/\//,
    '',
  );
  try {
    path = decodeURIComponent(path);
  } catch { /* mantém original */ }
  if (!path) return null;
  if (/^[A-Za-z]:[\\/]/.test(path)) {
    // Windows: mantém como está
  } else if (!path.startsWith('/')) {
    return null;
  }
  try {
    const stat = await Deno.stat(path);
    if (!stat.isFile || (stat.size ?? 0) === 0 || stat.size > MAX_BYTES) {
      return null;
    }
    const bytes = await Deno.readFile(path);
    const mime = detectImageMime(bytes);
    if (!mime) return null;
    return { bytes, mime };
  } catch {
    return null;
  }
};

export const attachmentUrl = (noteId: string, filename: string): string =>
  `/notes/${noteId}/attachments/${filename}`;

export const saveAttachment = async (
  noteId: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ filename: string; url: string } | null> => {
  if (!validNoteId(noteId)) return null;
  const mime = contentType.split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_MIME[mime];
  if (!ext) return null;
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
  if (!magicOk(bytes, mime)) return null;
  const filename = `${crypto.randomUUID()}.${ext}`;
  await Deno.mkdir(noteAttachmentsDir(noteId), { recursive: true });
  await Deno.writeFile(`${noteAttachmentsDir(noteId)}/${filename}`, bytes);
  return { filename, url: attachmentUrl(noteId, filename) };
};

export const readAttachment = async (
  noteId: string,
  filename: string,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; contentType: string } | null> => {
  if (!validNoteId(noteId) || !validFileName(filename)) return null;
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) return null;
  try {
    const bytes = await Deno.readFile(
      `${noteAttachmentsDir(noteId)}/${filename}`,
    );
    return { bytes, contentType };
  } catch {
    return null;
  }
};

export const deleteNoteAttachments = async (noteId: string): Promise<void> => {
  if (!validNoteId(noteId)) return;
  await Deno.remove(noteAttachmentsDir(noteId), { recursive: true }).catch(
    () => {},
  );
};
