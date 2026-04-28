import { useSyncExternalStore } from 'react';

export type ColorTheme = 'dark' | 'light' | 'blue' | 'yellow';
export type DesignStyle = 'pixel' | 'modern';
export type FontStyle = 'pixel' | 'system' | 'serif' | 'rounded' | 'monospace';

interface ThemeState {
  colorTheme: ColorTheme;
  designStyle: DesignStyle;
  fontStyle: FontStyle;
}

const THEME_STORAGE_KEY = 'h5debug-color-theme';
const STYLE_STORAGE_KEY = 'h5debug-design-style';
const FONT_STORAGE_KEY = 'h5debug-font-style';

// Cache the last state to avoid returning new objects
let lastState: ThemeState | null = null;

function getThemeState(): ThemeState {
  const colorTheme = (document.documentElement.getAttribute('data-theme') as ColorTheme) || 'dark';
  const designStyle = (document.documentElement.getAttribute('data-style') as DesignStyle) || 'pixel';
  const fontStyle = (document.documentElement.getAttribute('data-font') as FontStyle) || 'pixel';

  // Return cached state if values haven't changed
  if (
    lastState &&
    lastState.colorTheme === colorTheme &&
    lastState.designStyle === designStyle &&
    lastState.fontStyle === fontStyle
  ) {
    return lastState;
  }

  // Create and cache new state
  lastState = { colorTheme, designStyle, fontStyle };
  return lastState;
}

function setColorTheme(colorTheme: ColorTheme) {
  document.documentElement.setAttribute('data-theme', colorTheme);
  localStorage.setItem(THEME_STORAGE_KEY, colorTheme);
}

function setDesignStyle(designStyle: DesignStyle) {
  document.documentElement.setAttribute('data-style', designStyle);
  localStorage.setItem(STYLE_STORAGE_KEY, designStyle);
}

function setFontStyle(fontStyle: FontStyle) {
  document.documentElement.setAttribute('data-font', fontStyle);
  localStorage.setItem(FONT_STORAGE_KEY, fontStyle);
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-style', 'data-font'],
  });
  return () => observer.disconnect();
}

export function useTheme() {
  const state = useSyncExternalStore(subscribe, getThemeState);

  const toggleColorTheme = () => {
    const themes: ColorTheme[] = ['dark', 'light', 'blue', 'yellow'];
    const currentIndex = themes.indexOf(state.colorTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setColorTheme(themes[nextIndex]);
  };

  const toggleDesignStyle = () => {
    setDesignStyle(state.designStyle === 'pixel' ? 'modern' : 'pixel');
  };

  return {
    colorTheme: state.colorTheme,
    designStyle: state.designStyle,
    fontStyle: state.fontStyle,
    setColorTheme,
    setDesignStyle,
    setFontStyle,
    toggleColorTheme,
    toggleDesignStyle,
  };
}

// Initialize theme from storage on load
const savedColorTheme = localStorage.getItem(THEME_STORAGE_KEY) as ColorTheme | null;
const savedDesignStyle = localStorage.getItem(STYLE_STORAGE_KEY) as DesignStyle | null;
const savedFontStyle = localStorage.getItem(FONT_STORAGE_KEY) as FontStyle | null;

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

if (savedFontStyle) {
  document.documentElement.setAttribute('data-font', savedFontStyle);
} else {
  document.documentElement.setAttribute('data-font', 'pixel');
}
