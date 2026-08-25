"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export default function KpiTile({ label, value, icon }: { label: string; value: any; icon?: string }) {
  const [shown, setShown] = useState(typeof value === "number" ? 0 : value);
  const ref = useRef<any>(null);

  useEffect(() => {
    if (typeof value !== "number") { setShown(value); return; }
    const end = value; const dur = 700; const t0 = performance.now();
    function step(t: number) {
      const p = Math.min(1, (t - t0) / dur);
      setShown(Math.round(end * p));
      if (p < 1) ref.current = requestAnimationFrame(step);
    }
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return (
    <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl shadow-soft p-4 lift">
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-emerald-500/80" />
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-900/50">{label}</div>
        {icon && <span className="text-emerald-600/80 shrink-0"><Icon name={icon} className="w-4 h-4" /></span>}
      </div>
      <div className="font-display text-2xl md:text-[26px] mt-1 count-up truncate" title={String(value)}>{shown}</div>
    </div>
  );
}