"use client";

import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/ui/counter";
import { useUpgradeStore } from "@/store/use-upgrade-store";
import { fmtMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Topbar() {
  const balance = useUpgradeStore((s) => s.balance);
  const lastBonusAt = useUpgradeStore((s) => s.lastBonusAt);
  const grantBonus = useUpgradeStore((s) => s.grantBonus);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNowTs(Date.now()), 400);
    return () => window.clearInterval(t);
  }, []);

  const cdMs = 60_000;
  const remaining = Math.max(0, cdMs - (nowTs - (lastBonusAt || 0)));
  const canBonus = remaining === 0;

  return (
    <div className="px-3 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-b from-violet-500/80 to-violet-700/80 shadow-glow ring-soft" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white/95">CaseBattle</div>
            <div className="text-xs text-white/60">Апгрейд</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={canBonus ? "primary" : "secondary"}
            disabled={!canBonus}
            onClick={() => {
              grantBonus();
            }}
          >
            +500{canBonus ? "" : ` (${Math.ceil(remaining / 1000)}s)`}
          </Button>

          <Card className="flex items-center gap-3 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/6 ring-soft text-white/80">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Баланс</div>
            <div className="text-sm font-semibold text-white/92">
              <Counter value={balance} format={fmtMoney} /> ₽
            </div>
          </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
