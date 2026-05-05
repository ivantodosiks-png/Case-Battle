export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythical";

export type GameType = "case_open" | "upgrade";

export type Item = {
  id: string;
  name: string;
  price: number; // ₽
  rarity: Rarity;
  image: { kind: "gradient"; from: string; to: string };
};

export type LootCase = {
  id: string;
  name: string;
  price: number; // ₽
  image: { kind: "gradient"; from: string; to: string };
  itemIds: string[];
};

export type CaseDropTable = {
  caseId: string;
  entries: { itemId: string; weight: number }[];
};

export type HistoryEntry = {
  id: string;
  type: GameType;
  createdAt: number; // epoch ms
  betValue: number;
  resultValue: number;
  won: boolean;
  cashback: number;
  meta: Record<string, unknown>;
};

export type LiveDropEntry = {
  id: string;
  createdAt: number; // epoch ms
  itemId: string;
  source: "case" | "upgrade";
  caseId?: string;
};

export type SignedState = {
  v: 1;
  user: {
    id: string;
    username: string;
    avatarSeed: string;
  };
  balance: number;
  inventoryItemIds: string[]; // owned items only
  upgradeLockUntil?: number; // epoch ms, soft client lock
  caseLockUntil?: number; // epoch ms, soft client lock
  history: HistoryEntry[];
  liveDrops: LiveDropEntry[];
  stats: {
    casesOpened: number;
    upgradesPlayed: number;
    bestDropValue: number;
    totalWinningsValue: number;
  };
};
