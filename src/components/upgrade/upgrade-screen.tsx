"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/upgrade/topbar";
import { InventoryPanel } from "@/components/upgrade/inventory-panel";
import { UpgradeWheel } from "@/components/upgrade/upgrade-wheel";
import { UpgradeControls } from "@/components/upgrade/upgrade-controls";
import { StakePreview } from "@/components/upgrade/stake-preview";
import { TargetPreview } from "@/components/upgrade/target-preview";
import { useUpgradeStore } from "@/store/use-upgrade-store";

export function UpgradeScreen() {
  const addTestSkins = useUpgradeStore((s) => s.addTestSkins);

  useEffect(() => {
    // First run: give users a few items so the UI feels alive.
    const inv = useUpgradeStore.getState().inventory;
    if (inv.length === 0) addTestSkins(8);
    toast.message("Demo mode", {
      description: "No Steam, no payments, no auth — just a smooth upgrader MVP.",
    });
  }, [addTestSkins]);

  return (
    <div className="min-h-screen pb-10">
      <Topbar />

      <main className="mx-auto mt-4 w-full max-w-6xl px-3 sm:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="order-2 lg:order-1">
            <StakePreview />
          </div>
          <div className="order-1 lg:order-2">
            <UpgradeWheel />
          </div>
          <div className="order-3">
            <TargetPreview />
          </div>

          <div className="order-4">
            <InventoryPanel />
          </div>
          <div className="order-5 lg:col-span-2">
            <UpgradeControls />
          </div>
        </div>
      </main>
    </div>
  );
}
