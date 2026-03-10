import { useState, useEffect } from 'react';
import mobsData from '../../data/mobs.json'; // updated

const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';

interface Drop {
  item: { hu: string; en: string };
  qty?: string;
  chance: 'always' | 'common' | 'uncommon' | 'rare' | 'looting';
  itemId?: string | null;
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
  description?: { hu: string; en: string };
  spawnInfo?: { hu: string; en: string };
  drops?: Drop[];
  image?: string | null;
  preview?: string | null;
  mobType?: string;
  armor?: number | null;
  speed?: number | null;
}

const mobTypeMeta: Record<string, { hu: string; en: string; ru: string; color: string; bg: string }> = {
  undead:   { hu: 'Élőhalott', en: 'Undead',    ru: 'Нежить',      color: '#b0bec5', bg: 'rgba(176,190,197,.12)' },
  monster:  { hu: 'Szörny',    en: 'Monster',   ru: 'Монстр',      color: 'var(--accent)', bg: 'rgba(233,69,96,.10)' },
  animal:   { hu: 'Állat',     en: 'Animal',    ru: 'Животное',    color: 'var(--green)', bg: 'rgba(78,204,163,.10)' },
  nether:   { hu: 'Nether',    en: 'Nether',    ru: 'Незер',       color: '#ff7043', bg: 'rgba(255,112,67,.12)' },
  end:      { hu: 'End',       en: 'End',        ru: 'Энд',         color: 'var(--adamantium)', bg: 'rgba(179,136,255,.12)' },
  elemental:{ hu: 'Elementális',en: 'Elemental', ru: 'Элементаль', color: '#ffd54f', bg: 'rgba(255,213,79,.12)' },
  boss:     { hu: 'Boss',      en: 'Boss',       ru: 'Босс',        color: 'var(--adamantium)', bg: 'rgba(179,136,255,.20)' },
};

function MobSprite({ mob, size }: { mob: Mob; size: number }) {
  const [err, setErr] = useState(false);
  if (!mob.image || err) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, fontSize: size * 0.55, lineHeight: 1, flexShrink: 0 }}>
        🐾
      </span>
    );
  }
  return (
    <img
      src={`${BASE}/img/mobs/${mob.image.replace('.png', '_face.png')}`}
      alt={mob.id}
      width={size} height={size}
      onError={() => setErr(true)}
      style={{ imageRendering: 'pixelated', objectFit: 'contain', flexShrink: 0, display: 'block' }}
    />
  );
}

function MobPreviewImage({ mob }: { mob: Mob }) {
  const [err, setErr] = useState(false);
  if (!mob.preview || err) return null;
  return (
    <div style={{
      width: '100%', background: '#0a0a0f',
      borderBottom: '1px solid var(--surface2)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      maxHeight: 220, overflow: 'hidden',
    }}>
      <img
        src={`${BASE}/img/mobs/${mob.preview}`}
        alt={mob.name.en}
        onError={() => setErr(true)}
        style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 }}
      />
    </div>
  );
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

