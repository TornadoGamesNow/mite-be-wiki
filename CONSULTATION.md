# Wiki Konzultációs Lista

Ezek a kérdések emberi döntést igényelnek. Az automatikusan javítható problémák már javítva vannak.

---

## 1. Eltávolított itemek — játékban maradtak-e?

A következő csoportokba tartozó itemek `removed_in` jelölést kaptak, mert receptjük eltávolítva. De kérdés: **a játékban még megtalálhatók-e** (pl. chest loot, mob drop), vagy teljesen kiszedtek a modból?

### 1a. Régi tool-variánsok (v0.5.5 — 33 item)

Pl. `adamantium_dagger`, `mithril_hoe`, `ancient_metal_scythe` stb. Ezek receptje eltávolítva, de az item maga elérhető maradhat.

Jelenlegi állapot: `removed_in: "0.5.5"` — rejtve az Item Böngészőben.

### 1b. v0.5.6 ételek

- `beef_stew`, `chicken_soup`, `lotus_seed_soup`, `pumpkin_soup`, `wheat_soup`, `bowl_vegetable_soup` — receptük eltávolítva v0.5.6. Teljesen kiszedtek?
- `shield` — eltávolítva v0.5.6. A `jewelry_shield` volt a helyettesítő?
- `porridge` — eltávolítva v0.5.6. Teljesen kiszedve?

### 1c. Scrollok (v0.5.8)

`bound_scroll`, `return_scroll`, `warp_scroll` — mind eltávolítva v0.5.8-ban. Ma már teljesen nincs scroll rendszer a modban?

### 1d. Chest upgrade-ek (v0.9.0)

`copper_chest_upgrade` stb. — eltávolítva v0.9.0-ban. Teljesen kiszedve vagy más rendszerrel helyettesítve?

---

## 2. Három sisak ID — ugyanaz vagy különböző?

| ID | Tier | Max Dur | Kép |
|----|------|---------|-----|
| `miner_helmet` | iron | 150 | `img/armor/miner_helmet.png` |
| `miner_s_helmet` | gold | nincs | `img/items/miner_s_helmet.png` |
| `mining_helmet` | gold | nincs | `img/items/mining_helmet.png` |

Mind a háromnak van saját receptje és különböző statisztikája. Valóban 3 különböző item a modban?

---

## 3. `furnace_core_*` duplikátumok

- `furnace_core_netherrack` (mcmod 32053) és `nether_furnace_core` (mcmod 1271–1272) — mindkettő "Netherrack Furnace Core" de **KÜLÖNBÖZŐ** kép. Két külön item?
- Hasonlóan: `furnace_core_obsidian`/`obsidian_furnace_core` és `furnace_core_stone`/`stone_furnace_core`

---

## Elvégzett automatikus javítások (nem igényelnek döntést)

- `removed_in` mező hozzáadva 84 itemhez (v0.5.5–v0.9.0)
- `stone_axe`, `stone_pickaxe`, `stone_shovel`, `stone_spear` — mind `removed_in: "pre-0.5.5"` (régi nevek, a `flint_*` itemek az aktívak)
- `copper_axe`, `iron_axe`, `silver_axe` — VAN current receptjük (workbench-en craftolhatók)
- `water_bag` — VAN 2 current receptje: `sinew+leather` és `string+leather` (flint_workbench)
- 8 korábban hiányzó kép (fluid_tank, jewelry_shield, kbook stb.) — megvan
- Duplikátumok (`fish_raw`, `elemental_obsidian`, `dung`, `slimeball_*`/`*_slimeball`, `obsidian_ingot_mold`, `wool_*`) — mind `removed_in: "pre-0.5.5"` tagelve
- `bad_cooked_*` → `category: "food"` javítva
- `colling_liquid` — `removed_in: "pre-0.5.5"` tagelve (aktív: `cooling_liquid`)
- `hardstone_war_hammer` — `removed_in: "0.6.0"` (aktív: `hard_stone_war_hammer`)
- `obsidian_ingot_mold` — `removed_in: "pre-0.5.5"` (aktív: `obsidian_ingot_mould`)
- 8 vízzsák fém variáns, 8 vízzsák upgrade recept, 286 recept `added_version`/`removed_version` tagek
- 11 recept `workbench` → `flint_workbench` javítva
- Kategória javítások: ~150+ item (fegyver/eszköz/étel/armor/station/misc/block)
- `ItemExplorer.tsx` + `RecipesHub.tsx` `removed_in` badge kezelés
- `RecipesHub.tsx` station label javítások, szűrők (aktuális/eltávolított)
