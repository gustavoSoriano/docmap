import {
  HEADLESS_ROLES,
  headlessBootstrapMarkdown,
  headlessCapabilities,
  headlessManualDocument,
  parseHeadlessManualOptions,
  renderHeadlessManual,
  unknownHeadlessFeatures,
} from './manual.ts';
import { badRequest, json } from '../server/response.ts';

const markdown = (body: string): Response =>
  new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });

export const headlessHandler = (req: Request, url: URL): Response => {
  if (req.method !== 'GET') return json({ error: 'read_only' }, 405);

  if (
    url.pathname === '/headless' || url.pathname === '/headless/capabilities'
  ) {
    return json(headlessCapabilities());
  }

  if (url.pathname === '/headless/bootstrap') {
    return markdown(headlessBootstrapMarkdown());
  }

  if (url.pathname === '/headless/manual') {
    const options = parseHeadlessManualOptions(url);
    const role = options.role?.trim().toLowerCase();
    if (
      role && !HEADLESS_ROLES.includes(role as typeof HEADLESS_ROLES[number])
    ) {
      return badRequest(`role desconhecido: ${options.role}`);
    }

    const unknown = unknownHeadlessFeatures(options);
    if (unknown.length) {
      return badRequest(`feature desconhecida: ${unknown.join(', ')}`);
    }

    const format = url.searchParams.get('format') ?? 'markdown';
    if (format === 'json') return json(headlessManualDocument(options));
    if (format === 'markdown') return markdown(renderHeadlessManual(options));
    return badRequest('format deve ser markdown ou json');
  }

  return badRequest('rota headless desconhecida');
};
