import { UAParser } from "ua-parser-js";

export function deviceLabel(ua: string | null): string {
  if (!ua) return "Unknown device";
  const p = new UAParser(ua);
  const b = p.getBrowser().name || "Browser";
  const o = p.getOS().name || "";
  const d = p.getDevice().type || "Desktop";
  return `${b} • ${o} (${d})`.trim();
}

export function todayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toLocalDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function toLocalTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function genSerial(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `SL-${year}-${rand}`;
}

export function genInvoice(): string {
  const y = new Date().getFullYear().toString().slice(-2);
  const m = String(new Date().getMonth() + 1).padStart(2, "0");
  const r = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}-${r}`;
}

export function genPO(): string {
  const r = Math.floor(1000 + Math.random() * 9000);
  return `PO-${r}`;
}

export function cls(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(" ");
}