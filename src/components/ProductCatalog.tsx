import { ArrowUpRight, Search, X } from 'lucide-react';
import { STUDIO_PROFILE } from '../data/studioData';
import {
  filterAndSortProducts,
  getDynamicCategories,
  type FilterValue,
  type SortOption,
} from '../utils/catalog';
import type { NormalizedGumroadProduct } from '../utils/gumroad';
import { DoodleStar } from './DoodleMotifs';
import { GumroadPrice } from './GumroadPrice';
import { StudioImage } from './StudioImage';

interface ProductCatalogProps {
  products: readonly NormalizedGumroadProduct[];
  totalCount: number | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: () => void;
  activeFilter: FilterValue;
  onFilterChange: (nextFilter: FilterValue) => void;
  searchQuery: string;
  onSearchChange: (nextQuery: string) => void;
  sortBy: SortOption;
  onSortChange: (nextSort: SortOption) => void;
  onResetFilters: () => void;
}

export function ProductCatalog({
  products,
  totalCount,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onResetFilters,
}: ProductCatalogProps) {
  const dynamicCategories = getDynamicCategories(products);
  const effectiveFilter: FilterValue =
    activeFilter === 'all' ||
    dynamicCategories.some((category) => category.id === activeFilter)
      ? activeFilter
      : 'all';

  const visibleProducts = filterAndSortProducts(products, {
    category: effectiveFilter,
    searchQuery,
    sortBy,
  });

  const hasActiveFilters =
    effectiveFilter !== 'all' ||
    searchQuery.trim().length > 0 ||
    sortBy !== 'newest';

  const filterTabs: { id: FilterValue; label: string; count: number }[] = [
    { id: 'all', label: 'All Products', count: products.length },
    ...dynamicCategories.map((category) => ({
      id: category.id as FilterValue,
      label: category.label,
      count: category.count,
    })),
  ];

  return (
    <section
      id="shop"
      aria-labelledby="shop-heading"
      data-testid="home-shop-section"
      className="scroll-mt-20 max-w-[1240px] mx-auto px-6 md:px-10 py-14 md:py-16 border-b-[1.5px] border-[#E3D6BE] dark:border-[#38322B]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p
            style={{ fontFamily: 'var(--font-hand)' }}
            className="text-xl text-[#F2765B] dark:text-[#F58971] mb-1"
          >
            studio shop
          </p>
          <h2
            id="shop-heading"
            className="font-display font-extrabold text-[clamp(1.75rem,3vw,2.45rem)] leading-[1.1] tracking-[-0.025em] text-[#24211D] dark:text-[#F5EDE0]"
          >
            Templates &amp; digital resources.
          </h2>
        </div>

        {products.length > 0 && (
          <p className="font-mono text-xs tabular-nums text-[#5C554C] dark:text-[#BDB3A4]">
            {visibleProducts.length}{' '}
            {visibleProducts.length === 1 ? 'item' : 'items'}
            {totalCount !== null && totalCount > products.length
              ? ` · ${products.length} of ${totalCount} loaded`
              : ''}
          </p>
        )}
      </div>

      {/* Discovery controls — shown automatically when Gumroad releases exist */}
      {products.length > 0 && (
        <div className="mb-10 pb-6 border-b-[1.5px] border-dashed border-[#D6C6AA] dark:border-[#3D362E] space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            <div className="relative flex-1 max-w-md">
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <Search
                className="w-4 h-4 text-[#5C554C] dark:text-[#BDB3A4] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="product-search"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search templates, formats, or topics..."
                className="w-full h-11 pl-10 pr-10 rounded-lg border-[1.5px] border-[#24211D] dark:border-[#4A433A] bg-[#FFFBF2] dark:bg-[#211E1A] text-sm text-[#24211D] dark:text-[#F5EDE0] placeholder:text-[#776F64] dark:placeholder:text-[#998F81] focus:border-[#4169E1] dark:focus:border-[#6B8FF7]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search query"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-md text-[#5C554C] hover:text-[#24211D] dark:text-[#BDB3A4] dark:hover:text-[#F5EDE0] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="product-sort"
                  className="text-xs font-semibold text-[#5C554C] dark:text-[#BDB3A4] whitespace-nowrap"
                >
                  Sort
                </label>
                <select
                  id="product-sort"
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className="h-11 px-3 rounded-lg border-[1.5px] border-[#24211D] dark:border-[#4A433A] bg-[#FFFBF2] dark:bg-[#211E1A] text-xs font-semibold text-[#24211D] dark:text-[#F5EDE0] focus:border-[#4169E1] dark:focus:border-[#6B8FF7] cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="title-asc">Title (A–Z)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="sketch-btn-secondary inline-flex items-center justify-center h-11 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {dynamicCategories.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter products by category or tag"
              className="flex flex-wrap items-center gap-2.5"
            >
              {filterTabs.map((tab) => {
                const isActive = effectiveFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onFilterChange(tab.id)}
                    className={`inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-[1.5px] ${
                      isActive
                        ? 'border-[#24211D] bg-[#4169E1] text-white shadow-[2px_2px_0_#24211D] dark:border-[#F5EDE0] dark:bg-[#6B8FF7] dark:text-[#181613] dark:shadow-[2px_2px_0_#0A0908]'
                        : 'border-[#D6C6AA] bg-[#FFFBF2] text-[#5C554C] hover:text-[#24211D] hover:border-[#24211D] dark:border-[#38322B] dark:bg-[#211E1A] dark:text-[#BDB3A4] dark:hover:text-[#F5EDE0] dark:hover:border-[#6B8FF7]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="font-mono tabular-nums opacity-85">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div
          data-testid="home-featured-empty"
          className="sketch-card rounded-xl px-6 py-7 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <DoodleStar className="w-4 h-4 text-[#B9D977] dark:text-[#C4E287]" />
              <p className="font-display text-base font-bold text-[#24211D] dark:text-[#F5EDE0]">
                No published products available yet.
              </p>
            </div>
            <p className="text-sm leading-relaxed text-[#5C554C] dark:text-[#BDB3A4]">
              Published Gumroad releases on {STUDIO_PROFILE.handle} appear here
              automatically with live pricing and instant digital delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <a
              href="/about"
              className="sketch-btn-secondary inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap"
            >
              <span>About the Studio</span>
            </a>
            <a
              href="/faq"
              className="inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold text-[#4169E1] dark:text-[#6B8FF7] hover:underline underline-offset-4 whitespace-nowrap"
            >
              <span>Read FAQ</span>
            </a>
          </div>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div
          data-testid="filtered-empty-state"
          className="sketch-card rounded-xl p-12 text-center"
        >
          <p className="text-sm text-[#5C554C] dark:text-[#BDB3A4] mb-4">
            No products matched your current search or filter selection.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="sketch-btn-secondary inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div
            data-testid="home-featured-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10"
          >
            {visibleProducts.map((product) => {
              const hasMetadataRow =
                product.categories.length > 0 || Boolean(product.formatLabel);

              return (
                <article
                  key={product.id}
                  id={`product-${product.permalink}`}
                  data-gumroad-product={product.permalink}
                  className="sketch-card rounded-xl p-4 flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${product.title} on Gumroad`}
                    className="group block aspect-square rounded-lg overflow-hidden border-[1.5px] border-[#24211D] dark:border-[#4A433A] bg-[#F5EBDA] dark:bg-[#292520] mb-4"
                  >
                    {product.imageUrl ? (
                      <StudioImage
                        src={product.imageUrl}
                        alt={product.imageAlt}
                        fallbackTitle={product.title}
                        className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div
                        data-testid="typographic-cover-specimen"
                        className="w-full h-full flex flex-col justify-between p-5 bg-[#FFFBF2] dark:bg-[#211E1A] text-left"
                      >
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-dashed border-[#D6C6AA] dark:border-[#3D362E]">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#4169E1] dark:text-[#6B8FF7] truncate">
                            {product.categoryLabel || STUDIO_PROFILE.brandWordmark}
                          </span>
                          <span
                            className="flex items-center gap-1 shrink-0"
                            aria-hidden="true"
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4169E1] border border-[#24211D] dark:border-[#F5EDE0]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F2765B] border border-[#24211D] dark:border-[#F5EDE0]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#B9D977] border border-[#24211D] dark:border-[#F5EDE0]" />
                          </span>
                        </div>

                        <div className="my-auto py-3">
                          <p
                            style={{ fontFamily: 'var(--font-hand)' }}
                            className="text-lg text-[#F2765B] dark:text-[#F58971] mb-1 leading-none"
                          >
                            faraz kayan studio
                          </p>
                          <p className="font-display text-2xl font-extrabold tracking-tight text-[#24211D] dark:text-[#F5EDE0] leading-[1.12]">
                            {product.title}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-dashed border-[#D6C6AA] dark:border-[#3D362E] flex items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-[#5C554C] dark:text-[#BDB3A4]">
                          <span>{product.formatLabel || STUDIO_PROFILE.handle}</span>
                          <span>gumroad</span>
                        </div>
                      </div>
                    )}
                  </a>

                  {hasMetadataRow && (
                    <div
                      data-testid="product-classification-row"
                      className="flex flex-wrap items-center gap-1.5 mb-2.5"
                    >
                      {product.categories.map((group) => (
                        <span
                          key={group.id}
                          data-testid="product-category-label"
                          className="inline-flex items-center px-2 py-0.5 rounded-md border border-[#D6C6AA] dark:border-[#3D362E] bg-[#F5EBDA]/70 dark:bg-[#292520] text-[11px] font-semibold text-[#5C554C] dark:text-[#BDB3A4]"
                        >
                          {group.label}
                        </span>
                      ))}
                      {product.formatLabel && (
                        <span className="text-[11px] font-mono text-[#5C554C] dark:text-[#BDB3A4] px-1">
                          {product.formatLabel}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h3 className="font-display text-lg font-bold tracking-tight text-[#24211D] dark:text-[#F5EDE0]">
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#4169E1] dark:hover:text-[#6B8FF7] transition-colors duration-150"
                      >
                        {product.title}
                      </a>
                    </h3>
                    <GumroadPrice
                      permalink={product.permalink}
                      price={product.price}
                    />
                  </div>

                  {product.description && (
                    <p className="text-sm leading-relaxed text-[#5C554C] dark:text-[#BDB3A4] mb-5 flex-1 line-clamp-4">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-dashed border-[#E3D6BE] dark:border-[#38322B] flex items-center justify-between gap-3">
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sketch-btn-primary group/link inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.05em]"
                    >
                      <span>View on Gumroad</span>
                      <ArrowUpRight
                        className="w-3.5 h-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-10 flex flex-col items-center gap-3">
              {loadMoreError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-[#C24127] dark:text-[#F58971]"
                >
                  {loadMoreError}
                </p>
              )}
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="sketch-btn-secondary inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading more releases…' : 'Load more releases'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
