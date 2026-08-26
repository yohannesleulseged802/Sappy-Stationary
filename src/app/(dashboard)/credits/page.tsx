"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import KpiTile from "@/components/ui/KpiTile";
import Icon from "@/components/ui/Icon";
import CreditForm from "@/components/modules/CreditForm";
import MasterGate from "@/components/ui/MasterGate";
import { fmt, num } from "@/lib/money";
import { toLocalDate } from "@/lib/utils";

export default function CreditsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [gate, setGate] = useState<null | { id: string }>(null);
  const [customer, setCustomer] = useState("all");

  async function load() {
    const r = await fetch("/api/credits");
    const j = await r.json();
    setCredits(j);
  }
  useEffect(() => { load(); }, []);

  const customers = Array.from(new Set(credits.map(c => c.customer))).sort() as string[];
  const filtered = customer === "all" ? credits : credits.filter(c => c.customer === customer);
  const outstanding = credits.filter(c => !c.paid).reduce((s, c) => s + num(c.amount), 0);

  async function markPaid(id: string) {
    await fetch(`/api/credits/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: true }) });
    load();
  }

  async function exportPdf() {
    const url = customer === "all" ? "/api/credits?export=pdf" : `/api/credits?export=pdf&customer=${encodeURIComponent(customer)}`;
    const r = await fetch(url);
    const b = await r.blob();
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = customer === "all" ? "credit-book.pdf" : `credit-${customer.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.click();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Credit book</h1>
          <p className="text-emerald-900/60">Track who owes you.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPdf}
            className="rounded-xl border border-emerald-600 text-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-50 transition flex items-center gap-2">
            <Icon name="download" className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => setShowForm(true)}
            className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 transition flex items-center gap-2">
            <Icon name="plus" className="w-4 h-4" /> Add credit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <KpiTile label="Outstanding" value={fmt(outstanding)} icon="cash" />
        <KpiTile label="Open entries" value={credits.filter(c => !c.paid).length} icon="clock" />
        <KpiTile label="Paid" value={credits.filter(c => c.paid).length} icon="check" />
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-emerald-900/60">Customer:</span>
          <select value={customer} onChange={e => setCustomer(e.target.value)}
            className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm">
            <option value="all">All customers</option>
            {customers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {customer !== "all" && (
            <span className="text-xs text-emerald-900/50">
              Export PDF now downloads only {customer}'s statement.
            </span>
          )}
        </div>

        <div className="divide-y divide-emerald-100">
          {filtered.length === 0 && <p className="py-6 text-center text-emerald-900/50">No credits here.</p>}
          {filtered.map(c => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.customer}</div>
                <div className="text-xs text-emerald-900/50 truncate">{c.item} • {toLocalDate(c.date)} • by {c.userName}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-display text-lg">{fmt(c.amount)}</div>
                {c.paid ? (
                  <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-1">Paid</span>
                ) : (
                  <>
                    <button onClick={() => markPaid(c.id)} className="text-xs rounded-full bg-emerald-600 text-white px-3 py-1 hover:bg-emerald-700 transition">Mark paid</button>
                    <button onClick={() => setGate({ id: c.id })} className="text-xs rounded-full bg-red-50 text-red-600 px-3 py-1 hover:bg-red-100 transition">Delete</button>
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
          onOk={async () => { await fetch(`/api/credits/${gate.id}`, { method: "DELETE" }); setGate(null); load(); }}
          onCancel={() => setGate(null)}
        />
      )}
    </div>
  );
}