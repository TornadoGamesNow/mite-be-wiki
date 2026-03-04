import { useState, useEffect } from 'react';
import mobsData from '../../data/mobs.json';

interface Drop {
  item: { hu: string; en: string };
  qty?: string;
  chance: 'always' | 'common' | 'uncommon' | 'rare' | 'looting';
}

interface Mob {
  id: string;
  name: { hu: string; en: string };
  hp: number | null;
  dmgMin: number;
  dmgMax: number;
  dmgType: string;
  xp: number | null;
  spawnZones: string[];
  difficulty: 'early' | 'mid' | 'late' | 'boss';
  tags: string[];
  special?: { hu: string; en: string };
  drops?: Drop[];
}

const allMobs: Mob[] = mobsData as Mob[];

const diffMeta = {
  early: { label: 'Early', badge: 'I',  cls: 'diff-early' },
  mid:   { label: 'Mid',   badge: 'II', cls: 'diff-mid'   },
  late:  { label: 'Late',  badge: 'III',cls: 'diff-late'  },
  boss:  { label: 'Boss',  badge: '★', cls: 'diff-boss'  },
};

const chanceColor: Record<string, string> = {
  always: 'var(--green)',
  common: 'var(--text)',
  uncommon: 'var(--gold)',
  rare: '#b388ff',
  looting: '#64b5f6',
};

const chanceLabel: Record<string, { hu: string; en: string }> = {
  always:   { hu: 'Mindig',       en: 'Always'   },
  common:   { hu: 'Gyakori',      en: 'Common'   },
  uncommon: { hu: 'Ritka',        en: 'Uncommon' },
  rare:     { hu: 'Nagyon ritka', en: 'Rare'     },
  looting:  { hu: 'Looting',      en: 'Looting'  },
};

const dmgTypeIcon: Record<string, string> = {
  melee: '', ranged: '🏹', explosion: '💥', potion: '🧪', fireball: '🔥',
};

function dmgDisplay(mob: Mob, useIcon = false) {
  const base = mob.dmgMin === mob.dmgMax ? `${mob.dmgMin}` : `${mob.dmgMin}–${mob.dmgMax}`;
  const suffix = useIcon
    ? (dmgTypeIcon[mob.dmgType] ?? '')
    : (mob.dmgType !== 'melee' ? mob.dmgType : '');
  return suffix ? `${base} ${suffix}` : base;
}

const tagMeta: Record<string, { hu: string; en: string; icon: string }> = {
  poison:                { hu: 'Méreg',           en: 'Poison',              icon: '☠️' },
  fire_immune:           { hu: 'Tűzimmun',         en: 'Fire immune',         icon: '🛡️' },
  fire_damage:           { hu: 'Tűzkár',           en: 'Fire dmg',            icon: '🔥' },
  burning:               { hu: 'Meggyújt',         en: 'Burning',             icon: '🔥' },
  invisible:             { hu: 'Láthatatlan',      en: 'Invisible',           icon: '👁️' },
  phasing:               { hu: 'Falon átmegy',     en: 'Phasing',             icon: '👻' },
  explosion:             { hu: 'Robbanás',          en: 'Explosion',           icon: '💥' },
  summoner:              { hu: 'Idéző',             en: 'Summoner',            icon: '⚰️' },
  life_steal:            { hu: 'Életlopás',         en: 'Life steal',          icon: '🩸' },
  requires_silver:       { hu: 'Ezüst kell',       en: 'Req. Silver',         icon: '⚔️' },
  requires_mithril:      { hu: 'Mithril kell',     en: 'Req. Mithril',        icon: '⚔️' },
  requires_ancient_metal:{ hu: 'Ősi Fém kell',     en: 'Req. Ancient Metal',  icon: '⚔️' },
  instant_kill:          { hu: 'Instant halál',    en: 'Instant kill',        icon: '💀' },
  pickaxe_only:          { hu: 'Csak csákány',     en: 'Pickaxe only',        icon: '⛏️' },
  flying:                { hu: 'Repülő',            en: 'Flying',              icon: '🦅' },
  pack:                  { hu: 'Falka',             en: 'Pack',                icon: '🐺' },
  wall_detection:        { hu: 'Falon érzékel',    en: 'Wall detect',         icon: '🧱' },
  gold_passive:          { hu: 'Arannyal passzív', en: 'Gold passive',        icon: '🪙' },
  potion:                { hu: 'Bájital',           en: 'Potion',              icon: '🧪' },
};

