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

export async function POST(req: Request) {
  let body: UpgradeRequest;
  try {
    body = (await req.json()) as UpgradeRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const targetSkinId = body.targetSkinId;
  const targetSkin = targetSkinId ? SKIN_BY_ID.get(targetSkinId) : undefined;
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
    const skin = skinId ? SKIN_BY_ID.get(skinId) : undefined;
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

  return NextResponse.json(res);
}
