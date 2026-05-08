"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/upgrade/topbar";
import { InventoryPanel } from "@/components/upgrade/inventory-panel";
import { UpgradeWheel } from "@/components/upgrade/upgrade-wheel";
import { UpgradeControls } from "@/components/upgrade/upgrade-controls";
import { RecentFeed } from "@/components/upgrade/recent-feed";
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_320px]">
          <div className="order-2 lg:order-1">
            <InventoryPanel />
          </div>
          <div className="order-1 lg:order-2">
            <UpgradeWheel />
            <div className="mt-4">
              <RecentFeed />
            </div>
          </div>
          <div className="order-3">
            <UpgradeControls />
          </div>
        </div>
      </main>
    </div>
  );
}

