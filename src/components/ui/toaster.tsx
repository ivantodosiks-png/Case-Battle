"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      richColors
      toastOptions={{
        style: {
          background: "rgba(10, 12, 18, 0.88)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(14px)",
        },
      }}
    />
  );
}

