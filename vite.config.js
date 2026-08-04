import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

const page = (pathname) => fileURLToPath(new URL(pathname, import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: page('index.html'),
        about: page('about/index.html'),
        contact: page('contact/index.html'),
        privacy: page('privacy/index.html'),
        terms: page('terms/index.html'),
      },
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
