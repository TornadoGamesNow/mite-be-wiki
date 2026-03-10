import { useState, useMemo, useEffect } from 'react';
import recipesData from '../../data/recipes_full.json';
import itemsData from '../../data/items.json';
import { getCurrentLang, onLangChange } from '../i18n/lang';

type Lang = 'hu' | 'en' | 'ru';

type Recipe = {
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

type ItemEntry = {
  name: { hu: string; en: string; ru?: string };
  img?: string;
  tier?: string | null;
  category?: string;
  removed_in?: string;
};

interface TreeNode {
  itemId: string;
  qty: number;
  recipe?: Recipe;
  children: TreeNode[];
  depth: number;
  isRaw: boolean;
  isCycle: boolean;
}

const recipes = recipesData as unknown as Recipe[];
const items = itemsData as unknown as Record<string, ItemEntry>;

const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';

const STATION_LABELS: Record<string, { hu: string; en: string; ru: string }> = {
  flint_workbench:         { hu: 'Kovakő asztal',         en: 'Flint Workbench',         ru: 'Кремнёвый верстак' },
  copper_workbench:        { hu: 'Réz asztal',             en: 'Copper Workbench',        ru: 'Медный верстак' },
  silver_workbench:        { hu: 'Ezüst asztal',           en: 'Silver Workbench',        ru: 'Серебряный верстак' },
  gold_workbench:          { hu: 'Arany asztal',           en: 'Gold Workbench',          ru: 'Золотой верстак' },
  iron_workbench:          { hu: 'Vas asztal',             en: 'Iron Workbench',          ru: 'Железный верстак' },
  hardstone_workbench:     { hu: 'Kőmag asztal',           en: 'Hardstone Workbench',     ru: 'Твердокаменный верстак' },
  ancient_metal_workbench: { hu: 'Ős fém asztal',          en: 'Ancient Metal Workbench', ru: 'Верстак древнего металла' },
  mithril_workbench:       { hu: 'Mithril asztal',         en: 'Mithril Workbench',       ru: 'Мифриловый верстак' },
  adamantium_workbench:    { hu: 'Adamantium asztal',      en: 'Adamantium Workbench',    ru: 'Адамантиевый верстак' },
  blast_furnace:           { hu: 'Nagy kemence',           en: 'Blast Furnace',           ru: 'Доменная печь' },
  stone_furnace:           { hu: 'Kő kemence',             en: 'Stone Furnace',           ru: 'Каменная печь' },
  clay_furnace:            { hu: 'Agyag kemence',          en: 'Clay Furnace',            ru: 'Глиняная печь' },
  obsidian_furnace:        { hu: 'Obszidián kemence',      en: 'Obsidian Furnace',        ru: 'Обсидиановая печь' },
  netherrack_furnace:      { hu: 'Pokoli kő kemence',      en: 'Netherrack Furnace',      ru: 'Печь из адского камня' },
  brewing_stand:           { hu: 'Főzetállvány',           en: 'Brewing Stand',           ru: 'Стойка для зелий' },
  hand:                    { hu: 'Kézzel',                 en: 'By hand',                 ru: 'Руками' },
};

const FEATURED_CANDIDATES = [
  'copper_sword', 'iron_pickaxe', 'bronze_ingot', 'mithril_sword',
  'hardstone_axe', 'copper_pickaxe', 'iron_sword', 'ancient_metal_ingot',
];

const recipesByOutput: Record<string, Recipe[]> = {};
for (const r of recipes) {
  const outputId = Array.isArray(r.output) ? r.output[0] : r.output;
  if (!outputId) continue;
  if (!recipesByOutput[outputId]) recipesByOutput[outputId] = [];
  recipesByOutput[outputId].push(r);
}

const featuredItems = FEATURED_CANDIDATES.filter(id => recipesByOutput[id] && items[id]);

function toTitleCase(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getItemName(id: string, lang: Lang): string {
  const entry = items[id];
  if (!entry) return toTitleCase(id);
  if (lang === 'ru') return entry.name.ru || entry.name.en || entry.name.hu || id;
  if (lang === 'en') return entry.name.en || entry.name.hu || id;
  return entry.name.hu || entry.name.en || id;
}

function resolveIngredient(ing: string | string[]): string {
  return Array.isArray(ing) ? ing[0] : ing;
}

function buildTree(
  itemId: string,
  qty: number,
  depth: number,
  visited: Set<string>,
  recipeIndexMap: Record<string, number>
): TreeNode {
  if (depth >= 4) {
    return { itemId, qty, depth, isRaw: false, isCycle: false, children: [] };
  }
  if (visited.has(itemId)) {
    return { itemId, qty, depth, isRaw: false, isCycle: true, children: [] };
  }

  const available = recipesByOutput[itemId];
  if (!available || available.length === 0) {
    return { itemId, qty, depth, isRaw: true, isCycle: false, children: [] };
  }

  const recipeIndex = recipeIndexMap[itemId] ?? 0;
  const recipe = available[Math.min(recipeIndex, available.length - 1)];
  const outputQty = recipe.outputQty || 1;

  const newVisited = new Set(visited);
  newVisited.add(itemId);

  const ingCounts: Record<string, number> = {};
  for (const ing of recipe.ingredients) {
    const id = resolveIngredient(ing);
    if (!id || id === '_') continue;
    ingCounts[id] = (ingCounts[id] || 0) + 1;
  }

  const children = Object.entries(ingCounts).map(([id, count]) =>
    buildTree(id, (count * qty) / outputQty, depth + 1, newVisited, recipeIndexMap)
  );

  return { itemId, qty, recipe, children, depth, isRaw: false, isCycle: false };
}

// ── ItemBadge ──────────────────────────────────────────────────────────────

function ItemBadge({ itemId, qty, lang, dimmed }: { itemId: string; qty: number; lang: Lang; dimmed?: boolean }) {
  const item = items[itemId];
  const displayQty = Math.ceil(qty * 100) / 100;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, opacity: dimmed ? 0.6 : 1 }}>
      {item?.img && (
        <img
          src={`${BASE}/${item.img}`}
          width={18}
          height={18}
          alt=""
          style={{ imageRendering: 'pixelated', flexShrink: 0 }}
        />
      )}
      <span>
        {displayQty !== 1 && (
          <strong style={{ color: 'var(--gold)', marginRight: 2, fontSize: '.9em' }}>
            {Number.isInteger(displayQty) ? displayQty : displayQty.toFixed(2)}×
          </strong>
        )}
        {getItemName(itemId, lang)}
      </span>
    </span>
  );
}

