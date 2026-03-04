# -*- coding: utf-8 -*-
import zipfile, re, json, sys

NAME_TO_ID = {
    "Copper ingot":"copper_ingot","Silver ingot":"silver_ingot","Gold Ingot":"gold_ingot",
    "Iron Ingot":"iron_ingot","Mithril ingot":"mithril_bar","Adamantium ingot":"adamantium_bar",
    "Ancient metal ingot":"ancient_metal_ingot","Hard Stone Ingot":"hardstone_ingot",
    "Mercury Ingot":"mercury_ingot","Tin plate":"tin_plate",
    "Copper nugget":"copper_nugget","Silver nugget":"silver_nugget","Gold Nugget":"gold_nugget",
    "Iron nugget":"iron_nugget","Mithril nugget":"mithril_nugget","Adamantium nugget":"adamantium_nugget",
    "Ancient metal nugget":"ancient_metal_nugget","Hard Stone Nugget":"hardstone_nugget",
    "Mercury Nugget":"mercury_nugget",
    "Copper block":"copper_block","Silver block":"silver_block","Block of Gold":"gold_block",
    "Block of Iron":"iron_block","Mithril block":"mithril_block","Adamantium block":"adamantium_block",
    "Ancient metal block":"ancient_metal_block","Block of Hard Stone":"hardstone_block",
    "Block of Diamond":"diamond_block","Block of Emerald":"emerald_block",
    "Block of Coal":"coal_block","Block of Redstone":"redstone_block","Lapis Lazuli Block":"lapis_block",
    "Stick":"stick","Hard Stone Handle":"hardstone_handle",
    "String":"string","Leather cord":"leather_rope","Grass Rope":"straw_rope","Silk":"silk",
    "Oak Wood Planks":"planks_oak","Spruce Wood Planks":"planks_spruce",
    "Birch Wood Planks":"planks_birch","Jungle Wood Planks":"planks_jungle",
    "Planks":["planks_oak","planks_spruce","planks_birch","planks_jungle"],
    "Oak Wood (log)":"log_oak","Spruce Wood (log)":"log_spruce",
    "Birch Wood (log)":"log_birch","Jungle Wood (log)":"log_jungle",
    "Log (log)":["log_oak","log_spruce","log_birch","log_jungle"],
    "Banana Wood":"log_oak","Coconut Wood":"log_oak","Pitaya Wood":"log_oak",
    "Coal":"coal","Charcoal":"charcoal",
    "Cobblestone":"cobblestone","Stone":"stone","Obsidian":"obsidian",
    "Obsidian shard":"obsidian_shard","Sandstone":"sandstone","Hardened Clay":"hardened_clay",
    "Clay Block":"clay_block","Clay (ball)":"clay_ball","Netherrack":"netherrack",
    "Gravel":"gravel","Dirt":"dirt","Andesite":"andesite","Granite":"granite","Diorite":"diorite",
    "Nether Brick":"nether_brick","Glass":"glass","Glass Pane":"glass_pane",
    "Glass shard":"glass_shard","Brick":"brick","Bricks":"bricks",
    "Mossy Cobblestone":"mossy_cobblestone","Nether Quartz":"nether_quartz",
    "Stone Chip":"stone_chip","Glowstone":"glowstone","Glowstone Dust":"glowstone_dust",
    "Hay Bale":"hay_bale","Element Obsidian":"element_obsidian","Ice":"ice",
    "Diamond":"diamond","Diamond shard":"diamond_shard","Emerald":"emerald",
    "Emerald shard":"emerald_shard","Lapis Lazuli":"lapis_lazuli",
    "Flint":"flint","Flint knife":"flint_knife","Flint shard":"flint_shard",
    "Flint tool bench":"flint_workbench","Sharp Flint Flake":"sharp_chip",
    "Leather":"leather","Feather":"feather","Paper":"paper","Book":"book",
    "Book and Quill":"book_and_quill","Ender Pearl":"ender_pearl","Eye of Ender":"ender_eye",
    "Redstone":"redstone_dust","Gunpowder":"gunpowder","Blaze Powder":"blaze_powder",
    "Blaze Rod":"blaze_rod","Bone":"bone","Bone Meal":"bone_meal","Ink Sac":"ink_sac",
    "Wool":["wool_white","wool_orange","wool_magenta","wool_light_blue","wool_yellow",
            "wool_lime","wool_pink","wool_gray","wool_light_gray","wool_cyan",
            "wool_purple","wool_blue","wool_brown","wool_green","wool_red","wool_black"],
    "Plant Fiber":"plant_fiber","Carbon Crystal":"carbon_crystal",
    "Filter Paper":"filter_paper","Obsidian Ingot Mold":"obsidian_ingot_mold",
    "Nether Star":"nether_star","Cooling liquid":"cooling_liquid",
    "Bow":"bow","Chest":"chest","Piston":"piston","Hopper":"hopper",
    "Compass":"compass","Map":"map","Minecart (empty)":"minecart",
    "Wheat":"wheat","Egg":"egg","Sugar":"sugar","Carrot":"carrot","Apple":"apple",
    "Potato":"potato","Baked Potato":"baked_potato","Bamboo":"bamboo",
    "Melon (slice)":"melon_slice",
    "Mushroom (brown, small)":"mushroom_brown","Mushroom (red, small)":"mushroom_red",
    "Bowl":"bowl","Flour":"flour","Dough":"dough","Chocolate":"chocolate",
    "Cheese":"cheese","Onion":"onion","Mint Leaf":"mint_leaf","Blueberries":"blueberries",
    "Orange":"orange","Magma Cream":"magma_cream","Green slime ball":"slimeball_green",
    "Black slime ball":"slimeball_black","Brown slime ball":"slimeball_brown",
    "Gray slime ball":"slimeball_gray","Nether Wart":"nether_wart",
    "Glass Bottle":"glass_bottle","Lily Pad":"lily_pad","Cactus Green":"cactus_green",
    "Dandelion Yellow":"dandelion_yellow","Rose Red":"rose_red","Cocoa Beans":"cocoa_beans",
    "Purple Dye":"purple_dye","Cyan Dye":"cyan_dye","Light Gray Dye":"light_gray_dye",
    "Gray Dye":"gray_dye","Pink Dye":"pink_dye","Lime Dye":"lime_dye",
    "Light Blue Dye":"light_blue_dye","Magenta Dye":"magenta_dye","Orange Dye":"orange_dye",
    "Copper workbench":"copper_workbench","Silver workbench":"silver_workbench",
    "Gold workbench":"gold_workbench","Iron workbench":"iron_workbench",
    "Ancient metal workbench":"ancient_metal_workbench","Mithril workbench":"mithril_workbench",
    "Adamantium workbench":"adamantium_workbench","Hard stone workbench":"hardstone_workbench",
    "Copper short sword":"copper_short_sword","Silver short sword":"silver_short_sword",
    "Gold short sword":"gold_short_sword","Iron short sword":"iron_short_sword",
    "Rusted iron short sword":"rusted_iron_short_sword","Mithril short sword":"mithril_short_sword",
    "Adamantium short sword":"adamantium_short_sword","Ancient metal short sword":"ancient_metal_short_sword",
    "Black Bed":"bed_black","White Bed":"bed_white",
    "Recall Scroll":"recall_scroll","Leather Backpack":"backpack",
    "Bowl of Clean Water":"bowl_water","A bowl of milk":"bowl_milk",
    "Sinew":"sinew","Golden Apple":"golden_apple",
    "Enchantment Table (diamond)":"enchanting_table_diamond",
    "Copper ore":"copper_ore","Silver ore":"silver_ore","Iron Ore":"iron_ore",
    "Gold Ore":"gold_ore","Mithril ore":"mithril_ore","Adamantium ore":"adamantium_ore",
    "Hard Stone Ore":"hardstone_ore","Mercury Ore":"mercury_ore",
    "Copper chain":"copper_chain","Silver chain":"silver_chain","Gold chain":"gold_chain",
    "Iron chain":"iron_chain","Mithril chain":"mithril_chain","Adamantium chain":"adamantium_chain",
    "Ancient metal chain":"ancient_metal_chain","Hard Stone chain":"hardstone_chain",
    "Rusted iron chain":"rusted_iron_chain",
    "Copper bucket":"copper_bucket","Silver bucket":"silver_bucket","Gold bucket":"gold_bucket",
    "Iron bucket":"iron_bucket","Mithril bucket":"mithril_bucket","Adamantium bucket":"adamantium_bucket",
    "Ancient metal bucket":"ancient_metal_bucket","Hard Stone Bucket":"hardstone_bucket",
    "Copper coin":"copper_coin","Silver coin":"silver_coin","Gold coin":"gold_coin",
    "Mithril coin":"mithril_coin","Adamantium coin":"adamantium_coin",
    "Ancient metal coin":"ancient_metal_coin","Hard Stone Coin":"hardstone_coin",
    "Copper arrow":"copper_arrow","Silver arrow":"silver_arrow","Gold arrow":"gold_arrow",
    "Iron arrow":"iron_arrow","Mithril arrow":"mithril_arrow","Adamantium arrow":"adamantium_arrow",
    "Ancient metal arrow":"ancient_metal_arrow","Obsidian arrow":"obsidian_arrow",
    "Flint arrow":"flint_arrow",
}

