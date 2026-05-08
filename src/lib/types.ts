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

export type UpgradeMultiplier = number;

export type UpgradeRequest = {
  betType: "skin" | "balance";
  betSkinInstanceId?: string;
  betAmount?: number;
  multiplier: UpgradeMultiplier;
};

export type UpgradeResponse = {
  ok: true;
  seed: string;
  chance: number; // 0..1
  multiplier: UpgradeMultiplier;
  roll: number; // 0..1
  win: boolean;
  stakeValue: number;
  payoutValue: number;
  cashbackValue: number;
  rewardSkinId?: string; // if available
};
