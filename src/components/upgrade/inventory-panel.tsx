"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Wallet } from "lucide-react";
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
  const addTestSkins = useUpgradeStore((s) => s.addTestSkins);
  const selectBetSkin = useUpgradeStore((s) => s.selectBetSkin);

  const selectedInstanceId = bet?.type === "skin" ? bet.skinInstanceId : null;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Your items</CardTitle>
        <Button size="sm" variant="secondary" onClick={() => addTestSkins(6)} title="Add test skins">
          <Plus className="h-4 w-4" />
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

        {bet?.type === "balance" ? (
          <div className="mt-3 rounded-2xl bg-white/4 p-3 text-xs text-white/60 ring-soft">
            Balance stake is set on the right panel.
          </div>
        ) : (
          <div className="mt-3 rounded-2xl bg-white/4 p-3 text-xs text-white/60 ring-soft">
            Click an item below to set it as your stake, or switch to balance bet from the right panel.
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-white/50">Select stake</div>
          <div className="text-xs text-white/50">{inventory.length}/36</div>
        </div>

        <div className="mt-3 space-y-2">
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
              Inventory is empty. Add some test skins.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
