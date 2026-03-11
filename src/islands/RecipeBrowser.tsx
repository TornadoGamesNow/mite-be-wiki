import { useState, useEffect, useMemo, useRef } from 'react';
import { getCurrentLang, onLangChange } from '../i18n/lang';
import type { Lang } from '../i18n/types';
import type { Recipe, SlotValue } from '../data/types';
import recipesData from '../../data/recipes.json';
import itemsData from '../../data/items.json';

const recipes = recipesData as Recipe[];
const items = itemsData as Record<string, any>;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Tier progression order for sorting merged slot alternatives
const TIER_ORDER = [null, 'flint', 'copper', 'silver', 'gold', 'iron', 'hard', 'ancient', 'mithril', 'adamantium'];

// Variant groups: items that are interchangeable (same structural role)
const VARIANT_GROUPS: Record<string, string> = {
  planks_oak: 'G:planks', planks_spruce: 'G:planks', planks_birch: 'G:planks', planks_jungle: 'G:planks',
  log_oak: 'G:log', log_spruce: 'G:log', log_birch: 'G:log', log_jungle: 'G:log',
  coal: 'G:fuel', charcoal: 'G:fuel',
  string: 'G:rope', leather_rope: 'G:rope', silk: 'G:rope',
};

// Tier-based stations normalize to a common placeholder so recipes that share
// the same pattern but require different workbench tiers still merge together.
const TIERED_STATIONS: Record<string, string> = {
  flint_workbench: 'S:workbench',
  copper_workbench: 'S:workbench', silver_workbench: 'S:workbench',
  gold_workbench: 'S:workbench', iron_workbench: 'S:workbench',
  hardstone_workbench: 'S:workbench', ancient_metal_workbench: 'S:workbench',
  mithril_workbench: 'S:workbench', adamantium_workbench: 'S:workbench',
};

function tierIndex(id: string): number {
  if (id === '_') return -1;
  const item = items[id];
  if (!item) return 0;
  return TIER_ORDER.indexOf(item.tier ?? null);
}

/** Replace tier-based items with a canonical placeholder for structural comparison */
function toStructuralKey(recipe: Recipe): string {
  const normalized = recipe.pattern.map((row) =>
    row.map((slot) => {
      const id = Array.isArray(slot) ? slot[0] : slot;
      if (id === '_') return '_';
      const item = items[id];
      if (!item) return id;
      // Items with a tier are "variable" — replace with TIER placeholder
      if (VARIANT_GROUPS[id]) return VARIANT_GROUPS[id];
      if (item.tier) return `T`;
      return id;
    })
  );
  const stationKey = TIERED_STATIONS[recipe.station] ?? recipe.station;
  return `${stationKey}||${recipe.gridSize}||${JSON.stringify(normalized)}`;
}

interface MergedRecipe {
  id: string;
  station: string;
  gridSize: string;
  pattern: SlotValue[][];
  outputs: string[];      // ordered list of outputs (one per tier variant)
  outputCount?: number;
  label: { hu: string; en: string };
  tags: string[];
  tooltip?: { hu: string; en: string };
  variantCount: number;   // how many tier variants were merged
}

