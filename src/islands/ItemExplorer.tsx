import { useState, useEffect, useMemo } from 'react';
import itemsRaw from '../../data/items.json';

const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';

interface ItemData {
  id: string;
  name: { hu: string; en: string };
  img?: string;
  tier?: string;
  category?: string;
}

// Convert items.json object to array
const allItems: ItemData[] = Object.entries(itemsRaw as Record<string, Omit<ItemData, 'id'>>).map(
  ([id, v]) => ({ id, ...v })
);

// --- Tier metadata ---
const TIER_META: Record<string, { hu: string; en: string; color: string; bg: string }> = {
  flint:              { hu: 'Kovakő',            en: 'Flint',              color: '#aaaaaa', bg: 'rgba(170,170,170,.15)' },
  bone:               { hu: 'Csont',              en: 'Bone',               color: '#d4c88a', bg: 'rgba(212,200,138,.15)' },
  wood:               { hu: 'Fa',                 en: 'Wood',               color: '#a0522d', bg: 'rgba(160,82,45,.15)' },
  stone:              { hu: 'Kő',                 en: 'Stone',              color: '#9e9e9e', bg: 'rgba(158,158,158,.15)' },
  copper:             { hu: 'Réz',                en: 'Copper',             color: '#cd7f32', bg: 'rgba(205,127,50,.15)' },
  tin:                { hu: 'Ón',                 en: 'Tin',                color: '#bfbfbf', bg: 'rgba(191,191,191,.15)' },
  silver:             { hu: 'Ezüst',              en: 'Silver',             color: '#c0c0c0', bg: 'rgba(192,192,192,.15)' },
  bronze:             { hu: 'Bronz',              en: 'Bronze',             color: '#b87333', bg: 'rgba(184,115,51,.15)' },
  iron:               { hu: 'Vas',                en: 'Iron',               color: '#d4d4d4', bg: 'rgba(212,212,212,.12)' },
  gold:               { hu: 'Arany',              en: 'Gold',               color: '#f0c040', bg: 'rgba(240,192,64,.15)' },
  hard:               { hu: 'Kőmag',              en: 'Hardstone',          color: '#7ecaab', bg: 'rgba(126,202,171,.15)' },
  obsidian:           { hu: 'Obszidián',           en: 'Obsidian',           color: '#7c4dff', bg: 'rgba(124,77,255,.15)' },
  rusted_iron:        { hu: 'Rozsdás Vas',         en: 'Rusted Iron',        color: '#b34700', bg: 'rgba(179,71,0,.15)' },
  silver_copper:      { hu: 'Ezüst-Réz',           en: 'Silver-Copper',      color: '#a8c0cd', bg: 'rgba(168,192,205,.15)' },
  high_carbon_steel:  { hu: 'Szénacél',            en: 'High Carbon Steel',  color: '#b0bec5', bg: 'rgba(176,190,197,.15)' },
  ancient_metal:      { hu: 'Ős Fém',              en: 'Ancient Metal',      color: '#c8a034', bg: 'rgba(200,160,52,.15)' },
  mithril:            { hu: 'Mithril',             en: 'Mithril',            color: '#7ec8e3', bg: 'rgba(126,200,227,.15)' },
  adamantium:         { hu: 'Adamantium',           en: 'Adamantium',         color: '#b388ff', bg: 'rgba(179,136,255,.15)' },
  mercury:            { hu: 'Higany',              en: 'Mercury',            color: '#80cbc4', bg: 'rgba(128,203,196,.15)' },
};

const CATEGORY_META: Record<string, { hu: string; en: string; icon: string }> = {
  weapon:   { hu: 'Fegyver',     en: 'Weapon',    icon: '⚔️' },
  tool:     { hu: 'Eszköz',      en: 'Tool',      icon: '⛏️' },
  armor:    { hu: 'Páncél',      en: 'Armor',     icon: '🛡️' },
  material: { hu: 'Anyag',       en: 'Material',  icon: '🪨' },
  block:    { hu: 'Blokk',       en: 'Block',     icon: '🧱' },
  food:     { hu: 'Étel',        en: 'Food',      icon: '🍖' },
  ingot:    { hu: 'Rúd',         en: 'Ingot',     icon: '📦' },
  station:  { hu: 'Állomás',     en: 'Station',   icon: '🏗️' },
  misc:     { hu: 'Egyéb',       en: 'Misc',      icon: '🎒' },
};

const TIER_ORDER = ['flint','bone','wood','stone','copper','tin','silver','bronze','iron',
  'gold','hard','obsidian','rusted_iron','silver_copper','high_carbon_steel',
  'ancient_metal','mithril','adamantium','mercury'];

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
      {meta[lang as 'hu' | 'en']}
    </span>
  );
}

