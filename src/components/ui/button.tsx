"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition will-change-transform",
        "disabled:opacity-50 disabled:pointer-events-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-0",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        variant === "primary" &&
          "bg-gradient-to-b from-violet-500/90 to-violet-700/90 text-white shadow-glow hover:shadow-glowStrong active:scale-[0.99]",
        variant === "secondary" &&
          "bg-white/8 text-white ring-soft hover:bg-white/10 active:scale-[0.99]",
        variant === "ghost" &&
          "bg-transparent text-white/80 hover:bg-white/6 hover:text-white active:scale-[0.99]",
        variant === "danger" &&
          "bg-gradient-to-b from-rose-500/85 to-rose-700/85 text-white shadow-[0_0_45px_rgba(244,63,94,0.25)] hover:shadow-[0_0_70px_rgba(244,63,94,0.30)] active:scale-[0.99]",
        className
      )}
      {...props}
    />
  );
}

