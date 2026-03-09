import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://tornadogamesnow.github.io',
  base: '/mite-be-wiki',
  integrations: [
    react(),
    tailwind(),
    pagefind(),
  ],
  build: {
    assets: '_assets',
  },
});
