"use client";

import { useMemo, useRef } from "react";
import type { LootCase } from "@/lib/game/types";
import { getItem } from "@/lib/game/catalog";
import { rarityColor } from "@/lib/game/rarity";

export function CaseQuickList({ lootCase }: { lootCase: LootCase }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => {
    return lootCase.itemIds
      .map((id) => getItem(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.price - a.price);
  }, [lootCase.itemIds]);

  const scrollTo = (where: "top" | "bottom") => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollTo({ top: where === "top" ? 0 : el.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Содержимое</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollTo("top")}
            className="rounded-xl bg-black/20 px-2 py-1 text-xs text-white/70 ring-1 ring-white/10 hover:text-white"
          >
            Вверх
          </button>
          <button
            onClick={() => scrollTo("bottom")}
            className="rounded-xl bg-black/20 px-2 py-1 text-xs text-white/70 ring-1 ring-white/10 hover:text-white"
          >
            Вниз
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="max-h-[520px] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable] overscroll-contain"
      >
        {items.map((it) => {
          const color = rarityColor[it.rarity];
          return (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-2xl bg-card/55 p-2 ring-1 ring-white/10"
              style={{ boxShadow: `0 0 18px ${color}18` }}
            >
              <div
                className="h-12 w-16 flex-none rounded-xl ring-1 ring-white/10"
                style={{ background: `linear-gradient(135deg, ${it.image.from}, ${it.image.to})`, border: `1px solid ${color}55` }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">{it.name}</div>
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-white/60">
                  <span className="capitalize">{it.rarity}</span>
                  <span className="font-semibold text-white">{it.price} ₽</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

