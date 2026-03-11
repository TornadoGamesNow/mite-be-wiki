import { useState, useEffect, useMemo } from 'react';
import itemsRaw from '../../data/items.json';
import recipesRaw from '../../data/recipes_full.json';
import { buildRecipesByOutput, getCanonicalItemId, getItemAliasIds, isItemRemoved } from '../data/item-status';

interface ItemInfo {
  mcmod_id?: number;
  desc?: string;
  desc_en?: string;
  desc_hu?: string;
  desc_ru?: string;
  added?: string;
  removed_v?: string;
  removed?: boolean;
  versions?: string[];
  versions_en?: string[];
  versions_hu?: string[];
  versions_ru?: string[];
}

const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';

interface ItemData {
  id: string;
  name: { hu: string; en: string; ru?: string };
  img?: string;
  tier?: string;
  category?: string;
  removed_in?: string;
  max_durability?: number;
}

// Convert items.json object to array
const allItems: ItemData[] = Object.entries(itemsRaw as Record<string, Omit<ItemData, 'id'>>).map(
  ([id, v]) => ({ id, ...v })
);

const recipesByOutput = buildRecipesByOutput(recipesRaw as any[]);
const itemsWithRecipe = new Set(Object.keys(recipesByOutput));
const visibleItems = allItems.filter(item => getCanonicalItemId(item.id) === item.id);

const STATION_LABELS: Record<string, { hu: string; en: string; ru: string }> = {
  flint_workbench:          { hu: 'Kovakő Munkaasztal',     en: 'Flint Workbench',          ru: 'Кремнёвый верстак' },
  copper_workbench:         { hu: 'Réz Munkaasztal',        en: 'Copper Workbench',         ru: 'Медный верстак' },
  silver_workbench:         { hu: 'Ezüst Munkaasztal',      en: 'Silver Workbench',         ru: 'Серебряный верстак' },
  gold_workbench:           { hu: 'Arany Munkaasztal',      en: 'Gold Workbench',           ru: 'Золотой верстак' },
  iron_workbench:           { hu: 'Vas Munkaasztal',        en: 'Iron Workbench',           ru: 'Железный верстак' },
  hardstone_workbench:      { hu: 'Kőmag Munkaasztal',      en: 'Hardstone Workbench',      ru: 'Твердокаменный верстак' },
  ancient_metal_workbench:  { hu: 'Ősi Fém Munkaasztal',    en: 'Ancient Metal Workbench',  ru: 'Верстак из древнего металла' },
  mithril_workbench:        { hu: 'Mithril Munkaasztal',    en: 'Mithril Workbench',        ru: 'Мифриловый верстак' },
  adamantium_workbench:     { hu: 'Adamantium Munkaasztal', en: 'Adamantium Workbench',     ru: 'Адамантиевый верстак' },
  blast_furnace:            { hu: 'Nagy Kemence',           en: 'Blast Furnace',            ru: 'Доменная печь' },
  stone_furnace:            { hu: 'Kő Kemence',             en: 'Stone Furnace',            ru: 'Каменная печь' },
  obsidian_furnace:         { hu: 'Obszidián Kemence',      en: 'Obsidian Furnace',         ru: 'Обсидиановая печь' },
  netherrack_furnace:       { hu: 'Pokoli Kő Kemence',      en: 'Netherrack Furnace',       ru: 'Печь из адского камня' },
  brewing_stand:            { hu: 'Főzetállvány',           en: 'Brewing Stand',            ru: 'Стойка для зелий' },
  cauldron:                 { hu: 'Üst',                    en: 'Cauldron',                 ru: 'Котёл' },
  hand:                     { hu: 'Kézzel',                 en: 'By hand',                  ru: 'Руками' },
};

