"use client";

import type { SignedState } from "@/lib/game/types";

export type ApiEnvelope<T> = T & { token?: string; state?: SignedState };

export async function apiGet<T>(path: string, token: string | null): Promise<ApiEnvelope<T>> {
  const res = await fetch(path, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiEnvelope<T>;
}

export async function apiPost<T>(path: string, token: string | null, body?: unknown): Promise<ApiEnvelope<T>> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : "{}",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as ApiEnvelope<T>;
}

