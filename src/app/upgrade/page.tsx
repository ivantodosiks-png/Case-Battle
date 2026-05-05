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

const modeButtons: UpgradeMode[] = [
  { kind: "mult", value: 2 },
  { kind: "mult", value: 5 },
  { kind: "mult", value: 10 },
  { kind: "chance", value: 75 },
  { kind: "chance", value: 50 },
  { kind: "chance", value: 30 },
];

function modeKey(m: UpgradeMode) {
  return `${m.kind}:${m.value}`;
}

function modeLabel(m: UpgradeMode) {
  return m.kind === "mult" ? `x${m.value}` : `${m.value}%`;
}

export default function UpgradePage() {
  const token = useSessionStore((s) => s.token);
  const applyUpdate = useSessionStore((s) => s.applyUpdate);

  const betItemId = useUpgradeStore((s) => s.betItemId);
  const setBetItem = useUpgradeStore((s) => s.setBetItem);
  const targetItemId = useUpgradeStore((s) => s.targetItemId);
  const setTargetItem = useUpgradeStore((s) => s.setTargetItem);
  const mode = useUpgradeStore((s) => s.mode);
  const setMode = useUpgradeStore((s) => s.setMode);

  const [inventory, setInventory] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Item[]>([]);

  const [targetQuery, setTargetQuery] = useState("");
  const [targetMin, setTargetMin] = useState<number>(0);
  const [targetMax, setTargetMax] = useState<number>(999999);

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
      if (!alive) return;
      setInventory(inv.items ?? []);
      setCatalog(it.items ?? []);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, applyUpdate]);

  const betItem = useMemo(() => inventory.find((x) => x.id === betItemId) ?? null, [inventory, betItemId]);
  const targetItemLocal = useMemo(() => catalog.find((x) => x.id === targetItemId) ?? null, [catalog, targetItemId]);

  const filteredTargets = useMemo(() => {
    const q = targetQuery.trim().toLowerCase();
    return catalog
      .filter((it) => (q ? it.name.toLowerCase().includes(q) : true))
      .filter((it) => it.price >= targetMin && it.price <= targetMax)
      .sort((a, b) => a.price - b.price);
  }, [catalog, targetQuery, targetMin, targetMax]);

  useEffect(() => {
    let alive = true;
    async function runQuote() {
      setQuoteError("");
      setQuote(null);
      if (!betItemId || !targetItemId) return;
      setQuoting(true);
      try {
        const res = await apiPost<{ success: boolean; token?: string } & Quote>("/api/upgrader/quote", token, {
          betItemId,
          targetItemId,
          mode,
        });
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
        setQuoteError("Цель не подходит под выбранный режим. Выбери другую цель или режим.");
      } finally {
        if (alive) setQuoting(false);
      }
    }
    runQuote();
    return () => {
      alive = false;
    };
  }, [betItemId, targetItemId, mode, token, applyUpdate]);

  async function play() {
    if (spinning) return;
    if (!betItemId || !betItem) return alert("Выбери предмет слева.");
    if (!targetItemId || !targetItemLocal) return alert("Выбери цель справа.");
    if (!quote) return alert("Нет валидной пары ставка/цель/режим.");

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
      res = await apiPost<PlayRes>("/api/upgrader/play", token, { betItemId, targetItemId, mode });
    } catch {
      setSpinning(false);
      alert("Апгрейд не удался. Проверь выбор и попробуй снова.");
      return;
    }

    applyUpdate({ token: res.token, state: res.state });
    setStopRoll(res.roll);

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
      <div className="relative rounded-2xl bg-black/25 p-4 ring-1 ring-white/10 ring-soft">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(900px_320px_at_50%_0%,rgba(59,130,246,0.22),transparent_62%)]" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <div className="font-display text-xl tracking-widest text-white">МОДЕРНИЗАЦИЯ ОРУЖИЯ</div>
          <div className="text-sm text-white/55">Выбери предмет, цель и режим — результат считает сервер.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_460px_1fr]">
        {/* Left bet panel */}
        <div className="glass ring-soft rounded-2xl p-4">
          <div className="mb-3 text-center text-sm text-white/70">Выберите предмет на апгрейд</div>
          <div className="grid place-items-center">
            <div className="w-full max-w-[520px] rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
              {betItem ? (
                <div className="flex items-center gap-4">
                  <div
                    className="h-20 w-28 flex-none rounded-2xl ring-1 ring-white/10"
                    style={{ background: `linear-gradient(135deg, ${betItem.image.from}, ${betItem.image.to})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{betItem.name}</div>
                    <div className="mt-1 text-xs text-white/60">{betItem.price} ₽</div>
                    <button onClick={() => setBetItem(null)} disabled={spinning} className="mt-3 btn btn-ghost px-3 py-2 text-xs">
                      Снять выбор
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid place-items-center py-10 text-sm text-white/50">Выбери предмет снизу</div>
              )}
            </div>
          </div>
        </div>

        {/* Wheel center */}
        <div className="glass ring-soft rounded-2xl p-4">
          <div className="grid place-items-center gap-3">
            <UpgradeWheel chance={quote?.chance ?? 1} spinning={spinning} stopRoll={stopRoll} />
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="pill">Режим: {modeLabel(mode)}</span>
              <span className="pill">Шанс: {quote ? `${quote.chance.toFixed(1)}%` : "—"}</span>
              <span className="pill">x{quote ? quote.multiplier.toFixed(2) : "—"}</span>
            </div>

            <button onClick={play} disabled={spinning || quoting || !betItemId || !targetItemId || !quote} className="btn btn-primary w-full max-w-[320px] py-3">
              {spinning ? "ПРОКРУТКА…" : quoting ? "ПРОВЕРКА…" : "ПРОКАЧАТЬ"}
            </button>

            {quoteError ? <div className="w-full rounded-xl bg-red-500/10 p-3 text-sm text-red-100 ring-1 ring-red-500/20">{quoteError}</div> : null}
            {result ? (
              <div className={["w-full rounded-xl p-3 text-sm ring-1", result.status === "win" ? "bg-emerald-500/10 text-emerald-100 ring-emerald-400/20" : "bg-red-500/10 text-red-100 ring-red-500/20"].join(" ")}>
                {result.text}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right target panel */}
        <div className="glass ring-soft rounded-2xl p-4">
          <div className="mb-3 text-center text-sm text-white/70">Выберите оружие, которое хотите получить</div>
          <div className="grid place-items-center">
            <div className="w-full max-w-[520px] rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
              {targetItemLocal ? (
                <div className="flex items-center gap-4">
                  <div
                    className="h-20 w-28 flex-none rounded-2xl ring-1 ring-white/10"
                    style={{ background: `linear-gradient(135deg, ${targetItemLocal.image.from}, ${targetItemLocal.image.to})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{targetItemLocal.name}</div>
                    <div className="mt-1 text-xs text-white/60">{targetItemLocal.price} ₽</div>
                    <button onClick={() => setTargetItem(null)} disabled={spinning} className="mt-3 btn btn-ghost px-3 py-2 text-xs">
                      Снять выбор
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid place-items-center py-10 text-sm text-white/50">Выбери цель снизу</div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
            <div className="mb-2 text-xs text-white/55">Режим апгрейда</div>
            <div className="grid grid-cols-6 gap-2">
              {modeButtons.map((m) => {
                const active = modeKey(m) === modeKey(mode);
                return (
                  <button
                    key={modeKey(m)}
                    onClick={() => setMode(m)}
                    disabled={spinning}
                    className={[
                      "rounded-xl px-2 py-2 text-xs font-semibold ring-1 transition disabled:opacity-60",
                      active ? "bg-accent text-black ring-orange-400/30" : "bg-black/25 text-white/80 ring-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    {modeLabel(m)}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-[11px] text-white/55">Цель должна соответствовать режиму (проверяется сервером).</div>
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="glass ring-soft rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Мои предметы ({inventory.length})</div>
            <div className="text-xs text-white/55">выбери 1 предмет слева</div>
          </div>
          <div className="max-h-[460px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {inventory.map((it) => (
                <ItemCard key={it.id} item={it} selected={it.id === betItemId} onSelect={() => setBetItem(it.id === betItemId ? null : it.id)} />
              ))}
            </div>
          </div>
          {inventory.length === 0 ? <div className="mt-3 text-sm text-white/55">Инвентарь пуст — открой кейс.</div> : null}
        </div>

        <div className="glass ring-soft rounded-2xl p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-white">Выберите предмет</div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder="Поиск…"
                className="h-9 w-full rounded-xl bg-white/5 px-3 text-sm text-white placeholder:text-white/35 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/15 sm:w-[220px]"
              />
              <input
                value={targetMin}
                onChange={(e) => setTargetMin(Number(e.target.value || 0))}
                type="number"
                className="h-9 w-24 rounded-xl bg-white/5 px-2 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                placeholder="от"
              />
              <input
                value={targetMax}
                onChange={(e) => setTargetMax(Number(e.target.value || 0))}
                type="number"
                className="h-9 w-24 rounded-xl bg-white/5 px-2 text-sm text-white ring-1 ring-white/10 focus:outline-none"
                placeholder="до"
              />
            </div>
          </div>

          <div className="max-h-[460px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredTargets.map((it) => (
                <ItemCard key={it.id} item={it} selected={it.id === targetItemId} onSelect={() => setTargetItem(it.id === targetItemId ? null : it.id)} />
              ))}
            </div>
          </div>

          {catalog.length === 0 ? <div className="mt-3 text-sm text-white/55">Загрузка…</div> : null}
        </div>
      </div>

      {quote ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="glass ring-soft rounded-2xl p-4">
            <div className="text-xs text-white/55">Ставка</div>
            <div className="mt-1 font-display text-xl text-white">{betItem ? `${betItem.price} ₽` : "—"}</div>
          </div>
          <div className="glass ring-soft rounded-2xl p-4">
            <div className="text-xs text-white/55">Выигрыш</div>
            <div className="mt-1 font-display text-xl text-white">{quote ? `${quote.targetItem.price} ₽` : "—"}</div>
          </div>
          <div className="glass ring-soft rounded-2xl p-4">
            <div className="text-xs text-white/55">Cashback</div>
            <div className="mt-1 font-display text-xl text-white">
              {quote.cashbackRange.minPercent}–{quote.cashbackRange.maxPercent}%
            </div>
            <div className="mt-1 text-xs text-white/55">
              {quote.cashbackRange.minAmount}–{quote.cashbackRange.maxAmount} ₽
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

