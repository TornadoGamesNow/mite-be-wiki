/** scrape-drops.js
 *  Scrapes mob drop data from mcmod.cn and updates data/mobs.json
 *  Usage: node scripts/scrape-drops.js
 */
const https = require("https");
const fs = require("fs");
const path = require("path");
let cheerio;
try { cheerio = require("cheerio"); }
catch (e) { console.error("install: npm install cheerio"); process.exit(1); }
const MOBS_JSON = path.resolve(__dirname, "../data/mobs.json");
const mobMcmodMap = {
  ghoul: 773418, white_ghoul: null, black_ghoul: 773419, shadow: null,
  revenant: 773421, wight: 773420, wight_guard: 799319,
  wood_spider: 773427, demon_spider: 773426, black_widow_spider: 773425, phase_spider: 773428,
  hell_hound: 773472, dire_wolf: 773473,
  vampire_bat: 773469, shadow_bat: 773470, giant_vampire_bat: 773471,
  fire_elemental: 773430, earth_elemental: 773431,
  soul_spirit: 772810, red_blaze: 772811, invisible_stalker: 773417,
  greater_ghast: 772807, child_ghast: 772807, variant_child_ghast: 772808,
  explosive_silverfish: 773437, copper_poison_silverfish: 773438, ancient_silverfish: 773663,
  skeleton_lord: 773423, ancient_skeleton_lord: 773424, variant_skeleton_lord: 799445,
  variant_zombie: 764750, variant_skeleton: 764751, variant_spider: 773664,
  variant_creeper: 771964, tnt_skeleton: 771963, confused_creeper: 771968,
  bomber: 773666, desert_guardian: 772813, child_skeleton: 772809, him: 772812,
  pillager: 777343, scorpion: 808648, rat: 804408, bee: 808649, medium_fish: 808644,
};
const _names = [
  ["腐肉", "Rothadó hús", "Rotten Flesh"],
  ["骨头", "Csont", "Bone"],
  ["筕", "Nyíl", "Arrow"],
  ["火药", "Puskapor", "Gunpowder"],
  ["蜘蛛眼", "Pókszemgolyó", "Spider Eye"],
  ["丝线", "Cérna", "String"],
  ["经验瓶", "Tapasztalati üveg", "Bottle o Enchanting"],
  ["煤炭", "Szén", "Coal"],
  ["铁锍", "Vas rúd", "Iron Ingot"],
  ["金锍", "Arany rúd", "Gold Ingot"],
  ["铜锍", "Réz rúd", "Copper Ingot"],
  ["銀锍", "Ezüst rúd", "Silver Ingot"],
  ["皮革", "Bőr", "Leather"],
  ["羽毛", "Toll", "Feather"],
  ["生牛肉", "Nyers marha", "Raw Beef"],
  ["牛肉", "Nyers marha", "Raw Beef"],
  ["生猪肉", "Nyers sertés", "Raw Porkchop"],
  ["猪肉", "Nyers sertés", "Raw Porkchop"],
  ["生鸡肉", "Nyers csirke", "Raw Chicken"],
  ["鸡肉", "Nyers csirke", "Raw Chicken"],
  ["生羊肉", "Nyers bárány", "Raw Mutton"],
  ["羊肉", "Nyers bárány", "Raw Mutton"],
  ["羊毛", "Gyapjú", "Wool"],
  ["蘑荇", "Gomba", "Mushroom"],
  ["末影珍珠", "Ender gyöngy", "Ender Pearl"],
  ["火焰棒", "Blaze rúd", "Blaze Rod"],
  ["地狱之星", "Nether csillag", "Nether Star"],
  ["龙蛋", "Sárkánytojás", "Dragon Egg"],
  ["吸血蝙蝠牙", "Vérszívó denevér foga", "Vampire Bat Fang"],
  ["蝙子毒液", "Skorpió méreg", "Scorpion Venom"],
  ["大象象牙", "Elefánt agyar", "Elephant Tusk"],
  ["鼠肉", "Nyers patkány", "Raw Rat"],
  ["老鼠肉", "Nyers patkány", "Raw Rat"],
  ["蜂蜗", "Méz", "Honeycomb"],
  ["蜂巢", "Lép", "Honeycomb"],
  ["骷髅领主之心", "Csontváz úr szíve", "Skeleton Lord Heart"],
  ["灵魂之石", "Lélekköves", "Soul Stone"],
  ["相位蜘蛛眼", "Fázis pókszemgolyó", "Phase Spider Eye"],
  ["黑寡妇蜘蛛眼", "Fekete özvegy szem", "Black Widow Eye"],
  ["地狱犬皮", "Pokoli kutya bőre", "Hellhound Hide"],
  ["惧狼皮", "Rettenetes farkas bőr", "Dire Wolf Pelt"],
  ["木蜘蛛眼", "Fa pókszemgolyó", "Wood Spider Eye"],
  ["食尸鬼肉", "Ghoul hús", "Ghoul Flesh"],
  ["骷髅臂骨", "Csontvázkar csont", "Skeleton Arm Bone"],
  ["地狱蜘蛛眼", "Démon pókszemgolyó", "Hell Spider Eye"],
  ["火元素核", "Tűzelemental mag", "Fire Elemental Core"],
  ["土元素核", "Földelemental mag", "Earth Elemental Core"],
  ["潜影贝壳", "Rejtőző kagyló", "Shulker Shell"],
  ["燧石", "Kova", "Flint"],
  ["发光石粉", "Fénykő por", "Glowstone Dust"],
  ["地狱疣", "Pokoli szemölcs", "Nether Wart"],
  ["掠夺者旗帜", "Fosztogató zászló", "Pillager Banner"],
  ["掠夺者徽章", "Baljós zászló", "Ominous Banner"],
  ["不祥之兆", "Baljós előjel", "Bad Omen"],
  ["陶瓷碎片", "Kerámia töredék", "Pottery Shard"],
  ["铁剑", "Vas kard", "Iron Sword"],
  ["铁盔甲", "Vas páncél", "Iron Armor"],
  ["鱼", "Hal", "Raw Fish"],
  ["生鱼", "Nyers hal", "Raw Fish"],
  ["三文鱼", "Lazac", "Raw Salmon"],
  ["熟鱼", "Sütött hal", "Cooked Fish"],
  ["木棒", "Pálca", "Stick"],
  ["火把", "Fáklya", "Torch"],
  ["铁镐", "Vas csákány", "Iron Pickaxe"],
  ["铁锄", "Vas lapát", "Iron Shovel"],
  ["铁斧", "Vas fejsze", "Iron Axe"],
  ["铁头盔", "Vas sisak", "Iron Helmet"],
  ["铁胸甲", "Vas mellvért", "Iron Chestplate"],
  ["铁护腿", "Vas lábszárvédő", "Iron Leggings"],
  ["铁靴子", "Vas csizma", "Iron Boots"],
];
const nameMap = {};
for (const [zh, hu, en] of _names) nameMap[zh] = { hu, en };
const lootKw = ["战利品", "掉落物", "掉落", "loot", "drop"];
const knownItems = ["腐肉", "骨头", "丝线", "蜘蛛眼", "火药", "皮革", "鼠肉", "掉落", "战利品", "地狱犬皮", "惧狼皮", "食尸鬼肉"];
const hdrRe = /^(名称|物品|道具|数量|概率|item|name|chance)/i;
function parseChance(text) {
  if (!text) return "uncommon";
  const t = text.trim();
  if (/100%|总是|必定|必掉|always/i.test(t)) return "always";
  if (/抢夺|掠夺|looting/i.test(t)) return "looting";
  const pct = t.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) {
    const v = parseFloat(pct[1]);
    if (v >= 80) return "common";
    if (v >= 40) return "uncommon";
    return "rare";
  }
  if (/常见|高概率|高|common/i.test(t)) return "common";
  if (/普通|中等|normal/i.test(t)) return "uncommon";
  if (/稀有|低概率|低|rare/i.test(t)) return "rare";
  return "uncommon";
}
function translateName(zh) {
  if (nameMap[zh]) return nameMap[zh];
  let best = null, bestLen = 0;
  for (const [key, val] of Object.entries(nameMap)) {
    if (zh.includes(key) && key.length > bestLen) { best = val; bestLen = key.length; }
  }
  return best || { hu: zh, en: zh };
}
function httpGet(url, redirects) {
  if (redirects === undefined) redirects = 5;
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
        "Accept": "text/html,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        "Referer": "https://www.mcmod.cn/",
        "Cookie": "mcmod_lang=zh_cn",
      }
    }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirects > 0) {
        req.destroy();
        return httpGet(res.headers.location, redirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { req.destroy(); return reject(new Error("HTTP " + res.statusCode + " " + url)); }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout " + url)); });
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function parseDropsFromHtml(html) {
  const $ = cheerio.load(html);
  const drops = [];
  const seen = new Set();
  function addRow(itemText, qtyText, chanceText) {
    if (!itemText || hdrRe.test(itemText)) return;
    const name = translateName(itemText);
    if (!seen.has(name.en)) {
      seen.add(name.en);
      const qty = (qtyText || "1").replace(/[^\d\-~～]/g, "") || "1";
      drops.push({ item: name, qty, chance: parseChance(chanceText) });
    }
  }
  let lootSection = null;
  $("h1,h2,h3,h4,h5,h6,b,strong,p").each((i, el) => {
    const txt = $(el).text().trim();
    if (txt.length < 30 && lootKw.some(k => txt.includes(k))) { lootSection = el; return false; }
  });
  if (lootSection) {
    let node = $(lootSection).next();
    for (let a = 0; a < 12 && node.length; a++, node = node.next()) {
      const tag = (node.prop("tagName") || "").toUpperCase();
      const tbl = tag === "TABLE" ? node : node.find("table").first();
      if (tbl.length) {
        tbl.find("tr").each((ri, row) => {
          const c = $(row).find("td,th");
          if (!c.length) return;
          addRow($(c[0]).text().trim(), c.length >= 3 ? $(c[1]).text().trim() : "1", c.length >= 2 ? $(c[c.length-1]).text().trim() : "");
        });
        if (drops.length) return drops;
      }
      if (tag === "UL" || tag === "OL") {
        node.find("li").each((i, el) => {
          const p = $(el).text().trim().split(/\s+/);
          addRow(p[0], "1", p[p.length-1]);
        });
        if (drops.length) return drops;
      }
    }
  }
  if (!drops.length) {
    $("table").each((ti, tbl) => {
      const txt = $(tbl).text();
      if (!knownItems.some(k => txt.includes(k))) return;
      $(tbl).find("tr").each((ri, row) => {
        const c = $(row).find("td,th");
        if (!c.length) return;
        addRow($(c[0]).text().trim(), c.length >= 3 ? $(c[1]).text().trim() : "1", c.length >= 2 ? $(c[c.length-1]).text().trim() : "");
      });
    });
  }
  if (!drops.length) {
    const bodyText = $("body").text();
    for (const [zh, tr] of Object.entries(nameMap)) {
      if (bodyText.includes(zh) && !seen.has(tr.en)) {
        seen.add(tr.en);
        drops.push({ item: tr, qty: "1", chance: "uncommon" });
      }
    }
  }
  return drops;
}
async function main() {
  const mobsData = JSON.parse(fs.readFileSync(MOBS_JSON, "utf8"));
  const needsDrops = new Set(mobsData.filter(m => !m.drops || !m.drops.length).map(m => m.id));
  console.log("\nMobs needing drops: " + needsDrops.size);
  const mcmodIdToMobs = {};
  for (const [id, mcmodId] of Object.entries(mobMcmodMap)) {
    if (!mcmodId || !needsDrops.has(id)) continue;
    if (!mcmodIdToMobs[mcmodId]) mcmodIdToMobs[mcmodId] = [];
    mcmodIdToMobs[mcmodId].push(id);
  }
  const mcmodIds = Object.keys(mcmodIdToMobs);
  console.log("Unique mcmod pages to fetch: " + mcmodIds.length + "\n");
  const results = {};
  for (let i = 0; i < mcmodIds.length; i++) {
    const mcmodId = mcmodIds[i];
    const mobIds = mcmodIdToMobs[mcmodId];
    const url = "https://www.mcmod.cn/item/" + mcmodId + ".html";
    process.stdout.write("[" + (i+1) + "/" + mcmodIds.length + "] " + url + " (" + mobIds.join(", ") + ") ... ");
    let drops = [];
    try {
      const html = await httpGet(url);
      drops = parseDropsFromHtml(html);
      console.log("Found " + drops.length + " drop(s)");
    } catch (err) {
      console.log("ERROR: " + err.message);
    }
    if (drops.length) console.log("  -> " + drops.map(d => d.item.en + " x" + d.qty + " [" + d.chance + "]").join(", "));
    else console.log("  (no drops found on page)");
    for (const id of mobIds) results[id] = drops;
    if (i < mcmodIds.length - 1) await sleep(1200);
  }
  console.log("\n=== JSON RESULTS ===");
  for (const [id, drops] of Object.entries(results)) {
    console.log(JSON.stringify({ mob_id: id, drops }));
  }
  let updated = 0;
  for (const mob of mobsData) {
    if ((!mob.drops || !mob.drops.length) && results[mob.id] && results[mob.id].length) {
      mob.drops = results[mob.id];
      updated++;
    }
  }
  fs.writeFileSync(MOBS_JSON, JSON.stringify(mobsData, null, 2), "utf8");
  console.log("\nUpdated " + updated + " mob(s) in mobs.json");
  const stillEmpty = mobsData.filter(m => !m.drops || !m.drops.length).map(m => m.id);
  if (stillEmpty.length) console.log("Still no drops (" + stillEmpty.length + "): " + stillEmpty.join(", "));
  else console.log("All mobs now have drop data!");
}
main().catch(err => { console.error(err); process.exit(1); });
