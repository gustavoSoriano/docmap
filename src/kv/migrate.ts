// ════ Migração de schema do KV ════
// Uma chave ["_meta","schemaVersion"] guarda a versão atual dos dados.
// Cada migração transforma o KV de N para N+1. Rodam em ordem no boot.

import { normalizeTags } from '../tags/normalize.ts';

const VERSION_KEY = ['_meta', 'schemaVersion'] as const;

type Migration = (kv: Deno.Kv) => Promise<void>;

// Índice = versão de destino. migrations[0] leva de v0 (vazio) para v1.
const migrations: Migration[] = [
  // v1 — baseline. Nada a fazer; estrutura inicial já é a corrente.
  async (_kv) => {},

  // v2 — adiciona config de AI. Default: ollama (provider local).
  async (kv) => {
    await kv.set(['ai', 'config'], { provider: 'ollama' });
  },

  // v3 — no-op (reservado para manter numeração de schema).
  async (_kv) => {},

  // v4 — podcasts ganham `withSlides` e `slideMap` (opcionais). Sem
  // transformação em dados existentes — podcasts antigos continuam válidos
  // (sem slides por padrão). Apenas reservamos a versão.
  async (_kv) => {},

  // v5 — tags como eixo de TEMA padronizado. Normaliza as tags já existentes
  // (notes, favorites, skills) para o formato slug e garante `tags: []` nos
  // domínios que ainda não tinham o campo (tasks, diagrams, macros, podcasts).
  // Idempotente: só reescreve entradas que de fato mudam.
  async (kv) => {
    // Quem já tinha o campo: normaliza os valores existentes.
    const tagged: Deno.KvKey[] = [
      ['notes', '_global_'],
      ['favorites'],
      ['skills', '_global_'],
    ];
    for (const prefix of tagged) {
      for await (const e of kv.list<{ tags?: readonly string[] }>({ prefix })) {
        const v = e.value;
        if (!v) continue;
        const tags = normalizeTags(v.tags);
        if (JSON.stringify(tags) !== JSON.stringify(v.tags ?? [])) {
          await kv.set(e.key, { ...v, tags });
        }
      }
    }
    // Quem não tinha: adiciona tags: [] (vazio, pronto pra ser preenchido).
    const untagged: Deno.KvKey[] = [
      ['tasks', '_global_'],
      ['diagrams', '_global_'],
      ['macros', '_global_'],
      ['podcasts', '_global_'],
    ];
    for (const prefix of untagged) {
      for await (const e of kv.list<{ tags?: readonly string[] }>({ prefix })) {
        const v = e.value;
        if (!v || Array.isArray(v.tags)) continue;
        await kv.set(e.key, { ...v, tags: [] });
      }
    }
  },

  // v6 — mocks ganham tags. Adiciona `tags: []` em mock_collections e mocks_data.
  async (kv) => {
    const prefixes: Deno.KvKey[] = [
      ['mock_collections'],
      ['mocks_data'],
    ];
    for (const prefix of prefixes) {
      for await (const e of kv.list<{ tags?: readonly string[] }>({ prefix })) {
        const v = e.value;
        if (!v || Array.isArray(v.tags)) continue;
        await kv.set(e.key, { ...v, tags: [] });
      }
    }
  },

  // v7 — workflows de agentes externos. As entidades usam prefixos novos no
  // KV, então não há dados antigos para transformar.
  async (_kv) => {},

  // v8 — o agente integrado (e seu provider LLM) foi removido do app. Deleta a
  // chave ["ai","config"] se existir. Idempotente: se a chave não existir (ou
  // já tiver sido deletada), não faz nada.
  async (kv) => {
    const entry = await kv.get<{ provider?: string }>(['ai', 'config']);
    if (entry.value) {
      await kv.delete(['ai', 'config']);
    }
  },

  // v9 — remove estado de pasta e comentários vinculados a arquivos externos.
  // Comentários de notas usam escopo global e são preservados.
  async (kv) => {
    await kv.delete(['workspace', 'last']);
    await kv.delete(['workspace', 'recent']);

    for await (const entry of kv.list<unknown>({ prefix: ['comments'] })) {
      const fileId = entry.key[2];
      if (typeof fileId === 'string' && fileId.startsWith('note:')) {
        await kv.set(['comments', '_global_', fileId], entry.value);
      }
      await kv.delete(entry.key);
    }
  },

  // v10 — módulo de diagramas Mermaid removido (substituído pela lousa).
  // Purga chaves órfãs ["diagrams", ...]. Idempotente.
  // (Os desenhos migrados vivem em ["canvas_drawings", ...] + disco.)
  async (kv) => {
    for await (const entry of kv.list<unknown>({ prefix: ['diagrams'] })) {
      await kv.delete(entry.key);
    }
  },

  // v11 — tasks ganham `checklist: [{ id, text, done }]`. Tasks antigas
  // continuam válidas (campo opcional na leitura), mas a migração preenche
  // `checklist: []` para leitura uniforme. Idempotente.
  async (kv) => {
    for await (
      const entry of kv.list<{ checklist?: unknown }>({
        prefix: ['tasks', '_global_'],
      })
    ) {
      const v = entry.value;
      if (!v || Array.isArray(v.checklist)) continue;
      await kv.set(entry.key, { ...v, checklist: [] });
    }
  },

  // v12 — chats entre agentes. Prefixos novos, sem dados para transformar.
  async (_kv) => {},

  // v13 — chats ganham `tags: []` para aparecer no grafo por tema.
  // Idempotente: só preenche quem ainda não tem o campo.
  async (kv) => {
    for await (
      const entry of kv.list<{ tags?: unknown }>({
        prefix: ['agentchats', '_global_'],
      })
    ) {
      const v = entry.value;
      if (!v || Array.isArray(v.tags)) continue;
      await kv.set(entry.key, { ...v, tags: [] });
    }
  },
];

export const CURRENT_SCHEMA = migrations.length;

export const runMigrations = async (kv: Deno.Kv): Promise<number> => {
  const entry = await kv.get<number>(VERSION_KEY);
  let version = entry.value ?? 0;

  while (version < CURRENT_SCHEMA) {
    await migrations[version](kv);
    version += 1;
    await kv.set(VERSION_KEY, version);
  }

  return version;
};
