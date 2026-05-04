import { NextRequest } from "next/server";
import { makeInitialState, signState, verifyStateToken } from "./signedState";
import type { SignedState } from "@/lib/game/types";

export function readStateToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
  const headerToken = req.headers.get("x-state-token");
  if (headerToken) return headerToken.trim();
  return null;
}

export async function requireState(req: NextRequest): Promise<{ state: SignedState; token: string }> {
  const token = readStateToken(req);
  if (!token) {
    const initial = makeInitialState();
    return { state: initial, token: signState(initial) };
  }

  const state = verifyStateToken(token);
  if (!state) {
    const initial = makeInitialState();
    return { state: initial, token: signState(initial) };
  }

  return { state, token };
}

export function withNewToken(state: SignedState) {
  return { state, token: signState(state) };
}

