"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SKIN_BY_ID } from "@/lib/skins";
import { fmtMoney } from "@/lib/money";
import { sfxLose, sfxPrime, sfxSpinTick, sfxWin } from "@/lib/sfx";
import { useUpgradeStore } from "@/store/use-upgrade-store";

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function UpgradeWheel() {
  const bet = useUpgradeStore((s) => s.bet);
  const targetSkinId = useUpgradeStore((s) => s.targetSkinId);
  const spinning = useUpgradeStore((s) => s.spinning);
  const performUpgrade = useUpgradeStore((s) => s.performUpgrade);
  const applyOutcome = useUpgradeStore((s) => s.applyOutcomeClientSide);

  const stakeValue = useMemo(() => {
    if (!bet) return 0;
    if (bet.type === "balance") return bet.amount;
    const skinId = bet.skinInstanceId.split("::")[1];
    return SKIN_BY_ID.get(skinId)?.price ?? 0;
  }, [bet]);
  const targetValue = useMemo(() => {
    if (!targetSkinId) return 0;
    return SKIN_BY_ID.get(targetSkinId)?.price ?? 0;
  }, [targetSkinId]);

  const chancePct = useMemo(() => {
    if (!stakeValue || !targetValue) return 0;
    return Math.round(clamp((stakeValue / targetValue) * 100, 0, 100) * 100) / 100;
  }, [stakeValue, targetValue]);
  const chance = useMemo(() => clamp(chancePct / 100, 0, 1), [chancePct]);

  const rotation = useMotionValue(0);
  const smoothRotation = useSpring(rotation, { stiffness: 95, damping: 22, mass: 0.7 });
  const animRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");

  async function spin() {
    if (!bet) {
      toast.error("Сначала выберите текущий скин/ставку");
      return;
    }
    if (!targetSkinId) {
      toast.error("Выберите скин для апгрейда");
      return;
    }
    await sfxPrime();

    const res = await performUpgrade();
    if (!res) {
      toast.error("Ошибка апгрейда");
      return;
    }

    animRef.current?.abort();
    const abort = new AbortController();
    animRef.current = abort;

    setPhase("spinning");

    // Visual-only spin profile: chance/result stays real, but the animation pacing is randomized.
    const profile = Math.random();
    const isFast = profile < 0.45;
    const baseTurns = isFast ? 5 + Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 7); // 5..9 or 8..14
    const durationMs = isFast
      ? 3600 + Math.floor(Math.random() * 2200) // 3.6..5.8s
      : 8200 + Math.floor(Math.random() * 5200); // 8.2..13.4s
    const easePower = isFast ? 2.6 + Math.random() * 1.2 : 3.4 + Math.random() * 1.4;

    const resChance = clamp(res.chancePct / 100, 0, 1);
    const winSpan = 360 * resChance;
    const loseSpan = 360 - winSpan;
    const winStart = 180 - winSpan / 2; // win sector centered at bottom

    // Pointer always lands clearly inside the filled (win) or empty (lose) sector,
    // but the stop position is randomized within that sector (not always top/bottom).
    const margin = 10; // degrees away from the sector edges
    const pickInSpan = (start: number, span: number) => {
      const safe = Math.max(0, span - margin * 2);
      if (safe <= 1) return start + span * 0.5;
      return start + margin + Math.random() * safe;
    };
    const finalAngle = res.win ? pickInSpan(winStart, winSpan) : pickInSpan(winStart + winSpan, loseSpan);

    const target = rotation.get() + baseTurns * 360 + finalAngle;

    const t0 = performance.now();
    const startAngle = rotation.get();
    let lastAngle = startAngle;
    let lastTickAngle = startAngle;
    let nextTickStep = 10 + Math.random() * 10; // degrees between ticks
    const tick = (t: number) => {
      if (abort.signal.aborted) return;
      const p = clamp((t - t0) / durationMs, 0, 1);
      const easeOut = 1 - Math.pow(1 - p, easePower);
      const angle = startAngle + (target - startAngle) * easeOut;
      rotation.set(angle);

      const delta = Math.abs(angle - lastAngle);
      lastAngle = angle;

      // Tick sound follows speed (more frequent when faster, rarer when slower).
      if (Math.abs(angle - lastTickAngle) >= nextTickStep) {
        const speed = clamp(delta / 9, 0, 1); // heuristic for frame-to-frame speed
        sfxSpinTick(0.15 + 0.85 * speed);
        lastTickAngle = angle;
        nextTickStep = 10 + Math.random() * 10;
      }

      if (p < 1) requestAnimationFrame(tick);
      else {
        rotation.set(target);
        setPhase("result");
        window.setTimeout(() => {
          applyOutcome(res);
          if (res.win) {
            sfxWin();
            toast.success("Апгрейд успешный");
          } else {
            sfxLose();
            toast.error("Апгрейд не удался");
          }
          setPhase("idle");
        }, 450);
      }
    };

    requestAnimationFrame(tick);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Апгрейд</CardTitle>
        <div className="text-xs text-white/60">{chancePct.toFixed(2)}%</div>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative mx-auto w-full max-w-[860px]">
          <div className="relative aspect-square w-full">
            <div className="absolute inset-0 rounded-[999px] bg-gradient-to-b from-white/10 to-white/5 ring-soft shadow-[0_0_90px_rgba(139,92,246,0.14)]" />

            <LiquidDial chance={chance} />

            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="rounded-full bg-black/10 px-4 py-2 text-center ring-soft backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.32em] text-white/50">Шанс</div>
                <div className="mt-0.5 text-3xl font-semibold text-white/92 tabular-nums">{chancePct.toFixed(2)}%</div>
              </div>
            </div>

            <motion.div className="absolute inset-0" style={{ rotate: smoothRotation }}>
              <div className="absolute left-1/2 top-1 -translate-x-1/2">
                <div
                  className="h-0 w-0"
                  style={{
                    borderLeft: "10px solid transparent",
                    borderRight: "10px solid transparent",
                    borderBottom: "18px solid rgba(255,255,255,0.88)",
                    filter: "drop-shadow(0 0 16px rgba(139,92,246,0.55))",
                  }}
                />
                <div className="mx-auto -mt-2 h-3 w-3 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.25)]" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-4 w-full max-w-[860px]">
          <Button size="lg" className="w-full" onClick={spin} disabled={!bet || !targetSkinId || spinning || phase !== "idle"}>
            {spinning || phase !== "idle" ? "Крутим..." : "АПГРЕЙД"}
          </Button>
          <div className="mt-2 text-center text-xs text-white/50">
            {stakeValue ? `Ставка ${fmtMoney(stakeValue)} ₽` : ""}
            {targetValue ? ` → Цель ${fmtMoney(targetValue)} ₽` : ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LiquidDial({ chance }: { chance: number }) {
  const fill = clamp(chance, 0, 1);
  const y = 100 - fill * 100;
  return (
    <div className="absolute inset-3 overflow-hidden rounded-[999px] ring-soft bg-black/25">
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <clipPath id="clipCircle">
              <circle cx="50" cy="50" r="48" />
            </clipPath>
            <linearGradient id="water" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(16,185,129,0.55)" />
              <stop offset="0.45" stopColor="rgba(59,130,246,0.35)" />
              <stop offset="1" stopColor="rgba(139,92,246,0.40)" />
            </linearGradient>
          </defs>

          <g clipPath="url(#clipCircle)">
            <rect x="0" y="0" width="100" height="100" fill="rgba(255,255,255,0.03)" />
            <rect x="0" y={y} width="100" height="100" fill="url(#water)" opacity="0.95" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.4" />
          </g>
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
    </div>
  );
}