function mergeRecipes(source: Recipe[]): MergedRecipe[] {
  const groups = new Map<string, Recipe[]>();

  for (const r of source) {
    const key = toStructuralKey(r);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return [...groups.values()].map((group) => {
    if (group.length === 1) {
      const r = group[0];
      return {
        id: r.id,
        station: r.station,
        gridSize: r.gridSize,
        pattern: r.pattern,
        outputs: [r.output],
        outputCount: r.outputCount,
        label: r.label,
        tags: r.tags ?? [],
        tooltip: r.tooltip,
        variantCount: 1,
      };
    }

    // Sort group by tier (lowest → highest)
    group.sort((a, b) => tierIndex(a.output) - tierIndex(b.output));
    const base = group[0];

    // Build merged pattern: variable slots become arrays
    const rows = base.pattern.length;
    const cols = base.pattern[0].length;
    const mergedPattern: SlotValue[][] = Array.from({ length: rows }, (_, ri) =>
      Array.from({ length: cols }, (_, ci) => {
        const baseSlot = base.pattern[ri][ci];
        const baseId = Array.isArray(baseSlot) ? baseSlot[0] : baseSlot;
        if (baseId === '_') return '_';
        const baseItem = items[baseId];

        if (baseItem?.tier || VARIANT_GROUPS[baseId]) {
          // This is a tier-based slot — collect all variants in tier order
          const variants = group.map((r) => {
            const s = r.pattern[ri][ci];
            return Array.isArray(s) ? s[0] : s;
          });
          // Deduplicate while preserving order
          const unique = [...new Set(variants)];
          if (unique.length > 1) return unique;
          // Only one unique value — but the original slot may already be an array
          // (e.g. planks array on all recipes in the group): preserve it
          if (Array.isArray(baseSlot)) return baseSlot;
          return unique[0];
        }

        // Non-variable slot — check if any recipe differs here
        const allSame = group.every((r) => {
          const s = r.pattern[ri][ci];
          const id = Array.isArray(s) ? s[0] : s;
          return id === baseId;
        });
        if (allSame) return baseSlot;

        // Different non-tier items (e.g. different handles) — collect as array
        const variants = [...new Set(group.map((r) => {
          const s = r.pattern[ri][ci];
          return Array.isArray(s) ? s[0] : s;
        }))];
        return variants.length > 1 ? variants : variants[0];
      })
    );

    return {
      id: base.id,
      station: base.station,
      gridSize: base.gridSize,
      pattern: mergedPattern,
      outputs: group.map((r) => r.output),
      outputCount: base.outputCount,
      label: base.label,
      tags: [...new Set(group.flatMap((r) => r.tags ?? []))],
      tooltip: base.tooltip,
      variantCount: group.length,
    };
  });
}

function getItem(id: string) {
  if (id === '_' || !id) return null;
  return items[id] || null;
}

// --- CyclingSlot ---

interface CyclingSlotProps {
  slot: SlotValue;
  lang: Lang;
  tick: number;
  onHover: (hovering: boolean) => void;
}

function CyclingSlot({ slot, lang, tick, onHover }: CyclingSlotProps) {
  const ids = Array.isArray(slot) ? slot : [slot];
  if (!ids.length || ids[0] === '_') return <div className="craft-slot empty" />;

  const idx = ids.length > 1 ? tick % ids.length : 0;
  const item = getItem(ids[idx]);
  if (!item) return <div className="craft-slot empty" />;

  const isCycling = ids.length > 1;

  const allNames = ids.map(id => items[id]?.name[lang] ?? id);

  return (
    <div
      className={`craft-slot${isCycling ? ' slot-cycling' : ''}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <img
        src={`${BASE}/${item.img}`}
        alt={item.name[lang]}
        loading="lazy"
        style={{ transition: 'opacity 0.2s' }}
      />
      {isCycling && <div className="slot-cycle-dot" />}
      <div className="mc-tooltip">
        <div
          className="tt-name"
          style={item.tier ? { color: `var(--${item.tier})` } : { color: '#aaa' }}
        >
          {item.name[lang]}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

const allStations = [...new Set(recipes.map((r) => r.station))];
const allTags = [...new Set(recipes.flatMap((r) => r.tags || []))].sort();

export default function RecipeBrowser() {
  const [lang, setLang] = useState<Lang>('hu');
  const [stationFilter, setStationFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tick, setTick] = useState(0);
  const [hovering, setHovering] = useState(false);
  const hoveringRef = useRef(false);

  const handleHover = (val: boolean) => {
    hoveringRef.current = val;
    setHovering(val);
  };

  useEffect(() => {
    setLang(getCurrentLang());
    return onLangChange((l) => setLang(l as Lang));
  }, []);

  // Single persistent interval — never restarts, only skips tick when hovering
  useEffect(() => {
    const id = setInterval(() => {
      if (!hoveringRef.current) setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const merged = useMemo(() => mergeRecipes(recipes), []);

  const filtered = useMemo(() => {
    return merged.filter((r) => {
      if (stationFilter && r.station !== stationFilter) return false;
      if (tagFilter && !r.tags.includes(tagFilter)) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        const label = r.label[lang].toLowerCase();
        const tags = r.tags.join(' ').toLowerCase();
        if (!label.includes(kw) && !tags.includes(kw) && !r.id.includes(kw)) return false;
      }
      return true;
    });
  }, [merged, stationFilter, tagFilter, keyword, lang]);

  const stationLabel = lang === 'hu' ? 'Munkaasztal' : lang === 'ru' ? 'Станция' : 'Station';
  const tagLabel = lang === 'hu' ? 'Címke' : lang === 'ru' ? 'Тег' : 'Tag';
  const searchLabel = lang === 'hu' ? 'Keresés...' : lang === 'ru' ? 'Поиск...' : 'Search...';
  const allLabel = lang === 'hu' ? 'Mind' : lang === 'ru' ? 'Все' : 'All';
  const countLabel = lang === 'hu' ? `${filtered.length} recept` : lang === 'ru' ? `${filtered.length} рецептов` : `${filtered.length} recipes`;

  return (
    <div style={{ margin: '14px 0' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          aria-label={stationLabel}
          style={{
            background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--surface2)',
            borderRadius: '6px', padding: '6px 10px', fontSize: '.85em',
          }}
        >
          <option value="">{allLabel} {stationLabel}</option>
          {allStations.map((s) => (
            <option key={s} value={s}>
              {s === 'hand' ? (lang === 'hu' ? 'Kézzel' : lang === 'ru' ? 'Вручную' : 'By Hand') : s}
            </option>
          ))}
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          aria-label={tagLabel}
          style={{
            background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--surface2)',
            borderRadius: '6px', padding: '6px 10px', fontSize: '.85em',
          }}
        >
          <option value="">{allLabel} {tagLabel}</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <input
          type="text"
          placeholder={searchLabel}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--surface2)',
            borderRadius: '6px', padding: '6px 10px', fontSize: '.85em', flex: '1', minWidth: '150px',
          }}
        />

        <span style={{ color: 'var(--text2)', fontSize: '.82em' }}>{countLabel}</span>
      </div>

      <div className="craft-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {filtered.map((recipe) => {
          const outputIds = recipe.outputs;
          const distinctOutputIds = [...new Set(outputIds)];
          const outputIdx = outputIds.length > 1 ? tick % outputIds.length : 0;
          const outputItem = getItem(outputIds[outputIdx]);

          return (
            <div key={recipe.id} className="craft-table">
              {distinctOutputIds.length > 1 && (
                <div className="craft-variant-badge" title={
                  lang === 'hu'
                    ? `${distinctOutputIds.length} változat`
                    : lang === 'ru'
                      ? `${distinctOutputIds.length} вариантов`
                      : `${distinctOutputIds.length} variants`
                }>
                  ×{distinctOutputIds.length}
                </div>
              )}
              <div className={`craft-grid ${recipe.gridSize === '2x2' ? 'g2x2' : 'g3x3'}`}>
                {recipe.pattern.flat().map((slot, i) => (
                  <CyclingSlot
                    key={i}
                    slot={slot}
                    lang={lang}
                    tick={tick}
                    onHover={handleHover}
                  />
                ))}
              </div>
              <div className="craft-arrow-box">→</div>
              <div className="craft-output">
                {outputItem ? (
                  <div
                    className="craft-slot"
                    onMouseEnter={() => handleHover(true)}
                    onMouseLeave={() => handleHover(false)}
                  >
                    <img src={`${BASE}/${outputItem.img}`} alt={outputItem.name[lang]} loading="lazy" />
                    {recipe.outputCount && recipe.outputCount > 1 && (
                      <span className="slot-label">{recipe.outputCount}</span>
                    )}
                    <div className="mc-tooltip">
                      <div
                        className="tt-name"
                        style={outputItem.tier ? { color: `var(--${outputItem.tier})` } : { color: '#aaa' }}
                      >
                        {outputItem.name[lang]}
                      </div>
                      {recipe.tooltip && (
                        <div className="tt-desc">{recipe.tooltip[lang]}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="craft-slot empty" />
                )}
              </div>
              <div className="craft-label">
                {outputItem ? outputItem.name[lang] : recipe.label[lang]}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--text2)', padding: '20px', textAlign: 'center', width: '100%' }}>
            {lang === 'hu' ? 'Nincs egyező recept.' : lang === 'ru' ? 'Нет подходящих рецептов.' : 'No matching recipes.'}
          </p>
        )}
      </div>
    </div>
  );
}
