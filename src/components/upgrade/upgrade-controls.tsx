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
  const multiplier = useUpgradeStore((s) => s.multiplier);
  const setMultiplier = useUpgradeStore((s) => s.setMultiplier);
  const clearBet = useUpgradeStore((s) => s.clearBet);
  const targetSkinId = useUpgradeStore((s) => s.targetSkinId);
  const targetReady = useUpgradeStore((s) => s.targetReady);
  const catalog = useUpgradeStore((s) => s.catalog);
  const setTargetSkinId = useUpgradeStore((s) => s.setTargetSkinId);
  const setTargetFromSkinPrice = useUpgradeStore((s) => s.setTargetFromSkinPrice);

  const chance = useMemo(() => clamp(1 / Number(multiplier || 2), 0.05, 0.95), [multiplier]);
  const stakeValue = useMemo(() => {
    if (!bet) return 0;
    if (bet.type === "balance") return bet.amount;
    return SKIN_BY_ID.get(bet.skinInstanceId.split("::")[1])?.price ?? 0;
  }, [bet]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Target</CardTitle>
        <Button size="sm" variant="ghost" onClick={clearBet} disabled={!bet}>
          Clear
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/50">x / %</div>
            <div className="text-xs text-white/60">
              <span className="font-semibold text-white/85">{Math.round(chance * 100)}%</span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <Button size="sm" variant={Number(multiplier) === 2 ? "primary" : "secondary"} onClick={() => setMultiplier(2)}>
              x2
            </Button>
            <Button size="sm" variant={Number(multiplier) === 5 ? "primary" : "secondary"} onClick={() => setMultiplier(5)}>
              x5
            </Button>
            <Button size="sm" variant={Number(multiplier) === 10 ? "primary" : "secondary"} onClick={() => setMultiplier(10)}>
              x10
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <Button size="sm" variant={Math.round(chance * 100) === 75 ? "primary" : "secondary"} onClick={() => setMultiplier(1 / 0.75)}>
              75%
            </Button>
            <Button size="sm" variant={Math.round(chance * 100) === 50 ? "primary" : "secondary"} onClick={() => setMultiplier(2)}>
              50%
            </Button>
            <Button size="sm" variant={Math.round(chance * 100) === 30 ? "primary" : "secondary"} onClick={() => setMultiplier(1 / 0.3)}>
              30%
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
            <Percent className="h-3.5 w-3.5" /> Pick x/% to calculate the target item.
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/50">Skins</div>
            <div className="text-xs text-white/55">{targetReady ? "Select" : "Select x/% first"}</div>
          </div>
          <div className="mt-3 grid max-h-[calc(100vh-520px)] min-h-[220px] grid-cols-1 gap-2 overflow-auto pr-1">
            {catalog
              .slice()
              .sort((a, b) => b.price - a.price)
              .map((skin) => (
                <div
                  key={skin.id}
                  className={
                    !targetReady
                      ? "pointer-events-none opacity-40"
                      : skin.price < stakeValue
                        ? "pointer-events-none opacity-30"
                        : ""
                  }
                  onClick={() => {
                    if (!bet) return toast.error("Set a stake first");
                    if (skin.price < stakeValue) return;
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
