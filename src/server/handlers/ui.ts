import { html } from '../response.ts';
import { UI_HTML } from './ui-bundle.gen.ts';

// A UI é servida a partir do bundle pré-gerado (scripts/bundle-ui.ts).
// CSS e JS já estão inlinados — nenhuma requisição paralela no webview.
export const serveIndex = (): Promise<Response> =>
  Promise.resolve(html(UI_HTML));
