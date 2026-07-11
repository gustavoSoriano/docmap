import { Webview } from 'webview';

/**
 * Injeta atalhos de edição nativos (Ctrl/Cmd + A/C/V/X/Z) no webview.
 *
 * Webviews nativos não expõem um menu de edição por padrão, então atalhos
 * como copiar/colar/selecionar/desfazer não funcionam. Essa injeção intercepta
 * os atalhos globalmente e executa os comandos de documento correspondentes.
 */
export const injectEditShortcuts = (webview: Webview): void => {
  const script = `
    (function () {
      function run(command, value) {
        try {
          document.execCommand(command, false, value);
        } catch (_) {}
      }

      document.addEventListener('keydown', function (e) {
        if (!(e.ctrlKey || e.metaKey)) return;

        const key = e.key.toLowerCase();
        const isEditable =
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target.isContentEditable;

        if (key === 'a') {
          e.preventDefault();
          run('selectAll');
          return;
        }

        if (key === 'c') {
          e.preventDefault();
          run('copy');
          return;
        }

        if (key === 'x') {
          e.preventDefault();
          run('cut');
          return;
        }

        if (key === 'v') {
          e.preventDefault();
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function (text) {
              run('insertText', text);
            }).catch(function () {
              run('paste');
            });
          } else {
            run('paste');
          }
          return;
        }

        if (key === 'z') {
          e.preventDefault();
          if (isEditable) {
            run(e.shiftKey ? 'redo' : 'undo');
          }
          return;
        }
      });
    })();
  `;

  webview.init(script);
};
