// ════ Theme toggle (dark/light) — persiste em localStorage ════

const THEME_KEY = 'docmap-theme';
const THEMES = ['dark', 'light'];

const getStoredTheme = () => {
  const t = localStorage.getItem(THEME_KEY);
  return THEMES.includes(t) ? t : 'dark';
};

const iconFor = (theme) => (theme === 'dark' ? 'moon' : 'sun');

const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') delete root.dataset.theme;
  else root.dataset.theme = theme;
  const btn = $('theme-toggle');
  if (btn) {
    btn.innerHTML = ICON(iconFor(theme));
    btn.title = theme === 'dark' ? 'Mudar para claro' : 'Mudar para escuro';
  }
};

const toggleTheme = () => {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* quota */ }
  applyTheme(next);
};

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getStoredTheme());
  const btn = $('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});