// --- Tier metadata ---
const TIER_META: Record<string, { hu: string; en: string; ru: string; color: string; bg: string }> = {
  flint:              { hu: 'Kovakő',            en: 'Flint',              ru: 'Кремень',                color: '#aaaaaa', bg: 'rgba(170,170,170,.15)' },
  bone:               { hu: 'Csont',              en: 'Bone',               ru: 'Кость',                  color: '#d4c88a', bg: 'rgba(212,200,138,.15)' },
  wood:               { hu: 'Fa',                 en: 'Wood',               ru: 'Дерево',                 color: '#a0522d', bg: 'rgba(160,82,45,.15)' },
  stone:              { hu: 'Kő',                 en: 'Stone',              ru: 'Камень',                 color: '#9e9e9e', bg: 'rgba(158,158,158,.15)' },
  copper:             { hu: 'Réz',                en: 'Copper',             ru: 'Медь',                   color: '#cd7f32', bg: 'rgba(205,127,50,.15)' },
  tin:                { hu: 'Ón',                 en: 'Tin',                ru: 'Олово',                  color: '#bfbfbf', bg: 'rgba(191,191,191,.15)' },
  silver:             { hu: 'Ezüst',              en: 'Silver',             ru: 'Серебро',                color: '#c0c0c0', bg: 'rgba(192,192,192,.15)' },
  bronze:             { hu: 'Bronz',              en: 'Bronze',             ru: 'Бронза',                 color: '#b87333', bg: 'rgba(184,115,51,.15)' },
  iron:               { hu: 'Vas',                en: 'Iron',               ru: 'Железо',                 color: '#d4d4d4', bg: 'rgba(212,212,212,.12)' },
  gold:               { hu: 'Arany',              en: 'Gold',               ru: 'Золото',                 color: '#f0c040', bg: 'rgba(240,192,64,.15)' },
  hard:               { hu: 'Kőmag',              en: 'Hardstone',          ru: 'Твердокамень',         color: '#7ecaab', bg: 'rgba(126,202,171,.15)' },
  obsidian:           { hu: 'Obszidián',           en: 'Obsidian',           ru: 'Обсидиан',               color: '#7c4dff', bg: 'rgba(124,77,255,.15)' },
  rusted_iron:        { hu: 'Rozsdás Vas',         en: 'Rusted Iron',        ru: 'Ржавое железо',          color: '#b34700', bg: 'rgba(179,71,0,.15)' },
  silver_copper:      { hu: 'Ezüst-Réz',           en: 'Silver-Copper',      ru: 'Серебряно-медный',       color: '#a8c0cd', bg: 'rgba(168,192,205,.15)' },
  high_carbon_steel:  { hu: 'Szénacél',            en: 'High Carbon Steel',  ru: 'Высокоуглеродистая сталь', color: '#b0bec5', bg: 'rgba(176,190,197,.15)' },
  ancient_metal:      { hu: 'Ős Fém',              en: 'Ancient Metal',      ru: 'Древний металл',         color: '#c8a034', bg: 'rgba(200,160,52,.15)' },
  mithril:            { hu: 'Mithril',             en: 'Mithril',            ru: 'Мифрил',                 color: '#7ec8e3', bg: 'rgba(126,200,227,.15)' },
  adamantium:         { hu: 'Adamantium',           en: 'Adamantium',         ru: 'Адамантий',              color: '#b388ff', bg: 'rgba(179,136,255,.15)' },
  mercury:            { hu: 'Higany',              en: 'Mercury',            ru: 'Ртуть',                  color: '#80cbc4', bg: 'rgba(128,203,196,.15)' },
};

const CATEGORY_META: Record<string, { hu: string; en: string; ru: string; icon: string }> = {
  weapon:   { hu: 'Fegyver',     en: 'Weapon',    ru: 'Оружие',      icon: '⚔️' },
  tool:     { hu: 'Eszköz',      en: 'Tool',      ru: 'Инструмент',  icon: '⛏️' },
  armor:    { hu: 'Páncél',      en: 'Armor',     ru: 'Броня',       icon: '🛡️' },
  material: { hu: 'Anyag',       en: 'Material',  ru: 'Материал',    icon: '🪨' },
  block:    { hu: 'Blokk',       en: 'Block',     ru: 'Блок',        icon: '🧱' },
  food:     { hu: 'Étel',        en: 'Food',      ru: 'Еда',         icon: '🍖' },
  ingot:    { hu: 'Rúd',         en: 'Ingot',     ru: 'Слиток',      icon: '📦' },
  station:  { hu: 'Állomás',     en: 'Station',   ru: 'Станция',     icon: '🏗️' },
  misc:     { hu: 'Egyéb',       en: 'Misc',      ru: 'Разное',      icon: '🎒' },
};

