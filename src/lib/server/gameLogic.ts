import crypto from "crypto";
import { catalog, getDropTable, getItem } from "@/lib/game/catalog";

function secureFloat01() {
  // crypto.randomInt is cryptographically secure.
  // Convert int -> [0,1).
  const max = 1_000_000;
  return crypto.randomInt(0, max) / max;
}

export function weightedPick(entries: { itemId: string; weight: number }[]) {
  // Weighted random: sum weights, roll in [0,total), find bucket.
  const total = entries.reduce((acc, e) => acc + Math.max(0, e.weight), 0);
  if (total <= 0) throw new Error("Invalid drop table");

  const roll = crypto.randomInt(0, total);
  let acc = 0;
  for (const e of entries) {
    acc += Math.max(0, e.weight);
    if (roll < acc) return { itemId: e.itemId, roll, total };
  }

  return { itemId: entries[entries.length - 1]!.itemId, roll, total };
}

export function openCaseResult(caseId: string) {
  const table = getDropTable(caseId);
  if (!table) throw new Error("Unknown case");
  const picked = weightedPick(table.entries);
  const item = getItem(picked.itemId);
  if (!item) throw new Error("Unknown item");
  return {
    item,
    spinData: {
      roll: picked.roll,
      total: picked.total,
      // front can build a nice roulette using this
      entries: table.entries,
      winItemId: item.id,
    },
  };
}

export function clampChance(chance: number) {
  return Math.max(1, Math.min(95, chance));
}

type UpgradeMode =
  | { kind: "mult"; value: 2 | 5 | 10 }
  | { kind: "chance"; value: 75 | 50 | 30 };

function isUpgradeMode(x: unknown): x is UpgradeMode {
  if (!x || typeof x !== "object") return false;
  const m = x as { kind?: unknown; value?: unknown };
  if (m.kind === "mult") return m.value === 2 || m.value === 5 || m.value === 10;
  if (m.kind === "chance") return m.value === 75 || m.value === 50 || m.value === 30;
  return false;
}

function modeToChanceAndTargetValue(betValue: number, mode: UpgradeMode) {
  if (mode.kind === "mult") {
    const multiplier = mode.value;
    const chance = clampChance(100 / multiplier);
    const targetValue = Math.max(betValue + 1, Math.round(betValue * multiplier));
    return { chance, multiplier, targetValue };
  }

  // fixed chance: target value derived from chance
  const chance = clampChance(mode.value);
  const multiplier = 100 / chance;
  const targetValue = Math.max(betValue + 1, Math.round(betValue / (chance / 100)));
  return { chance, multiplier, targetValue };
}

export function pickUpgradeTargetByValue(targetValue: number, betValue: number) {
  // Prefer items that are >= betValue+1, then choose closest to targetValue (ties -> cheaper).
  // If nothing above bet exists, fallback to the most expensive item.
  const pool = catalog.items.filter((it) => it.price > betValue);
  const list = pool.length ? pool : catalog.items.slice();

  let best = list[0]!;
  let bestDist = Math.abs(best.price - targetValue);
  for (const it of list) {
    const dist = Math.abs(it.price - targetValue);
    if (dist < bestDist || (dist === bestDist && it.price < best.price)) {
      best = it;
      bestDist = dist;
    }
  }
  return best;
}

export function quoteUpgradeResult(betItemId: string, modeRaw: unknown) {
  if (!isUpgradeMode(modeRaw)) throw new Error("Invalid mode");
  const betItem = getItem(betItemId);
  if (!betItem) throw new Error("Unknown bet item");

  const betValue = betItem.price;
  const { chance, multiplier, targetValue } = modeToChanceAndTargetValue(betValue, modeRaw);
  const targetItem = pickUpgradeTargetByValue(targetValue, betValue);

  // expected cashback range (1..5%)
  const cashbackMin = Math.floor((betValue * 1) / 100);
  const cashbackMax = Math.floor((betValue * 5) / 100);

  return {
    betItem,
    betValue,
    mode: modeRaw,
    chance,
    multiplier,
    targetItem,
    targetValue: targetItem.price,
    cashbackRange: { minPercent: 1, maxPercent: 5, minAmount: cashbackMin, maxAmount: cashbackMax },
  };
}

export function quoteUpgradeResultWithTarget(betItemId: string, modeRaw: unknown, targetItemId: string | null) {
  const quoted = quoteUpgradeResult(betItemId, modeRaw);
  if (!targetItemId) return quoted;

  const target = getItem(targetItemId);
  if (!target) throw new Error("Unknown target");

  // Tolerance: allow ~±20% from expected target for chosen mode.
  const expected = quoted.targetValue;
  const tol = 0.2;
  const min = Math.floor(expected * (1 - tol));
  const max = Math.ceil(expected * (1 + tol));
  if (target.price < min || target.price > max) throw new Error("Target not allowed for mode");

  return {
    ...quoted,
    targetItem: target,
    targetValue: target.price,
    // keep chance from mode (not from target), but expose actual multiplier for UI
    multiplier: target.price / Math.max(1, quoted.betValue),
  };
}

export function playUpgradeResult(betItemId: string, modeRaw: unknown, targetItemId: string | null) {
  const quoted = quoteUpgradeResultWithTarget(betItemId, modeRaw, targetItemId);

  // Secure random roll in [0,100)
  const roll = secureFloat01() * 100;
  const won = roll <= quoted.chance;

  let cashbackPercent = 0;
  let cashbackAmount = 0;
  if (!won) {
    cashbackPercent = crypto.randomInt(1, 6);
    cashbackAmount = Math.floor((quoted.betValue * cashbackPercent) / 100);
  }

  return {
    ...quoted,
    won,
    roll,
    cashback: { percent: cashbackPercent, amount: cashbackAmount },
  };
}
