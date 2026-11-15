import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_PAGES } from '../data/studioData';
import {
  filterAndSortProducts,
  getCategoryCounts,
  getDynamicCategories,
} from './catalog';
import {
  computePaginationMeta,
  extractPermalink,
  isProductEligibleForProfile,
  mergeCatalogPage,
  normalizeGumroadProducts,
  resolveLivePrice,
  safeJsonParse,
  stripHtmlToText,
  type GumroadPricesMap,
  type GumroadRawProduct,
} from './gumroad';
import { resolveInitialTheme, toggleThemeValue } from './theme';

test('isProductEligibleForProfile filters out drafts, hidden, deleted, and archived products', () => {
  assert.equal(
    isProductEligibleForProfile({
      name: 'Public Deck',
      permalink: 'public-deck',
      published: true,
      shown_on_profile: true,
    }),
    true
  );

  assert.equal(
    isProductEligibleForProfile({
      name: 'Unpublished Draft',
      permalink: 'draft-deck',
      published: false,
      shown_on_profile: true,
    }),
    false
  );

  assert.equal(
    isProductEligibleForProfile({
      name: 'Hidden From Profile',
      permalink: 'hidden-deck',
      published: true,
      shown_on_profile: false,
    }),
    false
  );

  assert.equal(
    isProductEligibleForProfile({
      name: 'Archived Item',
      permalink: 'archived-item',
      status: 'archived',
    }),
    false
  );

  assert.equal(
    isProductEligibleForProfile({
      name: 'Deleted Item',
      permalink: 'deleted-item',
      deleted: true,
    }),
    false
  );
});

test('stripHtmlToText cleans Gumroad HTML descriptions into readable prose', () => {
  const html =
    '<p>Minimal <strong>PowerPoint</strong> template &amp; layout grid.</p><p>Instant download.</p>';
  assert.equal(
    stripHtmlToText(html),
    'Minimal PowerPoint template & layout grid. Instant download.'
  );
});

test('resolveLivePrice prefers gumroad-prices live figures and preserves original discount price', () => {
  const pricesMap: GumroadPricesMap = {
    'editorial-deck': {
      formatted_price: '$18',
      formatted_original_price: '$24',
      currency_code: 'USD',
    },
    'pwyw-pack': {
      price_cents: 0,
      currency_code: 'USD',
      is_pwyw: true,
    },
  };

  const discounted = resolveLivePrice(
    'editorial-deck',
    { permalink: 'editorial-deck', name: 'Editorial Deck' },
    pricesMap
  );
  assert.equal(discounted.displayPrice, '$18');
  assert.equal(discounted.originalPrice, '$24');
  assert.equal(discounted.numericSortCents, 1800);

  const pwyw = resolveLivePrice(
    'pwyw-pack',
    { permalink: 'pwyw-pack', name: 'PWYW Pack' },
    pricesMap
  );
  assert.equal(pwyw.displayPrice, 'Free+');
  assert.equal(pwyw.originalPrice, null);
  assert.equal(pwyw.numericSortCents, 0);

  const unpriced = resolveLivePrice(
    'missing-price',
    { permalink: 'missing-price', name: 'Missing Price' },
    pricesMap
  );
  assert.equal(unpriced.displayPrice, null);
  assert.equal(unpriced.numericSortCents, null);
});

