# CaseBattle Upgrade (Demo MVP)

Modern CS:GO-style **Upgrade** demo built with **Next.js (App Router)**, **TypeScript**, **Tailwind**, **Framer Motion**, **Zustand**.

## Run

PowerShell on some systems blocks `npm.ps1`, so use `npm.cmd`:

- Install: `npm install`
- Dev: `npm.cmd run dev`
- Build: `npm.cmd run build`
- Start: `npm.cmd run start`

## Notes

- No Steam API, no auth, no payments.
- Win/lose is computed server-side in `src/app/api/upgrade/route.ts` using Web Crypto RNG.
- Inventory/balance are client-side demo state (persisted in localStorage).

