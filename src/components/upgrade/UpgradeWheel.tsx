"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

function normDeg(deg: number) {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

export function UpgradeWheel({
  chance,
  spinning,
  stopRoll,
}: {
  chance: number;
  spinning: boolean;
  stopRoll: number | null; // 0..100 from backend roll
}) {
  const winDeg = (Math.max(0, Math.min(100, chance)) / 100) * 360;

  // Filled segment starts from bottom (270deg) and goes clockwise.
  const fillStyle = useMemo(() => {
    return {
      background: `conic-gradient(from 270deg, #22c55e 0deg ${winDeg}deg, rgba(255,255,255,0.08) 0deg)`,
      boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 0 48px rgba(255,106,26,0.12)",
    } as const;
  }, [winDeg]);

  const stopDeg = stopRoll == null ? 0 : (Math.max(0, Math.min(100, stopRoll)) / 100) * 360;

  // Arrow points outwards from the center, orbiting around the wheel.
  // We rotate the arrow container so the arrow lands at the roll angle, with bottom as 0 reference.
  // Default arrow points to top (0deg). Bottom is 180deg.
  const targetRotation = normDeg(180 + stopDeg);

  return (
    <div className="relative grid place-items-center">
      <div className="relative h-56 w-56">
        <div className="absolute inset-0 rounded-full ring-1 ring-white/10" style={fillStyle} />
        <div className="absolute inset-4 rounded-full bg-[#0b1020]/70 ring-1 ring-white/10" />

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xs text-white/55">Шанс</div>
            <div className="font-display text-2xl text-white">{Math.round(chance)}%</div>
          </div>
        </div>

        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={spinning ? { rotate: 360 * 6 + targetRotation } : { rotate: targetRotation }}
          transition={spinning ? { duration: 4.2, ease: [0.12, 0.92, 0.18, 1] } : { duration: 0.2 }}
        >
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute -top-[112px] left-1/2 h-[112px] w-[2px] -translate-x-1/2 bg-accent/70 shadow-[0_0_24px_rgba(255,106,26,0.35)]" />
            <div className="absolute -top-[120px] left-1/2 -translate-x-1/2">
              <div className="h-0 w-0 border-x-[9px] border-x-transparent border-b-[14px] border-b-accent drop-shadow-[0_0_18px_rgba(255,106,26,0.65)]" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
