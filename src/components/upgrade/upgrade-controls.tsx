"use client";

import { useMemo } from "react";
import { Percent, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkinCard } from "@/components/upgrade/skin-card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function UpgradeControls() {
  const bet = useUpgradeStore((s) => s.bet);
  const multiplier = useUpgradeStore((s) => s.multiplier);
  const setMultiplier = useUpgradeStore((s) => s.setMultiplier);
  const clearBet = useUpgradeStore((s) => s.clearBet);
  const setBetBalance = useUpgradeStore((s) => s.setBetBalance);

  const chance = useMemo(() => clamp(1 / Number(multiplier || 2), 0.05, 0.95), [multiplier]);

  const stakeValue = useMemo(() => {
    if (!bet) return 0;
    if (bet.type === "balance") return bet.amount;
    const skinId = bet.skinInstanceId.split("::")[1];
    return SKIN_BY_ID.get(skinId)?.price ?? 0;
  }, [bet]);

  const payoutValue = useMemo(() => Math.round(stakeValue * multiplier * 100) / 100, [stakeValue, multiplier]);

  const previewRewardSkin = useMemo(() => {
    const wanted = payoutValue;
    const close = Array.from(SKIN_BY_ID.values())
      .filter((s) => s.price <= wanted * 1.02)
      .sort((a, b) => Math.abs(wanted - a.price) - Math.abs(wanted - b.price))[0];
    return close;
  }, [payoutValue]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Upgrade</CardTitle>
        <Button size="sm" variant="ghost" onClick={clearBet} disabled={!bet}>
          Clear bet
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/50">Stake</div>
            <div className="text-xs text-white/60">
              ${fmtMoney(stakeValue)} → ${fmtMoney(payoutValue)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant={bet?.type === "skin" ? "primary" : "secondary"}
              onClick={() => toast.message("Select an item", { description: "Pick a skin from the left panel." })}
            >
              Skin
            </Button>
            <Button
              variant={bet?.type === "balance" ? "primary" : "secondary"}
              onClick={() => setBetBalance(bet?.type === "balance" ? bet.amount : 25)}
            >
              Balance
            </Button>
          </div>

          {bet?.type === "balance" ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>Amount</span>
                <span className="font-semibold text-white/85">${fmtMoney(bet.amount)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                step={1}
                value={bet.amount}
                onChange={(e) => setBetBalance(Number(e.target.value))}
                className="mt-2 w-full accent-violet-400"
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Button size="sm" variant="secondary" onClick={() => setBetBalance(25)}>
                  $25
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setBetBalance(100)}>
                  $100
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setBetBalance(250)}>
                  $250
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-white/50">Multiplier</div>
            <div className="text-xs text-white/60">
              <span className="font-semibold text-white/85">{Math.round(chance * 100)}%</span> win chance
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button
              variant={Number(multiplier) === 2 ? "primary" : "secondary"}
              onClick={() => setMultiplier(2)}
            >
              x2
            </Button>
            <Button
              variant={Number(multiplier) === 5 ? "primary" : "secondary"}
              onClick={() => setMultiplier(5)}
            >
              x5
            </Button>
            <Button
              variant={Number(multiplier) === 10 ? "primary" : "secondary"}
              onClick={() => setMultiplier(10)}
            >
              x10
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button
              variant={Math.round(chance * 100) === 75 ? "primary" : "secondary"}
              onClick={() => setMultiplier(1 / 0.75)}
              title="75% chance"
            >
              75%
            </Button>
            <Button
              variant={Math.round(chance * 100) === 50 ? "primary" : "secondary"}
              onClick={() => setMultiplier(2)}
              title="50% chance"
            >
              50%
            </Button>
            <Button
              variant={Math.round(chance * 100) === 30 ? "primary" : "secondary"}
              onClick={() => setMultiplier(1 / 0.3)}
              title="30% chance"
            >
              30%
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-white/55">
            <div className="flex items-center gap-2">
              <Percent className="h-3.5 w-3.5" />
              Custom chances clamp to 5–95% (demo).
            </div>
            <button
              className="text-white/70 hover:text-white"
              onClick={() => toast.message("Tip", { description: "Animation varies each spin, but result is precomputed." })}
            >
              Why?
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
              <Sparkles className="h-4 w-4 text-violet-300" /> Potential win
            </div>
            <div className="text-sm font-semibold text-white/92">${fmtMoney(payoutValue)}</div>
          </div>

          <div className="mt-3">
            {previewRewardSkin ? (
              <SkinCard
                skin={previewRewardSkin}
                footer={
                  <div className="text-[11px] text-white/55">
                    If no suitable skin exists, payout is credited to balance.
                  </div>
                }
              />
            ) : (
              <div className="rounded-2xl bg-black/25 p-4 text-sm text-white/60 ring-soft">
                No skin fits this payout. Balance credit fallback.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
