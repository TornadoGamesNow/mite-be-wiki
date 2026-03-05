# Contributing to the MITE:BE Wiki

Thanks for your interest in improving the wiki! Here's how you can help.

---

## Quick fixes (typos, wrong numbers, missing translations)

1. Fork this repo
2. Edit the relevant file (see the table below)
3. Open a Pull Request with a short description of what you changed

---

## Tech stack

**Astro + React + Tailwind** static site. To run locally:

```bash
npm install
npm run dev      # dev server → localhost:4321
npm run build    # build → /dist
npm run preview  # preview the build
```

There is no automated test command. A clean `npm run build` means everything is OK.

---

## File structure — what to edit where

| File / Folder | What to edit here |
|-------------|------------------|
| `src/pages/index.astro` | Main wiki content (bilingual HU+EN, ~4200+ lines) |
| `src/pages/*.astro` | Other pages (recipes, mobs, brewing, reference, etc.) |
| `src/islands/MobExplorer.tsx` | Mob search/filter logic |
| `src/islands/RecipeBrowser.tsx` | Recipe browser (recipes.json-based, tier merging) |
| `src/islands/RecipesHub.tsx` | Full recipe browser (recipes_full.json-based) |
| `src/components/*.astro` | Static Astro components (CraftingGrid, McTooltip, etc.) |
| `data/mobs.json` | **SSOT** — mob stats, drops, spawn zones |
| `data/items.json` | **SSOT** — item names, images, tiers |
| `data/recipes.json` | **SSOT** — crafting recipes (used by CraftingGrid + RecipeBrowser) |
| `data/recipes_full.json` | Full recipe database (used by RecipesHub, generated file) |
| `data/materials.json` | Material properties (enchantability, durabilityMult, sieve drops) |
| `data/mechanics.json` | Game mechanics data (furnace heat levels, armor, weapon damage) |
| `src/styles/global.css` | All styling |

> ⚠️ **Important:** `public/data/mobs.js`, `public/data/materials.js`, and `public/data/sieve.js` are **manually maintained** JS files used only by `reference.astro` for its client-side tables. They are not auto-generated from the JSON files. If you update the corresponding JSON, update these files too.

---

## Data consistency — SSOT principle

The JSON files in `data/` are the **single source of truth** for all game data.

- If content in `index.astro` contradicts `recipes.json` or `mobs.json` → the JSON wins
- `mechanics.json` holds the authoritative weapon damage and armor protection values
- `materials.json` holds the authoritative material tiers, durability multipliers, and enchantability values

Always cite the source mod reference file (see below) when correcting numeric data.

---

## Bilingual content (HU/EN)

Every piece of user-facing content must have **both languages**.

In Astro components, use `data-lang` attributes:

```html
<p data-lang="hu">Magyar szöveg</p>
<p data-lang="en">English text</p>
```

In JSON data files, use the `{ hu: "...", en: "..." }` object format:

```json
"name": { "hu": "Réz Csákány", "en": "Copper Pickaxe" }
```

In React islands, the active language is tracked via `lang` state: `lang === 'hu' ? ... : ...`

---

## Adding a crafting grid

The `CraftingGrid.astro` component looks up recipes from `recipes.json` via the `recipeId` prop:

```astro
<CraftingGrid recipeId="copper_pickaxe" />
```

Or pass data directly with the `recipe` prop:

```astro
<CraftingGrid recipe={{
  gridSize: "3x3",
  pattern: [["copper_ingot","copper_ingot","copper_ingot"],["_","stick","_"],["_","stick","_"]],
  output: "copper_pickaxe",
  label: { hu: "Réz Csákány", en: "Copper Pickaxe" }
}} />
```

**Slot values:**
- `"_"` — empty slot
- `"item_id"` — a single item (looked up in `items.json`)
- `["item_a", "item_b"]` — alternatives (SSR renders the first one)

---

## Adding a new mob

Edit `data/mobs.json`. A mob entry looks like:

```json
{
  "id": "zombie",
  "name": { "hu": "Zombi", "en": "Zombie" },
  "image": "zombie.png",
  "hp": 20,
  "damage": "3",
  "xp": 5,
  "difficulty": "early",
  "mobType": "undead",
  "spawnZones": ["surface", "underground"],
  "tags": [],
  "drops": [
    { "item": { "hu": "Csont", "en": "Bone" }, "itemId": "bone", "chance": "100%" }
  ]
}
```

Add the mob face image (`64×64 PNG`) to `public/img/mobs/` as `{id}_face.png`.

---

## Adding a new item

Edit `data/items.json`:

```json
"my_item": {
  "name": { "hu": "Az én itemem", "en": "My Item" },
  "img": "img/items/my_item.png",
  "tier": null,
  "category": "tool"
}
```

Add the texture (`32×32 PNG`, pixelated style) to `public/img/items/`.

**Valid tier values:** `null`, `"flint"`, `"copper"`, `"silver"`, `"gold"`, `"iron"`, `"hard"`, `"ancient"`, `"mithril"`, `"adamantium"`

---

## Reference data sources

Game data comes from the mod's `MITE/reference/` directory inside the mod ZIP:

| File | Content |
|------|---------|
| `item_recipes.txt` | Crafting recipes |
| `furnace_recipes.txt` | Smelting recipes (temperature + profession) |
| `damage_vs_entity.txt` | Weapon damage values |
| `item_durability.txt` | Item durability (base values) |
| `armor_protection.txt` | Armor protection values |
| `material_enchantability.txt` | Enchantability by material |
| `professions.txt` | Profession list |

---

## What we're looking for

- Corrections to stats, drop rates, or recipe details (always cite the source reference file)
- Missing translations (HU or EN)
- New crafting grid visuals for recipes that are currently text-only
- Texture images (`32×32 PNG`, pixelated style) for items/blocks not yet in `public/img/`

---

## Guidelines

- Always provide both HU and EN for any new content
- One PR per topic keeps reviews fast
- Numeric data must be sourced from the mod's reference files

---

## License

By contributing you agree that your contributions are licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/), the same license as this project.

---

## Questions?

Open an [Issue](https://github.com/TornadoGamesNow/mite-be-wiki/issues) or join the [Discord server](https://discord.gg/7myyGAXJ6v).
