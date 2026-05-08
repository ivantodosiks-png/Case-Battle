import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          950: "#06070b",
          900: "#0a0c12",
          850: "#0f121b",
        },
        panel: {
          900: "rgba(255,255,255,0.06)",
          800: "rgba(255,255,255,0.08)",
          700: "rgba(255,255,255,0.10)"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(139, 92, 246, 0.22)",
        glowStrong: "0 0 70px rgba(139, 92, 246, 0.33)",
      },
      backgroundImage: {
        noise:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, rgba(0,0,0,0) 0)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(50%)" },
        }
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      }
    },
  },
  plugins: [],
} satisfies Config;

