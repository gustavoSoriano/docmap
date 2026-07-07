import { Webview } from 'webview';

export type WindowConfig = {
  readonly port: number;
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
};

export const openWindow = (config: WindowConfig): void => {
  const { port, title = '⬡ docmap', width = 1280, height = 800 } = config;

  const webview = new Webview(true);
  webview.title = title;
  webview.size = { width, height, hint: 0 };
  webview.navigate(`http://127.0.0.1:${port}`);
  webview.run();
};
