# Wiki Konzultációs Lista

Ezek a kérdések emberi döntést igényelnek. Az automatikusan javítható problémák már javítva vannak.

---

## 1. Hiányzó képfájlok (8 item)

A következő 8 item képét nem sikerült letölteni (mcmod.cn CDN 404-et ad, böngésző automation nem működött). Kézzel kell letölteni vagy a mod textúra fájlokból kimenteni:

| Wiki ID | Angol név | mcmod ID |
|---------|-----------|----------|
| `advanced_filter_paper` | Advanced Filter Paper | 802107 |
| `bucket_clean_water` | Bucket Clean Water | 785029 |
| `bucket_liquefied_gold` | Bucket Liquefied Gold | 777325 |
| `bucket_liquefied_mercury` | Bucket Liquefied Mercury | 829257 |
| `conveying_stone` | Conveying Stone | 829859 |
| `fluid_tank` | Fluid Tank | 785018 |
| `jewelry_shield` | Jewelry Shield | 785090 |
| `kbook` | Kbook | 831647 |

**Hogyan:** Nyisd meg a mcmod.cn item oldalát, kattints jobb gombbal az ikonra → "Kép mentése másként" → `public/img/items/{id}.png`

---

## 2. Kérdéses removed_in jelölések

### 2a. Régi tool-variánsok (v0.5.5 — 33 item)

Például `adamantium_dagger`, `mithril_hoe`, `ancient_metal_scythe` stb. Ezek **crafting receptje** eltávolítva v0.5.5-ben, de az item maga még elérhető lehet (pl. chest lootból)? Vagy teljesen kiszedték a modból?

**Kérdés:** Vannak-e ezek a tárgyak még a játékban (drop, chest, stb.), vagy teljesen eltávolítottak?

Jelenlegi állapot: `removed_in: "0.5.5"` — ezek rejtve vannak az Item Böngészőben.

### 2b. v0.5.6 ételek és egyéb itemek

- `beef_stew`, `chicken_soup`, `lotus_seed_soup`, `pumpkin_soup`, `wheat_soup`, `bowl_vegetable_soup` — receptük eltávolítva v0.5.6. Teljesen kiszedtek?
- `shield` — eltávolítva v0.5.6. A `jewelry_shield` volt a helyettesítő?
- `porridge` — eltávolítva v0.5.6. Teljesen kiszedve?

### 2c. Scrollok (v0.5.8)

`bound_scroll`, `return_scroll`, `warp_scroll` — mind eltávolítva v0.5.8-ban. Ma már teljesen nincs scroll rendszer a modban?

### 2d. Chest upgrade-ek (v0.9.0)

`copper_chest_upgrade`, `iron_chest_upgrade`, `gold_chest_upgrade`, `hard_chest_upgrade`, `silver_chest_upgrade`, `mithril_chest_upgrade`, `adamantium_chest_upgrade` — eltávolítva v0.9.0-ban. Teljesen kiszedve vagy más rendszerrel helyettesítve?

---

## 3. Item státusz kérdések

### copper_axe, iron_axe, silver_axe és hasonlók (v0.6.0)

Ezek az itemek még a játékban vannak (a higher-tier craftoláshoz szükségesek, pl. `bronze_axe` = `copper_axe` + `tin_ingot`), de a crafting receptjük el lett távolítva v0.6.0-ban.

**Kérdés:** Hogyan szerzi meg a játékos a `copper_axe`-t ha nincs crafting recept? Mob drop? Ha igen, melyik mob?

Jelenleg: nincs `removed_in` jelölésük (helyesen), de nincs dokumentálva hogyan szerezhető.

### water_bag (base) — v0.5.6

A `water_bag` (alap, bőr) receptje eltávolítva v0.5.6-ban. De v0.9.0-ban a `big_water_bag` recept még mindig a `water_bag`-et használja ingrediensként. Hogyan szerezhető most a `water_bag`?

---

## 4. Hiányzó receptek (valószínűleg smelting)

A következő itemek nem rendelkeznek crafting recepttel a wikiünkben, de biztosan craftolhatók (smelting/olvasztás útján valamilyen kemencében):

- `copper_ingot` — valószínűleg réz érc olvasztásával
- `silver_ingot`, `mercury_ingot` — hasonlóan
- `glass` — homok olvasztásával kő kemencében
- `tin_ingot`, `hardstone_ingot` stb.

**Kérdés:** Melyik station-ban és milyen input-ból? Ha van mcmod.cn linkje, nézd meg az "Egyéb receptek" tab-ot.

---

## 5. Duplikált/elavult item ID-k

- `hard_stone_war_hammer` és `hardstone_war_hammer` — mindkettő létezik items.json-ban. Melyik a helyes?
- `campfire` és `campfire_idle` — mindkettő van. Ez szándékos (on/off állapot)?
- `miner_helmet`, `miner_s_helmet`, `mining_helmet` — háromféle ID. Ezek különböző itemek?

---

## 6. Kategória kérdések (items.json)

- `bad_cooked_*` itemek: `category: "material"` — nem kellene inkább `food` lennie?
- `sinew`: `category: "material"` — Nem a `leather_rope` más neve? (Korábban volt erről egy kérdés)
- `colling_liquid` vs `cooling_liquid` — Typo az ID-ban? Mindkettő létezik.

---

## 7. Scraper hiányosságok

A következő itemek valószínűleg a modban vannak, de nincsenek a wikiünkben:
- Ismert: `oak_fence` (mcmod ID 772186) — vanilla Minecraft fence, nem MITE-specifikus, nem kell?
- Új 0.9.0 itemek amelyek esetleg még nincsenek a cache-ben

