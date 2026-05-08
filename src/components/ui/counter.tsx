"use client";

import { useEffect, useMemo, useState } from "react";

export function Counter({
  value,
  format,
  durationMs = 650,
}: {
  value: number;
  durationMs?: number;
  format?: (v: number) => string;
}) {
  const fmt = useMemo(() => format ?? ((v: number) => v.toFixed(2)), [format]);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let raf = 0;
    const from = display;
    const to = value;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return <span>{fmt(display)}</span>;
}

