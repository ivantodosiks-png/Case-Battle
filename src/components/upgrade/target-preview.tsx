"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function TargetPreview() {
  const targetSkinId = useUpgradeStore((s) => s.targetSkinId);
  const skin = targetSkinId ? SKIN_BY_ID.get(targetSkinId) : undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Выбранный скин</CardTitle>
      </CardHeader>
      <CardContent>
        {skin ? (
          <div className="w-full max-w-[420px]">
            <div
              className="relative overflow-hidden rounded-2xl bg-white/6 ring-soft"
              style={{ boxShadow: `0 0 55px ${skin.gradient.from}22` }}
            >
              <div
                className="absolute -inset-24 opacity-55 blur-2xl"
                style={{
                  background: `radial-gradient(circle at 18% 20%, ${skin.gradient.from}55, transparent 55%),
                    radial-gradient(circle at 85% 70%, ${skin.gradient.to}44, transparent 52%)`,
                }}
              />

              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/20">
                <Image src={skin.image} alt={skin.name} fill className="object-contain p-3 opacity-95" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              </div>

              <div className="relative flex items-end justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white/92">{skin.name}</div>
                  <div className="mt-0.5 text-xs text-white/60">{skin.wear}</div>
                </div>
                <div className="shrink-0 rounded-lg bg-black/35 px-2 py-1 text-xs font-semibold text-white/92 ring-soft">
                  {fmtMoney(skin.price)} ₽
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/25 ring-soft">
            <div
              className="absolute inset-0 opacity-70"
              style={{ background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06), transparent 55%)" }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-sm text-white/45">Скин не выбран</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 truncate text-sm font-semibold text-white/90">—</div>
                <div className="text-xs font-semibold text-white/85">{fmtMoney(0)} ₽</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
