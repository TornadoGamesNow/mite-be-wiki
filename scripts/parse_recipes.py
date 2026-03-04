import re, json, zipfile, os
from collections import defaultdict

ZIP_PATH    = 'C:\\Users\\DAVID\\Downloads\\MiTE-BE_v0.9.0_hf3.zip'
TXT_PATH    = "minecraft/MITE/reference/item_recipes.txt"
WIKI_ROOT   = 'C:\\Users\\DAVID\\AppData\\Roaming\\.minecraft\\resourcepacks\\mite-be-wiki'
ITEMS_JSON  = os.path.join(WIKI_ROOT, "data", "items.json")
RECIPES_JSON= os.path.join(WIKI_ROOT, "data", "recipes.json")
OUT_JSON    = os.path.join(WIKI_ROOT, "data", "recipes_generated.json")

NAME_TO_ID = {
    "copper ingot": "copper_ingot",
    "silver ingot": "silver_ingot",
    "mithril ingot": "mithril_bar",
    "adamantium ingot": "adamantium_bar",
    "ancient metal ingot": "ancient_metal_ingot",
    "hard stone ingot": "hardstone_ingot",
    "iron ingot": "iron_ingot",
    "gold ingot": "gold_ingot",
    "iron nugget": "iron_nugget",
    "gold nugget": "gold_nugget",
    "copper nugget": "copper_nugget",
    "silver nugget": "silver_nugget",
    "mithril nugget": "mithril_nugget",
    "adamantium nugget": "adamantium_nugget",
    "ancient metal nugget": "ancient_metal_nugget",
    "hard stone nugget": "hardstone_nugget",
    "mercury nugget": "mercury_nugget",
    "stick": "stick",
    "hard stone handle": "hardstone_handle",
    "oak wood planks": "planks_oak",
    "spruce wood planks": "planks_spruce",
    "birch wood planks": "planks_birch",
    "jungle wood planks": "planks_jungle",
    "wood slab (single)": "wood_slab",
    "oak wood (log)": "log_oak",
    "spruce wood (log)": "log_spruce",
    "birch wood (log)": "log_birch",
    "jungle wood (log)": "log_jungle",
    "banana wood": "log_banana",
    "coconut wood": "log_coconut",
    "pitaya wood": "log_pitaya",
    "oak leaves": "leaves_oak",
    "spruce leaves": "leaves_spruce",
    "birch leaves": "leaves_birch",
    "jungle leaves": "leaves_jungle",
    "pitaya leaves": "leaves_pitaya",
    "banana leaves": "leaves_banana",
    "coconut leaves": "leaves_coconut",
    "coal": "coal",
    "charcoal": "charcoal",
    "cobblestone": "cobblestone",
    "stone": "stone",
    "stone chip": "stone_chip",
    "sandstone": "sandstone",
    "obsidian": "obsidian",
    "obsidian shard": "obsidian_shard",
    "netherrack": "netherrack",
    "clay (ball)": "clay_ball",
    "clay block": "clay_block",
    "hardened clay": "hardened_clay",
    "granite": "granite",
    "diorite": "diorite",
    "andesite": "andesite",
    "nether quartz": "nether_quartz",
    "mossy cobblestone": "mossy_cobblestone",
    "stone bricks": "stone_bricks",
    "gravel": "gravel",
    "sand": "sand",
    "dirt": "dirt",
    "string": "string",
    "leather cord": "leather_rope",
    "grass rope": "straw_rope",
    "silk": "silk",
    "leather": "leather",
    "wool": "wool",
    "plant fiber": "plant_fiber",
    "flint": "flint",
    "flint knife": "flint_knife",
    "flint shard": "flint_shard",
    "tin plate": "tin_plate",
    "redstone": "redstone_dust",
    "glowstone dust": "glowstone_dust",
    "paper": "paper",
    "book": "book",
    "feather": "feather",
    "bone meal": "bone_meal",
    "bone": "bone",
    "egg": "egg",
    "sugar cane": "sugar_cane",
    "sugar": "sugar",
    "wheat": "wheat",
    "carrot": "carrot",
    "potato": "potato",
    "apple": "apple",
    "seeds": "seeds",
    "cactus": "cactus",
    "cactus green": "cactus_green",
    "dandelion": "dandelion",
    "cornflower": "cornflower",
    "mint leaf": "mint_leaf",
    "bowl": "bowl",
    "green slime ball": "slimeball_green",
    "brown slime ball": "slimeball_brown",
    "red slime ball": "slimeball_red",
    "gray slime ball": "slimeball_gray",
    "black slime ball": "slimeball_black",
    "magma cream": "magma_cream",
    "ink sac": "ink_sac",
    "rose red": "dye_red",
    "lapis lazuli": "lapis_lazuli",
    "cocoa beans": "cocoa_beans",
    "purple dye": "dye_purple",
    "cyan dye": "dye_cyan",
    "light gray dye": "dye_light_gray",
    "gray dye": "dye_gray",
    "pink dye": "dye_pink",
    "lime dye": "dye_lime",
    "dandelion yellow": "dye_yellow",
    "light blue dye": "dye_light_blue",
    "magenta dye": "dye_magenta",
    "orange dye": "dye_orange",
    "glass": "glass",
    "glass pane": "glass_pane",
    "glass bottle": "glass_bottle",
    "ender pearl": "ender_pearl",
    "torch": "torch",
    "chest": "chest",
    "beacon": "beacon",
    "piston": "piston",
    "bow": "bow",
    "arrow": "arrow",
    "pressure plate (stone)": "pressure_plate_stone",
    "enchantment table (diamond)": "enchantment_table_diamond",
    "block of gold": "gold_block",
    "block of iron": "iron_block",
    "block of redstone": "redstone_block",
    "block of emerald": "emerald_block",
    "lapis lazuli block": "lapis_block",
    "magma block": "magma_block",
    "water skin": "water_skin",
    "copper workbench": "workbench_copper",
    "silver workbench": "workbench_silver",
    "gold workbench": "workbench_gold",
    "iron workbench": "workbench_iron",
    "mithril workbench": "workbench_mithril",
    "adamantium workbench": "workbench_adamantium",
    "stone furnace (idle)": "furnace_stone",
    "ancient metal war hammer": "ancient_metal_war_hammer",
    "high-carbon steel war hammer": "hcs_war_hammer",
    "hard stone war hammer": "hardstone_war_hammer",
    "blue compass": "blue_compass",
    "wooden sieve": "sieve_wooden",
    "mercury ore": "mercury_ore",
    "sinew": "sinew",
    "leather backpack": "leather_backpack",
    "cobblestone slab (single)": "cobblestone_slab",
    "sandstone slab (single)": "sandstone_slab",
    "stone slab (single)": "stone_slab",
    "stone furnace core": "furnace_core_stone",
    "obsidian furnace core": "furnace_core_obsidian",
    "nether furnace core": "furnace_core_nether",
    "planks": ["planks_oak","planks_spruce","planks_birch","planks_jungle"],
    "log (log)": ["log_oak","log_spruce","log_birch","log_jungle"],
}