test('normalizeGumroadProducts classifies strictly from Gumroad category/tags and never invents classification from titles', () => {
  const rawProducts: GumroadRawProduct[] = [
    {
      id: 'prod_1',
      name: 'Architectural Pitch PowerPoint Deck',
      permalink: 'arch-pitch-deck',
      url: 'https://farazkayan.gumroad.com/l/arch-pitch-deck',
      thumbnail_url: 'https://public-files.gumroad.com/deck.jpg',
      summary: '<p>48 clean master slides.</p>',
      tags: ['presentation', 'pitch-deck'],
      format: 'PowerPoint & Keynote',
      published: true,
      shown_on_profile: true,
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'prod_1',
      name: 'Duplicate Entry',
      permalink: 'arch-pitch-deck',
      published: true,
      shown_on_profile: true,
    },
    {
      id: 'prod_2',
      name: 'Studio Canva Carousel Pack',
      permalink: 'canva-carousel-pack',
      short_url: 'https://farazkayan.gumroad.com/l/canva-carousel-pack',
      covers: [{ url: 'https://public-files.gumroad.com/canva.jpg' }],
      description: 'Modular social templates for Canva.',
      published: true,
      shown_on_profile: true,
      created_at: '2026-10-15T10:00:00Z',
    },
    {
      id: 'prod_3',
      name: 'Private Draft Asset',
      permalink: 'private-draft',
      published: false,
    },
  ];

  const pricesMap: GumroadPricesMap = {
    'arch-pitch-deck': { formatted_price: '$24' },
    'canva-carousel-pack': { formatted_price: '$16' },
  };

  const normalized = normalizeGumroadProducts(
    rawProducts,
    pricesMap,
    'https://farazkayan.gumroad.com'
  );

  assert.equal(normalized.length, 2);
  // First product has Gumroad tags -> Presentation & Pitch Deck
  assert.equal(normalized[0].formatLabel, 'PowerPoint & Keynote');
  assert.equal(normalized[0].categoryId, 'presentation');
  assert.equal(normalized[0].categoryLabel, 'Presentation');
  assert.deepEqual(normalized[0].categories, [
    { id: 'presentation', label: 'Presentation' },
    { id: 'pitch-deck', label: 'Pitch Deck' },
  ]);

  // Second product mentions "Canva" in title & description, but has NO category/tags -> must remain unclassified
  assert.equal(normalized[1].formatLabel, null);
  assert.equal(normalized[1].categoryId, null);
  assert.equal(normalized[1].categoryLabel, null);
  assert.deepEqual(normalized[1].categories, []);
});

test('filterAndSortProducts and getDynamicCategories organize strictly by Gumroad metadata', () => {
  const normalized = normalizeGumroadProducts(
    [
      {
        name: 'Keynote Deck',
        permalink: 'keynote-deck',
        tags: ['presentation'],
        created_at: '2026-08-01T00:00:00Z',
      },
      {
        name: 'Brand Guide',
        permalink: 'canva-brand',
        category: 'Canva Templates',
        tags: ['branding'],
        created_at: '2026-11-01T00:00:00Z',
      },
      {
        name: 'Portfolio Starter',
        permalink: 'web-starter',
        categories: ['Website Templates'],
        tags: ['presentation'],
        created_at: '2026-09-15T00:00:00Z',
      },
      {
        name: 'Unclassified Notebook',
        permalink: 'notebook-pdf',
        created_at: '2026-07-01T00:00:00Z',
      },
    ],
    {
      'keynote-deck': { formatted_price: '$24' },
      'canva-brand': { formatted_price: '$12' },
      'web-starter': { formatted_price: '$32' },
      'notebook-pdf': { formatted_price: '$8' },
    },
    'https://farazkayan.gumroad.com'
  );

  const counts = getCategoryCounts(normalized);
  assert.equal(counts.all, 4);
  assert.equal(counts.presentation, 2);
  assert.equal(counts['canva-templates'], 1);
  assert.equal(counts['website-templates'], 1);
  assert.equal(counts.other, undefined);

  const dynamicCategories = getDynamicCategories(normalized);
  assert.equal(dynamicCategories[0].id, 'presentation');
  assert.equal(dynamicCategories[0].label, 'Presentation');
  assert.equal(dynamicCategories[0].count, 2);

  const presentationFiltered = filterAndSortProducts(normalized, {
    category: 'presentation',
    searchQuery: '',
    sortBy: 'newest',
  });
  assert.equal(presentationFiltered.length, 2);

  const newestFirst = filterAndSortProducts(normalized, {
    category: 'all',
    searchQuery: '',
    sortBy: 'newest',
  });
  assert.equal(newestFirst[0].permalink, 'canva-brand');

  const searched = filterAndSortProducts(normalized, {
    category: 'all',
    searchQuery: 'notebook',
    sortBy: 'newest',
  });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].permalink, 'notebook-pdf');

  const priceAsc = filterAndSortProducts(normalized, {
    category: 'all',
    searchQuery: '',
    sortBy: 'price-asc',
  });
  assert.equal(priceAsc[0].permalink, 'notebook-pdf');
  assert.equal(priceAsc[3].permalink, 'web-starter');
});

