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
  early: { label: 'Early', badge: 'I',  cls: 'diff-early', color: 'var(--green)',    bg: 'rgba(78,204,163,.15)',  border: 'rgba(78,204,163,.4)'  },
  mid:   { label: 'Mid',   badge: 'II', cls: 'diff-mid',   color: 'var(--gold)',     bg: 'rgba(240,192,64,.15)',  border: 'rgba(240,192,64,.4)'  },
  late:  { label: 'Late',  badge: 'III',cls: 'diff-late',  color: 'var(--accent)',   bg: 'rgba(233,69,96,.15)',   border: 'rgba(233,69,96,.4)'   },
  boss:  { label: 'Boss',  badge: '★', cls: 'diff-boss',  color: 'var(--adamantium)',bg: 'rgba(179,136,255,.18)', border: 'rgba(179,136,255,.5)' },
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

const zoneIcon: Record<string, string> = {
  surface: '🌍', underground: '⛏', nether: '🔥', unknown: '❓',
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
  const [lang, setLang] = useState<string>('hu');
  const [selectedMob, setSelectedMob] = useState<Mob | null>(null);
  const [diffFilter, setDiffFilter] = useState<'' | 'early' | 'mid' | 'late' | 'boss'>('');
  const [zoneFilter, setZoneFilter] = useState<'' | 'surface' | 'underground' | 'nether'>('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'hp' | 'dmg' | 'xp'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Lang sync — useEffect-ben olvasunk localStorage-ból (SSR mismatch elkerülése)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mite-wiki-lang');
      if (stored) setLang(stored);
    } catch (e) {}
    function handleLangChange(e: Event) {
      setLang((e as CustomEvent).detail ?? 'hu');
    }
    window.addEventListener('mite:langChange', handleLangChange);
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
    // Ha már nyitva van drawer: replace (ne halmozzon history entry-t)
    if ((history.state as any)?.mobDrawer === true) {
      history.replaceState({ mobDrawer: true }, '', `?mob=${mob.id}`);
    } else {
      history.pushState({ mobDrawer: true }, '', `?mob=${mob.id}`);
    }
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

  const isFiltered = diffFilter !== '' || zoneFilter !== '' || search !== '';

  function SortTh({ k, label }: { k: typeof sortKey; label: string }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); } }}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
          color: active ? 'var(--gold)' : 'var(--text2)' }}
      >
        {label} {active ? (sortAsc ? '▲' : '▼') : <span style={{ opacity: .3 }}>▲</span>}
      </th>
    );
  }

  // Difficulty pill button style
  function diffBtnStyle(d: '' | 'early' | 'mid' | 'late' | 'boss') {
    const active = diffFilter === d;
    if (d === '') {
      return {
        padding: '4px 12px', borderRadius: 20, fontSize: '.8em', fontWeight: 600,
        cursor: 'pointer', border: `1px solid ${active ? 'var(--text)' : 'var(--surface2)'}`,
        background: active ? 'var(--surface2)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text2)',
        transition: 'all .15s',
      } as React.CSSProperties;
    }
    const m = diffMeta[d];
    return {
      padding: '4px 12px', borderRadius: 20, fontSize: '.8em', fontWeight: 700,
      cursor: 'pointer', border: `1px solid ${active ? m.border : 'var(--surface2)'}`,
      background: active ? m.bg : 'transparent',
      color: active ? m.color : 'var(--text2)',
      transition: 'all .15s',
    } as React.CSSProperties;
  }

  // Region pill button style
  function zoneBtnStyle(z: '' | 'surface' | 'underground' | 'nether') {
    const active = zoneFilter === z;
    return {
      padding: '4px 12px', borderRadius: 20, fontSize: '.8em', fontWeight: 600,
      cursor: 'pointer', border: `1px solid ${active ? 'var(--mithril)' : 'var(--surface2)'}`,
      background: active ? 'rgba(126,200,227,.15)' : 'transparent',
      color: active ? 'var(--mithril)' : 'var(--text2)',
      transition: 'all .15s',
    } as React.CSSProperties;
  }

  const zoneLabel = (z: string) =>
    z === 'surface'     ? (lang === 'hu' ? 'Felszín'     : 'Surface')     :
    z === 'underground' ? (lang === 'hu' ? 'Föld alatti' : 'Underground') :
    z === 'nether'      ? 'Nether' : (lang === 'hu' ? 'Ismeretlen' : 'Unknown');

  return (
    <div style={{ position: 'relative' }}>
      {/* Filter bar + search egy sorban */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>

        {/* Bal: filterek */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Difficulty row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
              letterSpacing: '.6px', minWidth: 64 }}>
              {lang === 'hu' ? 'Nehézség' : 'Difficulty'}
            </span>
            {(['', 'early', 'mid', 'late', 'boss'] as const).map(d => {
              const count = d ? allMobs.filter(m => m.difficulty === d).length : allMobs.length;
              return (
                <button key={d} onClick={() => setDiffFilter(d)} style={diffBtnStyle(d)}>
                  {d ? `${diffMeta[d].badge} ${diffMeta[d].label}` : (lang === 'hu' ? 'Mind' : 'All')}
                  <span style={{ opacity: .55, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
          {/* Region row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
              letterSpacing: '.6px', minWidth: 64 }}>
              {lang === 'hu' ? 'Régió' : 'Region'}
            </span>
            {(['', 'surface', 'underground', 'nether'] as const).map(z => {
              const count = z ? allMobs.filter(m => m.spawnZones.includes(z)).length : allMobs.length;
              return (
                <button key={z} onClick={() => setZoneFilter(z)} style={zoneBtnStyle(z)}>
                  {z ? `${zoneIcon[z]} ${zoneLabel(z)}` : (lang === 'hu' ? 'Mind' : 'All')}
                  <span style={{ opacity: .55, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Jobb: search + active chips */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="search"
              placeholder={lang === 'hu' ? 'Szörny keresése…' : 'Search mobs…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '6px 32px 6px 12px', borderRadius: 6, border: '1px solid var(--surface2)',
                       background: 'var(--surface)', color: 'var(--text)', width: 220 }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                         background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                         fontSize: '1em', padding: '2px 4px', lineHeight: 1 }}>×</button>
            )}
          </div>
          {/* Active filter chips */}
          {(diffFilter || zoneFilter) && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {diffFilter && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                  borderRadius: 20, fontSize: '.72em', fontWeight: 600,
                  background: diffMeta[diffFilter].bg, color: diffMeta[diffFilter].color,
                  border: `1px solid ${diffMeta[diffFilter].border}` }}>
                  {diffMeta[diffFilter].badge} {diffMeta[diffFilter].label}
                  <button onClick={() => setDiffFilter('')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                      padding: 0, lineHeight: 1, marginLeft: 2, opacity: .7 }}>×</button>
                </span>
              )}
              {zoneFilter && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                  borderRadius: 20, fontSize: '.72em', fontWeight: 600,
                  background: 'rgba(126,200,227,.15)', color: 'var(--mithril)',
                  border: '1px solid rgba(126,200,227,.35)' }}>
                  {zoneIcon[zoneFilter]} {zoneLabel(zoneFilter)}
                  <button onClick={() => setZoneFilter('')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                      padding: 0, lineHeight: 1, marginLeft: 2, opacity: .7 }}>×</button>
                </span>
              )}
              {isFiltered && (
                <button onClick={() => { setDiffFilter(''); setZoneFilter(''); setSearch(''); }}
                  style={{ fontSize: '.7em', color: 'var(--text2)', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '2px 4px', textDecoration: 'underline' }}>
                  {lang === 'hu' ? 'Törlés' : 'Clear all'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: '.8em', color: 'var(--text2)', marginBottom: 4 }}>
        {isFiltered
          ? <><span style={{ color: 'var(--text)', fontWeight: 600 }}>{filtered.length}</span> {lang === 'hu' ? 'találat' : 'results'} <span style={{ opacity: .5 }}>/ {allMobs.length}</span></>
          : <>{lang === 'hu' ? 'Összesen' : 'All'} <span style={{ color: 'var(--text)', fontWeight: 600 }}>{allMobs.length}</span> {lang === 'hu' ? 'szörny' : 'mobs'}</>
        }
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr style={{ background: 'var(--surface)', borderBottom: '2px solid var(--surface2)' }}>
            <SortTh k="name" label={lang === 'hu' ? 'Név' : 'Name'} />
            <SortTh k="hp" label="HP" />
            <SortTh k="dmg" label={lang === 'hu' ? '⚔ Sebzés' : '⚔ Damage'} />
            <SortTh k="xp" label="⭐ XP" />
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
              <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{mob.xp ?? '?'}</td>
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
            overflowY: 'auto', zIndex: 100,
            boxShadow: '-4px 0 24px rgba(0,0,0,.3)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Sticky header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 1,
              background: 'var(--bg)', borderBottom: '1px solid var(--surface2)',
              padding: '16px 20px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.15em' }}>
                    {selectedMob.name[lang as 'hu' | 'en']}
                  </h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`diff-badge ${diffMeta[selectedMob.difficulty].cls}`}>
                      {diffMeta[selectedMob.difficulty].badge} {diffMeta[selectedMob.difficulty].label}
                    </span>
                    {selectedMob.spawnZones.map(z => (
                      <span key={z} style={{ padding: '2px 8px', borderRadius: 4, fontSize: '.7em', fontWeight: 600,
                        background: 'var(--surface)', border: '1px solid var(--surface2)', color: 'var(--text2)' }}>
                        {zoneIcon[z] ?? ''} {zoneLabel(z)}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={closeMob} style={{
                  background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
                  fontSize: '1.1em', padding: '8px 10px', margin: '-8px -10px', borderRadius: 6, lineHeight: 1
                }}>✕</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: '16px 20px', flex: 1 }}>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.4em', fontWeight: 700, color: 'var(--green)' }}>{selectedMob.hp ?? '?'}</div>
                  <div style={{ fontSize: '.75em', color: 'var(--text2)' }}>HP</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.4em', fontWeight: 700, color: 'var(--accent)' }}>{dmgDisplay(selectedMob, true)}</div>
                  <div style={{ fontSize: '.75em', color: 'var(--text2)' }}>⚔ {lang === 'hu' ? 'Sebzés' : 'Damage'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.4em', fontWeight: 700, color: 'var(--gold)' }}>{selectedMob.xp ?? '?'}</div>
                  <div style={{ fontSize: '.75em', color: 'var(--text2)' }}>⭐ XP</div>
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
          </div>
        </>
      )}
    </div>
  );
}
