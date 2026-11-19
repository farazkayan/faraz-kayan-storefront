import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type { PageSlug } from '../data/studioData';
import { InkTransition, resolveToggleOrigin } from '../ink/inkTransition';
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

function syncThemeToDocument(theme: ThemeMode, persist: boolean): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors in restricted privacy contexts
    }
  }
}

export function SiteShell({
  activePage,
  twitterUrl = null,
  children,
}: SiteShellProps) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const themeRef = useRef<ThemeMode>(theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transitionRef = useRef<InkTransition | null>(null);

  // Sync initial resolved theme to document class without overriding an unset user preference
  useEffect(() => {
    themeRef.current = theme;
    syncThemeToDocument(theme, false);
  }, [theme]);

  const applyThemeImmediate = useCallback((next: ThemeMode) => {
    themeRef.current = next;
    syncThemeToDocument(next, true);
    setTheme(next);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = new InkTransition({
      canvas,
      getTheme: () => themeRef.current,
      applyTheme: applyThemeImmediate,
    });
    transitionRef.current = controller;

    return () => {
      controller.dispose();
      if (transitionRef.current === controller) {
        transitionRef.current = null;
      }
    };
  }, [applyThemeImmediate]);

  const handleToggleTheme = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const controller = transitionRef.current;
      if (!controller) {
        applyThemeImmediate(toggleThemeValue(themeRef.current));
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const origin = resolveToggleOrigin(
        event.nativeEvent,
        rect,
        { width: window.innerWidth, height: window.innerHeight }
      );
      controller.toggle(origin);
    },
    [applyThemeImmediate]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF7E8] text-[#24211D] dark:bg-[#181613] dark:text-[#F5EDE0]">
      <canvas ref={canvasRef} className="ink-canvas" aria-hidden="true" />

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
