# Faraz Kayan Storefront

*A little creativity. A lot of possibility.*

A custom digital storefront for Faraz Kayan, built with React, TypeScript, and Vite, with Gumroad powering product discovery, product information, and checkout.

[**Visit the Storefront**](https://farazkayan.gumroad.com) · [**GitHub Repository**](https://github.com/farazkayan/faraz-kayan-storefront)

---

## The idea

A good digital product deserves more than a generic listing.

Faraz Kayan is an independent digital product brand focused on creating practical, thoughtfully designed resources. The storefront brings those products together in one place, with a visual identity that feels playful, personal, and handcrafted without sacrificing clarity or usability.

The goal is simple:

**DISCOVER → EXPLORE → CREATE**

The storefront is the presentation layer. Gumroad handles the underlying product catalogue and commerce experience, keeping product management separate from the website's design and implementation.

## At a glance

### ✳ Gumroad-powered catalogue

Display products using the catalogue data supplied by Gumroad, rather than maintaining a separate manually written product database.

### ◉ Metadata-driven classification

Build product category labels and filters from actual Gumroad category and tag metadata. No guessing product types from titles or descriptions.

### ⌘ Custom storefront experience

A responsive React interface with a distinctive editorial layout, playful doodle details, and a warm visual identity.

### ↗ Native product pages

Keep product details and checkout on Gumroad's normal product pages instead of maintaining separate custom landing pages for every product.

### ⌂ Dedicated information pages

Keep the storefront's About and FAQ experiences separate from the main profile homepage.

### ♧ Native Gumroad integration

Use Gumroad's profile catalogue injection and native follow functionality where supported.

---

## The storefront

The homepage is the central storefront experience.

The Shop navigation item takes visitors to the product catalogue section on the homepage, rather than maintaining a separate standalone shop document.

| Page | Purpose |
| --- | --- |
| Profile / Home | Brand introduction, product catalogue, and newsletter/follow section |
| About | Brand background and philosophy |
| FAQ | Answers to common product and purchasing questions |
| Product pages | Individual products and checkout, handled by Gumroad |

This structure follows an important platform constraint: Gumroad provides its injected profile catalogue on the profile page, not automatically on separate standalone pages.

Keeping the catalogue on the profile homepage allows the storefront to use Gumroad's native data integration rather than building an unsupported catalogue bridge.

## How the catalogue works

Gumroad remains the source of truth for product information.

The profile page receives catalogue data through Gumroad's injected `gumroad-data` element. The storefront reads that data and uses it to render the product experience.

The intended data flow:

```text
       Gumroad Dashboard
              │
              ▼
       Published Products
              │
              ▼
    Gumroad Profile Catalogue
              │
              ▼
         gumroad-data
              │
              ▼
       Catalogue Utilities
              │
       ┌──────┴──────┐
       ▼             ▼
  Product Cards   Classifications
       │             │
       └──────┬──────┘
              ▼
       Storefront UI
              │
              ▼
       Gumroad Product Page
              │
              ▼
           Checkout
```

### Product classification

Product classification is based exclusively on explicit Gumroad metadata.

The catalogue extraction logic reads supported taxonomy fields, including:

- `category`
- `category_name`
- `categories`
- `tags`

Values are normalized into readable labels, and duplicates are removed.

For example:

| Gumroad metadata | Display label |
| --- | --- |
| `presentation` | Presentation |
| `social-media` | Social Media |
| `canva` | Canva |

These are illustrative examples, not manually assigned product categories.

The storefront does not infer product types from a product's title or description.

When a product has no relevant category or tags, it is displayed without an invented category badge. Category filters are hidden when there are no available classifications.

### Dynamic filtering

Filter tabs are generated from the classifications available in the loaded catalogue.

This means the storefront does not need a manually maintained list of product categories.

When Gumroad metadata changes, the classification logic can reflect those changes from the updated catalogue data without editing product-specific source code.

---

## Design philosophy

The visual identity is intentionally playful and handcrafted.

The aim is to create something that feels like a small independent creative studio rather than a conventional corporate storefront.

Design principles:

- **Warmth:** Soft, paper-inspired backgrounds and comfortable contrast.
- **Personality:** Doodle motifs and small visual details that give the site character.
- **Clarity:** Strong typography, clear hierarchy, and readable product information.
- **Restraint:** Decorative elements support the content rather than compete with it.
- **Consistency:** Shared components keep the visual language consistent across pages.

### Visual direction

| Element | Direction |
| --- | --- |
| Background | Warm paper / ivory |
| Accent | Cobalt blue |
| Typography | Editorial and approachable |
| Decoration | Handcrafted doodle motifs |
| Layout | Clean, responsive, and spacious |
| Interaction | Subtle motion and clear navigation |

---

## Architecture

The project separates the React application, page entry points, reusable components, catalogue logic, and generated Gumroad exports.

### Application layer

React handles the interface and page composition.

Each page has a dedicated entry point, while reusable components provide shared navigation, footer, layout, product presentation, and visual elements.

### Catalogue layer

Catalogue utilities are responsible for reading Gumroad data, normalizing product information, extracting classifications, and preparing data for the interface.

### Export layer

The custom build script creates standalone HTML exports for Gumroad.

It bundles the required JavaScript and CSS into each page so the published pages do not depend on external local asset paths.

The build also audits required integration markers and verifies that the exported HTML files remain synchronized.

### Publishing layer

Gumroad hosts the public storefront pages and handles product-specific commerce.

The Gumroad CLI publishes the generated standalone HTML pages.

---

## Technology

| Area | Technology |
| --- | --- |
| UI framework | React 19 |
| Application language | TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Styling integration | `@tailwindcss/vite` |
| Icons | Lucide React |
| Motion | Motion |
| Commerce | Gumroad |
| Publishing | Gumroad CLI |
| Testing | TypeScript, `tsx` test runner |
| Runtime | Node.js |

---

## Get started

### Requirements

- Node.js compatible with the project's Vite version
- npm
- Git
- Gumroad CLI (only required for publishing)
- Access to the Gumroad account that owns the storefront

The project has been developed and tested with Node.js 26.13.0 and npm 11.20.0.

### 1. Clone the repository

```bash
git clone https://github.com/farazkayan/faraz-kayan-storefront.git
cd faraz-kayan-storefront
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 4. Build the standalone pages

```bash
npm run build
```

The build script generates the synchronized Gumroad HTML exports and places build output in `dist/`.

**Important:** The build regenerates the root-level `profile.html`, `about.html`, and `faq.html` files. Make source changes in `src/`, not in generated exports.

---

## Test it properly

A successful build is not enough. The storefront should also be checked against the actual catalogue integration.

### Development checks

Run these commands from the repository root.

**Type-check:**

```bash
npm run lint
```

**Unit tests:**

```bash
npm test
```

**Verify synchronized exports:**

```bash
npm run verify:sync
```

**Full build:**

```bash
npm run build
```

### Catalogue validation

Verify the following against the actual published Gumroad profile:

1. The homepage receives the real Gumroad catalogue.
2. Published products appear with their actual product information.
3. Product classifications come from explicit Gumroad metadata.
4. Products without classifications do not receive fabricated labels.
5. Category filters reflect the classifications actually available.
6. Product cards lead to the appropriate Gumroad product pages.
7. Catalogue failures do not result in fabricated product listings.

---

## Publishing to Gumroad

The build must succeed before publishing.

Build the pages:

```bash
npm run build
```

Publish the profile homepage:

```bash
gumroad pages push profile ./profile.html
```

Publish About:

```bash
gumroad pages push about ./about.html
```

Publish FAQ:

```bash
gumroad pages push faq ./faq.html
```

The homepage, About, and FAQ are published independently.

Product pages and checkout remain managed by Gumroad. Custom HTML product landing pages are not part of the default publishing workflow.

---

## Repository structure

```text
faraz-kayan-storefront/
│
├── scripts/
│   └── build-pages.mjs
│
├── src/
│   ├── assets/
│   │   └── images/
│   │
│   ├── components/
│   │   └── ui/
│   │
│   ├── data/
│   │
│   ├── entries/
│   │   ├── profile.html
│   │   ├── profile.tsx
│   │   ├── about.html
│   │   ├── about.tsx
│   │   ├── faq.html
│   │   └── faq.tsx
│   │
│   ├── pages/
│   │
│   └── utils/
│       ├── catalog.ts
│       ├── catalogueBridge.ts
│       ├── gumroad.ts
│       └── theme.ts
│
├── about.html
├── faq.html
├── profile.html
├── index.html
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
```

Generated files, installed dependencies, and temporary AI Studio artifacts are excluded from version control through `.gitignore`.

---

## Development principles

The storefront follows a few important architectural rules:

1. **Gumroad owns product data.** Do not introduce a separate manually maintained catalogue.
2. **No inferred classifications.** Product categories must come from explicit Gumroad metadata.
3. **No fabricated products.** Loading and error states must remain honest.
4. **Reusable components first.** Shared interface elements should have one implementation.
5. **Source before exports.** Update React and TypeScript source files, then regenerate the standalone HTML.
6. **Native commerce.** Gumroad remains responsible for product pages and checkout.
7. **Preserve the design system.** New features should respect the established playful, handcrafted identity.

## Project status

The storefront is an actively developed project.

The core experience includes a custom profile homepage, Gumroad catalogue integration, metadata-driven product classification, standalone About and FAQ pages, and a standalone HTML publishing workflow.

Further development should prioritize reliable catalogue behavior, accessibility, responsive presentation, and a consistent purchasing experience.

---

## Creator

**Faraz Kayan**

Independent student builder based in Dhaka, Bangladesh.

Building digital products, creative tools, and small independent projects.

- GitHub: [@farazkayan](https://github.com/farazkayan)
- Storefront: [farazkayan.gumroad.com](https://farazkayan.gumroad.com)
- Portfolio: [farazkh.dev](https://farazkh.dev)

---

**Faraz Kayan**

*Made with curiosity and a little bit of doodling.*
