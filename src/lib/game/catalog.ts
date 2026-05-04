import { mulberry32, pick, randInt } from "./random";
import type { CaseDropTable, Item, LootCase, Rarity } from "./types";

const seed = 0x51f0_2026; // stable catalog seed
const rnd = mulberry32(seed);

const weapons = [
  "AK-47",
  "M4A1-S",
  "M4A4",
  "AWP",
  "Glock-18",
  "USP-S",
  "Desert Eagle",
  "P250",
  "Five-SeveN",
  "MP9",
  "MAC-10",
  "MP7",
  "UMP-45",
  "P90",
  "FAMAS",
  "Galil AR",
  "SSG 08",
  "Nova",
  "XM1014",
];

const finishes = [
  "Redline",
  "Asiimov",
  "Vulcan",
  "Hyper Beast",
  "Neo-Noir",
  "Nightwish",
  "Slate",
  "Printstream",
  "Fade",
  "Doppler",
  "Case Hardened",
  "Bloodsport",
  "Neon Rider",
  "Aquamarine Revenge",
  "Fuel Injector",
  "The Empress",
  "Frontside Misty",
  "Dragon Lore",
  "Electric Hive",
];

const wears = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

const gradients = [
  ["#111827", "#1f2937"],
  ["#0b1220", "#111827"],
  ["#1b2333", "#0d111a"],
  ["#2b1d12", "#111827"],
  ["#161a2a", "#2b1d12"],
  ["#0f1c2e", "#111827"],
];

const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythical"];

function rarityPrice(r: Rarity) {
  switch (r) {
    case "common":
      return randInt(rnd, 20, 90);
    case "uncommon":
      return randInt(rnd, 90, 200);
    case "rare":
      return randInt(rnd, 200, 450);
    case "epic":
      return randInt(rnd, 450, 900);
    case "legendary":
      return randInt(rnd, 900, 1600);
    case "mythical":
      return randInt(rnd, 1600, 3200);
  }
}

function makeItem(i: number): Item {
  const rarity = pick(rnd, rarities);
  const [from, to] = pick(rnd, gradients);
  const weapon = pick(rnd, weapons);
  const finish = pick(rnd, finishes);
  const wear = pick(rnd, wears);
  const isSt = randInt(rnd, 0, 9) === 0;
  return {
    id: `itm_${i.toString(36)}`,
    name: `${isSt ? "StatTrak™ " : ""}${weapon} | ${finish} (${wear})`,
    price: rarityPrice(rarity),
    rarity,
    image: { kind: "gradient", from, to },
  };
}

function makeCase(i: number): LootCase {
  const names = [
    "Ember Vault",
    "Neon Reactor",
    "Abyss Cache",
    "Pulse Circuit",
    "Obsidian Crown",
    "Mythic Forge",
    "Spectral Rift",
    "Void Prism",
    "Aurora Core",
    "Cipher Reliquary",
    "Arcadium Crate",
    "Nightfall Capsule",
  ];
  const prices = [120, 220, 350, 500, 650, 800, 950, 1200, 1500, 2000, 2600, 3200];
  const [from, to] = pick(rnd, gradients);
  return {
    id: `case_${i.toString(36)}`,
    name: names[i % names.length],
    price: prices[i % prices.length],
    image: { kind: "gradient", from, to },
    itemIds: [],
  };
}

export const catalog = (() => {
  const items: Item[] = Array.from({ length: 56 }, (_, i) => makeItem(i + 1)).sort((a, b) => a.price - b.price);
  const cases: LootCase[] = Array.from({ length: 10 }, (_, i) => makeCase(i + 1));

  // assign per-case item lists (18 each, overlap allowed)
  for (const c of cases) {
    const candidates = items.slice(0, 42);
    const chosen = new Set<string>();
    while (chosen.size < 18) chosen.add(pick(rnd, candidates).id);
    c.itemIds = Array.from(chosen);
  }

  const dropTables: CaseDropTable[] = cases.map((c) => {
    const entries = c.itemIds.map((itemId) => {
      const item = items.find((x) => x.id === itemId)!;
      // Weighted random: cheaper => higher weight, expensive => lower weight
      // (Simple inverse relationship; tuned for "expensive = rarer".)
      const weight = Math.max(1, Math.round(6000 / Math.max(50, item.price)));
      return { itemId, weight };
    });
    return { caseId: c.id, entries };
  });

  return { items, cases, dropTables };
})();

export function getCase(caseId: string) {
  return catalog.cases.find((c) => c.id === caseId) ?? null;
}

export function getItem(itemId: string) {
  return catalog.items.find((i) => i.id === itemId) ?? null;
}

export function getDropTable(caseId: string) {
  return catalog.dropTables.find((t) => t.caseId === caseId) ?? null;
}
