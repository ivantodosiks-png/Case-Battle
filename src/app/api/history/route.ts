import { NextRequest, NextResponse } from "next/server";
import { requireState } from "@/lib/server/apiState";

export async function GET(req: NextRequest) {
  const { state, token } = await requireState(req);
  return NextResponse.json({ token, history: state.history });
}

