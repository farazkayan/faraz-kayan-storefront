export type GumroadTaxonomyEntry =
  | string
  | {
      id?: string;
      name?: string;
      slug?: string;
      label?: string;
    };

export interface GumroadCover {
  url?: string;
  original_url?: string;
  type?: string;
}

export interface GumroadRawProduct {
  id?: string;
  permalink?: string;
  custom_permalink?: string;
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  summary?: string;
  custom_summary?: string;
  url?: string;
  product_url?: string;
  canonical_url?: string;
  short_url?: string;
  gumroad_url?: string;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  cover_url?: string | null;
  covers?: Array<GumroadCover | string>;
  published?: boolean;
  is_published?: boolean;
  shown_on_profile?: boolean;
  is_shown_on_profile?: boolean;
  visible_on_profile?: boolean;
  deleted?: boolean;
  is_deleted?: boolean;
  archived?: boolean;
  status?: string;
  category?: GumroadTaxonomyEntry | null;
  category_name?: string | null;
  categories?: GumroadTaxonomyEntry[] | string | null;
  tags?: GumroadTaxonomyEntry[] | string | null;
  format?: string;
  file_types?: string[];
  formatted_price?: string;
  price_formatted?: string;
  display_price?: string;
  price_cents?: number;
  price?: number | string;
  currency_code?: string;
  is_pwyw?: boolean;
  customizable_price?: boolean;
  recurrence?: string;
  created_at?: string;
  published_at?: string;
}

export interface GumroadPriceEntry {
  price?: string | number;
  formatted_price?: string;
  price_formatted?: string;
  display_price?: string;
  original_price?: string | number;
  formatted_original_price?: string;
  price_cents?: number;
  original_price_cents?: number;
  currency?: string;
  currency_code?: string;
  localized?: boolean | string;
  recurrence?: string;
  is_pwyw?: boolean;
  customizable_price?: boolean;
}

export type GumroadPricesMap = Record<string, GumroadPriceEntry>;

export interface GumroadCreatorInfo {
  name?: string;
  username?: string;
  profile_url?: string;
  avatar_url?: string;
  bio?: string;
  twitter_handle?: string;
}

export interface GumroadDataPayload {
  success?: boolean;
  requestId?: string | null;
  products?: GumroadRawProduct[];
  catalog?: {
    products?: GumroadRawProduct[];
    products_total?: number;
    productsTotal?: number;
    total?: number;
    total_count?: number;
    has_more?: boolean;
    next_offset?: number;
  };
  prices?: GumroadPricesMap;
  creator?: GumroadCreatorInfo;
  user?: GumroadCreatorInfo;
  profile?: GumroadCreatorInfo;
  products_total?: number;
  productsTotal?: number;
  total?: number;
  total_count?: number;
  total_products?: number;
  has_more?: boolean;
  hasMore?: boolean;
  next_offset?: number;
  offset?: number;
  limit?: number;
}

export interface GumroadProductsRequestOptions {
  offset?: number;
  limit?: number;
}

export interface GumroadProductsGlobal {
  request?: (
    options?: GumroadProductsRequestOptions
  ) => Promise<GumroadDataPayload | GumroadRawProduct[] | unknown>;
}

declare global {
  interface Window {
    gumroadProducts?: GumroadProductsGlobal;
  }
}

export interface LivePriceInfo {
  displayPrice: string | null;
  originalPrice: string | null;
  currencyCode: string | null;
  numericSortCents: number | null;
}

export interface ProductClassificationGroup {
  id: string;
  label: string;
}

export interface NormalizedGumroadProduct {
  id: string;
  permalink: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  productUrl: string;
  categories: ProductClassificationGroup[];
  categoryId: string | null;
  categoryLabel: string | null;
  formatLabel: string | null;
  price: LivePriceInfo;
  createdTimestamp: number;
  catalogOrder: number;
}

