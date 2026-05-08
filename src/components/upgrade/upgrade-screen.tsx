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
    // Keep demo minimal: start with balance-only. User can still add test skins manually.
    toast.message("Demo mode", {
      description: "No Steam, no payments, no auth — just a smooth upgrader MVP.",
    });
  }, [addTestSkins]);

  return (
    <div className="min-h-screen overflow-hidden pb-6">
      <Topbar />

      <main className="mx-auto mt-4 w-full max-w-6xl px-3 sm:px-6">
        <div className="grid h-[calc(100vh-124px)] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[360px_1fr_360px]">
          <div className="order-2 flex min-h-0 flex-col gap-4 lg:order-1">
            <StakePreview />
            <InventoryPanel />
          </div>

          <div className="order-1 min-h-0 lg:order-2">
            <UpgradeWheel />
          </div>

          <div className="order-3 flex min-h-0 flex-col gap-4">
            <TargetPreview />
            <UpgradeControls />
          </div>
        </div>
      </main>
    </div>
  );
}
