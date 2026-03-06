/* MITE:BE Wiki — Material Data */
(function() {
  window.WikiData = window.WikiData || {};
  window.WikiData.materials = {
    enchantability: [
      { value: 100, materials: { hu: "Mithril / Gyémánt / Higany", en: "Mithril / Diamond / Mercury" },
        note: { hu: "⭐ Legjobb bűvölési esély!", en: "⭐ Best enchanting odds!" }, bg: "rgba(200,150,255,0.15)" },
      { value: 70, materials: { hu: "Smaragd", en: "Emerald" },
        note: { hu: "Nagyon jó", en: "Very good" }, bg: "rgba(100,255,100,0.10)" },
      { value: 50, materials: { hu: "Arany", en: "Gold" },
        note: { hu: "Jó bűvölési szint", en: "Good enchanting level" }, bg: "rgba(255,220,0,0.10)" },
      { value: 40, materials: { hu: "Adamantium / Ősi Fém / Kvarc", en: "Adamantium / Ancient Metal / Quartz" },
        note: { hu: "Közepes", en: "Moderate" }, bg: null },
      { value: 35, materials: { hu: "Keménykő", en: "Hardstone" },
        note: { hu: "—", en: "—" }, bg: null },
      { value: 30, materials: { hu: "Réz / Vas / Ezüst / Bronz / HC Acél", en: "Copper / Iron / Silver / Bronze / HC Steel" },
        note: { hu: "Standard", en: "Standard" }, bg: null },
      { value: 10, materials: { hu: "Bőr / Fa / Csont", en: "Leather / Wood / Bone" },
        note: { hu: "Gyenge", en: "Weak" }, bg: null, muted: true }
    ],
    maxQuality: [
      { quality: { hu: "🏆 Legendás", en: "🏆 Legendary" },
        materials: { hu: "Mithril, Adamantium", en: "Mithril, Adamantium" }, bg: "rgba(200,150,255,0.15)" },
      { quality: { hu: "⚒️ Mestermű", en: "⚒️ Masterwork" },
        materials: { hu: "Vas, Ősi Fém, Magas Szén Acél", en: "Iron, Ancient Metal, High Carbon Steel" }, bg: "rgba(255,200,100,0.12)" },
      { quality: { hu: "✨ Kitűnő", en: "✨ Excellent" },
        materials: { hu: "Arany, Gyémánt", en: "Gold, Diamond" }, bg: "rgba(255,220,0,0.10)" },
      { quality: { hu: "💎 Kiváló", en: "💎 Superior" },
        materials: { hu: "Réz, Keménykő, Ezüst, Smaragd, Bronz, Ezüst-Réz ötvözet", en: "Copper, Hardstone, Silver, Emerald, Bronze, Silver-Copper alloy" }, bg: "rgba(100,255,100,0.10)" },
      { quality: { hu: "Jó", en: "Good" },
        materials: { hu: "Bőr, Fa, Kova, Obszidián, Kvarc, Csont", en: "Leather, Wood, Flint, Obsidian, Quartz, Bone" }, bg: null },
      { quality: { hu: "Átlagos", en: "Average" },
        materials: { hu: "Pokolfenyő, Üveg", en: "Netherbrick, Glass" }, bg: null, muted: true },
      { quality: { hu: "Rossz", en: "Poor" },
        materials: { hu: "Rozsdás Vas", en: "Rusted Iron" }, bg: null, bad: true }
    ],
    durabilityMult: [
      { mult: "256×", materials: { hu: "Adamantium", en: "Adamantium" }, tier: "adamantium", bg: "rgba(200,150,255,0.20)" },
      { mult: "64×", materials: { hu: "Mithril, Higany", en: "Mithril, Mercury" }, tier: "mithril", bg: "rgba(200,150,255,0.12)" },
      { mult: "16×", materials: { hu: "Ősi Fém, Keménykő, Gyémánt", en: "Ancient Metal, Hardstone, Diamond" }, tier: "ancient", bg: "rgba(100,180,255,0.12)" },
      { mult: "8×", materials: { hu: "Vas, Magas Szén Acél, Smaragd", en: "Iron, High Carbon Steel, Emerald" }, tier: "iron", bg: "rgba(100,150,200,0.10)" },
      { mult: "4×", materials: { hu: "Arany, Ezüst-Réz, Bronz", en: "Gold, Silver-Copper, Bronze" }, tier: "gold", bg: null },
      { mult: "4×", materials: { hu: "Ezüst", en: "Silver" }, tier: "silver", bg: null },
      { mult: "4×", materials: { hu: "Réz, Rozsdás Vas, Ón, Kvarc", en: "Copper, Rusted Iron, Tin, Quartz" }, tier: "copper", bg: null },
      { mult: "2×", materials: { hu: "Obszidián, Üveg", en: "Obsidian, Glass" }, tier: null, bg: null },
      { mult: "1× (alap / base)", materials: { hu: "Bőr, Kova", en: "Leather, Flint" }, tier: "flint", bg: null },
      { mult: "0.5×", materials: { hu: "Fa", en: "Wood" }, tier: null, bg: null, muted: true },
      { mult: "0.15×", materials: { hu: "Csont", en: "Bone" }, tier: null, bg: null, bad: true }
    ]
  };
})();
