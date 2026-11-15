import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TMP_BASE_DIR = path.join(DIST_DIR, '_tmp');

const PAGES = ['profile', 'about', 'faq'];

const PAGE_PARITY_MARKERS = {
  common: [
    '/#shop',
    'data-gumroad-follow',
    'data-gumroad-follow-message',
    '#FFF7E8',
    '#4169E1',
    'farazkayan-theme',
  ],
  profile: [
    'Start with an idea.',
    'brilliant.',
    'EXPLORE THE SHOP',
    '/#shop',
    'THE CREATIVE POSTBOX',
    'KEEP ME IN THE LOOP',
    'gumroad-data',
    'gumroad-prices',
    'gumroadProducts',
  ],
  about: ['Independent digital products, crafted for everyday clarity.'],
  faq: ['Frequently asked questions.'],
};

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(fullPath)));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function escapeInlineScript(jsCode) {
  return jsCode.replace(/<\/(script)/gi, '<\\/$1');
}

function escapeInlineStyle(cssCode) {
  return cssCode.replace(/<\/(style)/gi, '<\\/$1');
}

function sha256Short(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
}

function auditStandaloneHtml(pageName, html) {
  const issues = [];

  if (!html.includes('<div id="root"></div>')) {
    issues.push('Missing #root mount container.');
  }
  if (!html.includes('<style>') || !html.includes('<script type="module">')) {
    issues.push('Missing inlined <style> or <script type="module">.');
  }
  if (/\/assets\/|\/src\/assets\/|\/src\/entries\//.test(html)) {
    issues.push('Contains unresolved local /assets/ or /src/ paths.');
  }
  if (/<script\b[^>]*\bsrc\s*=/i.test(html)) {
    issues.push('Contains external <script src=...> tag.');
  }
  if (/<link\b[^>]*\brel=["']stylesheet["'][^>]*href=["']\/[^"']*["']/i.test(html)) {
    issues.push('Contains local stylesheet <link> tag.');
  }
  if (/\beval\s*\(|document\.write\s*\(/i.test(html)) {
    issues.push('Contains forbidden eval() or document.write() call.');
  }
  if (/["']\/licensing["']/.test(html)) {
    issues.push('Contains deprecated /licensing navigation reference.');
  }
  if (/\/shop\?product=/i.test(html)) {
    issues.push('Contains deprecated /shop?product= product routing.');
  }
  if (/["']\/shop(?:\.html)?["']/i.test(html)) {
    issues.push('Contains deprecated standalone /shop navigation reference.');
  }

  const requiredMarkers = [
    ...PAGE_PARITY_MARKERS.common,
    ...(PAGE_PARITY_MARKERS[pageName] ?? []),
  ];
  for (const marker of requiredMarkers) {
    if (!html.includes(marker)) {
      issues.push(`Missing expected parity marker: "${marker}".`);
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `Standalone HTML audit failed for ${pageName}.html:\n- ${issues.join('\n- ')}`
    );
  }
}

async function buildSinglePage(pageName) {
  const entryHtml = path.join(ROOT_DIR, 'src', 'entries', `${pageName}.html`);
  const tmpOutDir = path.join(TMP_BASE_DIR, pageName);

  await fs.rm(tmpOutDir, { recursive: true, force: true });

  await build({
    configFile: false,
    root: ROOT_DIR,
    logLevel: 'silent',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': ROOT_DIR,
      },
    },
    build: {
      outDir: tmpOutDir,
      emptyOutDir: true,
      assetsInlineLimit: 100000,
      cssCodeSplit: false,
      modulePreload: false,
      rollupOptions: {
        input: entryHtml,
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });

  const allFiles = await walkFiles(tmpOutDir);
  const builtHtmlPath = allFiles.find((f) => f.endsWith(`${pageName}.html`));
  if (!builtHtmlPath) {
    throw new Error(`Built HTML not found for ${pageName}`);
  }

  const cssFiles = allFiles.filter((f) => f.endsWith('.css')).sort();
  const jsFiles = allFiles.filter((f) => f.endsWith('.js')).sort();

  const cssBundle = (
    await Promise.all(cssFiles.map((file) => fs.readFile(file, 'utf8')))
  ).join('\n');
  const jsBundle = (
    await Promise.all(jsFiles.map((file) => fs.readFile(file, 'utf8')))
  ).join('\n');

  let html = await fs.readFile(builtHtmlPath, 'utf8');

  // Remove Vite-emitted external module script, modulepreload, and local stylesheet links
  html = html.replace(
    /\s*<script\b[^>]*type=["']module["'][^>]*\bsrc=["'][^"']+["'][^>]*><\/script>/gi,
    ''
  );
  html = html.replace(
    /\s*<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi,
    ''
  );
  html = html.replace(
    /\s*<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']\/assets\/[^"']+["'][^>]*>/gi,
    ''
  );

  if (cssBundle.trim().length > 0) {
    const styleTag = `    <style>${escapeInlineStyle(cssBundle)}</style>\n`;
    html = html.replace('</head>', () => `${styleTag}  </head>`);
  }

  if (jsBundle.trim().length > 0) {
    const scriptTag = `    <script type="module">${escapeInlineScript(jsBundle)}</script>\n`;
    html = html.replace('</body>', () => `${scriptTag}  </body>`);
  }

  auditStandaloneHtml(pageName, html);

  const distOutputPath = path.join(DIST_DIR, `${pageName}.html`);
  const rootOutputPath = path.join(ROOT_DIR, `${pageName}.html`);

  await fs.writeFile(distOutputPath, html, 'utf8');
  await fs.writeFile(rootOutputPath, html, 'utf8');

  if (pageName === 'profile') {
    await fs.writeFile(path.join(DIST_DIR, 'index.html'), html, 'utf8');
  }
}

async function verifySynchronizedExports() {
  const summaries = [];

  for (const pageName of PAGES) {
    const rootPath = path.join(ROOT_DIR, `${pageName}.html`);
    const distPath = path.join(DIST_DIR, `${pageName}.html`);

    const [rootBuf, distBuf, rootStat] = await Promise.all([
      fs.readFile(rootPath),
      fs.readFile(distPath),
      fs.stat(rootPath),
    ]);

    if (Buffer.compare(rootBuf, distBuf) !== 0) {
      throw new Error(
        `Export drift detected for ${pageName}.html: project root (${rootBuf.length} B) does not match dist/${pageName}.html (${distBuf.length} B). Run "npm run build" to regenerate.`
      );
    }

    if (pageName === 'profile') {
      const distIndexBuf = await fs.readFile(path.join(DIST_DIR, 'index.html'));
      if (Buffer.compare(distBuf, distIndexBuf) !== 0) {
        throw new Error(
          'Export drift detected: dist/index.html does not match dist/profile.html.'
        );
      }
    }

    auditStandaloneHtml(pageName, rootBuf.toString('utf8'));

    summaries.push({
      file: `${pageName}.html`,
      sizeKb: (rootBuf.length / 1024).toFixed(1),
      hash: sha256Short(rootBuf),
      mtime: rootStat.mtime.toISOString(),
    });
  }

  console.log('\nSynchronized Gumroad Standalone Exports (root === dist):');
  for (const item of summaries) {
    console.log(
      `  ✓ ${item.file.padEnd(13)} ${item.sizeKb.padStart(6)} kB  sha256:${item.hash}  mtime:${item.mtime}`
    );
  }
}

async function main() {
  const verifyOnly = process.argv.includes('--verify-only');

  if (!verifyOnly) {
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });

    for (const page of PAGES) {
      await buildSinglePage(page);
    }

    await fs.rm(TMP_BASE_DIR, { recursive: true, force: true });
  }

  await verifySynchronizedExports();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