export interface GumroadCatalogState {
  rawProducts: GumroadRawProduct[];
  pricesMap: GumroadPricesMap;
  products: NormalizedGumroadProduct[];
  profileUrl: string;
  twitterUrl: string | null;
  hasMore: boolean;
  nextOffset: number;
  totalCount: number | null;
  hasInjectedData: boolean;
}

export const GUMROAD_INITIAL_PAGE_LIMIT = 100;

export function safeJsonParse<T>(rawText: string | null | undefined): T | null {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }
  const trimmed = rawText.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

export function parseGumroadDataFromDocument(
  doc: Document | null | undefined
): GumroadDataPayload | null {
  if (!doc) return null;
  const el = doc.getElementById('gumroad-data');
  if (!el) return null;
  const parsed = safeJsonParse<GumroadDataPayload | GumroadRawProduct[]>(
    el.textContent
  );
  if (!parsed) return null;
  if (Array.isArray(parsed)) {
    return { products: parsed };
  }
  return parsed;
}

export function parseGumroadPricesFromDocument(
  doc: Document | null | undefined
): GumroadPricesMap {
  if (!doc) return {};
  const el = doc.getElementById('gumroad-prices');
  if (!el) return {};
  const parsed = safeJsonParse<GumroadPricesMap>(el.textContent);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  return parsed;
}

export function extractRawProductsFromPayload(
  payload: GumroadDataPayload | GumroadRawProduct[] | null | undefined
): GumroadRawProduct[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.products)) return payload.products;
  if (payload.catalog && Array.isArray(payload.catalog.products)) {
    return payload.catalog.products;
  }
  return [];
}

