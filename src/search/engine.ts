import { walkMd } from '../fs/walker.ts';

export type SearchResult = {
  readonly file: string;
  readonly line: number;
  readonly heading: string;
  readonly snippet: string;
};

const HEADING_RE = /^#{1,6}\s/;
const MAX_RESULTS = 60;

export const searchDocs = (root: string, query: string): SearchResult[] => {
  const results: SearchResult[] = [];
  const qLower = query.toLowerCase();

  for (const filePath of walkMd(root)) {
    if (results.length >= MAX_RESULTS) break;
    let content: string;
    try { content = Deno.readTextFileSync(filePath); } catch { continue; }

    const lines = content.split('\n');
    const fileId = filePath.slice(root.length + 1);
    let heading = '';

    for (let i = 0; i < lines.length; i++) {
      if (HEADING_RE.test(lines[i])) heading = lines[i].replace(/^#+\s*/, '').trim();
      if (!lines[i].toLowerCase().includes(qLower)) continue;

      const s0 = Math.max(0, i - 1);
      const s1 = Math.min(lines.length - 1, i + 2);
      results.push({ file: fileId, line: i + 1, heading, snippet: lines.slice(s0, s1 + 1).join('\n') });
      if (results.length >= MAX_RESULTS) break;
    }
  }

  return results;
};
