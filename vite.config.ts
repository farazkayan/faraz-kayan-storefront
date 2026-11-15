import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const PAGE_REWRITES: Record<string, string> = {
  '/': '/src/entries/profile.html',
  '/index.html': '/src/entries/profile.html',
  '/profile': '/src/entries/profile.html',
  '/profile.html': '/src/entries/profile.html',
  '/about': '/src/entries/about.html',
  '/about.html': '/src/entries/about.html',
  '/faq': '/src/entries/faq.html',
  '/faq.html': '/src/entries/faq.html',
};

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'gumroad-multipage-dev-routes',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url) {
              const [pathname, query] = req.url.split('?');
              const cleanPath =
                pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
              const target = PAGE_REWRITES[cleanPath];
              if (target) {
                req.url = query ? `${target}?${query}` : target;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
