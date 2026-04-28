import { useSyncExternalStore } from 'react';

export type ColorTheme = 'dark' | 'light' | 'blue' | 'yellow';
export type DesignStyle = 'pixel' | 'modern';

interface ThemeState {
  colorTheme: ColorTheme;
  designStyle: DesignStyle;
}

const THEME_STORAGE_KEY = 'h5debug-color-theme';
const STYLE_STORAGE_KEY = 'h5debug-design-style';

function getThemeState(): ThemeState {
  const colorTheme = (document.documentElement.getAttribute('data-theme') as ColorTheme) || 'dark';
  const designStyle = (document.documentElement.getAttribute('data-style') as DesignStyle) || 'pixel';
  return { colorTheme, designStyle };
}

function setColorTheme(colorTheme: ColorTheme) {
  document.documentElement.setAttribute('data-theme', colorTheme);
  localStorage.setItem(THEME_STORAGE_KEY, colorTheme);
}

function setDesignStyle(designStyle: DesignStyle) {
  document.documentElement.setAttribute('data-style', designStyle);
  localStorage.setItem(STYLE_STORAGE_KEY, designStyle);
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-style'],
  });
  return () => observer.disconnect();
}

export function useTheme() {
  const { colorTheme, designStyle } = useSyncExternalStore(subscribe, getThemeState);

  const toggleColorTheme = () => {
    const themes: ColorTheme[] = ['dark', 'light', 'blue', 'yellow'];
    const currentIndex = themes.indexOf(colorTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setColorTheme(themes[nextIndex]);
  };

  const toggleDesignStyle = () => {
    setDesignStyle(designStyle === 'pixel' ? 'modern' : 'pixel');
  };

  return {
    colorTheme,
    designStyle,
    setColorTheme,
    setDesignStyle,
    toggleColorTheme,
    toggleDesignStyle,
  };
}

// Initialize theme from storage on load
const savedColorTheme = localStorage.getItem(THEME_STORAGE_KEY) as ColorTheme | null;
const savedDesignStyle = localStorage.getItem(STYLE_STORAGE_KEY) as DesignStyle | null;

if (savedColorTheme) {
  document.documentElement.setAttribute('data-theme', savedColorTheme);
} else {
  document.documentElement.setAttribute('data-theme', 'dark');
}

if (savedDesignStyle) {
  document.documentElement.setAttribute('data-style', savedDesignStyle);
} else {
  document.documentElement.setAttribute('data-style', 'pixel');
}