// ── RecipeSelector ─────────────────────────────────────────────────────────

function RecipeSelector({
  itemId,
  recipeIndex,
  onChange,
  lang,
}: {
  itemId: string;
  recipeIndex: number;
  onChange: (idx: number) => void;
  lang: Lang;
}) {
  const available = recipesByOutput[itemId];
  if (!available || available.length <= 1) return null;

  return (
    <select
      value={recipeIndex}
      onChange={e => onChange(Number(e.target.value))}
      onClick={e => e.stopPropagation()}
      style={{
        fontSize: '.72em',
        padding: '1px 4px',
        marginLeft: 4,
        background: 'var(--surface)',
        border: '1px solid var(--surface2)',
        borderRadius: 3,
        color: 'var(--text2)',
        cursor: 'pointer',
      }}
      title={lang === 'hu' ? 'Recept váltás' : lang === 'ru' ? 'Выбор рецепта' : 'Switch recipe'}
    >
      {available.map((r, i) => (
        <option key={r.id} value={i}>
          #{i + 1} {r.station?.replace(/_/g, ' ') || 'crafting'}
        </option>
      ))}
    </select>
  );
}

// ── TreeNodeView ───────────────────────────────────────────────────────────

function TreeNodeView({
  node,
  lang,
  depth,
  recipeIndexMap,
  onRecipeChange,
}: {
  node: TreeNode;
  lang: Lang;
  depth: number;
  recipeIndexMap: Record<string, number>;
  onRecipeChange: (itemId: string, idx: number) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isDepthLimit = !node.isRaw && !node.isCycle && node.children.length === 0 && depth >= 4;
  const indent = depth * 16;

  const stationLabel = node.recipe?.station
    ? (STATION_LABELS[node.recipe.station]?.[lang] ?? node.recipe.station.replace(/_/g, ' '))
    : null;

  const lineOpacity = Math.max(0.07, 0.2 - depth * 0.03);

  // Root node row is hidden — the chip-bar above already shows the item
  if (depth === 0) {
    return (
      <div>
        {node.children.map((child, i) => (
          <TreeNodeView
            key={`${child.itemId}-${i}`}
            node={child}
            lang={lang}
            depth={1}
            recipeIndexMap={recipeIndexMap}
            onRecipeChange={onRecipeChange}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        marginLeft: indent,
        borderLeft: depth > 0 ? `1px solid rgba(240,192,64,${lineOpacity})` : 'none',
        paddingLeft: depth > 0 ? 10 : 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 0',
          cursor: hasChildren ? 'pointer' : 'default',
          fontSize: '.88em',
        }}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        <span style={{
          fontSize: '.78em', width: 10, flexShrink: 0, lineHeight: 1,
          color: hasChildren ? 'var(--gold)' : node.isRaw ? 'var(--green, #4ecca3)' : 'var(--text2)',
        }}>
          {hasChildren ? (expanded ? '▾' : '▸') : node.isRaw ? '●' : node.isCycle ? '↩' : '·'}
        </span>

        <ItemBadge itemId={node.itemId} qty={node.qty} lang={lang} dimmed={node.isRaw} />

        {stationLabel && !node.isRaw && (
          <span style={{ fontSize: '.7em', color: 'var(--text2)', opacity: .45, whiteSpace: 'nowrap', marginLeft: 1 }}>
            · {stationLabel}
          </span>
        )}

        {node.recipe && (
          <RecipeSelector
            itemId={node.itemId}
            recipeIndex={recipeIndexMap[node.itemId] ?? 0}
            onChange={idx => onRecipeChange(node.itemId, idx)}
            lang={lang}
          />
        )}

        {node.isCycle && (
          <span style={{
            fontSize: '.65em', color: 'var(--text2)', background: 'var(--surface2)',
            borderRadius: 10, padding: '1px 6px', opacity: .65,
          }}>
            {lang === 'hu' ? 'körfüggőség' : lang === 'ru' ? 'цикл' : 'cycle'}
          </span>
        )}
        {isDepthLimit && (
          <span style={{ fontSize: '.7em', color: 'var(--text2)', opacity: .35 }}>…</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeView
              key={`${child.itemId}-${i}`}
              node={child}
              lang={lang}
              depth={depth + 1}
              recipeIndexMap={recipeIndexMap}
              onRecipeChange={onRecipeChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Real-data tree preview for empty state ─────────────────────────────────

function TreePreview({ previewId, lang }: { previewId: string; lang: Lang }) {
  const previewTree = useMemo(
    () => buildTree(previewId, 1, 0, new Set(), {}),
    [previewId]
  );
  const item = items[previewId];

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(0,0,0,.15)',
      borderRadius: 7,
      padding: '10px 13px 0',
      marginBottom: 14,
      overflow: 'hidden',
      maxHeight: 162,
      userSelect: 'none',
      pointerEvents: 'none',
    }}>
      {/* Preview root label (not hidden like in the real tree) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: '.85em', marginBottom: 1 }}>
        <span style={{ fontSize: '.78em', color: 'var(--gold)', width: 10 }}>▾</span>
        {item?.img && (
          <img src={`${BASE}/${item.img}`} width={16} height={16} alt=""
            style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
        )}
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{getItemName(previewId, lang)}</span>
        {previewTree.recipe?.station && (
          <span style={{ fontSize: '.7em', color: 'var(--text2)', opacity: .45 }}>
            · {STATION_LABELS[previewTree.recipe.station]?.[lang] ?? previewTree.recipe.station.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      {/* Render children starting at depth=1 */}
      {previewTree.children.map((child, i) => (
        <TreeNodeView
          key={`${child.itemId}-${i}`}
          node={child}
          lang={lang}
          depth={1}
          recipeIndexMap={{}}
          onRecipeChange={() => {}}
        />
      ))}
      {/* Fade overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
        background: 'linear-gradient(to bottom, transparent, var(--surface, #1a1a1f))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const STYLE_ID = 'crafting-tree-styles';

export default function CraftingTree() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('hu');
  const [recipeIndexMap, setRecipeIndexMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = getCurrentLang() as Lang;
    if (saved) setLang(saved);
    const off = onLangChange((l: string) => setLang(l as Lang));
    return off;
  }, []);

  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      .ct-dropdown::-webkit-scrollbar { width: 6px; }
      .ct-dropdown::-webkit-scrollbar-track { background: transparent; }
      .ct-dropdown::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 3px; }
      .ct-dropdown::-webkit-scrollbar-thumb:hover { background: rgba(240,192,64,.3); }
      .ct-dropdown { scrollbar-width: thin; scrollbar-color: var(--surface2) transparent; }
      @keyframes ctFadeSlide {
        from { opacity: 0; transform: translateY(5px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .ct-panel { animation: ctFadeSlide .18s ease; }
    `;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    setRecipeIndexMap({});
  }, [selectedId]);

  const handleRecipeChange = (itemId: string, idx: number) => {
    setRecipeIndexMap(prev => ({ ...prev, [itemId]: idx }));
  };

  const selectItem = (id: string) => {
    setSelectedId(id);
    setQuery(getItemName(id, lang));
  };

  const clearSelection = () => {
    setSelectedId(null);
    setQuery('');
  };

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return Object.entries(items)
      .filter(([id, item]) => {
        const hu = item.name.hu?.toLowerCase() ?? '';
        const en = item.name.en?.toLowerCase() ?? '';
        const ru = item.name.ru?.toLowerCase() ?? '';
        return hu.includes(q) || en.includes(q) || ru.includes(q) || id.includes(q);
      })
      .filter(([id]) => recipesByOutput[id])
      .slice(0, 8);
  }, [query]);

  const tree = useMemo(() => {
    if (!selectedId) return null;
    return buildTree(selectedId, 1, 0, new Set(), recipeIndexMap);
  }, [selectedId, recipeIndexMap]);

  const placeholder =
    lang === 'hu'
      ? 'Keress craftolható itemet…'
      : lang === 'ru'
      ? 'Поиск крафтируемого предмета…'
      : 'Search craftable item…';

  const multiRecipeCount = selectedId ? (recipesByOutput[selectedId]?.length ?? 0) : 0;

  return (
    <div style={{ fontFamily: 'inherit', maxWidth: '100%' }}>

      {/* Search / selected-item bar */}
      {selectedId ? (
        /* Selected state: chip-style display, no separate panel header needed */
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 12px',
          background: 'var(--surface)',
          border: '1px solid rgba(240,192,64,.3)',
          borderRadius: 7,
          marginBottom: 8,
        }}>
          {items[selectedId]?.img && (
            <img
              src={`${BASE}/${items[selectedId].img}`}
              width={20}
              height={20}
              alt=""
              style={{ imageRendering: 'pixelated', flexShrink: 0 }}
            />
          )}
          <span style={{ flex: 1, fontWeight: 500, fontSize: '.93em', color: 'var(--gold)' }}>
            {getItemName(selectedId, lang)}
          </span>
          <RecipeSelector
            itemId={selectedId}
            recipeIndex={recipeIndexMap[selectedId] ?? 0}
            onChange={idx => handleRecipeChange(selectedId, idx)}
            lang={lang}
          />
          <button
            onClick={clearSelection}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text2)', fontSize: '.82em', padding: '3px 5px',
              borderRadius: 4, opacity: .5, lineHeight: 1,
            }}
            title={lang === 'hu' ? 'Új keresés' : lang === 'ru' ? 'Новый поиск' : 'New search'}
          >✕</button>
        </div>
      ) : (
        /* Search state: input + dropdown */
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            fontSize: '.9em', color: 'var(--text2)', pointerEvents: 'none', lineHeight: 1,
          }}>🔍</span>
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '9px 14px 9px 34px',
              background: 'var(--surface)',
              border: `1px solid ${query ? 'rgba(240,192,64,.25)' : 'var(--surface2)'}`,
              borderRadius: 7,
              color: 'var(--text)',
              fontSize: '.95em',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color .2s',
            }}
          />

          {results.length > 0 && (
            <div
              className="ct-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--surface2)',
                borderRadius: 7,
                zIndex: 10,
                maxHeight: 280,
                overflowY: 'auto',
                marginTop: 3,
                boxShadow: '0 6px 20px rgba(0,0,0,.45)',
              }}
            >
              {results.map(([id, item]) => {
                const name = getItemName(id, lang);
                return (
                  <div
                    key={id}
                    onClick={() => selectItem(id)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      borderBottom: '1px solid var(--surface2)',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = '';
                    }}
                  >
                    {item.img && (
                      <img
                        src={`${BASE}/${item.img}`}
                        width={20}
                        height={20}
                        alt=""
                        style={{ imageRendering: 'pixelated', flexShrink: 0 }}
                      />
                    )}
                    <span style={{ flex: 1, fontSize: '.92em' }}>{name}</span>
                    <span style={{ fontSize: '.72em', color: 'var(--text2)', opacity: .55 }}>{id}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tree panel — no header, search bar IS the header */}
      {tree && selectedId && (
        <div
          className="ct-panel"
          style={{
            background: 'var(--surface)',
            borderRadius: 8,
            border: '1px solid var(--surface2)',
            borderTop: '2px solid rgba(240,192,64,.28)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '13px 14px 12px' }}>
            <TreeNodeView
              node={tree}
              lang={lang}
              depth={0}
              recipeIndexMap={recipeIndexMap}
              onRecipeChange={handleRecipeChange}
            />
          </div>

          {/* Footer legend */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
            padding: '7px 14px',
            borderTop: '1px solid var(--surface2)',
            background: 'rgba(0,0,0,.12)',
          }}>
            <span style={{ fontSize: '.7em', color: 'var(--text2)', opacity: .5, marginRight: 1 }}>
              {lang === 'hu' ? 'Jelölések:' : lang === 'ru' ? 'Обозначения:' : 'Key:'}
            </span>
            <span style={{
              fontSize: '.7em', padding: '1px 7px', borderRadius: 20,
              background: 'rgba(240,192,64,.08)', border: '1px solid rgba(240,192,64,.18)', color: 'var(--gold)',
            }}>
              ▸ {lang === 'hu' ? 'kattints a kibontáshoz' : lang === 'ru' ? 'раскрыть' : 'click to expand'}
            </span>
            <span style={{
              fontSize: '.7em', padding: '1px 7px', borderRadius: 20,
              background: 'rgba(78,204,163,.08)', border: '1px solid rgba(78,204,163,.18)', color: 'var(--green, #4ecca3)',
            }}>
              ● {lang === 'hu' ? 'nyersanyag' : lang === 'ru' ? 'сырьё' : 'raw material'}
            </span>
            <span style={{
              fontSize: '.7em', padding: '1px 7px', borderRadius: 20,
              background: 'var(--surface2)', border: '1px solid rgba(255,255,255,.05)', color: 'var(--text2)', opacity: .65,
            }}>
              … {lang === 'hu' ? 'max 4 szint' : lang === 'ru' ? 'макс. 4 уровня' : 'max 4 levels'}
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedId && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 8,
            border: '1px solid var(--surface2)',
            padding: '18px 18px 16px',
          }}
        >
          <div style={{ fontSize: '.83em', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
            {lang === 'hu'
              ? 'Mutatja a teljes hozzávalóláncot — a kész itemtől vissza a nyersanyagokig.'
              : lang === 'ru'
              ? 'Отображает полную цепочку компонентов — от готового предмета до исходных материалов.'
              : 'Shows the full ingredient chain — from the finished item back to raw materials.'}
          </div>

          {/* Real tree preview with fade */}
          {featuredItems[0] && <TreePreview previewId={featuredItems[0]} lang={lang} />}

          {/* Featured item chips */}
          {featuredItems.length > 0 && (
            <div>
              <div style={{ fontSize: '.72em', color: 'var(--text2)', opacity: .55, marginBottom: 7 }}>
                {lang === 'hu' ? 'Próbáld ki:' : lang === 'ru' ? 'Попробуйте:' : 'Try:'}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {featuredItems.map(id => {
                  const item = items[id];
                  return (
                    <button
                      key={id}
                      onClick={() => selectItem(id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px 4px 7px',
                        background: 'var(--surface2)',
                        border: '1px solid rgba(255,255,255,.07)',
                        borderRadius: 20,
                        cursor: 'pointer',
                        color: 'var(--text)',
                        fontSize: '.8em',
                        transition: 'border-color .15s, background .15s',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = 'rgba(240,192,64,.3)';
                        el.style.background = 'rgba(240,192,64,.07)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = 'rgba(255,255,255,.07)';
                        el.style.background = 'var(--surface2)';
                      }}
                    >
                      {item?.img && (
                        <img
                          src={`${BASE}/${item.img}`}
                          width={16}
                          height={16}
                          alt=""
                          style={{ imageRendering: 'pixelated' }}
                        />
                      )}
                      {getItemName(id, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
