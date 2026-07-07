// ════ Configuração central do app ════

export const APP_VERSION = '1.0.0';

// Repositório GitHub usado para auto-update (owner/repo).
// Pode ser sobrescrito pela env DOCMAP_REPO.
export const GITHUB_REPO = Deno.env.get('DOCMAP_REPO') ?? 'gustavosoriano/docmap';

const APP_DIR_NAME = 'docmap';

// Diretório de dados próprio do app, estável entre versões/builds.
// macOS:   ~/Library/Application Support/docmap
// Linux:   $XDG_DATA_HOME/docmap  ou  ~/.local/share/docmap
// Windows: %APPDATA%\docmap
export const dataDir = (): string => {
  const home = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE') ?? '.';
  switch (Deno.build.os) {
    case 'darwin':
      return `${home}/Library/Application Support/${APP_DIR_NAME}`;
    case 'windows':
      return `${Deno.env.get('APPDATA') ?? home}\\${APP_DIR_NAME}`;
    default: {
      const xdg = Deno.env.get('XDG_DATA_HOME');
      return xdg ? `${xdg}/${APP_DIR_NAME}` : `${home}/.local/share/${APP_DIR_NAME}`;
    }
  }
};

export const kvPath = (): string => `${dataDir()}/data.sqlite3`;