const TIER_ORDER = ['flint','bone','wood','stone','copper','tin','silver','bronze','iron',
  'gold','hard','obsidian','rusted_iron','silver_copper','high_carbon_steel',
  'ancient_metal','mithril','adamantium','mercury'];

// Precompute tier progression groups: base_name → sorted list of ItemData
const tierGroups: Record<string, ItemData[]> = {};
for (const item of visibleItems) {
  if (!item.tier) continue;
  if (item.id.startsWith(item.tier + '_')) {
    const base = item.id.slice(item.tier.length + 1);
    if (!tierGroups[base]) tierGroups[base] = [];
    tierGroups[base].push(item);
  }
}
// Sort each group by tier order
for (const base in tierGroups) {
  tierGroups[base].sort((a, b) =>
    (TIER_ORDER.indexOf(a.tier!) - TIER_ORDER.indexOf(b.tier!))
  );
  // Only keep groups with 2+ members
  if (tierGroups[base].length < 2) delete tierGroups[base];
}

function getTierGroup(item: ItemData): ItemData[] | null {
  if (!item.tier || !item.id.startsWith(item.tier + '_')) return null;
  const base = item.id.slice(item.tier.length + 1);
  return tierGroups[base] ?? null;
}

const CAT_ORDER = ['weapon','tool','armor','material','block','food','ingot','station','misc'];

function ItemIcon({ item, size }: { item: ItemData; size: number }) {
  const [err, setErr] = useState(false);
  if (!item.img || err) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, fontSize: size * 0.5, lineHeight: 1, flexShrink: 0,
        background: 'var(--surface2)', borderRadius: 4 }}>
        📦
      </span>
    );
  }
  return (
    <img
      src={`${BASE}/${item.img}`}
      alt={item.id}
      width={size} height={size}
      loading="lazy"
      onError={() => setErr(true)}
      style={{ imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0, display: 'block' }}
    />
  );
}

function TierPill({ tier, lang }: { tier: string; lang: string }) {
  const meta = TIER_META[tier];
  if (!meta) return <span style={{ fontSize: '.7em', color: 'var(--text2)' }}>{tier}</span>;
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 10,
      fontSize: '.7em', fontWeight: 700,
      background: meta.bg, color: meta.color,
      border: `1px solid ${meta.color}55`,
    }}>
      {meta[lang as 'hu' | 'en' | 'ru']}
    </span>
  );
}

