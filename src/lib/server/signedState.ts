import crypto from "crypto";
import type { SignedState } from "@/lib/game/types";
import { catalog } from "@/lib/game/catalog";

const DEFAULT_SECRET = "dev_only_change_me_skinforge_state_secret";

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64urlToBuf(str: string) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(b64, "base64");
}

function getSecret() {
  return process.env.STATE_SECRET ?? DEFAULT_SECRET;
}

function hmac(payloadB64: string) {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest();
}

export function signState(state: SignedState) {
  const payload = Buffer.from(JSON.stringify(state), "utf8");
  const payloadB64 = base64url(payload);
  const sigB64 = base64url(hmac(payloadB64));
  return `${payloadB64}.${sigB64}`;
}

export function verifyStateToken(token: string): SignedState | null {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const expected = hmac(payloadB64);
  const got = base64urlToBuf(sigB64);
  if (got.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(got, expected)) return null;

  try {
    const json = base64urlToBuf(payloadB64).toString("utf8");
    const parsed = JSON.parse(json) as SignedState;
    if (!parsed || parsed.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function makeInitialState(): SignedState {
  // Demo user + starting inventory.
  const inventory = catalog.items
    .slice(0, 28)
    .filter((_, idx) => idx % 2 === 0)
    .slice(0, 18)
    .map((i) => i.id);

  return {
    v: 1,
    user: {
      id: "usr_demo",
      username: "demo_player",
      avatarSeed: crypto.randomUUID(),
    },
    balance: 1000,
    inventoryItemIds: inventory,
    upgradeLockUntil: 0,
    caseLockUntil: 0,
    history: [],
    liveDrops: [],
    stats: {
      casesOpened: 0,
      upgradesPlayed: 0,
      bestDropValue: 0,
      totalWinningsValue: 0,
    },
  };
}
