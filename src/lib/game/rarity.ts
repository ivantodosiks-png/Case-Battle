import type { Rarity } from "./types";

export const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythical"];

export const rarityColor: Record<Rarity, string> = {
  common: "#334155",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythical: "#ff3d7f",
};

export const rarityLabel: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythical: "Mythical",
};

