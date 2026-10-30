import {
  importedNames,
  linkedMacroIds,
  parseBundle,
  remapMacroIds,
  uniqueName,
} from './bundle.ts';
import { resetBoardPersistForTests } from './board-file.ts';
import { boardHub } from './hub.ts';
import { exportCanvas, importCanvas } from './transfer.ts';
import { createMacro, getMacroById, listMacros } from '../macros/store.ts';
import type { BoardSnapshot } from './types.ts';

const assertEquals = (actual: unknown, expected: unknown): void => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`esperado ${e}, recebido ${a}`);
};

const geo = (id: string, extra: Record<string, unknown>) => ({
  id,
  typeName: 'shape',
  type: 'geo',
  x: 0,
  y: 0,
  props: { label: id },
  ...extra,
});

const board = (): BoardSnapshot => ({
  document: {
    store: {
      'shape:a': geo('shape:a', { macroId: 'm-1' }),
      'shape:b': geo('shape:b', { macroId: 'm-1' }),
      'shape:c': geo('shape:c', { url: 'https://exemplo.com' }),
    },
  },
});

const withTempBoard = async (fn: () => Promise<void>): Promise<void> => {
  const dir = await Deno.makeTempDir({ prefix: 'canvas-transfer-' });
  Deno.env.set('DOCMAP_CANVAS_FILE', `${dir}/board.json`);
  resetBoardPersistForTests();
  try {
    await fn();
  } finally {
    resetBoardPersistForTests();
    Deno.env.delete('DOCMAP_CANVAS_FILE');
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  }
};

Deno.test('bundle: linkedMacroIds sem repetição', () => {
  assertEquals(linkedMacroIds(board()), ['m-1']);
});

Deno.test('bundle: remapMacroIds troca só o que está no mapa', () => {
  const out = remapMacroIds(board(), new Map([['m-1', 'm-9']]));
  assertEquals(out.document.store['shape:a'].macroId, 'm-9');
  assertEquals(out.document.store['shape:c'].url, 'https://exemplo.com');
});

Deno.test('bundle: uniqueName evita colisão', () => {
  assertEquals(uniqueName('x', new Set()), 'x');
  assertEquals(uniqueName('x', new Set(['x'])), 'x-importada');
  assertEquals(
    uniqueName('x', new Set(['x', 'x-importada'])),
    'x-importada-2',
  );
});

Deno.test('bundle: importedNames acha só as variantes geradas', () => {
  const taken = new Set([
    'x',
    'x-importada',
    'x-importada-3',
    'x-importada-a',
    'xy',
  ]);
  assertEquals(importedNames('x', taken), [
    'x',
    'x-importada',
    'x-importada-3',
  ]);
});

Deno.test('bundle: parseBundle rejeita lixo e aceita board.json', () => {
  assertEquals('error' in parseBundle({ kind: 'outro', version: 1 }), true);
  assertEquals('error' in parseBundle({ version: 1, snapshot: {} }), true);
  const raw = parseBundle({ version: 1, snapshot: board() });
  assertEquals('bundle' in raw && raw.bundle.macros.length, 0);
});

Deno.test('transfer: exporta e importa em outra máquina', async () => {
  await withTempBoard(async () => {
    const src = await Deno.openKv(':memory:');
    const dst = await Deno.openKv(':memory:');
    try {
      const m = await createMacro(src, {
        name: 'deploy',
        title: 'Deploy',
        script: 'echo oi',
      });
      // Na máquina de destino já existe outra macro com o mesmo nome.
      await createMacro(dst, { name: 'deploy', title: 'X', script: 'ls' });
      boardHub.restore(remapMacroIds(board(), new Map([['m-1', m.id]])), null);

      const bundle = await exportCanvas(src);
      assertEquals(bundle.macros.map((x) => x.id), [m.id]);

      const res = await importCanvas(dst, bundle);
      assertEquals(res, { shapes: 3, macrosCreated: 1, macrosReused: 0 });
      const newId = boardHub.getSnapshot().document.store['shape:a'].macroId;
      const created = await getMacroById(dst, String(newId));
      assertEquals(created?.script, 'echo oi');
      assertEquals(created?.name, 'deploy-importada');

      // Reimportar o MESMO arquivo acha a cópia 'deploy-importada'.
      const twice = await importCanvas(dst, bundle);
      assertEquals(twice, { shapes: 3, macrosCreated: 0, macrosReused: 1 });
      assertEquals((await listMacros(dst)).length, 2);

      // Reimportar o próprio export no destino reaproveita pelo id.
      const again = await importCanvas(dst, await exportCanvas(dst));
      assertEquals(again.macrosReused, 1);
      assertEquals((await listMacros(dst)).length, 2);
    } finally {
      src.close();
      dst.close();
    }
  });
});
