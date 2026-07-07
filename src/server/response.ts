const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8' };

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

export const html = (body: string, status = 200): Response =>
  new Response(body, { status, headers: HTML_HEADERS });

export const notFound = (): Response =>
  new Response('Not found', { status: 404 });

export const badRequest = (msg: string): Response =>
  new Response(msg, { status: 400 });

export const noWorkspace = (): Response =>
  json({ error: 'no_workspace', message: 'Nenhum workspace selecionado.' }, 400);
