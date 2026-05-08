"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InventoryItem, Skin, UpgradeResponse } from "@/lib/types";
import { SKIN_BY_ID, SKINS } from "@/lib/skins";

type RecentUpgrade = {
  id: string;
  ts: number;
  win: boolean;
  stakeValue: number;
  chancePct: number;
  roll: number;
  targetValue: number;
  targetSkinId: string;
  rewardSkinId?: string;
};

type Bet =
  | { type: "skin"; skinInstanceId: string }
  | { type: "balance"; amount: number };

type UpgradeState = {
  userId: string;
  balance: number;
  inventory: InventoryItem[];
  bet: Bet | null;
  multiplier: number;
  targetSkinId: string | null;
  targetReady: boolean;
  lastBonusAt: number;
  spinning: boolean;
  lastResult: UpgradeResponse | null;
  recent: RecentUpgrade[];
  fakeOnline: number;
  fakeJackpot: number;

  catalog: Skin[];
  addTestSkins: (count?: number) => void;
  selectBetSkin: (instanceId: string) => void;
  setBetBalance: (amount: number) => void;
  setMultiplier: (m: number) => void;
  recomputeTarget: () => void;
  setTargetSkinId: (skinId: string | null) => void;
  setTargetFromSkinPrice: (targetPrice: number) => void;
  grantBonus: () => boolean;
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
      userId: crypto.randomUUID(),
      balance: 420.0,
      inventory: [],
      bet: null,
      multiplier: 2,
      targetSkinId: null,
      targetReady: false,
      lastBonusAt: 0,
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

      selectBetSkin: (instanceId) =>
        set(() => ({
          bet: { type: "skin", skinInstanceId: instanceId },
          targetSkinId: null,
          targetReady: false,
        })),
      setBetBalance: (amount) =>
        set(() => ({
          bet: { type: "balance", amount: clamp(amount, 1, 100000) },
          targetSkinId: null,
          targetReady: false,
        })),
      setMultiplier: (m) => {
        const next = clamp(Number(m), 1.1, 20);
        set(() => ({ multiplier: next, targetReady: true }));
        get().recomputeTarget();
      },
      recomputeTarget: () => {
        const s = get();
        if (!s.bet || !s.targetReady) {
          set(() => ({ targetSkinId: null }));
          return;
        }

        const stakeValue =
          s.bet.type === "balance"
            ? s.bet.amount
            : SKIN_BY_ID.get(s.bet.skinInstanceId.split("::")[1])?.price ?? 0;

        if (!stakeValue) {
          set(() => ({ targetSkinId: null }));
          return;
        }

        const targetValue = Math.round(stakeValue * Number(s.multiplier) * 100) / 100;

        const candidates = Array.from(SKIN_BY_ID.values()).filter((skin) => skin.price > stakeValue);
        const close = candidates
          .filter((skin) => skin.price <= targetValue * 1.08)
          .sort((a, b) => Math.abs(targetValue - a.price) - Math.abs(targetValue - b.price))[0];
        const fallback = candidates.sort((a, b) => a.price - b.price)[0];

        set(() => ({ targetSkinId: (close ?? fallback)?.id ?? null }));
      },
      setTargetSkinId: (skinId) =>
        set(() => ({
          targetSkinId: skinId,
          targetReady: true,
        })),
      setTargetFromSkinPrice: (targetPrice) => {
        const s = get();
        if (!s.bet) return;
        const stake =
          s.bet.type === "balance"
            ? s.bet.amount
            : SKIN_BY_ID.get(s.bet.skinInstanceId.split("::")[1])?.price ?? 0;
        const m = stake > 0 ? targetPrice / stake : 2;
        set(() => ({
          multiplier: clamp(m, 1.1, 20),
          targetReady: true,
        }));
        get().recomputeTarget();
      },
      grantBonus: () => {
        const s = get();
        const nowTs = now();
        const cdMs = 60_000;
        if (s.lastBonusAt && nowTs - s.lastBonusAt < cdMs) return false;
        set((st) => ({
          balance: Math.round((st.balance + 500) * 100) / 100,
          lastBonusAt: nowTs,
        }));
        return true;
      },
      clearBet: () => set(() => ({ bet: null, targetSkinId: null, targetReady: false })),

      performUpgrade: async () => {
        const s = get();
        if (s.spinning) return null;
        if (!s.bet) return null;
        if (!s.targetSkinId) return null;

        set({ spinning: true, lastResult: null });

        try {
          const payload =
            s.bet.type === "skin"
              ? { betType: "skin", betSkinInstanceId: s.bet.skinInstanceId, targetSkinId: s.targetSkinId, userId: s.userId }
              : { betType: "balance", betAmount: s.bet.amount, targetSkinId: s.targetSkinId, userId: s.userId };

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
          }
        }

        const recentItem: RecentUpgrade = {
          id: res.seed,
          ts: now(),
          win: res.win,
          stakeValue: res.stakeValue,
          chancePct: res.chancePct,
          roll: res.roll,
          targetValue: res.targetValue,
          targetSkinId: s.targetSkinId ?? "",
          rewardSkinId: res.rewardSkinId,
        };

        set((st) => ({
          spinning: false,
          bet: null,
          targetSkinId: null,
          targetReady: false,
          recent: [recentItem, ...st.recent].slice(0, 18),
          fakeOnline: clamp(st.fakeOnline + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 4)), 980, 3920),
          fakeJackpot: Math.round((st.fakeJackpot + (Math.random() < 0.6 ? 1 : -1) * (40 + Math.floor(Math.random() * 220))) * 1),
        }));
      },
    }),
    {
      name: "cb-upgrade-demo",
      version: 3,
      migrate: (persisted: unknown, version) => {
        // v2 reset: start with balance-only; keep everything else if present.
        if (version < 2) {
          if (persisted && typeof persisted === "object") {
            return { ...(persisted as Record<string, unknown>), inventory: [] };
          }
          return { inventory: [] };
        }
        if (version < 3) {
          if (persisted && typeof persisted === "object") {
            const p = persisted as Record<string, unknown>;
            return { ...p, userId: typeof p.userId === "string" ? p.userId : crypto.randomUUID() };
          }
          return { userId: crypto.randomUUID() };
        }
        return persisted;
      },
      partialize: (s) => ({
        userId: s.userId,
        balance: s.balance,
        inventory: s.inventory,
        recent: s.recent,
        fakeOnline: s.fakeOnline,
        fakeJackpot: s.fakeJackpot,
        lastBonusAt: s.lastBonusAt,
      }),
    }
  )
);

export function inventoryValue(inv: InventoryItem[]) {
  return inv.reduce((sum, it) => sum + (SKIN_BY_ID.get(it.skinId)?.price ?? 0), 0);
}
