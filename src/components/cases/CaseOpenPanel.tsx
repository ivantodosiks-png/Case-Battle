"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [openMode, setOpenMode] = useState<"normal" | "quick">("normal");
  const [wonItem, setWonItem] = useState<Item | null>(null);
  const [trackX, setTrackX] = useState(0);
  const [busyAction, setBusyAction] = useState<"sell" | null>(null);
  const [reelItems, setReelItems] = useState<Item[]>([]);
  const [winIndex, setWinIndex] = useState<number | null>(null);
  const playIdRef = useRef(0);

  const reel = useMemo(() => {
    const pool = lootCase.itemIds.map((id) => getItem(id)).filter(Boolean) as Item[];
    return Array.from({ length: 44 }, (_, i) => pool[i % pool.length]!).slice(0, 44);
  }, [lootCase.itemIds]);

  useEffect(() => {
    // Initial reel (static preview)
    setReelItems(reel);
    setTrackX(0);
    setWinIndex(null);
    setWonItem(null);
    setBusyAction(null);
    setSpinning(false);
  }, [reel]);

  function buildReelFromSpinData(spinData: SpinData) {
    const pool = lootCase.itemIds.map((id) => getItem(id)).filter(Boolean) as Item[];
    const winItem = getItem(spinData.winItemId);
    if (!winItem || pool.length === 0) return { items: reel, winIndex: 0 };

    const desiredWinIndex = 34; // near the end for a longer spin
    const total = 44;
    const items: Item[] = new Array(total);
    items[desiredWinIndex] = winItem;

    for (let i = 0; i < total; i++) {
      if (i === desiredWinIndex) continue;
      // filler is random from case pool; does not affect result
      items[i] = pool[Math.floor(Math.random() * pool.length)]!;
    }

    return { items, winIndex: desiredWinIndex };
  }

  async function open(mode: "normal" | "quick") {
    if (spinning) return;
    const playId = ++playIdRef.current;
    setSpinning(true);
    setOpenMode(mode);
    setWonItem(null);
    setBusyAction(null);
    setWinIndex(null);
    setTrackX(0);

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

    if (playId !== playIdRef.current) return;

    const item = res.item as Item;
    const spinData = res.spinData as SpinData;
    setWonItem(item);
    applyUpdate({ token: res.token, state: res.state });

    const cardW = 128;
    const gap = 12;
    const centerOffset = 192;
    const built = buildReelFromSpinData(spinData);
    setReelItems(built.items);
    setWinIndex(built.winIndex);
    const target = -(built.winIndex * (cardW + gap) - centerOffset);

    // ensure animation always triggers (0 -> target)
    requestAnimationFrame(() => {
      if (playId !== playIdRef.current) return;
      setTrackX(target);
    });

    setTimeout(() => setSpinning(false), mode === "quick" ? 1600 : 4800);
  }

  async function sell() {
    if (!wonItem) return;
    if (spinning) return;
    if (busyAction) return;
    setBusyAction("sell");

    type SellRes = { success: boolean; token: string; state: SignedState; balance: number };
    try {
      const res = await apiPost<SellRes>("/api/inventory/sell", token, { itemId: wonItem.id });
      applyUpdate({ token: res.token, state: res.state });
      setWonItem(null);
    } catch {
      alert("Не удалось продать предмет.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-[64px] z-10 -mx-2 rounded-2xl bg-black/35 px-2 py-2 backdrop-blur sm:static sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="pill">Цена открытия</span>
          <span className="pill">{lootCase.price} ₽</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button onClick={() => open("normal")} disabled={spinning} className="btn btn-primary">
            {spinning && openMode === "normal" ? "Открываем…" : "Открыть обычно"}
          </button>
          <button onClick={() => open("quick")} disabled={spinning} className="btn btn-ghost">
            {spinning && openMode === "quick" ? "Быстро…" : "Открыть быстро"}
          </button>
        </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_22px_rgba(255,255,255,0.35)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent" />

        <motion.div
          className="flex gap-3 p-4"
          style={{ willChange: "transform" }}
          animate={{ x: trackX }}
          transition={{ duration: openMode === "quick" ? 1.5 : 4.6, ease: [0.15, 0.85, 0.15, 1] }}
        >
          {reelItems.map((it, idx) => {
            const color = rarityColor[it.rarity];
            const isWin = winIndex != null && idx === winIndex && !spinning;
            return (
              <div
                key={`${it.id}_${idx}`}
                className={[
                  "w-[128px] flex-none overflow-hidden rounded-2xl bg-black/25 p-2 ring-1 ring-white/10 transition",
                  isWin ? "ring-2 ring-accent/60" : "",
                ].join(" ")}
                style={{ boxShadow: isWin ? `0 0 44px ${color}40` : `0 0 26px ${color}18` }}
              >
                <div
                  className="h-16 rounded-xl ring-1 ring-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${it.image.from}, ${it.image.to})`,
                    border: `1px solid ${color}55`,
                  }}
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

        {winIndex != null && !spinning ? (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-accent/20" />
        ) : null}
      </div>

      {wonItem ? (
        <div className="glass-card ring-soft rounded-2xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs text-white/55">Выпало</div>
              <div className="truncate text-sm font-semibold text-white">{wonItem.name}</div>
              <div className="mt-1 text-xs text-white/60">{wonItem.price} ₽</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/inventory" className="btn btn-primary px-3 py-2 text-xs">
                Оставить
              </Link>
              <button onClick={sell} disabled={busyAction === "sell"} className="btn btn-ghost px-3 py-2 text-xs">
                {busyAction === "sell" ? "Продаём…" : `Продать за ${wonItem.price} ₽`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
