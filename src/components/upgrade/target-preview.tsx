"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function TargetPreview() {
  const targetSkinId = useUpgradeStore((s) => s.targetSkinId);
  const bet = useUpgradeStore((s) => s.bet);
  const recomputeTarget = useUpgradeStore((s) => s.recomputeTarget);
  const skin = targetSkinId ? SKIN_BY_ID.get(targetSkinId) : undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Выбранный скин</CardTitle>
      </CardHeader>
      <CardContent>
        {bet ? (
          <div className="mb-3">
            <button
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-left text-xs text-white/65 ring-soft hover:bg-white/6"
              onClick={() => recomputeTarget()}
            >
              Пересчитать цель по x / %
            </button>
          </div>
        ) : null}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/25 ring-soft">
          {skin ? (
            <div
              className="absolute -inset-24 opacity-60 blur-2xl"
              style={{
                background: `radial-gradient(circle at 20% 25%, ${skin.gradient.from}66, transparent 55%),
                  radial-gradient(circle at 80% 60%, ${skin.gradient.to}55, transparent 52%)`,
              }}
            />
          ) : null}
          <div
            className="absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06), transparent 55%)" }}
          />
          {skin?.image ? (
            <div className="absolute inset-0 pb-14">
              <div className="relative h-full w-full p-2">
                <Image
                  src={skin.image}
                  alt={skin.name}
                  fill
                  className="object-contain opacity-100 brightness-125 contrast-125 drop-shadow-[0_18px_34px_rgba(0,0,0,0.75)]"
                />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-sm text-white/45">Скин не выбран</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-semibold text-white/90">{skin ? skin.name : "—"}</div>
              {skin ? <div className="text-xs font-semibold text-white/85">{fmtMoney(skin.price)} ₽</div> : null}
            </div>
            {skin ? <div className="mt-0.5 text-xs text-white/55">{skin.wear}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
