import { NextResponse } from "next/server";
import { catalog } from "@/lib/game/catalog";

export function GET() {
  const cases = catalog.cases.map((c) => ({
    ...c,
    itemsCount: c.itemIds.length,
  }));
  return NextResponse.json({ cases });
}