export function isValidHttpUrl(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractCreatorProfileUrl(
  payload: GumroadDataPayload | null | undefined,
  fallbackUrl: string
): string {
  const candidate =
    payload?.creator?.profile_url ??
    payload?.profile?.profile_url ??
    payload?.user?.profile_url;
  if (candidate && isValidHttpUrl(candidate)) {
    return candidate.replace(/\/+$/, '');
  }
  return fallbackUrl.replace(/\/+$/, '');
}

export function extractCreatorTwitterUrl(
  payload: GumroadDataPayload | null | undefined
): string | null {
  const handle =
    payload?.creator?.twitter_handle ??
    payload?.profile?.twitter_handle ??
    payload?.user?.twitter_handle;
  if (!handle || typeof handle !== 'string') return null;
  const clean = handle.trim().replace(/^@/, '');
  return clean ? `https://x.com/${encodeURIComponent(clean)}` : null;
}

export function firstNonEmptyString(
  ...values: Array<unknown>
): string | null {
  for (const val of values) {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

export function isProductEligibleForProfile(raw: GumroadRawProduct): boolean {
  if (!raw || typeof raw !== 'object') return false;

  if (raw.published === false || raw.is_published === false) return false;
  if (
    raw.shown_on_profile === false ||
    raw.is_shown_on_profile === false ||
    raw.visible_on_profile === false
  ) {
    return false;
  }
  if (raw.deleted === true || raw.is_deleted === true || raw.archived === true) {
    return false;
  }

  if (typeof raw.status === 'string') {
    const normalizedStatus = raw.status.trim().toLowerCase();
    if (
      normalizedStatus === 'draft' ||
      normalizedStatus === 'unpublished' ||
      normalizedStatus === 'archived' ||
      normalizedStatus === 'deleted' ||
      normalizedStatus === 'hidden'
    ) {
      return false;
    }
  }

  const hasIdentifier = Boolean(
    firstNonEmptyString(
      raw.custom_permalink,
      raw.permalink,
      raw.slug,
      raw.url,
      raw.product_url,
      raw.canonical_url,
      raw.short_url,
      raw.gumroad_url
    )
  );
  const hasTitle = Boolean(firstNonEmptyString(raw.name, raw.title));

  return hasIdentifier && hasTitle;
}

export function stripHtmlToText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  const styleBlockRe = new RegExp('<style[\\s\\S]*?<' + '/style>', 'gi');
  const scriptBlockRe = new RegExp('<script[\\s\\S]*?<' + '/script>', 'gi');
  return input
    .replace(styleBlockRe, ' ')
    .replace(scriptBlockRe, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractPermalink(raw: GumroadRawProduct): string {
  const direct = firstNonEmptyString(raw.custom_permalink, raw.permalink, raw.slug);
  if (direct) return direct;

  const candidateUrl =
    firstNonEmptyString(
      raw.product_url,
      raw.canonical_url,
      raw.url,
      raw.short_url,
      raw.gumroad_url
    ) ?? '';
  if (candidateUrl) {
    try {
      const parsed = candidateUrl.startsWith('/')
        ? new URL(candidateUrl, 'https://gumroad.com')
        : new URL(candidateUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const lIndex = parts.indexOf('l');
      if (lIndex !== -1 && parts[lIndex + 1]) {
        return parts[lIndex + 1];
      }
      if (parts.length > 0) {
        return parts[parts.length - 1];
      }
    } catch {
      // ignore invalid URL
    }
  }

  return (raw.id ?? '').trim();
}

export function buildCanonicalGumroadProductUrl(
  permalink: string,
  profileUrl: string
): string {
  const cleanBase = profileUrl.replace(/\/+$/, '');
  const cleanPermalink = permalink.trim();
  return cleanPermalink
    ? `${cleanBase}/l/${encodeURIComponent(cleanPermalink)}`
    : cleanBase;
}

export function resolveProductUrl(
  raw: GumroadRawProduct,
  permalink: string,
  profileUrl: string
): string {
  const cleanBase = profileUrl.replace(/\/+$/, '');
  const candidates = [
    raw.canonical_url,
    raw.product_url,
    raw.url,
    raw.short_url,
    raw.gumroad_url,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue;
    const trimmed = candidate.trim();
    if (trimmed.startsWith('/l/')) {
      return `${cleanBase}${trimmed}`;
    }
    if (isValidHttpUrl(trimmed) && !/\/shop\?product=/i.test(trimmed)) {
      return trimmed;
    }
  }
  return buildCanonicalGumroadProductUrl(permalink, cleanBase);
}

function normalizeImageCandidate(candidate: unknown): string | null {
  if (typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return trimmed;
}

export function resolveProductImageUrl(raw: GumroadRawProduct): string | null {
  const directCandidates = [raw.thumbnail_url, raw.preview_url, raw.cover_url];
  for (const candidate of directCandidates) {
    const normalized = normalizeImageCandidate(candidate);
    if (normalized) {
      return normalized;
    }
  }
  if (Array.isArray(raw.covers)) {
    for (const cover of raw.covers) {
      const stringCandidate = normalizeImageCandidate(cover);
      if (stringCandidate) {
        return stringCandidate;
      }
      if (cover && typeof cover === 'object') {
        const coverUrl = normalizeImageCandidate(
          cover.url ?? cover.original_url
        );
        if (coverUrl) {
          return coverUrl;
        }
      }
    }
  }
  return null;
}

function formatCents(
  cents: number,
  currencyCode = 'USD',
  isPwyw = false
): string {
  if (!Number.isFinite(cents) || cents < 0) return '';
  if (cents === 0) {
    return isPwyw ? 'Free+' : 'Free';
  }
  const amount = cents / 100;
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return isPwyw ? `${formatted}+` : formatted;
  } catch {
    const fallback = Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
    return isPwyw ? `${fallback}+` : fallback;
  }
}

function parseNumericCentsFromDisplay(display: string | null): number | null {
  if (!display) return null;
  if (/^free/i.test(display.trim())) return 0;
  const match = display.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export function resolveLivePrice(
  permalink: string,
  raw: GumroadRawProduct,
  pricesMap: GumroadPricesMap
): LivePriceInfo {
  const entry =
    (permalink ? pricesMap[permalink] : undefined) ??
    (raw.id ? pricesMap[raw.id] : undefined);

  const currencyCode = firstNonEmptyString(
    entry?.currency_code,
    entry?.currency,
    raw.currency_code
  );
  const isPwyw = Boolean(
    entry?.is_pwyw ??
      entry?.customizable_price ??
      raw.is_pwyw ??
      raw.customizable_price
  );

  let displayPrice: string | null = null;
  let numericSortCents: number | null = null;

  if (entry) {
    if (typeof entry.price_cents === 'number') {
      numericSortCents = entry.price_cents;
    } else if (typeof entry.price === 'number') {
      numericSortCents = entry.price;
    }

    const strCandidate = firstNonEmptyString(
      entry.formatted_price,
      entry.price_formatted,
      entry.display_price,
      entry.localized,
      typeof entry.price === 'string' ? entry.price : undefined
    );

    if (strCandidate) {
      displayPrice = strCandidate;
    } else if (typeof entry.price_cents === 'number') {
      displayPrice = formatCents(
        entry.price_cents,
        currencyCode ?? 'USD',
        isPwyw
      );
    } else if (typeof entry.price === 'number') {
      displayPrice = formatCents(entry.price, currencyCode ?? 'USD', isPwyw);
    }
  }

  if (!displayPrice) {
    if (numericSortCents === null) {
      if (typeof raw.price_cents === 'number') {
        numericSortCents = raw.price_cents;
      } else if (typeof raw.price === 'number') {
        numericSortCents = raw.price;
      }
    }

    const rawStr = firstNonEmptyString(
      raw.formatted_price,
      raw.price_formatted,
      raw.display_price,
      typeof raw.price === 'string' ? raw.price : undefined
    );

    if (rawStr) {
      displayPrice = rawStr;
    } else if (typeof raw.price_cents === 'number') {
      displayPrice = formatCents(
        raw.price_cents,
        currencyCode ?? 'USD',
        isPwyw
      );
    } else if (typeof raw.price === 'number') {
      displayPrice = formatCents(raw.price, currencyCode ?? 'USD', isPwyw);
    }
  }

  if (numericSortCents === null) {
    numericSortCents = parseNumericCentsFromDisplay(displayPrice);
  }

  let originalPrice: string | null = null;
  if (entry) {
    const origCandidate = firstNonEmptyString(
      entry.formatted_original_price,
      typeof entry.original_price === 'string' ? entry.original_price : undefined
    );
    if (origCandidate) {
      originalPrice = origCandidate;
    } else if (typeof entry.original_price_cents === 'number') {
      originalPrice = formatCents(
        entry.original_price_cents,
        currencyCode ?? 'USD',
        false
      );
    } else if (typeof entry.original_price === 'number') {
      originalPrice = formatCents(
        entry.original_price,
        currencyCode ?? 'USD',
        false
      );
    }
  }

  if (originalPrice && displayPrice && originalPrice === displayPrice) {
    originalPrice = null;
  }

  return {
    displayPrice,
    originalPrice,
    currencyCode,
    numericSortCents,
  };
}

function extractTaxonomyStrings(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed) out.push(trimmed);
      } else if (item && typeof item === 'object') {
        const obj = item as { name?: unknown; label?: unknown; slug?: unknown };
        const candidate = firstNonEmptyString(obj.name, obj.label, obj.slug);
        if (candidate) out.push(candidate);
      }
    }
    return out;
  }
  if (typeof value === 'object') {
    const obj = value as { name?: unknown; label?: unknown; slug?: unknown };
    const candidate = firstNonEmptyString(obj.name, obj.label, obj.slug);
    return candidate ? [candidate] : [];
  }
  return [];
}

export function normalizeClassificationSlug(rawValue: string): string {
  return rawValue
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatClassificationLabel(rawValue: string): string {
  const spaced = rawValue
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (!spaced) return '';
  // Preserve explicit author casing when uppercase letters already exist (e.g. "UI Kits", "PowerPoint")
  if (/[A-Z]/.test(spaced)) {
    return spaced;
  }
  return spaced
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function extractProductClassifications(raw: GumroadRawProduct): {
  categories: ProductClassificationGroup[];
  categoryId: string | null;
  categoryLabel: string | null;
  formatLabel: string | null;
} {
  const rawTerms = [
    ...extractTaxonomyStrings(raw.category),
    ...extractTaxonomyStrings(raw.category_name),
    ...extractTaxonomyStrings(raw.categories),
    ...extractTaxonomyStrings(raw.tags),
  ];

  const seenIds = new Set<string>();
  const categories: ProductClassificationGroup[] = [];

  for (const term of rawTerms) {
    const id = normalizeClassificationSlug(term);
    const label = formatClassificationLabel(term);
    if (!id || !label || seenIds.has(id)) {
      continue;
    }
    seenIds.add(id);
    categories.push({ id, label });
  }

  const explicitFormat =
    firstNonEmptyString(raw.format) ??
    (Array.isArray(raw.file_types) && raw.file_types.length > 0
      ? raw.file_types
          .map((t) => (typeof t === 'string' ? t.trim().toUpperCase() : ''))
          .filter(Boolean)
          .join(' · ') || null
      : null);

  return {
    categories,
    categoryId: categories[0]?.id ?? null,
    categoryLabel: categories[0]?.label ?? null,
    formatLabel: explicitFormat,
  };
}

export function normalizeGumroadProducts(
  rawProducts: readonly GumroadRawProduct[],
  pricesMap: GumroadPricesMap,
  profileUrl: string
): NormalizedGumroadProduct[] {
  const seenKeys = new Set<string>();
  const normalized: NormalizedGumroadProduct[] = [];

  rawProducts.forEach((raw, index) => {
    if (!isProductEligibleForProfile(raw)) {
      return;
    }

    const permalink = extractPermalink(raw);
    const id = (raw.id ?? permalink).trim();
    const dedupeKey = permalink || id;
    if (!dedupeKey || seenKeys.has(dedupeKey)) {
      return;
    }
    seenKeys.add(dedupeKey);

    const title = firstNonEmptyString(raw.name, raw.title) ?? '';
    const description =
      [raw.summary, raw.custom_summary, raw.description]
        .map((val) => (typeof val === 'string' ? stripHtmlToText(val) : ''))
        .find((text) => text.length > 0) ?? '';
    const productUrl = resolveProductUrl(raw, permalink, profileUrl);
    const imageUrl = resolveProductImageUrl(raw);
    const { categories, categoryId, categoryLabel, formatLabel } =
      extractProductClassifications(raw);
    const price = resolveLivePrice(permalink, raw, pricesMap);

    const dateCandidate = raw.published_at ?? raw.created_at;
    const parsedTime = dateCandidate ? Date.parse(dateCandidate) : Number.NaN;
    const createdTimestamp = Number.isFinite(parsedTime) ? parsedTime : 0;

    normalized.push({
      id,
      permalink,
      title,
      description,
      imageUrl,
      imageAlt: `${title} cover preview`,
      productUrl,
      categories,
      categoryId,
      categoryLabel,
      formatLabel,
      price,
      createdTimestamp,
      catalogOrder: index,
    });
  });

  return normalized;
}

export function extractTotalCount(
  payload: GumroadDataPayload | null | undefined
): number | null {
  const totalCandidate =
    payload?.products_total ??
    payload?.productsTotal ??
    payload?.catalog?.products_total ??
    payload?.catalog?.productsTotal ??
    payload?.total_count ??
    payload?.total ??
    payload?.total_products ??
    payload?.catalog?.total_count ??
    payload?.catalog?.total ??
    null;

  return typeof totalCandidate === 'number' && Number.isFinite(totalCandidate)
    ? totalCandidate
    : null;
}

export function computePaginationMeta(
  payload: GumroadDataPayload | null | undefined,
  loadedRawCount: number,
  eligibleCount: number,
  hasRequester: boolean
): { hasMore: boolean; nextOffset: number; totalCount: number | null } {
  const totalCount = extractTotalCount(payload);

  const explicitHasMore =
    payload?.has_more ?? payload?.hasMore ?? payload?.catalog?.has_more;

  const nextOffsetCandidate =
    payload?.next_offset ?? payload?.catalog?.next_offset;
  const nextOffset =
    typeof nextOffsetCandidate === 'number' && Number.isFinite(nextOffsetCandidate)
      ? nextOffsetCandidate
      : loadedRawCount;

  if (!hasRequester) {
    return { hasMore: false, nextOffset, totalCount };
  }

  if (totalCount !== null) {
    return {
      hasMore: eligibleCount < totalCount,
      nextOffset,
      totalCount,
    };
  }

  if (typeof explicitHasMore === 'boolean') {
    return { hasMore: explicitHasMore, nextOffset, totalCount };
  }

  return {
    hasMore: loadedRawCount >= GUMROAD_INITIAL_PAGE_LIMIT,
    nextOffset,
    totalCount,
  };
}

export function buildInitialCatalogState(
  doc: Document | null | undefined,
  fallbackProfileUrl: string,
  hasRequester: boolean
): GumroadCatalogState {
  const payload = parseGumroadDataFromDocument(doc);
  const pricesMap = {
    ...(payload?.prices ?? {}),
    ...parseGumroadPricesFromDocument(doc),
  };
  const rawProducts = extractRawProductsFromPayload(payload);
  const profileUrl = extractCreatorProfileUrl(payload, fallbackProfileUrl);
  const twitterUrl = extractCreatorTwitterUrl(payload);
  const products = normalizeGumroadProducts(rawProducts, pricesMap, profileUrl);
  const pagination = computePaginationMeta(
    payload,
    rawProducts.length,
    products.length,
    hasRequester
  );

  return {
    rawProducts,
    pricesMap,
    products,
    profileUrl,
    twitterUrl,
    hasMore: pagination.hasMore,
    nextOffset: pagination.nextOffset,
    totalCount: pagination.totalCount,
    hasInjectedData: payload !== null,
  };
}

export function mergeCatalogPage(
  current: GumroadCatalogState,
  pageResult: GumroadDataPayload | GumroadRawProduct[] | null | undefined,
  pageLimit = GUMROAD_INITIAL_PAGE_LIMIT
): GumroadCatalogState {
  const payload: GumroadDataPayload = Array.isArray(pageResult)
    ? { products: pageResult }
    : pageResult ?? {};

  if (payload.success === false) {
    return current;
  }

  const incomingRaw = extractRawProductsFromPayload(payload);
  const existingKeys = new Set(
    current.rawProducts
      .map((item) => extractPermalink(item) || (item.id ?? '').trim())
      .filter(Boolean)
  );
  const newRawItems = incomingRaw.filter((item) => {
    const key = extractPermalink(item) || (item.id ?? '').trim();
    if (!key) return true;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });

  const mergedPrices: GumroadPricesMap = {
    ...current.pricesMap,
    ...(payload.prices ?? {}),
  };

  const mergedRaw = [...current.rawProducts, ...newRawItems];
  const products = normalizeGumroadProducts(
    mergedRaw,
    mergedPrices,
    current.profileUrl
  );

  const explicitHasMore =
    payload.has_more ?? payload.hasMore ?? payload.catalog?.has_more;
  const totalCount = extractTotalCount(payload) ?? current.totalCount;

  let hasMore = false;
  if (incomingRaw.length === 0) {
    hasMore = false;
  } else if (totalCount !== null) {
    hasMore = products.length < totalCount;
  } else if (typeof explicitHasMore === 'boolean') {
    hasMore = explicitHasMore;
  } else {
    hasMore = incomingRaw.length >= pageLimit;
  }

  const nextOffset =
    typeof payload.next_offset === 'number'
      ? payload.next_offset
      : current.nextOffset + newRawItems.length;

  return {
    rawProducts: mergedRaw,
    pricesMap: mergedPrices,
    products,
    profileUrl: current.profileUrl,
    twitterUrl: current.twitterUrl,
    hasMore,
    nextOffset,
    totalCount,
    hasInjectedData: true,
  };
}
