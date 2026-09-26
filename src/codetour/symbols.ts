// Extração simbólica pura: camada, símbolos, imports, relevância, ordem.
// Sem IO aqui — o walk vive em scan.ts. Regex pragmático p/ TS/JS.

import type {
  FileImport,
  FileSymbol,
  ScannedFile,
  SymbolKind,
  TourLayer,
} from './types.ts';

const LAYER_RULES: ReadonlyArray<[RegExp, TourLayer]> = [
  [
    /((^|\/)(routes?|controllers?|handlers?|endpoints?|api)\b|\.controller\.|\.routes?\.)/i,
    'api',
  ],
  [/((^|\/)services?\b|usecase|interactor|\.service\.)/i, 'service'],
  [
    /((^|\/)(store|stores|models?|repositories|repositories|dao|db|migrations?)\b|repository|\.model\.)/i,
    'data',
  ],
  [
    /((^|\/)(ui|components?|pages?|views?|screens?|styles?)\b|\.css$|\.tsx$)/i,
    'ui',
  ],
  [/(\.test\.|\.spec\.|__tests__|__mocks__|\/mocks?\/)/i, 'test'],
];

export const detectLayer = (path: string): TourLayer => {
  for (const [re, layer] of LAYER_RULES) {
    if (re.test(path)) return layer;
  }
  return 'util';
};

const SYMBOL_RE =
  /export\s+(?:default\s+)?(?:async\s+)?(function|class|interface|type|const|enum)\s+([A-Za-z_$][\w$]*)|export\s*\{\s*([^}]+?)\s*\}|^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm;

const IMPORT_RE =
  /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g;

const kindOf = (kw: string): SymbolKind => {
  if (kw === 'class') return 'class';
  if (kw === 'interface') return 'interface';
  if (kw === 'type' || kw === 'enum') return 'type';
  if (kw === 'const') return 'const';
  return 'function';
};

export const extractSymbols = (
  source: string,
): { symbols: FileSymbol[]; imports: FileImport[] } => {
  const symbols: FileSymbol[] = [];
  const seen = new Set<string>();
  const push = (name: string, kind: SymbolKind): void => {
    const key = `${kind}:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (symbols.length < 40) symbols.push({ name, kind });
  };
  let m: RegExpExecArray | null;
  SYMBOL_RE.lastIndex = 0;
  while ((m = SYMBOL_RE.exec(source)) !== null) {
    if (m[1] && m[2]) push(m[2], kindOf(m[1]));
    else if (m[3]) {
      for (const part of m[3].split(',')) {
        const name = part.split(' as ').pop()?.trim() ?? '';
        if (/^[A-Za-z_$][\w$]*$/.test(name)) push(name, 'const');
      }
    } else if (m[4]) push(m[4], 'function');
  }
  const raws: string[] = [];
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(source)) !== null) {
    const from = m[1] ?? m[2] ?? '';
    if (from && raws.length < 40 && !raws.includes(from)) raws.push(from);
  }
  return {
    symbols,
    imports: raws.map((from) => ({ from, resolved: null })),
  };
};

// Resolve só imports relativos (./ ../). Retorna path relativo ou null.
export const resolveImport = (
  from: string,
  importerPath: string,
  exists: (rel: string) => boolean,
): string | null => {
  if (!from.startsWith('.')) return null;
  const dir = importerPath.includes('/')
    ? importerPath.slice(0, importerPath.lastIndexOf('/'))
    : '';
  const base = dir ? `${dir}/${from}` : from;
  const norm = base.split('/').reduce<string[]>((acc, seg) => {
    if (seg === '' || seg === '.') return acc;
    if (seg === '..') acc.pop();
    else acc.push(seg);
    return acc;
  }, []).join('/');
  const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
  for (const ext of exts) {
    if (exists(norm + ext)) return norm + ext;
  }
  return null;
};

// Relevância da query: path pesa 3, símbolo pesa 2, import pesa 1.
export const scoreFile = (
  file: ScannedFile,
  terms: readonly string[],
): number => {
  if (terms.length === 0) return 0;
  const path = file.path.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (!t) continue;
    if (path.includes(t)) score += 3;
    for (const s of file.symbols) {
      if (s.name.toLowerCase().includes(t)) {
        score += 2;
        break;
      }
    }
    for (const i of file.imports) {
      if (i.from.toLowerCase().includes(t)) {
        score += 1;
        break;
      }
    }
  }
  return score;
};

export const queryTerms = (query: string): string[] =>
  query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);

// Ordem topológica (Kahn) pelos imports resolvidos. Sem ciclo = parcial.
export const orderFiles = (files: readonly ScannedFile[]): string[] => {
  const paths = new Set(files.map((f) => f.path));
  const deps = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();
  for (const f of files) {
    deps.set(f.path, new Set());
    dependents.set(f.path, new Set());
  }
  for (const f of files) {
    for (const i of f.imports) {
      if (i.resolved && paths.has(i.resolved) && i.resolved !== f.path) {
        deps.get(f.path)?.add(i.resolved);
        dependents.get(i.resolved)?.add(f.path);
      }
    }
  }
  const ready = [...files.map((f) => f.path)]
    .filter((p) => (deps.get(p)?.size ?? 0) === 0)
    .sort();
  const order: string[] = [];
  while (ready.length > 0) {
    const p = ready.shift() as string;
    order.push(p);
    for (const dep of [...(dependents.get(p) ?? [])].sort()) {
      deps.get(dep)?.delete(p);
      if (deps.get(dep)?.size === 0) ready.push(dep);
    }
    ready.sort();
  }
  for (const f of files) {
    if (!order.includes(f.path)) order.push(f.path);
  }
  return order;
};
