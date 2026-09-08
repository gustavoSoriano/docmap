// Serve os arquivos vendored do @quickdrawjs/core da memória
// (gerado por scripts/vendor-quickdraw.ts) — offline na LAN, sem CDN.

import { QUICKDRAW_FILES, QUICKDRAW_VERSION } from './vendor.gen.ts';

const JS_HEADERS = {
  'Content-Type': 'application/javascript; charset=utf-8',
  'Cache-Control': 'public, max-age=86400',
};

const CSS_HEADERS = {
  'Content-Type': 'text/css; charset=utf-8',
  'Cache-Control': 'public, max-age=86400',
};

export const vendorVersion = (): string => QUICKDRAW_VERSION;

/** Nomes servidos em /canvas/vendor/quickdraw/<nome>. */
export const isVendorFile = (name: string): boolean => name in QUICKDRAW_FILES;

export const serveVendorFile = (name: string): Response => {
  const body = QUICKDRAW_FILES[name];
  if (body === undefined) return new Response('Not found', { status: 404 });
  const headers = name.endsWith('.css') ? CSS_HEADERS : JS_HEADERS;
  return new Response(body, { status: 200, headers });
};