export default function MobExplorer() {
  const [lang, setLang] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('mite-wiki-lang') || 'hu'; } catch (e) {}
    }
    return 'hu';
  });
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<'' | 'early' | 'mid' | 'late' | 'boss'>('');
  const [zoneFilter, setZoneFilter] = useState<'' | 'surface' | 'underground' | 'nether'>('');
  const [sortKey, setSortKey] = useState<'name' | 'hp' | 'xp' | 'dmg'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedMob, setSelectedMob] = useState<Mob | null>(null);

  // Lang sync
  useEffect(() => {
    function handleLangChange(e: Event) {
      setLang((e as CustomEvent).detail ?? 'hu');
    }
    window.addEventListener('mite:langChange', handleLangChange);
    if (typeof window !== 'undefined' && (window as any).__miteLang) {
      setLang((window as any).__miteLang);
    }
    return () => window.removeEventListener('mite:langChange', handleLangChange);
  }, []);

  // ESC key to close drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && selectedMob) closeMob(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMob]);

  // URL deep-link
  function applyUrlState() {
    const p = new URLSearchParams(location.search).get('mob');
    const found = allMobs.find(m => m.id === p) ?? null;
    setSelectedMob(prev => prev?.id === found?.id ? prev : found);
  }

  useEffect(() => { applyUrlState(); }, []);

  useEffect(() => {
    window.addEventListener('popstate', applyUrlState);
    return () => window.removeEventListener('popstate', applyUrlState);
  }, []);

  function openMob(mob: Mob) {
    setSelectedMob(mob);
    history.pushState({ mobDrawer: true }, '', `?mob=${mob.id}`);
  }

  function closeMob() {
    if ((history.state as any)?.mobDrawer === true) {
      history.back();
    } else {
      history.replaceState(null, '', location.pathname);
      setSelectedMob(null);
    }
  }

  // Filter + sort
  const filtered = allMobs.filter(mob => {
    if (diffFilter && mob.difficulty !== diffFilter) return false;
    if (zoneFilter && !mob.spawnZones.includes(zoneFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!mob.name.hu.toLowerCase().includes(q) && !mob.name.en.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name[lang as 'hu' | 'en'].localeCompare(b.name[lang as 'hu' | 'en']);
    else if (sortKey === 'hp') cmp = (a.hp ?? 0) - (b.hp ?? 0);
    else if (sortKey === 'xp') cmp = (a.xp ?? 0) - (b.xp ?? 0);
    else if (sortKey === 'dmg') cmp = a.dmgMax - b.dmgMax;
    return sortAsc ? cmp : -cmp;
  });

  function SortTh({ k, label }: { k: typeof sortKey; label: string }) {
    return (
      <th
        onClick={() => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); } }}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Filter bar */}
      <div style={{ marginBottom: 16 }}>
        {/* Difficulty label + legend */}
        <div className="filter-group" style={{ marginBottom: 4 }}>
          <span className="filter-group-label">{lang === 'hu' ? 'Nehézség' : 'Difficulty'}</span>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', opacity: .7 }}>
            I Early · II Mid · III Late · ★ Boss
          </span>
        </div>
        {/* Difficulty buttons */}
        <div className="filter-group" style={{ marginBottom: 8 }}>
          <span className="filter-group-label" style={{ visibility: 'hidden' }}>x</span>
          {(['', 'early', 'mid', 'late', 'boss'] as const).map(d => {
            const count = d ? allMobs.filter(m => m.difficulty === d).length : allMobs.length;
            return (
              <button key={d} onClick={() => setDiffFilter(d)}
                className={`filter-btn filter-btn-diff ${diffFilter === d ? 'filter-btn-active' : ''} ${d ? diffMeta[d].cls : ''}`}
                title={d ? `${diffMeta[d].badge} = ${diffMeta[d].label}` : undefined}>
                {d ? diffMeta[d].badge : (lang === 'hu' ? 'Mind' : 'All')}
                {' '}<span style={{ opacity: .6, fontSize: '.8em' }}>({count})</span>
              </button>
            );
          })}
        </div>
        {/* Region buttons */}
        <div className="filter-group">
          <span className="filter-group-label">{lang === 'hu' ? 'Régió' : 'Region'}</span>
          {(['', 'surface', 'underground', 'nether'] as const).map(z => {
            const count = z ? allMobs.filter(m => m.spawnZones.includes(z)).length : allMobs.length;
            const label = z === '' ? (lang === 'hu' ? 'Mind' : 'All') :
              z === 'surface' ? (lang === 'hu' ? 'Felszín' : 'Surface') :
              z === 'underground' ? (lang === 'hu' ? 'Föld alatti' : 'Underground') : 'Nether';
            return (
              <button key={z} onClick={() => setZoneFilter(z)}
                className={`filter-btn ${zoneFilter === z ? 'filter-btn-active' : ''}`}
                title={z ? `${count} mobs in ${z}` : undefined}>
                {label} <span style={{ opacity: .6, fontSize: '.85em' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
        <input
          type="search"
          placeholder={lang === 'hu' ? 'Szörny keresése…' : 'Search mobs…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 32px 6px 12px', borderRadius: 6, border: '1px solid var(--surface2)',
                   background: 'var(--surface)', color: 'var(--text)', width: 280 }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                     background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                     fontSize: '.9em', padding: '2px 4px' }}>
            ×
          </button>
        )}
      </div>

      {/* Count above table — left aligned */}
      <div style={{ fontSize: '.8em', color: 'var(--text2)', marginBottom: 4 }}>
        {filtered.length} / {allMobs.length} {lang === 'hu' ? 'szörny' : 'mobs'}
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
          <tr>
            <SortTh k="name" label={lang === 'hu' ? 'Név' : 'Name'} />
            <SortTh k="hp" label="HP" />
            <SortTh k="dmg" label={lang === 'hu' ? 'Sebzés' : 'Damage'} />
            <SortTh k="xp" label="XP" />
          </tr>
        </thead>
        <tbody>
          {filtered.map(mob => (
            <tr key={mob.id} className={`mob-row${selectedMob?.id === mob.id ? ' mob-row-selected' : ''}`}
              onClick={() => openMob(mob)}
              style={{ cursor: 'pointer', ...(selectedMob?.id === mob.id
                ? { borderLeft: '3px solid var(--gold)', background: 'rgba(240,192,64,.05)' }
                : {}) }}>
              <td style={{ fontWeight: 600 }}>
                <span className={`diff-badge ${diffMeta[mob.difficulty].cls}`} style={{ marginRight: 6 }}>
                  {diffMeta[mob.difficulty].badge}
                </span>
                {mob.name[lang as 'hu' | 'en']}
                <span style={{ marginLeft: 6, opacity: .6, fontSize: '.9em' }}>
                  {mob.tags.slice(0, 3).map(t => tagMeta[t]?.icon ?? '').join('')}
                  {mob.tags.length > 3 && (
                    <span style={{ fontSize: '.8em', color: 'var(--text2)', marginLeft: 2 }}>
                      +{mob.tags.length - 3}
                    </span>
                  )}
                </span>
              </td>
              <td>{mob.hp ?? '?'}</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>{mob.dmgMin === mob.dmgMax ? `${mob.dmgMin}` : `${mob.dmgMin}–${mob.dmgMax}`}</span>
                  {mob.dmgType !== 'melee' && (
                    <span style={{ fontSize: '.9em', lineHeight: 1 }}>
                      {dmgTypeIcon[mob.dmgType] ?? ''}
                    </span>
                  )}
                </span>
              </td>
              <td>{mob.xp ?? '?'}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text2)',
                fontStyle: 'italic' }}>
                {lang === 'hu' ? 'Nincs találat a szűrőkre.' : 'No mobs match filters.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Drawer + overlay */}
      {selectedMob && (
        <>
          <div onClick={closeMob}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99, display: 'none' }}
            className="drawer-overlay" />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
            background: 'var(--bg)', borderLeft: '1px solid var(--surface2)',
            padding: '24px 20px', overflowY: 'auto', zIndex: 100,
            boxShadow: '-4px 0 24px rgba(0,0,0,.3)',
          }}>
            {/* Header: title + badges + close in one row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2em' }}>{selectedMob.name[lang as 'hu'|'en']}</h3>
                  <span className={`diff-badge ${diffMeta[selectedMob.difficulty].cls}`}>
                    {diffMeta[selectedMob.difficulty].badge} {diffMeta[selectedMob.difficulty].label}
                  </span>
                  {selectedMob.spawnZones.map(z => (
                    <span key={z} style={{ padding: '2px 8px', borderRadius: 4, fontSize: '.7em', fontWeight: 600,
                      background: 'var(--surface)', border: '1px solid var(--surface2)', color: 'var(--text2)' }}>
                      {z === 'surface' ? (lang === 'hu' ? 'Felszín' : 'Surface') :
                       z === 'underground' ? (lang === 'hu' ? 'Föld alatti' : 'Underground') :
                       z === 'nether' ? 'Nether' : (lang === 'hu' ? 'Ismeretlen' : 'Unknown')}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={closeMob} style={{
                background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
                fontSize: '1.1em', padding: '8px 10px', margin: '-8px -10px', borderRadius: 6, lineHeight: 1
              }}>✕</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.4em', fontWeight: 700, color: 'var(--green)' }}>{selectedMob.hp ?? '?'}</div>
                <div style={{ fontSize: '.75em', color: 'var(--text2)' }}>HP</div>
              </div>
              <div>
                <div style={{ fontSize: '1.4em', fontWeight: 700, color: 'var(--accent)' }}>{dmgDisplay(selectedMob, true)}</div>
                <div style={{ fontSize: '.75em', color: 'var(--text2)' }}>{lang === 'hu' ? 'Sebzés' : 'Damage'}</div>
              </div>
              <div>
                <div style={{ fontSize: '1.4em', fontWeight: 700, color: 'var(--gold)' }}>{selectedMob.xp ?? '?'}</div>
                <div style={{ fontSize: '.75em', color: 'var(--text2)' }}>XP</div>
              </div>
            </div>

            {/* Tags */}
            {selectedMob.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {selectedMob.tags.map(t => (
                  <span key={t} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '.75em',
                    background: 'var(--surface)', border: '1px solid var(--surface2)',
                  }}>
                    {tagMeta[t]?.icon ?? ''} {tagMeta[t]?.[lang as 'hu' | 'en'] ?? t}
                  </span>
                ))}
              </div>
            )}

            {/* Requires warning */}
            {selectedMob.tags.some(t => t.startsWith('requires_')) && (
              <div style={{
                padding: '8px 12px', background: 'rgba(233,69,96,.1)',
                border: '1px solid rgba(233,69,96,.3)', borderRadius: 6,
                fontSize: '.82em', marginBottom: 12, color: 'var(--accent)',
              }}>
                ⚠️ {lang === 'hu' ? 'Speciális fegyver szükséges!' : 'Requires special weapon!'}
              </div>
            )}

            {/* Special mechanics */}
            {selectedMob.special && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '.7em', textTransform: 'uppercase', letterSpacing: '.6px',
                  color: 'var(--text2)', marginBottom: 6 }}>
                  {lang === 'hu' ? 'Különleges mechanika' : 'Special mechanics'}
                </div>
                <div style={{ fontSize: '.88em', color: 'var(--text)', lineHeight: 1.55,
                  background: 'var(--surface)', border: '1px solid var(--surface2)',
                  borderRadius: 6, padding: '8px 12px' }}>
                  {selectedMob.special[lang as 'hu' | 'en']
                    .split(/ — |; /)
                    .map((part, i) => {
                      const parts = selectedMob.special![lang as 'hu' | 'en'].split(/ — |; /);
                      return (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start',
                          marginBottom: i < parts.length - 1 ? 4 : 0 }}>
                          <span style={{ color: 'var(--gold)', marginTop: 2 }}>›</span>
                          <span>{part.trim()}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Drops */}
            {selectedMob.drops && selectedMob.drops.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '.7em', textTransform: 'uppercase', letterSpacing: '.6px',
                  color: 'var(--text2)', marginBottom: 6 }}>
                  {lang === 'hu' ? 'Dropok' : 'Drops'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selectedMob.drops.map((drop, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', fontSize: '.83em',
                      padding: '4px 8px', background: 'var(--surface)',
                      border: '1px solid var(--surface2)', borderRadius: 4 }}>
                      <span style={{ color: 'var(--text)' }}>
                        {drop.item[lang as 'hu' | 'en']}
                        {drop.qty && <span style={{ color: 'var(--text2)', marginLeft: 4 }}>×{drop.qty}</span>}
                      </span>
                      <span style={{ fontSize: '.8em', color: chanceColor[drop.chance] ?? 'var(--text2)',
                        fontWeight: 600 }}>
                        {chanceLabel[drop.chance]?.[lang as 'hu' | 'en'] ?? drop.chance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
