const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "frame-src 'self'",
    "connect-src 'self' ws: http://127.0.0.1:* http://localhost:*",
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
};

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

export const html = (body: string, status = 200): Response =>
  new Response(body, { status, headers: HTML_HEADERS });

export const notFound = (): Response =>
  new Response('Not found', { status: 404 });

export const badRequest = (msg: string): Response =>
  new Response(msg, { status: 400 });

export const conflict = (msg: string): Response =>
  new Response(msg, { status: 409 });
