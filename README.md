# MITE: Break Everything — Wiki

The first public bilingual wiki for **MITE: Break Everything** — a hardcore total-conversion Minecraft 1.6.4 mod.

🌐 **Live site:** [tornadogamesnow.github.io/mite-be-wiki](https://tornadogamesnow.github.io/mite-be-wiki)

> ⚠️ This wiki is a work in progress — some data may be inaccurate or incomplete. Found an error? [Open an Issue!](https://github.com/TornadoGamesNow/mite-be-wiki/issues)

---

## Download & Install

| | Link | Size |
|---|---|---|
| 🇭🇺 **Hungarian version** | [archive.org/details/mite-be-v0.9.0-hungarian](https://archive.org/details/mite-be-v0.9.0-hungarian) | ~266 MB |
| 🇬🇧 **English version** | [archive.org/details/mite-be-v0.9.0-english](https://archive.org/details/mite-be-v0.9.0-english) | ~13 KB |

**Requirements:** Java 8 + [PrismLauncher](https://prismlauncher.org)
**Installation guide:** [tornadogamesnow.github.io/mite-be-wiki/install](https://tornadogamesnow.github.io/mite-be-wiki/install)

---

## What's in the wiki?

| Page | Content |
|------|---------|
| [/](https://tornadogamesnow.github.io/mite-be-wiki/) | Main wiki — progression, mechanics, crafting grids, mob stats |
| [/recipes](https://tornadogamesnow.github.io/mite-be-wiki/recipes) | Full recipe browser — search, filter, tier comparison |
| [/mobs](https://tornadogamesnow.github.io/mite-be-wiki/mobs) | Mob encyclopedia — stats, drops, spawn zones |
| [/brewing](https://tornadogamesnow.github.io/mite-be-wiki/brewing) | Brewing & potions |
| [/reference](https://tornadogamesnow.github.io/mite-be-wiki/reference) | Reference tables — materials, sieve drop rates, furnace heat levels |
| [/install](https://tornadogamesnow.github.io/mite-be-wiki/install) | Installation guide |
| [/changelog](https://tornadogamesnow.github.io/mite-be-wiki/changelog) | Patch notes |
| [/faq](https://tornadogamesnow.github.io/mite-be-wiki/faq) | FAQ |

### Main page topics

- 🇭🇺 / 🇬🇧 Bilingual — Magyar & English
- Full progression guide: Flint Age → Copper/Silver → Iron/Steel → Hardstone → Ancient Metal → Mithril → Adamantium
- Biome guide, 5 portal types, ore distribution
- Visual crafting grids with tooltips and tier badges
- Weapon, armor, and enchanting reference tables
- Ore processing: sieving, smelting, alloys, workbench tiers, multiblock furnaces
- 13 professions, XP requirements, item quality tiers
- Mob stats, squad system, bow & arrow system
- Food values, thirst, drowsiness, moon cycle, defecation mechanic
- World Marker, Partner NPCs, Portage, debug keys
- Underground dimension, Nether, Wither boss, End dimension, Ender Dragon

---

## Tech stack

**Astro + React + Tailwind** — static site generator, deployed to GitHub Pages.

```
src/pages/        — Astro pages (SSG)
  index.astro       — Main wiki (HU+EN bilingual, ~4200+ lines)
  recipes.astro     — Recipe browser page
  mobs.astro        — Mob encyclopedia page
  brewing.astro     — Brewing page
  reference.astro   — Reference tables
  install.astro     — Installation guide
  changelog.astro   — Patch notes
  faq.astro         — FAQ

src/components/   — Astro components (server-side rendered)
  CraftingGrid.astro    — Crafting recipe display (recipeId or recipe prop)
  FurnaceGrid.astro     — Furnace recipe display
  McTooltip.astro       — Minecraft-style tooltip
  TierBadge.astro       — Material tier badge
  InfoBox.astro         — Info/warning box
  CompareTable.astro    — Comparison table
  Header.astro          — Hero header (lang switch + dev notice)
  TopNav.astro          — Top navigation
  Sidebar.astro         — Sidebar (table of contents)

src/islands/      — React "islands" (client-side interactive)
  MobExplorer.tsx       — Mob search/filter (on main page & mobs page)
  RecipeBrowser.tsx     — Recipe browser (recipes.json, tier-merge, cycling slots)
  RecipesHub.tsx        — Full recipe browser (recipes_full.json)
  SearchBox.tsx         — In-page search
  LanguageSwitcher.tsx  — Language switcher
  VersionToggle.tsx     — Version toggle

data/             — JSON data files (SSOT — authoritative source of truth)
  items.json            — Item catalog: id → {name:{hu,en}, img, tier, category}
  mobs.json             — Mob stats: hp, dmg, xp, drops, spawnZones, tags
  recipes.json          — Shaped crafting recipes (CraftingGrid + RecipeBrowser)
  recipes_full.json     — Full recipe database (RecipesHub, generated)
  materials.json        — Material properties: enchantability, maxQuality, durabilityMult, sieve
  mechanics.json        — Game mechanics: furnace heat levels, armor protection, weapon damage

public/
  img/                  — 32×32 PNG textures (armor/, blocks/, items/, mobs/, ingots/, etc.)
  data/
    mobs.js             — Mob table for reference.astro (manually maintained)
    materials.js        — Material tables for reference.astro (manually maintained)
    sieve.js            — Sieve drop rates for reference.astro (manually maintained)

scripts/          — Generator scripts (not run automatically at build time)
  parse_recipes.py      — Recipe JSON generation from mod files
  gen_recipes_full.py   — Regenerate recipes_full.json
  gen_item_stubs.py     — Item stub generation
  scrape-drops.js       — Mob drop scraper
```

### Local development

```bash
npm install
npm run dev      # dev server → localhost:4321
npm run build    # static build → dist/
npm run preview  # preview the build
```

There is no automated test command. A clean `npm run build` means everything is OK.

---

## Community

- **Discord:** [discord.gg/7myyGAXJ6v](https://discord.gg/7myyGAXJ6v)
- **Reddit:** [r/MITE](https://reddit.com/r/MITE)

---

## Contributing

Found an error or missing info? [Open an Issue](https://github.com/TornadoGamesNow/mite-be-wiki/issues) or read [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

Wiki content © 2026 TornadoGamesNow — licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

> **Disclaimer:** This is an unofficial, community-driven wiki. MITE:BE and all related game assets, textures, and trademarks belong to their respective original creators.
