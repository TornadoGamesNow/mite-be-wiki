import type { Lang } from './types';

const LANG_KEY = 'mite-wiki-lang';
const LANG_EVENT = 'mite-lang-change';

export function getCurrentLang(): Lang {
  if (typeof window === 'undefined') return 'hu';
  return (localStorage.getItem(LANG_KEY) as Lang) ||
    (document.documentElement.getAttribute('data-lang-init') as Lang) ||
    'hu';
}

export function setCurrentLang(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.setAttribute('data-lang-init', lang);
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
}

export function onLangChange(cb: (lang: Lang) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail as Lang);
  window.addEventListener(LANG_EVENT, handler);
  return () => window.removeEventListener(LANG_EVENT, handler);
}
