export type Rarity =
  | "consumer"
  | "industrial"
  | "milspec"
  | "restricted"
  | "classified"
  | "covert"
  | "knife";

export type Skin = {
  id: string;
  name: string;
  image: string; // url or data-uri
  rarity: Rarity;
  wear: string;
  price: number;
  gradient: { from: string; to: string };
};

export type InventoryItem = {
  instanceId: string;
  skinId: string;
  acquiredAt: number;
};

export type UpgradeRequest = {
  betType: "skin" | "balance";
  betSkinInstanceId?: string;
  betAmount?: number;
  targetSkinId: string;
};

export type UpgradeResponse = {
  ok: true;
  seed: string;
  chancePct: number; // 0..100
  roll: number; // 0..100
  win: boolean;
  stakeValue: number;
  targetValue: number;
  rewardSkinId?: string;
};
