import { NextResponse } from "next/server";
import { catalog } from "@/lib/game/catalog";
import { makeInitialState, signState } from "@/lib/server/signedState";

export function GET() {
  const state = makeInitialState();
  const token = signState(state);

  return NextResponse.json({
    token,
    state,
    catalog: {
      cases: catalog.cases,
      items: catalog.items,
    },
  });
}

