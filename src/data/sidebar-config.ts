const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface SidebarLink {
  href: string;
  label: string;
}

export interface SidebarSection {
  title: string;
  links: SidebarLink[];
  isOpen?: boolean;
}

export interface SidebarGroups {
  hu: SidebarSection[];
  en: SidebarSection[];
  ru: SidebarSection[];
}

type Category = 'start-here' | 'progression' | 'systems' | 'reference' | 'updates' | 'none' | 'enchanting';

function pageToCategory(currentPage: string): Category {
  if (['install', 'introduction', 'quick-start', 'game-modes', 'faq'].includes(currentPage)) return 'start-here';
  if (currentPage === 'progression' || currentPage.startsWith('progression/')) return 'progression';
  if (currentPage === 'systems' || currentPage.startsWith('systems/')) return 'systems';
  if (['recipes', 'items', 'mobs', 'biomes', 'brewing', 'enchanting', 'reference'].includes(currentPage)) return 'reference';
  if (currentPage === 'changelog') return 'updates';
  return 'none';
}

export function getSidebarGroups(currentPage: string): SidebarGroups {
  const cat = pageToCategory(currentPage);

  // homepage: csak start-here nyitva (nyugodtabb)
  // belső oldal: aktív szekció + start-here (kontextus + navigáció)
  const o = (c: Category) =>
    cat === c ||
    (cat === 'none' && c === 'start-here') ||
    (cat !== 'none' && cat !== 'start-here' && c === 'start-here');

  return {
    hu: [
      {
        title: '🚀 Kezdőlap',
        isOpen: o('start-here'),
        links: [
          { href: `${base}/install/`, label: 'Telepítési útmutató' },
          { href: `${base}/introduction/`, label: 'Bevezetés' },
          { href: `${base}/quick-start/`, label: 'Gyors kezdés' },
          { href: `${base}/game-modes/`, label: 'Játékmódok' },
          { href: `${base}/faq/`, label: 'GYIK (FAQ)' },
        ],
      },
      {
        title: '📈 Haladás',
        isOpen: o('progression'),
        links: [
          { href: `${base}/progression/`, label: 'Áttekintés' },
          { href: `${base}/progression/early-game/`, label: '🪨 Korai játék' },
          { href: `${base}/progression/furnaces/`, label: '🔥 Kemencék' },
          { href: `${base}/progression/metal-ages/`, label: '⚙ Fémkorszakok' },
          { href: `${base}/progression/underground/`, label: '⛏ Föld alatt' },
          { href: `${base}/progression/late-game/`, label: '🌟 Késő játék' },
          { href: `${base}/progression/nether/`, label: '🌋 Nether' },
          { href: `${base}/progression/endgame/`, label: '👑 Endgame' },
        ],
      },
      {
        title: '⚙ Rendszerek',
        isOpen: o('systems'),
        links: [
          { href: `${base}/systems/`, label: 'Áttekintés' },
          { href: `${base}/systems/nutrition/`, label: '🍖 Táplálkozás' },
          { href: `${base}/systems/combat/`, label: '⚔ Harc' },
          { href: `${base}/systems/survival/`, label: '🎒 Túlélés' },
          { href: `${base}/systems/skills/`, label: '📜 Képességek' },
        ],
      },
      {
        title: '📚 Referencia',
        isOpen: o('reference'),
        links: [
          { href: `${base}/recipes/`, label: 'Receptek' },
          { href: `${base}/items/`, label: 'Itemek' },
          { href: `${base}/mobs/`, label: 'Bestiary' },
          { href: `${base}/biomes/`, label: 'Biome-ok' },
          { href: `${base}/brewing/`, label: 'Főzés' },
          { href: `${base}/enchanting/`, label: 'Bűvölés' },
          { href: `${base}/reference/`, label: 'Referencia táblák' },
        ],
      },
      {
        title: '📋 Frissítések',
        isOpen: o('updates'),
        links: [
          { href: `${base}/changelog/`, label: 'Changelog' },
        ],
      },
    ],
    en: [
      {
        title: '🚀 Start Here',
        isOpen: o('start-here'),
        links: [
          { href: `${base}/install/`, label: 'Installation guide' },
          { href: `${base}/introduction/`, label: 'Introduction' },
          { href: `${base}/quick-start/`, label: 'Quick Start' },
          { href: `${base}/game-modes/`, label: 'Game Modes' },
          { href: `${base}/faq/`, label: 'FAQ' },
        ],
      },
      {
        title: '📈 Progression',
        isOpen: o('progression'),
        links: [
          { href: `${base}/progression/`, label: 'Overview' },
          { href: `${base}/progression/early-game/`, label: '🪨 Early Game' },
          { href: `${base}/progression/furnaces/`, label: '🔥 Furnaces' },
          { href: `${base}/progression/metal-ages/`, label: '⚙ Metal Ages' },
          { href: `${base}/progression/underground/`, label: '⛏ Underground' },
          { href: `${base}/progression/late-game/`, label: '🌟 Late Game' },
          { href: `${base}/progression/nether/`, label: '🌋 Nether' },
          { href: `${base}/progression/endgame/`, label: '👑 Endgame' },
        ],
      },
      {
        title: '⚙ Systems',
        isOpen: o('systems'),
        links: [
          { href: `${base}/systems/`, label: 'Overview' },
          { href: `${base}/systems/nutrition/`, label: '🍖 Nutrition' },
          { href: `${base}/systems/combat/`, label: '⚔ Combat' },
          { href: `${base}/systems/survival/`, label: '🎒 Survival' },
          { href: `${base}/systems/skills/`, label: '📜 Skills' },
        ],
      },
      {
        title: '📚 Reference',
        isOpen: o('reference'),
        links: [
          { href: `${base}/recipes/`, label: 'Recipes' },
          { href: `${base}/items/`, label: 'Items' },
          { href: `${base}/mobs/`, label: 'Bestiary' },
          { href: `${base}/biomes/`, label: 'Biomes' },
          { href: `${base}/brewing/`, label: 'Brewing' },
          { href: `${base}/enchanting/`, label: 'Enchanting' },
          { href: `${base}/reference/`, label: 'Reference tables' },
        ],
      },
      {
        title: '📋 Updates',
        isOpen: o('updates'),
        links: [
          { href: `${base}/changelog/`, label: 'Changelog' },
        ],
      },
    ],
    ru: [
      {
        title: '🚀 Начало',
        isOpen: o('start-here'),
        links: [
          { href: `${base}/install/`, label: 'Установка' },
          { href: `${base}/introduction/`, label: 'Введение' },
          { href: `${base}/quick-start/`, label: 'Быстрый старт' },
          { href: `${base}/game-modes/`, label: 'Режимы игры' },
          { href: `${base}/faq/`, label: 'FAQ' },
        ],
      },
      {
        title: '📈 Прогресс',
        isOpen: o('progression'),
        links: [
          { href: `${base}/progression/`, label: 'Обзор' },
          { href: `${base}/progression/early-game/`, label: '🪨 Начало игры' },
          { href: `${base}/progression/furnaces/`, label: '🔥 Печи' },
          { href: `${base}/progression/metal-ages/`, label: '⚙ Металлические эпохи' },
          { href: `${base}/progression/underground/`, label: '⛏ Под землёй' },
          { href: `${base}/progression/late-game/`, label: '🌟 Поздняя игра' },
          { href: `${base}/progression/nether/`, label: '🌋 Незер' },
          { href: `${base}/progression/endgame/`, label: '👑 Конец игры' },
        ],
      },
      {
        title: '⚙ Системы',
        isOpen: o('systems'),
        links: [
          { href: `${base}/systems/`, label: 'Обзор' },
          { href: `${base}/systems/nutrition/`, label: '🍖 Питание' },
          { href: `${base}/systems/combat/`, label: '⚔ Бой' },
          { href: `${base}/systems/survival/`, label: '🎒 Выживание' },
          { href: `${base}/systems/skills/`, label: '📜 Навыки' },
        ],
      },
      {
        title: '📚 Справочник',
        isOpen: o('reference'),
        links: [
          { href: `${base}/recipes/`, label: 'Рецепты' },
          { href: `${base}/items/`, label: 'Предметы' },
          { href: `${base}/mobs/`, label: 'Бестиарий' },
          { href: `${base}/biomes/`, label: 'Биомы' },
          { href: `${base}/brewing/`, label: 'Зельеварение' },
          { href: `${base}/enchanting/`, label: 'Зачарование' },
          { href: `${base}/reference/`, label: 'Справочные таблицы' },
        ],
      },
      {
        title: '📋 Обновления',
        isOpen: o('updates'),
        links: [
          { href: `${base}/changelog/`, label: 'Журнал изменений' },
        ],
      },
    ],
  };
}
