import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://tornadogamesnow.github.io',
  base: '/mite-be-wiki',
  integrations: [
    react(),
    tailwind(),
  ],
  build: {
    assets: '_assets',
  },
});
