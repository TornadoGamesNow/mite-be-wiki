/* MITE: Break Everything Wiki — App v5 */

// ── Language Switcher ──
function setLang(lang) {
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-lang') === lang);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === lang);
  });
  try { localStorage.setItem('mite-wiki-lang', lang); } catch(e) {}
  const si = document.querySelector('.search-input');
  if (si) si.placeholder = lang === 'hu' ? 'Keresés a wikiben...' : 'Search the wiki...';
  // Invalidate index when language changes
  _searchIndex = null;
  _searchLang = null;
  const dd = document.getElementById('search-dropdown');
  if (dd) dd.style.display = 'none';
}

// ── Sidebar Active Link Tracking ──
function initNavTracking() {
  const links = document.querySelectorAll('.sidebar a[href^="#"]');
  const sections = [];
  links.forEach(a => {
    const id = a.getAttribute('href')?.replace('#','');
    if (id) {
      const el = document.getElementById(id);
      if (el) sections.push({ el, a });
    }
  });
  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const match = sections.find(s => s.el === entry.target);
        if (match) match.a.classList.add('active');
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px' });
  sections.forEach(s => observer.observe(s.el));
}

// ── URL Hash Management ──
function initHashNav() {
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 200);
  }
  const h2s = document.querySelectorAll('h2[id]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) history.replaceState(null, '', '#' + entry.target.id);
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  h2s.forEach(h => obs.observe(h));
}

// ── Search ──
let _searchIndex = null;
let _searchLang = null;

function getLang() {
  try { return localStorage.getItem('mite-wiki-lang') || 'hu'; } catch(e) { return 'hu'; }
}

function buildSearchIndex(lang) {
  _searchLang = lang;
  _searchIndex = [];
  const content = document.querySelector('.content');
  if (!content) return;
  content.querySelectorAll('[data-lang="' + lang + '"]').forEach(div => {
    const h2 = div.querySelector('h2[id]');
    if (!h2) return;
    const text = div.textContent.replace(/\s+/g, ' ').trim();
    if (text.length < 20) return;
    _searchIndex.push({ id: h2.id, title: h2.textContent.trim(), text, el: h2, div });
  });
}

