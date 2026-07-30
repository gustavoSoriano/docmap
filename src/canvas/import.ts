import { canvasHub } from './hub.ts';
import { json } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import type { CanvasImportFileResponse } from './types.ts';

const MAX_IMPORT_SIZE = (() => {
  const env = Deno.env.get('DOCMAP_CANVAS_MAX_IMPORT_SIZE');
  if (env) {
    const n = parseInt(env, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return 10 * 1024 * 1024;
})();

const ALLOWED_EXTENSIONS = new Set(['.html', '.htm']);

export const createImportFileHandler = (_deps: HandlerDeps) =>
  async (req: Request): Promise<Response> => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'invalid_body' }, 400);
    }

    const { filePath } = body as Record<string, unknown>;

    if (typeof filePath !== 'string' || !filePath.trim()) {
      return json({ error: 'filePath_required' }, 400);
    }

    const dotIdx = filePath.lastIndexOf('.');
    if (dotIdx === -1) {
      return json({ error: 'no_extension', message: 'File has no extension' }, 400);
    }
    const ext = filePath.slice(dotIdx).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return json({
        error: 'invalid_extension',
        message: 'Only .html and .htm files are allowed',
      }, 400);
    }

    let resolved: string;
    try {
      resolved = await Deno.realPath(filePath);
    } catch (err) {
      if (err instanceof Deno.errors.PermissionDenied) {
        return json({ error: 'permission_denied', message: 'Cannot access this path' }, 403);
      }
      return json({ error: 'file_not_found', message: 'File does not exist or cannot be read' }, 404);
    }

    let stat: Deno.FileInfo;
    try {
      stat = await Deno.stat(resolved);
    } catch (err) {
      if (err instanceof Deno.errors.PermissionDenied) {
        return json({ error: 'permission_denied', message: 'Cannot access this path' }, 403);
      }
      return json({ error: 'file_not_found', message: 'Cannot read file' }, 404);
    }

    if (!stat.isFile) {
      return json({ error: 'not_a_file', message: 'Path is not a regular file' }, 400);
    }

    if (stat.size > MAX_IMPORT_SIZE) {
      return json({
        error: 'file_too_large',
        message: `File exceeds maximum size of ${MAX_IMPORT_SIZE} bytes`,
      }, 413);
    }

    let content: string;
    try {
      content = await Deno.readTextFile(resolved);
    } catch (err) {
      if (err instanceof Deno.errors.PermissionDenied) {
        return json({ error: 'permission_denied', message: 'Cannot read this file' }, 403);
      }
      console.error('import file: read error', err);
      return json({ error: 'read_error', message: 'Failed to read file' }, 500);
    }

    canvasHub.broadcast({ type: 'replace', html: content });

    const preview = content.slice(0, 500);

    const result: CanvasImportFileResponse = {
      success: true,
      path: resolved,
      fileSize: stat.size,
      preview,
    };

    return json(result, 200);
  };
