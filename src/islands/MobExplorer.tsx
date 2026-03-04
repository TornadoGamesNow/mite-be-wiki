import { useState, useEffect, useMemo } from 'react';
import { getCurrentLang, onLangChange } from '../i18n/lang';
import type { Lang } from '../i18n/types';
import mobsData from '../../data/mobs.json';

type Dimension = 'surface' | 'underground' | 'nether';

interface Mob {
  name: { hu: string; en: string };
  hp: number | null;
  dmg: { hu: string; en: string };
  xp: number | null;
  special: { hu: string; en: string };
  dimension: Dimension;
}

const allMobs: Mob[] = (Object.entries(mobsData) as [Dimension, any[]][]).flatMap(
  ([dim, mobs]) => mobs.map((m) => ({ ...m, dimension: dim }))
);

type SortKey = 'name' | 'hp' | 'xp';

export default function MobExplorer() {
  const [lang, setLang] = useState<Lang>('hu');
  const [dimFilter, setDimFilter] = useState<Dimension | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setLang(getCurrentLang());
    return onLangChange((l) => setLang(l as Lang));
  }, []);

  const filtered = useMemo(() => {
    let list = dimFilter ? allMobs.filter((m) => m.dimension === dimFilter) : [...allMobs];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name[lang].localeCompare(b.name[lang]);
      } else if (sortKey === 'hp') {
        cmp = (a.hp ?? 0) - (b.hp ?? 0);
      } else {
        cmp = (a.xp ?? 0) - (b.xp ?? 0);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [dimFilter, sortKey, sortAsc, lang]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const dimLabels: Record<string, { hu: string; en: string }> = {
    '': { hu: 'Mind', en: 'All' },
    surface: { hu: 'Felszín', en: 'Surface' },
    underground: { hu: 'Föld alatt', en: 'Underground' },
    nether: { hu: 'Nether', en: 'Nether' },
  };

  const arrow = sortAsc ? ' ▲' : ' ▼';

  return (
    <div style={{ margin: '14px 0' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {(['', 'surface', 'underground', 'nether'] as const).map((dim) => (
          <button
            key={dim}
            onClick={() => setDimFilter(dim as Dimension | '')}
            style={{
              padding: '5px 14px', borderRadius: '6px', border: '1px solid var(--surface2)',
              background: dimFilter === dim ? 'var(--accent)' : 'var(--surface)',
              color: dimFilter === dim ? '#fff' : 'var(--text2)',
              cursor: 'pointer', fontSize: '.85em', fontFamily: 'inherit',
            }}
          >
            {dimLabels[dim][lang]}
          </button>
        ))}
        <span style={{ color: 'var(--text2)', fontSize: '.82em', alignSelf: 'center', marginLeft: 'auto' }}>
          {filtered.length} {lang === 'hu' ? 'szörny' : 'mobs'}
        </span>
      </div>

      <table className="compare-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
              {lang === 'hu' ? 'Név' : 'Name'}{sortKey === 'name' ? arrow : ''}
            </th>
            <th onClick={() => toggleSort('hp')} style={{ cursor: 'pointer' }}>
              HP{sortKey === 'hp' ? arrow : ''}
            </th>
            <th>{lang === 'hu' ? 'Sebzés' : 'Damage'}</th>
            <th onClick={() => toggleSort('xp')} style={{ cursor: 'pointer' }}>
              XP{sortKey === 'xp' ? arrow : ''}
            </th>
            <th>{lang === 'hu' ? 'Különleges' : 'Special'}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((mob, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{mob.name[lang]}</td>
              <td>{mob.hp ?? '?'}</td>
              <td>{mob.dmg[lang]}</td>
              <td>{mob.xp ?? '?'}</td>
              <td style={{ fontSize: '.85em' }} dangerouslySetInnerHTML={{ __html: mob.special[lang] }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
