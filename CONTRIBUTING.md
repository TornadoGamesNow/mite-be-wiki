# Contributing to the MITE:BE Wiki

Thanks for your interest in improving the wiki! Here's how you can help.

---

## Quick fixes (typos, grammar, wrong numbers)

1. Fork this repo
2. Edit the relevant file directly (see below for which file to edit)
3. Open a Pull Request with a short description of what you changed

---

## File structure

| File | What to edit |
|------|-------------|
| `index.html` | Main wiki — progression, crafting grids, mechanics sections |
| `reference.html` | Reference tables — mobs, potions, workbench tiers, blood moon |
| `install.html` | Installation guide |
| `changelog.html` | Patch notes |
| `faq.html` | Frequently asked questions |
| `data/mobs.js` | Mob stat tables (surface / underground / nether) |
| `data/sieve.js` | Gravel and nether gravel sieve drop rates |
| `data/materials.js` | Enchantability, max quality, durability multipliers |
| `css/style.css` | All styling |
| `js/app.js` | Language switching, search, data table renderer |

---

## Bilingual content

Every piece of content needs **both languages** using `data-lang="hu"` and `data-lang="en"` attributes.

```html
<p data-lang="hu">Magyar szöveg</p>
<p data-lang="en">English text</p>
```

For inline text use `<span data-lang="hu">` / `<span data-lang="en">`.

---

## Crafting grids

Crafting grids use the `craft-table` / `craft-grid` pattern — copy an existing grid as a template.
Each slot is either:
- `<div class="craft-slot empty"></div>` — empty
- A full `<div class="craft-slot"><div class="mc-tooltip">…</div><img …></div>` — with item tooltip

Both HU and EN tooltip labels go inside the **same** slot div (not in separate `data-lang` wrappers).

---

## JS data tables

Some tables are rendered dynamically from `data/*.js` files. The format:

```js
// data/mobs.js example entry
{ name: { hu: "Zombi", en: "Zombie" }, hp: 20, dmg: { hu: "3", en: "3" }, xp: 5,
  special: { hu: "...", en: "..." } }
```

Edit the JS data file to update values — do not touch the renderer in `js/app.js` unless you need a structural change.

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
- Texture images (`32×32 PNG`, pixelated style) for items/blocks not yet in `img/`

---

## Guidelines

- Keep it simple — this is a static site, no frameworks or build tools needed
- Test your changes locally by opening the HTML file in a browser (`file://`)
- One PR per topic keeps reviews fast
- Always provide both HU and EN for any new content

---

## License

By contributing you agree that your contributions are licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/), the same license as this project.

---

## Questions?

Open an [Issue](https://github.com/TornadoGamesNow/mite-be-wiki/issues) or ask on [Discord](https://discord.gg/7myyGAXJ6v).
