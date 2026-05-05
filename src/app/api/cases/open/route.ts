import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireState, withNewToken } from "@/lib/server/apiState";
import { getCase } from "@/lib/game/catalog";
import { openCaseResult } from "@/lib/server/gameLogic";

export async function POST(req: NextRequest) {
  const { state } = await requireState(req);
  const body = (await req.json().catch(() => null)) as { caseId?: string } | null;
  const caseId = body?.caseId;
  if (!caseId) return NextResponse.json({ success: false, error: "caseId required" }, { status: 400 });

  const now = Date.now();
  if (state.caseLockUntil && now < state.caseLockUntil) {
    return NextResponse.json({ success: false, error: "Case opening in progress" }, { status: 429 });
  }

  const lootCase = getCase(caseId);
  if (!lootCase) return NextResponse.json({ success: false, error: "Unknown case" }, { status: 404 });

  if (state.balance < lootCase.price) {
    return NextResponse.json({ success: false, error: "Insufficient balance", balance: state.balance }, { status: 400 });
  }

  const { item, spinData } = openCaseResult(caseId);

  const newBalance = state.balance - lootCase.price;

  const updated = {
    ...state,
    caseLockUntil: now + 5000,
    balance: newBalance,
    inventoryItemIds: [item.id, ...state.inventoryItemIds],
    history: [
      {
        id: crypto.randomUUID(),
        type: "case_open" as const,
        createdAt: now,
        betValue: lootCase.price,
        resultValue: item.price,
        won: true,
        cashback: 0,
        meta: { caseId, itemId: item.id },
      },
      ...state.history,
    ].slice(0, 100),
    liveDrops: [
      {
        id: crypto.randomUUID(),
        createdAt: now,
        itemId: item.id,
        source: "case" as const,
        caseId,
      },
      ...state.liveDrops,
    ].slice(0, 50),
    stats: {
      ...state.stats,
      casesOpened: state.stats.casesOpened + 1,
      bestDropValue: Math.max(state.stats.bestDropValue, item.price),
      totalWinningsValue: state.stats.totalWinningsValue + item.price,
    },
  };

  const { token, state: newState } = withNewToken(updated);

  return NextResponse.json({
    success: true,
    token,
    state: newState,
    item,
    balance: newState.balance,
    spinData,
  });
}
