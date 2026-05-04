"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client/api";
import { useSessionStore } from "@/store/sessionStore";
import { cn } from "@/lib/cn";
import { rarityColor } from "@/lib/game/rarity";
import type { Item, LiveDropEntry } from "@/lib/game/types";

type LiveDrop = LiveDropEntry & { item?: Item | null };

export function LiveDropSidebar() {
  const token = useSessionStore((s) => s.token);
  const [drops, setDrops] = useState<LiveDrop[]>([]);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await apiGet<{ liveDrops: LiveDrop[] }>("/api/live-drops", token);
        if (alive) setDrops(res.liveDrops ?? []);
      } catch {
        // ignore
      }
    }
    tick();
    const id = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [token]);

  const items = useMemo(() => drops.slice(0, 16), [drops]);

  return (
    <div className="sticky top-[76px] rounded-2xl bg-panel/70 p-3 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Live Drops</div>
        <div className="text-xs text-white/50">обновление</div>
      </div>
      <div className="space-y-2">
        {items.map((d) => {
          const item = d.item;
          const rarity = item?.rarity ?? "common";
          const color = rarityColor[rarity];
          return (
            <div
              key={d.id}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2 py-2 ring-1 ring-white/5",
                "bg-card/50 hover:bg-card/70 transition",
              )}
              style={{
                boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 0 24px ${color}22`,
              }}
            >
              <div
                className="h-9 w-9 rounded-lg"
                style={{
                  background: item
                    ? `linear-gradient(135deg, ${item.image.from}, ${item.image.to})`
                    : "linear-gradient(135deg, #0b1220, #111827)",
                  border: `1px solid ${color}55`,
                }}
              />
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white">{item?.name ?? "???"}</div>
                <div className="text-[11px] text-white/55">
                  <span className="capitalize">{rarity}</span> · <span className="text-white/75">{item?.price ?? 0} ₽</span>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 ? (
          <div className="rounded-xl bg-card/40 p-3 text-xs text-white/55 ring-1 ring-white/10">
            Открой кейс или выиграй апгрейд — тут появятся последние дропы.
          </div>
        ) : null}
      </div>
    </div>
  );
}

