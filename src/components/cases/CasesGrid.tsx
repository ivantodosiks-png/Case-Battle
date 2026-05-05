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
    <div className="space-y-4">
      <div className="glass ring-soft rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-display text-lg tracking-wide text-white">Кейсы</div>
            <div className="text-sm text-white/60">Выбирай кейс, открывай и забирай предмет в инвентарь.</div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по кейсам…"
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/15 sm:w-[280px]"
            />
            <div className="pill">Избранные выше</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const isFav = fav.has(c.id);
          return (
            <div key={c.id} className="glass-card ring-soft group relative overflow-hidden rounded-2xl p-4 transition hover:border-white/20">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background: `radial-gradient(900px 300px at 20% 10%, ${c.image.to}30, transparent 55%), radial-gradient(700px 260px at 70% 80%, ${c.image.from}22, transparent 60%)`,
                }}
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base tracking-wide text-white">{c.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="pill">{c.itemIds.length} предметов</span>
                    <span className="pill">{c.price} ₽</span>
                  </div>
                </div>
                <button
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-xs ring-1 ring-white/10 transition",
                    isFav ? "bg-accent text-black ring-accent/30" : "bg-black/20 text-white/70 hover:text-white",
                  )}
                  aria-label={isFav ? "Убрать из избранного" : "Добавить в избранное"}
                >
                  {isFav ? "★" : "☆"}
                </button>
              </div>

              <div className="relative mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <div className="h-32 w-full" style={{ background: `linear-gradient(135deg, ${c.image.from}, ${c.image.to})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              </div>

              <div className="relative mt-4 flex items-center justify-between">
                <div className="text-xs text-white/60">Серверный RNG</div>
                <Link href={`/cases/${c.id}`} className="btn btn-primary px-3 py-2 text-xs">
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
