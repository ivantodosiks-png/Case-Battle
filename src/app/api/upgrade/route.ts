import { NextResponse } from "next/server";
import type { UpgradeRequest, UpgradeResponse } from "@/lib/types";
import { SKIN_BY_ID } from "@/lib/skins";
import { secureRandomInt } from "@/lib/random";

export const runtime = "nodejs";

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function fetchSkinFromSupabase(skinId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const res = await fetch(`${url}/rest/v1/skins?id=eq.${encodeURIComponent(skinId)}&select=id,price`, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ id: string; price: number }>;
    const row = rows[0];
    if (!row || row.id !== skinId) return null;
    return { id: row.id, price: Number(row.price) };
  } catch {
    return null;
  }
}

async function logDropToSupabase(input: {
  userId: string;
  seed: string;
  stakeValue: number;
  targetSkinId: string;
  chancePct: number;
  roll: number;
  rewardSkinId: string;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return;

  // Supabase PostgREST insert
  await fetch(`${url}/rest/v1/user_drops`, {
    method: "POST",
    headers: {
      apikey: serviceRole,
      authorization: `Bearer ${serviceRole}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: input.userId,
      seed: input.seed,
      stake_value: input.stakeValue,
      target_skin_id: input.targetSkinId,
      chance_pct: input.chancePct,
      roll: input.roll,
      reward_skin_id: input.rewardSkinId,
    }),
  });
}

export async function POST(req: Request) {
  let body: UpgradeRequest;
  try {
    body = (await req.json()) as UpgradeRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const targetSkinId = body.targetSkinId;
  const targetSkin =
    (targetSkinId ? SKIN_BY_ID.get(targetSkinId) : undefined) ?? (targetSkinId ? await fetchSkinFromSupabase(targetSkinId) : null);
  if (!targetSkin) {
    return NextResponse.json({ ok: false, error: "Unknown target skin" }, { status: 400 });
  }

  let stakeValue = 0;
  if (body.betType === "balance") {
    const amount = Number(body.betAmount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid betAmount" }, { status: 400 });
    }
    stakeValue = Math.round(amount * 100) / 100;
  } else if (body.betType === "skin") {
    const instanceId = body.betSkinInstanceId;
    if (!instanceId) {
      return NextResponse.json({ ok: false, error: "Missing betSkinInstanceId" }, { status: 400 });
    }
    // Demo: instanceId is client-side. We accept a skin id suffix: "<instance>::<skinId>"
    const skinId = instanceId.split("::")[1];
    const skin = (skinId ? SKIN_BY_ID.get(skinId) : undefined) ?? (skinId ? await fetchSkinFromSupabase(skinId) : null);
    if (!skin) {
      return NextResponse.json({ ok: false, error: "Unknown skin" }, { status: 400 });
    }
    stakeValue = skin.price;
  } else {
    return NextResponse.json({ ok: false, error: "Invalid betType" }, { status: 400 });
  }

  const targetValue = targetSkin.price;
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid target price" }, { status: 400 });
  }
  if (targetValue <= stakeValue) {
    return NextResponse.json({ ok: false, error: "Target must be more expensive" }, { status: 400 });
  }

  const chancePct = round2(clamp((stakeValue / targetValue) * 100, 0, 100));
  const roll = round2(secureRandomInt(0, 10_000) / 100); // 0..100 (2 decimals)
  const win = roll <= chancePct;
  const rewardSkinId = win ? targetSkinId : undefined;
  const seed = `${Date.now()}-${secureRandomInt(100000, 999999)}`;

  const res: UpgradeResponse = {
    ok: true,
    seed,
    chancePct,
    roll,
    win,
    stakeValue,
    targetValue,
    rewardSkinId,
  };

  if (win && rewardSkinId && body.userId) {
    try {
      await logDropToSupabase({
        userId: body.userId,
        seed,
        stakeValue,
        targetSkinId,
        chancePct,
        roll,
        rewardSkinId,
      });
    } catch {
      // best-effort: never fail the upgrade because of logging
    }
  }

  return NextResponse.json(res);
}
