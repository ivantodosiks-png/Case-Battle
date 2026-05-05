"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UpgradeMode =
  | { kind: "mult"; value: 2 | 5 | 10 }
  | { kind: "chance"; value: 75 | 50 | 30 };

type UpgradeState = {
  betItemId: string | null;
  mode: UpgradeMode;
  setBetItem: (id: string | null) => void;
  setMode: (mode: UpgradeMode) => void;
  clear: () => void;
};

export const useUpgradeStore = create<UpgradeState>()(
  persist(
    (set) => ({
      betItemId: null,
      mode: { kind: "mult", value: 2 },
      setBetItem: (id) => set({ betItemId: id }),
      setMode: (mode) => set({ mode }),
      clear: () => set({ betItemId: null }),
    }),
    { name: "skinforge_upgrade_v2", partialize: (s) => ({ betItemId: s.betItemId, mode: s.mode }) },
  ),
);

