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
