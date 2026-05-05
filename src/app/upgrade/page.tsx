"use client";

import { useEffect, useMemo, useState } from "react";
import type { Item, SignedState } from "@/lib/game/types";
import { apiGet, apiPost } from "@/lib/client/api";
import { useSessionStore } from "@/store/sessionStore";
import { type UpgradeMode, useUpgradeStore } from "@/store/upgradeStore";
import { ItemCard } from "@/components/items/ItemCard";
import { UpgradeWheel } from "@/components/upgrade/UpgradeWheel";

type Quote = {
  targetItem: Item;
  chance: number;
  multiplier: number;
  cashbackRange: { minPercent: number; maxPercent: number; minAmount: number; maxAmount: number };
};

export default function UpgradePage() {
  const token = useSessionStore((s) => s.token);
  const applyUpdate = useSessionStore((s) => s.applyUpdate);

  const betItemId = useUpgradeStore((s) => s.betItemId);
  const setBetItem = useUpgradeStore((s) => s.setBetItem);
  const mode = useUpgradeStore((s) => s.mode);
  const setMode = useUpgradeStore((s) => s.setMode);

  const [inventory, setInventory] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Item[]>([]);

  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string>("");

  const [spinning, setSpinning] = useState(false);
  const [stopRoll, setStopRoll] = useState<number | null>(null);
  const [result, setResult] = useState<null | { status: "win" | "lose"; text: string }>(null);

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

  const betItem = useMemo(() => inventory.find((x) => x.id === betItemId) ?? null, [inventory, betItemId]);

  useEffect(() => {
    let alive = true;
    async function runQuote() {
      setQuoteError("");
      setQuote(null);
      if (!betItemId) return;
      setQuoting(true);
      try {
        const res = await apiPost<{ success: boolean; token?: string } & Quote>("/api/upgrader/quote", token, { betItemId, mode });
        if (res.token) applyUpdate({ token: res.token });
        if (!alive) return;
        if (!res.targetItem) throw new Error("bad quote");
        setQuote({
          targetItem: res.targetItem,
          chance: res.chance,
          multiplier: res.multiplier,
          cashbackRange: res.cashbackRange,
        });
      } catch {
        if (!alive) return;
        setQuoteError("Не удалось подобрать цель. Попробуй другой предмет/режим.");
      } finally {
        if (alive) setQuoting(false);
      }
    }
    runQuote();
    return () => {
      alive = false;
    };
  }, [betItemId, mode, token, applyUpdate]);

  const modeLabel = (m: UpgradeMode) => (m.kind === "mult" ? `x${m.value}` : `${m.value}%`);

  async function play() {
    if (spinning) return;
    if (!betItemId || !betItem) return alert("Выбери скин из инвентаря.");
    if (!quote) return alert("Нет цели для апгрейда.");

    setSpinning(true);
    setStopRoll(null);
    setResult(null);

    type PlayRes = {
      success: boolean;
      token: string;
      state: SignedState;
      won: boolean;
      chance: number;
      roll: number;
      targetItem: Item;
      betItem: Item;
      cashback: { percent: number; amount: number };
      balance: number;
    };

    let res: PlayRes;
    try {
      res = await apiPost<PlayRes>("/api/upgrader/play", token, { betItemId, mode });
    } catch {
      setSpinning(false);
      alert("Апгрейд не удался. Проверь выбор и попробуй снова.");
      return;
    }

    applyUpdate({ token: res.token, state: res.state });
    setStopRoll(res.roll);

    // Sync inventory immediately
    setInventory((prev) => {
      const kept = prev.filter((it) => it.id !== betItemId);
      return res.won ? [res.targetItem, ...kept] : kept;
    });

    setTimeout(() => {
      const text = res.won
        ? `Победа! Ты получил ${res.targetItem.name} (${res.targetItem.price} ₽)`
        : `Проигрыш. Кэшбек ${res.cashback.percent}% = ${res.cashback.amount} ₽`;
      setResult({ status: res.won ? "win" : "lose", text });
      setSpinning(false);
      setBetItem(null);
    }, 4200);
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="glass ring-soft rounded-2xl p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-lg tracking-wide text-white">Апгрейдер</div>
            <div className="text-sm text-white/60">Выбери скин справа, выбери режим, затем запускай апгрейд.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">Режим: {modeLabel(mode)}</span>
            <span className="pill">Шанс: {quote ? `${quote.chance.toFixed(1)}%` : "—"}</span>
            <span className="pill">Выигрыш: {quote ? `${quote.targetItem.price} ₽` : "—"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[520px_1fr]">
        <div className="glass ring-soft rounded-2xl p-4">
          <div className="grid gap-3">
            <UpgradeWheel chance={quote?.chance ?? 1} spinning={spinning} stopRoll={stopRoll} />

            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card rounded-2xl p-3">
                <div className="text-xs text-white/55">Твой скин</div>
                <div className="mt-1 text-sm font-semibold text-white">{betItem ? betItem.name : "—"}</div>
                <div className="mt-1 text-xs text-white/60">{betItem ? `${betItem.price} ₽` : ""}</div>
              </div>
              <div className="glass-card rounded-2xl p-3">
                <div className="text-xs text-white/55">Цель</div>
                <div className="mt-1 text-sm font-semibold text-white">{quote ? quote.targetItem.name : "—"}</div>
                <div className="mt-1 text-xs text-white/60">{quote ? `${quote.targetItem.price} ₽` : ""}</div>
              </div>
              <div className="glass-card rounded-2xl p-3">
                <div className="text-xs text-white/55">Множитель</div>
                <div className="mt-1 font-display text-xl text-white">{quote ? `x${quote.multiplier.toFixed(2)}` : "—"}</div>
              </div>
              <div className="glass-card rounded-2xl p-3">
                <div className="text-xs text-white/55">Cashback</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {quote ? `${quote.cashbackRange.minPercent}–${quote.cashbackRange.maxPercent}%` : "—"}
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {quote ? `${quote.cashbackRange.minAmount}–${quote.cashbackRange.maxAmount} ₽` : ""}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3">
              <div className="text-xs text-white/55">Режим апгрейда</div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {([2, 5, 10] as const).map((x) => (
                  <button
                    key={`m_${x}`}
                    onClick={() => setMode({ kind: "mult", value: x })}
                    disabled={spinning}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition disabled:opacity-60",
                      mode.kind === "mult" && mode.value === x ? "bg-white text-black ring-white/30" : "bg-black/20 text-white/80 ring-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    x{x}
                  </button>
                ))}
                {([75, 50, 30] as const).map((p) => (
                  <button
                    key={`c_${p}`}
                    onClick={() => setMode({ kind: "chance", value: p })}
                    disabled={spinning}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition disabled:opacity-60",
                      mode.kind === "chance" && mode.value === p ? "bg-white text-black ring-white/30" : "bg-black/20 text-white/80 ring-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-white/55">Цель подбирается автоматически на сервере.</div>
            </div>

            {quoteError ? <div className="glass-card rounded-2xl p-3 text-sm text-red-200 ring-1 ring-red-500/20">{quoteError}</div> : null}

            <button
              onClick={play}
              disabled={spinning || !betItemId || quoting || !quote}
              className="btn btn-primary py-3"
            >
              {spinning ? "Крутим…" : quoting ? "Подбираем…" : "Апгрейд"}
            </button>

            {result ? (
              <div
                className={[
                  "glass-card rounded-2xl p-3 text-sm ring-1",
                  result.status === "win" ? "ring-emerald-400/25" : "ring-red-500/20",
                ].join(" ")}
              >
                {result.text}
              </div>
            ) : null}
          </div>
        </div>

        <div className="glass ring-soft rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Инвентарь</div>
            <div className="pill">{inventory.length} шт</div>
          </div>

          <div className="max-h-[860px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {inventory.map((it) => (
                <ItemCard key={it.id} item={it} selected={it.id === betItemId} onSelect={() => setBetItem(it.id === betItemId ? null : it.id)} />
              ))}
            </div>
          </div>

          {!catalog.length ? <div className="mt-3 text-xs text-white/55">Загрузка…</div> : null}
          {inventory.length === 0 ? <div className="mt-3 text-xs text-white/55">Инвентарь пуст — открой кейс.</div> : null}
        </div>
      </div>
    </div>
  );
}