const chanceLabel: Record<string, { hu: string; en: string; ru: string }> = {
  always:   { hu: 'Mindig',       en: 'Always',   ru: 'Всегда'        },
  common:   { hu: 'Gyakori',      en: 'Common',   ru: 'Часто'         },
  uncommon: { hu: 'Ritka',        en: 'Uncommon', ru: 'Редко'         },
  rare:     { hu: 'Nagyon ritka', en: 'Rare',     ru: 'Очень редко'   },
  looting:  { hu: 'Looting',      en: 'Looting',  ru: 'Добыча'        },
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

const tagMeta: Record<string, { hu: string; en: string; ru: string; icon: string }> = {
  poison:                { hu: 'Méreg',           en: 'Poison',              ru: 'Яд',                   icon: '☠️' },
  fire_immune:           { hu: 'Tűzimmun',         en: 'Fire immune',         ru: 'Иммунитет к огню',     icon: '🛡️' },
  fire_damage:           { hu: 'Tűzkár',           en: 'Fire dmg',            ru: 'Урон огнём',           icon: '🔥' },
  burning:               { hu: 'Meggyújt',         en: 'Burning',             ru: 'Поджигает',            icon: '🔥' },
  invisible:             { hu: 'Láthatatlan',      en: 'Invisible',           ru: 'Невидимый',            icon: '👁️' },
  phasing:               { hu: 'Falon átmegy',     en: 'Phasing',             ru: 'Сквозь стены',         icon: '👻' },
  explosion:             { hu: 'Robbanás',          en: 'Explosion',           ru: 'Взрыв',                icon: '💥' },
  summoner:              { hu: 'Idéző',             en: 'Summoner',            ru: 'Призыватель',          icon: '⚰️' },
  life_steal:            { hu: 'Életlopás',         en: 'Life steal',          ru: 'Кража жизни',          icon: '🩸' },
  requires_silver:       { hu: 'Ezüst kell',       en: 'Req. Silver',         ru: 'Нужно серебро',        icon: '⚔️' },
  requires_mithril:      { hu: 'Mithril kell',     en: 'Req. Mithril',        ru: 'Нужен мифрил',         icon: '⚔️' },
  requires_ancient_metal:{ hu: 'Ősi Fém kell',     en: 'Req. Ancient Metal',  ru: 'Нужен древний металл', icon: '⚔️' },
  instant_kill:          { hu: 'Instant halál',    en: 'Instant kill',        ru: 'Мгновенная смерть',    icon: '💀' },
  pickaxe_only:          { hu: 'Csak csákány',     en: 'Pickaxe only',        ru: 'Только кирка',         icon: '⛏️' },
  flying:                { hu: 'Repülő',            en: 'Flying',              ru: 'Летающий',             icon: '🦅' },
  pack:                  { hu: 'Falka',             en: 'Pack',                ru: 'Стая',                 icon: '🐺' },
  wall_detection:        { hu: 'Falon érzékel',    en: 'Wall detect',         ru: 'Чует сквозь стены',    icon: '🧱' },
  gold_passive:          { hu: 'Arannyal passzív', en: 'Gold passive',        ru: 'Пассивен к золоту',    icon: '🪙' },
  potion:                { hu: 'Bájital',           en: 'Potion',              ru: 'Зелье',                icon: '🧪' },
};

export default function MobExplorer() {
  const [lang, setLang] = useState<string>('hu');
  const [selectedMob, setSelectedMob] = useState<Mob | null>(null);
  const [diffFilter, setDiffFilter] = useState<'' | 'early' | 'mid' | 'late' | 'boss'>('');
  const [zoneFilter, setZoneFilter] = useState<'' | 'surface' | 'underground' | 'nether' | 'unknown'>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
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
    window.addEventListener('mite-lang-change', handleLangChange);
    return () => window.removeEventListener('mite-lang-change', handleLangChange);
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
    if (typeFilter && mob.mobType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!mob.name.hu.toLowerCase().includes(q) && !mob.name.en.toLowerCase().includes(q) && !(mob.name as any).ru?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name[lang as 'hu' | 'en' | 'ru'].localeCompare(b.name[lang as 'hu' | 'en' | 'ru']);
    else if (sortKey === 'hp') cmp = (a.hp ?? 0) - (b.hp ?? 0);
    else if (sortKey === 'xp') cmp = (a.xp ?? 0) - (b.xp ?? 0);
    else if (sortKey === 'dmg') cmp = a.dmgMax - b.dmgMax;
    return sortAsc ? cmp : -cmp;
  });

  const isFiltered = diffFilter !== '' || zoneFilter !== '' || typeFilter !== '' || search !== '';

  function SortTh({ k, label }: { k: typeof sortKey; label: string }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true); } }}
        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
          position: 'sticky', top: 0, zIndex: 2,
          background: 'rgba(14,14,20,.97)', padding: '9px 10px',
          fontSize: '.75em', letterSpacing: '.7px', textTransform: 'uppercase',
          color: active ? 'var(--gold)' : 'var(--text2)', fontWeight: active ? 700 : 500,
          boxShadow: '0 2px 8px rgba(0,0,0,.5)' }}
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
  function zoneBtnStyle(z: '' | 'surface' | 'underground' | 'nether' | 'unknown') {
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
    z === 'surface'     ? (lang === 'hu' ? 'Felszín'     : lang === 'ru' ? 'Поверхность'  : 'Surface')     :
    z === 'underground' ? (lang === 'hu' ? 'Föld alatti' : lang === 'ru' ? 'Под землёй'   : 'Underground') :
    z === 'nether'      ? 'Nether' : (lang === 'hu' ? 'Ismeretlen' : lang === 'ru' ? 'Неизвестно' : 'Unknown');

  return (
    <div style={{ position: 'relative' }}>
      {/* Single-column filter container */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--surface2)',
        borderRadius: 8,
        padding: '11px 14px',
        marginBottom: 8,
      }}>
        {/* Search row — first, same visual weight as filter rows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 7 }}>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '.6px', minWidth: 64, flexShrink: 0 }}>
            {lang === 'hu' ? 'Keresés' : lang === 'ru' ? 'Поиск' : 'Search'}
          </span>
          <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 400 }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: '.82em', color: 'var(--text2)', pointerEvents: 'none', lineHeight: 1,
            }}>🔍</span>
            <input
              type="text"
              placeholder={lang === 'hu' ? 'Szörny neve…' : lang === 'ru' ? 'Имя моба…' : 'Mob name…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '4px 24px 4px 26px', borderRadius: 5,
                border: `1px solid ${search ? 'rgba(240,192,64,.28)' : 'rgba(255,255,255,.09)'}`,
                background: 'rgba(0,0,0,.15)', color: 'var(--text)',
                outline: 'none', transition: 'border-color .2s', fontSize: '.88em',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                         background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                         fontSize: '.8em', padding: '1px 3px', lineHeight: 1, opacity: .55 }}>✕</button>
            )}
          </div>
          {/* Active chips — right side of search row */}
          {isFiltered && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
              {diffFilter && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px',
                  borderRadius: 20, fontSize: '.7em', fontWeight: 600,
                  background: diffMeta[diffFilter].bg, color: diffMeta[diffFilter].color,
                  border: `1px solid ${diffMeta[diffFilter].border}` }}>
                  {diffMeta[diffFilter].badge} {diffMeta[diffFilter].label}
                  <button onClick={() => setDiffFilter('')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                      padding: 0, lineHeight: 1, marginLeft: 2, opacity: .7 }}>×</button>
                </span>
              )}
              {zoneFilter && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px',
                  borderRadius: 20, fontSize: '.7em', fontWeight: 600,
                  background: 'rgba(126,200,227,.15)', color: 'var(--mithril)',
                  border: '1px solid rgba(126,200,227,.35)' }}>
                  {zoneIcon[zoneFilter]} {zoneLabel(zoneFilter)}
                  <button onClick={() => setZoneFilter('')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                      padding: 0, lineHeight: 1, marginLeft: 2, opacity: .7 }}>×</button>
                </span>
              )}
              {typeFilter && mobTypeMeta[typeFilter] && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px',
                  borderRadius: 20, fontSize: '.7em', fontWeight: 600,
                  background: mobTypeMeta[typeFilter].bg, color: mobTypeMeta[typeFilter].color,
                  border: `1px solid ${mobTypeMeta[typeFilter].color}55` }}>
                  {mobTypeMeta[typeFilter][lang as 'hu' | 'en' | 'ru']}
                  <button onClick={() => setTypeFilter('')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                      padding: 0, lineHeight: 1, marginLeft: 2, opacity: .7 }}>×</button>
                </span>
              )}
              <button onClick={() => { setDiffFilter(''); setZoneFilter(''); setTypeFilter(''); setSearch(''); }}
                style={{ fontSize: '.68em', color: 'var(--text2)', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '1px 3px', opacity: .65, textDecoration: 'underline' }}>
                {lang === 'hu' ? 'Törlés' : lang === 'ru' ? 'Сброс' : 'Clear'}
              </button>
            </div>
          )}
        </div>

        {/* Difficulty row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 7 }}>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '.6px', minWidth: 64, marginRight: 2 }}>
            {lang === 'hu' ? 'Nehézség' : lang === 'ru' ? 'Сложность' : 'Difficulty'}
          </span>
          {(['', 'early', 'mid', 'late', 'boss'] as const).map(d => {
            const count = d ? allMobs.filter(m => m.difficulty === d).length : allMobs.length;
            return (
              <button key={d} onClick={() => setDiffFilter(d)} style={diffBtnStyle(d)}>
                {d ? `${diffMeta[d].badge} ${diffMeta[d].label}` : (lang === 'hu' ? 'Mind' : lang === 'ru' ? 'Все' : 'All')}
                <span style={{ opacity: .55, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Region row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 7 }}>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '.6px', minWidth: 64, marginRight: 2 }}>
            {lang === 'hu' ? 'Régió' : lang === 'ru' ? 'Регион' : 'Region'}
          </span>
          {(['', 'surface', 'underground', 'nether', 'unknown'] as const).map(z => {
            const count = z ? allMobs.filter(m => m.spawnZones.includes(z)).length : allMobs.length;
            return (
              <button key={z} onClick={() => setZoneFilter(z)} style={zoneBtnStyle(z)}>
                {z ? `${zoneIcon[z]} ${zoneLabel(z)}` : (lang === 'hu' ? 'Mind' : lang === 'ru' ? 'Все' : 'All')}
                <span style={{ opacity: .55, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Type row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.72em', color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '.6px', minWidth: 64, marginRight: 2 }}>
            {lang === 'hu' ? 'Típus' : lang === 'ru' ? 'Тип' : 'Type'}
          </span>
          {['', 'undead', 'monster', 'animal', 'nether', 'elemental', 'boss', 'end'].map(t => {
            const count = t ? allMobs.filter(m => m.mobType === t).length : allMobs.length;
            const meta = t ? mobTypeMeta[t] : null;
            const active = typeFilter === t;
            const isAll = t === '' && active;
            return (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: '.78em',
                fontWeight: (isAll || (active && meta)) ? 700 : 600,
                cursor: 'pointer',
                border: `1px solid ${isAll ? 'var(--text)' : active && meta ? meta.color + '88' : 'var(--surface2)'}`,
                background: isAll ? 'var(--surface2)' : active && meta ? meta.bg : 'transparent',
                color: isAll ? 'var(--text)' : active && meta ? meta.color : 'var(--text2)',
                transition: 'all .15s',
              } as React.CSSProperties}>
                {t ? (mobTypeMeta[t]?.[lang as 'hu' | 'en' | 'ru'] ?? t) : (lang === 'hu' ? 'Mind' : lang === 'ru' ? 'Все' : 'All')}
                <span style={{ opacity: .55, fontWeight: 400, marginLeft: 4, fontSize: '.85em' }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>{/* end unified filter container */}

      {/* Count */}
      <div style={{ fontSize: '.8em', color: 'var(--text2)', marginBottom: 4 }}>
        {isFiltered
          ? <><span style={{ color: 'var(--text)', fontWeight: 600 }}>{filtered.length}</span> {lang === 'hu' ? 'találat' : lang === 'ru' ? 'результатов' : 'results'} <span style={{ opacity: .5 }}>/ {allMobs.length}</span></>
          : <>{lang === 'hu' ? 'Összesen' : lang === 'ru' ? 'Всего' : 'All'} <span style={{ color: 'var(--text)', fontWeight: 600 }}>{allMobs.length}</span> {lang === 'hu' ? 'szörny' : lang === 'ru' ? 'мобов' : 'mobs'}</>
        }
      </div>

      {/* Mobile card grid (hidden on desktop via CSS) */}
      <div className="mob-card-grid">
        {filtered.map(mob => (
          <div key={mob.id} className={`mob-card${selectedMob?.id === mob.id ? ' mob-card-selected' : ''}`}
            onClick={() => openMob(mob)}>
            <div className="mob-card-sprite">
              <MobSprite mob={mob} size={40} />
            </div>
            <div className="mob-card-body">
              <div className="mob-card-name">
                <span className={`diff-badge ${diffMeta[mob.difficulty].cls}`} style={{ marginRight: 4 }}>
                  {diffMeta[mob.difficulty].badge}
                </span>
                {mob.name[lang as 'hu' | 'en' | 'ru']}
                <span style={{ opacity: .6, marginLeft: 4, fontSize: '.85em' }}>
                  {mob.tags.slice(0, 3).map(t => tagMeta[t]?.icon ?? '').join('')}
                </span>
              </div>
              <div className="mob-card-stats">
                <span className="mob-card-stat">
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>{mob.hp ?? '?'}</span>
                  <span style={{ color: 'var(--text2)', fontSize: '.75em' }}>HP</span>
                </span>
                <span className="mob-card-stat">
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {mob.dmgMin === mob.dmgMax ? mob.dmgMin : `${mob.dmgMin}–${mob.dmgMax}`}
                    {mob.dmgType !== 'melee' ? ` ${dmgTypeIcon[mob.dmgType] ?? ''}` : ''}
                  </span>
                  <span style={{ color: 'var(--text2)', fontSize: '.75em' }}>⚔</span>
                </span>
                <span className="mob-card-stat">
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{mob.xp ?? '?'}</span>
                  <span style={{ color: 'var(--text2)', fontSize: '.75em' }}>XP</span>
                </span>
              </div>
            </div>
            <span style={{ color: 'var(--text2)', fontSize: '.8em', flexShrink: 0 }}>ℹ</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text2)', fontStyle: 'italic', gridColumn: '1/-1' }}>
            {lang === 'hu' ? 'Nincs találat a szűrőkre.' : lang === 'ru' ? 'Мобы не найдены.' : 'No mobs match filters.'}
          </div>
        )}
      </div>

      {/* Table (hidden on mobile via CSS) */}
      <div className="mob-table-wrap" style={{ overflowY: 'auto', maxHeight: '70vh', borderRadius: 6, border: '1px solid var(--surface2)' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(240,192,64,.45)' }}>
            <SortTh k="name" label={lang === 'hu' ? 'Név' : lang === 'ru' ? 'Имя' : 'Name'} />
            <SortTh k="hp" label="HP" />
            <SortTh k="dmg" label={lang === 'hu' ? '⚔ Sebzés' : lang === 'ru' ? '⚔ Урон' : '⚔ Damage'} />
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <MobSprite mob={mob} size={24} />
                  <span className={`diff-badge ${diffMeta[mob.difficulty].cls}`} style={{ marginRight: 2 }}>
                    {diffMeta[mob.difficulty].badge}
                  </span>
                  {mob.name[lang as 'hu' | 'en' | 'ru']}
                  <span style={{ marginLeft: 2, opacity: .6, fontSize: '.9em' }}>
                    {mob.tags.slice(0, 3).map(t => tagMeta[t]?.icon ?? '').join('')}
                    {mob.tags.length > 3 && (
                      <span style={{ fontSize: '.8em', color: 'var(--text2)', marginLeft: 2 }}>
                        +{mob.tags.length - 3}
                      </span>
                    )}
                  </span>
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
                {lang === 'hu' ? 'Nincs találat a szűrőkre.' : lang === 'ru' ? 'Мобы не найдены.' : 'No mobs match filters.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {/* Drawer + overlay */}
      {selectedMob && (
        <>
          <div onClick={closeMob}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99 }}
            className="drawer-overlay" />
          <div className="mob-drawer-panel" style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(520px, 100vw)',
            background: 'var(--bg)', borderLeft: '1px solid var(--surface2)',
            overflowY: 'auto', zIndex: 100,
            boxShadow: '-4px 0 32px rgba(0,0,0,.4)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* mcmod preview image (rendered screenshot) */}
            <MobPreviewImage mob={selectedMob} />

            {/* Sticky header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 1,
              background: 'var(--bg)', borderBottom: '1px solid var(--surface2)',
              padding: '16px 24px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <MobSprite mob={selectedMob} size={48} />
                  <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.25em' }}>
                    {selectedMob.name[lang as 'hu' | 'en' | 'ru']}
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
                    {selectedMob.mobType && mobTypeMeta[selectedMob.mobType] && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: '.7em', fontWeight: 600,
                        background: mobTypeMeta[selectedMob.mobType].bg,
                        color: mobTypeMeta[selectedMob.mobType].color,
                        border: `1px solid ${mobTypeMeta[selectedMob.mobType].color}44`,
                      }}>
                        {mobTypeMeta[selectedMob.mobType][lang as 'hu' | 'en' | 'ru']}
                      </span>
                    )}
                  </div>
                  </div>{/* end name+badges div */}
                </div>{/* end sprite+name flex */}
                <button onClick={closeMob} style={{
                  background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer',
                  fontSize: '1.1em', padding: '8px 10px', margin: '-8px -10px', borderRadius: 6, lineHeight: 1
                }}>✕</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: '20px 24px', flex: 1 }}>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 20,
                background: 'var(--surface)', border: '1px solid var(--surface2)',
                borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { val: selectedMob.hp ?? '?', label: '❤ HP', color: 'var(--green)' },
                  { val: dmgDisplay(selectedMob, true), label: `⚔ ${lang === 'hu' ? 'Sebzés' : lang === 'ru' ? 'Урон' : 'Damage'}`, color: 'var(--accent)' },
                  ...(selectedMob.armor != null ? [{ val: selectedMob.armor, label: `🛡 ${lang === 'hu' ? 'Páncél' : lang === 'ru' ? 'Броня' : 'Armor'}`, color: 'var(--mithril)' }] : []),
                  { val: selectedMob.xp ?? '?', label: '⭐ XP', color: 'var(--gold)' },
                  ...(selectedMob.speed != null ? [{
                    val: selectedMob.speed.toFixed(2),
                    label: `🏃 ${lang === 'hu' ? 'Sebesség' : lang === 'ru' ? 'Скорость' : 'Speed'}`,
                    color: 'var(--text)',
                  }] : []),
                ].map((s, i, arr) => (
                  <div key={i} style={{ flex: 1, padding: '14px 8px', textAlign: 'center',
                    borderRight: i < arr.length - 1 ? '1px solid var(--surface2)' : 'none' }}>
                    <div style={{ fontSize: '1.6em', fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
                    <div style={{ fontSize: '.78em', color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {selectedMob.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {selectedMob.tags.map(t => (
                    <span key={t} style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: '.75em',
                      background: 'var(--surface)', border: '1px solid var(--surface2)',
                    }}>
                      {tagMeta[t]?.icon ?? ''} {tagMeta[t]?.[lang as 'hu' | 'en' | 'ru'] ?? t}
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
                  ⚠️ {lang === 'hu' ? 'Speciális fegyver szükséges!' : lang === 'ru' ? 'Нужно особое оружие!' : 'Requires special weapon!'}
                </div>
              )}

              {/* Description */}
              {selectedMob.description?.[lang as 'hu' | 'en' | 'ru'] && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: '.92em', color: 'var(--text)', lineHeight: 1.65,
                    fontStyle: 'italic', opacity: 0.85 }}>
                    {selectedMob.description[lang as 'hu' | 'en' | 'ru']}
                  </p>
                </div>
              )}

              {/* Spawn info */}
              {selectedMob.spawnInfo?.[lang as 'hu' | 'en' | 'ru'] && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                    color: 'var(--text2)', marginBottom: 6 }}>
                    🗺 {lang === 'hu' ? 'Megjelenés' : lang === 'ru' ? 'Где встречается' : 'Spawn'}
                  </div>
                  <div style={{ fontSize: '.9em', color: 'var(--text)', lineHeight: 1.55,
                    background: 'var(--surface)', border: '1px solid var(--surface2)',
                    borderRadius: 6, padding: '10px 14px' }}>
                    {selectedMob.spawnInfo[lang as 'hu' | 'en' | 'ru']}
                  </div>
                </div>
              )}

              {/* Special mechanics */}
              {selectedMob.special && (
                <div style={{ marginTop: 0, marginBottom: 16 }}>
                  <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                    color: 'var(--text2)', marginBottom: 6 }}>
                    ⚙ {lang === 'hu' ? 'Különleges mechanika' : lang === 'ru' ? 'Особые механики' : 'Special mechanics'}
                  </div>
                  <div style={{ fontSize: '.9em', color: 'var(--text)', lineHeight: 1.6,
                    background: 'var(--surface)', border: '1px solid var(--surface2)',
                    borderRadius: 6, padding: '10px 14px' }}>
                    {selectedMob.special[lang as 'hu' | 'en' | 'ru']
                      .split(/ — |; /)
                      .map((part, i) => {
                        const parts = selectedMob.special![lang as 'hu' | 'en' | 'ru'].split(/ — |; /);
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
                <div style={{ marginTop: 0 }}>
                  <div style={{ fontSize: '.72em', textTransform: 'uppercase', letterSpacing: '.6px',
                    color: 'var(--text2)', marginBottom: 6 }}>
                    🎁 {lang === 'hu' ? 'Dropok' : lang === 'ru' ? 'Добыча' : 'Drops'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selectedMob.drops.map((drop, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '.88em',
                        padding: '6px 10px', background: 'var(--surface)',
                        border: '1px solid var(--surface2)', borderRadius: 5 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--text)' }}>
                            {drop.item[lang as 'hu' | 'en' | 'ru']}
                            {drop.qty && <span style={{ color: 'var(--text2)', marginLeft: 4 }}>×{drop.qty}</span>}
                          </span>
                          {drop.itemId && (
                            <a href={`${BASE}/recipes/?search=${encodeURIComponent(drop.itemId)}`}
                              title={lang === 'hu' ? 'Receptek megtekintése' : lang === 'ru' ? 'Просмотр рецептов' : 'View recipes'}
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: '.78em', color: 'var(--mithril)', textDecoration: 'none',
                                padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(126,200,227,.3)',
                                background: 'rgba(126,200,227,.08)', flexShrink: 0 }}>
                              {lang === 'hu' ? '→ recept' : lang === 'ru' ? '→ рецепт' : '→ recipe'}
                            </a>
                          )}
                        </span>
                        <span style={{ fontSize: '.8em', color: chanceColor[drop.chance] ?? 'var(--text2)',
                          fontWeight: 600, flexShrink: 0 }}>
                          {chanceLabel[drop.chance]?.[lang as 'hu' | 'en' | 'ru'] ?? drop.chance}
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
