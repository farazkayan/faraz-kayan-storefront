import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  DoodleAsterisk,
  DoodleCurvedArrow,
  DoodlePostbox,
  DoodleSparkles,
  DoodleSquiggle,
  DoodleStar,
  DoodleTapeCorner,
} from '../components/DoodleMotifs';
import { GumroadNewsletterForm } from '../components/GumroadNewsletterForm';
import { HeroSpecimen } from '../components/HeroSpecimen';
import { ProductCatalog } from '../components/ProductCatalog';
import { SiteShell } from '../components/SiteShell';
import { STUDIO_DISCIPLINES, STUDIO_PROFILE } from '../data/studioData';
import type { FilterValue, SortOption } from '../utils/catalog';
import {
  buildInitialCatalogState,
  GUMROAD_INITIAL_PAGE_LIMIT,
  mergeCatalogPage,
  type GumroadCatalogState,
  type GumroadDataPayload,
  type GumroadRawProduct,
} from '../utils/gumroad';

function getInitialCatalog(): GumroadCatalogState {
  if (typeof document === 'undefined') {
    return buildInitialCatalogState(
      null,
      STUDIO_PROFILE.gumroadProfileUrl,
      false
    );
  }
  const hasRequester =
    typeof window !== 'undefined' &&
    typeof window.gumroadProducts?.request === 'function';
  return buildInitialCatalogState(
    document,
    STUDIO_PROFILE.gumroadProfileUrl,
    hasRequester
  );
}

function getInjectedDomSignature(): string {
  if (typeof document === 'undefined') return '';
  const dataText = document.getElementById('gumroad-data')?.textContent ?? '';
  const pricesText =
    document.getElementById('gumroad-prices')?.textContent ?? '';
  const hasRequester =
    typeof window !== 'undefined' &&
    typeof window.gumroadProducts?.request === 'function'
      ? '1'
      : '0';
  return `${hasRequester}|${dataText}|${pricesText}`;
}

function scrollToShopSection(behavior: ScrollBehavior) {
  const el = document.getElementById('shop');
  if (!el) return;
  el.scrollIntoView({ behavior, block: 'start' });
}

const FEATURED_DISCIPLINES = STUDIO_DISCIPLINES;

const DISCIPLINE_SWATCHES = [
  'bg-[#4169E1] text-white dark:bg-[#6B8FF7] dark:text-[#181613]',
  'bg-[#F2765B] text-[#24211D] dark:bg-[#F58971] dark:text-[#181613]',
  'bg-[#B9D977] text-[#24211D] dark:bg-[#C4E287] dark:text-[#181613]',
];

