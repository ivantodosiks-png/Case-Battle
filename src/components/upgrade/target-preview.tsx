"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function TargetPreview() {
  const targetSkinId = useUpgradeStore((s) => s.targetSkinId);
  const targetReady = useUpgradeStore((s) => s.targetReady);
  const bet = useUpgradeStore((s) => s.bet);
  const multiplier = useUpgradeStore((s) => s.multiplier);

  const skin = targetSkinId ? SKIN_BY_ID.get(targetSkinId) : undefined;

  const hint = !bet
    ? "Set a stake first."
    : !targetReady
      ? "Pick x2/x5/x10 or % to calculate target."
      : skin
        ? "Target is calculated from stake × multiplier."
        : "No matching skin — balance payout fallback.";

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Choose weapon you want to receive</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/25 ring-soft">
          <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06), transparent 55%)" }} />
          {skin?.image ? (
            <Image src={skin.image} alt={skin.name} fill className="object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-sm text-white/45">{targetReady ? "No target skin" : "Waiting…"}</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-semibold text-white/90">
                {skin ? skin.name : targetReady ? `x${Number(multiplier).toFixed(2)}` : "—"}
              </div>
              {skin ? <div className="text-xs font-semibold text-white/85">${fmtMoney(skin.price)}</div> : null}
            </div>
            <div className="mt-0.5 text-xs text-white/55">{hint}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

