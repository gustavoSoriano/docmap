const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const hostNameOf = (host: string | null): string | null => {
  if (!host) return null;
  try {
    return new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return null;
  }
};

export const isLoopbackHost = (host: string | null): boolean => {
  const hostname = hostNameOf(host);
  return hostname !== null && LOOPBACK_HOSTS.has(hostname);
};

export const isLoopbackOrigin = (origin: string | null): boolean => {
  if (!origin || origin === 'null') return true;
  try {
    const hostname = new URL(origin).hostname.replace(/^\[|\]$/g, '');
    return LOOPBACK_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

export const isPublicLanCanvasRequest = (
  method: string,
  pathname: string,
): boolean => {
  if (method === 'GET' && pathname === '/canvas') return true;
  if (method === 'GET' && pathname === '/canvas/info') return true;
  if (method === 'GET' && pathname.startsWith('/canvas/vendor/quickdraw/')) {
    return true;
  }
  if (method === 'POST' && pathname === '/canvas/frame') return true;
  if (pathname === '/canvas/ws') return true;
  return false;
};
