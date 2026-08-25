"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import ExpenseForm from "@/components/modules/ExpenseForm";
import MasterGate from "@/components/ui/MasterGate";
import { fmt, num } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";

const EXPENSE_CATS = ["Fuel", "Food", "Logistics", "Rent", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<"day"|"week"|"month"|"year">("month");
  const [gate, setGate] = useState<null | { id: string }>(null);

  async function load() {
    const r = await fetch("/api/expenses"); const j = await r.json(); setExpenses(j);
  }
  useEffect(() => { load(); }, []);

  function inPeriod(d: string) {
    const date = new Date(d);
    const now = new Date();
    if (period === "day") return date.toDateString() === now.toDateString();
    if (period === "week") {
      const wk = new Date(now); wk.setDate(now.getDate() - 7);
      return date >= wk;
    }
    if (period === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return date.getFullYear() === now.getFullYear();
  }

  const filtered = expenses.filter(e => inPeriod(e.date));
  const total = filtered.reduce((s, e) => s + num(e.amount), 0);

  const byCat: Record<string, number> = {};
  filtered.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + num(e.amount); });
  const maxCat = Math.max(1, ...Object.values(byCat));

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl">Expenses</h1>
          <p className="text-emerald-800/70">Track your running costs.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => {
            const r = await fetch("/api/expenses?export=pdf"); const b = await r.blob();
            const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "expenses.pdf"; a.click();
          }} className="rounded-xl border border-emerald-600 text-emerald-700 px-4 py-2 font-semibold">Export PDF</button>
          <button onClick={() => setShowForm(true)} className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold">+ Add expense</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["day","week","month","year"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-full text-sm ${period===p ? "bg-emerald-600 text-white" : "bg-white border border-emerald-200 text-emerald-700"}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiTile label={`${period} total`} value={fmt(total)} />
        <KpiTile label="Entries" value={filtered.length} />
        <KpiTile label="Top category" value={Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—"} />
        <KpiTile label="Categories used" value={Object.keys(byCat).length} />
      </div>

      <Card title="By category">
        <div className="space-y-2">
          {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([c, v]) => (
            <div key={c}>
              <div className="flex justify-between text-sm mb-1"><span>{c}</span><span className="font-display">{fmt(v)}</span></div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600" style={{ width: `${(v/maxCat)*100}%` }} />
              </div>
            </div>
          ))}
          {Object.keys(byCat).length === 0 && <p className="text-sm text-emerald-800/60">No expenses in this period.</p>}
        </div>
      </Card>

      <Card title="Ledger" className="mt-4">
        <div className="divide-y divide-emerald-100">
          {filtered.map(e => (
            <div key={e.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="font-medium">{e.category}{e.description ? ` • ${e.description}` : ""}</div>
                <div className="text-xs text-emerald-800/60">{toLocalDate(e.date)} • by {e.userName}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-display">{fmt(e.amount)}</div>
                <button onClick={() => setGate({ id: e.id })} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1">Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-6 text-center text-emerald-800/60">No expenses.</p>}
        </div>
      </Card>

      {showForm && <ExpenseForm categories={EXPENSE_CATS} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {gate && <MasterGate title="Delete expense" onOk={async () => { await fetch(`/api/expenses/${gate.id}`, { method: "DELETE" }); setGate(null); load(); }} onCancel={() => setGate(null)} />}
    </div>
  );
}