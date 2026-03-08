import { useState, useMemo, useEffect, useRef } from 'react';
import recipesData from '../../data/recipes_full.json';
import itemsData from '../../data/items.json';
import { getCurrentLang, onLangChange } from '../i18n/lang';

type FullRecipe = {
  id: string;
  item_num: number;
  output: string | string[];
  outputQty: number;
  station: string;
  difficulty: number;
  skills: string[];
  ingredients: (string | string[])[];
  shaped: boolean;
  pattern?: (string | null)[][] | null;
};

type OutputGroup = {
  outputId: string;
  allOutputIds: string[];
  recipes: FullRecipe[];
  hasShapedVariant: boolean;
  hasShapelessVariant: boolean;
  primaryRecipe: FullRecipe;
};

type ItemEntry = {
  name: { hu: string; en: string; ru?: string };
  img: string;
  tier: string | null;
  removed_in?: string;
};

const recipes = recipesData as unknown as FullRecipe[];
const items = itemsData as unknown as Record<string, ItemEntry>;

const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';


function toTitleCase(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getItemName(id: string, lang: 'hu' | 'en' | 'ru'): string {
  const entry = items[id];
  if (!entry) return toTitleCase(id);
  const name = (entry.name as any)?.[lang] ?? entry.name?.en;
  if (!name || name === id) return toTitleCase(id);
  return name;
}

function getItemImg(id: string): string {
  return items[id]?.img || '';
}

function genericItemName(ids: string[], lang: 'hu' | 'en' | 'ru'): string {
  const names = ids.map(id => getItemName(id, lang)).filter(Boolean);
  if (names.length <= 1) return names[0] ?? '';
  const wordArrays = names.map(n => n.split(' '));
  const minLen = Math.min(...wordArrays.map(w => w.length));
  let commonSuffix: string[] = [];
  for (let i = 1; i <= minLen; i++) {
    const candidate = wordArrays.map(w => w[w.length - i]);
    if (candidate.every(w => w === candidate[0])) {
      commonSuffix.unshift(candidate[0]);
    } else break;
  }
  return commonSuffix.length > 0 ? commonSuffix.join(' ') : names[0];
}

function flattenIngredient(ing: string | string[]): string {
  return Array.isArray(ing) ? ing[0] : ing;
}

function flattenIngredients(ings: (string | string[])[]): string[] {
  return ings.map(flattenIngredient);
}

function ItemIcon({ id, size = 32 }: { id: string; size?: number }) {
  const img = getItemImg(id);
  if (img) {
    return (
      <img
        src={`${BASE}/${img}`}
        alt={id}
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated', objectFit: 'contain', width: size, height: size, flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, background: '#444', borderRadius: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size > 24 ? '1em' : '0.7em', color: '#777', flexShrink: 0,
    }}>📦</div>
  );
}

// Global synchronized tick — all cycling slots advance together
let _globalTick = 0;
const _tickListeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  setInterval(() => { _globalTick++; _tickListeners.forEach(fn => fn()); }, 1200);
}
function useCycleIndex(n: number): number {
  const [tick, setTick] = useState(_globalTick);
  useEffect(() => {
    if (n <= 1) return;
    const fn = () => setTick(_globalTick);
    _tickListeners.add(fn);
    return () => { _tickListeners.delete(fn); };
  }, [n]);
  return tick % n;
}

function CyclingItemIcon({ id, size = 32 }: { id: string | string[]; size?: number }) {
  const arr = Array.isArray(id) ? id.filter(Boolean) : [id];
  const idx = useCycleIndex(arr.length);
  return <ItemIcon id={arr[idx] || ''} size={size} />;
}

function shapelessToGrid(ingredients: (string | string[])[]): (string | string[] | null)[][] {
  const grid: (string | string[] | null)[][] = Array.from({ length: 3 }, () => [null, null, null]);
  ingredients.slice(0, 9).forEach((ing, i) => {
    grid[Math.floor(i / 3)][i % 3] = ing;
  });
  return grid;
}

const CELL = 28;
const RESULT_ICON = 40;

// #8: CSS keyframe via injected style tag
const ARROW_ANIM_ID = 'mite-arrow-anim';
if (typeof document !== 'undefined' && !document.getElementById(ARROW_ANIM_ID)) {
  const s = document.createElement('style');
  s.id = ARROW_ANIM_ID;
  s.textContent = `
    @keyframes arrowPulse {
      0%   { opacity: 1; transform: translateX(0); }
      50%  { opacity: .5; transform: translateX(4px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    .output-card:hover .card-arrow { animation: arrowPulse .7s ease-in-out infinite; }

    /* Custom scrollbar */
    .sandbox-picker::-webkit-scrollbar, .modal-list::-webkit-scrollbar { width: 5px; }
    .sandbox-picker::-webkit-scrollbar-track, .modal-list::-webkit-scrollbar-track { background: transparent; }
    .sandbox-picker::-webkit-scrollbar-thumb, .modal-list::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    .sandbox-picker::-webkit-scrollbar-thumb:hover, .modal-list::-webkit-scrollbar-thumb:hover { background: #666; }

    /* Selected item glow pulse */
    @keyframes selectedGlow {
      0%, 100% { box-shadow: 0 0 0 2px var(--gold), 0 0 6px rgba(240,192,64,.45); }
      50%       { box-shadow: 0 0 0 2px var(--gold), 0 0 14px rgba(240,192,64,.75); }
    }
    .picker-item-selected { animation: selectedGlow 1.6s ease-in-out infinite; }

    /* Result match pop-in */
    @keyframes resultPop {
      0%   { opacity: 0; transform: scale(.88) translateY(6px); }
      60%  { opacity: 1; transform: scale(1.04) translateY(-2px); }
      100% { transform: scale(1) translateY(0); }
    }
    .result-match { animation: resultPop .28s cubic-bezier(.22,.68,0,1.2) both; }
    @keyframes modalPop {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.88); }
      60%  { opacity: 1; transform: translate(-50%,-50%) scale(1.03); }
      100% { transform: translate(-50%,-50%) scale(1); }
    }
  `;
  document.head.appendChild(s);
}

