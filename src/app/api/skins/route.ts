import { NextResponse } from "next/server";
import { SKINS } from "@/lib/skins";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ skins: SKINS });
}

