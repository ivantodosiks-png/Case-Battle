"use client";

import { Activity, Flame, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/ui/counter";
import { useUpgradeStore } from "@/store/use-upgrade-store";
import { fmtMoney } from "@/lib/money";

export function Topbar() {
  const balance = useUpgradeStore((s) => s.balance);
  const online = useUpgradeStore((s) => s.fakeOnline);
  const jackpot = useUpgradeStore((s) => s.fakeJackpot);

  return (
    <div className="px-3 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-b from-violet-500/80 to-violet-700/80 shadow-glow ring-soft" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white/95">CaseBattle</div>
            <div className="text-xs text-white/60">Upgrade (demo)</div>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Stat icon={<Activity className="h-4 w-4" />} label="Online">
            <Counter value={online} format={(v) => Math.round(v).toLocaleString()} durationMs={900} />
          </Stat>
          <Stat icon={<Flame className="h-4 w-4" />} label="Jackpot">
            $<Counter value={jackpot} format={(v) => Math.round(v).toLocaleString()} durationMs={900} />
          </Stat>
          <Stat icon={<Sparkles className="h-4 w-4" />} label="Balance">
            $<Counter value={balance} format={fmtMoney} />
          </Stat>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-3 px-4 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/6 ring-soft text-white/80">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>
        <div className="text-sm font-semibold text-white/92">{children}</div>
      </div>
    </Card>
  );
}

