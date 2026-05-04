"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, SignedState } from "@/lib/game/types";
import { apiGet, apiPost } from "@/lib/client/api";
import { useSessionStore } from "@/store/sessionStore";
import { useUpgradeStore } from "@/store/upgradeStore";
import { ItemCard } from "@/components/items/ItemCard";
import { UpgradeWheel } from "@/components/upgrade/UpgradeWheel";

export default function UpgradePage() {
  const token = useSessionStore((s) => s.token);
  const applyUpdate = useSessionStore((s) => s.applyUpdate);

  const selected = useUpgradeStore((s) => s.selectedItemIds);
  const toggle = useUpgradeStore((s) => s.toggleSelected);
  const clearSelected = useUpgradeStore((s) => s.clearSelected);
  const targetId = useUpgradeStore((s) => s.targetItemId);
  const setTarget = useUpgradeStore((s) => s.setTarget);

  const [inventory, setInventory] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [resultText, setResultText] = useState<string>("");

  useEffect(() => {
    let alive = true;
    async function load() {
      const inv = await apiGet<{ items: Item[] }>("/api/inventory", token);
      const it = await apiGet<{ items: Item[] }>("/api/items", token);
      if (inv.token) applyUpdate({ token: inv.token });
      if (alive) {
        setInventory(inv.items ?? []);
        setCatalog(it.items ?? []);
      }
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, applyUpdate]);

  const selectedItems = useMemo(() => {
    const map = new Map(inventory.map((i) => [i.id, i]));
    return selected.map((id) => map.get(id)).filter(Boolean) as Item[];
  }, [selected, inventory]);

  const betValue = useMemo(() => selectedItems.reduce((acc, it) => acc + it.price, 0), [selectedItems]);
  const targetItem = useMemo(() => catalog.find((x) => x.id === targetId) ?? null, [catalog, targetId]);

  const rawChance = targetItem ? (betValue / targetItem.price) * 100 : 0;
  const chance = Math.max(1, Math.min(95, rawChance || 0));
  const multiplier = targetItem && betValue > 0 ? targetItem.price / betValue : 0;

  const targetOptions = useMemo(() => {
    if (betValue <= 0) return catalog.slice().sort((a, b) => a.price - b.price);
    return catalog
      .filter((it) => it.price > betValue)
      .slice()
      .sort((a, b) => a.price - b.price);
  }, [catalog, betValue]);

  async function play() {
    if (spinning) return;
    if (!targetItem) return alert("Выбери цель.");
    if (selectedItems.length === 0) return alert("Выбери предметы ставки.");
    if (betValue >= targetItem.price) return alert("Ставка должна быть дешевле цели.");

    setSpinning(true);
    setResult(null);
    setResultText("");

    type UpgradeRes = {
      won: boolean;
      chance: number;
      roll: number;
      targetItem: Item;
      cashback: { percent: number; amount: number };
      balance: number;
      token: string;
      state: SignedState;
    };
    let res: UpgradeRes;
    try {
      res = await apiPost<UpgradeRes>("/api/upgrader/play", token, {
        selectedItemIds: selected,
        targetItemId: targetItem.id,
      });
    } catch {
      setSpinning(false);
      alert("Апгрейд не удался (проверь выбор).");
      return;
    }

    applyUpdate({ token: res.token, state: res.state });

    // Let animation run; then show result.
    setTimeout(() => {
      const won = Boolean(res.won);
      setResult(won ? "win" : "lose");
      setResultText(
        won
          ? `Победа! Ты получил ${res.targetItem.name} (${res.targetItem.price} ₽)`
          : `Проигрыш. Кешбек ${res.cashback.percent}% = ${res.cashback.amount} ₽`,
      );
      setSpinning(false);
      clearSelected();
    }, 4200);
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl bg-panel/60 p-4 ring-1 ring-white/10">
        <div className="flex flex-col gap-1">
          <div className="font-display text-lg tracking-wide text-white">Апгрейд</div>
          <div className="text-sm text-white/60">
            Chance = (ставка / цель) × 100, минимум 1%, максимум 95%. Результат считается на backend.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Ставка (до 6)</div>
            <button
              onClick={() => clearSelected()}
              className="rounded-xl bg-black/20 px-2 py-1 text-xs text-white/70 ring-1 ring-white/10"
            >
              Очистить
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inventory.slice(0, 18).map((it) => (
              <ItemCard key={it.id} item={it} selected={selected.includes(it.id)} onSelect={() => toggle(it.id)} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10 lg:col-span-1">
          <div className="mb-4 grid gap-3">
            <UpgradeWheel chance={chance || 1} spinning={spinning} result={result} />
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-card/45 p-3 ring-1 ring-white/10">
                <div className="text-xs text-white/55">Ставка</div>
                <div className="text-sm font-semibold text-white">{betValue} ₽</div>
              </div>
              <div className="rounded-2xl bg-card/45 p-3 ring-1 ring-white/10">
                <div className="text-xs text-white/55">Цель</div>
                <div className="text-sm font-semibold text-white">{targetItem?.price ?? 0} ₽</div>
              </div>
              <div className="rounded-2xl bg-card/45 p-3 ring-1 ring-white/10">
                <div className="text-xs text-white/55">Множитель</div>
                <div className="text-sm font-semibold text-white">{multiplier ? `x${multiplier.toFixed(2)}` : "—"}</div>
              </div>
              <div className="rounded-2xl bg-card/45 p-3 ring-1 ring-white/10">
                <div className="text-xs text-white/55">Шанс</div>
                <div className="text-sm font-semibold text-white">{targetItem ? `${chance.toFixed(1)}%` : "—"}</div>
              </div>
            </div>

            <button
              onClick={play}
              disabled={spinning}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {spinning ? "Крутим…" : "Апгрейд"}
            </button>

            {resultText ? (
              <div className="rounded-2xl bg-card/55 p-3 text-sm ring-1 ring-white/10">{resultText}</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10 lg:col-span-1">
          <div className="mb-3 text-sm font-semibold text-white">Цель</div>
          <div className="grid grid-cols-2 gap-3">
            {targetOptions.slice(0, 18).map((it) => (
              <ItemCard key={it.id} item={it} selected={it.id === targetId} onSelect={() => setTarget(it.id)} />
            ))}
          </div>
          {betValue > 0 ? <div className="mt-3 text-xs text-white/55">Показываю только цели дороже ставки.</div> : null}
        </div>
      </div>
    </div>
  );
}
