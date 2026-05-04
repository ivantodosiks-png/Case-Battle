import { NextRequest, NextResponse } from "next/server";
import { requireState } from "@/lib/server/apiState";
import { getItem } from "@/lib/game/catalog";

export async function GET(req: NextRequest) {
  const { state, token } = await requireState(req);
  const liveDrops = state.liveDrops
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 30)
    .map((d) => ({ ...d, item: getItem(d.itemId) }));

  return NextResponse.json({ token, liveDrops });
}

