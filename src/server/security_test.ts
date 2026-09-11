import {
  isLoopbackHost,
  isLoopbackOrigin,
  isPublicLanCanvasRequest,
} from './security.ts';

const assertEquals = (actual: unknown, expected: unknown): void => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
};

Deno.test('security: detects loopback hosts and origins', () => {
  assertEquals(isLoopbackHost('127.0.0.1:3333'), true);
  assertEquals(isLoopbackHost('localhost:3333'), true);
  assertEquals(isLoopbackHost('[::1]:3333'), true);
  assertEquals(isLoopbackHost('192.168.0.10:3333'), false);

  assertEquals(isLoopbackOrigin(null), true);
  assertEquals(isLoopbackOrigin('null'), true);
  assertEquals(isLoopbackOrigin('http://127.0.0.1:3333'), true);
  assertEquals(isLoopbackOrigin('https://example.com'), false);
});

Deno.test('security: allows only canvas viewer endpoints on LAN', () => {
  assertEquals(isPublicLanCanvasRequest('GET', '/canvas'), true);
  assertEquals(
    isPublicLanCanvasRequest('GET', '/canvas/vendor/quickdraw/index.js'),
    true,
  );
  assertEquals(isPublicLanCanvasRequest('POST', '/canvas/frame'), true);
  assertEquals(isPublicLanCanvasRequest('GET', '/canvas/snapshot'), false);
  assertEquals(isPublicLanCanvasRequest('POST', '/canvas/clear'), false);
  assertEquals(isPublicLanCanvasRequest('GET', '/notes'), false);
  assertEquals(isPublicLanCanvasRequest('GET', '/terminal/ws'), false);
});