**Javaslat:** Futtasd újra a scrappert (0.9.0-ra) ha vannak frissen hozzáadott itemek.

---

## 8. Duplikátum gyanús itemek

- `fish_raw` és `raw_fish` — mindkettő "Raw Fish", ugyanaz a kép. `fish_raw` nincs receptben. Törölhető?
- `oak_slab` és `oak_wood_slab_single` — ugyanaz a kép. Alias?
- `wood_slab_single` — ingredient több receptben, nincs saját receptje. Vanilla MC item?
- `red_slime_ball` (1 receptben ingrediens) és `red_slimeball` (0 recept) — ugyanaz a kép. Melyik a helyes?
- `dung` és `manure` — mindkettő 0 recept, ugyanaz a kép.
- `obsidian_ingot_mold` (14 output recept, tool) és `obsidian_ingot_mould` (1 recept) — brit/amerikai helyesírás, két különböző item (mould=nyers, mold=kész)?
- `slimeball_black`/`black_slimeball`, `slimeball_brown`/`brown_slimeball`, `slimeball_gray`/`grey_slimeball` — mindhárom párnak azonos képe van, a `slimeball_*` variáns van receptekben
- `rusted_iron_axe`, `rusted_iron_hoe`, `rusted_iron_pickaxe`, `rusted_iron_shovel` — 0 recept, de ugyanaz a képük mint az `iron_axe`, `iron_hoe` stb. (amelyeknek VAN receptjük). Két külön item?

## 9. Blokk duplikátumok

- `element_obsidian` és `elemental_obsidian` — mindkettő "Elemental Obsidian", ugyanaz a kép. `element_obsidian` használt (runestone receptekben ingrediens + saját recepta van). `elemental_obsidian` nincs semmilyen receptben. Törölhető?
- `furnace_core_netherrack` (mcmod 32053) és `nether_furnace_core` (mcmod 1271–1272) — mindkettő "Netherrack Furnace Core" de KÜLÖNBÖZŐ kép. Két külön item?
- Hasonlóan: `furnace_core_obsidian`/`obsidian_furnace_core` és `furnace_core_stone`/`stone_furnace_core`

---

## 10. Gyapjú duplikátumok (33 item)

Két párhuzamos gyapjú ID-rendszer létezik:
- **`wool_black`, `wool_blue`, ... `wool_yellow`** (16 szín) — ezek használatosak a legtöbb receptben (34–37 receptenként)
- **`black_wool`, `blue_wool`, ... `yellow_wool`** (15 szín) — csak 8 receptben szerepelnek, lehet hogy régi nevek

**Kérdés:** Melyik a helyes ID-rendszer? A `wool_*` variánsokat kell megtartani? A `*_wool` variánsok törölhetők?

Megjegyzés: Van egy `wool` (sima fehér) és `white_wool_portal_stone` item is.

---

## Elvégzett automatikus javítások (nem igényelnek döntést)

- `removed_in` mező hozzáadva 84 itemhez (v0.5.5–v0.9.0)
- 8 vízzsák fém variáns (`water_bag_copper`–`water_bag_adamantium`) `removed_in: "0.9.0"` jelölés kapott
- 8 vízzsák upgrade recept hozzáadva recipes_full.json-ba (v0.5.6→v0.9.0)
- 9 ore→ingot smelting recept hozzáadva (`copper_ingot`, `silver_ingot`, `gold_ingot`, `iron_ingot`, `hardstone_ingot`, `mithril_bar`, `adamantium_bar` + `cooked_chicken`, `baked_potato`)
- 286 recept kapott `added_version`/`removed_version` tageket
- 11 recept `workbench` → `flint_workbench` javítva
- `chip_flint_knife` tier: `1` (szám) → `"flint"` (string) javítva
- 45 item kategória javítva: bronze/silver_copper/hcs/rusted_iron fegyverek/eszközök `material` → `weapon`/`tool`; flint_and_steel variánsok → `tool`; `jewelry_shield` → `armor`; `bowl_milk`, bowl soups → `food`
- 9 főtt étel kategória javítva `material` → `food`: `duck_cooked`, `duck_head_cooked`, `cooked_squid_meat`, `cooked_mutton`, `worm_cooked`, `duck_head`, `mutton_raw`, `squid_meat`, `worm_raw`
- `rusted_iron_arrow` `material` → `weapon` javítva
- `items.astro` item szám frissítve (1118 → 1126)
- Changelog typo javítva ("Regebbi verziok" → "Régebbi verziók")
- `ItemExplorer.tsx` + `RecipesHub.tsx` `removed_in` badge kezelés hozzáadva
- `RecipesHub.tsx` új szűrők: ✅ Aktuális / ⚠️ Eltávolított
- STATION_LABELS javítva RecipesHub.tsx-ben (`stone_workbench`/`hard_workbench` → `hardstone_workbench`/`ancient_metal_workbench`/`silver_workbench`)
- 50 item kategória javítva: 11 nyers hús → `food`, 12 gyümölcs/növény → `food`, 3 bunkó/bot → `weapon`, 2 viselet → `armor`, 5 tároló → `tool`, 2 → `misc`, 14 elhelyezhető blokk → `block`
- 11 item kategória javítva: pcb/battery/kbook/book/runestore → `misc`, fluid_tank/conveying_stone/way_stone/template_lantern/glow_stone_torch/pillager_flag → `block`
- 8 barrel_upgrade → `misc`, bone_meal → `material`, bowl (üres) → `material`
- sugar_water, bowl_water → `food`, tin_ingot → `ingot`
- 36 bucket item (copper→adamantium, empty+filled) → `tool`
- blast_furnace + 9 workbench → `station` kategória