def name_to_id(name):
    n = name.strip()
    if n in NAME_TO_ID:
        return NAME_TO_ID[n]
    snake = re.sub(r'[^a-z0-9]+', '_', n.lower()).strip('_')
    return snake if snake else n

def get_station(ings):
    flat = []
    for x in ings:
        if isinstance(x, list): flat.extend(x)
        else: flat.append(str(x))
    def has(prefix): return any(x.startswith(prefix) for x in flat)
    if has('adamantium'): return 'adamantium_workbench'
    if has('mithril'): return 'mithril_workbench'
    if 'hardstone_ingot' in flat or 'hardstone_handle' in flat: return 'hardstone_workbench'
    if has('ancient_metal'): return 'ancient_metal_workbench'
    if 'iron_ingot' in flat: return 'iron_workbench'
    if 'gold_ingot' in flat: return 'gold_workbench'
    if 'silver_ingot' in flat: return 'silver_workbench'
    if 'copper_ingot' in flat: return 'copper_workbench'
    return 'flint_workbench'

def get_pattern(output_name, ings):
    n = output_name.lower()
    # Find ingot and handle
    ingot_ids = ['copper_ingot','silver_ingot','gold_ingot','iron_ingot','mithril_bar',
                 'adamantium_bar','ancient_metal_ingot','hardstone_ingot','mercury_ingot',
                 'copper_block','silver_block','gold_block','iron_block','mithril_block',
                 'adamantium_block','ancient_metal_block','hardstone_block']
    handle_ids = ['stick','hardstone_handle']
    flat = [x for x in ings if isinstance(x,str)]
    I = next((x for x in flat if x in ingot_ids), flat[0] if flat else None)
    H = next((x for x in flat if x in handle_ids), 'stick')
    N = flat[0] if flat else None  # nugget for arrows

    def pat(*rows): return [list(r) for r in rows]

    if 'short sword' in n or (('dagger' in n) and 'hard stone' not in n):
        return True, pat([None,I,None],[None,H,None],[None,None,None])
    if 'sword' in n:
        return True, pat([None,I,None],[None,I,None],[None,H,None])
    if 'pickaxe' in n:
        return True, pat([I,I,I],[None,H,None],[None,H,None])
    if 'battle axe' in n:
        return True, pat([I,I,I],[I,H,None],[None,H,None])
    if 'mattock' in n:
        return True, pat([I,I,I],[None,H,I],[None,H,None])
    if 'war hammer' in n:
        return True, pat([I,I,I],[I,H,I],[None,H,None])
    if 'scythe' in n:
        return True, pat([H,I,None],[H,I,None],[H,None,None])
    if 'axe' in n and 'battle' not in n and 'hatchet' not in n:
        return True, pat([I,I,None],[I,H,None],[None,H,None])
    if 'shovel' in n:
        return True, pat([None,I,None],[None,H,None],[None,H,None])
    if 'hoe' in n:
        return True, pat([I,I,None],[None,H,None],[None,H,None])
    if 'hatchet' in n or 'hand axe' in n:
        return True, pat([None,I,None],[None,H,None],[None,H,None])
    if 'shears' in n:
        return True, pat([None,I,None],[I,None,None],[None,None,None])
    if 'helmet' in n:
        return True, pat([I,I,I],[I,None,I],[None,None,None])
    if 'chestplate' in n:
        return True, pat([I,None,I],[I,I,I],[I,I,I])
    if 'leggings' in n:
        return True, pat([I,I,I],[I,None,I],[I,None,I])
    if 'boots' in n:
        return True, pat([I,None,I],[I,None,I],[None,None,None])
    if 'bow' in n and len(flat) == 6:
        S = next((x for x in flat if 'stick' in x), flat[0])
        St = next((x for x in flat if x in ['string','leather_rope','straw_rope','silk']), flat[1])
        return True, pat([None,S,St],[S,None,St],[None,S,St])
    if 'arrow' in n and len(flat) == 3:
        return True, pat([None,flat[0],None],[None,flat[1],None],[None,flat[2],None])
    if 'torch' in n and len(flat) == 2:
        return True, pat([None,flat[0],None],[None,flat[1],None],[None,None,None])
    if len(flat) == 9 and len(set(flat)) == 1:
        return True, pat([flat[0],flat[0],flat[0]],[flat[0],flat[0],flat[0]],[flat[0],flat[0],flat[0]])
    return False, None

