import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireState, withNewToken } from "@/lib/server/apiState";
import { getItem } from "@/lib/game/catalog";

type Body = { itemId?: string };

export async function POST(req: NextRequest) {
  const { state } = await requireState(req);
  const body = (await req.json().catch(() => null)) as Body | null;
  const itemId = body?.itemId;
  if (!itemId) return NextResponse.json({ success: false, error: "itemId required" }, { status: 400 });

  const idx = state.inventoryItemIds.indexOf(itemId);
  if (idx < 0) return NextResponse.json({ success: false, error: "Item not in inventory" }, { status: 400 });

  const item = getItem(itemId);
  if (!item) return NextResponse.json({ success: false, error: "Unknown item" }, { status: 404 });

  const nextInv = state.inventoryItemIds.slice();
  nextInv.splice(idx, 1);

  const now = Date.now();
  const updated = {
    ...state,
    balance: state.balance + item.price,
    inventoryItemIds: nextInv,
    history: [
      {
        id: crypto.randomUUID(),
        type: "case_open" as const,
        createdAt: now,
        betValue: 0,
        resultValue: item.price,
        won: true,
        cashback: item.price,
        meta: { action: "sell", itemId },
      },
      ...state.history,
    ].slice(0, 100),
  };

  const { token, state: newState } = withNewToken(updated);
  return NextResponse.json({ success: true, token, state: newState, balance: newState.balance });
}

