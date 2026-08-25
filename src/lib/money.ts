export const CURRENCY = "ETB";
export function fmt(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  return `${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${CURRENCY}`;
}
export function num(n: any): number {
  if (n === null || n === undefined) return 0;
  if (typeof n === "number") return n;
  return parseFloat(n.toString()) || 0;
}