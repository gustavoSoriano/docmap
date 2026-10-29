import { isLoopbackHost, isLoopbackOrigin } from './security.ts';

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
