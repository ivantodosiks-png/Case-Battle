"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Skin } from "@/lib/types";
import { fmtMoney } from "@/lib/money";

export function SkinCard({
  skin,
  selected,
  onClick,
  footer,
}: {
  skin: Skin;
  selected?: boolean;
  onClick?: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl text-left ring-soft transition",
        "bg-white/6 hover:bg-white/8",
        selected && "ring-2 ring-violet-400/60 bg-white/8"
      )}
      style={{
        boxShadow: selected ? `0 0 55px ${skin.gradient.from}22` : undefined,
      }}
    >
      <div
        className="absolute -inset-24 opacity-60 blur-2xl"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${skin.gradient.from}55, transparent 55%),
            radial-gradient(circle at 80% 60%, ${skin.gradient.to}44, transparent 52%)`,
        }}
      />
      <div className="relative flex items-center gap-3 p-3">
        <div className="relative h-14 w-20 overflow-hidden rounded-xl bg-black/20 ring-soft">
          <Image src={skin.image} alt={skin.name} fill className="object-cover opacity-90" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white/92">{skin.name}</div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <div className="truncate text-xs text-white/55">{skin.wear}</div>
            <div className="shrink-0 text-xs font-semibold text-white/90">${fmtMoney(skin.price)}</div>
          </div>
          {footer ? <div className="mt-2">{footer}</div> : null}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 transition group-hover:opacity-100" />
    </motion.button>
  );
}
