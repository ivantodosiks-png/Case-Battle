import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireState, withNewToken } from "@/lib/server/apiState";
import { getItem } from "@/lib/game/catalog";
import { playUpgradeResult } from "@/lib/server/gameLogic";

type Body = { selectedItemIds?: string[]; targetItemId?: string };

export async function POST(req: NextRequest) {
  const { state } = await requireState(req);
  const body = (await req.json().catch(() => null)) as Body | null;

  const selected = body?.selectedItemIds ?? [];
  const targetId = body?.targetItemId;
  if (!targetId) return NextResponse.json({ success: false, error: "targetItemId required" }, { status: 400 });
  if (!Array.isArray(selected) || selected.length === 0) {
    return NextResponse.json({ success: false, error: "selectedItemIds required" }, { status: 400 });
  }
  if (selected.length > 6) return NextResponse.json({ success: false, error: "Max 6 items" }, { status: 400 });

  const uniq = Array.from(new Set(selected));
  if (uniq.length !== selected.length) return NextResponse.json({ success: false, error: "Duplicate items" }, { status: 400 });

  const hasAll = uniq.every((id) => state.inventoryItemIds.includes(id));
  if (!hasAll) return NextResponse.json({ success: false, error: "Some items not in inventory" }, { status: 400 });

  const targetItem = getItem(targetId);
  if (!targetItem) return NextResponse.json({ success: false, error: "Unknown target" }, { status: 404 });

  // Prevent "bet more expensive than target" (as required)
  const betValue = uniq.map((id) => getItem(id)!).reduce((acc, it) => acc + it.price, 0);
  if (betValue >= targetItem.price) {
    return NextResponse.json({ success: false, error: "Bet must be cheaper than target" }, { status: 400 });
  }

  const result = playUpgradeResult(uniq, targetId);
  const now = Date.now();

  const inventoryAfterLoss = state.inventoryItemIds.filter((id) => !uniq.includes(id));

  const updated = {
    ...state,
    balance: state.balance + (result.won ? 0 : result.cashback.amount),
    inventoryItemIds: result.won ? [result.targetItem.id, ...inventoryAfterLoss] : inventoryAfterLoss,
    history: [
      {
        id: crypto.randomUUID(),
        type: "upgrade" as const,
        createdAt: now,
        betValue: result.betValue,
        resultValue: result.targetItem.price,
        won: result.won,
        cashback: result.cashback.amount,
        meta: {
          chance: result.chance,
          roll: result.roll,
          selectedItemIds: uniq,
          targetItemId: result.targetItem.id,
          cashbackPercent: result.cashback.percent,
        },
      },
      ...state.history,
    ].slice(0, 100),
    liveDrops: result.won
      ? [
          {
            id: crypto.randomUUID(),
            createdAt: now,
            itemId: result.targetItem.id,
            source: "upgrade" as const,
          },
          ...state.liveDrops,
        ].slice(0, 50)
      : state.liveDrops,
    stats: {
      ...state.stats,
      upgradesPlayed: state.stats.upgradesPlayed + 1,
      bestDropValue: Math.max(state.stats.bestDropValue, result.won ? result.targetItem.price : state.stats.bestDropValue),
      totalWinningsValue: state.stats.totalWinningsValue + (result.won ? result.targetItem.price : 0),
    },
  };

  const { token, state: newState } = withNewToken(updated);

  return NextResponse.json({
    success: true,
    token,
    state: newState,
    won: result.won,
    chance: result.chance,
    roll: result.roll,
    targetItem: result.targetItem,
    lostItems: uniq.map((id) => getItem(id)).filter(Boolean),
    cashback: result.cashback,
    balance: newState.balance,
  });
}
