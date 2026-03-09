/* MITE:BE Wiki — Sieve Drop Data */
(function() {
  window.WikiData = window.WikiData || {};
  window.WikiData.sieve = {
    gravel: [
      { item: { hu: "Kovaszilánk", en: "Flint Shard" }, chance: "53,4%",
        use: { hu: "Korai szerszámok", en: "Early tools" } },
      { item: { hu: "Réz rög", en: "Copper Particle" }, chance: "25,1%", tier: "t-copper",
        use: { hu: "Első fém — közel 1:4 arány!", en: "First metal — nearly 1-in-4!" } },
      { item: { hu: "Kova", en: "Flint" }, chance: "4,4%",
        use: { hu: "Tűzkő és Acél", en: "Flint & Steel" } },
      { item: { hu: "Ezüst rög", en: "Silver Particle" }, chance: "3,1%", tier: "t-silver",
        use: { hu: "Ezüst szerszámok", en: "Silver tools" } },
      { item: { hu: "Arany rög", en: "Gold Particle" }, chance: "0,63%",
        use: { hu: "Arany szint", en: "Gold tier" } },
      { item: { hu: "Keménykő rög", en: "Hardstone Particle" }, chance: "0,25%", tier: "t-hard",
        use: { hu: "Ritka, mély barlangoknál jobb", en: "Rare, deep caves are better" } },
      { item: { hu: "Obszidiánszilánk", en: "Obsidian Shard" }, chance: "0,25%",
        use: { hu: "Öntőformához kell!", en: "Needed for cast molds!" } },
      { item: { hu: "Smaragdszilánk", en: "Emerald Shard" }, chance: "0,25%",
        use: { hu: "—", en: "—" } },
      { item: { hu: "Gyémántszilánk", en: "Diamond Shard" }, chance: "0,13%",
        use: { hu: "Ritka!", en: "Rare!" } },
      { item: { hu: "Mithril rög", en: "Mithril Particle" }, chance: "0,06%", tier: "t-mithril",
        use: { hu: "Nagyon ritka", en: "Very rare" } },
      { item: { hu: "Adamantium rög", en: "Adamantium Particle" }, chance: "0,01%", tier: "t-adamantium",
        use: { hu: "Rendkívül ritka", en: "Extremely rare" } }
    ],
    nether: [
      { item: { hu: "Kovaszilánk", en: "Flint Shard" }, chance: "57,1%",
        use: { hu: "Korai szerszámok", en: "Early tools" } },
      { item: { hu: "Arany rög", en: "Gold Particle" }, chance: "38,1%",
        use: { hu: "<strong>Arany farm!</strong> Sokkal hatékonyabb", en: "<strong>Gold farm!</strong> Far more efficient" } },
      { item: { hu: "Kova", en: "Flint" }, chance: "4,2%",
        use: { hu: "Tűzkő és Acél", en: "Flint & Steel" } },
      { item: { hu: "Kvarc", en: "Quartz" }, chance: "0,6%",
        use: { hu: "Elektronika", en: "Electronics" } }
    ]
  };
})();
