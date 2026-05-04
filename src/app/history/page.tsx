"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client/api";
import type { HistoryEntry } from "@/lib/game/types";
import { useSessionStore } from "@/store/sessionStore";

export default function HistoryPage() {
  const token = useSessionStore((s) => s.token);
  const applyUpdate = useSessionStore((s) => s.applyUpdate);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await apiGet<{ history: HistoryEntry[] }>("/api/history", token);
      if (res.token) applyUpdate({ token: res.token });
      if (alive) setHistory(res.history ?? []);
    }
    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, applyUpdate]);

  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl bg-panel/60 p-4 ring-1 ring-white/10">
        <div className="font-display text-lg tracking-wide text-white">История игр</div>
        <div className="text-sm text-white/60">Последние 100 событий.</div>
      </div>

      <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10">
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="rounded-2xl bg-card/50 p-3 ring-1 ring-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white">
                  {h.type === "case_open" ? "Кейс" : "Апгрейд"} · {h.won ? "WIN" : "LOSE"}
                </div>
                <div className="text-xs text-white/55">{new Date(h.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-black/20 px-3 py-2 ring-1 ring-white/10">
                  <div className="text-xs text-white/55">Bet</div>
                  <div className="font-semibold text-white">{h.betValue} ₽</div>
                </div>
                <div className="rounded-xl bg-black/20 px-3 py-2 ring-1 ring-white/10">
                  <div className="text-xs text-white/55">Result</div>
                  <div className="font-semibold text-white">{h.resultValue} ₽</div>
                </div>
              </div>
              {h.cashback ? <div className="mt-2 text-xs text-white/55">Cashback: {h.cashback} ₽</div> : null}
            </div>
          ))}
          {history.length === 0 ? <div className="text-sm text-white/60">История пока пустая.</div> : null}
        </div>
      </div>
    </div>
  );
}

