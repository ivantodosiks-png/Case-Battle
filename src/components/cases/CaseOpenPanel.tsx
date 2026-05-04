"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Item, LootCase, SignedState } from "@/lib/game/types";
import { getItem } from "@/lib/game/catalog";
import { apiPost } from "@/lib/client/api";
import { useSessionStore } from "@/store/sessionStore";
import { rarityColor } from "@/lib/game/rarity";

type SpinData = {
  entries: { itemId: string; weight: number }[];
  winItemId: string;
  roll: number;
  total: number;
};

export function CaseOpenPanel({ lootCase }: { lootCase: LootCase }) {
  const token = useSessionStore((s) => s.token);
  const applyUpdate = useSessionStore((s) => s.applyUpdate);

  const [spinning, setSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<Item | null>(null);
  const [trackX, setTrackX] = useState(0);

  const reel = useMemo(() => {
    const pool = lootCase.itemIds.map((id) => getItem(id)).filter(Boolean) as Item[];
    const long = Array.from({ length: 40 }, (_, i) => pool[i % pool.length]!).slice(0, 40);
    return long;
  }, [lootCase.itemIds]);

  async function open() {
    if (spinning) return;
    setSpinning(true);
    setWonItem(null);

    type OpenRes = {
      success: boolean;
      token: string;
      state: SignedState;
      item: Item;
      balance: number;
      spinData: SpinData;
    };
    let res: OpenRes;
    try {
      res = await apiPost<OpenRes>("/api/cases/open", token, { caseId: lootCase.id });
    } catch {
      setSpinning(false);
      alert("Не удалось открыть кейс (возможно, не хватает баланса).");
      return;
    }

    const item = res.item as Item;
    const spinData = res.spinData as SpinData;
    setWonItem(item);
    applyUpdate({ token: res.token, state: res.state });

    // Animation: shift track so win item "lands" around the center.
    const winIndex = Math.max(10, reel.findIndex((x) => x.id === spinData.winItemId));
    const cardW = 120;
    const gap = 12;
    const centerOffset = 180;
    const target = -(winIndex * (cardW + gap) - centerOffset);

    setTrackX(target);
    setTimeout(() => setSpinning(false), 4800);
  }

  return (
    <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/70">
          Открытие: <span className="font-semibold text-white">{lootCase.price} ₽</span>
        </div>
        <button
          onClick={open}
          disabled={spinning}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
        >
          {spinning ? "Крутим…" : `Открыть за ${lootCase.price} ₽`}
        </button>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl bg-card/40 ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-accent shadow-[0_0_24px_rgba(255,106,26,0.55)]" />

        <motion.div
          className="flex gap-3 p-4"
          animate={{ x: trackX }}
          transition={{ duration: 4.6, ease: [0.15, 0.85, 0.15, 1] }}
        >
          {reel.map((it, idx) => {
            const color = rarityColor[it.rarity];
            return (
              <div
                key={`${it.id}_${idx}`}
                className="w-[120px] flex-none rounded-2xl bg-[#0b1020]/40 p-2 ring-1 ring-white/10"
                style={{ boxShadow: `0 0 18px ${color}22` }}
              >
                <div
                  className="h-16 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${it.image.from}, ${it.image.to})`, border: `1px solid ${color}55` }}
                />
                <div className="mt-2 truncate text-[11px] font-semibold text-white">{it.name}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-white/60">
                  <span className="capitalize">{it.rarity}</span>
                  <span className="font-semibold text-white">{it.price} ₽</span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {wonItem ? (
        <div className="mt-4 rounded-2xl bg-card/55 p-3 text-sm ring-1 ring-accent/25">
          Выпало: <span className="font-semibold text-white">{wonItem.name}</span>{" "}
          <span className="text-white/60">({wonItem.price} ₽)</span>
        </div>
      ) : null}
    </div>
  );
}