export function HomePage() {
  const [catalog, setCatalog] = useState<GumroadCatalogState>(getInitialCatalog);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const lastDomSignatureRef = useRef<string>(getInjectedDomSignature());
  const handledRequestIdsRef = useRef<Set<string>>(new Set());

  // Observe late or dynamic #gumroad-data / #gumroad-prices injections plus pagination events
  useEffect(() => {
    const refreshFromDomIfChanged = () => {
      const nextSig = getInjectedDomSignature();
      if (nextSig === lastDomSignatureRef.current) return;
      lastDomSignatureRef.current = nextSig;
      const freshState = getInitialCatalog();
      if (freshState.hasInjectedData) {
        setCatalog(freshState);
      }
    };

    const handleGumroadResult = (event: Event) => {
      const customEvent = event as CustomEvent<
        GumroadDataPayload | GumroadRawProduct[] | undefined
      >;
      const detail = customEvent.detail;
      if (!detail) return;

      if (!Array.isArray(detail)) {
        const requestId =
          typeof detail.requestId === 'string' ? detail.requestId : null;
        if (requestId && handledRequestIdsRef.current.has(requestId)) {
          return;
        }
        if (requestId) {
          handledRequestIdsRef.current.add(requestId);
        }
        if (detail.success === false) {
          setLoadMoreError('Could not load additional releases right now.');
          setIsLoadingMore(false);
          return;
        }
      }

      setLoadMoreError(null);
      setCatalog((prev) =>
        mergeCatalogPage(prev, detail, GUMROAD_INITIAL_PAGE_LIMIT)
      );
      setIsLoadingMore(false);
    };

    window.addEventListener('gumroad:products:result', handleGumroadResult);
    document.addEventListener('DOMContentLoaded', refreshFromDomIfChanged);

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && document.documentElement) {
      observer = new MutationObserver(() => {
        refreshFromDomIfChanged();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      window.removeEventListener('gumroad:products:result', handleGumroadResult);
      document.removeEventListener('DOMContentLoaded', refreshFromDomIfChanged);
      observer?.disconnect();
    };
  }, []);

  // Intercept /#shop and #shop clicks in capture phase so Gumroad's iframe navigation bridge
  // does not trigger a full page reload when scrolling to #shop on the homepage.
  useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (window.location.hash === '#shop') {
      requestAnimationFrame(() => scrollToShopSection('auto'));
    }

    const handleShopHashClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const linkTarget = (anchor.getAttribute('target') || '').toLowerCase();
      if (linkTarget && linkTarget !== '_self') return;

      const rawHref = (anchor.getAttribute('href') || '').trim();
      let isSamePageShopHash = rawHref === '#shop' || rawHref === '/#shop';

      if (!isSamePageShopHash && rawHref) {
        try {
          const parsed = new URL(rawHref, document.baseURI);
          isSamePageShopHash =
            parsed.hash === '#shop' &&
            (parsed.pathname === '/' ||
              parsed.pathname === '/index.html' ||
              parsed.pathname === '/profile.html' ||
              parsed.pathname === '/landing/embed');
        } catch {
          isSamePageShopHash = false;
        }
      }

      if (!isSamePageShopHash) return;

      event.preventDefault();
      scrollToShopSection(behavior);
      try {
        window.history.replaceState(null, '', '#shop');
      } catch {
        // Ignore history restrictions inside sandboxed iframes
      }
    };

    window.addEventListener('click', handleShopHashClick, true);
    return () => {
      window.removeEventListener('click', handleShopHashClick, true);
    };
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (
      isLoadingMore ||
      !catalog.hasMore ||
      typeof window === 'undefined' ||
      typeof window.gumroadProducts?.request !== 'function'
    ) {
      return;
    }
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const result = await window.gumroadProducts.request({
        offset: catalog.nextOffset,
        limit: GUMROAD_INITIAL_PAGE_LIMIT,
      });
      if (result && typeof result === 'object') {
        const payload = result as GumroadDataPayload;
        const requestId =
          typeof payload.requestId === 'string' ? payload.requestId : null;
        if (requestId) {
          if (handledRequestIdsRef.current.has(requestId)) {
            return;
          }
          handledRequestIdsRef.current.add(requestId);
        }
        if (payload.success === false) {
          setLoadMoreError('Could not load additional releases right now.');
          return;
        }
        setCatalog((prev) =>
          mergeCatalogPage(
            prev,
            result as GumroadDataPayload | GumroadRawProduct[],
            GUMROAD_INITIAL_PAGE_LIMIT
          )
        );
      }
    } catch {
      setLoadMoreError('Could not load additional releases right now.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [catalog.hasMore, catalog.nextOffset, isLoadingMore]);

  const handleResetFilters = useCallback(() => {
    setActiveFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  }, []);

  const sortedProducts = [...catalog.products].sort((a, b) => {
    if (a.createdTimestamp !== b.createdTimestamp) {
      return b.createdTimestamp - a.createdTimestamp;
    }
    return a.catalogOrder - b.catalogOrder;
  });

  return (
    <SiteShell activePage="home" twitterUrl={catalog.twitterUrl}>
      {/* 1. Centered Art-Directed Studio Hero */}
      <section className="max-w-[1240px] mx-auto px-6 md:px-10 pt-10 pb-14 md:pt-16 md:pb-20 border-b-[1.5px] border-[#E3D6BE] dark:border-[#38322B]">
        <div className="max-w-[800px] mx-auto text-center relative">
          {/* Playful eyebrow */}
          <div className="inline-flex items-center justify-center gap-2 mb-5">
            <DoodleAsterisk className="w-3.5 h-3.5 text-[#F2765B] dark:text-[#F58971] shrink-0" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#5C554C] dark:text-[#BDB3A4]">
              A LITTLE CREATIVE CORNER
            </span>
          </div>

          {/* Centered editorial display headline with deliberate line breaks */}
          <h1 className="font-display font-extrabold text-[clamp(2.45rem,5.2vw,4.35rem)] leading-[1.03] tracking-[-0.03em] text-[#24211D] dark:text-[#F5EDE0] [text-wrap:balance] mb-6 relative">
            <span className="block">Start with an idea.</span>
            <span className="block mt-1">
              Make it look{' '}
              <span className="relative inline-block text-[#4169E1] dark:text-[#6B8FF7]">
                <span>brilliant.</span>
                <DoodleSquiggle className="absolute -bottom-2 left-0 w-full h-3.5 text-[#F2765B] dark:text-[#F58971] pointer-events-none" />
              </span>
            </span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg leading-[1.68] text-[#5C554C] dark:text-[#BDB3A4] max-w-[54ch] mx-auto mb-8">
            Playful, thoughtfully made digital templates and creative tools to
            help you design, present, and bring your next big idea to life.
          </p>

          {/* Centered primary CTA */}
          <div className="flex flex-col items-center gap-4">
            <a
              href="/#shop"
              className="sketch-btn-primary group inline-flex items-center justify-center gap-2 min-h-[50px] px-7 py-3.5 rounded-xl text-sm font-bold tracking-[0.06em] uppercase whitespace-nowrap"
            >
              <span>EXPLORE THE SHOP</span>
              <ArrowUpRight
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>

        {/* Centered studio sketchbook specimen + handwritten margin annotation */}
        <div className="max-w-[600px] mx-auto mt-10 md:mt-12 relative">
          {/* Handwritten margin annotation tucked just above the sketchbook frame */}
          <div className="flex items-end justify-center sm:justify-start gap-1.5 mb-2.5 sm:pl-2">
            <span
              style={{ fontFamily: 'var(--font-hand)' }}
              className="inline-flex items-center gap-1.5 text-xl text-[#5C554C] dark:text-[#BDB3A4] -rotate-2"
            >
              <span>psst... your next idea starts here</span>
              <DoodleAsterisk className="w-3.5 h-3.5 text-[#F2765B] dark:text-[#F58971] shrink-0" />
            </span>
            <DoodleCurvedArrow className="w-7 h-5 text-[#4169E1] dark:text-[#6B8FF7] shrink-0 translate-y-0.5" />
          </div>

          <DoodleSparkles className="hidden md:block absolute -left-11 top-1/2 -translate-y-1/2 w-7 h-7 text-[#4169E1] dark:text-[#6B8FF7] pointer-events-none" />
          <HeroSpecimen featuredProducts={sortedProducts.slice(0, 3)} />
          <DoodleStar className="hidden md:block absolute -right-10 bottom-10 w-6 h-6 text-[#F2765B] dark:text-[#F58971] pointer-events-none" />
        </div>
      </section>

      {/* 2. Three Studio Disciplines — Handcrafted Sketchbook Cards */}
      <section
        aria-labelledby="disciplines-heading"
        className="max-w-[1240px] mx-auto px-6 md:px-10 py-12 md:py-16 border-b-[1.5px] border-[#E3D6BE] dark:border-[#38322B]"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <DoodleStar className="w-4 h-4 text-[#F2765B] dark:text-[#F58971]" />
            <h2
              id="disciplines-heading"
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#5C554C] dark:text-[#BDB3A4]"
            >
              What the Studio Creates
            </h2>
          </div>

          <a
            href="/#shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4169E1] dark:text-[#6B8FF7] hover:underline underline-offset-4"
          >
            <span>Explore the shop</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_DISCIPLINES.map((discipline, idx) => (
            <div
              key={discipline.id}
              className="sketch-card rounded-xl p-6 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono text-xs font-bold tabular-nums border-[1.5px] border-[#24211D] dark:border-[#181613] ${
                      DISCIPLINE_SWATCHES[idx % DISCIPLINE_SWATCHES.length]
                    }`}
                  >
                    {discipline.index}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#24211D] dark:text-[#F5EDE0] mb-2">
                  {discipline.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#5C554C] dark:text-[#BDB3A4]">
                  {discipline.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Complete Dynamic Gumroad Product Catalogue (#shop) */}
      <ProductCatalog
        products={catalog.products}
        totalCount={catalog.totalCount}
        hasMore={catalog.hasMore}
        isLoadingMore={isLoadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={handleLoadMore}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Compact Creative Philosophy & Closing Invitation */}
      <section
        aria-labelledby="philosophy-heading"
        className="max-w-[1240px] mx-auto px-6 md:px-10 py-14 md:py-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5">
            <p
              id="philosophy-heading"
              style={{ fontFamily: 'var(--font-hand)' }}
              className="text-xl text-[#4169E1] dark:text-[#6B8FF7] mb-2"
            >
              studio philosophy
            </p>
            <blockquote className="font-display font-bold text-[clamp(1.65rem,2.7vw,2.25rem)] leading-[1.18] tracking-[-0.025em] text-[#24211D] dark:text-[#F5EDE0] mb-6">
              &ldquo;{STUDIO_PROFILE.philosophyPullQuote}&rdquo;
            </blockquote>
            <a
              href="/#shop"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#4169E1] dark:text-[#6B8FF7] hover:underline underline-offset-4"
            >
              <span>Browse all templates in the Shop</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          <div className="lg:col-span-7 border-t-[1.5px] border-dashed border-[#D6C6AA] dark:border-[#3D362E] divide-y divide-dashed divide-[#D6C6AA] dark:divide-[#3D362E]">
            {STUDIO_PROFILE.philosophyStatements.map((item) => (
              <div
                key={item.index}
                className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline"
              >
                <span className="sm:col-span-1 font-mono text-xs font-bold tabular-nums text-[#4169E1] dark:text-[#6B8FF7]">
                  {item.index}
                </span>
                <h3 className="sm:col-span-4 font-display text-base font-bold text-[#24211D] dark:text-[#F5EDE0]">
                  {item.title}
                </h3>
                <p className="sm:col-span-7 text-sm leading-relaxed text-[#5C554C] dark:text-[#BDB3A4]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. The Creative Postbox — Native Gumroad Follow Newsletter */}
      <section
        aria-labelledby="newsletter-heading"
        data-testid="home-newsletter-section"
        className="max-w-[1240px] mx-auto px-6 md:px-10 pt-2 pb-16 md:pb-20"
      >
        <div className="relative max-w-[820px] mx-auto">
          <DoodleTapeCorner className="hidden sm:block absolute -top-2.5 right-8 w-14 h-5 text-[#24211D] dark:text-[#F5EDE0] rotate-3 z-10 pointer-events-none" />

          <div className="sketch-card rounded-2xl px-6 py-9 sm:px-10 sm:py-12 md:px-14 text-center relative">
            <div className="flex justify-center mb-4">
              <DoodlePostbox className="w-16 h-12 text-[#24211D] dark:text-[#F5EDE0]" />
            </div>

            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <DoodleAsterisk className="w-3.5 h-3.5 text-[#F2765B] dark:text-[#F58971] shrink-0" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#5C554C] dark:text-[#BDB3A4]">
                THE CREATIVE POSTBOX
              </span>
            </div>

            <h2
              id="newsletter-heading"
              className="font-display font-extrabold text-[clamp(1.75rem,3.4vw,2.55rem)] leading-[1.1] tracking-[-0.025em] text-[#24211D] dark:text-[#F5EDE0] [text-wrap:balance] mb-3"
            >
              Good ideas, straight to your inbox.
            </h2>

            <p className="text-sm sm:text-base leading-[1.65] text-[#5C554C] dark:text-[#BDB3A4] max-w-[58ch] mx-auto mb-7">
              New releases, useful resources and little creative updates. No
              unnecessary noise.
            </p>

            <GumroadNewsletterForm variant="section" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
