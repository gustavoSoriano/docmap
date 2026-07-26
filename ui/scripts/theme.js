// ════ Theme toggle (dark/light) — persiste em localStorage ════

const THEME_KEY = 'docmap-theme';
const THEMES = ['dark', 'light'];

const getStoredTheme = () => {
  const t = localStorage.getItem(THEME_KEY);
  return THEMES.includes(t) ? t : 'dark';
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') delete root.dataset.theme;
  else root.dataset.theme = theme;
  // Atualiza label no modal de settings se aberto
  const label = $('settings-theme-label');
  if (label) label.textContent = theme === 'dark' ? 'Escuro' : 'Claro';
};

const toggleTheme = () => {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* quota */ }
  applyTheme(next);
};

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getStoredTheme());
});
