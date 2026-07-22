// ════ Padronização semântica das tags (canônico EN) ════
// Consolida sinônimos PT/EN, singular/plural e typos; remove tags que são
// datas/períodos (ruído temporal, não tema). Lê pela AI API (:3334) e escreve
// pelo UI server (:3333). Idempotente — rode quantas vezes quiser.
//   deno run --allow-net scripts/standardize-tags.ts

const READ = 'http://127.0.0.1:3334';
const WRITE = 'http://127.0.0.1:3333';

// de → para (a chave é sempre o slug já normalizado que existe no banco).
const remap: Record<string, string> = {
  // IA / GenAI
  ia: 'ai', 'inteligencia-artificial': 'ai', inteligence: 'ai',
  artificial: 'ai', inteligencia: 'ai', 'ai-experiments-rag': 'ai',
  llms: 'llm', 'gpt-genai': 'genai', generative: 'genai', gen: 'genai',
  gemmini: 'gemini',
  // métricas
  metricas: 'metrics', metrica: 'metrics', metric: 'metrics',
  'datadog-metric-metrica': 'metrics',
  // dashboards
  dashboard: 'dash',
  // audiences
  audience: 'audiences', audiencia: 'audiences', audiencias: 'audiences',
  'audiencias-com-variaveis': 'audiences', 'audiencias-enriquecidas': 'audiences',
  // user
  users: 'user', usuario: 'user',
  // campaigns
  campanhas: 'campaigns', campanha: 'campaigns',
  // notification
  notify: 'notification', notificacao: 'notification', notificacoes: 'notification',
  // translation
  traducao: 'translation', traduzir: 'translation', tradutor: 'translation',
  translate: 'translation', translete: 'translation',
  // segmentation
  segmentations: 'segmentation', segmentacao: 'segmentation', segmentacoes: 'segmentation',
  // architecture
  arquitetura: 'architecture', arch: 'architecture',
  // docs
  docs: 'doc', documentacao: 'doc',
  // outros PT → EN
  seguranca: 'security', codigo: 'code', erros: 'error',
  observabilidade: 'observability',
  // test
  teste: 'test', testado: 'test', testing: 'test',
  // alerts
  alertas: 'alerts', alarme: 'alerts', alarmes: 'alerts',
  // typos
  playwrite: 'playwright', hugginface: 'huggingface', tollkit: 'toolkit',
  couta: 'cota', coutas: 'cotas',
};

// datas/períodos → removidas (não são tema).
const isNoise = (t: string): boolean =>
  /^\d{4,}$/.test(t) || // 2025, 20255 (ano ou lixo numérico)
  /^\d{4}-\d{2}(-\d{2})?$/.test(t) || // 2026-06-10
  /^q[1-4](-\d{4})?$/.test(t) || // q2, q1-2025
  t === 'season' || t === 'quarter';

const canon = (tags: readonly string[]): string[] => {
  const out = new Set<string>();
  for (const t of tags) {
    if (isNoise(t)) continue;
    const mapped = remap[t] ?? t;
    if (mapped) out.add(mapped);
  }
  return [...out];
};

const changedTags = (a: readonly string[], b: readonly string[]): boolean =>
  JSON.stringify([...a].sort()) !== JSON.stringify([...b].sort());

const eps = ['notes', 'tasks', 'diagrams', 'macros', 'podcasts', 'favorites', 'skills'];
const before = new Set<string>();
const after = new Set<string>();
let scanned = 0, changed = 0, failed = 0;

for (const ep of eps) {
  const items = await (await fetch(`${READ}/${ep}`)).json();
  for (const it of (Array.isArray(items) ? items : [])) {
    scanned++;
    const old: string[] = it.tags ?? [];
    old.forEach((t) => before.add(t));
    const neo = canon(old);
    neo.forEach((t) => after.add(t));
    if (!changedTags(old, neo)) continue;
    const r = await fetch(`${WRITE}/${ep}/${it.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: neo }),
    });
    if (r.ok) changed++;
    else { failed++; console.log(`  ✗ ${ep}/${it.id} → HTTP ${r.status}`); }
  }
}

console.log(`\nescaneadas: ${scanned} · alteradas: ${changed} · falhas: ${failed}`);
console.log(`tags únicas: ${before.size} → ${after.size} (−${before.size - after.size})`);
