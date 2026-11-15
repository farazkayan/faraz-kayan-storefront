import { useEffect, useState, type ReactNode } from 'react';
import type { PageSlug } from '../data/studioData';
import {
  resolveInitialTheme,
  THEME_STORAGE_KEY,
  toggleThemeValue,
  type ThemeMode,
} from '../utils/theme';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

interface SiteShellProps {
  activePage: PageSlug;
  twitterUrl?: string | null;
  children: ReactNode;
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    return resolveInitialTheme(stored, prefersDark);
  } catch {
    return 'light';
  }
}

export function SiteShell({
  activePage,
  twitterUrl = null,
  children,
}: SiteShellProps) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors in restricted privacy contexts
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((current) => toggleThemeValue(current));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF7E8] text-[#24211D] dark:bg-[#181613] dark:text-[#F5EDE0]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#4169E1] focus:text-white rounded-md text-sm font-semibold"
      >
        Skip to main content
      </a>

      <Navbar
        activePage={activePage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <Footer twitterUrl={twitterUrl} />
    </div>
  );
}
