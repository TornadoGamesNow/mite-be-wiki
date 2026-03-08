import { useState, useEffect } from 'react';
import { getCurrentLang, setCurrentLang, onLangChange } from '../i18n/lang';
import type { Lang } from '../i18n/types';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState<Lang>('hu');

  useEffect(() => {
    setLang(getCurrentLang());
    return onLangChange((l) => setLang(l as Lang));
  }, []);

  const toggle = (newLang: Lang) => {
    setCurrentLang(newLang);
  };

  return (
    <div className="lang-switch">
      <button
        className={`lang-btn${lang === 'hu' ? ' active' : ''}`}
        onClick={() => toggle('hu')}
      >
        Magyar
      </button>
      <button
        className={`lang-btn${lang === 'en' ? ' active' : ''}`}
        onClick={() => toggle('en')}
      >
        English
      </button>
      <button
        className={`lang-btn${lang === 'ru' ? ' active' : ''}`}
        onClick={() => toggle('ru')}
      >
        Русский
      </button>
    </div>
  );
}
