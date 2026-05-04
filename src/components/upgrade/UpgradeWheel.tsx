"use client";

import { motion } from "framer-motion";

export function UpgradeWheel({
  chance,
  spinning,
  result,
}: {
  chance: number;
  spinning: boolean;
  result: "win" | "lose" | null;
}) {
  const winDeg = (chance / 100) * 360;

  return (
    <div className="relative grid place-items-center">
      <div className="absolute -top-2 h-0 w-0 border-x-[10px] border-x-transparent border-b-[16px] border-b-accent drop-shadow-[0_0_20px_rgba(255,106,26,0.6)]" />

      <motion.div
        className="relative h-56 w-56 rounded-full ring-1 ring-white/10"
        style={{
          background: `conic-gradient(#22c55e ${winDeg}deg, rgba(255,255,255,0.08) 0deg)`,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 0 48px rgba(255,106,26,0.12)",
        }}
        animate={
          spinning
            ? { rotate: 360 * 6 + 42 }
            : result === "win"
              ? { rotate: winDeg / 2 }
              : { rotate: winDeg + 40 }
        }
        transition={spinning ? { duration: 4.2, ease: [0.12, 0.92, 0.18, 1] } : { duration: 0.6 }}
      >
        <div className="absolute inset-4 rounded-full bg-[#0b1020]/70 ring-1 ring-white/10" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xs text-white/55">Chance</div>
            <div className="font-display text-2xl text-white">{Math.round(chance)}%</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

