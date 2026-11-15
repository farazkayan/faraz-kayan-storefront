import type { NormalizedGumroadProduct } from './gumroad';

export type FilterValue = 'all' | string;
export type SortOption = 'newest' | 'title-asc' | 'price-asc' | 'price-desc';

export interface CatalogQueryOptions {
  category: FilterValue;
  searchQuery: string;
  sortBy: SortOption;
}

export interface DynamicCategorySummary {
  id: string;
  label: string;
  count: number;
}

export function filterAndSortProducts(
  products: readonly NormalizedGumroadProduct[],
  { category, searchQuery, sortBy }: CatalogQueryOptions
): NormalizedGumroadProduct[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (
      category !== 'all' &&
      !product.categories.some((item) => item.id === category)
    ) {
      return false;
    }

    if (normalizedQuery) {
      const haystack = [
        product.title,
        product.description,
        ...product.categories.map((item) => item.label),
        product.formatLabel ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];

  if (sortBy === 'newest') {
    sorted.sort((a, b) => {
      if (a.createdTimestamp !== b.createdTimestamp) {
        return b.createdTimestamp - a.createdTimestamp;
      }
      return a.catalogOrder - b.catalogOrder;
    });
  } else if (sortBy === 'title-asc') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'price-asc') {
    sorted.sort((a, b) => {
      const aCents = a.price.numericSortCents ?? Number.MAX_SAFE_INTEGER;
      const bCents = b.price.numericSortCents ?? Number.MAX_SAFE_INTEGER;
      if (aCents !== bCents) return aCents - bCents;
      return a.catalogOrder - b.catalogOrder;
    });
  } else if (sortBy === 'price-desc') {
    sorted.sort((a, b) => {
      const aCents = a.price.numericSortCents ?? -1;
      const bCents = b.price.numericSortCents ?? -1;
      if (aCents !== bCents) return bCents - aCents;
      return a.catalogOrder - b.catalogOrder;
    });
  }

  return sorted;
}

export function getCategoryCounts(
  products: readonly NormalizedGumroadProduct[]
): Record<string, number> {
  const counts: Record<string, number> = {
    all: products.length,
  };

  for (const product of products) {
    for (const group of product.categories) {
      counts[group.id] = (counts[group.id] ?? 0) + 1;
    }
  }

  return counts;
}

export function getDynamicCategories(
  products: readonly NormalizedGumroadProduct[]
): DynamicCategorySummary[] {
  const map = new Map<string, DynamicCategorySummary>();

  for (const product of products) {
    for (const group of product.categories) {
      const existing = map.get(group.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(group.id, {
          id: group.id,
          label: group.label,
          count: 1,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}
