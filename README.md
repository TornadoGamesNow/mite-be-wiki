# MITE: Break Everything Wiki

Source repository for the public trilingual wiki of **MITE: Break Everything**.

Live site:
[tornadogamesnow.github.io/mite-be-wiki](https://tornadogamesnow.github.io/mite-be-wiki)

The project is built with Astro and React and publishes a static site to GitHub Pages. The wiki covers progression, mechanics, recipes, mobs, reference tables, and installation help for the current public mod versions.

## Languages

- Hungarian
- English
- Russian

## Main pages

- `/` — main wiki and progression hub
- `/recipes` — recipe browser
- `/mobs` — mob encyclopedia
- `/brewing` — potions, cauldrons, and related systems
- `/reference` — materials, tables, and quick-reference data
- `/faq` — common questions and troubleshooting
- `/install` — setup and install guide
- `/changelog` — wiki-side patch notes

## Local development

Requirements:

- Node.js
- npm

Install and run:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run preview
```

There is no dedicated automated test suite in this repo. A clean `npm run build` is the main verification step.

## Project structure

```text
src/
  components/   Astro components
  islands/      React islands for interactive UI
  layouts/      shared page layouts
  pages/        Astro routes
  data/         page-local structured content
  i18n/         language helpers
  styles/       global styling

data/
  JSON source data used by recipe, mob, material, and mechanics views

public/
  img/          static textures and icons
  data/         generated or manually maintained browser-facing data files

scripts/
  local helper scripts and extracted item-doc inputs used during research
```

## Content sources

The wiki is maintained from a mix of:

- hand-written gameplay guides
- structured repo data in `data/`
- local extracted mod documentation under `scripts/`
- in-repo fact-checking against current mod assets and reference files

Because the game changes and some upstream docs are inconsistent, issues and corrections are still valuable.

## Contributing

If you find an error, open an issue or submit a PR:

- [Issues](https://github.com/TornadoGamesNow/mite-be-wiki/issues)
- [Contributing guide](CONTRIBUTING.md)

When changing gameplay facts, prefer updating the relevant page text and the supporting data source together.

## Community

- Discord: [discord.gg/7myyGAXJ6v](https://discord.gg/7myyGAXJ6v)
- Reddit: [r/MITE](https://reddit.com/r/MITE)

## License

Wiki content © 2026 TornadoGamesNow — licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

This is an unofficial, community-driven wiki. MITE:BE and related game assets, textures, and trademarks belong to their respective original creators.
