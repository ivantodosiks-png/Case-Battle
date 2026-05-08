"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function StakePreview() {
  const bet = useUpgradeStore((s) => s.bet);

  const stake =
    !bet
      ? null
      : bet.type === "balance"
        ? { title: "Balance", subtitle: `$${fmtMoney(bet.amount)}`, image: null }
        : (() => {
            const skinId = bet.skinInstanceId.split("::")[1];
            const skin = SKIN_BY_ID.get(skinId);
            if (!skin) return { title: "Skin", subtitle: "Unknown", image: null };
            return { title: skin.name, subtitle: `$${fmtMoney(skin.price)} • ${skin.wear}`, image: skin.image };
          })();

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Choose items to upgrade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/25 ring-soft">
          <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.06), transparent 55%)" }} />
          {stake?.image ? (
            <Image src={stake.image} alt={stake.title} fill className="object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-sm text-white/45">{stake ? "Stake set" : "No stake selected"}</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="text-sm font-semibold text-white/90">{stake ? stake.title : "—"}</div>
            <div className="mt-0.5 text-xs text-white/55">
              {stake ? (
                <span className="break-words">{stake.subtitle}</span>
              ) : (
                "Set bet amount on the left slider, then spin."
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
