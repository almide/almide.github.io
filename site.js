// Progressive enhancement only: navigation and every translation work without JS.
(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const labels = {
    en: { light: 'Use light theme', dark: 'Use dark theme' },
    ja: { light: 'ライトモードに切り替え', dark: 'ダークモードに切り替え' },
    zh: { light: '切换为浅色模式', dark: '切换为深色模式' },
  };
  const language = root.lang.split('-')[0];
  const copy = labels[language] || labels.en;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : preference.matches;
  const syncButton = () => {
    const label = isDark() ? copy.light : copy.dark;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.dataset.dark = String(isDark());
  };
  if (button) {
    button.hidden = false;
    syncButton();
    button.addEventListener('click', () => {
      const theme = isDark() ? 'light' : 'dark';
      root.dataset.theme = theme;
      try { localStorage.setItem('almide-theme', theme); } catch { /* Storage may be blocked. */ }
      syncButton();
    });
    preference.addEventListener('change', syncButton);
  }
  // Matching home sections stay in view when changing language.
  document.querySelectorAll('.locale-switcher a').forEach(link => {
    link.addEventListener('click', () => {
      if (location.hash && document.getElementById(location.hash.slice(1))) {
        link.hash = location.hash;
      }
    });
  });
})();
