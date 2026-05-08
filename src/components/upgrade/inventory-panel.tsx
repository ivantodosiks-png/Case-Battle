"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { SkinCard } from "@/components/upgrade/skin-card";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function InventoryPanel() {
  const balance = useUpgradeStore((s) => s.balance);
  const inventory = useUpgradeStore((s) => s.inventory);
  const bet = useUpgradeStore((s) => s.bet);
  const selectBetSkin = useUpgradeStore((s) => s.selectBetSkin);
  const setBetBalance = useUpgradeStore((s) => s.setBetBalance);

  const selectedInstanceId = bet?.type === "skin" ? bet.skinInstanceId : null;
  const betAmount = bet?.type === "balance" ? bet.amount : 25;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Balance</CardTitle>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            useUpgradeStore.setState((s) => ({
              balance: Math.round((s.balance + 50) * 100) / 100,
            }))
          }
          title="Add demo balance"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 ring-soft">
          <div className="flex items-center gap-2 text-white/70">
            <Wallet className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Balance</span>
          </div>
          <div className="text-sm font-semibold text-white/92">
            $<Counter value={balance} format={fmtMoney} />
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white/5 p-3 ring-soft">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>Bet amount</span>
            <span className="font-semibold text-white/85">${fmtMoney(betAmount)}</span>
          </div>
          <input
            type="range"
            min={1}
            max={500}
            step={1}
            value={betAmount}
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

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-white/50">My items</div>
          <div className="text-xs text-white/50">{inventory.length}/36</div>
        </div>

        <div className="mt-3 max-h-[42vh] space-y-2 overflow-auto pr-1">
          <AnimatePresence initial={false}>
            {inventory.map((it) => {
              const skin = SKIN_BY_ID.get(it.skinId);
              if (!skin) return null;
              const selected = selectedInstanceId === it.instanceId;
              return (
                <motion.div
                  key={it.instanceId}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                >
                  <SkinCard skin={skin} selected={selected} onClick={() => selectBetSkin(it.instanceId)} />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {inventory.length === 0 ? (
            <div className="rounded-2xl bg-white/4 p-4 text-sm text-white/60 ring-soft">
              No items (demo). Upgrade with balance only.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
