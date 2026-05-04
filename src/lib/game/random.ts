// Deterministic RNG for catalog generation (NOT used for game results).
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rnd: () => number, min: number, max: number) {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

export function pick<T>(rnd: () => number, arr: T[]) {
  return arr[Math.floor(rnd() * arr.length)];
}

