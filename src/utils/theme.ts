export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'farazkayan-theme';

export function resolveInitialTheme(
  storedValue: string | null | undefined,
  systemPrefersDark: boolean
): ThemeMode {
  if (storedValue === 'light' || storedValue === 'dark') {
    return storedValue;
  }
  return systemPrefersDark ? 'dark' : 'light';
}

export function toggleThemeValue(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}
