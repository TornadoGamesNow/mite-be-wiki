# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # fejlesztői szerver (localhost:4321)
npm run build    # statikus build → dist/
npm run preview  # build előnézet
```

Nincs tesztelési parancs. Lokális ellenőrzés: `npm run build` (ha hibátlanul buildel, OK).

## Architecture

**Astro + React + Tailwind** statikus wiki. Deploy: GitHub Pages (`/mite-be-wiki` base path).

### Oldalstruktúra

`src/pages/` — Astro oldalak (SSG): `index`, `mobs`, `recipes`, `brewing`, `reference`, `install`, `changelog`, `faq`

`src/layouts/BaseLayout.astro` — közös HTML shell (FOUC-prevention, progress bar, back-to-top)

`src/components/` — pure Astro komponensek (server-side render):
- `CraftingGrid.astro` / `FurnaceGrid.astro` — recept megjelenítők
- `McTooltip.astro`, `TierBadge.astro`, `InfoBox.astro`, `CompareTable.astro`
- `Header.astro`, `TopNav.astro`, `Sidebar.astro`

`src/islands/` — React "islands" (client-side interaktív):
- `MobExplorer.tsx` — mob kereső/szűrő
- `RecipeBrowser.tsx` / `RecipesHub.tsx` — recept böngésző
- `SearchBox.tsx`, `LanguageSwitcher.tsx`, `VersionToggle.tsx`

### Adat-réteg

Minden adat `data/` mappában JSON/JS formátumban:

| Fájl | Tartalom | Használja |
|------|----------|-----------|
| `data/items.json` | Item katalógus — `id → {name:{hu,en}, img, tier}` | `CraftingGrid.astro`, `MobExplorer.tsx` |
| `data/mobs.json` | Mob statisztikák — hp, dmg, xp, drops, spawnZones | `MobExplorer.tsx` |
| `data/recipes.json` | Crafting receptek | `CraftingGrid.astro`, `RecipeBrowser.tsx` |
| `data/recipes_full.json` | Teljes recept adat (generált) | `RecipesHub.tsx` |
| `data/materials.json` | Anyag tulajdonságok — **nem importált** semmi sem, csak dokumentáció | — |
| `data/mechanics.json` | Játékmechanika adatok — **nem importált** semmi sem | — |

`public/data/` — kliens-oldali JS adatfájlok, `reference.astro` tölti be script tagekkel:
- `public/data/mobs.js` — egyszerűsített mob táblázat (surface/underground/nether, ~31 mob)
- `public/data/materials.js` — enchantability, maxQuality, durabilityMult táblák
- `public/data/sieve.js` — szita drop ráták

⚠️ `public/data/mobs.js` és `public/data/materials.js` **manuálisan karbantartott** fájlok, nem generálódnak a JSON-okból!

### Kétnyelvűség (HU/EN)

- Minden szöveges adat `{ hu: "...", en: "..." }` objektum
- `localStorage` kulcs: `mite-wiki-lang`
- CSS: `html[data-lang-init="en"] [data-lang="hu"] { display: none }` mintával
- `src/i18n/lang.ts` — `getCurrentLang()`, `setCurrentLang()`, `onLangChange()` utils

### Képek

`public/img/` alkönyvtárak: `armor/`, `arrows/`, `blocks/`, `buckets/`, `chains/`, `coins/`, `food/`, `ingots/`, `items/`, `mobs/`, `nuggets/`, `shards/`

Méret: **32×32 PNG**, pixelated stílus. `items.json`-ban `"img": "img/items/foo.png"` formátum.

### Scriptek

`scripts/` — Python/JS generátor scriptek (nem futnak build-kor, manuálisan):
- `parse_recipes.py` / `gen_recipes_full.py` — recept JSON generálás
- `gen_item_stubs.py` — item stub generálás
- `scrape-drops.js` — mob drop scraper

### Fontos konvenciók

- `CraftingGrid` `recipeId` prop: `data/recipes.json`-ból keresi fel; `recipe` prop: közvetlen adat
- Slot érték: `"_"` = üres, string = item ID, string[] = alternatívák (SSR az első elemet rendereli)
- `BASE_URL` mindig `.replace(/\/$/, '')` a kettős perjel elkerülésére
- A `CONTRIBUTING.md` leírja a crafting grid HTML sablont (legacy HTML oldalakhoz)