def classify_recipe(name_lower, ingredients):
    total = len(ingredients)
    def g(i): return ingredients[i] if i < total else None
    def m(*s): return [list(s[0:3]), list(s[3:6]), list(s[6:9])]
    n = name_lower
    if re.search(r"\bsword\b", n) and total == 3:
        return "shaped", m(None,g(0),None, None,g(0),None, None,g(2),None)
    if re.search(r"\b(dagger|short sword|knife)\b", n) and total == 2:
        return "shaped", m(None,g(0),None, None,g(1),None, None,None,None)
    if re.search(r"\bpickaxe\b", n) and total == 5:
        I,H = g(0),g(3)
        return "shaped", m(I,I,I, None,H,None, None,H,None)
    if re.search(r"\baxe\b", n) and not re.search(r"\b(hatchet|battle|war|hand)\b", n) and total == 5:
        I,H = g(0),g(3)
        return "shaped", m(I,I,None, I,H,None, None,H,None)
    if re.search(r"\bbattle axe\b", n) and total == 6:
        I,H = g(0),g(4)
        return "shaped", m(I,I,I, I,H,None, None,H,None)
    if re.search(r"\bshovel\b", n) and total == 3:
        return "shaped", m(None,g(0),None, None,g(1),None, None,g(1),None)
    if re.search(r"\bhoe\b", n) and total == 4:
        I,H = g(0),g(2)
        return "shaped", m(I,I,None, None,H,None, None,H,None)
    if re.search(r"\b(hatchet|hand axe)\b", n) and total == 3:
        return "shaped", m(None,g(0),None, None,g(1),None, None,g(1),None)
    if re.search(r"\bwar hammer\b", n) and total == 7:
        I,H = g(0),g(5)
        return "shaped", m(I,I,I, I,H,I, None,H,None)
    if re.search(r"\bmattock\b", n) and total == 6:
        I,H = g(0),g(4)
        return "shaped", m(I,I,I, None,H,I, None,H,None)
    if re.search(r"\bscythe\b", n) and total == 5:
        H2,I2 = g(0),g(3)
        return "shaped", m(H2,I2,None, H2,I2,None, H2,None,None)
    if re.search(r"\bshears\b", n) and total == 2:
        I = g(0)
        return "shaped", m(None,I,None, I,None,None, None,None,None)
    if re.search(r"\bhelmet\b", n) and total == 5:
        I = g(0)
        return "shaped", m(I,I,I, I,None,I, None,None,None)
    if re.search(r"\bchestplate\b", n) and total == 8:
        I = g(0)
        return "shaped", m(I,None,I, I,I,I, I,I,I)
    if re.search(r"\bleggings\b", n) and total == 7:
        I = g(0)
        return "shaped", m(I,I,I, I,None,I, I,None,I)
    if re.search(r"\bboots\b", n) and total == 4:
        I = g(0)
        return "shaped", m(I,None,I, I,None,I, None,None,None)
    if re.search(r"\bbow\b", n) and total == 6:
        S,St = g(0),g(1)
        return "shaped", m(None,S,St, S,None,St, None,S,St)
    if re.search(r"\barrow\b", n) and total == 3:
        return "shaped", m(g(0),None,None, g(1),None,None, g(2),None,None)
    return "shapeless", None

