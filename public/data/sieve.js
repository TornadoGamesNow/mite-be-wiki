/* MITE:BE Wiki — Sieve Drop Data */
(function() {
  window.WikiData = window.WikiData || {};
  window.WikiData.sieve = {
    gravel: [
      { item: { hu: "Kova Szilánk", en: "Flint Shard" }, chance: "53,4%",
        use: { hu: "Korai szerszámok", en: "Early tools" } },
      { item: { hu: "Réz Ércdarab", en: "Copper Particle" }, chance: "25,1%", tier: "t-copper",
        use: { hu: "Első fém — közel 1:4 arány!", en: "First metal — nearly 1-in-4!" } },
      { item: { hu: "Kova", en: "Flint" }, chance: "4,4%",
        use: { hu: "Tűzkő és Acél", en: "Flint & Steel" } },
      { item: { hu: "Ezüst Ércdarab", en: "Silver Particle" }, chance: "3,1%", tier: "t-silver",
        use: { hu: "Ezüst szerszámok", en: "Silver tools" } },
      { item: { hu: "Arany Ércdarab", en: "Gold Particle" }, chance: "0,63%",
        use: { hu: "Arany szint", en: "Gold tier" } },
      { item: { hu: "Keménykő Ércdarab", en: "Hardstone Particle" }, chance: "0,25%", tier: "t-hard",
        use: { hu: "Ritka, mély barlangoknál jobb", en: "Rare, deep caves are better" } },
      { item: { hu: "Obszidián Szilánk", en: "Obsidian Shard" }, chance: "0,25%",
        use: { hu: "Öntőformához kell!", en: "Needed for cast molds!" } },
      { item: { hu: "Smaragd Szilánk", en: "Emerald Shard" }, chance: "0,25%",
        use: { hu: "—", en: "—" } },
      { item: { hu: "Gyémánt Szilánk", en: "Diamond Shard" }, chance: "0,13%",
        use: { hu: "Ritka!", en: "Rare!" } },
      { item: { hu: "Mithril Ércdarab", en: "Mithril Particle" }, chance: "0,06%", tier: "t-mithril",
        use: { hu: "Nagyon ritka", en: "Very rare" } },
      { item: { hu: "Adamantium Ércdarab", en: "Adamantium Particle" }, chance: "0,01%", tier: "t-adamantium",
        use: { hu: "Rendkívül ritka", en: "Extremely rare" } }
    ],
    nether: [
      { item: { hu: "Kova Szilánk", en: "Flint Shard" }, chance: "57,1%",
        use: { hu: "Korai szerszámok", en: "Early tools" } },
      { item: { hu: "Arany Ércdarab", en: "Gold Particle" }, chance: "38,1%",
        use: { hu: "<strong>Arany farm!</strong> Sokkal hatékonyabb", en: "<strong>Gold farm!</strong> Far more efficient" } },
      { item: { hu: "Kova", en: "Flint" }, chance: "4,2%",
        use: { hu: "Tűzkő és Acél", en: "Flint & Steel" } },
      { item: { hu: "Kvarc", en: "Quartz" }, chance: "0,6%",
        use: { hu: "Elektronika", en: "Electronics" } }
    ]
  };
})();
