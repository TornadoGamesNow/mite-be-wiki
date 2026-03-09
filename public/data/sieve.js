/* MITE:BE Wiki — Sieve Drop Data */
(function() {
  window.WikiData = window.WikiData || {};
  window.WikiData.sieve = {
    gravel: [
      { item: { hu: "Kova Szilánk", en: "Flint Shard", ru: "Осколок Кремня" }, chance: "53,4%",
        use: { hu: "Korai szerszámok", en: "Early tools", ru: "Ранние инструменты" } },
      { item: { hu: "Réz Ércdarab", en: "Copper Particle", ru: "Медная Частица" }, chance: "25,1%", tier: "t-copper",
        use: { hu: "Első fém — közel 1:4 arány!", en: "First metal — nearly 1-in-4!", ru: "Первый металл — почти 1 из 4!" } },
      { item: { hu: "Kova", en: "Flint", ru: "Кремень" }, chance: "4,4%",
        use: { hu: "Tűzkő és Acél", en: "Flint & Steel", ru: "Кремень и Сталь" } },
      { item: { hu: "Ezüst Ércdarab", en: "Silver Particle", ru: "Серебряная Частица" }, chance: "3,1%", tier: "t-silver",
        use: { hu: "Ezüst szerszámok", en: "Silver tools", ru: "Серебряные инструменты" } },
      { item: { hu: "Arany Ércdarab", en: "Gold Particle", ru: "Золотая Частица" }, chance: "0,63%",
        use: { hu: "Arany szint", en: "Gold tier", ru: "Золотой уровень" } },
      { item: { hu: "Keménykő Ércdarab", en: "Hardstone Particle", ru: "Частица Твёрдого Камня" }, chance: "0,25%", tier: "t-hard",
        use: { hu: "Ritka, mély barlangoknál jobb", en: "Rare, deep caves are better", ru: "Редко, в глубоких пещерах проще" } },
      { item: { hu: "Obszidián Szilánk", en: "Obsidian Shard", ru: "Осколок Обсидиана" }, chance: "0,25%",
        use: { hu: "Öntőformához kell!", en: "Needed for cast molds!", ru: "Нужен для литейных форм!" } },
      { item: { hu: "Smaragd Szilánk", en: "Emerald Shard", ru: "Осколок Изумруда" }, chance: "0,25%",
        use: { hu: "—", en: "—", ru: "—" } },
      { item: { hu: "Gyémánt Szilánk", en: "Diamond Shard", ru: "Осколок Алмаза" }, chance: "0,13%",
        use: { hu: "Ritka!", en: "Rare!", ru: "Редко!" } },
      { item: { hu: "Mithril Ércdarab", en: "Mithril Particle", ru: "Частица Мифрила" }, chance: "0,06%", tier: "t-mithril",
        use: { hu: "Nagyon ritka", en: "Very rare", ru: "Очень редко" } },
      { item: { hu: "Adamantium Ércdarab", en: "Adamantium Particle", ru: "Частица Адаманта" }, chance: "0,01%", tier: "t-adamantium",
        use: { hu: "Rendkívül ritka", en: "Extremely rare", ru: "Крайне редко" } }
    ],
    nether: [
      { item: { hu: "Kova Szilánk", en: "Flint Shard", ru: "Осколок Кремня" }, chance: "57,1%",
        use: { hu: "Korai szerszámok", en: "Early tools", ru: "Ранние инструменты" } },
      { item: { hu: "Arany Ércdarab", en: "Gold Particle", ru: "Золотая Частица" }, chance: "38,1%",
        use: { hu: "<strong>Arany farm!</strong> Sokkal hatékonyabb", en: "<strong>Gold farm!</strong> Far more efficient", ru: "<strong>Золотая ферма!</strong> Намного эффективнее" } },
      { item: { hu: "Kova", en: "Flint", ru: "Кремень" }, chance: "4,2%",
        use: { hu: "Tűzkő és Acél", en: "Flint & Steel", ru: "Кремень и Сталь" } },
      { item: { hu: "Kvarc", en: "Quartz", ru: "Кварц" }, chance: "0,6%",
        use: { hu: "Elektronika", en: "Electronics", ru: "Электроника" } }
    ]
  };
})();
