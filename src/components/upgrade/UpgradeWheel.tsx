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
      background: `conic-gradient(from 270deg, rgba(255,122,24,0.95) 0deg ${winDeg}deg, rgba(255,255,255,0.08) 0deg)`,
      boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 0 64px rgba(255,122,24,0.14)",
    } as const;
  }, [winDeg]);

  const stopDeg = stopRoll == null ? 0 : (Math.max(0, Math.min(100, stopRoll)) / 100) * 360;

  // We rotate the wheel itself; indicator stays fixed at the top.
  // Roll angle is measured from bottom, clockwise -> bring it to top via -(180 + stopDeg).
  const targetRotation = -normDeg(180 + stopDeg);

  return (
    <div className="relative grid place-items-center">
      <div className="relative h-56 w-56">
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2">
          <div className="h-0 w-0 border-x-[10px] border-x-transparent border-b-[16px] border-b-accent drop-shadow-[0_0_22px_rgba(255,122,24,0.75)]" />
        </div>

        <motion.div
          className="absolute inset-0 rounded-full"
          initial={false}
          animate={spinning ? { rotate: 360 * 7 + targetRotation } : { rotate: targetRotation }}
          transition={spinning ? { duration: 4.2, ease: [0.12, 0.92, 0.18, 1] } : { duration: 0.2 }}
        >
          <div className="absolute inset-0 rounded-full ring-1 ring-white/10" style={fillStyle} />
          <div className="absolute inset-0 rounded-full [mask-image:radial-gradient(circle_at_center,transparent_55%,black_56%)] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_55%)]" />
          <div className="absolute inset-2 rounded-full ring-1 ring-white/5" />
          <div className="absolute inset-0 rounded-full [mask-image:radial-gradient(circle_at_center,transparent_60%,black_61%)] bg-[conic-gradient(from_0deg,rgba(255,255,255,0.0)_0deg,rgba(255,255,255,0.10)_6deg,rgba(255,255,255,0.0)_12deg)] opacity-80" />
        </motion.div>

        <div className="absolute inset-4 rounded-full bg-black/35 ring-1 ring-white/10" />

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xs text-white/55">ШАНС</div>
            <div className="font-display text-2xl text-white">{Math.round(chance)}%</div>
          </div>
        </div>

      </div>
    </div>
  );
}
