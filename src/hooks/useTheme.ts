import { useSyncExternalStore } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'h5debug-theme';

function getTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
}

function setTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggle, setTheme };
}

// Initialize theme from storage on load
const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
if (saved) {
  document.documentElement.setAttribute('data-theme', saved);
} else {
  document.documentElement.setAttribute('data-theme', 'dark');
}
