"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkinCard } from "@/components/upgrade/skin-card";
import { useUpgradeStore } from "@/store/use-upgrade-store";
import { SKIN_BY_ID } from "@/lib/skins";

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function UpgradeControls() {
  const bet = useUpgradeStore((s) => s.bet);
  const clearBet = useUpgradeStore((s) => s.clearBet);
  const targetSkinId = useUpgradeStore((s) => s.targetSkinId);
  const catalog = useUpgradeStore((s) => s.catalog);
  const setTargetSkinId = useUpgradeStore((s) => s.setTargetSkinId);

  const stakeValue = useMemo(() => {
    if (!bet) return 0;
    if (bet.type === "balance") return bet.amount;
    return SKIN_BY_ID.get(bet.skinInstanceId.split("::")[1])?.price ?? 0;
  }, [bet]);

  const targetValue = useMemo(() => {
    if (!targetSkinId) return 0;
    return SKIN_BY_ID.get(targetSkinId)?.price ?? 0;
  }, [targetSkinId]);

  const chancePct = useMemo(() => {
    if (!stakeValue || !targetValue) return 0;
    return clamp((stakeValue / targetValue) * 100, 0, 100);
  }, [stakeValue, targetValue]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Цель</CardTitle>
        <Button size="sm" variant="ghost" onClick={clearBet} disabled={!bet}>
          Сброс
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/50">Шанс апгрейда</div>
            <div className="text-xs font-semibold text-white/85">{chancePct.toFixed(2)}%</div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/25 ring-soft">
            <div
              className="h-full bg-gradient-to-r from-emerald-400/70 via-sky-400/55 to-violet-400/70"
              style={{ width: `${clamp(chancePct, 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/50">Скины</div>
            <div className="text-xs text-white/55">{bet ? "Выберите скин дороже вашего" : "Сначала выберите текущий скин"}</div>
          </div>
          <div className="mt-3 grid max-h-[calc(100vh-520px)] min-h-[220px] grid-cols-1 gap-2 overflow-auto pr-1">
            {catalog
              .slice()
              .sort((a, b) => b.price - a.price)
              .map((skin) => (
                <div
                  key={skin.id}
                  className={
                    !bet
                      ? "pointer-events-none opacity-40"
                      : skin.price <= stakeValue
                        ? "pointer-events-none opacity-30"
                        : ""
                  }
                  onClick={() => {
                    if (!bet) return toast.error("Выберите текущий скин");
                    if (skin.price <= stakeValue) return;
                    setTargetSkinId(skin.id);
                  }}
                >
                  <SkinCard skin={skin} selected={skin.id === targetSkinId} />
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
