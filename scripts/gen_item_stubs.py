#!/usr/bin/env python3
"""Generate stub entries for items missing from items.json but present in recipes_full.json"""
import json, pathlib

BASE = pathlib.Path("C:/Users/DAVID/AppData/Roaming/.minecraft/resourcepacks/mite-be-wiki")
recipes_path = BASE / "data/recipes_full.json"
items_path = BASE / "data/items.json"

with open(recipes_path, encoding="utf-8") as f:
    recipes = json.load(f)

with open(items_path, encoding="utf-8") as f:
    items = json.load(f)

def add_id(s, val):
    if not val:
        return
    if isinstance(val, list):
        for v in val:
            add_id(s, v)
    else:
        s.add(val)

# Collect all IDs from recipes
all_ids = set()
for r in recipes:
    add_id(all_ids, r["output"])
    for ing in r.get("ingredients", []):
        add_id(all_ids, ing)
    for row in (r.get("pattern") or []):
        for cell in row:
            add_id(all_ids, cell)

missing = sorted(all_ids - set(items.keys()))
print(f"Total IDs in recipes: {len(all_ids)}")
print(f"Already in items.json: {len(all_ids) - len(missing)}")
print(f"Missing (stubs needed): {len(missing)}")

added = 0
for mid in missing:
    items[mid] = {
        "name": {"hu": mid, "en": mid},
        "img": "",
        "tier": None
    }
    added += 1

with open(items_path, "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f"Added {added} stub entries to items.json")
