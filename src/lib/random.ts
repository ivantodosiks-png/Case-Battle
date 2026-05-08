export function secureRandomFloat01(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 2 ** 32;
}

export function secureRandomInt(minInclusive: number, maxInclusive: number): number {
  if (maxInclusive < minInclusive) throw new Error("Invalid range");
  const span = maxInclusive - minInclusive + 1;
  const max = 0xffffffff;
  const limit = max - (max % span);
  const arr = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(arr);
    const x = arr[0];
    if (x < limit) return minInclusive + (x % span);
  }
}

