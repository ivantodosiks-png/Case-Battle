import { getItem } from "@/lib/game/catalog";
import { rarityColor } from "@/lib/game/rarity";
import type { LootCase } from "@/lib/game/types";

export function CaseContents({ lootCase }: { lootCase: LootCase }) {
  const items = lootCase.itemIds
    .map((id) => getItem(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.price - a.price);

  return (
    <div className="rounded-2xl bg-panel/50 p-4 ring-1 ring-white/10">
      <div className="mb-3 text-sm font-semibold text-white">Содержимое</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => {
          const color = rarityColor[it.rarity];
          return (
            <div
              key={it.id}
              className="relative overflow-hidden rounded-2xl bg-card/55 p-3 ring-1 ring-white/10"
              style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 0 28px ${color}22` }}
            >
              <div
                className="h-20 rounded-xl ring-1 ring-white/10"
                style={{ background: `linear-gradient(135deg, ${it.image.from}, ${it.image.to})`, border: `1px solid ${color}55` }}
              />
              <div className="mt-2 truncate text-xs font-semibold text-white">{it.name}</div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <div className="capitalize text-white/60">{it.rarity}</div>
                <div className="font-semibold text-white">{it.price} ₽</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
