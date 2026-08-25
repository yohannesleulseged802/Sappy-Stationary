"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import CreditForm from "@/components/modules/CreditForm";
import { fmt, num } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";
import MasterGate from "@/components/ui/MasterGate";

export default function CreditsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [gate, setGate] = useState<null | { action: "delete"; id: string }>(null);

  async function load() {
    const r = await fetch("/api/credits"); const j = await r.json(); setCredits(j);
  }
  useEffect(() => { load(); }, []);

  const outstanding = credits.filter(c => !c.paid).reduce((s, c) => s + num(c.amount), 0);

  async function markPaid(id: string) {
    await fetch(`/api/credits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: true }) });
    load();
  }

  async function doDelete(id: string) {
    await fetch(`/api/credits/${id}`, { method: "DELETE" });
    setGate(null); load();
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl">Credit book</h1>
          <p className="text-emerald-800/70">Track who owes you.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => {
            const r = await fetch("/api/credits?export=pdf"); const b = await r.blob();
            const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "credits.pdf"; a.click();
          }} className="rounded-xl border border-emerald-600 text-emerald-700 px-4 py-2 font-semibold">Export PDF</button>
          <button onClick={() => setShowForm(true)} className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold">+ Add credit</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <KpiTile label="Outstanding" value={fmt(outstanding)} />
        <KpiTile label="Open entries" value={credits.filter(c => !c.paid).length} />
        <KpiTile label="Paid" value={credits.filter(c => c.paid).length} />
      </div>

      <Card>
        <div className="divide-y divide-emerald-100">
          {credits.length === 0 && <p className="py-6 text-center text-emerald-800/60">No credits yet.</p>}
          {credits.map(c => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.customer}</div>
                <div className="text-xs text-emerald-800/60 truncate">{c.item} • {toLocalDate(c.date)} • by {c.userName}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-display text-lg">{fmt(c.amount)}</div>
                {c.paid ? (
                  <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-1">Paid</span>
                ) : (
                  <>
                    <button onClick={() => markPaid(c.id)} className="text-xs rounded-full bg-emerald-600 text-white px-3 py-1">Mark paid</button>
                    <button onClick={() => setGate({ action: "delete", id: c.id })} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showForm && <CreditForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {gate && (
        <MasterGate
          title="Delete credit"
          onOk={async () => doDelete(gate.id)}
          onCancel={() => setGate(null)}
        />
      )}
    </div>
  );
}