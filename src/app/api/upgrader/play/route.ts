import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireState, withNewToken } from "@/lib/server/apiState";
import { getItem } from "@/lib/game/catalog";
import { playUpgradeResult } from "@/lib/server/gameLogic";

type UpgradeMode =
  | { kind: "mult"; value: 2 | 5 | 10 }
  | { kind: "chance"; value: 75 | 50 | 30 };

type Body = { betItemId?: string; targetItemId?: string | null; mode?: UpgradeMode };

export async function POST(req: NextRequest) {
  const { state } = await requireState(req);
  const body = (await req.json().catch(() => null)) as Body | null;

  const betItemId = body?.betItemId;
  const targetItemId = body?.targetItemId ?? null;
  const mode = body?.mode;
  if (!betItemId) return NextResponse.json({ success: false, error: "betItemId required" }, { status: 400 });
  if (!mode) return NextResponse.json({ success: false, error: "mode required" }, { status: 400 });

  if (state.upgradeLockUntil && Date.now() < state.upgradeLockUntil) {
    return NextResponse.json({ success: false, error: "Upgrade in progress" }, { status: 429 });
  }

  if (!state.inventoryItemIds.includes(betItemId)) {
    return NextResponse.json({ success: false, error: "Item not in inventory" }, { status: 400 });
  }

  const betItem = getItem(betItemId);
  if (!betItem) return NextResponse.json({ success: false, error: "Unknown bet item" }, { status: 404 });

  const result = playUpgradeResult(betItemId, mode, targetItemId);
  const now = Date.now();

  const inventoryAfterLoss = state.inventoryItemIds.filter((id) => id !== betItemId);

  const updated = {
    ...state,
    upgradeLockUntil: now + 4500,
    balance: state.balance + (result.won ? 0 : result.cashback.amount),
    inventoryItemIds: result.won ? [result.targetItem.id, ...inventoryAfterLoss] : inventoryAfterLoss,
    history: [
      {
        id: crypto.randomUUID(),
        type: "upgrade" as const,
        createdAt: now,
        betValue: betItem.price,
        resultValue: result.targetItem.price,
        won: result.won,
        cashback: result.cashback.amount,
        meta: {
          chance: result.chance,
          roll: result.roll,
          betItemId,
          mode,
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
    betItem,
    cashback: result.cashback,
    balance: newState.balance,
  });
}
