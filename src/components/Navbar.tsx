import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { NAV_PAGES, STUDIO_PROFILE, type PageSlug } from '../data/studioData';
import type { ThemeMode } from '../utils/theme';
import { DoodleSquiggle } from './DoodleMotifs';

interface NavbarProps {
  activePage: PageSlug;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function Navbar({ activePage, theme, onToggleTheme }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const themeActionLabel =
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <header
      data-scrolled={isScrolled ? 'true' : 'false'}
      className={`sticky top-0 z-40 border-b-[1.5px] transition-colors duration-150 ${
        isScrolled
          ? 'border-[#24211D]/20 dark:border-[#F5EDE0]/15 bg-[#FFF7E8]/96 dark:bg-[#181613]/96 backdrop-blur-md'
          : 'border-[#E3D6BE] dark:border-[#38322B] bg-[#FFF7E8]/92 dark:bg-[#181613]/92 backdrop-blur-sm'
      }`}
    >
      <div
        className={`max-w-[1240px] mx-auto px-6 md:px-10 flex items-center justify-between gap-8 transition-[height] duration-150 ${
          isScrolled ? 'h-14' : 'h-16'
        }`}
      >
        {/* Zone 1: Clean lowercase wordmark */}
        <a
          href="/"
          className="inline-flex items-center text-[#24211D] dark:text-[#F5EDE0] hover:text-[#4169E1] dark:hover:text-[#6B8FF7] transition-colors duration-150 whitespace-nowrap shrink-0"
        >
          <span className="font-display text-lg font-extrabold tracking-[-0.03em] lowercase">
            {STUDIO_PROFILE.brandWordmark}
          </span>
        </a>

        {/* Zone 2: Clean single-line links with hand-drawn squiggle active indicator */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 lg:gap-9 text-sm font-semibold"
        >
          {NAV_PAGES.map((page) => {
            const isActive = activePage === page.id;
            return (
              <a
                key={page.id}
                href={page.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative whitespace-nowrap shrink-0 py-1.5 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#24211D] dark:text-[#F5EDE0]'
                    : 'text-[#5C554C] dark:text-[#BDB3A4] hover:text-[#4169E1] dark:hover:text-[#6B8FF7]'
                }`}
              >
                <span>{page.label}</span>
                {isActive ? (
                  <DoodleSquiggle className="absolute -bottom-1 left-0 w-full h-2.5 text-[#4169E1] dark:text-[#6B8FF7] pointer-events-none" />
                ) : (
                  <DoodleSquiggle className="absolute -bottom-1 left-0 w-full h-2 text-[#4169E1]/70 dark:text-[#6B8FF7]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Theme toggle + mobile menu trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={themeActionLabel}
            aria-pressed={theme === 'dark'}
            title={themeActionLabel}
            className="sketch-btn-secondary inline-flex items-center justify-center gap-2 h-9 min-w-[40px] px-3 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F5EDE0]" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-[#4169E1]" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            className="md:hidden sketch-btn-secondary inline-flex items-center justify-center w-11 h-11 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation-drawer"
          aria-label="Mobile navigation"
          className="md:hidden border-t-[1.5px] border-[#E3D6BE] dark:border-[#38322B] bg-[#FFF7E8] dark:bg-[#181613] px-6 py-3"
        >
          <ul className="flex flex-col divide-y divide-[#E3D6BE] dark:divide-[#38322B]">
            {NAV_PAGES.map((page) => {
              const isActive = activePage === page.id;
              return (
                <li key={page.id}>
                  <a
                    href={page.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between min-h-[46px] text-base transition-colors duration-150 ${
                      isActive
                        ? 'font-bold text-[#4169E1] dark:text-[#6B8FF7]'
                        : 'font-medium text-[#24211D] dark:text-[#F5EDE0] hover:text-[#4169E1] dark:hover:text-[#6B8FF7]'
                    }`}
                  >
                    <span>{page.label}</span>
                    {isActive && (
                      <span
                        style={{ fontFamily: 'var(--font-hand)' }}
                        className="text-lg text-[#F2765B] dark:text-[#F58971]"
                      >
                        here
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
