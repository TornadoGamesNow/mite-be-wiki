import { useState, useEffect } from 'react';
import { getCurrentLang, onLangChange } from '../i18n/lang';
import type { Lang } from '../i18n/types';

interface Props {
  versions?: string[];
}

function parseVersion(v: string): number[] {
  return v.split('.').map((n) => parseInt(n, 10) || 0);
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export default function VersionToggle({ versions = ['0.8.0', '0.9.0'] }: Props) {
  const [lang, setLang] = useState<Lang>('hu');
  const [selectedVersion, setSelectedVersion] = useState(versions[versions.length - 1]);

  useEffect(() => {
    setLang(getCurrentLang());
    return onLangChange((l) => setLang(l as Lang));
  }, []);

  useEffect(() => {
    // Show/hide elements based on version
    document.querySelectorAll('[data-introduced-in]').forEach((el) => {
      const introduced = el.getAttribute('data-introduced-in') || '0.0.0';
      const removed = el.getAttribute('data-removed-in');
      const show =
        compareVersions(selectedVersion, introduced) >= 0 &&
        (!removed || compareVersions(selectedVersion, removed) < 0);
      (el as HTMLElement).style.display = show ? '' : 'none';
    });
  }, [selectedVersion]);

  return (
    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', fontSize: '.85em' }}>
      <span style={{ color: 'var(--text2)' }}>
        {lang === 'hu' ? 'Verzió:' : 'Version:'}
      </span>
      {versions.map((v) => (
        <button
          key={v}
          onClick={() => setSelectedVersion(v)}
          style={{
            padding: '3px 10px', borderRadius: '4px',
            border: '1px solid var(--surface2)',
            background: selectedVersion === v ? 'var(--gold)' : 'var(--surface)',
            color: selectedVersion === v ? '#222' : 'var(--text2)',
            cursor: 'pointer', fontSize: '.9em', fontWeight: selectedVersion === v ? 700 : 400,
            fontFamily: 'inherit',
          }}
        >
          v{v}
        </button>
      ))}
    </div>
  );
}