export default function ItemExplorer() {
  const [lang, setLang] = useState<string>('hu');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selected, setSelected] = useState<ItemData | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const [itemInfo, setItemInfo] = useState<Record<string, ItemInfo>>({});

  useEffect(() => {
    fetch(`${BASE}/data/item_info.json`)
      .then(r => r.json())
      .then(setItemInfo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mite-wiki-lang');
      if (stored) setLang(stored);
    } catch {}
    function onLang(e: Event) { setLang((e as CustomEvent).detail ?? 'hu'); }
    window.addEventListener('mite-lang-change', onLang);
    return () => window.removeEventListener('mite-lang-change', onLang);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && selected) setSelected(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  function getInfo(itemId: string): ItemInfo | undefined {
    for (const id of getItemAliasIds(itemId)) {
      const info = itemInfo[id];
      if (info) return info;
    }
    return undefined;
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visibleItems.filter(item => {
      if (catFilter && item.category !== catFilter) return false;
      if (tierFilter && item.tier !== tierFilter) return false;
      const info = getInfo(item.id);
      if (!showRemoved && isItemRemoved(item.id, item, info, recipesByOutput)) return false;
      if (q) {
        const nameMatch = item.name.hu.toLowerCase().includes(q)
          || item.name.en.toLowerCase().includes(q)
          || (item.name.ru ?? '').toLowerCase().includes(q)
          || item.id.includes(q)
          || getItemAliasIds(item.id).some(id => id.includes(q));
        const descMatch = (info?.desc_hu ?? '').toLowerCase().includes(q)
          || (info?.desc_en ?? '').toLowerCase().includes(q)
          || (info?.desc_ru ?? '').toLowerCase().includes(q);
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [search, catFilter, tierFilter, showRemoved, itemInfo]);

  const isFiltered = catFilter !== '' || tierFilter !== '' || search !== '';

  // Available tiers in current filtered set (for tier filter buttons)
  const tiersInCat = useMemo(() => {
    const base = catFilter
      ? visibleItems.filter(i => i.category === catFilter)
      : visibleItems;
    return new Set(base.map(i => i.tier).filter(Boolean));
  }, [catFilter]);

  function pillStyle(active: boolean, color?: string, bg?: string) {
    return {
      padding: '3px 11px', borderRadius: 20, fontSize: '.78em', fontWeight: active ? 700 : 600,
      cursor: 'pointer',
      border: `1px solid ${active && color ? color + '88' : 'var(--surface2)'}`,
      background: active && bg ? bg : 'transparent',
      color: active && color ? color : 'var(--text2)',
      transition: 'all .15s',
      fontFamily: 'inherit',
    } as React.CSSProperties;
  }

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .item-card { transition: all .15s; }
        .item-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,.45); transform: translateY(-2px); }
        .item-card:hover:not(.ic-selected):not(.ic-removed) { border-color: rgba(240,192,64,.4) !important; background: rgba(240,192,64,.04) !important; }
        .item-card.ic-selected:hover { box-shadow: 0 0 0 1px rgba(240,192,64,.5), 0 4px 14px rgba(0,0,0,.4), inset 0 1px 0 rgba(240,192,64,.1); }
        .item-grid { scrollbar-width: thin; scrollbar-color: var(--surface2) transparent; }
        .item-grid::-webkit-scrollbar { width: 4px; }
        .item-grid::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 2px; }
        .item-grid::-webkit-scrollbar-track { background: transparent; }
      `}</style>
      {/* Filter bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--surface2)',
        borderRadius: 8, padding: '11px 14px', marginBottom: 10,
      }}>

        {/* Search row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center',
          paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 7 }}>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '.6px', fontWeight: 600, minWidth: 64, marginRight: 2, flexShrink: 0 }}>
            {lang === 'hu' ? 'Keresés' : lang === 'ru' ? 'Поиск' : 'Search'}
          </span>
          <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 340 }}>
            <input
              type="search"
              placeholder={lang === 'hu' ? 'Item keresése…' : lang === 'ru' ? 'Поиск предметов…' : 'Search items…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '6px 28px 6px 10px', borderRadius: 6,
                       border: `1px solid ${search ? 'rgba(240,192,64,.35)' : 'rgba(255,255,255,.09)'}`,
                       background: 'rgba(0,0,0,.15)', color: 'var(--text)',
                       width: '100%', boxSizing: 'border-box',
                       fontFamily: 'inherit', fontSize: '.88em', outline: 'none',
                       transition: 'border-color .2s' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                         background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                         fontSize: '.9em', padding: '2px 4px', lineHeight: 1 }}>×</button>
            )}
          </div>
          <button
            onClick={() => setShowRemoved(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto',
              padding: '4px 10px 4px 7px', borderRadius: 20, fontSize: '.78em', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', flexShrink: 0,
              border: `1px solid ${showRemoved ? 'rgba(233,69,96,.7)' : 'rgba(255,255,255,.09)'}`,
              background: showRemoved ? 'rgba(233,69,96,.13)' : 'transparent',
              color: showRemoved ? '#e94560' : 'var(--text2)',
            }}
          >
            <span style={{
              display: 'inline-flex', width: 24, height: 13, borderRadius: 7, alignItems: 'center',
              background: showRemoved ? 'rgba(233,69,96,.4)' : 'var(--surface2)',
              padding: '0 2px', transition: 'all .2s', flexShrink: 0,
              justifyContent: showRemoved ? 'flex-end' : 'flex-start',
            }}>
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: showRemoved ? '#e94560' : 'var(--text2)',
                transition: 'background .2s', flexShrink: 0,
              }} />
            </span>
            {lang === 'hu' ? 'Eltávolítottak' : lang === 'ru' ? 'Удалённые' : 'Removed'}
          </button>
        </div>

        {/* Category row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
          paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 7 }}>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '.6px', fontWeight: 600, minWidth: 64, marginRight: 2, flexShrink: 0 }}>
            {lang === 'hu' ? 'Kateg.' : lang === 'ru' ? 'Катег.' : 'Cat.'}
          </span>
          <button onClick={() => { setCatFilter(''); setTierFilter(''); }} style={pillStyle(catFilter === '')}>
            {lang === 'hu' ? 'Mind' : lang === 'ru' ? 'Все' : 'All'}
            <span style={{ opacity: .4, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>
              ({allItems.length})
            </span>
          </button>
          {CAT_ORDER.map(cat => {
            const meta = CATEGORY_META[cat];
            const count = allItems.filter(i => i.category === cat).length;
            const active = catFilter === cat;
            return (
              <button key={cat} onClick={() => { setCatFilter(active ? '' : cat); setTierFilter(''); }}
                style={pillStyle(active, 'var(--gold)', 'rgba(240,192,64,.12)')}>
                {meta.icon} {meta[lang as 'hu' | 'en' | 'ru']}
                <span style={{ opacity: .4, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Tier row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '.6px', fontWeight: 600, minWidth: 64, marginRight: 2, flexShrink: 0 }}>
            {lang === 'hu' ? 'Tier' : lang === 'ru' ? 'Уровень' : 'Tier'}
          </span>
          {TIER_ORDER.filter(t => tiersInCat.has(t)).map(tier => {
            const meta = TIER_META[tier];
            const count = allItems.filter(i => i.tier === tier && (!catFilter || i.category === catFilter)).length;
            const active = tierFilter === tier;
            return (
              <button key={tier} onClick={() => setTierFilter(active ? '' : tier)}
                style={pillStyle(active, meta?.color, meta?.bg)}>
                {meta?.[lang as 'hu' | 'en' | 'ru'] ?? tier}
                <span style={{ opacity: .4, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Count + clear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: '.8em', color: 'var(--text2)', padding: '3px 10px',
          background: 'var(--surface)', border: '1px solid var(--surface2)', borderRadius: 20 }}>
          {isFiltered
            ? <><span style={{ color: 'var(--text)', fontWeight: 600 }}>{filtered.length}</span> / {visibleItems.length} {lang === 'hu' ? 'item' : lang === 'ru' ? 'предметов' : 'items'}</>
            : <><span style={{ color: 'var(--text)', fontWeight: 600 }}>{visibleItems.length}</span> {lang === 'hu' ? 'item' : lang === 'ru' ? 'предметов' : 'items'}</>
          }
        </span>
        {isFiltered && (
          <button onClick={() => { setCatFilter(''); setTierFilter(''); setSearch(''); }}
            style={{ padding: '3px 9px', borderRadius: 6, border: '1px solid var(--surface2)',
              background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
              fontSize: '.78em', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            ✕ {lang === 'hu' ? 'Törlés' : lang === 'ru' ? 'Сброс' : 'Clear'}
          </button>
        )}
      </div>

      {/* Item grid */}
      <div className="item-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 6,
        maxHeight: '65vh',
        overflowY: 'auto',
        border: '1px solid var(--surface2)',
        borderRadius: 8,
        padding: 8,
      }}>
        {filtered.map(item => {
          const tierMeta = item.tier ? TIER_META[item.tier] : null;
          const isSelected = selected?.id === item.id;
          const hasRecipe = itemsWithRecipe.has(item.id);
          const info = getInfo(item.id);
          const isRemoved = isItemRemoved(item.id, item, info, recipesByOutput);
          return (
            <div
              key={item.id}
              onClick={() => setSelected(isSelected ? null : item)}
              className={`item-card${isSelected ? ' ic-selected' : ''}${isRemoved ? ' ic-removed' : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: '10px 6px 8px',
                border: `1px solid ${isSelected ? 'var(--gold)' : isRemoved ? 'rgba(233,69,96,.3)' : 'var(--surface2)'}`,
                borderRadius: 8, cursor: 'pointer',
                background: isSelected ? 'rgba(240,192,64,.09)' : isRemoved ? 'rgba(233,69,96,.05)' : 'var(--surface)',
                boxShadow: isSelected ? '0 0 0 1px rgba(240,192,64,.4), inset 0 1px 0 rgba(240,192,64,.1)' : 'none',
                transition: 'all .15s',
                opacity: isRemoved ? 0.5 : 1,
                position: 'relative',
              }}
              title={item.name[lang as 'hu' | 'en' | 'ru']}
            >
              {hasRecipe && (
                <span style={{
                  position: 'absolute', top: 4, right: 5,
                  fontSize: '.55em', color: 'var(--gold)', opacity: 0.8,
                  lineHeight: 1,
                }} title={lang === 'hu' ? 'Van recept' : lang === 'ru' ? 'Есть рецепт' : 'Has recipe'}>⚒</span>
              )}
              <ItemIcon item={item} size={32} />
              <span style={{ fontSize: '.75em', fontWeight: 500, textAlign: 'center', lineHeight: 1.25,
                color: isSelected ? 'var(--gold)' : 'var(--text)', wordBreak: 'break-word', maxWidth: '100%',
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.name[lang as 'hu' | 'en' | 'ru']}
              </span>
              {tierMeta && (
                <span style={{
                  fontSize: '.62em', padding: '2px 7px', borderRadius: 8,
                  background: tierMeta.bg, color: tierMeta.color,
                  border: `1px solid ${tierMeta.color}55`, fontWeight: 700,
                  letterSpacing: '.3px',
                }}>
                  {tierMeta[lang as 'hu' | 'en' | 'ru']}
                </span>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center',
            color: 'var(--text2)', fontStyle: 'italic' }}>
            {lang === 'hu' ? 'Nincs találat.' : lang === 'ru' ? 'Ничего не найдено.' : 'No items found.'}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 99 }}
            className="drawer-overlay" />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 100vw)',
            background: 'var(--bg)', borderLeft: '1px solid var(--surface2)',
            overflowY: 'auto', zIndex: 100, boxShadow: '-4px 0 32px rgba(0,0,0,.4)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 1,
              background: 'var(--bg)', borderBottom: '1px solid var(--surface2)',
              padding: '20px 24px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <ItemIcon item={selected} size={64} />
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.2em' }}>
                      {selected.name[lang as 'hu' | 'en' | 'ru']}
                    </h3>
                    <div style={{ fontSize: '.8em', color: 'var(--text2)', marginBottom: 8 }}>
                      {lang === 'hu' ? selected.name.en : selected.name.hu}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selected.tier && TIER_META[selected.tier] && (
                        <TierPill tier={selected.tier} lang={lang} />
                      )}
                      {selected.category && CATEGORY_META[selected.category] && (
                        <span style={{ fontSize: '.7em', padding: '1px 8px', borderRadius: 10,
                          background: 'var(--surface2)', color: 'var(--text2)', fontWeight: 600 }}>
                          {CATEGORY_META[selected.category].icon} {CATEGORY_META[selected.category][lang as 'hu' | 'en' | 'ru']}
                        </span>
                      )}
                      {selected.max_durability && (
                        <span style={{ fontSize: '.7em', padding: '1px 8px', borderRadius: 10,
                          background: 'rgba(78,204,163,.08)', color: 'var(--green)',
                          border: '1px solid rgba(78,204,163,.2)', fontWeight: 600 }}>
                          🛠 {selected.max_durability.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
                  fontSize: '1.1em', padding: '8px 10px', margin: '-8px -10px',
                  borderRadius: 6, lineHeight: 1,
                }}>✕</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', flex: 1 }}>
              {/* Removed warning */}
              {(() => {
                const info = getInfo(selected.id);
                if (!isItemRemoved(selected.id, selected, info, recipesByOutput)) return null;
                return (
                <div style={{ padding: '8px 12px', marginBottom: 16,
                  background: 'rgba(233,69,96,.1)', border: '1px solid rgba(233,69,96,.3)',
                  borderRadius: 6, fontSize: '.82em', color: 'var(--accent)' }}>
                  ⚠️ {lang === 'hu'
                    ? `Ez az item el lett távolítva${selected.removed_in ? ` (v${selected.removed_in})` : info?.removed_v ? ` (v${info.removed_v})` : ''}`
                    : lang === 'ru'
                    ? `Этот предмет был удалён${selected.removed_in ? ` (v${selected.removed_in})` : info?.removed_v ? ` (v${info.removed_v})` : ''}`
                    : `This item was removed${selected.removed_in ? ` (v${selected.removed_in})` : info?.removed_v ? ` (v${info.removed_v})` : ''}`}
                </div>
                );
              })()}

              {/* Version info */}
              {(() => {
                const info = getInfo(selected.id);
                if (!(info?.added || info?.removed_v)) return null;
                return (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {info.added && (
                    <span style={{ fontSize: '.78em', padding: '3px 10px', borderRadius: 10,
                      background: 'rgba(78,204,163,.12)', color: 'var(--green)',
                      border: '1px solid rgba(78,204,163,.3)', fontWeight: 600 }}>
                      + v{info.added}
                    </span>
                  )}
                  {info.removed_v && (
                    <span style={{ fontSize: '.78em', padding: '3px 10px', borderRadius: 10,
                      background: 'rgba(233,69,96,.1)', color: 'var(--accent)',
                      border: '1px solid rgba(233,69,96,.3)', fontWeight: 600 }}>
                      ✕ v{info.removed_v}
                    </span>
                  )}
                </div>
                );
              })()}

              {/* Description */}
              {(() => {
                const info = getInfo(selected.id);
                const descText = lang === 'hu'
                  ? (info?.desc_hu || info?.desc_en || info?.desc_ru || info?.desc)
                  : lang === 'ru'
                    ? (info?.desc_ru || info?.desc_en || info?.desc_hu || info?.desc)
                    : (info?.desc_en || info?.desc_ru || info?.desc_hu || info?.desc);
                if (!descText) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                      color: 'var(--text2)', marginBottom: 6 }}>
                      {lang === 'hu' ? 'Leírás' : lang === 'ru' ? 'Описание' : 'Description'}
                    </div>
                    <div style={{ fontSize: '.88em', lineHeight: 1.65, color: 'var(--text)',
                      background: 'var(--surface)', border: '1px solid var(--surface2)',
                      borderRadius: 6, padding: '10px 14px' }}>
                      {descText}
                    </div>
                  </div>
                );
              })()}

              {/* Tier progression */}
              {(() => {
                const group = getTierGroup(selected);
                if (!group) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                      color: 'var(--text2)', marginBottom: 8 }}>
                      {lang === 'hu' ? 'Tier progresszió' : lang === 'ru' ? 'Линейка тиров' : 'Tier progression'}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {group.map(item => {
                        const meta = item.tier ? TIER_META[item.tier] : null;
                        const isCurrent = item.id === selected.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelected(item)}
                            title={item.name[lang as 'hu' | 'en' | 'ru']}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              gap: 3, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                              border: `1px solid ${isCurrent ? (meta?.color ?? 'var(--gold)') : 'var(--surface2)'}`,
                              background: isCurrent ? (meta?.bg ?? 'rgba(240,192,64,.1)') : 'var(--surface)',
                              minWidth: 48,
                            }}
                          >
                            <ItemIcon item={item} size={24} />
                            {meta && (
                              <span style={{ fontSize: '.55em', fontWeight: 700,
                                color: meta.color, whiteSpace: 'nowrap' }}>
                                {meta[lang as 'hu' | 'en' | 'ru']}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Version notes */}
              {(() => {
                const info = getInfo(selected.id);
                const versionNotes = lang === 'hu'
                  ? (info?.versions_hu || info?.versions_en || info?.versions_ru || info?.versions)
                  : lang === 'ru'
                    ? (info?.versions_ru || info?.versions_en || info?.versions_hu || info?.versions)
                    : (info?.versions_en || info?.versions_ru || info?.versions_hu || info?.versions);
                if (!versionNotes || versionNotes.length === 0) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                      color: 'var(--text2)', marginBottom: 6 }}>
                      {lang === 'hu' ? 'Verzió megjegyzések' : lang === 'ru' ? 'Заметки о версии' : 'Version notes'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {versionNotes.map((v, i) => (
                        <div key={i} style={{ fontSize: '.8em', padding: '5px 10px',
                          background: 'var(--surface)', border: '1px solid var(--surface2)',
                          borderRadius: 4, color: 'var(--text2)', lineHeight: 1.4 }}>
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Inline recipes */}
              {(() => {
                const recs = recipesByOutput[selected.id];
                if (!recs || recs.length === 0) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                      color: 'var(--text2)', marginBottom: 8 }}>
                      {lang === 'hu' ? 'Receptek' : lang === 'ru' ? 'Рецепты' : 'Recipes'} ({recs.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recs.slice(0, 3).map((r: any, i: number) => {
                        const ings: string[] = (r.ingredients as (string | string[])[]).map((x: string | string[]) =>
                          Array.isArray(x) ? x[0] : x
                        );
                        const ingCounts: Record<string, number> = {};
                        for (const id of ings) { ingCounts[id] = (ingCounts[id] || 0) + 1; }
                        const station = STATION_LABELS[r.station]?.[lang as 'hu' | 'en' | 'ru'] ?? r.station;
                        const isRecipeRemoved = !!r.removed_version;
                        return (
                          <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${isRecipeRemoved ? 'rgba(233,69,96,.3)' : 'var(--surface2)'}`,
                            borderRadius: 6, padding: '8px 12px', fontSize: '.82em', opacity: isRecipeRemoved ? 0.7 : 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {r.outputQty > 1 ? `×${r.outputQty} — ` : ''}{station}
                              </span>
                              {isRecipeRemoved && (
                                <span style={{ fontSize: '.8em', color: '#ff6b6b', fontWeight: 600 }}>
                                  ⚠️ v{r.removed_version}
                                </span>
                              )}
                              {r.skills?.length > 0 && (
                                <span style={{ fontSize: '.85em', color: 'var(--gold)', opacity: 0.8 }}>
                                  🎓 {r.skills.join(', ')}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {Object.entries(ingCounts).map(([ingId, cnt]) => {
                                const ingData = (itemsRaw as any)[ingId];
                                const ingName = ingData?.name?.[lang as 'hu' | 'en' | 'ru'] ?? ingId;
                                const ingImg = ingData?.img;
                                return (
                                  <div key={ingId} title={ingName}
                                    style={{ display: 'flex', alignItems: 'center', gap: 3,
                                      background: 'var(--bg)', border: '1px solid var(--surface2)',
                                      borderRadius: 4, padding: '2px 6px 2px 3px', fontSize: '.85em' }}>
                                    {ingImg ? (
                                      <img src={`${BASE}/${ingImg}`} width={16} height={16}
                                        style={{ imageRendering: 'pixelated' }} alt={ingId} />
                                    ) : <span style={{ width: 16, textAlign: 'center' }}>📦</span>}
                                    {cnt > 1 && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>×{cnt}</span>}
                                    <span style={{ color: 'var(--text2)' }}>{ingName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {recs.length > 3 && (
                        <div style={{ fontSize: '.78em', color: 'var(--text2)', textAlign: 'center' }}>
                          {lang === 'hu' ? `+ ${recs.length - 3} további recept a Receptek oldalon` : lang === 'ru' ? `+ ещё ${recs.length - 3} рецептов на странице рецептов` : `+ ${recs.length - 3} more recipes on the Recipes page`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Bottom links */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--surface2)', paddingTop: 16 }}>
                <a
                  href={`${BASE}/recipes/?search=${encodeURIComponent(getCanonicalItemId(selected.id))}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 6, fontSize: '.85em', fontWeight: 600,
                    background: 'rgba(240,192,64,.12)', color: 'var(--gold)',
                    border: '1px solid rgba(240,192,64,.35)', textDecoration: 'none',
                  }}
                >
                  ⚒ {lang === 'hu' ? 'Receptek' : lang === 'ru' ? 'Рецепты' : 'Recipes'}
                </a>
                {(() => {
                  const info = getInfo(selected.id);
                  if (!info?.mcmod_id) return null;
                  return (
                  <a
                    href={`https://www.mcmod.cn/item/${info.mcmod_id}.html`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 6, fontSize: '.85em', fontWeight: 600,
                      background: 'var(--surface)', color: 'var(--text2)',
                      border: '1px solid var(--surface2)', textDecoration: 'none',
                    }}
                  >
                    🌐 mcmod.cn
                  </a>
                  );
                })()}
                <div style={{ marginLeft: 'auto', fontSize: '.75em', color: 'var(--text2)',
                  display: 'flex', alignItems: 'center' }}>
                  <code>{selected.id}</code>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
