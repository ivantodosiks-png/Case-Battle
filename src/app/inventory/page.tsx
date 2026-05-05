"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/client/api";
import type { Item, Rarity, SignedState } from "@/lib/game/types";
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
  const [sellingId, setSellingId] = useState<string | null>(null);

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

  async function sell(item: Item) {
    if (sellingId) return;
    setSellingId(item.id);
    type SellRes = { success: boolean; token: string; state: SignedState; balance: number };
    try {
      const res = await apiPost<SellRes>("/api/inventory/sell", token, { itemId: item.id });
      applyUpdate({ token: res.token, state: res.state });
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch {
      alert("Не удалось продать предмет.");
    } finally {
      setSellingId(null);
    }
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="glass ring-soft rounded-2xl p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-lg tracking-wide text-white">Инвентарь</div>
            <div className="text-sm text-white/60">Выбирай до 6 предметов для апгрейда или продавай за баланс.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">Выбрано: {selected.length}/6</span>
            <span className="pill">Предметов: {items.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="glass ring-soft rounded-2xl p-4 md:col-span-1">
          <div className="text-sm font-semibold text-white">Фильтры</div>
          <div className="mt-3 space-y-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск…"
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/15"
            />
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity | "all")}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/15"
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
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                placeholder="min ₽"
              />
              <input
                value={max}
                onChange={(e) => setMax(Number(e.target.value || 0))}
                type="number"
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                placeholder="max ₽"
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
                      className="btn btn-primary flex-1 px-2 py-1 text-xs"
                    >
                      {selected.includes(it.id) ? "Убрать" : "Выбрать"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sell(it);
                      }}
                      disabled={sellingId === it.id}
                      className="btn btn-ghost flex-1 px-2 py-1 text-xs"
                    >
                      {sellingId === it.id ? "…" : "Продать"}
                    </button>
                  </div>
                }
              />
            ))}
          </div>

          {filtered.length === 0 ? <div className="mt-3 text-sm text-white/60">Ничего не найдено.</div> : null}
        </div>
      </div>
    </div>
  );
}

