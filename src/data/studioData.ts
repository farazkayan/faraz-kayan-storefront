export type PageSlug = 'home' | 'shop' | 'about' | 'faq';

export interface StudioDiscipline {
  id: string;
  index: string;
  title: string;
  description: string;
}

export interface PhilosophyPoint {
  index: string;
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqGroup {
  id: string;
  title: string;
  items: readonly FaqItem[];
}

export const NAV_PAGES: ReadonlyArray<{
  id: PageSlug;
  label: string;
  href: string;
}> = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'shop', label: 'Shop', href: '/#shop' },
  { id: 'about', label: 'About', href: '/about' },
  { id: 'faq', label: 'FAQ', href: '/faq' },
];

/**
 * Brand & Editorial Copy
 * All storefront products live on the Gumroad profile homepage (/#shop) and come
 * dynamically from Gumroad's #gumroad-data, #gumroad-prices, and window.gumroadProducts.request().
 */
export const STUDIO_PROFILE = {
  brandWordmark: 'faraz kayan',
  handle: '@farazkayan',
  founderName: 'Faraz Kayan Haque',
  gumroadProfileUrl: 'https://farazkayan.gumroad.com',
  personalWebsiteUrl: 'https://farazkh.dev',
  heroEyebrow: 'Independent Design Studio · @farazkayan',
  heroHeadlineLead: 'Tools for clearer',
  heroHeadlineEmphasis: 'visual thinking.',
  heroSubheadline:
    'Independent digital templates, presentation systems, and modular design assets built for creators, students, and studios working across disciplines.',
  philosophyPullQuote:
    'Good design systems disappear behind the clarity of your ideas.',
  philosophyStatements: [
    {
      index: '01',
      title: 'Structural typography first',
      description:
        'Every slide deck, editorial layout, and web starter begins with measured hierarchy, calibrated margins, and disciplined typographic rhythm.',
    },
    {
      index: '02',
      title: 'Built for real adaptation',
      description:
        'Files are organized with clean master frames and predictable grid rules so you can replace copy and visuals without breaking proportions.',
    },
    {
      index: '03',
      title: 'International digital delivery',
      description:
        'Released directly through Gumroad with straightforward file organization and instant worldwide access upon release.',
    },
  ] as readonly PhilosophyPoint[],
  aboutParagraphs: [
    'Faraz Kayan Haque is an independent digital designer and student creator building practical, typographically disciplined templates and visual resources.',
    'The studio focuses on structured presentation decks, adaptable Canva layouts, and modern web design assets—organized so creators, students, and small teams can publish clearly without starting from scratch.',
  ],
  aboutOfferings: [
    {
      index: '01',
      title: 'Practical structure',
      description:
        'Templates built around clear grids, balanced spacing, and reusable master layouts that hold up under real content.',
    },
    {
      index: '02',
      title: 'Disciplined typography',
      description:
        'Intentional type hierarchy and restrained visual styling that keeps focus on your message rather than decorative clutter.',
    },
    {
      index: '03',
      title: 'Direct digital delivery',
      description:
        'Every release is hosted and delivered directly through Gumroad with straightforward documentation and file organization.',
    },
  ] as readonly PhilosophyPoint[],
  copyrightNotice: '© 2026 Faraz Kayan Haque. All rights reserved.',
} as const;

export const STUDIO_DISCIPLINES: readonly StudioDiscipline[] = [
  {
    id: 'presentations',
    index: '01',
    title: 'Presentations & Decks',
    description:
      'Structured PowerPoint, Keynote, and Google Slides systems paced for pitches, academic reviews, and studio decks.',
  },
  {
    id: 'canva',
    index: '02',
    title: 'Canva Systems',
    description:
      'Modular social carousels, lookbooks, and editorial brand templates built for fast customization in Canva.',
  },
  {
    id: 'web-assets',
    index: '03',
    title: 'Web & UI Assets',
    description:
      'Minimal website starter layouts, portfolio templates, and interface design assets for clean digital publishing.',
  },
] as const;

/**
 * Editable FAQ Groups
 * Policy-specific details remain clearly marked placeholders without inventing policies.
 */
export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    id: 'downloads-access',
    title: 'Digital downloads & access',
    items: [
      {
        id: 'receive-files',
        question: 'How do I receive and download my files after purchasing?',
        answer:
          'Checkout and file delivery are handled directly by Gumroad. Once your order is completed on the product page, you receive an immediate download link and an email receipt with ongoing access in your Gumroad Library.',
      },
      {
        id: 'future-updates',
        question: 'How do product updates work?',
        answer:
          'When updated files are uploaded to an existing Gumroad product, buyers with access in their Gumroad Library can download the latest version from their receipt link or Gumroad account.',
      },
    ],
  },
  {
    id: 'compatibility-editing',
    title: 'Compatibility & editing',
    items: [
      {
        id: 'software-needed',
        question: 'What software or tools are required to edit these templates?',
        answer:
          'Each Gumroad product page lists the exact file formats and compatible tools (such as PowerPoint, Keynote, Google Slides, Canva, or Figma) before you purchase.',
      },
      {
        id: 'customization',
        question: 'Can colors, fonts, and layouts be customized?',
        answer:
          'Templates are structured with editable text styles, master layouts, or organized layers so you can adapt typography, color palettes, and imagery to fit your own project.',
      },
    ],
  },
  {
    id: 'support-policies',
    title: 'Support & store policies',
    items: [
      {
        id: 'usage-rights',
        question: 'Where can I check product usage notes?',
        answer:
          'Always check the individual Gumroad product listing for any product-specific details or usage notes included with a release.',
      },
      {
        id: 'support-refunds',
        question: 'What are the support and refund terms?',
        answer:
          '[Editable placeholder] Add your preferred support contact channel, response expectations, and refund terms here once finalized. Until specified, refer to the terms shown on each Gumroad product page.',
      },
    ],
  },
] as const;
