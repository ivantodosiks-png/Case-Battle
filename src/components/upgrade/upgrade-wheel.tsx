"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/money";
import { SKIN_BY_ID } from "@/lib/skins";
import { sfxCashback, sfxLose, sfxPrime, sfxSpinTick, sfxWin } from "@/lib/sfx";
import { useUpgradeStore } from "@/store/use-upgrade-store";

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function normDeg(d: number) {
  const x = d % 360;
  return x < 0 ? x + 360 : x;
}

function inSector(angleDeg: number, startDeg: number, spanDeg: number) {
  const a = normDeg(angleDeg);
  const s = normDeg(startDeg);
  const e = normDeg(startDeg + spanDeg);
  if (spanDeg >= 360) return true;
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e; // wraps around 0
}

export function UpgradeWheel() {
  const bet = useUpgradeStore((s) => s.bet);
  const multiplier = useUpgradeStore((s) => s.multiplier);
  const spinning = useUpgradeStore((s) => s.spinning);
  const lastResult = useUpgradeStore((s) => s.lastResult);
  const performUpgrade = useUpgradeStore((s) => s.performUpgrade);
  const applyOutcome = useUpgradeStore((s) => s.applyOutcomeClientSide);

  const chance = useMemo(() => clamp(1 / Number(multiplier || 2), 0.05, 0.95), [multiplier]);
  const stakeValue = useMemo(() => {
    if (!bet) return 0;
    if (bet.type === "balance") return bet.amount;
    const skinId = bet.skinInstanceId.split("::")[1];
    return SKIN_BY_ID.get(skinId)?.price ?? 0;
  }, [bet]);

  const payoutValue = useMemo(() => Math.round(stakeValue * multiplier * 100) / 100, [stakeValue, multiplier]);

  const rotation = useMotionValue(0);
  const smoothRotation = useSpring(rotation, { stiffness: 120, damping: 18, mass: 0.6 });
  const animRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");

  async function spin() {
    if (!bet) {
      toast.error("Select a bet first");
      return;
    }
    await sfxPrime();

    const res = await performUpgrade();
    if (!res) {
      toast.error("Upgrade failed");
      return;
    }

    // Cancel prior animation if any
    animRef.current?.abort();
    const abort = new AbortController();
    animRef.current = abort;

    setPhase("spinning");

    // Variable "physics" (visual only)
    const baseTurns = 5 + Math.floor(Math.random() * 5); // 5..9
    const profile = Math.random();
    const durationMs = profile < 0.2 ? 2600 : profile < 0.65 ? 3900 : 5200;
    const extraTurns = profile < 0.1 ? 10 : 0; // sometimes hyper fast

    const win = res.win;
    const winSpan = 360 * chance;
    const loseSpan = 360 - winSpan;
    const winStart = 180 - winSpan / 2; // centered at bottom (CSS rotate: 0=top, 180=bottom)

    const localT = win ? res.roll / chance : (res.roll - chance) / (1 - chance);
    const offsetWithin = (win ? winSpan : loseSpan) * clamp(localT, 0, 1);
    // IMPORTANT: do NOT modulo the losing angles — it can wrap into the win sector visually.
    let finalAngle = win ? winStart + offsetWithin : winStart + winSpan + offsetWithin;
    // Safety: ensure visual sector always matches the precomputed win/lose.
    const landsInWin = inSector(finalAngle, winStart, winSpan);
    if (win && !landsInWin) finalAngle = winStart + winSpan * 0.5;
    if (!win && landsInWin) finalAngle = winStart + winSpan + loseSpan * 0.5;

    const target = rotation.get() + (baseTurns + extraTurns) * 360 + finalAngle;

    // tick sfx while spinning (approx)
    const t0 = performance.now();
    let lastTick = 0;
    const tick = (t: number) => {
      if (abort.signal.aborted) return;
      const p = clamp((t - t0) / durationMs, 0, 1);
      const current = rotation.get();
      rotation.set(current + (target - current) * 0.12 * (1 - p * 0.25));
      if (t - lastTick > (profile < 0.2 ? 34 : 55)) {
        sfxSpinTick(0.5 + 0.8 * p);
        lastTick = t;
      }
      if (p < 1) requestAnimationFrame(tick);
      else {
        rotation.set(target);
        setPhase("result");
        // Apply outcome after a tiny suspense delay
        window.setTimeout(() => {
          applyOutcome(res);
          if (res.win) {
            sfxWin();
            toast.success("WIN", { description: res.rewardSkinId ? "Skin added to inventory." : "Balance credited." });
          } else {
            sfxLose();
            if (res.cashbackValue > 0) {
              window.setTimeout(() => sfxCashback(), 180);
              toast("Cashback", { description: `+$${fmtMoney(res.cashbackValue)}` });
            } else toast.error("LOSE");
          }
          setPhase("idle");
        }, 450);
      }
    };
    rotation.set(rotation.get() + 12);
    requestAnimationFrame(tick);
  }

  const centerStatus = phase === "result" && lastResult ? (lastResult.win ? "WIN" : "LOSE") : "UPGRADE";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Upgrade</CardTitle>
        <div className="text-xs text-white/60">{Math.round(chance * 100)}%</div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px] md:items-center">
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="relative aspect-square w-full">
              <div className="absolute inset-0 rounded-[999px] bg-gradient-to-b from-white/10 to-white/5 ring-soft shadow-[0_0_80px_rgba(139,92,246,0.12)]" />

              <LiquidDial chance={chance} />

              {/* Pointer */}
              <motion.div className="absolute inset-0" style={{ rotate: smoothRotation }}>
                {/* Pointer: thin neon triangle (no square) */}
                <div className="absolute left-1/2 top-1 -translate-x-1/2">
                  <div
                    className="h-0 w-0"
                    style={{
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderBottom: "18px solid rgba(255,255,255,0.85)",
                      filter: "drop-shadow(0 0 14px rgba(139,92,246,0.45))",
                    }}
                  />
                  <div className="mx-auto -mt-2 h-3 w-3 rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.25)]" />
                </div>
              </motion.div>

              {/* Center */}
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative grid h-[54%] w-[54%] place-items-center rounded-full bg-black/25 ring-soft shadow-glow">
                  <div className="pointer-events-none absolute -inset-10 bg-gradient-to-b from-violet-500/12 via-transparent to-transparent blur-2xl" />
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-[0.25em] text-white/50">{centerStatus}</div>
                    <div className="mt-1 text-3xl font-semibold text-white/92">
                      x{Number(multiplier).toFixed(multiplier === 2 || multiplier === 5 || multiplier === 10 ? 0 : 2)}
                    </div>
                    <div className="mt-2 text-[11px] text-white/55">
                      ${fmtMoney(stakeValue)} → ${fmtMoney(payoutValue)}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {lastResult ? (
                      <motion.div
                        key={lastResult.seed}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 flex items-center justify-center gap-2 text-xs"
                      >
                        {lastResult.win ? (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/12 px-2 py-1 text-emerald-200 ring-soft">
                            <Check className="h-3.5 w-3.5" /> WIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-rose-500/12 px-2 py-1 text-rose-200 ring-soft">
                            <X className="h-3.5 w-3.5" /> LOSE
                          </span>
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={spin}
              disabled={!bet || spinning || phase !== "idle"}
            >
              {spinning || phase !== "idle" ? "Spinning..." : "UPGRADE"}
            </Button>
            <div className="rounded-2xl bg-white/5 p-3 text-xs text-white/60 ring-soft">
              Potential: <span className="font-semibold text-white/85">${fmtMoney(payoutValue)}</span>
              {lastResult?.win
                ? lastResult.rewardSkinId
                  ? " • Reward: skin"
                  : " • Reward: balance"
                : " • Lose → cashback 1–5%"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LiquidDial({ chance }: { chance: number }) {
  const fill = clamp(chance, 0.05, 0.95);
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

            {/* Waves */}
            <motion.path
              d="M0,60 C15,56 35,64 50,60 C65,56 85,64 100,60 L100,120 L0,120 Z"
              fill="rgba(255,255,255,0.14)"
              style={{ translateY: `${(y - 60) * 0.65}px` }}
              animate={{ x: [0, -16, 0] }}
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
              opacity={0.7}
            />
            <motion.path
              d="M0,60 C18,64 30,56 50,60 C70,64 82,56 100,60 L100,120 L0,120 Z"
              fill="rgba(255,255,255,0.10)"
              style={{ translateY: `${(y - 60) * 0.6}px` }}
              animate={{ x: [0, 22, 0] }}
              transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
              opacity={0.6}
            />

            {/* Rim glow */}
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.4" />
          </g>
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
    </div>
  );
}
