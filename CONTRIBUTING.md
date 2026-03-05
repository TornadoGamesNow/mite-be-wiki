# Contributing to the MITE:BE Wiki

Thanks for your interest in improving the wiki! Here's how you can help.

---

## Quick fixes (typos, grammar, wrong numbers)

1. Fork this repo
2. Edit the relevant file directly (see below for which file to edit)
3. Open a Pull Request with a short description of what you changed

---

## Tech stack

This is an **Astro + React + Tailwind** static site. To run locally:

```bash
npm install
npm run dev    # dev server at localhost:4321
npm run build  # build to /dist
```

---

## File structure

| File / Folder | What to edit |
|--------------|-------------|
| `src/pages/*.astro` | Page layouts and static content |
| `src/islands/*.tsx` | Interactive React components (mob explorer, recipe hub) |
| `src/components/*.astro` | Static Astro components (crafting grids, etc.) |
| `data/mobs.json` | Mob stats, drops, difficulty |
| `data/items.json` | Item names, images, tiers |
| `data/recipes.json` | Crafting recipes (used by CraftingGrid) |
| `data/recipes_full.json` | Full recipe database (used by RecipesHub) |
| `src/styles/global.css` | All styling |

> **Note:** `public/data/mobs.js` and `public/data/materials.js` are legacy JS files used only by `reference.astro`. They must be maintained manually in sync with the JSON data files.

---

## Bilingual content

Every piece of user-facing content needs **both languages**.

In Astro components, use `data-lang` attributes:

```html
<p data-lang="hu">Magyar szöveg</p>
<p data-lang="en">English text</p>
```

In JSON data files, use the `{ hu: "...", en: "..." }` object format.

---

## Adding a new mob

Edit `data/mobs.json`. Each mob entry looks like:

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
  "tier": null
}
```

Add the item image (`32×32 PNG`, pixelated style) to `public/img/items/`.

---

## Reference data sources

Game data comes from the mod's `MITE/reference/` text files inside the mod ZIP:

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

---

## License

By contributing you agree that your contributions are licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/), the same license as this project.

---

## Questions?

Open an [Issue](https://github.com/TornadoGamesNow/mite-be-wiki/issues) or ask on [Discord](https://discord.gg/7myyGAXJ6v).
