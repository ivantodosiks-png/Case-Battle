"use client";

import { useMemo } from "react";
import { Percent } from "lucide-react";
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
  const multiplier = useUpgradeStore((s) => s.multiplier);
  const setMultiplier = useUpgradeStore((s) => s.setMultiplier);
  const targetReady = useUpgradeStore((s) => s.targetReady);
  const catalog = useUpgradeStore((s) => s.catalog);
  const setTargetSkinId = useUpgradeStore((s) => s.setTargetSkinId);
  const setTargetFromSkinPrice = useUpgradeStore((s) => s.setTargetFromSkinPrice);

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
            <div className="text-xs uppercase tracking-wider text-white/50">x / %</div>
            <div className="text-xs text-white/60">
              <span className="font-semibold text-white/85">{chancePct.toFixed(2)}%</span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-6 gap-1.5">
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              variant={Number(multiplier) === 2 ? "primary" : "secondary"}
              onClick={() => setMultiplier(2)}
              disabled={!bet}
            >
              x2
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              variant={Number(multiplier) === 5 ? "primary" : "secondary"}
              onClick={() => setMultiplier(5)}
              disabled={!bet}
            >
              x5
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              variant={Number(multiplier) === 10 ? "primary" : "secondary"}
              onClick={() => setMultiplier(10)}
              disabled={!bet}
            >
              x10
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              variant={Math.round(chancePct) === 75 ? "primary" : "secondary"}
              onClick={() => setMultiplier(1 / 0.75)}
              disabled={!bet}
            >
              75%
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              variant={Math.round(chancePct) === 50 ? "primary" : "secondary"}
              onClick={() => setMultiplier(2)}
              disabled={!bet}
            >
              50%
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              variant={Math.round(chancePct) === 30 ? "primary" : "secondary"}
              onClick={() => setMultiplier(1 / 0.3)}
              disabled={!bet}
            >
              30%
            </Button>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25 ring-soft">
            <div
              className="h-full bg-gradient-to-r from-emerald-400/70 via-sky-400/55 to-violet-400/70"
              style={{ width: `${clamp(chancePct, 0, 100)}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/55">
            <Percent className="h-3.5 w-3.5" /> x/% → цель и шанс
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/50">Скины</div>
            <div className="text-xs text-white/55">
              {!bet ? "Сначала выберите текущий скин" : targetReady ? "Выберите скин дороже вашего" : "Сначала выберите x/%"}
            </div>
          </div>
          <div className="mt-3 grid max-h-[calc(100vh-520px)] min-h-[220px] grid-cols-1 gap-2 overflow-auto pr-1">
            {catalog
              .slice()
              .sort((a, b) => b.price - a.price)
              .map((skin) => (
                <div
                  key={skin.id}
                  className={
                    !bet || !targetReady
                      ? "pointer-events-none opacity-40"
                      : skin.price <= stakeValue
                        ? "pointer-events-none opacity-30"
                        : ""
                  }
                  onClick={() => {
                    if (!bet) return toast.error("Выберите текущий скин");
                    if (!targetReady) return;
                    if (skin.price <= stakeValue) return;
                    setTargetSkinId(skin.id);
                    setTargetFromSkinPrice(skin.price);
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