def resolve_name(raw, known):
    key = raw.strip().lower()
    if key in NAME_TO_ID: return NAME_TO_ID[key]
    slug = re.sub(r"[^a-z0-9]+", "_", key).strip("_")
    if slug in known: return slug
    return None

def parse_skills(s):
    if not s: return []
    return [p.lower() for p in re.findall(r"skill\.(\w+)", s, re.IGNORECASE)]

def parse_ings(raw):
    inner = raw.strip().lstrip("{").rstrip("}")
    return [p.strip() for p in inner.split(",") if p.strip()]

ITEM_HDR = re.compile(r"^Item\[(\d+)\]\s+Has\s+(\d+)\s+recipes:$")
ITEM_SGL = re.compile(r"^Item\[(\d+)\]\s+(.+?)(?:\s+x(\d+))?:\s+(\{.*?\}),\s+difficulty\s*=\s*([\d.]+)(.*)")
REC_SUB  = re.compile(r"^\s+Recipe\[(\d+)\]\s+(.+?)(?:\s+x(\d+))?:\s+(\{.*?\}),\s+difficulty\s*=\s*([\d.]+)(.*)")
REPAIR   = re.compile(r"Difficulty used for repairs")

def build_rec(idn, sub, oname, qty, ing_raw, diff, skill_raw, known, stats):
    ings = parse_ings(ing_raw)
    resolved = []
    for raw in ings:
        rid = resolve_name(raw, known)
        if rid is None:
            stats["unknown"][raw] += 1
            rid = "?" + re.sub(r"[^a-z0-9]+", "_", raw.lower()).strip("_")
        resolved.append(rid)
    oid = resolve_name(oname, known)
    if oid is None:
        oid = "?" + re.sub(r"[^a-z0-9]+", "_", oname.lower()).strip("_")
    ptype, grid = classify_recipe(oname.lower(), resolved)
    stats[ptype] += 1
    base = re.sub(r"[^a-z0-9]+", "_", oname.lower()).strip("_")
    if qty > 1: base += f"_x{qty}"
    rid2 = f"{base}_{sub}" if sub is not None else f"item{idn}_{base}"
    rec = {"id": rid2, "item_id_num": idn, "output": oid, "qty": qty,
           "station": "workbench", "difficulty": float(diff),
           "skills": parse_skills(skill_raw), "ingredients": resolved}
    if grid:
        rec["pattern"] = grid
        rec["gridSize"] = "3x3"
    else:
        rec["shapeless"] = True
    return rec

