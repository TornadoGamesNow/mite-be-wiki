/* MITE: Break Everything Wiki — App v6 */

// ── Language Switcher ──
function setLang(lang) {
  document.documentElement.setAttribute('data-lang-init', lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === lang);
  });
  try { localStorage.setItem('mite-wiki-lang', lang); } catch(e) {}
  document.querySelectorAll('.search-input').forEach(si => {
    si.placeholder = lang === 'hu' ? 'Oldalak, tárgyak, receptek...' : lang === 'ru' ? 'Страницы, предметы, рецепты...' : 'Pages, items, recipes...';
  });
  // Invalidate index when language changes
  _searchIndex = null;
  _searchLang = null;
  const dd = document.getElementById('search-dropdown');
  if (dd) dd.style.display = 'none';
  // Re-build nav observer for now-visible elements
  document.dispatchEvent(new Event('langChange'));
  // Notify React islands about language change
  window.__miteLang = lang;
  window.dispatchEvent(new CustomEvent('mite:langChange', { detail: lang }));
  // Re-render data tables in new language
  initDataTables(lang);
}

// ── Helper: find element with given ID that is visible (in active lang section) ──
function findVisibleEl(id) {
  try {
    const candidates = document.querySelectorAll('[id="' + CSS.escape(id) + '"]');
    for (const el of candidates) {
      const lc = el.closest('[data-lang]');
      const currentLang = document.documentElement.getAttribute('data-lang-init') || 'hu';
      if (!lc || lc.getAttribute('data-lang') === currentLang) return el;
    }
    return candidates[0] || null;
  } catch(e) {
    return document.getElementById(id);
  }
}

// ── Sidebar Anchor Click Override ──
// Finds the correct (visible) version of a duplicate-ID element and scrolls to it.
function initAnchorNav() {
  document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = findVisibleEl(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      }
    });
  });
}