def parse_ingredients(s):
    parts = re.split(r',\s*', s.strip())
    result = []
    for p in parts:
        p = re.sub(r'\s+x\d+$','',p).strip()
        if p:
            result.append(name_to_id(p))
    return result

def parse_skills(s):
    return re.findall(r'skill\.(\w+)', s)

def extract_line(line):
    m = re.match(r'(?:Recipe\[\d+\]\s+)?(.+?)(?:\s+x(\d+))?\s*:\s*\{([^}]+)\}\s*,\s*difficulty\s*=\s*([\d.]+)(.*)', line.strip())
    if not m: return None
    name = m.group(1).strip()
    qty = int(m.group(2)) if m.group(2) else 1
    ings = parse_ingredients(m.group(3))
    diff = float(m.group(4))
    skills = parse_skills(m.group(5))
    return name, qty, ings, diff, skills

# Parse
with zipfile.ZipFile(r'C:\Users\DAVID\Downloads\MiTE-BE_v0.9.0_hf3.zip','r') as z:
    with z.open('minecraft/MITE/reference/item_recipes.txt') as f:
        content = f.read().decode('utf-8', errors='replace')

lines = content.split('\n')
all_recipes = []

i = 0
while i < len(lines):
    line = lines[i].strip()
    # Multi-recipe block
    m = re.match(r'Item\[(\d+)\]\s+Has\s+\d+\s+recipes?:', line)
    if m:
        item_num = int(m.group(1))
        i += 1
        while i < len(lines):
            sub = lines[i].strip()
            if sub.startswith('Recipe['):
                parsed = extract_line(sub)
                if parsed:
                    name, qty, ings, diff, skills = parsed
                    oid = name_to_id(name)
                    station = get_station(ings)
                    shaped, pattern = get_pattern(name, ings)
                    r = {"id":f"{oid}_{len(all_recipes)}","item_num":item_num,
                         "output":oid,"outputQty":qty,"station":station,
                         "difficulty":diff,"skills":skills,"ingredients":ings,
                         "shaped":shaped}
                    if shaped and pattern: r["pattern"] = pattern
                    all_recipes.append(r)
                i += 1
            elif sub.startswith('Difficulty used for repairs') or sub == '':
                i += 1
            elif re.match(r'Item\[', sub):
                break
            else:
                i += 1
        continue
    # Single recipe
    m2 = re.match(r'Item\[(\d+)\]\s+(.+)', line)
    if m2:
        item_num = int(m2.group(1))
        parsed = extract_line(m2.group(2))
        if parsed:
            name, qty, ings, diff, skills = parsed
            oid = name_to_id(name)
            station = get_station(ings)
            shaped, pattern = get_pattern(name, ings)
            r = {"id":f"{oid}_{len(all_recipes)}","item_num":item_num,
                 "output":oid,"outputQty":qty,"station":station,
                 "difficulty":diff,"skills":skills,"ingredients":ings,
                 "shaped":shaped}
            if shaped and pattern: r["pattern"] = pattern
            all_recipes.append(r)
    i += 1

out_path = r'C:\Users\DAVID\AppData\Roaming\.minecraft\resourcepacks\mite-be-wiki\data\recipes_full.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_recipes, f, ensure_ascii=False, indent=2)

shaped = sum(1 for r in all_recipes if r['shaped'])
print(f"Total: {len(all_recipes)}, Shaped: {shaped}, Shapeless: {len(all_recipes)-shaped}")
print(f"Unique outputs: {len(set(r['output'] if isinstance(r['output'], str) else r['output'][0] for r in all_recipes))}")
print(f"Written to: {out_path}")
