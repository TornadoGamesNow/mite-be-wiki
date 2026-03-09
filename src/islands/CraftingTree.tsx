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

// Build lookup: output item_id → recipes that produce it
const recipesByOutput: Record<string, Recipe[]> = {};
for (const r of recipes) {
  const outputId = Array.isArray(r.output) ? r.output[0] : r.output;
  if (!outputId) continue;
  if (!recipesByOutput[outputId]) recipesByOutput[outputId] = [];
  recipesByOutput[outputId].push(r);
}

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

  // Aggregate ingredient counts (merge duplicates)
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

function ItemBadge({ itemId, qty, lang }: { itemId: string; qty: number; lang: Lang }) {
  const item = items[itemId];
  const displayQty = Math.ceil(qty * 100) / 100; // round to 2 decimals
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {item?.img && (
        <img
          src={`${BASE}/${item.img}`}
          width={20}
          height={20}
          alt=""
          style={{ imageRendering: 'pixelated', flexShrink: 0 }}
        />
      )}
      <span>
        {displayQty !== 1 && (
          <strong style={{ color: 'var(--gold)', marginRight: 2 }}>
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
        fontSize: '.75em',
        padding: '1px 4px',
        marginLeft: 6,
        background: 'var(--surface)',
        border: '1px solid var(--surface2)',
        borderRadius: 3,
        color: 'var(--text)',
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
  const indent = depth * 18;

  const stationLabel = node.recipe?.station
    ? node.recipe.station.replace(/_/g, ' ')
    : null;

  return (
    <div
      style={{
        marginLeft: indent,
        borderLeft: depth > 0 ? '1px solid var(--surface2)' : 'none',
        paddingLeft: depth > 0 ? 10 : 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          cursor: hasChildren ? 'pointer' : 'default',
          opacity: node.isRaw ? 0.65 : 1,
          flexWrap: 'wrap',
        }}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {/* Expand/collapse indicator */}
        <span style={{ fontSize: '.8em', width: 10, flexShrink: 0, color: 'var(--gold)' }}>
          {hasChildren ? (expanded ? '▾' : '▸') : node.isRaw ? '●' : node.isCycle ? '↩' : '…'}
        </span>

        <ItemBadge itemId={node.itemId} qty={node.qty} lang={lang} />

        {/* Station badge */}
        {stationLabel && (
          <span
            style={{
              fontSize: '.72em',
              color: 'var(--text2)',
              background: 'var(--surface2)',
              borderRadius: 3,
              padding: '1px 5px',
              marginLeft: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {stationLabel}
          </span>
        )}

        {/* Recipe switcher for multi-recipe items */}
        {node.recipe && (
          <RecipeSelector
            itemId={node.itemId}
            recipeIndex={recipeIndexMap[node.itemId] ?? 0}
            onChange={idx => onRecipeChange(node.itemId, idx)}
            lang={lang}
          />
        )}

        {/* Labels */}
        {node.isRaw && (
          <span style={{ fontSize: '.72em', color: 'var(--text2)', fontStyle: 'italic' }}>
            {lang === 'hu' ? 'nyersanyag' : lang === 'ru' ? 'сырьё' : 'raw'}
          </span>
        )}
        {node.isCycle && (
          <span style={{ fontSize: '.72em', color: 'var(--text2)', fontStyle: 'italic' }}>
            {lang === 'hu' ? 'körfüggőség' : lang === 'ru' ? 'цикл' : 'cycle'}
          </span>
        )}
        {isDepthLimit && (
          <span style={{ fontSize: '.72em', color: 'var(--text2)', fontStyle: 'italic' }}>
            …
          </span>
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

// ── Main component ─────────────────────────────────────────────────────────

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

  // Reset recipe selections when selected item changes
  useEffect(() => {
    setRecipeIndexMap({});
  }, [selectedId]);

  const handleRecipeChange = (itemId: string, idx: number) => {
    setRecipeIndexMap(prev => ({ ...prev, [itemId]: idx }));
  };

  // Search results — only craftable items
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
      ? 'Keress craftolható itemet...'
      : lang === 'ru'
      ? 'Поиск крафтируемого предмета...'
      : 'Search craftable item...';

  const emptyHint =
    lang === 'hu'
      ? 'Keress egy itemet a crafting fa megjelenítéséhez'
      : lang === 'ru'
      ? 'Найдите предмет для отображения дерева крафта'
      : 'Search for an item to display its crafting tree';

  const treeLabel =
    lang === 'hu' ? 'Crafting fa' : lang === 'ru' ? 'Дерево крафта' : 'Crafting tree';

  return (
    <div style={{ fontFamily: 'inherit', maxWidth: 720 }}>
      {/* Search box */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedId(null);
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '9px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--surface2)',
            borderRadius: 6,
            color: 'var(--text)',
            fontSize: '1em',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {results.length > 0 && !selectedId && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--bg2, var(--surface))',
              border: '1px solid var(--surface2)',
              borderRadius: 6,
              zIndex: 10,
              maxHeight: 300,
              overflowY: 'auto',
              marginTop: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,.4)',
            }}
          >
            {results.map(([id, item]) => {
              const name = getItemName(id, lang);
              return (
                <div
                  key={id}
                  onClick={() => {
                    setSelectedId(id);
                    setQuery(name);
                  }}
                  style={{
                    padding: '7px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderBottom: '1px solid var(--surface2)',
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
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  <span style={{ flex: 1 }}>{name}</span>
                  <span style={{ fontSize: '.75em', color: 'var(--text2)' }}>{id}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tree */}
      {tree && selectedId && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 8,
            padding: '14px 16px',
            border: '1px solid var(--surface2)',
          }}
        >
          <div style={{ marginBottom: 10, fontSize: '.85em', color: 'var(--text2)' }}>
            {treeLabel}:{' '}
            <strong style={{ color: 'var(--gold)' }}>{getItemName(selectedId, lang)}</strong>
            {(recipesByOutput[selectedId]?.length ?? 0) > 1 && (
              <span style={{ marginLeft: 8, fontSize: '.85em' }}>
                (
                {lang === 'hu'
                  ? `${recipesByOutput[selectedId].length} recept`
                  : lang === 'ru'
                  ? `${recipesByOutput[selectedId].length} рецепта`
                  : `${recipesByOutput[selectedId].length} recipes`}
                )
              </span>
            )}
          </div>

          <TreeNodeView
            node={tree}
            lang={lang}
            depth={0}
            recipeIndexMap={recipeIndexMap}
            onRecipeChange={handleRecipeChange}
          />

          <div style={{ marginTop: 10, fontSize: '.75em', color: 'var(--text2)', borderTop: '1px solid var(--surface2)', paddingTop: 8 }}>
            {lang === 'hu'
              ? '▸ kattints az összetevőkre a kibontáshoz · ● = nyersanyag · … = max mélység (4 szint)'
              : lang === 'ru'
              ? '▸ нажмите на ингредиент чтобы раскрыть · ● = сырьё · … = макс. глубина (4 уровня)'
              : '▸ click ingredients to expand · ● = raw material · … = max depth (4 levels)'}
          </div>
        </div>
      )}

      {!selectedId && (
        <div style={{ color: 'var(--text2)', fontSize: '.9em', padding: '16px 0' }}>
          {emptyHint}
        </div>
      )}
    </div>
  );
}
