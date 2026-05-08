import { NextResponse } from "next/server";
import type { UpgradeRequest, UpgradeResponse } from "@/lib/types";
import { SKIN_BY_ID, pickRewardSkinId } from "@/lib/skins";
import { secureRandomFloat01, secureRandomInt } from "@/lib/random";

export const runtime = "nodejs";

function chanceFromMultiplier(multiplier: number) {
  return 1 / multiplier;
}

export async function POST(req: Request) {
  let body: UpgradeRequest;
  try {
    body = (await req.json()) as UpgradeRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const multiplier = Number(body.multiplier);
  if (!Number.isFinite(multiplier) || multiplier < 1.05 || multiplier > 20) {
    return NextResponse.json({ ok: false, error: "Invalid multiplier" }, { status: 400 });
  }

  const chance = Math.min(0.95, Math.max(0.05, chanceFromMultiplier(multiplier)));

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

  const roll = secureRandomFloat01();
  const win = roll < chance;

  const payoutValue = Math.round(stakeValue * multiplier * 100) / 100;
  const cashbackPct = win ? 0 : secureRandomInt(1, 5) / 100;
  const cashbackValue = Math.round(stakeValue * cashbackPct * 100) / 100;

  const rewardSkinId = win ? pickRewardSkinId(payoutValue, secureRandomFloat01) : undefined;
  const seed = `${Date.now()}-${secureRandomInt(100000, 999999)}`;

  const res: UpgradeResponse = {
    ok: true,
    seed,
    chance,
    multiplier,
    roll,
    win,
    stakeValue,
    payoutValue,
    cashbackValue,
    rewardSkinId,
  };

  return NextResponse.json(res);
}
