import { NextResponse } from "next/server";
import { catalog } from "@/lib/game/catalog";

export function GET() {
  return NextResponse.json({ items: catalog.items });
}

