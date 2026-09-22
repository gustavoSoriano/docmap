import {
  appendShapesToDrawing,
  createDrawing,
  createDrawingFromRecords,
  ensureDefaultCollection,
  getDrawing,
  readDocument,
} from './store.ts';
import {
  clearProposals,
  createProposal,
  dismissProposal,
  getProposal,
  listProposalNotices,
} from './proposals.ts';
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

const emptySnap = (): BoardSnapshot => ({ document: { store: {} } });

const setup = async (): Promise<
  { kv: Deno.Kv; cleanup: () => Promise<void> }
> => {
  const dir = await Deno.makeTempDir({ prefix: 'proposals-test-' });
  Deno.env.set('DOCMAP_DRAWINGS_DIR', dir);
  const kvPath = await Deno.makeTempFile({ suffix: '.sqlite3' });
  const kv = await Deno.openKv(kvPath);
  return {
    kv,
    cleanup: async () => {
      kv.close();
      Deno.env.delete('DOCMAP_DRAWINGS_DIR');
      await Deno.remove(dir, { recursive: true }).catch(() => {});
      await Deno.remove(kvPath).catch(() => {});
    },
  };
};

Deno.test('propostas: cria, lista e descarta', () => {
  clearProposals();
  try {
    const p = createProposal(
      [{ kind: 'text', text: 'oi' }],
      {},
      'teste',
    );
    assert(p.id, 'deveria ter id');
    assertEquals(p.records.length, 1);
    assertEquals(listProposalNotices().length, 1);
    assertEquals(listProposalNotices()[0].label, 'teste');
    assert(getProposal(p.id)?.id === p.id, 'get deveria achar');
    assert(dismissProposal(p.id), 'dismiss deveria retornar true');
    assertEquals(listProposalNotices().length, 0);
    assert(!dismissProposal(p.id), 'dismiss duplo deveria ser false');
  } finally {
    clearProposals();
  }
});

Deno.test('propostas: label vazio ganha default e teto evicta antigas', () => {
  clearProposals();
  try {
    const first = createProposal([{ kind: 'text', text: 'a' }], {});
    assertEquals(first.label, 'proposta da IA');
    for (let i = 0; i < 25; i++) {
      createProposal([{ kind: 'text', text: `n${i}` }], {}, `p${i}`);
    }
    const list = listProposalNotices();
    assertEquals(list.length, 20);
    assert(!getProposal(first.id), 'a mais antiga deveria ser evictada');
  } finally {
    clearProposals();
  }
});

Deno.test('propostas: posiciona abaixo do conteúdo base', () => {
  clearProposals();
  try {
    const base: BoardSnapshot = {
      document: {
        store: {
          'shape:old': {
            id: 'shape:old',
            typeName: 'shape',
            type: 'text',
            x: 80,
            y: 100,
            props: { text: 'x' },
          },
        },
      },
    };
    const p = createProposal(
      [{ kind: 'text', text: 'novo' }],
      base.document.store,
    );
    const rec = p.records[0] as Record<string, unknown>;
    assert(
      typeof rec.y === 'number' && rec.y > 100,
      `y (${rec.y}) deveria ficar abaixo do conteúdo`,
    );
  } finally {
    clearProposals();
  }
});

Deno.test('isolado: appendShapesToDrawing não exige board ao vivo', async () => {
  const { kv, cleanup } = await setup();
  try {
    const col = await ensureDefaultCollection(kv);
    const meta = await createDrawing(kv, {
      collectionId: col.id,
      name: 'base',
      snapshot: emptySnap(),
      shapes: 0,
    });
    assert(meta, 'desenho base deveria ser criado');
    const result = await appendShapesToDrawing(kv, meta!.id, [
      { kind: 'text', text: 'da IA' },
      { kind: 'geo', geo: 'rectangle', label: 'caixa' },
    ]);
    assert(result, 'append deveria funcionar');
    assertEquals(result!.ids.length, 2);
    const updated = await getDrawing(kv, meta!.id);
    assertEquals(updated?.shapes, 2);
    const doc = await readDocument(col.id, meta!.id);
    assertEquals(Object.keys(doc!.snapshot.document.store).length, 2);
    assert(!await appendShapesToDrawing(kv, 'inexistente', [
      { kind: 'text', text: 'x' },
    ]), 'id inexistente deveria dar null');
  } finally {
    await cleanup();
  }
});

Deno.test('isolado: createDrawingFromRecords gera desenho dos records', async () => {
  const { kv, cleanup } = await setup();
  clearProposals();
  try {
    const col = await ensureDefaultCollection(kv);
    const p = createProposal([{ kind: 'note', text: 'ideia' }], {}, 'ideias');
    const meta = await createDrawingFromRecords(kv, {
      collectionId: col.id,
      name: p.label,
      records: p.records,
    });
    assert(meta, 'desenho deveria ser criado');
    assertEquals(meta!.shapes, 1);
    const doc = await readDocument(col.id, meta!.id);
    assertEquals(Object.keys(doc!.snapshot.document.store).length, 1);
  } finally {
    clearProposals();
    await cleanup();
  }
});
