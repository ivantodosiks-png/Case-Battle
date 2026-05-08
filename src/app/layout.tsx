import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Upgrade — CaseBattle (Demo)",
  description: "Modern CS:GO-style upgrader demo (no auth, no payments).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-violet-500/30 selection:text-white">
        <div className="noise min-h-screen">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}

