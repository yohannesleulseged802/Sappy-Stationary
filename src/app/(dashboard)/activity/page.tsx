"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import MasterGate from "@/components/ui/MasterGate";
import { toLocalDate } from "@/lib/utils";

const RANGES = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

export default function ActivityPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "staff";
  const [acts, setActs] = useState<any[]>([]);
  const [range, setRange] = useState("all");
  const [user, setUser] = useState("all");
  const [sort, setSort] = useState("newest");
  const [yearend, setYearend] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/activity");
    const j = await r.json();
    setActs(Array.isArray(j) ? j : []);
  }
  useEffect(() => { load(); }, []);

  const users = Array.from(new Set(acts.map(a => a.userName || a.user?.name || "Unknown"))).sort() as string[];

  const filtered = acts.filter(a => {
    const d = new Date(a.createdAt);
    if (range === "today") { const s = new Date(); s.setHours(0, 0, 0, 0); if (d < s) return false; }
    if (range === "week") { const s = new Date(); s.setDate(s.getDate() - 7); if (d < s) return false; }
    if (range === "month") { const s = new Date(); s.setMonth(s.getMonth() - 1); if (d < s) return false; }
    const un = a.userName || a.user?.name || "Unknown";
    return user === "all" || un === user;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
    if (sort === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt);
    if (sort === "user") return (a.userName || "").localeCompare(b.userName || "") || +new Date(b.createdAt) - +new Date(a.createdAt);
    if (sort === "action") return (a.action || "").localeCompare(b.action || "");
    return 0;
  });

  async function doYearEnd() {
    setBusy(true);
    const r = await fetch("/api/yearend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const j = await r.json();
    setBusy(false);
    setYearend(false);
    if (j.ok) { alert("Year closed. Sales, expenses, purchases, activity and paid credits were cleared. Inventory, open credits, users and settings are untouched."); load(); }
    else alert(j.error || "Reset failed");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Activity</h1>
          <p className="text-emerald-900/60">Every action, accountable.</p>
        </div>
        {role === "owner" && (
          <button onClick={() => setYearend(true)}
            className="rounded-xl border border-amber-500 text-amber-700 bg-amber-50 px-4 py-2 font-semibold hover:bg-amber-100 transition flex items-center gap-2">
            <Icon name="repair" className="w-4 h-4" /> Year-end reset
          </button>
        )}
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${range === r.key ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200 text-emerald-700"}`}>
              {r.label}
            </button>
          ))}
          <span className="w-px h-6 bg-emerald-100 mx-1" />
          <select value={user} onChange={e => setUser(e.target.value)} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm">
            <option value="all">All users</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="user">By user (A→Z)</option>
            <option value="action">By action (A→Z)</option>
          </select>
          <span className="text-xs text-emerald-900/50 ml-auto">{sorted.length} entries</span>
        </div>
      </Card>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState icon="clock" title="Nothing here" hint="Try a wider date range or another user." />
        ) : (
          <div className="divide-y divide-emerald-100">
            {sorted.map(a => (
              <div key={a.id} className="flex justify-between py-2.5 gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{String(a.action).replace(/_/g, " ")}</div>
                  <div className="text-xs text-emerald-900/50 truncate">{a.details} • by {a.userName || a.user?.name || "Unknown"}</div>
                </div>
                <div className="text-xs text-emerald-900/50 shrink-0">{toLocalDate(a.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {yearend && (
        <MasterGate title="Year-end reset (owner)" onOk={doYearEnd} onCancel={() => setYearend(false)} />
      )}
      {busy && <div className="fixed inset-0 z-[70] bg-black/30 grid place-items-center"><div className="bg-white rounded-xl px-6 py-4 font-semibold">Closing the year…</div></div>}
    </div>
  );
}