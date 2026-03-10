import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import pagefind from 'astro-pagefind';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function syncItemsSlim() {
  const itemsPath = path.join(__dirname, 'data', 'items.json');
  const aliasesPath = path.join(__dirname, 'data', 'item_aliases.json');
  const slimPath = path.join(__dirname, 'public', 'data', 'items_slim.js');
  const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
  const aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf-8'));
  const slimPayload =
    `window.MITE_ITEM_ALIASES = ${JSON.stringify(aliases, null, 0)};\n` +
    `window.MITE_ITEMS = ${JSON.stringify(items, null, 0)};\n`;
  if (!fs.existsSync(slimPath) || fs.readFileSync(slimPath, 'utf-8') !== slimPayload) {
    fs.writeFileSync(slimPath, slimPayload, 'utf-8');
  }
}

syncItemsSlim();

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
