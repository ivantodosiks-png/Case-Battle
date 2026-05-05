"use client";

import { useMemo } from "react";
import { useSessionStore } from "@/store/sessionStore";

export default function ProfilePage() {
  const state = useSessionStore((s) => s.state);

  const avatarUrl = useMemo(() => {
    const seed = state?.user.avatarSeed ?? "skinforge";
    return `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
  }, [state?.user.avatarSeed]);

  return (
    <div className="space-y-4 pb-10">
      <div className="glass ring-soft rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="avatar" className="h-full w-full" />
          </div>
          <div>
            <div className="font-display text-lg tracking-wide text-white">{state?.user.username ?? "demo_player"}</div>
            <div className="text-sm text-white/60">Демо-профиль (signed state)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Stat title="Баланс" value={`${state?.balance ?? 0} ₽`} />
        <Stat title="Открыто кейсов" value={`${state?.stats.casesOpened ?? 0}`} />
        <Stat title="Апгрейдов" value={`${state?.stats.upgradesPlayed ?? 0}`} />
        <Stat title="Лучший дроп" value={`${state?.stats.bestDropValue ?? 0} ₽`} />
        <Stat title="Сумма выигрышей" value={`${state?.stats.totalWinningsValue ?? 0} ₽`} />
        <Stat title="В инвентаре" value={`${state?.inventoryItemIds.length ?? 0}`} />
      </div>

      <div className="glass ring-soft rounded-2xl p-4">
        <div className="text-sm font-semibold text-white">О проекте</div>
        <div className="mt-2 text-sm text-white/60">
          Это демо без реальных скинов/брендов. Состояние хранится в localStorage, но защищено подписью сервера (HMAC).
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="glass ring-soft rounded-2xl p-4">
      <div className="text-xs text-white/55">{title}</div>
      <div className="mt-1 font-display text-xl text-white">{value}</div>
    </div>
  );
}

