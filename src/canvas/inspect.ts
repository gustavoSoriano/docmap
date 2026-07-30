import { json } from '../server/response.ts';
import type { HandlerDeps } from '../server/types.ts';
import type { CanvasInspectRequest, CanvasInspectResponse } from './types.ts';

function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildPrompt(req: CanvasInspectRequest): string {
  const el = req.element;
  const attrs = Object.entries(el.attributes)
    .map(([k, v]) => `      ${k}="${sanitize(v)}"`)
    .join('\n');

  const tagParts = [`<${el.tag}`];
  if (el.id) tagParts.push(` id="${sanitize(el.id)}"`);
  if (el.classes.length) tagParts.push(` class="${sanitize(el.classes.join(' '))}"`);
  const tagOpen = tagParts.join('') + '>';

  return [
    `ELEMENTO HTML:`,
    `  ${tagOpen}`,
    `  Texto: "${sanitize(el.textContent)}"`,
    `  Posição: {${el.boundingRect.x}, ${el.boundingRect.y}, ${el.boundingRect.width}, ${el.boundingRect.height}}`,
    attrs ? `  Atributos:\n${attrs}` : `  Atributos: (nenhum)`,
    ``,
    `TAREFA DO USUÁRIO:`,
    `  ${sanitize(req.userText)}`,
    ``,
    `Use o seletor CSS mais específico possível para identificar este elemento e execute a tarefa acima.`,
  ].join('\n');
}

export const createInspectHandler = (_deps: HandlerDeps) =>
  async (req: Request): Promise<Response> => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return json({ error: 'invalid_body' }, 400);
    }

    const { element, userText } = body as Record<string, unknown>;

    if (!element || typeof element !== 'object' || Array.isArray(element)) {
      return json({ error: 'element_required' }, 400);
    }

    if (typeof userText !== 'string' || !userText.trim()) {
      return json({ error: 'userText_required' }, 400);
    }

    const el = element as Record<string, unknown>;

    if (typeof el.tag !== 'string' || !el.tag.trim()) {
      return json({ error: 'element_tag_required' }, 400);
    }

    const elementData = {
      element: {
        tag: el.tag as string,
        id: typeof el.id === 'string' ? el.id : null,
        classes: Array.isArray(el.classes) ? el.classes.map(String) : [],
        attributes: el.attributes && typeof el.attributes === 'object' && !Array.isArray(el.attributes)
          ? Object.fromEntries(
              Object.entries(el.attributes as Record<string, unknown>)
                .map(([k, v]) => [k, String(v)])
            )
          : {},
        textContent: typeof el.textContent === 'string' ? el.textContent : '',
        boundingRect: el.boundingRect && typeof el.boundingRect === 'object' && !Array.isArray(el.boundingRect)
          ? {
              x: toNum((el.boundingRect as Record<string, unknown>).x),
              y: toNum((el.boundingRect as Record<string, unknown>).y),
              width: toNum((el.boundingRect as Record<string, unknown>).width),
              height: toNum((el.boundingRect as Record<string, unknown>).height),
            }
          : { x: 0, y: 0, width: 0, height: 0 },
      },
      userText: userText as string,
    } satisfies CanvasInspectRequest;

    const prompt = buildPrompt(elementData);
    const tagDesc = [elementData.element.tag];
    if (elementData.element.id) tagDesc.push(`#${elementData.element.id}`);
    if (elementData.element.classes.length) {
      tagDesc.push(`.${elementData.element.classes.join('.')}`);
    }
    const elementDescription = tagDesc.join('');

    const result: CanvasInspectResponse = {
      prompt,
      elementDescription,
    };

    return json(result, 200);
  };
