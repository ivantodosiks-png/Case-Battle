"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InventoryItem, Skin, UpgradeMultiplier, UpgradeResponse } from "@/lib/types";
import { SKIN_BY_ID, SKINS } from "@/lib/skins";

type RecentUpgrade = {
  id: string;
  ts: number;
  win: boolean;
  stakeValue: number;
  multiplier: UpgradeMultiplier;
  payoutValue: number;
  cashbackValue: number;
  rewardSkinId?: string;
};

type Bet =
  | { type: "skin"; skinInstanceId: string }
  | { type: "balance"; amount: number };

type UpgradeState = {
  balance: number;
  inventory: InventoryItem[];
  bet: Bet | null;
  multiplier: UpgradeMultiplier;
  spinning: boolean;
  lastResult: UpgradeResponse | null;
  recent: RecentUpgrade[];
  fakeOnline: number;
  fakeJackpot: number;

  catalog: Skin[];
  addTestSkins: (count?: number) => void;
  selectBetSkin: (instanceId: string) => void;
  setBetBalance: (amount: number) => void;
  setMultiplier: (m: UpgradeMultiplier) => void;
  clearBet: () => void;
  performUpgrade: () => Promise<UpgradeResponse | null>;
  applyOutcomeClientSide: (res: UpgradeResponse) => void;
};

function now() {
  return Date.now();
}

function mkInstanceId(skinId: string) {
  return `${crypto.randomUUID()}::${skinId}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export const useUpgradeStore = create<UpgradeState>()(
  persist(
    (set, get) => ({
      balance: 420.0,
      inventory: [],
      bet: null,
      multiplier: 2,
      spinning: false,
      lastResult: null,
      recent: [],
      fakeOnline: 1284,
      fakeJackpot: 182_340,

      catalog: SKINS,

      addTestSkins: (count = 6) => {
        const pool = get().catalog;
        const next: InventoryItem[] = [];
        for (let i = 0; i < count; i++) {
          const skin = pool[Math.floor(Math.random() * pool.length)];
          if (!skin) continue;
          next.push({ instanceId: mkInstanceId(skin.id), skinId: skin.id, acquiredAt: now() });
        }
        set((s) => ({ inventory: [...next, ...s.inventory].slice(0, 36) }));
      },

      selectBetSkin: (instanceId) => set(() => ({ bet: { type: "skin", skinInstanceId: instanceId } })),
      setBetBalance: (amount) => set(() => ({ bet: { type: "balance", amount: clamp(amount, 1, 100000) } })),
      setMultiplier: (m) => set(() => ({ multiplier: clamp(Number(m), 1.1, 20) })),
      clearBet: () => set(() => ({ bet: null })),

      performUpgrade: async () => {
        const s = get();
        if (s.spinning) return null;
        if (!s.bet) return null;

        set({ spinning: true, lastResult: null });

        try {
          const payload =
            s.bet.type === "skin"
              ? { betType: "skin", betSkinInstanceId: s.bet.skinInstanceId, multiplier: s.multiplier }
              : { betType: "balance", betAmount: s.bet.amount, multiplier: s.multiplier };

          const res = await fetch("/api/upgrade", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error("Upgrade failed");
          const data = (await res.json()) as UpgradeResponse;
          if (!data.ok) throw new Error("Upgrade failed");
          set({ lastResult: data });
          return data;
        } catch {
          set({ spinning: false });
          return null;
        }
      },

      applyOutcomeClientSide: (res) => {
        const s = get();
        const bet = s.bet;
        if (!bet) {
          set({ spinning: false });
          return;
        }

        // Remove stake
        if (bet.type === "skin") {
          set((st) => ({ inventory: st.inventory.filter((i) => i.instanceId !== bet.skinInstanceId) }));
        } else {
          set((st) => ({ balance: Math.max(0, Math.round((st.balance - bet.amount) * 100) / 100) }));
        }

        // Apply payout or cashback
        if (res.win) {
          if (res.rewardSkinId) {
            set((st) => ({
              inventory: [
                { instanceId: mkInstanceId(res.rewardSkinId!), skinId: res.rewardSkinId!, acquiredAt: now() },
                ...st.inventory,
              ].slice(0, 36),
            }));
          } else {
            set((st) => ({ balance: Math.round((st.balance + res.payoutValue) * 100) / 100 }));
          }
        } else {
          if (res.cashbackValue > 0) {
            set((st) => ({ balance: Math.round((st.balance + res.cashbackValue) * 100) / 100 }));
          }
        }

        const recentItem: RecentUpgrade = {
          id: res.seed,
          ts: now(),
          win: res.win,
          stakeValue: res.stakeValue,
          multiplier: res.multiplier,
          payoutValue: res.payoutValue,
          cashbackValue: res.cashbackValue,
          rewardSkinId: res.rewardSkinId,
        };

        set((st) => ({
          spinning: false,
          bet: null,
          recent: [recentItem, ...st.recent].slice(0, 18),
          fakeOnline: clamp(st.fakeOnline + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 4)), 980, 3920),
          fakeJackpot: Math.round((st.fakeJackpot + (Math.random() < 0.6 ? 1 : -1) * (40 + Math.floor(Math.random() * 220))) * 1),
        }));
      },
    }),
    {
      name: "cb-upgrade-demo",
      partialize: (s) => ({
        balance: s.balance,
        inventory: s.inventory,
        recent: s.recent,
        fakeOnline: s.fakeOnline,
        fakeJackpot: s.fakeJackpot,
      }),
    }
  )
);

export function inventoryValue(inv: InventoryItem[]) {
  return inv.reduce((sum, it) => sum + (SKIN_BY_ID.get(it.skinId)?.price ?? 0), 0);
}
