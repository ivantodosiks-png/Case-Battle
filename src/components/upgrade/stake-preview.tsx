"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function StakePreview() {
  const bet = useUpgradeStore((s) => s.bet);
  const catalog = useUpgradeStore((s) => s.catalog);

  if (!bet) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Текущий скин</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/25 ring-soft">
            <div
              className="absolute inset-0 opacity-70"
              style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.06), transparent 55%)" }}
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
        </CardContent>
      </Card>
    );
  }

  if (bet.type === "balance") {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Текущий скин</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white/6 ring-soft">
            <div
              className="absolute -inset-24 opacity-55 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.55), transparent 55%), radial-gradient(circle at 80% 60%, rgba(59,130,246,0.44), transparent 52%)",
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-2xl bg-black/25 px-4 py-2 text-center ring-soft">
                <div className="text-xs text-white/60">Ставка балансом</div>
                <div className="mt-1 text-2xl font-semibold text-white/92 tabular-nums">{fmtMoney(bet.amount)} ₽</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const skinId = bet.skinInstanceId.split("::")[1];
  const skin = catalog.find((s) => s.id === skinId) ?? SKIN_BY_ID.get(skinId);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Текущий скин</CardTitle>
      </CardHeader>
      <CardContent>
        {skin ? (
          <div className="w-full">
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

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/20">
                <Image src={skin.image} alt={skin.name} fill className="object-contain p-2 opacity-95" />
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
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/25 ring-soft">
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-sm text-white/45">Скин не найден</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
