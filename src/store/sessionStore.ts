"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SignedState } from "@/lib/game/types";
import { apiGet, apiPost } from "@/lib/client/api";

type SessionState = {
  token: string | null;
  state: SignedState | null;
  hydrated: boolean;

  bootstrap: () => Promise<void>;
  refill: () => Promise<void>;
  applyUpdate: (payload: { token?: string; state?: SignedState }) => void;
  setHydrated: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      state: null,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      bootstrap: async () => {
        const current = get().token;
        if (current) {
          try {
            const res = await apiGet<{ profile: unknown }>("/api/profile", current);
            if (res.token) set({ token: res.token });
            // profile doesn't return full state; keep as-is
            return;
          } catch {
            // fallthrough to full bootstrap
          }
        }

        const res = await apiGet<{ token: string; state: SignedState }>("/api/bootstrap", null);
        set({ token: res.token ?? null, state: res.state ?? null });
      },

      refill: async () => {
        const { token } = get();
        const res = await apiPost<{ success: boolean; token: string; state: SignedState }>("/api/refill", token);
        set({ token: res.token ?? null, state: res.state ?? null });
      },

      applyUpdate: (payload) => {
        if (payload.token) set({ token: payload.token });
        if (payload.state) set({ state: payload.state });
      },
    }),
    {
      name: "skinforge_session_v1",
      partialize: (s) => ({ token: s.token, state: s.state }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
