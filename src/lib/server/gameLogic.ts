import crypto from "crypto";
import { getDropTable, getItem } from "@/lib/game/catalog";

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

export function playUpgradeResult(betItemIds: string[], targetItemId: string) {
  const target = getItem(targetItemId);
  if (!target) throw new Error("Unknown target");

  const betItems = betItemIds.map((id) => {
    const it = getItem(id);
    if (!it) throw new Error("Unknown bet item");
    return it;
  });

  const betValue = betItems.reduce((acc, it) => acc + it.price, 0);
  const targetValue = target.price;

  if (betValue <= 0) throw new Error("Invalid bet");
  if (betValue >= targetValue) throw new Error("Bet must be cheaper than target");

  // chance = bet / target * 100
  const rawChance = (betValue / targetValue) * 100;
  const chance = clampChance(rawChance);

  // Secure random roll in [0,100)
  const roll = secureFloat01() * 100;
  const won = roll <= chance;

  let cashbackPercent = 0;
  let cashbackAmount = 0;
  if (!won) {
    // Cashback percent random 1..5
    cashbackPercent = crypto.randomInt(1, 6);
    cashbackAmount = Math.floor((betValue * cashbackPercent) / 100);
  }

  return {
    won,
    chance,
    roll,
    betValue,
    targetItem: target,
    cashback: { percent: cashbackPercent, amount: cashbackAmount },
  };
}