function getIndex() {
  const lang = getLang();
  if (!_searchIndex || _searchLang !== lang) buildSearchIndex(lang);
  return _searchIndex;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function makeSnippet(text, query, before, after) {
  const lo = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(lo);
  if (idx === -1) return escHtml(text.substring(0, before + after)) + '…';
  const s = Math.max(0, idx - before);
  const e = Math.min(text.length, idx + lo.length + after);
  return (s > 0 ? '…' : '') +
    escHtml(text.substring(s, idx)) +
    '<mark>' + escHtml(text.substring(idx, idx + query.length)) + '</mark>' +
    escHtml(text.substring(idx + query.length, e)) +
    (e < text.length ? '…' : '');
}

function countOccurrences(text, query) {
  const lo = query.toLowerCase();
  const tlo = text.toLowerCase();
  let n = 0, pos = 0;
  while ((pos = tlo.indexOf(lo, pos)) !== -1) { n++; pos += lo.length; }
  return n;
}

function highlightText(root, query) {
  const lo = query.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script,style,.search-input,.search-results')) continue;
    if (node.textContent.toLowerCase().includes(lo)) nodes.push(node);
  }
  nodes.reverse().forEach(node => {
    const text = node.textContent;
    const tlo = text.toLowerCase();
    const frag = document.createDocumentFragment();
    let last = 0, pos;
    while ((pos = tlo.indexOf(lo, last)) !== -1) {
      if (pos > last) frag.appendChild(document.createTextNode(text.slice(last, pos)));
      const mark = document.createElement('mark');
      mark.className = 'search-hl';
      mark.textContent = text.slice(pos, pos + query.length);
      frag.appendChild(mark);
      last = pos + query.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

function clearHighlights() {
  document.querySelectorAll('mark.search-hl').forEach(m => {
    m.parentNode?.replaceChild(document.createTextNode(m.textContent), m);
  });
}

function navigateToResult(entry, query, dropdown) {
  dropdown.style.display = 'none';
  clearHighlights();
  entry.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Brief glow on the heading
  entry.el.classList.add('search-nav-flash');
  setTimeout(() => entry.el.classList.remove('search-nav-flash'), 1000);
  setTimeout(() => {
    highlightText(entry.div, query);
    const first = entry.div.querySelector('mark.search-hl');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

function positionDropdown(dropdown, activeWrap) {
  const rect = activeWrap.getBoundingClientRect();
  dropdown.style.left  = rect.left + 'px';
  dropdown.style.top   = rect.bottom + 'px';
  dropdown.style.width = rect.width + 'px';
  dropdown.style.maxHeight = Math.max(180, window.innerHeight - rect.bottom - 16) + 'px';
}

function renderDropdown(dropdown, query, activeWrap) {
  clearHighlights();
  dropdown.innerHTML = '';
  dropdown._items = [];
  dropdown._kbdIdx = -1;

  const lang = getLang();

  if (!query || query.length < 2) {
    dropdown.style.display = 'none';
    return;
  }

  const index = getIndex();
  const matches = index.filter(e => e.text.toLowerCase().includes(query.toLowerCase()));

  if (!matches.length) {
    dropdown.innerHTML = '<div class="sr-empty">' +
      (lang === 'hu' ? 'Nincs találat: <em>' + escHtml(query) + '</em>' : 'No results for <em>' + escHtml(query) + '</em>') +
      '</div>';
    positionDropdown(dropdown, activeWrap);
    dropdown.style.display = 'block';
    return;
  }

  // Count header
  const total = matches.reduce((n, e) => n + countOccurrences(e.text, query), 0);
  const countEl = document.createElement('div');
  countEl.className = 'sr-count';
  countEl.textContent = lang === 'hu'
    ? total + ' találat — ' + matches.length + ' szekcióban'
    : total + ' match' + (total !== 1 ? 'es' : '') + ' across ' + matches.length + ' section' + (matches.length !== 1 ? 's' : '');
  dropdown.appendChild(countEl);

  const shown = matches.slice(0, 10);
  shown.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = 'sr-item';
    item.setAttribute('role', 'option');
    item.innerHTML =
      '<div class="sr-title">' + escHtml(entry.title) + '</div>' +
      '<div class="sr-snippet">' + makeSnippet(entry.text, query, 60, 100) + '</div>';

    item.addEventListener('pointerenter', () => {
      dropdown._kbdIdx = i;
      dropdown._items.forEach((it, j) => it.classList.toggle('sr-active', j === i));
    });
    item.addEventListener('click', () => navigateToResult(entry, query, dropdown));

    dropdown._items.push(item);
    dropdown.appendChild(item);
  });

  if (matches.length > 10) {
    const more = document.createElement('div');
    more.className = 'sr-count';
    more.style.textAlign = 'center';
    more.textContent = lang === 'hu'
      ? '+ ' + (matches.length - 10) + ' további szekció'
      : '+ ' + (matches.length - 10) + ' more sections';
    dropdown.appendChild(more);
  }

  positionDropdown(dropdown, activeWrap);
  dropdown.style.display = 'block';
}

function initSearch() {
  const wraps = document.querySelectorAll('.search-wrap');
  if (!wraps.length) return;

  // One global dropdown attached to body (avoids sidebar overflow clipping)
  const dropdown = document.createElement('div');
  dropdown.id = 'search-dropdown';
  dropdown.className = 'search-results';
  dropdown.setAttribute('role', 'listbox');
  dropdown.style.display = 'none';
  document.body.appendChild(dropdown);

  let activeWrap = null;

  wraps.forEach(wrap => {
    const input = wrap.querySelector('.search-input');
    if (!input) return;

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'search-clear';
    clearBtn.innerHTML = '&times;';
    clearBtn.title = getLang() === 'hu' ? 'Törlés' : 'Clear';
    clearBtn.setAttribute('tabindex', '-1');
    clearBtn.setAttribute('aria-label', 'Clear search');
    wrap.appendChild(clearBtn);

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearHighlights();
      dropdown.style.display = 'none';
      clearBtn.style.display = 'none';
      input.focus();
    });

    let debounce;
    input.addEventListener('input', () => {
      const val = input.value;
      clearBtn.style.display = val ? 'flex' : 'none';
      activeWrap = wrap;
      clearTimeout(debounce);
      debounce = setTimeout(() => renderDropdown(dropdown, val.trim(), wrap), 180);
    });

    input.addEventListener('focus', () => {
      activeWrap = wrap;
      const val = input.value.trim();
      if (val.length >= 2 && dropdown.innerHTML) {
        positionDropdown(dropdown, wrap);
        dropdown.style.display = 'block';
      }
    });
  });

  // Keyboard shortcuts and navigation
  document.addEventListener('keydown', e => {
    // Ctrl+K or / to open search
    if ((e.ctrlKey && e.key === 'k') ||
        (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName))) {
      e.preventDefault();
      const vis = document.querySelector('[data-lang].active .search-input') ||
                  document.querySelector('.search-input');
      if (vis) { vis.focus(); vis.select(); }
      return;
    }

    const isSearch = document.activeElement.classList.contains('search-input');
    if (!isSearch) return;

    if (e.key === 'Escape') {
      if (dropdown.style.display !== 'none') {
        dropdown.style.display = 'none';
      } else {
        document.activeElement.value = '';
        clearHighlights();
        const cb = document.activeElement.closest('.search-wrap')?.querySelector('.search-clear');
        if (cb) cb.style.display = 'none';
        document.activeElement.blur();
      }
      return;
    }

    const items = dropdown._items || [];
    if (!items.length || dropdown.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      dropdown._kbdIdx = Math.min((dropdown._kbdIdx ?? -1) + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      dropdown._kbdIdx = Math.max((dropdown._kbdIdx ?? 0) - 1, 0);
    } else if (e.key === 'Enter') {
      const idx = dropdown._kbdIdx ?? -1;
      const target = idx >= 0 ? items[idx] : items.length === 1 ? items[0] : null;
      if (target) target.click();
      return;
    } else {
      return;
    }

    items.forEach((it, i) => it.classList.toggle('sr-active', i === dropdown._kbdIdx));
    items[dropdown._kbdIdx]?.scrollIntoView({ block: 'nearest' });
  });

  // Reposition on scroll / resize
  const reposition = () => {
    if (dropdown.style.display !== 'none' && activeWrap) positionDropdown(dropdown, activeWrap);
  };
  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition);

  // Close on outside click
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.search-wrap') && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

// ── Collapsible Sections ──
function initCollapsibles() {
  document.querySelectorAll('.collapsible-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      const body = toggle.nextElementSibling;
      if (body) body.classList.toggle('open', !expanded);
    });
  });
}

// ── Back to Top Button + Progress Bar ──
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    if (bar) {
      const winH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (winH > 0 ? Math.min(100, (window.scrollY / winH) * 100) : 0) + '%';
    }
  }, { passive: true });
  if (btn) btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Keyboard Navigation ──
function initKeyboardNav() {
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'ArrowLeft') setLang('hu');
    if (e.altKey && e.key === 'ArrowRight') setLang('en');
  });
}

// ── Init All ──
document.addEventListener('DOMContentLoaded', () => {
  let saved;
  try { saved = localStorage.getItem('mite-wiki-lang'); } catch(e) {}
  setLang(saved || 'hu');
  initNavTracking();
  initHashNav();
  initSearch();
  initCollapsibles();
  initBackToTop();
  initKeyboardNav();
});
