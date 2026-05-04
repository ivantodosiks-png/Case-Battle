import { NextRequest, NextResponse } from "next/server";
import { requireState, withNewToken } from "@/lib/server/apiState";

export async function POST(req: NextRequest) {
  const { state } = await requireState(req);

  const updated = {
    ...state,
    balance: 1000,
  };

  const { token, state: newState } = withNewToken(updated);
  return NextResponse.json({ success: true, token, state: newState });
}

