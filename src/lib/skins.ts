import type { Skin } from "@/lib/types";
import { RARITY_COLOR } from "@/lib/rarity";

const img = (text: string) => {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="1" stop-color="#0b1020"/>
        </linearGradient>
        <filter id="b" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="160" cy="120" r="80" fill="#8b5cf6" opacity="0.35" filter="url(#b)"/>
      <circle cx="520" cy="260" r="90" fill="#22c55e" opacity="0.20" filter="url(#b)"/>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="ui-sans-serif, system-ui" font-size="26" fill="rgba(255,255,255,0.86)">
        ${text}
      </text>
      <text x="50%" y="66%" dominant-baseline="middle" text-anchor="middle"
        font-family="ui-sans-serif, system-ui" font-size="14" fill="rgba(255,255,255,0.60)">
        demo image
      </text>
    </svg>
  `);
  return `data:image/svg+xml;charset=utf-8,${svg}`;
};

export const SKINS: Skin[] = [
  {
    id: "ak47-neon-rebellion",
    name: "AK-47 | Neon Rebellion",
    image: img("AK-47 | Neon Rebellion"),
    rarity: "classified",
    wear: "Field-Tested",
    price: 112,
    gradient: RARITY_COLOR.classified,
  },
  {
    id: "awp-ether-dream",
    name: "AWP | Ether Dream",
    image: img("AWP | Ether Dream"),
    rarity: "covert",
    wear: "Minimal Wear",
    price: 380,
    gradient: RARITY_COLOR.covert,
  },
  {
    id: "m4a1s-pulse-night",
    name: "M4A1-S | Pulse Night",
    image: img("M4A1-S | Pulse Night"),
    rarity: "restricted",
    wear: "Factory New",
    price: 64,
    gradient: RARITY_COLOR.restricted,
  },
  {
    id: "deagle-constellation",
    name: "Desert Eagle | Constellation",
    image: img("Desert Eagle | Constellation"),
    rarity: "milspec",
    wear: "Minimal Wear",
    price: 18,
    gradient: RARITY_COLOR.milspec,
  },
  {
    id: "glock-noir",
    name: "Glock-18 | Noir",
    image: img("Glock-18 | Noir"),
    rarity: "industrial",
    wear: "Field-Tested",
    price: 9,
    gradient: RARITY_COLOR.industrial,
  },
  {
    id: "usp-silence-shards",
    name: "USP-S | Silence Shards",
    image: img("USP-S | Silence Shards"),
    rarity: "restricted",
    wear: "Well-Worn",
    price: 42,
    gradient: RARITY_COLOR.restricted,
  },
  {
    id: "karambit-solar-flare",
    name: "★ Karambit | Solar Flare",
    image: img("★ Karambit | Solar Flare"),
    rarity: "knife",
    wear: "Factory New",
    price: 1450,
    gradient: RARITY_COLOR.knife,
  },
  {
    id: "gloves-violet-weave",
    name: "★ Sport Gloves | Violet Weave",
    image: img("★ Sport Gloves | Violet Weave"),
    rarity: "knife",
    wear: "Minimal Wear",
    price: 980,
    gradient: RARITY_COLOR.knife,
  },
  {
    id: "p250-microburst",
    name: "P250 | Microburst",
    image: img("P250 | Microburst"),
    rarity: "consumer",
    wear: "Factory New",
    price: 1.65,
    gradient: RARITY_COLOR.consumer,
  },
  {
    id: "m4a4-neo-temple",
    name: "M4A4 | Neo Temple",
    image: img("M4A4 | Neo Temple"),
    rarity: "classified",
    wear: "Minimal Wear",
    price: 220,
    gradient: RARITY_COLOR.classified,
  },
  {
    id: "knife-butterfly-aurora",
    name: "★ Butterfly Knife | Aurora",
    image: img("★ Butterfly Knife | Aurora"),
    rarity: "knife",
    wear: "Field-Tested",
    price: 2100,
    gradient: RARITY_COLOR.knife,
  },
  {
    id: "sg553-hypnotic-grid",
    name: "SG 553 | Hypnotic Grid",
    image: img("SG 553 | Hypnotic Grid"),
    rarity: "restricted",
    wear: "Factory New",
    price: 78,
    gradient: RARITY_COLOR.restricted,
  },
  {
    id: "mp9-velvet-hex",
    name: "MP9 | Velvet Hex",
    image: img("MP9 | Velvet Hex"),
    rarity: "milspec",
    wear: "Well-Worn",
    price: 12,
    gradient: RARITY_COLOR.milspec,
  },
  {
    id: "galil-echo-strike",
    name: "Galil AR | Echo Strike",
    image: img("Galil AR | Echo Strike"),
    rarity: "industrial",
    wear: "Field-Tested",
    price: 6.5,
    gradient: RARITY_COLOR.industrial,
  },
];

export const SKIN_BY_ID = new Map(SKINS.map((s) => [s.id, s]));

export function pickRewardSkinId(targetValue: number, rng01: () => number): string | undefined {
  const affordable = SKINS.filter((s) => s.price <= targetValue * 1.02);
  if (affordable.length === 0) return undefined;
  const biased = affordable
    .map((s) => ({ s, w: 1 / Math.max(1, Math.abs(targetValue - s.price)) }))
    .sort((a, b) => b.w - a.w)
    .slice(0, Math.min(12, affordable.length));
  const idx = Math.floor(rng01() * biased.length);
  return biased[idx]?.s.id;
}
