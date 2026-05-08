import type { Rarity } from "@/lib/types";

export const RARITY_LABEL: Record<Rarity, string> = {
  consumer: "Consumer Grade",
  industrial: "Industrial Grade",
  milspec: "Mil-Spec",
  restricted: "Restricted",
  classified: "Classified",
  covert: "Covert",
  knife: "Knife / Gloves",
};

export const RARITY_COLOR: Record<Rarity, { from: string; to: string; glow: string }> = {
  consumer: { from: "#9ca3af", to: "#6b7280", glow: "rgba(156, 163, 175, 0.22)" },
  industrial: { from: "#60a5fa", to: "#2563eb", glow: "rgba(59, 130, 246, 0.25)" },
  milspec: { from: "#3b82f6", to: "#1d4ed8", glow: "rgba(59, 130, 246, 0.28)" },
  restricted: { from: "#a855f7", to: "#7c3aed", glow: "rgba(168, 85, 247, 0.30)" },
  classified: { from: "#ec4899", to: "#db2777", glow: "rgba(236, 72, 153, 0.30)" },
  covert: { from: "#f97316", to: "#ef4444", glow: "rgba(249, 115, 22, 0.32)" },
  knife: { from: "#fbbf24", to: "#f97316", glow: "rgba(251, 191, 36, 0.32)" },
};

