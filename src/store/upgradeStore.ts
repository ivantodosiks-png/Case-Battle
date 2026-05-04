"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UpgradeState = {
  selectedItemIds: string[];
  targetItemId: string | null;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  setTarget: (id: string | null) => void;
};

export const useUpgradeStore = create<UpgradeState>()(
  persist(
    (set) => ({
      selectedItemIds: [],
      targetItemId: null,
      toggleSelected: (id) =>
        set((s) => {
          const has = s.selectedItemIds.includes(id);
          const next = has ? s.selectedItemIds.filter((x) => x !== id) : [id, ...s.selectedItemIds].slice(0, 6);
          return { selectedItemIds: next };
        }),
      clearSelected: () => set({ selectedItemIds: [] }),
      setTarget: (id) => set({ targetItemId: id }),
    }),
    { name: "skinforge_upgrade_v1", partialize: (s) => ({ selectedItemIds: s.selectedItemIds, targetItemId: s.targetItemId }) },
  ),
);
