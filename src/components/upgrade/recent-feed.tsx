"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function RecentFeed() {
  const recent = useUpgradeStore((s) => s.recent);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Последние апгрейды</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {recent.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white/4 p-4 text-sm text-white/60 ring-soft"
              >
                Пока нет апгрейдов.
              </motion.div>
            ) : null}

            {recent.map((r) => {
              const reward = r.rewardSkinId ? SKIN_BY_ID.get(r.rewardSkinId) : undefined;
              const target = r.targetSkinId ? SKIN_BY_ID.get(r.targetSkinId) : undefined;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2 ring-soft"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-2xl ring-soft"
                      style={{
                        background: r.win
                          ? "linear-gradient(180deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))"
                          : "linear-gradient(180deg, rgba(244,63,94,0.22), rgba(244,63,94,0.08))",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {r.win ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200">
                            <Check className="h-3.5 w-3.5" /> WIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-200">
                            <X className="h-3.5 w-3.5" /> LOSE
                          </span>
                        )}
                        <span className="text-xs text-white/55">
                          {fmtMoney(r.stakeValue)} ₽ → {fmtMoney(r.targetValue)} ₽ • {r.chancePct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="truncate text-xs text-white/55">
                        {r.win ? (reward ? `Reward: ${reward.name}` : "Reward") : target ? `Target: ${target.name}` : "Target"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-white/55">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="font-mono text-[11px]">{r.id.slice(-6)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
