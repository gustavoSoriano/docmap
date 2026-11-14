// Validação dos critérios de conclusão no report de `done`.
// Puro: recebe a definição do monitor e o que o agente declarou.

import type { MonitorCriterionResult } from './types.ts';

export type CriterionInput = {
  readonly index?: number;
  readonly text?: string;
  readonly done?: boolean;
  readonly evidence?: string;
};

export type CriteriaCheck =
  | { readonly ok: true; readonly results: readonly MonitorCriterionResult[] }
  | { readonly ok: false; readonly missing: readonly string[] };

const normalize = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

// Resolve cada critério por índice (1-based) ou por texto. Um critério só é
// aceito quando `done === true`; o resultado guarda a evidência declarada.
export const checkDoneCriteria = (
  criteria: readonly string[],
  input: readonly CriterionInput[] | undefined,
): CriteriaCheck => {
  const declared = Array.isArray(input) ? input : [];
  const used = new Set<number>();
  const results: MonitorCriterionResult[] = [];
  const missing: string[] = [];

  criteria.forEach((criterion, i) => {
    const index = i + 1;
    const byIndex = declared.findIndex((item, pos) =>
      !used.has(pos) && item.index === index
    );
    const byText = declared.findIndex((item, pos) =>
      !used.has(pos) && typeof item.text === 'string' &&
      normalize(item.text) === normalize(criterion)
    );
    const pos = byIndex >= 0 ? byIndex : byText;
    const item = pos >= 0 ? declared[pos] : undefined;
    if (pos >= 0) used.add(pos);

    const done = item?.done === true;
    if (!done) missing.push(criterion);
    results.push({
      index,
      text: criterion,
      done,
      ...(typeof item?.evidence === 'string' && item.evidence.trim()
        ? { evidence: item.evidence.trim().slice(0, 2000) }
        : {}),
    });
  });

  return missing.length ? { ok: false, missing } : { ok: true, results };
};
