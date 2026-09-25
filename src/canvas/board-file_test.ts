import {
  clearBoardDocument,
  flushBoardPersist,
  readBoardDocument,
  resetBoardPersistForTests,
  scheduleBoardPersist,
  writeBoardDocument,
} from './board-file.ts';
import { boardHub } from './hub.ts';
import type { BoardSnapshot } from './types.ts';

const assert: (condition: unknown, message?: string) => asserts condition = (
  condition,
  message = 'assert falhou',
) => {
  if (!condition) throw new Error(message);
};

const assertEquals = (actual: unknown, expected: unknown): void => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`esperado ${e}, recebido ${a}`);
};

const snap = (ids: string[]): BoardSnapshot => ({
  document: {
    store: Object.fromEntries(
      ids.map((id) => [id, {
        id,
        typeName: 'shape',
        type: 'text',
        x: 1,
        y: 2,
        props: { text: 'oi' },
      }]),
    ),
  },
});

const setup = async (): Promise<() => Promise<void>> => {
  const dir = await Deno.makeTempDir({ prefix: 'canvas-test-' });
  Deno.env.set('DOCMAP_CANVAS_FILE', `${dir}/board.json`);
  resetBoardPersistForTests();
  return async () => {
    resetBoardPersistForTests();
    Deno.env.delete('DOCMAP_CANVAS_FILE');
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  };
};

Deno.test('board-file: ausente retorna null', async () => {
  const cleanup = await setup();
  try {
    assertEquals(await readBoardDocument(), null);
  } finally {
    await cleanup();
  }
});

Deno.test('board-file: write/read roundtrip', async () => {
  const cleanup = await setup();
  try {
    const updatedAt = await writeBoardDocument(snap(['a', 'b']));
    assert(typeof updatedAt === 'string' && updatedAt, 'updatedAt ISO');
    const doc = await readBoardDocument();
    assert(doc, 'documento deveria existir');
    assertEquals(doc!.updatedAt, updatedAt);
    assertEquals(Object.keys(doc!.snapshot.document.store), ['a', 'b']);
  } finally {
    await cleanup();
  }
});

Deno.test('board-file: rejeita snapshot inválido', async () => {
  const cleanup = await setup();
  try {
    let threw = false;
    try {
      await writeBoardDocument({
        document: { store: { a: { id: 'b' } } },
      } as unknown as BoardSnapshot);
    } catch {
      threw = true;
    }
    assert(threw, 'snapshot inválido deveria lançar');
    assertEquals(await readBoardDocument(), null);
  } finally {
    await cleanup();
  }
});

Deno.test('board-file: arquivo corrompido retorna null', async () => {
  const cleanup = await setup();
  try {
    const path = Deno.env.get('DOCMAP_CANVAS_FILE')!;
    await Deno.writeTextFile(path, '{nao-json');
    assertEquals(await readBoardDocument(), null);
  } finally {
    await cleanup();
  }
});

Deno.test('board-file: schedule coalesce e flush persiste a última', async () => {
  const cleanup = await setup();
  try {
    scheduleBoardPersist(snap(['a']));
    scheduleBoardPersist(snap(['a', 'b']));
    await flushBoardPersist();
    const doc = await readBoardDocument();
    assertEquals(Object.keys(doc!.snapshot.document.store), ['a', 'b']);
  } finally {
    await cleanup();
  }
});

Deno.test('board-file: clear apaga o arquivo', async () => {
  const cleanup = await setup();
  try {
    await writeBoardDocument(snap(['a']));
    await clearBoardDocument();
    assertEquals(await readBoardDocument(), null);
  } finally {
    await cleanup();
  }
});

Deno.test('hub: mutações persistem no arquivo único', async () => {
  const cleanup = await setup();
  try {
    boardHub.clearBoard();
    await flushBoardPersist();
    assertEquals(
      Object.keys((await readBoardDocument())!.snapshot.document.store)
        .length,
      0,
    );

    boardHub.insertShapes([{ kind: 'text', text: 'da IA' }]);
    await flushBoardPersist();
    const doc = await readBoardDocument();
    assertEquals(Object.keys(doc!.snapshot.document.store).length, 1);

    boardHub.clearBoard();
    await flushBoardPersist();
    assertEquals(
      Object.keys((await readBoardDocument())!.snapshot.document.store)
        .length,
      0,
    );
  } finally {
    boardHub.clearBoard();
    await flushBoardPersist().catch(() => {});
    await cleanup();
  }
});

Deno.test('hub: restore carrega snapshot sem broadcast', async () => {
  const cleanup = await setup();
  try {
    boardHub.clearBoard();
    const err = boardHub.restore(snap(['x']), '2026-01-01T00:00:00.000Z');
    assertEquals(err, null);
    assertEquals(boardHub.shapeCount, 1);
    assertEquals(boardHub.updatedAt, '2026-01-01T00:00:00.000Z');
    assertEquals(
      boardHub.restore(
        { document: { store: { a: { id: 'b' } } } } as unknown as BoardSnapshot,
        null,
      ) !== null,
      true,
    );
  } finally {
    boardHub.clearBoard();
    await flushBoardPersist().catch(() => {});
    await cleanup();
  }
});