test('computePaginationMeta and mergeCatalogPage compare products_total against loaded count', () => {
  const first100: GumroadRawProduct[] = Array.from({ length: 100 }, (_, i) => ({
    id: `p-${i}`,
    name: `Slide Template ${i}`,
    permalink: `slide-template-${i}`,
    published: true,
    shown_on_profile: true,
  }));

  const meta = computePaginationMeta(
    { products: first100, products_total: 101 },
    100,
    100,
    true
  );
  assert.equal(meta.hasMore, true);
  assert.equal(meta.totalCount, 101);
  assert.equal(meta.nextOffset, 100);

  const initialState = {
    rawProducts: first100,
    pricesMap: { 'slide-template-0': { formatted_price: '$12' } },
    products: normalizeGumroadProducts(
      first100,
      { 'slide-template-0': { formatted_price: '$12' } },
      'https://farazkayan.gumroad.com'
    ),
    profileUrl: 'https://farazkayan.gumroad.com',
    twitterUrl: null,
    hasMore: true,
    nextOffset: 100,
    totalCount: 101,
    hasInjectedData: true,
  };

  const nextBatch: GumroadRawProduct[] = [
    {
      id: 'p-100',
      name: 'Slide Template 100',
      permalink: 'slide-template-100',
      published: true,
      shown_on_profile: true,
    },
  ];

  const merged = mergeCatalogPage(
    initialState,
    {
      products: nextBatch,
      prices: { 'slide-template-100': { formatted_price: '$15' } },
      products_total: 101,
    },
    100
  );

  assert.equal(merged.products.length, 101);
  assert.equal(merged.products[100].price.displayPrice, '$15');
  assert.equal(merged.hasMore, false);
});

test('safeJsonParse handles invalid or empty JSON safely', () => {
  assert.equal(safeJsonParse(''), null);
  assert.equal(safeJsonParse('{bad json'), null);
  assert.deepEqual(safeJsonParse('{"products":[]}'), { products: [] });
});

test('theme helpers resolve stored preference and toggle cleanly', () => {
  assert.equal(resolveInitialTheme('dark', false), 'dark');
  assert.equal(resolveInitialTheme('light', true), 'light');
  assert.equal(resolveInitialTheme(null, true), 'dark');
  assert.equal(toggleThemeValue('light'), 'dark');
  assert.equal(toggleThemeValue('dark'), 'light');
});

test('NAV_PAGES routes Shop to /#shop across all pages', () => {
  const shopNav = NAV_PAGES.find((item) => item.id === 'shop');
  assert.ok(shopNav);
  assert.equal(shopNav.href, '/#shop');
});

