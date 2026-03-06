/** A single slot can be a fixed item ID, or an array of alternative item IDs that cycle. "_" means empty. */
export type SlotValue = string | string[];

/** 2D grid pattern — rows × columns, each cell is a SlotValue. */
export type RecipePattern = SlotValue[][];

export interface Recipe {
  id: string;
  output: string;
  station: string;
  gridSize: string;
  pattern: RecipePattern;
  label: { hu: string; en: string };
  tags?: string[];
  tooltip?: { hu: string; en: string };
  outputCount?: number;
  difficulty?: number;
  skill?: string;
}

export interface Drop {
  itemId: string;
  name: { hu: string; en: string };
  chance?: string;
  quantity?: string;
}

export interface Mob {
  id: string;
  name: { hu: string; en: string };
  hp: number;
  dmgMin: number;
  dmgMax: number;
  xp: number;
  armor?: number;
  difficulty?: number;
  image: string | null;
  spawnZones: string[];
  drops?: Drop[];
  special?: { hu: string; en: string };
}
