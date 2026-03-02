# Contributing to the MITE:BE Wiki

Thanks for your interest in improving the wiki! Here's how you can help.

## Quick fixes (typos, grammar, wrong numbers)

1. Fork this repo
2. Edit the relevant `.html` file directly — the wiki is plain HTML, no build step needed
3. Open a Pull Request with a short description of what you changed

## Adding new data or sections

- The wiki is **bilingual** (Hungarian + English). Every piece of content needs both languages, using `data-lang="hu"` and `data-lang="en"` attributes.
- Crafting grids use the `craft-table` / `craft-grid` pattern — copy an existing grid as a template.
- Reference data comes from the game's `MITE/reference/` text files inside the mod ZIP.

## What we're looking for

- Corrections to stats, drop rates, or recipe details
- Missing translations (HU or EN)
- New crafting grid visuals for recipes that are currently text-only
- Texture images (`32x32 PNG`, pixelated style) for items/blocks not yet in `img/`

## Guidelines

- Keep it simple — this is a static site, no frameworks or build tools
- Test your changes locally by opening the HTML file in a browser
- One PR per topic keeps reviews fast

## Questions?

Open an [Issue](https://github.com/TornadoGamesNow/mite-be-wiki/issues) or ask on [Discord](https://discord.gg/7myyGAXJ6v).
