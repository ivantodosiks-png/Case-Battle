"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { LootCase } from "@/lib/game/types";

function useLocalFavorites() {
  const key = "skinforge_fav_cases_v1";
  const [set, setSet] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const toggle = (id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  return { fav: set, toggle };
}

export function CasesGrid({ cases }: { cases: LootCase[] }) {
  const [q, setQ] = useState("");
  const { fav, toggle } = useLocalFavorites();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query ? cases.filter((c) => c.name.toLowerCase().includes(query)) : cases;
    return base.slice().sort((a, b) => Number(fav.has(b.id)) - Number(fav.has(a.id)));
  }, [cases, q, fav]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию кейса…"
          className="w-full rounded-xl bg-card/60 px-3 py-2 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40 sm:max-w-sm"
        />
        <div className="text-xs text-white/55">Избранные — вверху</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const isFav = fav.has(c.id);
          return (
            <div
              key={c.id}
              className="group relative overflow-hidden rounded-2xl bg-card/55 p-4 ring-1 ring-white/10 transition hover:bg-card/70"
            >
              <div
                className="absolute inset-0 opacity-50"
                style={{ background: `radial-gradient(800px 260px at 30% 20%, ${c.image.to}33, transparent 55%)` }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base tracking-wide text-white">{c.name}</div>
                  <div className="mt-1 text-sm text-white/60">{c.price} ₽</div>
                </div>
                <button
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "rounded-xl px-2 py-1 text-xs ring-1 ring-white/10 transition",
                    isFav ? "bg-accent text-black" : "bg-black/20 text-white/70 hover:text-white",
                  )}
                >
                  {isFav ? "★" : "☆"}
                </button>
              </div>

              <div
                className="relative mt-4 h-24 rounded-xl ring-1 ring-white/10"
                style={{ background: `linear-gradient(135deg, ${c.image.from}, ${c.image.to})` }}
              />

              <div className="relative mt-4 flex items-center justify-between">
                <div className="text-xs text-white/55">{c.itemIds.length} предметов</div>
                <Link
                  href={`/cases/${c.id}`}
                  className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110"
                >
                  Открыть
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

