export function fmtMoney(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

