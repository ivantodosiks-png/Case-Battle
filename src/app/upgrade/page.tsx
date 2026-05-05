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
  const [resultText, setResultText] = useState<string>("");
  const [stopRoll, setStopRoll] = useState<number | null>(null);
  const [preset, setPreset] = useState<{ kind: "mult" | "chance"; value: number } | null>(null);

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

  const pickTargetNear = (desiredValue: number) => {
    if (!catalog.length) return null;
    const desired = Math.max(desiredValue, betValue + 1);
    const candidates = catalog
      .filter((it) => it.price > betValue)
      .slice()
      .sort((a, b) => a.price - b.price);
    if (candidates.length === 0) return null;
    return candidates.find((it) => it.price >= desired) ?? candidates[candidates.length - 1]!;
  };

  const applyPreset = (next: { kind: "mult" | "chance"; value: number }) => {
    if (betValue <= 0) return;
    setPreset(next);
    const desiredTarget = next.kind === "mult" ? betValue * next.value : betValue / Math.max(0.01, next.value / 100);
    const pick = pickTargetNear(desiredTarget);
    if (pick) setTarget(pick.id);
  };

  async function play() {
    if (spinning) return;
    if (!targetItem) return alert("Выбери цель.");
    if (selectedItems.length === 0) return alert("Выбери предметы ставки.");
    if (betValue >= targetItem.price) return alert("Ставка должна быть дешевле цели.");

    setSpinning(true);
    setResultText("");
    setStopRoll(null);

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
    setStopRoll(res.roll);

    setInventory((prev) => {
      const kept = prev.filter((i) => !selected.includes(i.id));
      return res.won ? [res.targetItem, ...kept] : kept;
    });

    setTimeout(() => {
      const won = Boolean(res.won);
      setResultText(
        won
          ? `Победа! Ты получил ${res.targetItem.name} (${res.targetItem.price} ₽)`
          : `Проигрыш. Кэшбек ${res.cashback.percent}% = ${res.cashback.amount} ₽`,
      );
      setSpinning(false);
      clearSelected();
    }, 4200);
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="glass ring-soft rounded-2xl p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-lg tracking-wide text-white">Апгрейд</div>
            <div className="text-sm text-white/60">Выбирай ставку, затем цель — шанс считается на сервере.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">Ставка: {betValue} ₽</span>
            <span className="pill">Цель: {targetItem?.price ?? 0} ₽</span>
            <span className="pill">x{multiplier ? multiplier.toFixed(2) : "—"}</span>
            <span className="pill">{targetItem ? `${chance.toFixed(1)}%` : "—"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_420px_1fr]">
        <div className="glass ring-soft rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Ставка (до 6)</div>
            <button onClick={() => clearSelected()} className="btn btn-ghost px-3 py-1.5 text-xs">
              Очистить
            </button>
          </div>
          <div className="max-h-[720px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            <div className="grid grid-cols-2 gap-3">
              {inventory.map((it) => (
                <ItemCard key={it.id} item={it} selected={selected.includes(it.id)} onSelect={() => toggle(it.id)} />
              ))}
            </div>
          </div>
          {inventory.length === 0 ? <div className="mt-3 text-xs text-white/55">Инвентарь пуст — открой кейс.</div> : null}
        </div>

        <div className="glass ring-soft rounded-2xl p-4">
          <div className="grid gap-3">
            <UpgradeWheel chance={chance || 1} spinning={spinning} stopRoll={stopRoll} />

            <div className="glass-card rounded-2xl p-3">
              <div className="text-xs text-white/55">Быстрый выбор</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[2, 5, 10].map((x) => (
                  <button
                    key={`m_${x}`}
                    onClick={() => applyPreset({ kind: "mult", value: x })}
                    disabled={spinning || betValue <= 0}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition disabled:opacity-60",
                      preset?.kind === "mult" && preset.value === x ? "bg-white text-black ring-white/30" : "bg-black/20 text-white/80 ring-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    x{x}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[75, 50, 35].map((p) => (
                  <button
                    key={`c_${p}`}
                    onClick={() => applyPreset({ kind: "chance", value: p })}
                    disabled={spinning || betValue <= 0}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition disabled:opacity-60",
                      preset?.kind === "chance" && preset.value === p ? "bg-white text-black ring-white/30" : "bg-black/20 text-white/80 ring-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-white/55">Нажми x/% — цель подберётся автоматически.</div>
            </div>

            <button onClick={play} disabled={spinning} className="btn btn-primary py-3">
              {spinning ? "Крутим…" : "Апгрейд"}
            </button>

            {resultText ? <div className="glass-card rounded-2xl p-3 text-sm ring-1 ring-white/10">{resultText}</div> : null}
          </div>
        </div>

        <div className="glass ring-soft rounded-2xl p-4">
          <div className="mb-3 text-sm font-semibold text-white">Цель</div>
          <div className="max-h-[720px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            <div className="grid grid-cols-2 gap-3">
              {targetOptions.map((it) => (
                <ItemCard key={it.id} item={it} selected={it.id === targetId} onSelect={() => setTarget(it.id)} />
              ))}
            </div>
          </div>
          {betValue > 0 ? <div className="mt-3 text-xs text-white/55">Показываю только цели дороже ставки.</div> : null}
        </div>
      </div>
    </div>
  );
}