test('normalizeGumroadProducts handles live Gumroad payload without permalink/id/published and localized boolean prices', () => {
  const liveRawProducts: GumroadRawProduct[] = [
    {
      name: 'The Project Kit ✳',
      url: 'https://farazkayan.gumroad.com/l/the-project-kit',
      price: '$3.99+',
      thumbnail_url: 'https://public-files.gumroad.com/lvrr7rzane096u93ib20aadlmrxi',
      cover_url: 'https://public-files.gumroad.com/7qbcsny3qr82ejeydhte8ff5fghe',
      description: 'Turn your idea into a presentation worth remembering.',
    },
    {
      name: 'Protocol Relative Asset',
      url: 'https://farazkayan.gumroad.com/l/proto-asset',
      thumbnail_url: '//public-files.gumroad.com/proto-thumb.jpg',
      summary: '',
      description: 'Fallback description when summary is empty.',
    },
  ];

  const livePricesMap: GumroadPricesMap = {
    'the-project-kit': {
      price: 'SGD$5.14+',
      price_cents: 514,
      currency_code: 'sgd',
      localized: true,
    },
  };

  assert.equal(extractPermalink(liveRawProducts[0]), 'the-project-kit');

  const normalized = normalizeGumroadProducts(
    liveRawProducts,
    livePricesMap,
    'https://farazkayan.gumroad.com'
  );

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].permalink, 'the-project-kit');
  assert.equal(normalized[0].id, 'the-project-kit');
  assert.equal(normalized[0].title, 'The Project Kit ✳');
  assert.equal(
    normalized[0].productUrl,
    'https://farazkayan.gumroad.com/l/the-project-kit'
  );
  assert.equal(
    normalized[0].imageUrl,
    'https://public-files.gumroad.com/lvrr7rzane096u93ib20aadlmrxi'
  );
  assert.equal(normalized[0].price.displayPrice, 'SGD$5.14+');
  assert.equal(normalized[0].price.numericSortCents, 514);
  // Live Gumroad product without category or tags must NOT receive an inferred/invented classification
  assert.equal(normalized[0].categoryId, null);
  assert.equal(normalized[0].categoryLabel, null);
  assert.deepEqual(normalized[0].categories, []);

  assert.equal(
    normalized[1].imageUrl,
    'https://public-files.gumroad.com/proto-thumb.jpg'
  );
  assert.equal(
    normalized[1].description,
    'Fallback description when summary is empty.'
  );
});

test('mergeCatalogPage supports camelCase productsTotal, aborts on success:false, and deduplicates duplicate deliveries', () => {
  const initialRaw: GumroadRawProduct[] = [
    {
      name: 'Item One',
      url: 'https://farazkayan.gumroad.com/l/item-one',
    },
  ];
  const initialState = {
    rawProducts: initialRaw,
    pricesMap: { 'item-one': { price: '$5', price_cents: 500 } },
    products: normalizeGumroadProducts(
      initialRaw,
      { 'item-one': { price: '$5', price_cents: 500 } },
      'https://farazkayan.gumroad.com'
    ),
    profileUrl: 'https://farazkayan.gumroad.com',
    twitterUrl: null,
    hasMore: true,
    nextOffset: 1,
    totalCount: 2,
    hasInjectedData: true,
  };

  // Failure payload must leave current catalog unchanged
  const failedMerge = mergeCatalogPage(
    initialState,
    { success: false, products: [] },
    1
  );
  assert.equal(failedMerge, initialState);

  // CamelCase productsTotal + new item
  const nextPage = {
    success: true,
    requestId: 'req-2',
    products: [
      {
        name: 'Item Two',
        url: 'https://farazkayan.gumroad.com/l/item-two',
      },
    ],
    prices: {
      'item-two': { price: '$9', price_cents: 900, localized: true },
    },
    productsTotal: 2,
  };

  const mergedOnce = mergeCatalogPage(initialState, nextPage, 1);
  assert.equal(mergedOnce.products.length, 2);
  assert.equal(mergedOnce.nextOffset, 2);
  assert.equal(mergedOnce.hasMore, false);
  assert.equal(mergedOnce.totalCount, 2);
  assert.equal(mergedOnce.products[1].price.displayPrice, '$9');

  // Re-merging identical items does not duplicate or advance nextOffset
  const mergedDuplicate = mergeCatalogPage(mergedOnce, nextPage, 1);
  assert.equal(mergedDuplicate.products.length, 2);
  assert.equal(mergedDuplicate.nextOffset, 2);
});
