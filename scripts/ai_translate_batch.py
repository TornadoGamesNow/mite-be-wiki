#!/usr/bin/env python3
"""
AI batch translator for MITE:BE lang keys.
Reads untranslated_cn.json, translates in batches using Claude API,
writes results to ai_overrides.json.

Usage: python scripts/ai_translate_batch.py [--batch-size 80] [--dry-run]

Requires ANTHROPIC_API_KEY environment variable.
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
LANG_WORK = PROJECT_DIR / "lang-work"

UNTRANSLATED_FILE = LANG_WORK / "untranslated_cn.json"
AI_OVERRIDES_FILE = LANG_WORK / "ai_overrides.json"

SYSTEM_PROMPT = """You are translating a Minecraft mod (MITE:BE) from Chinese to English.

Rules:
1. Translate naturally — this is a game, keep it fun and readable
2. NEVER change placeholders: %s, %d, %1$s, %2$s, %%, \\n, \\r\\n
3. NEVER change §x color codes (like §3, §a, §r, §l etc.)
4. Keep the same number and type of placeholders as the original
5. For achievement names: keep them short and punchy
6. For achievement descriptions: translate the meaning, keep the tone
7. For UI text: be concise and standard (use common Minecraft English terms)
8. For death messages: follow Minecraft death message style ("X was slain by Y")
9. Use standard Minecraft English terminology:
   - 熔炉=Furnace, 工作台=Crafting Table, 附魔台=Enchanting Table
   - 下界=Nether, 末地=The End, 主世界=Overworld
   - 经验=XP/Experience, 耐久=Durability
   - 秘银=Mithril, 精金=Adamantium, 远古金属=Ancient Metal
   - 青铜=Bronze, 银铜=Silver-Copper, 高碳钢=High Carbon Steel
   - 硬石=Obsite (mod-specific), 下界合金=Netherite

Return ONLY a JSON object mapping each key to its English translation.
No explanations, no markdown, just the JSON object."""


def translate_batch(client, batch, model="claude-sonnet-4-20250514"):
    """Translate a batch of key→CN pairs, return key→EN dict."""
    prompt = f"Translate these Minecraft mod strings from Chinese to English:\n\n```json\n{json.dumps(batch, ensure_ascii=False, indent=2)}\n```"

    response = client.messages.create(
        model=model,
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text.strip()
    # Strip markdown code block if present
    if text.startswith("```"):
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        print(f"  WARNING: Failed to parse API response as JSON")
        print(f"  Response: {text[:200]}...")
        return {}

    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=80)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--model", default="claude-sonnet-4-20250514")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.dry_run:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable")
        sys.exit(1)

    # Load untranslated
    with open(UNTRANSLATED_FILE, "r", encoding="utf-8") as f:
        untranslated = json.load(f)

    # Load existing overrides
    if AI_OVERRIDES_FILE.exists():
        with open(AI_OVERRIDES_FILE, "r", encoding="utf-8") as f:
            existing = json.load(f)
    else:
        existing = {}

    # Skip already translated
    to_translate = {k: v for k, v in untranslated.items() if k not in existing}
    print(f"Total untranslated: {len(untranslated)}")
    print(f"Already in ai_overrides: {len(existing)}")
    print(f"Remaining to translate: {len(to_translate)}")

    if not to_translate:
        print("Nothing to translate!")
        return

    # Sort and batch
    keys = sorted(to_translate.keys())
    batches = []
    for i in range(0, len(keys), args.batch_size):
        batch_keys = keys[i:i + args.batch_size]
        batch = {k: to_translate[k] for k in batch_keys}
        batches.append(batch)

    print(f"Batches: {len(batches)} (size {args.batch_size})")

    if args.dry_run:
        print("\nDry run — showing first batch:")
        first = batches[0]
        print(f"  Keys: {len(first)}")
        for k in list(first.keys())[:5]:
            print(f"  {k}: {first[k][:50]}")
        return

    client = anthropic.Anthropic(api_key=api_key)
    all_translations = dict(existing)

    for i, batch in enumerate(batches):
        print(f"\nBatch {i+1}/{len(batches)} ({len(batch)} keys)...")
        try:
            result = translate_batch(client, batch, model=args.model)
            all_translations.update(result)
            print(f"  Translated {len(result)} keys")

            # Save after each batch
            with open(AI_OVERRIDES_FILE, "w", encoding="utf-8") as f:
                json.dump(all_translations, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"  ERROR: {e}")
            print("  Saving progress and stopping...")
            break

        # Rate limit
        if i < len(batches) - 1:
            time.sleep(2)

    print(f"\nTotal translations: {len(all_translations)}")
    print(f"Saved to: {AI_OVERRIDES_FILE}")


if __name__ == "__main__":
    main()
