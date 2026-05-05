"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { LiveDropSidebar } from "./LiveDropSidebar";
import { useSessionStore } from "@/store/sessionStore";
import { Flame, PackageOpen, Sparkles, User, History, Backpack, Gift, Shield } from "lucide-react";

const nav = [
  { href: "/", label: "Кейсы", icon: PackageOpen },
  { href: "/upgrade", label: "Апгрейд", icon: Sparkles },
  { href: "/contracts", label: "Контракты", icon: Shield },
  { href: "/giveaways", label: "Розыгрыши", icon: Gift },
  { href: "/inventory", label: "Инвентарь", icon: Backpack },
  { href: "/history", label: "История", icon: History },
  { href: "/profile", label: "Профиль", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hydrated, bootstrap, state, refill } = useSessionStore();

  useEffect(() => {
    if (!hydrated) return;
    if (state) return;
    bootstrap();
  }, [hydrated, state, bootstrap]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="group flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 ring-soft">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm tracking-widest text-white">SKINFORGE</div>
              <div className="text-xs text-white/55">cases · upgrader</div>
            </div>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {nav.slice(0, 4).map((n) => {
              const active = pathname === n.href;
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn("relative rounded-xl px-3 py-2 text-sm text-white/70 transition hover:text-white", active && "text-white")}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </span>
                  {active ? <motion.div layoutId="nav" className="absolute inset-0 -z-10 rounded-xl bg-white/5 ring-1 ring-white/10" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-xl bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 sm:block">
              <span className="text-white/60">Баланс</span> <span className="font-semibold text-white">{state?.balance ?? 0} ₽</span>
            </div>
            <button onClick={() => refill()} className="btn btn-primary">
              Обновить до 1000 ₽
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="glass rounded-2xl ring-soft">
            <LiveDropSidebar />
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/35 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-5 gap-1 px-2 py-2">
          {nav.slice(0, 5).map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-white/65",
                  active && "bg-white/5 text-white ring-1 ring-white/10",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}

