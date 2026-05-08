"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Skin } from "@/lib/types";
import { fmtMoney } from "@/lib/money";

function wearShort(wear: string) {
  const w = wear.toLowerCase();
  if (w.includes("factory new")) return "FN";
  if (w.includes("minimal wear")) return "MW";
  if (w.includes("field-tested")) return "FT";
  if (w.includes("well-worn")) return "WW";
  if (w.includes("battle-scarred")) return "BS";
  return wear.slice(0, 2).toUpperCase();
}

export function SkinTile({
  skin,
  selected,
  disabled,
  onClick,
}: {
  skin: Skin;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl text-left ring-soft transition",
        "bg-white/6 hover:bg-white/8",
        "disabled:pointer-events-none disabled:opacity-40",
        selected && "ring-2 ring-violet-400/60 bg-white/8"
      )}
      disabled={disabled}
      style={{
        boxShadow: selected ? `0 0 55px ${skin.gradient.from}22` : undefined,
      }}
    >
      <div
        className="absolute -inset-20 opacity-55 blur-2xl"
        style={{
          background: `radial-gradient(circle at 18% 20%, ${skin.gradient.from}55, transparent 55%),
            radial-gradient(circle at 85% 70%, ${skin.gradient.to}44, transparent 52%)`,
        }}
      />
      <div className="relative">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/20">
          <Image src={skin.image} alt={skin.name} fill className="object-contain p-1.5 opacity-95" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold text-white/90">{skin.name}</div>
              <div className="mt-0.5 text-[9px] font-semibold text-white/75">{wearShort(skin.wear)}</div>
            </div>
            <div className="shrink-0 rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold text-white/92 ring-soft">
              {fmtMoney(skin.price)} ₽
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
