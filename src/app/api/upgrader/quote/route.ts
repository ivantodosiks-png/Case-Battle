import { NextRequest, NextResponse } from "next/server";
import { requireState } from "@/lib/server/apiState";
import { quoteUpgradeResult } from "@/lib/server/gameLogic";

type UpgradeMode =
  | { kind: "mult"; value: 2 | 5 | 10 }
  | { kind: "chance"; value: 75 | 50 | 30 };

type Body = { betItemId?: string; mode?: UpgradeMode };

export async function POST(req: NextRequest) {
  const { state, token } = await requireState(req);
  const body = (await req.json().catch(() => null)) as Body | null;

  const betItemId = body?.betItemId;
  const mode = body?.mode;
  if (!betItemId) return NextResponse.json({ success: false, error: "betItemId required", token }, { status: 400 });
  if (!mode) return NextResponse.json({ success: false, error: "mode required", token }, { status: 400 });

  if (!state.inventoryItemIds.includes(betItemId)) {
    return NextResponse.json({ success: false, error: "Item not in inventory", token }, { status: 400 });
  }

  try {
    const quoted = quoteUpgradeResult(betItemId, mode);
    return NextResponse.json({
      success: true,
      token,
      betItem: quoted.betItem,
      targetItem: quoted.targetItem,
      chance: quoted.chance,
      multiplier: quoted.multiplier,
      cashbackRange: quoted.cashbackRange,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid quote", token }, { status: 400 });
  }
}
