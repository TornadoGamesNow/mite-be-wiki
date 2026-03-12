/* MITE:BE Wiki — Material Data */
(function() {
  window.WikiData = window.WikiData || {};
  window.WikiData.materials = {
    enchantability: [
      { value: 100, materials: { hu: "Mithril / Gyémánt / Higany", en: "Mithril / Diamond / Mercury", ru: "Мифрил / Алмаз / Ртуть" },
        note: { hu: "⭐ Legjobb bűvölési esély!", en: "⭐ Best enchanting odds!", ru: "⭐ Лучший шанс зачарования!" }, bg: "rgba(200,150,255,0.15)" },
      { value: 70, materials: { hu: "Smaragd", en: "Emerald", ru: "Изумруд" },
        note: { hu: "Nagyon jó", en: "Very good", ru: "Очень хорошо" }, bg: "rgba(100,255,100,0.10)" },
      { value: 50, materials: { hu: "Arany", en: "Gold", ru: "Золото" },
        note: { hu: "Jó bűvölési szint", en: "Good enchanting level", ru: "Хороший уровень зачарования" }, bg: "rgba(255,220,0,0.10)" },
      { value: 40, materials: { hu: "Adamantium / Ősi Fém / Kvarc", en: "Adamantium / Ancient Metal / Quartz", ru: "Адамант / Древний Металл / Кварц" },
        note: { hu: "Közepes", en: "Moderate", ru: "Среднее" }, bg: null },
      { value: 35, materials: { hu: "Keménykő", en: "Hardstone", ru: "Твёрдый Камень" },
        note: { hu: "—", en: "—", ru: "—" }, bg: null },
      { value: 30, materials: { hu: "Réz / Vas / Ezüst / Bronz / HC Acél", en: "Copper / Iron / Silver / Bronze / HC Steel", ru: "Медь / Железо / Серебро / Бронза / ВУС" },
        note: { hu: "Standard", en: "Standard", ru: "Стандарт" }, bg: null },
      { value: 10, materials: { hu: "Bőr / Fa / Csont", en: "Leather / Wood / Bone", ru: "Кожа / Дерево / Кость" },
        note: { hu: "Gyenge", en: "Weak", ru: "Слабое" }, bg: null, muted: true }
    ],
    maxQuality: [
      { quality: { hu: "🏆 Legendás", en: "🏆 Legendary", ru: "🏆 Легендарное" },
        materials: { hu: "Mithril, Adamantium", en: "Mithril, Adamantium", ru: "Мифрил, Адамант" }, bg: "rgba(200,150,255,0.15)" },
      { quality: { hu: "⚒️ Mestermű", en: "⚒️ Masterwork", ru: "⚒️ Шедевр" },
        materials: { hu: "Vas, Ősi Fém, Magas Szén Acél", en: "Iron, Ancient Metal, High Carbon Steel", ru: "Железо, Древний Металл, Высокоуглеродистая Сталь" }, bg: "rgba(255,200,100,0.12)" },
      { quality: { hu: "✨ Kitűnő", en: "✨ Superb", ru: "✨ Превосходное" },
        materials: { hu: "Arany, Gyémánt", en: "Gold, Diamond", ru: "Золото, Алмаз" }, bg: "rgba(255,220,0,0.10)" },
      { quality: { hu: "💎 Kiváló", en: "💎 Excellent", ru: "💎 Отличное" },
        materials: { hu: "Réz, Keménykő, Ón, Ezüst, Smaragd, Bronz, Ezüst-Réz ötvözet", en: "Copper, Hardstone, Tin, Silver, Emerald, Bronze, Silver Copper alloy", ru: "Медь, Твёрдый Камень, Олово, Серебро, Изумруд, Бронза, Серебряно-медный сплав" }, bg: "rgba(100,255,100,0.10)" },
      { quality: { hu: "Jó", en: "Fine", ru: "Хорошее" },
        materials: { hu: "Bőr, Fa, Kova, Obszidián, Kvarc, Csont", en: "Leather, Wood, Flint, Obsidian, Quartz, Bone", ru: "Кожа, Дерево, Кремень, Обсидиан, Кварц, Кость" }, bg: null },
      { quality: { hu: "Átlagos", en: "Average", ru: "Среднее" },
        materials: { hu: "Alvilágkő, Üveg", en: "Netherrack, Glass", ru: "Адский камень, Стекло" }, bg: null, muted: true },
      { quality: { hu: "Rossz", en: "Poor", ru: "Плохое" },
        materials: { hu: "Rozsdás Vas", en: "Rusted Iron", ru: "Ржавое Железо" }, bg: null, bad: true }
    ],
    durabilityMult: [
      { mult: "256×", materials: { hu: "Adamantium", en: "Adamantium", ru: "Адамант" }, tier: "adamantium", bg: "rgba(200,150,255,0.20)" },
      { mult: "64×", materials: { hu: "Mithril, Higany", en: "Mithril, Mercury", ru: "Мифрил, Ртуть" }, tier: "mithril", bg: "rgba(200,150,255,0.12)" },
      { mult: "16×", materials: { hu: "Ősi Fém, Keménykő, Gyémánt", en: "Ancient Metal, Hardstone, Diamond", ru: "Древний Металл, Твёрдый Камень, Алмаз" }, tier: "ancient", bg: "rgba(100,180,255,0.12)" },
      { mult: "8×", materials: { hu: "Vas, Magas Szén Acél, Smaragd", en: "Iron, High Carbon Steel, Emerald", ru: "Железо, Высокоуглеродистая Сталь, Изумруд" }, tier: "iron", bg: "rgba(100,150,200,0.10)" },
      { mult: "4×", materials: { hu: "Arany, Ezüst-Réz, Bronz", en: "Gold, Silver Copper, Bronze", ru: "Золото, Серебряно-медный сплав, Бронза" }, tier: "gold", bg: null },
      { mult: "4×", materials: { hu: "Ezüst", en: "Silver", ru: "Серебро" }, tier: "silver", bg: null },
      { mult: "4×", materials: { hu: "Réz, Rozsdás Vas, Ón, Kvarc", en: "Copper, Rusted Iron, Tin, Quartz", ru: "Медь, Ржавое Железо, Олово, Кварц" }, tier: "copper", bg: null },
      { mult: "2×", materials: { hu: "Obszidián, Üveg", en: "Obsidian, Glass", ru: "Обсидиан, Стекло" }, tier: null, bg: null },
      { mult: "1× (alap / base)", materials: { hu: "Bőr, Kova", en: "Leather, Flint", ru: "Кожа, Кремень" }, tier: "flint", bg: null },
      { mult: "0.5×", materials: { hu: "Fa", en: "Wood", ru: "Дерево" }, tier: null, bg: null, muted: true },
      { mult: "0.15×", materials: { hu: "Csont", en: "Bone", ru: "Кость" }, tier: null, bg: null, bad: true }
    ]
  };
})();
