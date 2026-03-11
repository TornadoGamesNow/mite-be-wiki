import itemAliases from '../../data/item_aliases.json';

export type RecipeLike = {
  output: string | string[];
  removed_version?: string;
};

export type ItemLike = {
  removed_in?: string;
};

export type ItemInfoLike = {
  removed?: boolean;
};

const ITEM_ALIASES = itemAliases as Record<string, string>;

const ALIASES_BY_CANONICAL = Object.entries(ITEM_ALIASES).reduce<Record<string, string[]>>(
  (acc, [aliasId, canonicalId]) => {
    if (!acc[canonicalId]) acc[canonicalId] = [];
    acc[canonicalId].push(aliasId);
    return acc;
  },
  {}
);

export function getCanonicalItemId(itemId: string): string {
  let current = itemId;
  while (ITEM_ALIASES[current]) current = ITEM_ALIASES[current];
  return current;
}

export function getItemAliasIds(itemId: string): string[] {
  const canonicalId = getCanonicalItemId(itemId);
  return [canonicalId, ...(ALIASES_BY_CANONICAL[canonicalId] ?? [])];
}

export function getRecipeOutputIds(output: string | string[]): string[] {
  const rawIds = Array.isArray(output) ? output : [output];
  return [...new Set(rawIds.map(getCanonicalItemId).filter(Boolean))];
}

export function getRecipeOutputId(output: string | string[]): string {
  return getRecipeOutputIds(output)[0] ?? '';
}

export function buildRecipesByOutput<T extends RecipeLike>(recipes: T[]): Record<string, T[]> {
  const recipesByOutput: Record<string, T[]> = {};
  for (const recipe of recipes) {
    for (const outputId of getRecipeOutputIds(recipe.output)) {
      if (!recipesByOutput[outputId]) recipesByOutput[outputId] = [];
      recipesByOutput[outputId].push(recipe);
    }
  }
  return recipesByOutput;
}

export function hasActiveRecipe<T extends RecipeLike>(
  itemId: string,
  recipesByOutput: Record<string, T[]>
): boolean {
  return (recipesByOutput[getCanonicalItemId(itemId)] ?? []).some(recipe => !recipe.removed_version);
}

export function isItemRemoved<T extends RecipeLike>(
  itemId: string,
  item: ItemLike | undefined,
  info: ItemInfoLike | undefined,
  recipesByOutput: Record<string, T[]>
): boolean {
  if (info?.removed) return true;
  if (!item?.removed_in) return false;
  return !hasActiveRecipe(itemId, recipesByOutput);
}

export interface MobDropSource {
  mobId: string;
  mobName: { hu: string; en: string; ru?: string };
  qty: string;
  chance: string;
}

export function buildMobDropIndex(
  mobs: { id: string; name: { hu: string; en: string; ru?: string }; drops?: { itemId?: string; qty: string; chance: string }[] }[]
): Record<string, MobDropSource[]> {
  const idx: Record<string, MobDropSource[]> = {};
  for (const mob of mobs) {
    for (const drop of mob.drops ?? []) {
      if (!drop.itemId) continue;
      const cid = getCanonicalItemId(drop.itemId);
      if (!idx[cid]) idx[cid] = [];
      idx[cid].push({ mobId: mob.id, mobName: mob.name, qty: drop.qty, chance: drop.chance });
    }
  }
  return idx;
}

export interface SieveSource {
  source: 'gravel' | 'nether';
  chance: number;
}

export function buildSieveIndex(
  sieveData: Record<string, { itemId: string; chance: number }[]>
): Record<string, SieveSource[]> {
  const idx: Record<string, SieveSource[]> = {};
  for (const [source, drops] of Object.entries(sieveData)) {
    for (const drop of drops) {
      const cid = getCanonicalItemId(drop.itemId);
      if (!idx[cid]) idx[cid] = [];
      idx[cid].push({ source: source as 'gravel' | 'nether', chance: drop.chance });
    }
  }
  return idx;
}

export function buildUsedInIndex<T extends RecipeLike & { ingredients: (string | string[])[] }>(
  recipes: T[]
): Record<string, T[]> {
  const idx: Record<string, T[]> = {};
  for (const recipe of recipes) {
    const seen = new Set<string>();
    for (const ing of recipe.ingredients) {
      const ids = Array.isArray(ing) ? ing : [ing];
      for (const id of ids) seen.add(getCanonicalItemId(id));
    }
    for (const cid of seen) {
      if (!idx[cid]) idx[cid] = [];
      idx[cid].push(recipe);
    }
  }
  return idx;
}