export default function ItemExplorer() {
  const [lang, setLang] = useState<string>('hu');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selected, setSelected] = useState<ItemData | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allItems.filter(item => {
      if (catFilter && item.category !== catFilter) return false;
      if (tierFilter && item.tier !== tierFilter) return false;
      if (q && !item.name.hu.toLowerCase().includes(q) && !item.name.en.toLowerCase().includes(q) && !item.id.includes(q)) return false;
      return true;
    });
  }, [search, catFilter, tierFilter]);

  const isFiltered = catFilter !== '' || tierFilter !== '' || search !== '';

  // Available tiers in current filtered set (for tier filter buttons)
  const tiersInCat = useMemo(() => {
    const base = catFilter
      ? allItems.filter(i => i.category === catFilter)
      : allItems;
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
      {/* Filter bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
              letterSpacing: '.6px', minWidth: 72 }}>
              {lang === 'hu' ? 'Kategória' : 'Category'}
            </span>
            <button onClick={() => { setCatFilter(''); setTierFilter(''); }} style={pillStyle(catFilter === '')}>
              {lang === 'hu' ? 'Mind' : 'All'}
              <span style={{ opacity: .5, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>
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
                  {meta.icon} {meta[lang as 'hu' | 'en']}
                  <span style={{ opacity: .5, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tier row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
              letterSpacing: '.6px', minWidth: 72 }}>
              {lang === 'hu' ? 'Tier' : 'Tier'}
            </span>
            {TIER_ORDER.filter(t => tiersInCat.has(t)).map(tier => {
              const meta = TIER_META[tier];
              const count = allItems.filter(i => i.tier === tier && (!catFilter || i.category === catFilter)).length;
              const active = tierFilter === tier;
              return (
                <button key={tier} onClick={() => setTierFilter(active ? '' : tier)}
                  style={pillStyle(active, meta?.color, meta?.bg)}>
                  {meta?.[lang as 'hu' | 'en'] ?? tier}
                  <span style={{ opacity: .5, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <input
            type="search"
            placeholder={lang === 'hu' ? 'Item keresése…' : 'Search items…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 32px 6px 12px', borderRadius: 6, border: '1px solid var(--surface2)',
                     background: 'var(--surface)', color: 'var(--text)', width: 220, fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                       background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                       fontSize: '1em', padding: '2px 4px', lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Count + clear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '.8em',
        color: 'var(--text2)', marginBottom: 8 }}>
        <span>
          {isFiltered
            ? <><span style={{ color: 'var(--text)', fontWeight: 600 }}>{filtered.length}</span> {lang === 'hu' ? 'találat' : 'results'} <span style={{ opacity: .5 }}>/ {allItems.length}</span></>
            : <>{lang === 'hu' ? 'Összesen' : 'All'} <span style={{ color: 'var(--text)', fontWeight: 600 }}>{allItems.length}</span> {lang === 'hu' ? 'item' : 'items'}</>
          }
        </span>
        {isFiltered && (
          <button onClick={() => { setCatFilter(''); setTierFilter(''); setSearch(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
              fontSize: '.9em', padding: '1px 4px', textDecoration: 'underline', fontFamily: 'inherit' }}>
            {lang === 'hu' ? 'Szűrők törlése' : 'Clear filters'}
          </button>
        )}
      </div>

      {/* Item grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
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
          return (
            <div
              key={item.id}
              onClick={() => setSelected(isSelected ? null : item)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 5, padding: '8px 6px',
                border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--surface2)'}`,
                borderRadius: 6, cursor: 'pointer',
                background: isSelected ? 'rgba(240,192,64,.07)' : 'var(--surface)',
                transition: 'all .12s',
              }}
              title={item.name[lang as 'hu' | 'en']}
            >
              <ItemIcon item={item} size={32} />
              <span style={{ fontSize: '.7em', textAlign: 'center', lineHeight: 1.3,
                color: 'var(--text)', wordBreak: 'break-word', maxWidth: '100%' }}>
                {item.name[lang as 'hu' | 'en']}
              </span>
              {tierMeta && (
                <span style={{
                  fontSize: '.6em', padding: '1px 6px', borderRadius: 8,
                  background: tierMeta.bg, color: tierMeta.color,
                  border: `1px solid ${tierMeta.color}44`, fontWeight: 700,
                }}>
                  {tierMeta[lang as 'hu' | 'en']}
                </span>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center',
            color: 'var(--text2)', fontStyle: 'italic' }}>
            {lang === 'hu' ? 'Nincs találat.' : 'No items found.'}
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
                      {selected.name[lang as 'hu' | 'en']}
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
                          {CATEGORY_META[selected.category].icon} {CATEGORY_META[selected.category][lang as 'hu' | 'en']}
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
              {/* Item ID */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                  color: 'var(--text2)', marginBottom: 4 }}>
                  {lang === 'hu' ? 'Item ID' : 'Item ID'}
                </div>
                <code style={{ fontSize: '.85em', background: 'var(--surface)', padding: '4px 10px',
                  borderRadius: 4, border: '1px solid var(--surface2)', display: 'inline-block' }}>
                  {selected.id}
                </code>
              </div>

              {/* Recipes link */}
              <a
                href={`${BASE}/recipes/?search=${encodeURIComponent(selected.id)}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 6, fontSize: '.88em', fontWeight: 600,
                  background: 'rgba(240,192,64,.12)', color: 'var(--gold)',
                  border: '1px solid rgba(240,192,64,.35)', textDecoration: 'none',
                  transition: 'all .15s',
                }}
              >
                ⚒ {lang === 'hu' ? 'Receptek megtekintése' : 'View recipes'}
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
