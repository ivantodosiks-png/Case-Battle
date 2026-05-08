"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";
import { SkinTile } from "@/components/upgrade/skin-tile";

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
          <div className="max-w-[420px]">
            <SkinTile skin={skin} selected />
          </div>
        ) : (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/25 ring-soft">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06), transparent 55%)",
              }}
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
