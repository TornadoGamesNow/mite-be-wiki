import { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
import { getCurrentLang, onLangChange } from '../i18n/lang';
import type { Lang } from '../i18n/types';

interface SearchItem {
  id: string;
  titleHu: string;
  titleEn: string;
  contentHu: string;
  contentEn: string;
  href: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  href: string;
}

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [lang, setLang] = useState<Lang>('hu');
  const inputRef = useRef<HTMLInputElement>(null);
  const fuseRef = useRef<Fuse<SearchItem> | null>(null);
  const itemsRef = useRef<SearchItem[]>([]);

  // Build search index from page content
  useEffect(() => {
    setLang(getCurrentLang());
    const unsub = onLangChange((l) => setLang(l as Lang));

    // Extract sections from page
    const sections = document.querySelectorAll('h2[id], h3[id]');
    const items: SearchItem[] = [];

    sections.forEach((el) => {
      const id = el.getAttribute('id') || '';
      const section = el.closest('[data-lang]');
      const sectionLang = section?.getAttribute('data-lang') || '';

      // Get text content of this section until next heading
      let content = '';
      let sibling = el.nextElementSibling;
      while (sibling && !sibling.matches('h2, h3')) {
        content += ' ' + (sibling.textContent || '');
        sibling = sibling.nextElementSibling;
      }

      const existing = items.find((i) => i.id === id);
      if (existing) {
        if (sectionLang === 'hu') {
          existing.titleHu = el.textContent || '';
          existing.contentHu = content.slice(0, 500);
        } else {
          existing.titleEn = el.textContent || '';
          existing.contentEn = content.slice(0, 500);
        }
      } else {
        items.push({
          id,
          titleHu: sectionLang === 'hu' ? el.textContent || '' : '',
          titleEn: sectionLang === 'en' ? el.textContent || '' : '',
          contentHu: sectionLang === 'hu' ? content.slice(0, 500) : '',
          contentEn: sectionLang === 'en' ? content.slice(0, 500) : '',
          href: `#${id}`,
        });
      }
    });

    itemsRef.current = items;
    rebuildFuse(getCurrentLang(), items);

    return unsub;
  }, []);

  // Rebuild Fuse when language changes
  useEffect(() => {
    rebuildFuse(lang, itemsRef.current);
    if (query) search(query);
  }, [lang]);

  function rebuildFuse(currentLang: Lang, items: SearchItem[]) {
    const keys =
      currentLang === 'hu'
        ? ['titleHu', 'contentHu']
        : ['titleEn', 'contentEn'];
    fuseRef.current = new Fuse(items, {
      keys,
      threshold: 0.4,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }

  function search(q: string) {
    if (!fuseRef.current || q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const titleKey = lang === 'hu' ? 'titleHu' : 'titleEn';
    const contentKey = lang === 'hu' ? 'contentHu' : 'contentEn';

    const raw = fuseRef.current.search(q, { limit: 10 });
    const mapped: SearchResult[] = raw.map((r) => ({
      title: r.item[titleKey] || r.item.titleHu || r.item.id,
      snippet: makeSnippet(r.item[contentKey] || r.item.contentHu, q),
      href: r.item.href,
    }));

    setResults(mapped);
    setIsOpen(mapped.length > 0);
    setActiveIndex(-1);
  }

  function makeSnippet(text: string, q: string): string {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text.slice(0, 120) + '...';
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + q.length + 80);
    let snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
    // Highlight match
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    snippet = snippet.replace(regex, '<mark>$1</mark>');
    return snippet;
  }

  const navigate = useCallback((href: string) => {
    setIsOpen(false);
    setQuery('');
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('search-nav-flash');
      setTimeout(() => el.classList.remove('search-nav-flash'), 1000);
    }
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex].href);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const placeholder = lang === 'hu' ? 'Keresés a wikiben...' : 'Search the wiki...';
  const noResults = lang === 'hu' ? 'Nincs találat' : 'No results found';

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />
      {query && (
        <button
          className="search-clear"
          style={{ display: 'flex' }}
          onClick={() => {
            setQuery('');
            setResults([]);
            setIsOpen(false);
            inputRef.current?.focus();
          }}
        >
          &times;
        </button>
      )}
      {isOpen && (
        <div className="search-results" style={{ left: 0, right: 0, top: '100%', maxHeight: '60vh' }}>
          <div className="sr-count">
            {results.length} {lang === 'hu' ? 'találat' : 'results'}
          </div>
          {results.length === 0 ? (
            <div className="sr-empty">{noResults}</div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.href}
                className={`sr-item${i === activeIndex ? ' sr-active' : ''}`}
                onMouseDown={() => navigate(r.href)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className="sr-title">{r.title}</div>
                <div
                  className="sr-snippet"
                  dangerouslySetInnerHTML={{ __html: r.snippet }}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
