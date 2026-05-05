import { cn } from "@/lib/cn";
import { rarityColor } from "@/lib/game/rarity";
import type { Item } from "@/lib/game/types";

export function ItemCard({
  item,
  selected,
  onSelect,
  actions,
}: {
  item: Item;
  selected?: boolean;
  onSelect?: () => void;
  actions?: React.ReactNode;
}) {
  const color = rarityColor[item.rarity];
  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl p-3 transition hover:border-white/20",
        selected && "ring-2 ring-white/25",
        onSelect && "cursor-pointer",
      )}
      onClick={onSelect}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 34px ${color}14` }}
    >
      <div
        className="h-20 rounded-xl ring-1 ring-white/10"
        style={{ background: `linear-gradient(135deg, ${item.image.from}, ${item.image.to})`, border: `1px solid ${color}55` }}
      />
      <div className="mt-2 truncate text-xs font-semibold text-white">{item.name}</div>
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <div className="capitalize text-white/60">{item.rarity}</div>
        <div className="font-semibold text-white">{item.price} ₽</div>
      </div>
      {actions ? <div className="mt-2">{actions}</div> : null}
    </div>
  );
}

