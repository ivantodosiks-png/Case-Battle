"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client/api";
import type { Item, Rarity } from "@/lib/game/types";
import { useSessionStore } from "@/store/sessionStore";
import { useUpgradeStore } from "@/store/upgradeStore";
import { ItemCard } from "@/components/items/ItemCard";

export default function InventoryPage() {
  const token = useSessionStore((s) => s.token);
  const applyUpdate = useSessionStore((s) => s.applyUpdate);
  const [items, setItems] = useState<Item[]>([]);

  const selected = useUpgradeStore((s) => s.selectedItemIds);
  const toggle = useUpgradeStore((s) => s.toggleSelected);

  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(999999);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await apiGet<{ items: Item[] }>("/api/inventory", token);
      if (res.token) applyUpdate({ token: res.token });
      if (alive) setItems(res.items ?? []);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, applyUpdate]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((it) => (query ? it.name.toLowerCase().includes(query) : true))
      .filter((it) => (rarity === "all" ? true : it.rarity === rarity))
      .filter((it) => it.price >= min && it.price <= max)
      .sort((a, b) => b.price - a.price);
  }, [items, q, rarity, min, max]);

  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl bg-panel/60 p-4 ring-1 ring-white/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-lg tracking-wide text-white">Инвентарь</div>
            <div className="text-sm text-white/60">Выбирай до 6 предметов для апгрейда.</div>
          </div>
          <div className="text-sm text-white/70">Выбрано: {selected.length}/6</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10 md:col-span-1">
          <div className="text-sm font-semibold text-white">Фильтры</div>
          <div className="mt-3 space-y-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск…"
              className="w-full rounded-xl bg-card/60 px-3 py-2 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity | "all")}
              className="w-full rounded-xl bg-card/60 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="all">Все редкости</option>
              <option value="common">common</option>
              <option value="uncommon">uncommon</option>
              <option value="rare">rare</option>
              <option value="epic">epic</option>
              <option value="legendary">legendary</option>
              <option value="mythical">mythical</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={min}
                onChange={(e) => setMin(Number(e.target.value || 0))}
                type="number"
                className="w-full rounded-xl bg-card/60 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                placeholder="min"
              />
              <input
                value={max}
                onChange={(e) => setMax(Number(e.target.value || 0))}
                type="number"
                className="w-full rounded-xl bg-card/60 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                placeholder="max"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                selected={selected.includes(it.id)}
                onSelect={() => toggle(it.id)}
                actions={
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(it.id);
                      }}
                      className="flex-1 rounded-xl bg-accent px-2 py-1 text-xs font-semibold text-black"
                    >
                      {selected.includes(it.id) ? "Убрать" : "Выбрать"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert("Продажа — заглушка (можно добавить позже).");
                      }}
                      className="flex-1 rounded-xl bg-black/20 px-2 py-1 text-xs text-white/80 ring-1 ring-white/10"
                    >
                      Продать
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
