"use client";
import { toLocalDate, toLocalTime } from "@/lib/utils";
export default function ActivityTimeline({ items }: { items: any[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-emerald-200" />
      <div className="space-y-3">
        {items.map(a => (
          <div key={a.id} className="relative pl-10">
            <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
            <div className="bg-white/80 rounded-xl p-3 shadow-soft">
              <div className="font-medium">{a.action.replace("_", " ")}</div>
              <div className="text-xs text-emerald-800/60">{a.details} • by {a.userName}</div>
              <div className="text-xs text-emerald-800/60 mt-1">{toLocalDate(a.createdAt)} {toLocalTime(a.createdAt)}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="pl-10 py-6 text-emerald-800/60">No activity yet.</p>}
      </div>
    </div>
  );
}