def parse_txt(content, known):
    recipes, stats = [], {"total_groups":0,"total":0,"shaped":0,"shapeless":0,
                          "unknown":defaultdict(int)}
    lines = content.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if REPAIR.search(line): i += 1; continue
        mh = ITEM_HDR.match(line)
        if mh:
            idn, nr = int(mh.group(1)), int(mh.group(2))
            stats["total_groups"] += 1; i += 1; si = 0
            while i < len(lines) and si < nr:
                sl = lines[i]
                if REPAIR.search(sl): i += 1; continue
                ms = REC_SUB.match(sl)
                if ms:
                    rec = build_rec(idn, int(ms.group(1)), ms.group(2).strip(),
                                    int(ms.group(3)) if ms.group(3) else 1,
                                    ms.group(4), ms.group(5), ms.group(6), known, stats)
                    recipes.append(rec); stats["total"] += 1; si += 1
                i += 1
            continue
        ms = ITEM_SGL.match(line)
        if ms:
            idn = int(ms.group(1))
            rec = build_rec(idn, None, ms.group(2).strip(),
                            int(ms.group(3)) if ms.group(3) else 1,
                            ms.group(4), ms.group(5), ms.group(6), known, stats)
            recipes.append(rec); stats["total_groups"] += 1; stats["total"] += 1
        i += 1
    return recipes, stats

def main():
    with open(ITEMS_JSON, encoding="utf-8") as f: items_data = json.load(f)
    known = set(items_data.keys()) if isinstance(items_data, dict) else set()
    print(f"Loaded {len(known)} known item IDs from items.json")
    with open(RECIPES_JSON, encoding="utf-8") as f: existing = json.load(f)
    print(f"Loaded {len(existing)} existing hand-crafted recipes")
    with zipfile.ZipFile(ZIP_PATH) as z:
        with z.open(TXT_PATH) as f: content = f.read().decode("latin-1")
    print(f"Read item_recipes.txt: {len(content.splitlines())} lines")
    recipes, stats = parse_txt(content, known)
    output = {"_meta": {"source": TXT_PATH, "total_parsed": stats["total"],
              "shaped": stats["shaped"], "shapeless": stats["shapeless"],
              "note": "Auto-generated from item_recipes.txt"},
              "generated": recipes, "handcrafted": existing}
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print()
    print("=" * 60)
    print("PARSE STATISTICS")
    print("=" * 60)
    tg = stats["total_groups"]
    tot = stats["total"]
    sh = stats["shaped"]
    sl2 = stats["shapeless"]
    print(f"  Item groups (unique items):  {tg}")
    print(f"  Total recipes parsed:        {tot}")
    print(f"  Shaped (pattern assigned):   {sh}")
    print(f"  Shapeless:                   {sl2}")
    pct = sh / max(tot, 1) * 100
    print(f"  Shaped %:                    {pct:.1f}%")
    print()
    unk = stats["unknown"]
    if unk:
        top = sorted(unk.items(), key=lambda x: -x[1])[:30]
        print(f"  Unknown ingredients ({len(unk)} unique) - top 30 by frequency:")
        for name, cnt in top:
            print(f"    [{cnt:3d}x]  {name}")
    print()
    print(f"Output: {OUT_JSON}")
    print(f"Size: {os.path.getsize(OUT_JSON):,} bytes")

main()
