# MITE: Break Everything — Wiki & Progression Guide

The first public wiki for **MITE: Break Everything** — a hardcore total-conversion Minecraft 1.6.4 mod.

🌐 **Live site:** [tornadogamesnow.github.io/mite-be-wiki](https://tornadogamesnow.github.io/mite-be-wiki)

---

## Download & Install

| | Link | Megjegyzés |
|---|---|---|
| 🌍 **Nyugati tükör** | [Archive.org — MITE:BE v0.9.0 hf3](https://archive.org/download/mi-te-be-v-0.9.0-hf-3/MiTE-BE_v0.9.0_hf3.zip) | Közvetlen ZIP, regisztráció nélkül |
| 🇨🇳 **Hivatalos forrás** | [mcmod.cn/class/3751.html](https://www.mcmod.cn/class/3751.html) | Baidu Pan szükséges |

**Requirements:** Java 8 + [PrismLauncher](https://prismlauncher.org)
**How to install:** Import the downloaded ZIP directly in PrismLauncher → [Full guide](https://tornadogamesnow.github.io/mite-be-wiki/install.html)

---

## What's inside the wiki

- 🇭🇺 / 🇬🇧 Bilingual — Magyar & English
- Full progression guide — Early game → Mid game → Endgame checklists
- Biome guide, biome portals, ore distribution by biome
- Crafting recipes with visual grids (Copper through Adamantium, Hardstone, Ancient Metal)
- Weapon, armor & enchanting reference tables
- Ore processing: sieving, smelting, alloys, workbench tiers, furnace cores
- Professions, XP requirements, item quality tiers
- Mob stats, squad system, bow & arrow system
- Food values, stack limits, thirst, drowsiness, moon cycle, defecation
- World Marker, Partner NPCs, Portage, debug keys
- End dimension guide, boss information

## Pages

| Page | Content |
|------|---------|
| [index.html](https://tornadogamesnow.github.io/mite-be-wiki/) | Main wiki — progression, mechanics, crafting grids |
| [reference.html](https://tornadogamesnow.github.io/mite-be-wiki/reference.html) | Reference tables — mobs, potions, blood moon, professions |
| [install.html](https://tornadogamesnow.github.io/mite-be-wiki/install.html) | Installation guide |
| [changelog.html](https://tornadogamesnow.github.io/mite-be-wiki/changelog.html) | Patch notes |
| [faq.html](https://tornadogamesnow.github.io/mite-be-wiki/faq.html) | Frequently asked questions |

---

## Tech

**Astro + React + Tailwind** — statikus site generátor, GitHub Pages-re deployolva.

```
src/pages/        — Astro oldalak (index, mobs, recipes, brewing, reference, install, changelog, faq)
src/components/   — Astro komponensek (CraftingGrid, FurnaceGrid, McTooltip, stb.)
src/islands/      — React islands (MobExplorer, RecipeBrowser, SearchBox, stb.)
src/layouts/      — BaseLayout.astro
data/             — JSON adatfájlok (items.json, mobs.json, recipes.json, materials.json)
public/           — Statikus fájlok (img/, js/app.js, data/mobs.js, data/materials.js)
```

Build: `npm run build` → `dist/` (ez kerül deploy-ra)

---

## Community

- **Discord:** [discord.gg/7myyGAXJ6v](https://discord.gg/7myyGAXJ6v)
- **Reddit:** [r/MITE](https://reddit.com/r/MITE)

---

## Contributing

Found an error or missing info? [Open an Issue](https://github.com/TornadoGamesNow/mite-be-wiki/issues) or see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

Wiki content © 2026 TornadoGamesNow — licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

> **Disclaimer:** This is an unofficial, community-driven wiki. MITE:BE and all related game assets, textures, and trademarks belong to their respective original creators.