// ── Sidebar Active Link Tracking ──
function initNavTracking() {
  const links = [...document.querySelectorAll('.sidebar-nav a[href^="#"]')];
  if (!links.length) return;

  function setActive(id) {
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
    // Use the VISIBLE sidebar link (clientHeight > 0 means not display:none)
    const activeLink = links.find(l => l.getAttribute('href') === '#' + id && l.closest('.sidebar')?.clientHeight > 0);
    if (activeLink) {
      const sidebar = activeLink.closest('.sidebar');
      if (sidebar) {
        const sRect = sidebar.getBoundingClientRect();
        const lRect = activeLink.getBoundingClientRect();
        const relTop = lRect.top - sRect.top + sidebar.scrollTop;
        const relBot = relTop + activeLink.offsetHeight;
        const visTop = sidebar.scrollTop;
        const visBot = visTop + sidebar.clientHeight;
        if (relTop < visTop + 40) sidebar.scrollTo({ top: relTop - 40, behavior: 'smooth' });
        else if (relBot > visBot - 40) sidebar.scrollTo({ top: relBot - sidebar.clientHeight + 40, behavior: 'smooth' });
      }
    }
  }

  function getTargets() {
    const els = links.map(a => {
      const id = a.getAttribute('href').slice(1);
      return findVisibleEl(id);
    }).filter(Boolean);
    // Sort by actual document position (offsetTop from document top)
    return els.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  }

  function updateActive() {
    const targets = getTargets();
    // Find the last section header that has scrolled past the top (top <= 80px)
    let best = null;
    for (const el of targets) {
      if (el.getBoundingClientRect().top <= 80) best = el;
      else break; // sorted, so once positive we're done
    }
    if (best) setActive(best.id);
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  document.addEventListener('langChange', updateActive);
  updateActive();
}

// ── URL Hash Management ──
function initHashNav() {
  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const target = findVisibleEl(id);
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
    clearBtn.style.display = 'none';
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
      const currentLang = document.documentElement.getAttribute('data-lang-init') || 'hu';
      const vis = document.querySelector('[data-lang="' + currentLang + '"] .search-input') ||
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
  const langs = ['hu', 'en', 'ru'];
  document.addEventListener('keydown', e => {
    if (!e.altKey) return;
    const cur = document.documentElement.getAttribute('data-lang-init') || 'hu';
    const idx = langs.indexOf(cur);
    if (e.key === 'ArrowLeft') setLang(langs[(idx + 2) % 3]);
    if (e.key === 'ArrowRight') setLang(langs[(idx + 1) % 3]);
  });
}

// ── Data Table Renderer ──
function renderTable(containerId, headers, rows, lang) {
  const el = findVisibleEl(containerId);
  if (!el) return;
  let html = '<table class="compare-table"><tr>';
  html += headers.map(h => '<th>' + (typeof h === 'string' ? h : (h[lang] || h.en || h.hu || '')) + '</th>').join('');
  html += '</tr>';
  for (const row of rows) {
    let rowStyle = '';
    if (row.bg) rowStyle += 'background:' + row.bg + ';';
    if (row.muted) rowStyle += 'color:#888;';
    if (row.bad) rowStyle += 'color:#a44;';
    html += '<tr' + (rowStyle ? ' style="' + rowStyle + '"' : '') + '>';
    for (const cell of row.cells) {
      const rawText = typeof cell.text === 'string' ? cell.text : (cell.text[lang] || cell.text.en || cell.text.hu || '');
      const text = cell.bold ? '<strong>' + rawText + '</strong>' : rawText;
      html += cell.tier
        ? '<td><span class="tier ' + cell.tier + '">' + text + '</span></td>'
        : '<td>' + text + '</td>';
    }
    html += '</tr>';
  }
  html += '</table>';
  el.innerHTML = html;
}

function initDataTables(lang) {
  const d = window.WikiData;
  if (!d) return;

  // ── Mob Tables ──
  if (d.mobs) {
    const mobHeaders = [
      { hu: 'Szörny', en: 'Mob', ru: 'Моб' },
      { hu: 'HP', en: 'HP', ru: 'HP' },
      { hu: 'Sebzés', en: 'Damage', ru: 'Урон' },
      { hu: 'XP', en: 'XP', ru: 'XP' },
      { hu: 'Speciális', en: 'Special', ru: 'Особое' }
    ];
    function mobRows(list) {
      return list.map(m => ({ cells: [
        { text: m.name },
        { text: String(m.hp) },
        { text: m.dmg },
        { text: String(m.xp) },
        { text: m.special }
      ]}));
    }
    renderTable('mob-table-surface',     mobHeaders, mobRows(d.mobs.surface),     lang);
    renderTable('mob-table-underground', mobHeaders, mobRows(d.mobs.underground), lang);
    renderTable('mob-table-nether',      mobHeaders, mobRows(d.mobs.nether),      lang);
  }

  // ── Sieve Tables ──
  if (d.sieve) {
    const sieveHeaders = [
      { hu: 'Anyag', en: 'Item', ru: 'Материал' },
      { hu: 'Esély', en: 'Chance', ru: 'Шанс' },
      { hu: 'Hasznosság', en: 'Use', ru: 'Применение' }
    ];
    function sieveRows(list) {
      return list.map(s => ({ cells: [
        { text: s.item, tier: s.tier || null },
        { text: s.chance, bold: true },
        { text: s.use }
      ]}));
    }
    renderTable('sieve-table-gravel', sieveHeaders, sieveRows(d.sieve.gravel), lang);
    renderTable('sieve-table-nether', sieveHeaders, sieveRows(d.sieve.nether), lang);
  }

  // ── Material Tables ──
  if (d.materials) {
    // Enchantability
    if (d.materials.enchantability) {
      renderTable('material-enchantability',
        [{ hu: 'Anyag', en: 'Material', ru: 'Материал' }, { hu: 'Bűvölhetőség', en: 'Enchantability', ru: 'Зачаровываемость' }, { hu: 'Megjegyzés', en: 'Note', ru: 'Примечание' }],
        d.materials.enchantability.map(r => ({ bg: r.bg, muted: r.muted, cells: [
          { text: r.materials },
          { text: String(r.value), bold: true },
          { text: r.note }
        ]})),
        lang);
    }
    // Max Quality
    if (d.materials.maxQuality) {
      renderTable('material-max-quality',
        [{ hu: 'Minőség', en: 'Quality', ru: 'Качество' }, { hu: 'Anyagok', en: 'Materials', ru: 'Материалы' }],
        d.materials.maxQuality.map(r => ({ bg: r.bg, muted: r.muted, bad: r.bad, cells: [
          { text: r.quality, bold: true },
          { text: r.materials }
        ]})),
        lang);
    }
    // Durability Multipliers
    if (d.materials.durabilityMult) {
      renderTable('material-durability-mult',
        [{ hu: 'Szorzó', en: 'Multiplier', ru: 'Множитель' }, { hu: 'Anyagok', en: 'Materials', ru: 'Материалы' }],
        d.materials.durabilityMult.map(r => ({ bg: r.bg, muted: r.muted, bad: r.bad, cells: [
          { text: r.mult, bold: true },
          { text: r.materials, tier: r.tier || null }
        ]})),
        lang);
    }
  }
}

// ── Section Anchor Links ──
function initSectionAnchors() {
  document.querySelectorAll('h2[id], h3[id]').forEach(h => {
    if (h.querySelector('.anchor-link')) return;
    const a = document.createElement('a');
    a.className = 'anchor-link';
    a.href = '#' + h.id;
    a.textContent = '🔗';
    a.title = 'Link to section';
    a.addEventListener('click', e => {
      e.preventDefault();
      history.pushState(null, '', '#' + h.id);
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    h.appendChild(a);
  });
}

// ── Item tooltips ──────────────────────────────────────────────
(function() {
  var tip = null;
  var BASE = document.documentElement.dataset.base || '';

  function createTip() {
    var el = document.createElement('div');
    el.id = 'wiki-item-tip';
    el.style.cssText = [
      'position:fixed','z-index:9999','pointer-events:none',
      'background:var(--bg2,#1a1a2e)','border:1px solid var(--surface2,#333)',
      'border-radius:8px','padding:8px 12px','display:none',
      'align-items:center','gap:10px','box-shadow:0 4px 20px rgba(0,0,0,.5)',
      'max-width:260px','font-family:inherit'
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function show(e) {
    var id = this.dataset.id;
    if (!id) return;
    // items adatot a window.MITE_ITEMS-ből olvasuk (ha be van töltve)
    var items = window.MITE_ITEMS || {};
    var item = items[id];
    if (!tip) tip = createTip();
    var lang = localStorage.getItem('mite-wiki-lang') || 'hu';
    var name = item ? (item.name[lang] || item.name.en || id) : id;
    var img = item ? item.img : null;
    var tier = item ? item.tier : null;
    var tierColors = {
      flint:'#aaa',bone:'#e0d0b0',copper:'#cd7f32',silver:'#c0c0c0',
      iron:'#a8a9ad',gold:'#ffd700',bronze:'#cd7f32',
      hardstone:'#8B7355',ancient_metal:'#9b59b6',mithril:'#4fc3f7',
      adamantium:'#f0c040',mercury:'#00e5ff'
    };
    var color = tier ? (tierColors[tier] || '#aaa') : '#aaa';
    tip.style.display = 'flex';
    tip.innerHTML = (img ? '<img src="' + BASE + '/' + img + '" width="28" height="28" style="image-rendering:pixelated;flex-shrink:0">' : '') +
      '<div><div style="font-weight:600;color:var(--text,#eee)">' + name + '</div>' +
      (tier ? '<div style="font-size:.75em;color:' + color + ';margin-top:2px">' + tier + '</div>' : '') +
      '</div>';
    moveTip(e);
  }

  function moveTip(e) {
    if (!tip || tip.style.display === 'none') return;
    var x = e.clientX + 16, y = e.clientY + 16;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 8;
    if (y + h > window.innerHeight - 8) y = e.clientY - h - 8;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  function hide() {
    if (tip) tip.style.display = 'none';
  }

  function init() {
    document.querySelectorAll('.wiki-item[data-id]').forEach(function(el) {
      el.style.cssText += 'cursor:help;border-bottom:1px dotted var(--gold,#f0c040);';
      el.addEventListener('mouseenter', show);
      el.addEventListener('mousemove', moveTip);
      el.addEventListener('mouseleave', hide);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ── Init All ──
document.addEventListener('DOMContentLoaded', () => {
  let saved;
  try { saved = localStorage.getItem('mite-wiki-lang'); } catch(e) {}
  const initLang = saved || 'hu';
  setLang(initLang); // setLang már meghívja initDataTables-t
  initAnchorNav();
  initNavTracking();
  initHashNav();
  initSearch();
  initCollapsibles();
  initBackToTop();
  initKeyboardNav();
  initSectionAnchors();
});

// ── Floating Table of Contents ──
(function() {
  var toc = null;
  var tocList = null;
  var tocObserver = null;
  var tocItems = [];
  var isCollapsed = false;

  var TOC_TITLES = { hu: 'Tartalom', en: 'Contents', ru: 'Содержание' };

  function getCurrentLang() {
    return document.documentElement.getAttribute('data-lang-init') || 'hu';
  }

  // Returns h2 elements that are children of the currently-visible data-lang block.
  // Falls back to all h2[id] if no data-lang structure is found.
  function getVisibleH2s() {
    var lang = getCurrentLang();
    var langBlock = document.querySelector('.content [data-lang="' + lang + '"]');
    if (langBlock) {
      return Array.from(langBlock.querySelectorAll('h2[id]'));
    }
    // Fallback: visible h2s not inside a hidden language block
    return Array.from(document.querySelectorAll('h2[id]')).filter(function(h) {
      var lc = h.closest('[data-lang]');
      if (!lc) return true;
      return lc.getAttribute('data-lang') === lang;
    });
  }

  function buildToc() {
    if (!toc) return;
    // Disconnect previous observer
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    tocItems = [];

    var h2s = getVisibleH2s();
    var lang = getCurrentLang();

    // Update title
    var titleEl = toc.querySelector('.toc-title');
    if (titleEl) titleEl.textContent = TOC_TITLES[lang] || TOC_TITLES.hu;

    // Clear list
    tocList.innerHTML = '';

    if (h2s.length < 4) {
      toc.style.display = 'none';
      return;
    }

    toc.style.display = '';

    h2s.forEach(function(h) {
      // Strip the anchor-link element from heading text
      var text = h.textContent.replace('🔗', '').trim();

      var li = document.createElement('li');
      li.className = 'toc-item';

      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = text;
      a.addEventListener('click', function(e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + h.id);
      });

      li.appendChild(a);
      tocList.appendChild(li);
      tocItems.push({ li: li, h: h });
    });

    // IntersectionObserver to highlight active section
    tocObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var item = tocItems.find(function(i) { return i.h === entry.target; });
        if (!item) return;
        if (entry.isIntersecting) {
          tocItems.forEach(function(i) { i.li.classList.remove('active'); });
          item.li.classList.add('active');
        }
      });
    }, { rootMargin: '-10% 0px -80% 0px' });

    // Fallback scroll-based active tracking (more reliable on long pages)
    function updateActiveByScroll() {
      var best = null;
      for (var i = 0; i < tocItems.length; i++) {
        var rect = tocItems[i].h.getBoundingClientRect();
        if (rect.top <= 100) best = tocItems[i];
        else break;
      }
      if (best) {
        tocItems.forEach(function(item) { item.li.classList.remove('active'); });
        best.li.classList.add('active');
      }
    }

    window.addEventListener('scroll', updateActiveByScroll, { passive: true });
    h2s.forEach(function(h) { tocObserver.observe(h); });
    updateActiveByScroll();
  }

  function createToc() {
    var el = document.createElement('div');
    el.id = 'wiki-toc';

    var header = document.createElement('div');
    header.className = 'toc-header';

    var title = document.createElement('span');
    title.className = 'toc-title';
    title.textContent = TOC_TITLES[getCurrentLang()] || TOC_TITLES.hu;

    var toggle = document.createElement('button');
    toggle.className = 'toc-toggle';
    toggle.title = 'Toggle';
    toggle.setAttribute('aria-label', 'Toggle table of contents');
    toggle.textContent = '▲';
    toggle.addEventListener('click', function() {
      isCollapsed = !isCollapsed;
      el.classList.toggle('collapsed', isCollapsed);
    });

    header.appendChild(title);
    header.appendChild(toggle);

    var list = document.createElement('ul');
    list.className = 'toc-list';

    el.appendChild(header);
    el.appendChild(list);
    document.body.appendChild(el);

    toc = el;
    tocList = list;
  }

  function init() {
    createToc();
    buildToc();

    // Rebuild when language changes (all event names used across app)
    document.addEventListener('langChange', function() { buildToc(); });
    window.addEventListener('mite:langChange', function() { buildToc(); });
    window.addEventListener('mite-lang-change', function() { buildToc(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
