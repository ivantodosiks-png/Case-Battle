import { NextResponse } from "next/server";
import { SKINS } from "@/lib/skins";
import type { Skin } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    try {
      const res = await fetch(`${url}/rest/v1/skins?select=id,name,image,rarity,wear,price,gradient_from,gradient_to&order=price.desc`, {
        headers: {
          apikey: anonKey,
          authorization: `Bearer ${anonKey}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const rows = (await res.json()) as Array<{
          id: string;
          name: string;
          image: string;
          rarity: Skin["rarity"];
          wear: string;
          price: number;
          gradient_from: string;
          gradient_to: string;
        }>;

        const skins: Skin[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          image: r.image === "demo" ? SKINS.find((s) => s.id === r.id)?.image ?? "" : r.image,
          rarity: r.rarity,
          wear: r.wear,
          price: Number(r.price),
          gradient: { from: r.gradient_from, to: r.gradient_to },
        }));

        // If some rows are still "demo" but not found locally, fall back to local list for those
        const withFallback = skins.filter((s) => s.image);
        return NextResponse.json({ skins: withFallback });
      }
    } catch {
      // fall back
    }
  }

  return NextResponse.json({ skins: SKINS });
}
