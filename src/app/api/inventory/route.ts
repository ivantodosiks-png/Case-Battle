import { NextRequest, NextResponse } from "next/server";
import { requireState } from "@/lib/server/apiState";
import { getItem } from "@/lib/game/catalog";

export async function GET(req: NextRequest) {
  const { state, token } = await requireState(req);
  const items = state.inventoryItemIds.map((id) => getItem(id)).filter(Boolean);
  return NextResponse.json({ token, items });
}

