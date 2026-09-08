import {
  createCollection,
  createDrawing,
  deleteCollection,
  deleteDrawing,
  ensureDefaultCollection,
  getDrawing,
  listCollections,
  listDrawings,
  overwriteDrawing,
  readDocument,
  renameDrawing,
  updateCollection,
} from './store.ts';
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
      ids.map((
        id,
      ) => [id, {
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

const setup = async (): Promise<
  { kv: Deno.Kv; dir: string; cleanup: () => Promise<void> }
> => {
  const dir = await Deno.makeTempDir({ prefix: 'drawings-test-' });
  Deno.env.set('DOCMAP_DRAWINGS_DIR', dir);
  const kvPath = await Deno.makeTempFile({ suffix: '.sqlite3' });
  const kv = await Deno.openKv(kvPath);
  return {
    kv,
    dir,
    cleanup: async () => {
      kv.close();
      Deno.env.delete('DOCMAP_DRAWINGS_DIR');
      await Deno.remove(dir, { recursive: true }).catch(() => {});
      await Deno.remove(kvPath).catch(() => {});
    },
  };
};

Deno.test('biblioteca: default collection criada sob demanda', async () => {
  const { kv, cleanup } = await setup();
  try {
    assertEquals((await listCollections(kv)).length, 0);
    const def = await ensureDefaultCollection(kv);
    assertEquals(def.name, 'Geral');
    assertEquals((await ensureDefaultCollection(kv)).id, def.id);
  } finally {
    await cleanup();
  }
});

Deno.test('biblioteca: collections CRUD', async () => {
  const { kv, cleanup } = await setup();
  try {
    const col = await createCollection(kv, {
      name: '  Fluxos  ',
      tags: ['Teste!'],
    });
    assertEquals(col.name, '  Fluxos  ');
    const renamed = await updateCollection(kv, col.id, { name: 'Diagramas' });
    assertEquals(renamed?.name, 'Diagramas');
    assertEquals((await listCollections(kv)).length, 1);
    assert(await deleteCollection(kv, col.id));
    assertEquals((await listCollections(kv)).length, 0);
    assert(!await deleteCollection(kv, col.id));
  } finally {
    await cleanup();
  }
});

Deno.test('biblioteca: save/overwrite/open roundtrip', async () => {
  const { kv, cleanup } = await setup();
  try {
    const col = await ensureDefaultCollection(kv);
    const saved = await createDrawing(kv, {
      collectionId: col.id,
      name: 'board 1',
      snapshot: snap(['a', 'b']),
      shapes: 2,
    });
    assert(saved);
    assertEquals(saved.shapes, 2);
    const doc = await readDocument(col.id, saved.id);
    assertEquals(Object.keys(doc?.snapshot.document.store ?? {}).length, 2);

    const over = await overwriteDrawing(kv, saved.id, {
      snapshot: snap(['c']),
      shapes: 1,
    });
    assertEquals(over?.shapes, 1);
    assertEquals((await getDrawing(kv, saved.id))?.updatedAt, over?.updatedAt);

    const moved = await renameDrawing(kv, saved.id, { name: 'renomeado' });
    assertEquals(moved?.name, 'renomeado');

    const col2 = await createCollection(kv, { name: 'Outros' });
    const movedCol = await renameDrawing(kv, saved.id, {
      collectionId: col2.id,
    });
    assertEquals(movedCol?.collectionId, col2.id);
    assert(await readDocument(col2.id, saved.id));
    assert(!await readDocument(col.id, saved.id));

    assertEquals((await listDrawings(kv, col2.id)).length, 1);
    assert(await deleteDrawing(kv, saved.id));
    assertEquals(await getDrawing(kv, saved.id), null);
    assert(!await readDocument(col2.id, saved.id));
  } finally {
    await cleanup();
  }
});

Deno.test('biblioteca: rejeita snapshot inválido e coleção inexistente', async () => {
  const { kv, cleanup } = await setup();
  try {
    assertEquals(
      await createDrawing(kv, {
        collectionId: 'nope',
        name: 'x',
        snapshot: snap(['a']),
        shapes: 1,
      }),
      null,
    );
    const col = await ensureDefaultCollection(kv);
    assertEquals(
      await createDrawing(kv, {
        collectionId: col.id,
        name: 'x',
        snapshot: {
          document: { store: { a: { id: 'b' } } },
        } as unknown as BoardSnapshot,
        shapes: 1,
      }),
      null,
    );
  } finally {
    await cleanup();
  }
});

Deno.test('biblioteca: delete collection remove desenhos e arquivos', async () => {
  const { kv, dir, cleanup } = await setup();
  try {
    const col = await createCollection(kv, { name: 'Temp' });
    const d = await createDrawing(kv, {
      collectionId: col.id,
      name: 't',
      snapshot: snap(['a']),
      shapes: 1,
    });
    assert(d);
    assert(await deleteCollection(kv, col.id));
    assertEquals((await listDrawings(kv, col.id)).length, 0);
    assertEquals(await getDrawing(kv, d.id), null);
    let dirGone = false;
    try {
      for await (const _entry of Deno.readDir(`${dir}/${col.id}`)) {
        throw new Error('diretório deveria ter sumido');
      }
      dirGone = false;
    } catch (err) {
      dirGone = err instanceof Deno.errors.NotFound;
      if (!dirGone) throw err;
    }
    assert(dirGone);
  } finally {
    await cleanup();
  }
});