// ── Furnace-type grid components ─────────────────────────────────────────
const SS = 34; // smelting slot size (mini cards)
const SD = 40; // smelting slot size (detail panel)
function makeSlot(size: number, gold?: boolean): React.CSSProperties {
  return {
    width: size, height: size, position: 'relative', flexShrink: 0,
    background: gold ? '#6b5a1a' : '#8b8b8b',
    border: `1px solid ${gold ? '#9a8030' : '#555'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: gold
      ? 'inset 1px 1px 0 rgba(255,220,80,.15), inset -1px -1px 0 rgba(0,0,0,.35)'
      : 'inset 1px 1px 0 rgba(255,255,255,.08), inset -1px -1px 0 rgba(0,0,0,.25)',
  };
}

function CountBadge({ n, mini }: { n: number; mini?: boolean }) {
  if (n <= 1) return null;
  return <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: mini ? '.48em' : '.58em', color: 'white', fontWeight: 700, textShadow: '0 0 2px black', lineHeight: 1 }}>{n}</span>;
}

/** blast_furnace mini card: input top → 🔥 → alloy bottom (Minecraft furnace UI) */
function SmeltingMini({ recipe }: { recipe: FullRecipe }) {
  const flat = flattenIngredients(recipe.ingredients);
  const input = flat[0] || null;
  const material = flat[1] || null;
  const materialCount = recipe.ingredients.filter(i => flattenIngredient(i) === (material || '')).length;
  return (
    <div style={{ background: '#2e1e06', padding: '4px 6px', borderRadius: 5, border: '1px solid #6b4a10', boxShadow: 'inset 0 1px 5px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={makeSlot(SS)}>{input && <ItemIcon id={input} size={SS - 6} />}</div>
      <div style={{ fontSize: '.6em', color: '#ff8800', lineHeight: 1 }}>🔥</div>
      <div style={makeSlot(SS, true)}>{material && <ItemIcon id={material} size={SS - 6} />}<CountBadge n={materialCount} mini /></div>
    </div>
  );
}

/** stone_furnace mini card: input → 🔥 → (fuel) – same height as SmeltingMini */
function FurnaceMini({ recipe }: { recipe: FullRecipe }) {
  const input = flattenIngredients(recipe.ingredients)[0] || null;
  return (
    <div style={{ background: '#221208', padding: '4px 6px', borderRadius: 5, border: '1px solid #5a3a28', boxShadow: 'inset 0 1px 5px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={makeSlot(SS)}>{input && <ItemIcon id={input} size={SS - 6} />}</div>
      <div style={{ fontSize: '.6em', color: '#ff7700', lineHeight: 1 }}>🔥</div>
      <div style={{ ...makeSlot(SS), opacity: 0.25 }} />
    </div>
  );
}

const LABEL: React.CSSProperties = { fontSize: '.52em', color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1 };

/** blast_furnace detail panel */
function SmeltingDetail({ recipe }: { recipe: FullRecipe }) {
  const flat = flattenIngredients(recipe.ingredients);
  const input = flat[0] || null;
  const material = flat[1] || null;
  const materialCount = recipe.ingredients.filter(i => flattenIngredient(i) === (material || '')).length;
  return (
    <div style={{ background: '#2e1e06', padding: '8px 10px', borderRadius: 7, border: '2px solid #6b4a10', boxShadow: 'inset 0 2px 8px rgba(0,0,0,.6)', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={makeSlot(SD)}>{input && <ItemIcon id={input} size={SD - 8} />}</div>
      <div style={{ fontSize: '1em', color: '#ff8800', lineHeight: 1 }}>🔥</div>
      <div style={makeSlot(SD, true)}>{material && <ItemIcon id={material} size={SD - 8} />}<CountBadge n={materialCount} /></div>
    </div>
  );
}

/** stone_furnace detail panel */
function FurnaceDetail({ recipe }: { recipe: FullRecipe }) {
  const input = flattenIngredients(recipe.ingredients)[0] || null;
  return (
    <div style={{ background: '#221208', padding: '8px 10px', borderRadius: 7, border: '2px solid #5a3a28', boxShadow: 'inset 0 2px 8px rgba(0,0,0,.6)', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={makeSlot(SD)}>{input && <ItemIcon id={input} size={SD - 8} />}</div>
      <div style={{ fontSize: '1em', color: '#ff7700', lineHeight: 1 }}>🔥</div>
    </div>
  );
}

// Fix szélességű ingredient blokk — minden recept típusnál ugyanott lesz a result ikon
const INGR_W = 96; // 3×3 grid szélessége: 3×28 + 2×1(gap) + 2×3(padding) + 2×1(border) ≈ 96px

function MiniGrid({ recipe, outputId, outputQty }: { recipe: FullRecipe; outputId: string | string[]; outputQty?: number }) {
  const resultSlot = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      <div style={{ width: RESULT_ICON, height: RESULT_ICON, background: '#6b6b3b', border: '2px solid', borderColor: '#f0c040 #886600 #886600 #f0c040', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CyclingItemIcon id={outputId} size={RESULT_ICON - 8} />
      </div>
      {outputQty && outputQty > 1 && <span style={{ fontSize: '.7em', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>×{outputQty}</span>}
    </div>
  );

  const arrow = <span className="card-arrow" style={{ fontSize: '1.1em', color: '#f0c040', flexShrink: 0, fontWeight: 700 }}>➜</span>;

  const row = (content: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: INGR_W, height: INGR_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </div>
      {arrow}
      {resultSlot}
    </div>
  );

  if (recipe.station === 'blast_furnace' || recipe.station === 'stone_furnace') {
    const FurnaceComp = recipe.station === 'blast_furnace' ? SmeltingMini : FurnaceMini;
    return row(<FurnaceComp recipe={recipe} />);
  }

  const grid = recipe.shaped && recipe.pattern
    ? recipe.pattern
    : shapelessToGrid(recipe.ingredients);
  const cols = recipe.station === 'hand' && grid[0]?.length === 2 ? 2 : 3;
  const flat = flattenIngredients(recipe.ingredients);
  const extra = flat.length > 9 ? flat.length - 9 : 0;

  return row(
    <div>
      <div style={{
        background: 'linear-gradient(135deg,#7a5518 0%,#5c3d0b 55%,#6b4a10 100%)',
        padding: 3, borderRadius: 4,
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,.55)',
        border: '1px solid #3d2606',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
          gridTemplateRows: `repeat(${cols}, ${CELL}px)`,
          gap: 1,
        }}>
          {grid.map((gridRow, ri) =>
            gridRow.map((cell, ci) => (
              <div key={`${ri}-${ci}`} style={{
                width: CELL, height: CELL,
                background: '#8b8b8b', border: '1px solid #555',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.08), inset -1px -1px 0 rgba(0,0,0,.25)',
              }}>
                {cell && cell !== '_' && <CyclingItemIcon id={cell} size={CELL - 6} />}
              </div>
            ))
          )}
        </div>
      </div>
      {extra > 0 && <div style={{ fontSize: '.55em', color: 'var(--text2)', marginTop: 1 }}>+{extra}</div>}
    </div>
  );
}

function getOutputId(output: string | string[]): string {
  return Array.isArray(output) ? output[0] : output;
}

function groupByOutput(recs: FullRecipe[]): OutputGroup[] {
  const map = new Map<string, FullRecipe[]>();
  for (const r of recs) {
    const key = getOutputId(r.output);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const groups: OutputGroup[] = [];
  for (const [outputId, rs] of map) {
    const hasShaped = rs.some(r => r.shaped);
    const hasShapeless = rs.some(r => !r.shaped);
    const primary = rs.find(r => r.shaped) || rs[0];
    const allOutputIds = [...new Set(rs.flatMap(r => Array.isArray(r.output) ? r.output : [r.output]))];
    groups.push({ outputId, allOutputIds, recipes: rs, hasShapedVariant: hasShaped, hasShapelessVariant: hasShapeless, primaryRecipe: primary });
  }
  return groups.sort((a, b) => String(a.outputId).localeCompare(String(b.outputId)));
}

function matchShaped(grid: (string | null)[][], recs: FullRecipe[]): FullRecipe[] {
  return recs.filter(r => r.shaped && r.pattern).filter(r =>
    r.pattern!.every((row, ri) => row.every((_cell, ci) =>
      (_cell ?? null) === (grid[ri]?.[ci] ?? null)
    ))
  );
}

function matchShapeless(grid: (string | null)[][], recs: FullRecipe[]): FullRecipe[] {
  const placed = grid.flat().filter((x): x is string => Boolean(x)).sort();
  if (placed.length === 0) return [];
  return recs.filter(r => !r.shaped).filter(r => {
    const needed = flattenIngredients(r.ingredients).sort();
    return JSON.stringify(placed) === JSON.stringify(needed);
  });
}

function buildTooltip(g: OutputGroup, lang: 'hu' | 'en' | 'ru'): string {
  const r = g.primaryRecipe;
  const ings = flattenIngredients(r.ingredients);
  const counts = new Map<string, number>();
  for (const id of ings) counts.set(id, (counts.get(id) || 0) + 1);
  const ingList = [...counts.entries()]
    .map(([id, cnt]) => `${cnt > 1 ? cnt + '× ' : ''}${getItemName(id, lang)}`)
    .join('\n');
  const extra = ings.length > 9 ? `\n+${ings.length - 9} more` : '';
  return `${getItemName(g.outputId, lang)}\n\n${lang === 'hu' ? 'Hozzávalók' : lang === 'ru' ? 'Ингредиенты' : 'Ingredients'}:\n${ingList}${extra}`;
}

// Groups that USE a given ingredient
function getUsedInGroups(ingredientId: string): OutputGroup[] {
  return allGroups.filter(g =>
    g.recipes.some(r => flattenIngredients(r.ingredients).includes(ingredientId))
  );
}

// Groups that PRODUCE a given item (i.e., it IS the output)
function getCraftingGroups(itemId: string): OutputGroup[] {
  return allGroups.filter(g => g.allOutputIds.includes(itemId));
}

// Merge alias groups: same-named items where one has removed_in → merge into active group
function mergeAliasGroups(groups: OutputGroup[]): OutputGroup[] {
  const nameToActive = new Map<string, OutputGroup>();
  for (const g of groups) {
    if (!items[g.outputId]?.removed_in) {
      const nameEn = getItemName(g.outputId, 'en').toLowerCase();
      if (!nameToActive.has(nameEn)) nameToActive.set(nameEn, g);
    }
  }
  const merged = new Set<string>();
  for (const g of groups) {
    if (!items[g.outputId]?.removed_in) continue;
    const nameEn = getItemName(g.outputId, 'en').toLowerCase();
    const activeGroup = nameToActive.get(nameEn);
    if (activeGroup) {
      const tagged = g.recipes.map(r => ({ ...r, _mergedFromId: g.outputId } as FullRecipe & { _mergedFromId: string }));
      activeGroup.recipes.push(...tagged);
      merged.add(g.outputId);
    }
  }
  return groups.filter(g => !merged.has(g.outputId));
}

const allGroups = mergeAliasGroups(groupByOutput(recipes));
const allStations = [...new Set(recipes.map(r => r.station))].sort();
const allSkills = [...new Set(recipes.flatMap(r => r.skills))].sort();

const STATION_LABELS: Record<string, { hu: string; en: string; ru: string }> = {
  hand:                    { hu: 'Kézzel',                    en: 'By hand',                  ru: 'Руками' },
  flint_workbench:         { hu: 'Kovakő Munkaasztal',        en: 'Flint Workbench',           ru: 'Кремниевый верстак' },
  copper_workbench:        { hu: 'Réz Munkaasztal',           en: 'Copper Workbench',          ru: 'Медный верстак' },
  silver_workbench:        { hu: 'Ezüst Munkaasztal',         en: 'Silver Workbench',          ru: 'Серебряный верстак' },
  gold_workbench:          { hu: 'Arany Munkaasztal',         en: 'Gold Workbench',            ru: 'Золотой верстак' },
  iron_workbench:          { hu: 'Vas Munkaasztal',           en: 'Iron Workbench',            ru: 'Железный верстак' },
  hardstone_workbench:     { hu: 'Kőmag Munkaasztal',         en: 'Hardstone Workbench',       ru: 'Верстак из твёрдого камня' },
  ancient_metal_workbench: { hu: 'Ős Fém Munkaasztal',        en: 'Ancient Metal Workbench',   ru: 'Верстак из древнего металла' },
  mithril_workbench:       { hu: 'Mithril Munkaasztal',       en: 'Mithril Workbench',         ru: 'Мифриловый верстак' },
  adamantium_workbench:    { hu: 'Adamantium Munkaasztal',    en: 'Adamantium Workbench',      ru: 'Адамантиевый верстак' },
  stone_furnace:           { hu: 'Kő Kemence',                en: 'Stone Furnace',             ru: 'Каменная печь' },
  blast_furnace:           { hu: 'Nagy Kemence (Olvasztó)',   en: 'Blast Furnace',             ru: 'Доменная печь' },
  obsidian_furnace:        { hu: 'Obszidián Kemence',         en: 'Obsidian Furnace',          ru: 'Обсидиановая печь' },
  netherrack_furnace:      { hu: 'Pokoli Kő Kemence',         en: 'Netherrack Furnace',        ru: 'Печь из адского камня' },
  cauldron:                { hu: 'Üst',                       en: 'Cauldron',                  ru: 'Котёл' },
  brewing_stand:           { hu: 'Főzetállvány',              en: 'Brewing Stand',             ru: 'Стойка для зелий' },
};

const SKILL_LABELS: Record<string, { hu: string; en: string; ru: string }> = {
  blacksmithing:   { hu: 'Kovácsmesterség', en: 'Blacksmithing',    ru: 'Кузнечное дело' },
  carpentry:       { hu: 'Ácsmesterség',    en: 'Carpentry',        ru: 'Плотницкое дело' },
  fineArts:        { hu: 'Finom Mesterség', en: 'Fine Arts',        ru: 'Тонкое мастерство' },
  foodPreparation: { hu: 'Ételkészítés',    en: 'Food Preparation', ru: 'Приготовление пищи' },
  masonry:         { hu: 'Kőfaragás',       en: 'Masonry',          ru: 'Каменщик' },
  brewing:         { hu: 'Főzőmesterség',   en: 'Brewing',          ru: 'Зельеварение' },
  archery:         { hu: 'Íjászat',         en: 'Archery',          ru: 'Стрельба из лука' },
  tinkering:       { hu: 'Barkácsolás',     en: 'Tinkering',        ru: 'Механик' },
  fishing:         { hu: 'Horgászat',       en: 'Fishing',          ru: 'Рыбалка' },
  farming:         { hu: 'Gazdálkodás',     en: 'Farming',          ru: 'Фермерство' },
  mining:          { hu: 'Bányászat',       en: 'Mining',           ru: 'Горное дело' },
  blacksmith:      { hu: 'Kovács',          en: 'Blacksmith',       ru: 'Кузнец' },
  smelting:        { hu: 'Olvasztás',       en: 'Smelting',         ru: 'Плавка' },
};

// ── Shared sub-tab bar ────────────────────────────────────────────────────
function SubTabs({ tabs, active, onSelect }: {
  tabs: { id: string; label: string; count: number }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          style={{
            padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '.82em',
            border: `1px solid ${active === t.id ? 'var(--gold)' : 'var(--surface2)'}`,
            background: active === t.id ? 'rgba(240,192,64,.12)' : 'var(--surface2)',
            color: active === t.id ? 'var(--gold)' : 'var(--text2)',
            fontWeight: active === t.id ? 600 : 400,
          }}
        >
          {t.label} <span style={{ opacity: .7 }}>({t.count})</span>
        </button>
      ))}
    </div>
  );
}

// ── Ingredient row ────────────────────────────────────────────────────────
function IngredientRow({ id, lang, onClickIngredient }: {
  id: string | string[]; lang: 'hu' | 'en' | 'ru'; onClickIngredient: (id: string) => void;
}) {
  const primaryId = Array.isArray(id) ? id[0] : id;
  const displayName = Array.isArray(id) ? genericItemName(id, lang) : getItemName(id, lang);
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClickIngredient(primaryId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, flex: 1,
        padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
        background: hov ? 'var(--surface2)' : 'transparent',
        border: `1px solid ${hov ? 'var(--gold)' : 'transparent'}`,
        transition: 'background .1s, border-color .1s',
      }}
    >
      <div style={{
        width: 34, height: 34, background: 'var(--surface2)',
        border: '1px solid #555', borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <CyclingItemIcon id={id} size={26} />
      </div>
      <span style={{ fontSize: '.84em', lineHeight: 1.2, flex: 1 }}>{displayName}</span>
      {hov && <span style={{ fontSize: '.7em', color: 'var(--text2)', flexShrink: 0 }}>→</span>}
    </div>
  );
}

// ── Recipe compact row (for "used in" / "crafting" lists) ─────────────────
function RecipeListItem({ group, lang, onSelect }: {
  group: OutputGroup; lang: 'hu' | 'en' | 'ru'; onSelect: (id: string) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onSelect(group.outputId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
        background: hov ? 'var(--surface2)' : 'transparent',
        border: `1px solid ${hov ? 'var(--gold)' : 'transparent'}`,
        transition: 'background .1s, border-color .1s',
      }}
    >
      <CyclingItemIcon id={group.primaryRecipe.output} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '.85em', fontWeight: 500 }}>
          {getItemName(group.outputId, lang)}
          {items[group.outputId]?.removed_in && (
            <span style={{ marginLeft: 5, fontSize: '.75em', color: '#ff6b6b', fontWeight: 600 }}>
              ⚠️ v{items[group.outputId].removed_in}
            </span>
          )}
        </div>
        <div style={{ fontSize: '.72em', color: 'var(--text2)' }}>{group.primaryRecipe.station}</div>
      </div>
      {group.recipes.length > 1 && (
        <span style={{ fontSize: '.7em', color: 'var(--gold)', flexShrink: 0 }}>×{group.recipes.length}</span>
      )}
    </div>
  );
}

// ── Item detail panel (ingredient view) ───────────────────────────────────
// Single scrolling page: craft preview (if craftable) + used-in list
function ItemDetailPanel({ itemId, lang, onClose, onSelectGroup }: {
  itemId: string; lang: 'hu' | 'en' | 'ru';
  onClose: () => void; onSelectGroup: (id: string) => void;
}) {
  const usedIn = useMemo(() => getUsedInGroups(itemId), [itemId]);
  const craftingGroup = useMemo(() => getCraftingGroups(itemId)[0] ?? null, [itemId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Sub-header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
        paddingBottom: 12, borderBottom: '1px solid var(--surface2)',
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: '1px solid var(--surface2)', borderRadius: 5,
            color: 'var(--text2)', fontSize: '.82em', cursor: 'pointer',
            padding: '4px 10px', lineHeight: 1, whiteSpace: 'nowrap',
          }}
        >
          ← {lang === 'hu' ? 'Vissza' : lang === 'ru' ? 'Назад' : 'Back'}
        </button>
        <ItemIcon id={itemId} size={32} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '.95em' }}>{getItemName(itemId, lang)}</div>
          <div style={{ fontSize: '.7em', color: 'var(--text2)', fontFamily: 'monospace' }}>{itemId}</div>
        </div>
      </div>

      {/* Craft recipe block (if craftable) */}
      {craftingGroup && (() => {
        const r = craftingGroup.primaryRecipe;
        const grid = r.shaped && r.pattern ? r.pattern : shapelessToGrid(r.ingredients);
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '.8em', fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {lang === 'hu' ? 'Craftolás' : lang === 'ru' ? 'Крафт' : 'Crafting'}
              {craftingGroup.recipes.length > 1 && (
                <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--gold)', textTransform: 'none' }}>({craftingGroup.recipes.length} variáns)</span>
              )}
            </div>
            <div style={{
              background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              border: '1px solid transparent',
            }}
              onClick={() => { onSelectGroup(craftingGroup.outputId); onClose(); }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
              title={lang === 'hu' ? 'Recept megnyitása' : lang === 'ru' ? 'Открыть рецепт' : 'Open recipe'}
            >
              {/* mini craft grid */}
              <div style={{
                background: 'linear-gradient(135deg,#7a5518 0%,#5c3d0b 55%,#6b4a10 100%)',
                padding: 3, borderRadius: 4, flexShrink: 0,
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,.5)',
                border: '1px solid #3d2606',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 26px)',
                  gridTemplateRows: 'repeat(3, 26px)',
                  gap: 1,
                }}>
                  {grid.map((row, ri) =>
                    row.map((cell, ci) => (
                      <div key={`${ri}-${ci}`} style={{
                        width: 26, height: 26, background: '#8b8b8b', border: '1px solid #555',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.07), inset -1px -1px 0 rgba(0,0,0,.25)',
                      }}>
                        {cell && cell !== '_' && <CyclingItemIcon id={cell} size={20} />}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <span style={{ fontSize: '1.1em', color: '#f0c040', fontWeight: 700, flexShrink: 0 }}>➜</span>
              <div style={{
                width: 44, height: 44, background: '#6b6b3b', flexShrink: 0,
                border: '2px solid', borderColor: '#f0c040 #886600 #886600 #f0c040',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ItemIcon id={itemId} size={34} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.8em', color: 'var(--text2)', lineHeight: 1.7 }}>
                  {(r as any).removed_version && <div style={{ color: '#ff6b6b', fontWeight: 600 }}>⚠️ v{(r as any).removed_version}</div>}
                  {(r as any).added_version && <div style={{ color: '#6bcb77' }}>✅ v{(r as any).added_version}+</div>}
                  <div>🏭 {r.station}</div>
                  {!r.shaped && <div><span className="badge-shapeless">🔀 {lang === 'hu' ? 'Szabad' : lang === 'ru' ? 'Без формы' : 'Shapeless'}</span></div>}
                  {r.outputQty > 1 && <div>📦 ×{r.outputQty}</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Used-in list */}
      <div style={{ fontSize: '.8em', fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {lang === 'hu' ? `Felhasználva (${usedIn.length})` : lang === 'ru' ? `Используется (${usedIn.length})` : `Used in (${usedIn.length})`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {usedIn.length === 0 ? (
          <div style={{ fontSize: '.85em', color: 'var(--text2)' }}>
            {lang === 'hu' ? 'Nem szerepel egyetlen receptben sem.' : lang === 'ru' ? 'Не используется ни в одном рецепте.' : 'Not used in any recipe.'}
          </div>
        ) : (
          usedIn.map(g => (
            <RecipeListItem key={g.outputId} group={g} lang={lang}
              onSelect={id => { onSelectGroup(id); onClose(); }} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────
function DetailDrawer({ group, lang, onClose, onSelectGroup, onBackToSandbox }: {
  group: OutputGroup; lang: 'hu' | 'en' | 'ru'; onClose: () => void; onSelectGroup: (id: string) => void;
  onBackToSandbox?: () => void;
}) {
  const [itemDetailId, setItemDetailId] = useState<string | null>(null);

  useEffect(() => { setItemDetailId(null); }, [group.outputId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { itemDetailId ? setItemDetailId(null) : onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, itemDetailId]);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
        backdropFilter: 'blur(2px)',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, maxWidth: '96vw',
        background: 'var(--surface)', borderLeft: '1px solid var(--surface2)',
        zIndex: 201, overflowY: 'auto', padding: '22px 24px',
        boxShadow: '-12px 0 40px rgba(0,0,0,.7)',
      }}>
        {itemDetailId ? (
          <ItemDetailPanel
            itemId={itemDetailId}
            lang={lang}
            onClose={() => setItemDetailId(null)}
            onSelectGroup={(id) => { onSelectGroup(id); setItemDetailId(null); }}
          />
        ) : (
          <>
            {/* Header */}
            {onBackToSandbox && (
              <button
                onClick={onBackToSandbox}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14,
                  background: 'rgba(240,192,64,.1)', border: '1px solid rgba(240,192,64,.3)',
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                  color: 'var(--gold)', fontSize: '.78em', fontWeight: 600,
                }}
              >
                ← {lang === 'hu' ? 'Vissza a sandboxhoz' : lang === 'ru' ? 'Назад к песочнице' : 'Back to sandbox'}
              </button>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CyclingItemIcon id={group.primaryRecipe.output} size={48} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.18em', lineHeight: 1.25 }}>
                    {getItemName(group.outputId, lang)}
                  </div>
                  {items[group.outputId]?.removed_in && (
                    <div style={{ marginTop: 4, fontSize: '.8em', color: '#ff6b6b', fontWeight: 600, background: 'rgba(255,107,107,.12)', padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
                      ⚠️ {lang === 'hu' ? `Eltávolítva: v${items[group.outputId].removed_in}` : lang === 'ru' ? `Удалено в v${items[group.outputId].removed_in}` : `Removed in v${items[group.outputId].removed_in}`}
                    </div>
                  )}
                  <div style={{ fontSize: '.72em', color: 'var(--text2)', marginTop: 4, fontFamily: 'monospace' }}>
                    {group.outputId}
                  </div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.4em', cursor: 'pointer', lineHeight: 1, padding: '0 2px', flexShrink: 0 }} title="Close (Esc)">✕</button>
            </div>
            <div style={{ height: 1, background: 'var(--surface2)', marginBottom: 20 }} />

            {/* Recipe variants */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {group.recipes.map((r, i) => {
                const grid = r.shaped && r.pattern ? r.pattern : shapelessToGrid(r.ingredients);
                const flat = flattenIngredients(r.ingredients);
                const extra = flat.length > 9 ? flat.length - 9 : 0;
                const ingCounts = new Map<string, number>();
                for (const id of flat) ingCounts.set(id, (ingCounts.get(id) || 0) + 1);
                // Unique ingredients preserving array type for display
                const seenIngKeys = new Set<string>();
                const uniqueIngs: (string | string[])[] = [];
                for (const ing of r.ingredients) {
                  const key = Array.isArray(ing) ? ing[0] : ing;
                  if (!seenIngKeys.has(key)) { seenIngKeys.add(key); uniqueIngs.push(ing); }
                }

                return (
                  <div key={i} style={{ paddingTop: i > 0 ? 20 : 0, borderTop: i > 0 ? '1px solid var(--surface2)' : 'none' }}>
                    {/* Badges */}
                    <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!r.shaped && <span className="badge-shapeless">🔀 {lang === 'hu' ? 'Szabad' : lang === 'ru' ? 'Без формы' : 'Shapeless'}</span>}
                      {group.recipes.length > 1 && (
                        <span style={{ fontSize: '.72em', padding: '2px 7px', borderRadius: 4, background: 'rgba(255,200,0,.12)', color: 'var(--gold)', border: '1px solid rgba(255,200,0,.25)' }}>
                          {lang === 'hu' ? `${i + 1}. variáns` : lang === 'ru' ? `Вариант ${i + 1}` : `Variant ${i + 1}`}
                        </span>
                      )}
                    </div>

                    {/* Grid + result */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      {r.station === 'blast_furnace' ? (
                        <SmeltingDetail recipe={r} />
                      ) : r.station === 'stone_furnace' ? (
                        <FurnaceDetail recipe={r} />
                      ) : (
                        <div style={{
                          background: 'linear-gradient(135deg,#7a5518 0%,#5c3d0b 55%,#6b4a10 100%)',
                          padding: 5, borderRadius: 6,
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,.55)',
                          border: '2px solid #3d2606',
                          flexShrink: 0,
                        }}>
                          <div className={`craft-grid ${r.station === 'hand' && grid[0]?.length === 2 ? 'g2x2' : 'g3x3'}`}>
                            {grid.map((row, ri) =>
                              row.map((cell, ci) => (
                                <div key={`${ri}-${ci}`} className="craft-slot" style={{
                                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.07), inset -1px -1px 0 rgba(0,0,0,.3)',
                                }}>
                                  {cell && cell !== '_' && <CyclingItemIcon id={cell} size={32} />}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                      <span style={{ fontSize: '1.5em', color: '#f0c040', fontWeight: 700, flexShrink: 0 }}>➜</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 56, height: 56, background: '#6b6b3b',
                          border: '2px solid', borderColor: '#f0c040 #886600 #886600 #f0c040',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CyclingItemIcon id={r.output} size={44} />
                        </div>
                        {r.outputQty > 1 && <span style={{ fontSize: '.9em', fontWeight: 700, color: 'var(--gold)' }}>×{r.outputQty}</span>}
                      </div>
                    </div>
                    {extra > 0 && <div style={{ fontSize: '.75em', color: 'var(--text2)', marginBottom: 8 }}>+{extra} more ingredients</div>}

                    {/* Metadata — #5: rounded difficulty + tooltip */}
                    <div style={{ fontSize: '.83em', color: 'var(--text2)', lineHeight: 1.9, marginBottom: 14, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6 }}>
                      {(r as any)._mergedFromId && (
                        <div style={{ color: '#aaa', fontWeight: 600, marginBottom: 4, fontSize: '.9em' }}>
                          📦 {lang === 'hu' ? `Régi ID: ` : lang === 'ru' ? `Старый ID: ` : `Old ID: `}<code style={{ fontSize: '.9em' }}>{(r as any)._mergedFromId}</code>
                          {items[(r as any)._mergedFromId]?.removed_in && <span style={{ color: '#ff9a44' }}> (v{items[(r as any)._mergedFromId].removed_in})</span>}
                        </div>
                      )}
                      {(r as any).removed_version && (
                        <div style={{ color: '#ff6b6b', fontWeight: 600, marginBottom: 4 }}>
                          ⚠️ {lang === 'hu' ? `Eltávolítva: v${(r as any).removed_version}` : lang === 'ru' ? `Удалено в v${(r as any).removed_version}` : `Removed in v${(r as any).removed_version}`}
                        </div>
                      )}
                      {(r as any).added_version && (
                        <div style={{ color: '#6bcb77', fontWeight: 600, marginBottom: 4 }}>
                          ✅ {lang === 'hu' ? `Szükséges: v${(r as any).added_version}+` : lang === 'ru' ? `Требуется v${(r as any).added_version}+` : `Requires v${(r as any).added_version}+`}
                        </div>
                      )}
                      <div>🏭 {r.station}</div>
                      <div>
                        ⚙️ {lang === 'hu' ? 'Nehézség' : lang === 'ru' ? 'Сложность' : 'Difficulty'}:{' '}
                        <span
                          style={{ color: 'var(--text)', cursor: 'help', borderBottom: '1px dotted var(--text2)' }}
                          title={lang === 'hu'
                            ? `Crafting nehézségi pontszám: ${Math.round(r.difficulty)}\nMinél magasabb az érték, annál több idő és tapasztalat szükséges a tárgy minőségi craftolásához (Fine → Legendary). Az XP-követelmény ezzel az értékkel arányos.`
                            : lang === 'ru'
                            ? `Сложность крафта: ${Math.round(r.difficulty)}\nЧем выше значение, тем больше времени и опыта нужно для крафта предмета высокого качества (Fine → Legendary). Требования к XP пропорциональны этому значению.`
                            : `Crafting difficulty score: ${Math.round(r.difficulty)}\nHigher values require more time and experience to craft the item at higher quality (Fine → Legendary). XP requirements scale proportionally with this value.`}
                        >
                          {Math.round(r.difficulty).toLocaleString()}
                        </span>
                      </div>
                      {r.skills.length > 0 && <div>🎓 {r.skills.join(', ')}</div>}
                      {r.outputQty > 1 && <div>📦 ×{r.outputQty}</div>}
                    </div>

                    {/* Ingredients — #2: clickable rows */}
                    <div style={{ fontSize: '.8em', color: 'var(--text2)', marginBottom: 8, fontWeight: 500 }}>
                      {lang === 'hu' ? 'Hozzávalók' : lang === 'ru' ? 'Ингредиенты' : 'Ingredients'}
                      <span style={{ fontSize: '.85em', fontWeight: 400, marginLeft: 6 }}>
                        ({lang === 'hu' ? 'kattints a receptekért' : lang === 'ru' ? 'клик для рецептов' : 'click for recipes'})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {uniqueIngs.map((ing) => {
                        const key = Array.isArray(ing) ? ing[0] : ing;
                        const cnt = ingCounts.get(key) || 1;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
                            {cnt > 1 ? (
                              <span style={{ fontSize: '.8em', color: 'var(--gold)', minWidth: 26, textAlign: 'right', paddingRight: 6, flexShrink: 0 }}>
                                {cnt}×
                              </span>
                            ) : (
                              <span style={{ minWidth: 26, flexShrink: 0 }} />
                            )}
                            <IngredientRow id={ing} lang={lang} onClickIngredient={setItemDetailId} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Hoverable row components (hooks cannot be inside .map) ────────────────
function ModalRow({ group, lang, onNavigate, onClose }: {
  group: OutputGroup; lang: 'hu' | 'en' | 'ru';
  onNavigate: (id: string) => void; onClose: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => { onNavigate(group.outputId); onClose(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
        background: hov ? 'var(--surface2)' : 'transparent',
        border: `1px solid ${hov ? 'var(--gold)' : 'transparent'}`,
        transition: 'background .1s, border-color .1s',
      }}
    >
      <ItemIcon id={group.outputId} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '.85em', fontWeight: 500 }}>{getItemName(group.outputId, lang)}</div>
        <div style={{ fontSize: '.7em', color: 'var(--text2)' }}>{group.primaryRecipe.station}</div>
      </div>
      {hov && <span style={{ fontSize: '.8em', color: 'var(--gold)', flexShrink: 0 }}>→ {lang === 'hu' ? 'Recept' : lang === 'ru' ? 'Рецепт' : 'Recipe'}</span>}
    </div>
  );
}

function TooltipRow({ group, lang, onNavigate }: {
  group: OutputGroup; lang: 'hu' | 'en' | 'ru'; onNavigate: (id: string) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onNavigate(group.outputId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 6px', borderRadius: 5, cursor: 'pointer',
        background: hov ? 'var(--surface2)' : 'transparent',
        border: `1px solid ${hov ? 'rgba(240,192,64,.4)' : 'transparent'}`,
        transition: 'background .1s',
      }}
    >
      <div style={{ width: 22, height: 22, background: '#3a3a3a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ItemIcon id={group.outputId} size={16} />
      </div>
      <span style={{ fontSize: '.8em', lineHeight: 1.2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {getItemName(group.outputId, lang)}
      </span>
      {hov && <span style={{ fontSize: '.65em', color: 'var(--gold)', flexShrink: 0 }}>→</span>}
    </div>
  );
}

// ── "Used in" full modal ───────────────────────────────────────────────────
function UsedInModal({ itemId, lang, onClose, onNavigate }: {
  itemId: string; lang: 'hu' | 'en' | 'ru'; onClose: () => void; onNavigate: (id: string) => void;
}) {
  const usedIn = useMemo(() => getUsedInGroups(itemId), [itemId]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 10000, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 400, maxHeight: '72vh', background: 'var(--surface)',
        border: '1px solid var(--gold)', borderRadius: 12, zIndex: 10001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.85)',
        animation: 'modalPop .22s cubic-bezier(.22,.68,0,1.15) both',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--surface2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ItemIcon id={itemId} size={28} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95em' }}>{getItemName(itemId, lang)}</div>
              <div style={{ fontSize: '.7em', color: 'var(--gold)', marginTop: 2 }}>
                {lang === 'hu' ? `${usedIn.length} receptben szerepel` : lang === 'ru' ? `Используется в ${usedIn.length} рецептах` : `Used in ${usedIn.length} recipes`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.3em', cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>✕</button>
        </div>
        {/* List */}
        <div className="modal-list" style={{ overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {usedIn.map(g => (
            <ModalRow key={g.outputId} group={g} lang={lang} onNavigate={onNavigate} onClose={onClose} />
          ))}
        </div>
      </div>
    </>
  );
}

// ── Picker item row with "Used in" hover tooltip ──────────────────────────
function PickerItem({ id, lang, isSelected, onSelect, onNavigate, onOpenModal }: {
  id: string; lang: 'hu' | 'en' | 'ru'; isSelected: boolean;
  onSelect: (id: string) => void; onNavigate: (outputId: string) => void;
  onOpenModal: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const usedIn = useMemo(() => getUsedInGroups(id), [id]);

  useEffect(() => () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function scheduleOpen() {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const x = r.right + 234 > window.innerWidth ? r.left - 234 : r.right + 10;
      const y = Math.min(r.top, window.innerHeight - 360);
      setTooltip({ x, y });
    }, 280);
  }

  function scheduleClose() {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setTooltip(null), 160);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  return (
    <>
      <div
        ref={ref}
        className={isSelected ? 'picker-item-selected' : undefined}
        draggable
        onDragStart={e => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'copy'; }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 5, cursor: 'grab',
          border: `2px solid ${isSelected ? 'var(--gold)' : 'transparent'}`,
          background: isSelected ? 'rgba(240,192,64,.12)' : 'var(--surface2)',
          transition: 'border-color .1s, background .1s',
        }}
        onClick={() => onSelect(id)}
        onMouseEnter={e => {
          if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(240,192,64,.4)';
          scheduleOpen();
        }}
        onMouseLeave={e => {
          if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
          scheduleClose();
        }}
      >
        <div style={{ width: 32, height: 32, background: '#3a3a3a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ItemIcon id={id} size={26} />
        </div>
        <span style={{ fontSize: '.82em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getItemName(id, lang)}
        </span>
        {usedIn.length > 0 && (
          <span style={{ fontSize: '.65em', color: 'var(--text2)', flexShrink: 0, opacity: .6 }}>↑{usedIn.length}</span>
        )}
      </div>

      {/* Interactive "Used in" tooltip (top 8 + View all) */}
      {tooltip && usedIn.length > 0 && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed', left: tooltip.x, top: tooltip.y,
            width: 224, zIndex: 9999,
            background: 'var(--surface)', border: '1px solid var(--gold)',
            borderRadius: 10, padding: '12px 14px',
            boxShadow: '0 12px 40px rgba(0,0,0,.85)',
            animation: 'resultPop .2s cubic-bezier(.22,.68,0,1.15) both',
          }}
        >
          <div style={{ fontSize: '.7em', fontWeight: 700, color: 'var(--gold)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.07em' }}>
            {lang === 'hu' ? `Felhasználva (${usedIn.length})` : lang === 'ru' ? `Используется (${usedIn.length})` : `Used in (${usedIn.length})`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {usedIn.slice(0, 8).map(g => (
              <TooltipRow key={g.outputId} group={g} lang={lang} onNavigate={(outId) => { onNavigate(outId); setTooltip(null); }} />
            ))}
          </div>
          {usedIn.length > 8 && (
            <button
              onClick={() => { onOpenModal(id); setTooltip(null); }}
              style={{
                marginTop: 8, width: '100%', padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid rgba(240,192,64,.4)', background: 'rgba(240,192,64,.08)',
                color: 'var(--gold)', fontSize: '.75em', fontWeight: 600,
              }}
            >
              +{usedIn.length - 8} {lang === 'hu' ? 'recept — Mind' : lang === 'ru' ? 'ещё — Все' : 'more — View all'}
            </button>
          )}
        </div>
      )}

    </>
  );
}

// ── Sandbox grid cell ─────────────────────────────────────────────────────
function SandboxCell({ cell, isActive, pendingItem, lang, onClick, onRightClick, onDropItem }: {
  cell: string | null;
  isActive: boolean;
  pendingItem: string | null;
  lang: 'hu' | 'en' | 'ru';
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  onDropItem: (id: string) => void;
}) {
  const [hov, setHov] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const showGhost = hov && !cell && pendingItem;

  const borderColor = dragOver ? 'rgba(240,192,64,.9)'
    : isActive ? 'rgba(240,192,64,.7)'
    : hov ? 'rgba(240,192,64,.35)' : undefined;
  const bg = dragOver ? 'rgba(155,155,75,.45)'
    : isActive ? '#7a7a3a'
    : hov && pendingItem ? 'rgba(155,155,75,.25)' : undefined;

  return (
    <div
      className="craft-slot interactive"
      style={{ borderColor, background: bg, position: 'relative' }}
      onClick={onClick}
      onContextMenu={onRightClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDropItem(id);
      }}
      title={
        cell ? getItemName(cell, lang)
        : pendingItem ? (lang === 'hu' ? `Elhelyezés: ${getItemName(pendingItem, lang)}` : lang === 'ru' ? `Поместить: ${getItemName(pendingItem, lang)}` : `Place: ${getItemName(pendingItem, lang)}`)
        : (lang === 'hu' ? 'Kattints vagy húzd ide' : lang === 'ru' ? 'Нажмите или перетащите' : 'Click or drag here')
      }
    >
      {cell && cell !== '_' && <ItemIcon id={cell} size={32} />}
      {showGhost && (
        <div style={{ opacity: .35, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <ItemIcon id={pendingItem!} size={32} />
        </div>
      )}
    </div>
  );
}

// ── Sandbox panel ─────────────────────────────────────────────────────────
function SandboxPanel({ lang, sandboxGrid, setSandboxCell, clearSandbox, sandboxMatches,
  pickerSlot, setPickerSlot, pickerQuery, setPickerQuery, pickerItems, onViewRecipe, onOpenModal,
}: {
  lang: 'hu' | 'en' | 'ru';
  sandboxGrid: (string | null)[][];
  setSandboxCell: (r: number, c: number, v: string | null) => void;
  clearSandbox: () => void;
  sandboxMatches: { shaped: FullRecipe[]; shapeless: FullRecipe[] };
  pickerSlot: { row: number; col: number } | null;
  setPickerSlot: (s: { row: number; col: number } | null) => void;
  pickerQuery: string;
  setPickerQuery: (q: string) => void;
  pickerItems: [string, ItemEntry][];
  onViewRecipe: (id: string) => void;
  onOpenModal: (id: string) => void;
}) {
  const [selectedPickerItem, setSelectedPickerItem] = useState<string | null>(null);
  const allMatches = [...sandboxMatches.shaped, ...sandboxMatches.shapeless];
  const hasItems = sandboxGrid.flat().some(Boolean);

  // clicking a cell: if picker item selected → place it; otherwise open/close picker
  function handleCellClick(ri: number, ci: number) {
    if (selectedPickerItem) {
      setSandboxCell(ri, ci, selectedPickerItem);
      setSelectedPickerItem(null);
      setPickerSlot(null);
    } else {
      if (pickerSlot?.row === ri && pickerSlot?.col === ci) setPickerSlot(null);
      else { setPickerSlot({ row: ri, col: ci }); setPickerQuery(''); }
    }
  }

  function handleCellRightClick(e: React.MouseEvent, ri: number, ci: number) {
    e.preventDefault();
    setSandboxCell(ri, ci, null);
  }

  return (
    <div>
      {/* #1: 3-step hint */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 20, background: 'var(--surface)',
        border: '1px solid var(--surface2)', borderRadius: 8, overflow: 'hidden',
      }}>
        {[
          { icon: '📦', step: lang === 'hu' ? 'Válassz tárgyat' : lang === 'ru' ? 'Выбери предмет' : 'Pick an item', sub: lang === 'hu' ? 'a listából jobbra' : lang === 'ru' ? 'из списка справа' : 'from the list' },
          { icon: '🧩', step: lang === 'hu' ? 'Kattints a cellára' : lang === 'ru' ? 'Нажми на ячейку' : 'Click a cell', sub: lang === 'hu' ? 'a 3×3 rácsban' : lang === 'ru' ? 'в сетке 3×3' : 'in the 3×3 grid' },
          { icon: '➜', step: lang === 'hu' ? 'Nézd az eredményt' : lang === 'ru' ? 'Смотри результат' : 'See the result', sub: lang === 'hu' ? 'jobbra' : lang === 'ru' ? 'справа' : 'on the right' },
        ].map((h, i) => (
          <div key={i} style={{
            flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            borderLeft: i > 0 ? '1px solid var(--surface2)' : 'none',
          }}>
            <span style={{ fontSize: '1.3em', flexShrink: 0 }}>{h.icon}</span>
            <div>
              <div style={{ fontSize: '.82em', fontWeight: 600, color: 'var(--text)' }}>{h.step}</div>
              <div style={{ fontSize: '.72em', color: 'var(--text2)' }}>{h.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* #2: 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Crafting grid ── */}
        <div>
          <div style={{ fontSize: '.75em', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            {lang === 'hu' ? 'Crafting tábla' : lang === 'ru' ? 'Стол крафта' : 'Crafting table'}
          </div>
          <div style={{
            background: 'linear-gradient(135deg,#8a601a 0%,#63430d 55%,#7a5212 100%)',
            padding: 7, borderRadius: 7,
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,.6), 0 2px 10px rgba(0,0,0,.4)',
            border: '2px solid #3d2606',
            display: 'inline-block', width: 'fit-content',
          }}>
            <div className="craft-grid g3x3">
              {sandboxGrid.map((row, ri) =>
                row.map((cell, ci) => (
                  <SandboxCell
                    key={`${ri}-${ci}`}
                    cell={cell}
                    isActive={!!(pickerSlot?.row === ri && pickerSlot?.col === ci)}
                    pendingItem={selectedPickerItem}
                    lang={lang}
                    onClick={() => handleCellClick(ri, ci)}
                    onRightClick={(e) => handleCellRightClick(e, ri, ci)}
                    onDropItem={(id) => setSandboxCell(ri, ci, id)}
                  />
                ))
              )}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={clearSandbox}
              style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid var(--surface2)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: '.82em' }}>
              🗑️ {lang === 'hu' ? 'Rács törlése' : lang === 'ru' ? 'Очистить сетку' : 'Clear grid'}
            </button>
          </div>
          {/* right-click hint */}
          <div style={{ marginTop: 8, fontSize: '.7em', color: 'var(--text2)', opacity: .7 }}>
            {lang === 'hu' ? 'Jobb klikk = cella törlése' : lang === 'ru' ? 'ПКМ = убрать предмет' : 'Right-click = remove item'}
          </div>
        </div>

        {/* ── MIDDLE: Item picker (always visible) ── */}
        <div>
          <div style={{ fontSize: '.75em', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            {selectedPickerItem
              ? (lang === 'hu' ? `✔ ${getItemName(selectedPickerItem, lang)} kiválasztva` : lang === 'ru' ? `✔ ${getItemName(selectedPickerItem, lang)} выбран` : `✔ ${getItemName(selectedPickerItem, lang)} selected`)
              : (lang === 'hu' ? 'Tárgy lista' : lang === 'ru' ? 'Список предметов' : 'Item list')}
          </div>
          <input
            type="text"
            autoFocus
            placeholder={lang === 'hu' ? 'Keresés…' : lang === 'ru' ? 'Поиск…' : 'Search…'}
            value={pickerQuery}
            onChange={e => setPickerQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--surface2)', background: 'var(--bg)', color: 'var(--text)', marginBottom: 8, boxSizing: 'border-box', fontSize: '.85em' }}
          />
          {/* Item list: [icon] Name rows with "Used in" hover tooltip */}
          <div className="sandbox-picker" style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 300, overflowY: 'auto', paddingRight: 3 }}>
            {pickerItems.map(([id]) => (
              <PickerItem
                key={id}
                id={id}
                lang={lang}
                isSelected={selectedPickerItem === id}
                onSelect={(id) => {
                  if (selectedPickerItem === id) setSelectedPickerItem(null);
                  else { setSelectedPickerItem(id); setPickerSlot(null); }
                }}
                onNavigate={(outId) => onViewRecipe(outId)}
                onOpenModal={(itemId) => onOpenModal(itemId)}
              />
            ))}
          </div>
          {selectedPickerItem && (
            <div style={{ marginTop: 8, fontSize: '.78em', color: 'var(--gold)' }}>
              {lang === 'hu' ? '← Kattints egy cellára az elhelyezéshez' : lang === 'ru' ? '← Нажми на ячейку для размещения' : '← Click a cell to place it'}
            </div>
          )}
        </div>

        {/* ── RIGHT: Result ── */}
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: '.75em', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            {lang === 'hu' ? 'Eredmény' : lang === 'ru' ? 'Результат' : 'Result'}
          </div>
          {allMatches.length === 0 ? (
            <div style={{
              padding: '16px 14px', background: 'var(--surface)', border: '1px solid var(--surface2)',
              borderRadius: 8, textAlign: 'center',
            }}>
              <div style={{ fontSize: '2em', marginBottom: 8, opacity: .28 }}>⚒️</div>
              <div style={{ fontSize: '.82em', color: 'var(--text2)', lineHeight: 1.8 }}>
                {hasItems ? (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{lang === 'hu' ? 'Nincs egyező recept.' : lang === 'ru' ? 'Рецепт не найден.' : 'No recipe yet.'}</div>
                    <div>{lang === 'hu' ? 'Adj hozzá még hozzávalókat.' : lang === 'ru' ? 'Добавь больше ингредиентов.' : 'Add more ingredients.'}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{lang === 'hu' ? 'Tedd be a hozzávalókat' : lang === 'ru' ? 'Заполни сетку' : 'Fill the grid'}</div>
                    <div>{lang === 'hu' ? 'a rácsba az eredményért.' : lang === 'ru' ? 'чтобы увидеть результат.' : 'to see results.'}</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allMatches.map((r, i) => {
                const outId = getOutputId(r.output);
                return (
                  <div key={`${outId}-${i}`} className="result-match" style={{
                    background: 'var(--surface)', border: '1px solid var(--surface2)',
                    borderRadius: 8, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  }}>
                    {/* big output icon */}
                    <div style={{
                      width: 64, height: 64, background: '#6b6b3b',
                      border: '3px solid', borderColor: '#f0c040 #886600 #886600 #f0c040',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ItemIcon id={outId} size={50} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '.95em' }}>{getItemName(outId, lang)}</div>
                      <div style={{ fontSize: '.72em', color: 'var(--text2)', marginTop: 3 }}>
                        {r.shaped ? '📐' : '🔀'} {r.station}
                        {r.outputQty > 1 && <span style={{ color: 'var(--gold)', marginLeft: 4 }}>×{r.outputQty}</span>}
                      </div>
                    </div>
                    {/* #5: View recipe button */}
                    <button
                      onClick={() => onViewRecipe(outId)}
                      style={{
                        width: '100%', padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                        border: '1px solid var(--gold)', background: 'rgba(240,192,64,.12)',
                        color: 'var(--gold)', fontSize: '.8em', fontWeight: 600,
                      }}
                    >
                      {lang === 'hu' ? '📖 Recept megtekintése' : lang === 'ru' ? '📖 Посмотреть рецепт' : '📖 View recipe'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function RecipesHub() {
  const [mode, setMode] = useState<'browse' | 'sandbox'>('browse');
  const [transitioning, setTransitioning] = useState(false);
  const [lang, setLang] = useState<'hu' | 'en' | 'ru'>('hu');
  const [keyword, setKeyword] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'shaped' | 'shapeless' | 'removed' | 'current'>('current');
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [usedInModalItem, setUsedInModalItem] = useState<string | null>(null);
  const [fromSandbox, setFromSandbox] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  function navigateFromSandbox(id: string) {
    setTransitioning(true);
    setTimeout(() => {
      setMode('browse');
      setSelectedOutputId(id);
      setFromSandbox(true);
      setTransitioning(false);
    }, 180);
  }

  useEffect(() => {
    setLang(getCurrentLang() as 'hu' | 'en' | 'ru');
    return onLangChange((l) => setLang(l as 'hu' | 'en' | 'ru'));
  }, []);

  // URL ?search= / ?skill= / ?ingredient= param support
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('search');
    const sk = params.get('skill');
    const ing = params.get('ingredient');
    const st = params.get('station');
    if (s) { setKeyword(s); setMode('browse'); }
    if (sk) { setSkillFilter(sk); setMode('browse'); }
    if (ing) { setIngredientFilter(ing); setMode('browse'); }
    if (st) { setStationFilter(st); setMode('browse'); }
  }, []);

  // #9: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (mode !== 'browse') setMode('browse');
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  const [sandboxGrid, setSandboxGrid] = useState<(string | null)[][]>(Array.from({ length: 3 }, () => [null, null, null]));
  const [pickerSlot, setPickerSlot] = useState<{ row: number; col: number } | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  const hasFilters = keyword !== '' || stationFilter !== '' || skillFilter !== '' || ingredientFilter !== '' || typeFilter !== 'current';

  function clearFilters() {
    setKeyword('');
    setStationFilter('');
    setSkillFilter('');
    setIngredientFilter('');
    setTypeFilter('current');
  }

  const filteredGroups = useMemo(() => {
    return allGroups.filter(g => {
      if (keyword) {
        const kw = keyword.toLowerCase();
        const matches = g.allOutputIds.some(id =>
          id.includes(kw) || getItemName(id, lang).toLowerCase().includes(kw)
        );
        if (!matches) return false;
      }
      if (stationFilter && !g.recipes.some(r => r.station === stationFilter)) return false;
      if (skillFilter && !g.recipes.some(r => r.skills.includes(skillFilter))) return false;
      if (ingredientFilter) {
        const ing = ingredientFilter.toLowerCase();
        if (!g.recipes.some(r =>
          (r.ingredients as (string | string[])[]).some(i => {
            const id = Array.isArray(i) ? i[0] : i;
            return id.includes(ing) || getItemName(id, lang).toLowerCase().includes(ing);
          })
        )) return false;
      }
      if (typeFilter === 'shaped' && !g.hasShapedVariant) return false;
      if (typeFilter === 'shapeless' && !g.hasShapelessVariant) return false;
      if (typeFilter === 'removed' && !items[g.outputId]?.removed_in) return false;
      if (typeFilter === 'current' && items[g.outputId]?.removed_in) return false;
      return true;
    });
  }, [keyword, stationFilter, skillFilter, ingredientFilter, typeFilter, lang]);

  const totalRecipeCount = filteredGroups.reduce((s, g) => s + g.recipes.length, 0);
  const selectedGroup = selectedOutputId ? allGroups.find(x => x.allOutputIds.includes(selectedOutputId)) ?? null : null;

  // Scroll to highlighted card after sandbox→browse navigation
  useEffect(() => {
    if (fromSandbox && selectedOutputId && mode === 'browse') {
      setTimeout(() => {
        const el = document.getElementById(`output-card-${selectedOutputId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  }, [fromSandbox, selectedOutputId, mode]);

  const sandboxMatches = useMemo(() => ({
    shaped: matchShaped(sandboxGrid, recipes),
    shapeless: matchShapeless(sandboxGrid, recipes),
  }), [sandboxGrid]);

  const pickerItems = useMemo(() => {
    const q = pickerQuery.toLowerCase();
    return (Object.entries(items) as [string, ItemEntry][])
      .filter(([id, item]) => !q || id.includes(q) || item.name.hu.toLowerCase().includes(q) || item.name.en.toLowerCase().includes(q))
      .slice(0, 60);
  }, [pickerQuery]);

  function setSandboxCell(row: number, col: number, val: string | null) {
    setSandboxGrid(prev => {
      const next = prev.map(r => [...r]) as (string | null)[][];
      next[row][col] = val;
      return next;
    });
  }

  function clearSandbox() {
    setSandboxGrid(Array.from({ length: 3 }, () => [null, null, null]));
    setPickerSlot(null);
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Tabs */}
      <div className="hub-tabs">
        <button className={`hub-tab${mode === 'browse' ? ' active' : ''}`} onClick={() => setMode('browse')}>
          🔍 {lang === 'hu' ? 'Böngésző' : lang === 'ru' ? 'Обзор' : 'Browse'}
        </button>
        <button className={`hub-tab${mode === 'sandbox' ? ' active' : ''}`} onClick={() => setMode('sandbox')}>
          🧪 Sandbox
        </button>
      </div>

      {mode === 'browse' && (
        <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity .18s ease' }}>
          {/* Filter bar */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--surface2)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 12,
            display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <input
                ref={searchRef}
                type="text"
                placeholder={lang === 'hu' ? 'Recept vagy tárgy keresése… (Ctrl+K)' : lang === 'ru' ? 'Поиск рецептов или предметов… (Ctrl+K)' : 'Search recipes or items… (Ctrl+K)'}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--surface2)', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }}
              />
            </div>
            <select value={stationFilter} onChange={e => setStationFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${stationFilter ? 'var(--gold)' : 'var(--surface2)'}`, background: 'var(--bg)', color: stationFilter ? 'var(--gold)' : 'var(--text)' }}>
              <option value="">{lang === 'hu' ? '– Összes állomás –' : lang === 'ru' ? '– Все станции –' : '– All stations –'}</option>
              {allStations.map(s => <option key={s} value={s}>{STATION_LABELS[s]?.[lang] ?? s}</option>)}
            </select>
            <input
              type="text"
              placeholder={lang === 'hu' ? 'Alapanyag szűrése…' : lang === 'ru' ? 'Фильтр по ингредиенту…' : 'Filter by ingredient…'}
              value={ingredientFilter}
              onChange={e => setIngredientFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${ingredientFilter ? 'rgba(126,200,227,.6)' : 'var(--surface2)'}`, background: 'var(--bg)', color: ingredientFilter ? 'var(--text)' : 'var(--text)', width: 180 }}
            />
            <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${skillFilter ? 'var(--gold)' : 'var(--surface2)'}`, background: 'var(--bg)', color: skillFilter ? 'var(--gold)' : 'var(--text)' }}>
              <option value="">{lang === 'hu' ? '– Összes skill –' : lang === 'ru' ? '– Все навыки –' : '– All skills –'}</option>
              {allSkills.map(s => (
                <option key={s} value={s}>
                  {(SKILL_LABELS[s]?.[lang] ?? s)}
                </option>
              ))}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'all' | 'shaped' | 'shapeless' | 'removed' | 'current')}
              style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${typeFilter === 'removed' ? '#ff6b6b' : typeFilter === 'current' ? '#6bcb77' : 'var(--surface2)'}`, background: 'var(--bg)', color: typeFilter === 'removed' ? '#ff6b6b' : typeFilter === 'current' ? '#6bcb77' : 'var(--text)' }}>
              <option value="all">{lang === 'hu' ? '– Típus –' : lang === 'ru' ? '– Тип –' : '– Type –'}</option>
              <option value="shaped">{lang === 'hu' ? 'Elrendezett' : lang === 'ru' ? 'С формой' : 'Shaped'}</option>
              <option value="shapeless">{lang === 'hu' ? 'Szabad' : lang === 'ru' ? 'Без формы' : 'Shapeless'}</option>
              <option value="current">{lang === 'hu' ? '✅ Aktuális' : lang === 'ru' ? '✅ Актуальный' : '✅ Current'}</option>
              <option value="removed">{lang === 'hu' ? '⚠️ Eltávolított' : lang === 'ru' ? '⚠️ Удалённый' : '⚠️ Removed'}</option>
            </select>
            {hasFilters && (
              <button onClick={clearFilters}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--surface2)', background: 'var(--surface2)', color: 'var(--text2)', cursor: 'pointer', fontSize: '.85em', whiteSpace: 'nowrap' }}>
                ✕ {lang === 'hu' ? 'Szűrők törlése' : lang === 'ru' ? 'Сбросить фильтры' : 'Clear filters'}
              </button>
            )}
          </div>

          {/* Stat badge */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '.8em', color: 'var(--text2)', padding: '3px 10px', background: 'var(--surface)', border: '1px solid var(--surface2)', borderRadius: 20 }}>
              {filteredGroups.length} {lang === 'hu' ? 'tárgy' : lang === 'ru' ? 'предм.' : 'items'} · {totalRecipeCount} {lang === 'hu' ? 'recept' : lang === 'ru' ? 'рецептов' : 'recipes'}
            </span>
          </div>

          {/* Card grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            {filteredGroups.map(g => {
              const isSelected = selectedOutputId === g.outputId;
              const displayName = getItemName(g.outputId, lang);
              return (
                <div
                  key={g.outputId}
                  id={`output-card-${g.outputId}`}
                  className="output-card"
                  title={buildTooltip(g, lang)}
                  style={{
                    width: 200, minWidth: 200, padding: '8px 10px', cursor: 'pointer',
                    background: isSelected ? 'linear-gradient(145deg, #4a3a28, #352b20)' : 'linear-gradient(145deg, #3b2f20, #2a2218)',
                    border: `2px solid ${isSelected ? 'var(--gold)' : '#5a4a3a'}`,
                    boxShadow: isSelected ? '0 0 0 3px rgba(255,200,0,0.25), 0 4px 16px rgba(0,0,0,.5)' : 'none',
                    borderRadius: 'var(--radius)',
                    display: 'flex', flexDirection: 'column', gap: 6,
                    transition: 'border-color .15s, box-shadow .15s, background .15s',
                  }}
                  onClick={() => setSelectedOutputId(g.outputId === selectedOutputId ? null : g.outputId)}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = 'var(--gold)';
                      el.style.boxShadow = '0 0 0 2px rgba(255,200,0,0.15), 0 4px 16px rgba(0,0,0,.4)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = '#5a4a3a';
                      el.style.boxShadow = 'none';
                    }
                  }}
                >
                  <MiniGrid recipe={g.primaryRecipe} outputId={g.primaryRecipe.output} outputQty={g.primaryRecipe.outputQty} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span title={displayName} style={{ fontSize: '.72em', lineHeight: 1.2, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </span>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {g.hasShapelessVariant && <span className="badge-shapeless">🔀</span>}
                      {g.recipes.length > 1 && (
                        <span style={{ fontSize: '.65em', padding: '1px 4px', borderRadius: 3, background: 'rgba(255,200,0,.15)', color: 'var(--gold)', border: '1px solid rgba(255,200,0,.3)' }}>
                          ×{g.recipes.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Right-side drawer */}
      {selectedGroup && mode === 'browse' && (
        <DetailDrawer
          group={selectedGroup}
          lang={lang}
          onClose={() => { setSelectedOutputId(null); setFromSandbox(false); }}
          onSelectGroup={(id) => { setSelectedOutputId(id); setFromSandbox(false); }}
          onBackToSandbox={fromSandbox ? () => {
            setSelectedOutputId(null);
            setFromSandbox(false);
            setMode('sandbox');
          } : undefined}
        />
      )}

      {mode === 'sandbox' && (
        <SandboxPanel
          lang={lang}
          sandboxGrid={sandboxGrid}
          setSandboxCell={setSandboxCell}
          clearSandbox={clearSandbox}
          sandboxMatches={sandboxMatches}
          pickerSlot={pickerSlot}
          setPickerSlot={setPickerSlot}
          pickerQuery={pickerQuery}
          setPickerQuery={setPickerQuery}
          pickerItems={pickerItems}
          onViewRecipe={(id) => navigateFromSandbox(id)}
          onOpenModal={(id) => setUsedInModalItem(id)}
        />
      )}

      {usedInModalItem && (
        <UsedInModal
          itemId={usedInModalItem}
          lang={lang}
          onClose={() => setUsedInModalItem(null)}
          onNavigate={(outId) => {
            setUsedInModalItem(null);
            navigateFromSandbox(outId);
          }}
        />
      )}
    </div>
  );
}

